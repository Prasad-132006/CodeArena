import pytest
import shutil
from app.core.config import settings
from app.judge.engine import Case, DockerCppJudge
from app.judge.languages import LanguageRegistry

DOCKER_AVAILABLE = shutil.which("docker") is not None
IMAGE = "codearena-cpp-runner:1.0"


class TestLanguageRegistry:
    def test_all_languages_registered(self):
        langs = LanguageRegistry.list_all()
        ids = {l.id for l in langs}
        assert {"cpp", "c", "java", "python", "go"}.issubset(ids)

    def test_language_aliases(self):
        assert LanguageRegistry.canonical_id("python3") == "python"
        assert LanguageRegistry.canonical_id("py") == "python"
        assert LanguageRegistry.canonical_id("golang") == "go"
        assert LanguageRegistry.canonical_id("c++") == "cpp"
        assert LanguageRegistry.canonical_id("gcc") == "c"

    def test_starter_codes_present(self):
        for lang in LanguageRegistry.list_all():
            assert lang.starter_code
            assert lang.source_filename
            assert lang.monaco_id


@pytest.mark.skipif(not DOCKER_AVAILABLE, reason="Docker CLI not available")
class TestMultiLanguageJudgeExecution:
    @pytest.fixture(autouse=True)
    def setup_judge(self):
        self.workspace_root = settings.JUDGE_WORKSPACE_ROOT
        self.judge = DockerCppJudge(IMAGE, compilation_timeout=15, workspace_root=self.workspace_root)

    # ------------------ C Language Tests ------------------
    def test_c_hello_world(self):
        code = '#include <stdio.h>\nint main(){ printf("Hello C\\n"); return 0; }'
        res = self.judge.evaluate(code, [Case("", "Hello C\n")], 2000, 256, 64, language="c")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 1

    def test_c_addition_and_arrays(self):
        code = """#include <stdio.h>
int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%d\\n", sum);
    return 0;
}
"""
        cases = [Case("3\n10 20 30\n", "60"), Case("2\n-5 5\n", "0")]
        res = self.judge.evaluate(code, cases, 2000, 256, 64, language="c")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 2

    def test_c_compilation_error(self):
        code = '#include <stdio.h>\nint main(){ invalid_syntax_here(); return 0; }'
        res = self.judge.evaluate(code, [Case("", "")], 2000, 256, 64, language="c")
        assert res.verdict == "COMPILATION_ERROR"
        assert res.passed == 0

    def test_c_timeout(self):
        code = 'int main(){ while(1); return 0; }'
        res = self.judge.evaluate(code, [Case("", "")], 300, 256, 64, language="c")
        assert res.verdict == "TIME_LIMIT_EXCEEDED"

    # ------------------ Java Language Tests ------------------
    def test_java_hello_world(self):
        code = """public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Java");
    }
}
"""
        res = self.judge.evaluate(code, [Case("", "Hello Java\n")], 2000, 256, 64, language="java")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 1

    def test_java_addition_and_scanner(self):
        code = """import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}
"""
        cases = [Case("12 18\n", "30"), Case("-10 25\n", "15")]
        res = self.judge.evaluate(code, cases, 2000, 256, 64, language="java")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 2

    def test_java_compilation_error(self):
        code = "public class Main { syntax error here }"
        res = self.judge.evaluate(code, [Case("", "")], 2000, 256, 64, language="java")
        assert res.verdict == "COMPILATION_ERROR"

    def test_java_timeout(self):
        code = """public class Main {
    public static void main(String[] args) {
        while (true) {}
    }
}
"""
        res = self.judge.evaluate(code, [Case("", "")], 300, 256, 64, language="java")
        assert res.verdict == "TIME_LIMIT_EXCEEDED"

    # ------------------ Python 3 Tests ------------------
    def test_python_hello_world(self):
        code = 'print("Hello Python")'
        res = self.judge.evaluate(code, [Case("", "Hello Python\n")], 2000, 256, 64, language="python")
        assert res.verdict == "ACCEPTED"
        assert res.compile_time_ms is None  # Interpreted; no compilation phase!

    def test_python_addition_and_arrays(self):
        code = """import sys
lines = sys.stdin.read().split()
if lines:
    nums = [int(x) for x in lines]
    print(sum(nums))
"""
        cases = [Case("1 2 3 4 5\n", "15"), Case("100 200\n", "300")]
        res = self.judge.evaluate(code, cases, 2000, 256, 64, language="python")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 2

    def test_python_runtime_error(self):
        code = 'import sys\nraise ValueError("Intentional crash")'
        res = self.judge.evaluate(code, [Case("", "")], 2000, 256, 64, language="python")
        assert res.verdict == "RUNTIME_ERROR"

    def test_python_timeout(self):
        code = 'while True:\n    pass'
        res = self.judge.evaluate(code, [Case("", "")], 300, 256, 64, language="python")
        assert res.verdict == "TIME_LIMIT_EXCEEDED"

    # ------------------ Go Language Tests ------------------
    def test_go_hello_world(self):
        code = """package main
import "fmt"
func main() {
    fmt.Println("Hello Go")
}
"""
        res = self.judge.evaluate(code, [Case("", "Hello Go\n")], 2000, 256, 64, language="go")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 1

    def test_go_addition_and_loop(self):
        code = """package main
import "fmt"
func main() {
    var a, b int
    if _, err := fmt.Scan(&a, &b); err == nil {
        fmt.Println(a + b)
    }
}
"""
        cases = [Case("40 60\n", "100"), Case("-20 20\n", "0")]
        res = self.judge.evaluate(code, cases, 2000, 256, 64, language="go")
        assert res.verdict == "ACCEPTED"
        assert res.passed == 2

    def test_go_compilation_error(self):
        code = "package main\nfunc main() { syntax error }"
        res = self.judge.evaluate(code, [Case("", "")], 2000, 256, 64, language="go")
        assert res.verdict == "COMPILATION_ERROR"

    def test_go_timeout(self):
        code = """package main
func main() {
    for {}
}
"""
        res = self.judge.evaluate(code, [Case("", "")], 300, 256, 64, language="go")
        assert res.verdict == "TIME_LIMIT_EXCEEDED"

