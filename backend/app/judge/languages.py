"""Centralized Language Registry for CodeArena Online Judge."""
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass(frozen=True)
class LanguageConfig:
    """Configuration definition for a supported programming language."""
    id: str
    name: str
    monaco_id: str
    source_filename: str
    compiler_or_runtime: str
    docker_image: str
    is_compiled: bool
    default_time_limit_ms: int
    default_memory_limit_mb: int
    time_limit_multiplier: float
    memory_limit_multiplier: float
    starter_code: str
    compile_cmd_template: Optional[str] = None
    execute_cmd_template: str = ""

    def get_compile_command(self, workspace: Path) -> Optional[List[str]]:
        if not self.is_compiled or not self.compile_cmd_template:
            return None
        cmd = self.compile_cmd_template.format(
            workspace="/workspace",
            source=f"/workspace/{self.source_filename}",
            binary="/workspace/ca-program",
        )
        return ["/bin/sh", "-c", cmd]

    def get_execute_command(self, workspace: Path, time_limit_ms: int, memory_limit_mb: int) -> str:
        effective_timeout_s = (time_limit_ms * self.time_limit_multiplier) / 1000.0
        effective_mem_mb = int(memory_limit_mb * self.memory_limit_multiplier)
        return self.execute_cmd_template.format(
            workspace="/workspace",
            source=f"/workspace/{self.source_filename}",
            binary="/workspace/ca-program",
            timeout_s=f"{effective_timeout_s:.3f}s",
            memory_mb=effective_mem_mb,
        )


class LanguageRegistry:
    """Registry maintaining all supported execution languages and aliases."""
    _languages: Dict[str, LanguageConfig] = {}
    _aliases: Dict[str, str] = {}

    @classmethod
    def register(cls, config: LanguageConfig, aliases: Optional[List[str]] = None) -> None:
        cls._languages[config.id] = config
        cls._aliases[config.id.lower()] = config.id
        if aliases:
            for alias in aliases:
                cls._aliases[alias.lower()] = config.id

    @classmethod
    def get(cls, language_id: str) -> LanguageConfig:
        normalized = language_id.strip().lower()
        target_id = cls._aliases.get(normalized, "cpp")
        return cls._languages.get(target_id, cls._languages["cpp"])

    @classmethod
    def is_supported(cls, language_id: str) -> bool:
        return language_id.strip().lower() in cls._aliases

    @classmethod
    def canonical_id(cls, language_id: str) -> str:
        return cls._aliases.get(language_id.strip().lower(), "cpp")

    @classmethod
    def list_all(cls) -> List[LanguageConfig]:
        return list(cls._languages.values())


DEFAULT_RUNNER_IMAGE = "codearena-cpp-runner:1.0"

# 1. C++20 (GCC 14)
LanguageRegistry.register(
    LanguageConfig(
        id="cpp",
        name="C++20 (GCC 14)",
        monaco_id="cpp",
        source_filename="main.cpp",
        compiler_or_runtime="g++ 14.2.0",
        docker_image=DEFAULT_RUNNER_IMAGE,
        is_compiled=True,
        default_time_limit_ms=2000,
        default_memory_limit_mb=256,
        time_limit_multiplier=1.0,
        memory_limit_multiplier=1.0,
        starter_code="""#include <iostream>
using namespace std;

int main() {
    // Read input and write output
    return 0;
}
""",
        compile_cmd_template="g++ -std=c++20 -O2 -pipe {source} -o {binary}",
        execute_cmd_template="/usr/bin/timeout --signal=TERM --kill-after=0.1s {timeout_s} {binary}",
    ),
    aliases=["c++", "cpp20", "g++"],
)

# 2. C17 (GCC 14)
LanguageRegistry.register(
    LanguageConfig(
        id="c",
        name="C17 (GCC 14)",
        monaco_id="c",
        source_filename="main.c",
        compiler_or_runtime="gcc 14.2.0",
        docker_image=DEFAULT_RUNNER_IMAGE,
        is_compiled=True,
        default_time_limit_ms=2000,
        default_memory_limit_mb=256,
        time_limit_multiplier=1.0,
        memory_limit_multiplier=1.0,
        starter_code="""#include <stdio.h>

int main() {
    // Read input and write output
    return 0;
}
""",
        compile_cmd_template="gcc -std=c17 -O2 -pipe {source} -o {binary} -lm",
        execute_cmd_template="/usr/bin/timeout --signal=TERM --kill-after=0.1s {timeout_s} {binary}",
    ),
    aliases=["c17", "gcc"],
)

# 3. Java 17 (OpenJDK)
LanguageRegistry.register(
    LanguageConfig(
        id="java",
        name="Java 17 (OpenJDK)",
        monaco_id="java",
        source_filename="Main.java",
        compiler_or_runtime="javac 17.0.21 / openjdk 17",
        docker_image=DEFAULT_RUNNER_IMAGE,
        is_compiled=True,
        default_time_limit_ms=3000,
        default_memory_limit_mb=256,
        time_limit_multiplier=1.5,
        memory_limit_multiplier=1.0,
        starter_code="""import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read input and write output
    }
}
""",
        compile_cmd_template="javac -encoding UTF-8 -d {workspace} {source}",
        execute_cmd_template="/usr/bin/timeout --signal=TERM --kill-after=0.1s {timeout_s} java -Xmx{memory_mb}m -Xss8m -XX:+UseSerialGC -Dfile.encoding=UTF-8 -cp {workspace} Main",
    ),
    aliases=["java17", "openjdk"],
)

# 4. Python 3 (3.11)
LanguageRegistry.register(
    LanguageConfig(
        id="python",
        name="Python 3.11",
        monaco_id="python",
        source_filename="solution.py",
        compiler_or_runtime="python 3.11.2",
        docker_image=DEFAULT_RUNNER_IMAGE,
        is_compiled=False,
        default_time_limit_ms=4000,
        default_memory_limit_mb=256,
        time_limit_multiplier=2.0,
        memory_limit_multiplier=1.0,
        starter_code="""import sys

def main():
    # Read input from sys.stdin and write output to sys.stdout
    pass

if __name__ == "__main__":
    main()
""",
        compile_cmd_template=None,
        execute_cmd_template="/usr/bin/timeout --signal=TERM --kill-after=0.1s {timeout_s} python3 -u {source}",
    ),
    aliases=["python3", "py", "py3"],
)

# 5. Go 1.19
LanguageRegistry.register(
    LanguageConfig(
        id="go",
        name="Go 1.19",
        monaco_id="go",
        source_filename="main.go",
        compiler_or_runtime="go toolchain",
        docker_image=DEFAULT_RUNNER_IMAGE,
        is_compiled=True,
        default_time_limit_ms=2000,
        default_memory_limit_mb=256,
        time_limit_multiplier=1.0,
        memory_limit_multiplier=1.0,
        starter_code="""package main

import (
    "fmt"
)

func main() {
    // Read input and write output
}
""",
        compile_cmd_template="GOCACHE=/tmp/gocache go build -o {binary} {source}",
        execute_cmd_template="/usr/bin/timeout --signal=TERM --kill-after=0.1s {timeout_s} {binary}",
    ),
    aliases=["golang"],
)

