from app.judge.engine import Case, DockerCppJudge, normalize_output
from app.judge.worker import process_submission
import asyncio


def test_output_comparison_ignores_line_endings_and_trailing_space():
    assert normalize_output("answer  \r\nnext\t\n") == "answer\nnext"
    assert normalize_output("a b") != normalize_output("ab")
    assert normalize_output("a\nb") != normalize_output("a b")
    assert normalize_output(" answer") != normalize_output("answer")


def test_passes_multiple_cases_and_cleans_workspace(monkeypatch):
    calls = []
    def fake_run(self, workspace, args, stdin="", timeout=10, memory_mb=256):
        calls.append(workspace)
        if "g++" in args[-1] and not stdin:
            return 0, "", "", 1
        return 0, ("one\n" if stdin == "1\n" else "two\n"), "", 2
    monkeypatch.setattr(DockerCppJudge, "_run", fake_run)
    result = DockerCppJudge("runner").evaluate("int main(){}", [Case("1\n", "one"), Case("2\n", "two\n")], 1000, 128, 64)
    assert result.verdict == "ACCEPTED"
    assert result.passed == result.total == 2
    assert calls[0].exists() is False


def test_runner_workspace_is_readable_by_non_root_uid(monkeypatch, tmp_path):
    import stat

    seen = []
    def fake_run(self, workspace, args, stdin="", timeout=10, memory_mb=256):
        source = workspace / "main.cpp"
        seen.append((stat.S_IMODE(workspace.stat().st_mode), stat.S_IMODE(source.stat().st_mode)))
        if len(seen) == 1:
            return 0, "", "", 1
        return 0, "ok", "", 2

    monkeypatch.setattr(DockerCppJudge, "_run", fake_run)
    result = DockerCppJudge("runner", workspace_root=str(tmp_path)).evaluate(
        "int main(){}", [Case("", "ok")], 1000, 128, 64
    )
    assert result.verdict == "ACCEPTED"
    assert seen == [(0o777, 0o644), (0o755, 0o644)]


def test_wrong_answer_stops_on_first_failure(monkeypatch):
    calls = 0
    def fake_run(self, workspace, args, stdin="", timeout=10, memory_mb=256):
        nonlocal calls
        calls += 1
        return (0, "", "", 1) if calls == 1 else (0, "incorrect", "", 2)
    monkeypatch.setattr(DockerCppJudge, "_run", fake_run)
    result = DockerCppJudge("runner").evaluate("source", [Case("input", "expected"), Case("later", "later")], 1000, 128, 64)
    assert result.verdict == "WRONG_ANSWER"
    assert result.total == 2
    assert calls == 2


def test_run_mode_returns_each_sample_result(monkeypatch):
    calls = 0
    def fake_run(self, workspace, args, stdin="", timeout=10, memory_mb=256):
        nonlocal calls
        calls += 1
        if calls == 1:
            return 0, "", "", 1
        return 0, ("wrong" if stdin == "first" else "right"), "", 2
    monkeypatch.setattr(DockerCppJudge, "_run", fake_run)
    result = DockerCppJudge("runner").evaluate("source", [Case("first", "expected"), Case("second", "right")], 1000, 128, 64, stop_on_failure=False)
    assert result.verdict == "WRONG_ANSWER"
    assert result.passed == 1
    assert [case["passed"] for case in result.case_results] == [False, True]


def test_compilation_error_and_cleanup(monkeypatch):
    seen = []
    def fake_run(self, workspace, args, **kwargs):
        seen.append(workspace)
        return 1, "", "compiler error", 4
    monkeypatch.setattr(DockerCppJudge, "_run", fake_run)
    result = DockerCppJudge("runner").evaluate("bad source", [Case("", "")], 1000, 128, 64)
    assert result.verdict == "COMPILATION_ERROR"
    assert "compiler error" in result.message
    assert not seen[0].exists()


def test_runtime_timeout_and_output_limit(monkeypatch):
    outcomes = iter([(0, "", "", 1), (None, "partial", "TIME_LIMIT_EXCEEDED", 1000)])
    monkeypatch.setattr(DockerCppJudge, "_run", lambda *args, **kwargs: next(outcomes))
    assert DockerCppJudge("runner").evaluate("source", [Case("", "")], 1000, 128, 64).verdict == "TIME_LIMIT_EXCEEDED"
    outcomes = iter([(0, "", "", 1), (0, "large", "OUTPUT_LIMIT_EXCEEDED", 2)])
    monkeypatch.setattr(DockerCppJudge, "_run", lambda *args, **kwargs: next(outcomes))
    assert DockerCppJudge("runner").evaluate("source", [Case("", "")], 1000, 128, 64).verdict == "OUTPUT_LIMIT_EXCEEDED"


def test_invalid_source_fails_without_launching(monkeypatch):
    monkeypatch.setattr(DockerCppJudge, "_run", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("must not launch")))
    assert DockerCppJudge("runner").evaluate("  ", [Case("", "")], 1000, 128, 64).verdict == "SYSTEM_ERROR"


def test_missing_docker_cli_returns_actionable_system_error(monkeypatch, tmp_path):
    monkeypatch.setattr("app.judge.engine.subprocess.Popen", lambda *args, **kwargs: (_ for _ in ()).throw(FileNotFoundError(2, "No such file or directory", "docker")))
    monkeypatch.setattr(DockerCppJudge, "_cleanup_container", lambda *_: None)
    _, _, stderr, _ = DockerCppJudge("runner")._run(tmp_path, ["/bin/sh", "-c", "true"])
    assert stderr == "SYSTEM_ERROR: Docker CLI is missing in judge-worker. Rebuild the judge-worker image from backend/Dockerfile.worker."


def test_worker_discards_malformed_job():
    asyncio.run(process_submission("not-a-uuid"))
