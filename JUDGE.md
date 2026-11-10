# CodeArena Online Judge System

## Multi-Language Architecture & Request Flow

The authenticated API accepts `POST /api/v1/submissions/problems/{slug}/run` and `/submit` with:
```json
{
  "source_code": "...",
  "language": "cpp"
}
```
Supported languages include:
- `cpp` (C++20 via `g++`)
- `c` (C17 via `gcc`)
- `java` (Java 17 via `javac` & `java`)
- `python` (Python 3.11 via `python3`)
- `go` (Go 1.19 via `go build`)

The user identity comes from the existing bearer token or HttpOnly cookie. A persistent `submissions` row is created before its UUID is pushed to the Redis list. The separate worker claims a queue item, loads the submission and enabled problem from PostgreSQL, then reads sample tests for RUN or all tests for SUBMIT. Hidden input and expected output never leave the server-side judge path.

Poll `GET /api/v1/submissions/{submission_id}` for lifecycle state and final verdict. `GET /api/v1/submissions?page=1&page_size=20&problem_id={uuid}` returns the authenticated user's history. A user cannot read another user's submission. Queue and runner failures are recorded as `SYSTEM_ERROR`; the API never runs code as a fallback.

Lifecycle status is `QUEUED`, `COMPILING`, `RUNNING`, `COMPLETED`, or `FAILED`. Final verdicts are:
- `ACCEPTED`
- `WRONG_ANSWER`
- `COMPILATION_ERROR`
- `RUNTIME_ERROR`
- `TIME_LIMIT_EXCEEDED`
- `MEMORY_LIMIT_EXCEEDED`
- `OUTPUT_LIMIT_EXCEEDED`
- `SYSTEM_ERROR`

### High-Precision Execution Telemetry
Program execution time is measured accurately using high-precision in-container telemetry (`__CA_TIME_MS__`). The reported `execution_time_ms` reflects purely the user-code execution time and excludes Docker container startup, volume mounting, and compilation overhead. Separately, `compile_time_ms`, `queue_wait_ms`, and `total_processing_ms` are recorded for complete end-to-end performance visibility.

## Language Registry & Sandboxed Execution

All language configurations are centralized in `backend/app/judge/languages.py` through `LanguageConfig` and `LanguageRegistry`:
- **Compile-once policy**: Compiled languages (`cpp`, `c`, `java`, `go`) are compiled exactly once into `/workspace` with relaxed workspace permissions (`0o777`), which are then dropped to read-only (`0o755`) for all testcase executions.
- **Interpreted languages**: Interpreted languages such as `python` skip the compilation phase entirely and execute directly against the source file.
- **Adding new languages**: Simply instantiate a new `LanguageConfig` in `LanguageRegistry.LANGUAGES` defining `id`, `name`, `source_filename`, `is_compiled`, `compile_command_builder`, `run_command_builder`, and starter code.

| Language | Extension | Compiler / Runtime | Flags / Compilation Command | Execution Command |
|---|---|---|---|---|
| **C++** | `.cpp` | `g++` 14.2.0 | `-O2 -std=c++20 -pipe -DONLINE_JUDGE main.cpp -o ca-program` | `/workspace/ca-program` |
| **C** | `.c` | `gcc` 14.2.0 | `-O2 -std=c17 -pipe -DONLINE_JUDGE main.c -o ca-program -lm` | `/workspace/ca-program` |
| **Java** | `.java` | OpenJDK 17 | `javac -encoding UTF-8 -d /workspace /workspace/Main.java` | `java -Xmx{mem}m -Xss8m -XX:+UseSerialGC -Dfile.encoding=UTF-8 -cp /workspace Main` |
| **Python** | `.py` | Python 3.11 | *None (Interpreted)* | `python3 -u /workspace/solution.py` |
| **Go** | `.go` | Go 1.19 | `GOCACHE=/tmp/gocache go build -o /workspace/ca-program /workspace/main.go` | `/workspace/ca-program` |

## Execution Policy and Security

The worker invokes Docker with argument arrays and a fixed shell command. Source is written into a dedicated named volume from a unique temporary workspace and that per-submission subdirectory is mounted into each runner (`codearena_judge_workspaces` volume subpath). A runner cannot inspect other submissions in the shared volume.

Strict sandboxing restrictions enforced on every runner container:
- `--network=none`: Total network isolation.
- `--cap-drop=ALL`: Dropped all Linux capabilities.
- `--security-opt=no-new-privileges`: Prevents privilege escalation.
- `--pids-limit=64`: Fork bomb protection.
- `--cpus=1`: CPU core limitation.
- `--memory={limit}m --memory-swap={limit}m`: Hard memory capping.
- `--read-only`: Root filesystem is read-only during testcase execution.
- `--tmpfs /tmp:rw,exec,nosuid,size=128m,uid=10001,gid=10001`: In-memory isolated temporary scratch space.
- `--user 10001:10001`: Non-root unprivileged execution.
- `--ulimit nofile=1024:1024` and `--ulimit core=0:0`: Resource limit caps.
- Wall-clock timeouts with process kills and Docker cleanup.

The Compose worker needs `/var/run/docker.sock` to create sandboxes. The socket is mounted only into the trusted worker, never into the API, runner, or submitted program. Access to the Docker socket is effectively host-level control, so the worker itself must be treated as a privileged trusted service.

## Database and Local Setup (PowerShell)

Apply migrations:
```powershell
docker compose up -d postgres redis
docker compose run --rm backend alembic upgrade head
```

Build and run all services:
```powershell
docker compose up --build
```

Rebuild runner image when updating toolchains:
```powershell
docker build -t codearena-cpp-runner:1.0 -f judge/Dockerfile.runner judge
```

## Running Judge Tests

Run all unit, regression, and multi-language test suites inside the Docker containers:

```powershell
# Unit tests
docker compose exec backend pytest tests/test_judge_engine.py -v

# C++ Regression suite (10 tests)
docker compose exec judge-worker pytest tests/test_judge_regression_suite.py -v

# Multi-Language suite (19 tests across C++, C, Java, Python, Go)
docker compose exec judge-worker pytest tests/test_multi_language_judge.py -v
```
