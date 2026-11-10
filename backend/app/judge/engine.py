import subprocess
import threading
import tempfile
import time
import uuid
from pathlib import Path
from dataclasses import dataclass
from app.judge.languages import LanguageRegistry


@dataclass
class Case:
    input_data: str
    expected_output: str


@dataclass
class Result:
    verdict: str
    passed: int
    total: int
    execution_time_ms: int | None = None
    memory_used_kb: int | None = None
    message: str | None = None
    case_results: list[dict] | None = None
    compile_time_ms: int | None = None
    total_processing_ms: int | None = None


def normalize_output(output: str) -> str:
    """Ignore line ending differences and trailing whitespace only."""
    normalized = output.replace("\r\n", "\n").replace("\r", "\n").rstrip()
    return "\n".join(line.rstrip() for line in normalized.split("\n"))


class DockerCppJudge:
    """Runs compiler and program inside disposable, resource-limited Docker containers."""
    def __init__(self, image: str, compilation_timeout: int = 10, workspace_root: str | None = None):
        self.image = image
        self.compilation_timeout = compilation_timeout
        self.workspace_root = workspace_root

    @staticmethod
    def _is_docker_failure(message: str) -> bool:
        lowered = message.lower()
        return any(marker in lowered for marker in (
            "cannot connect to the docker daemon", "error during connect", "error response from daemon",
            "unable to find image", "permission denied while trying to connect",
        ))

    def _run(self, workspace: Path, args: list[str], stdin: str = "", timeout: float = 10, memory_mb: int = 256, readonly: bool | None = None, image: str | None = None):
        if readonly is None:
            readonly = not any(tool in a for a in args for tool in ("g++", "gcc", "javac", "go build"))
        container_name = f"codearena-run-{uuid.uuid4().hex}"
        mount_arg = f"type=volume,source=codearena_judge_workspaces,target=/workspace,volume-subpath={workspace.name}"
        if readonly:
            mount_arg += ",readonly"

        target_image = image or getattr(self, "_active_image", self.image)
        command = [
            "docker", "run", "-i", "--name", container_name, "--rm", "--network=none",
            "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=64", "--cpus=1",
            f"--memory={memory_mb}m", "--memory-swap", f"{memory_mb}m",
            "--ulimit", "nofile=1024:1024", "--ulimit", "core=0:0",
            "--tmpfs", "/tmp:rw,exec,nosuid,size=128m,uid=10001,gid=10001", "--mount", mount_arg,
        ]
        if readonly:
            command.insert(command.index("--cap-drop=ALL"), "--read-only")

        command.extend([target_image, *args])
        start = time.monotonic()
        try:
            process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            captured = {"stdout": bytearray(), "stderr": bytearray(), "overflow": False}
            def drain(name, stream):
                while True:
                    chunk = stream.read(4096)
                    if not chunk:
                        break
                    target = captured[name]
                    if len(target) + len(chunk) > 65536:
                        target.extend(chunk[: max(0, 65537 - len(target))])
                        captured["overflow"] = True
                        try:
                            process.kill()
                        except OSError:
                            pass
                        break
                    target.extend(chunk)
            readers = [threading.Thread(target=drain, args=("stdout", process.stdout), daemon=True), threading.Thread(target=drain, args=("stderr", process.stderr), daemon=True)]
            for reader in readers:
                reader.start()
            def feed_stdin():
                try:
                    process.stdin.write(stdin.encode())
                    process.stdin.close()
                except (BrokenPipeError, OSError):
                    pass
            writer = threading.Thread(target=feed_stdin, daemon=True)
            writer.start()
            try:
                process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
                self._cleanup_container(container_name)
                return None, captured["stdout"].decode(errors="replace"), "TIME_LIMIT_EXCEEDED", int((time.monotonic()-start)*1000)
            for reader in readers:
                reader.join()
            writer.join(timeout=0.1)
            stdout = captured["stdout"].decode(errors="replace")
            stderr = captured["stderr"].decode(errors="replace")
            if captured["overflow"]:
                self._cleanup_container(container_name)
                return process.returncode, stdout, "OUTPUT_LIMIT_EXCEEDED", int((time.monotonic()-start)*1000)
            result = subprocess.CompletedProcess(command, process.returncode, stdout, stderr)
        except FileNotFoundError as exc:
            self._cleanup_container(container_name)
            if exc.filename == "docker":
                return None, "", "SYSTEM_ERROR: Docker CLI is missing in judge-worker. Rebuild the judge-worker image from backend/Dockerfile.worker.", int((time.monotonic()-start)*1000)
            return None, "", f"SYSTEM_ERROR: {exc}", int((time.monotonic()-start)*1000)
        except (OSError, subprocess.SubprocessError) as exc:
            self._cleanup_container(container_name)
            return None, "", f"SYSTEM_ERROR: {exc}", int((time.monotonic()-start)*1000)
        elapsed = int((time.monotonic() - start) * 1000)
        return result.returncode, result.stdout, result.stderr, elapsed

    @staticmethod
    def _cleanup_container(container_name: str) -> None:
        try:
            subprocess.run(["docker", "rm", "--force", container_name], capture_output=True, timeout=3, check=False)
        except (OSError, subprocess.SubprocessError):
            pass

    def evaluate(self, source: str, cases: list[Case], time_limit_ms: int, memory_limit_mb: int, output_limit_kb: int, stop_on_failure: bool = True, language: str = "cpp") -> Result:
        if not source.strip() or not cases or len(cases) > 1000:
            return Result("SYSTEM_ERROR", 0, len(cases), message="Source or trusted test suite is invalid.")
        if any(len(case.input_data.encode("utf-8")) > 1_000_000 or len(case.expected_output.encode("utf-8")) > output_limit_kb * 1024 for case in cases):
            return Result("SYSTEM_ERROR", 0, len(cases), message="A trusted test case exceeds the configured size limits.")
        if not (100 <= time_limit_ms <= 10_000 and 64 <= memory_limit_mb <= 2048 and 1 <= output_limit_kb <= 1024):
            return Result("SYSTEM_ERROR", 0, len(cases), message="Problem resource limits are outside the permitted range.")

        lang_config = LanguageRegistry.get(language)
        self._active_image = lang_config.docker_image
        eval_start = time.monotonic()
        with tempfile.TemporaryDirectory(prefix="codearena-judge-", dir=self.workspace_root) as directory:
            workspace = Path(directory)
            source_file = workspace / lang_config.source_filename
            source_file.write_text(source, encoding="utf-8")
            # The workspace needs write access for the non-root runner during compilation.
            workspace.chmod(0o777)
            source_file.chmod(0o644)

            compile_time_ms = None
            if lang_config.is_compiled:
                compile_cmd = lang_config.get_compile_command(workspace)
                if compile_cmd:
                    comp_timeout = self.compilation_timeout * 2 if lang_config.id == "java" else self.compilation_timeout
                    compile_code, compile_out, compile_err, compile_elapsed = self._run(
                        workspace,
                        compile_cmd,
                        stdin="",
                        timeout=comp_timeout,
                        memory_mb=max(memory_limit_mb, 1024),
                    )
                    compile_time_ms = compile_elapsed
                    if compile_err.startswith("SYSTEM_ERROR"):
                        return Result("SYSTEM_ERROR", 0, len(cases), message=compile_err, compile_time_ms=compile_time_ms, total_processing_ms=int((time.monotonic()-eval_start)*1000))
                    if compile_err == "TIME_LIMIT_EXCEEDED":
                        return Result("COMPILATION_ERROR", 0, len(cases), message="Compilation timed out.", compile_time_ms=compile_time_ms, total_processing_ms=int((time.monotonic()-eval_start)*1000))
                    if self._is_docker_failure(compile_err):
                        return Result("SYSTEM_ERROR", 0, len(cases), message="Docker runner is unavailable.", compile_time_ms=compile_time_ms, total_processing_ms=int((time.monotonic()-eval_start)*1000))
                    if compile_code != 0:
                        if compile_code == 137:
                            return Result("MEMORY_LIMIT_EXCEEDED", 0, len(cases), message="Compilation exceeded the memory limit.", compile_time_ms=compile_time_ms, total_processing_ms=int((time.monotonic()-eval_start)*1000))
                        return Result("COMPILATION_ERROR", 0, len(cases), message=(compile_err or compile_out)[:65536], compile_time_ms=compile_time_ms, total_processing_ms=int((time.monotonic()-eval_start)*1000))

            # Restrict workspace permissions to read-only traversal for test execution
            workspace.chmod(0o755)
            if (workspace / "ca-program").exists():
                try:
                    (workspace / "ca-program").chmod(0o755)
                except OSError:
                    pass

            # Phase 2 & 4: Execute without recompilation, measuring true execution time
            passed, max_execution_ms, results = 0, 0, []
            exec_command = lang_config.get_execute_command(workspace, time_limit_ms, memory_limit_mb)
            runner_script = (
                f"CA_START=$(date +%s%N); "
                f"{exec_command}; "
                f"CA_EXIT=$?; "
                f"CA_END=$(date +%s%N); "
                f"CA_ELAPSED=$(( (CA_END - CA_START) / 1000000 )); "
                f"echo \"__CA_TIME_MS__:${{CA_ELAPSED}}\" >&2; "
                f"exit $CA_EXIT"
            )
            effective_time_limit_s = (time_limit_ms * lang_config.time_limit_multiplier) / 1000.0
            effective_mem_mb = int(memory_limit_mb * lang_config.memory_limit_multiplier)

            for index, case in enumerate(cases, start=1):
                run_code, output, stderr, elapsed = self._run(
                    workspace,
                    ["/bin/sh", "-c", runner_script],
                    stdin=case.input_data,
                    timeout=max(effective_time_limit_s + 8, 10.0),
                    memory_mb=effective_mem_mb,
                )

                # Extract accurate in-container execution runtime if reported
                case_execution_ms = elapsed
                if "__CA_TIME_MS__:" in stderr:
                    clean_stderr = []
                    for line in stderr.splitlines():
                        if line.startswith("__CA_TIME_MS__:"):
                            try:
                                case_execution_ms = max(0, int(line.split(":", 1)[1].strip()))
                            except ValueError:
                                pass
                        else:
                            clean_stderr.append(line)
                    stderr = "\n".join(clean_stderr)

                max_execution_ms = max(max_execution_ms, case_execution_ms)
                total_proc_ms = int((time.monotonic() - eval_start) * 1000)

                if stderr.startswith("SYSTEM_ERROR"):
                    return Result("SYSTEM_ERROR", passed, len(cases), max_execution_ms, message=stderr, case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                if stderr == "TIME_LIMIT_EXCEEDED":
                    return Result("TIME_LIMIT_EXCEEDED", passed, len(cases), max_execution_ms, message=f"Test case {index} exceeded the time limit.", case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                if self._is_docker_failure(stderr):
                    return Result("SYSTEM_ERROR", passed, len(cases), max_execution_ms, message="Docker runner is unavailable.", case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                if stderr == "OUTPUT_LIMIT_EXCEEDED" or len(output.encode(errors="replace")) > output_limit_kb * 1024:
                    return Result("OUTPUT_LIMIT_EXCEEDED", passed, len(cases), max_execution_ms, message=f"Test case {index} exceeded the output limit.", case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                if run_code != 0:
                    if run_code == 124:
                        return Result("TIME_LIMIT_EXCEEDED", passed, len(cases), max_execution_ms, message=f"Test case {index} exceeded the time limit.", case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                    if run_code == 137:
                        return Result("MEMORY_LIMIT_EXCEEDED", passed, len(cases), max_execution_ms, message=f"Test case {index} exceeded the memory limit.", case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                    return Result("RUNTIME_ERROR", passed, len(cases), max_execution_ms, message=f"Program exited with code {run_code}: {stderr[:4096]}", case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                ok = normalize_output(output) == normalize_output(case.expected_output)
                results.append({"test_case": index, "passed": ok, "actual_output": output[:output_limit_kb * 1024], "execution_time_ms": case_execution_ms})
                if not ok and stop_on_failure:
                    return Result("WRONG_ANSWER", passed, len(cases), max_execution_ms, case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)
                passed += int(ok)

            total_proc_ms = int((time.monotonic() - eval_start) * 1000)
            verdict = "ACCEPTED" if passed == len(cases) else "WRONG_ANSWER"
            return Result(verdict, passed, len(cases), max_execution_ms, case_results=results, compile_time_ms=compile_time_ms, total_processing_ms=total_proc_ms)


DockerJudge = DockerCppJudge

