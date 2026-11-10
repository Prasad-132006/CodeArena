import pytest
import os
import shutil
import tempfile
from pathlib import Path
from app.core.config import settings
from app.judge.engine import Case, DockerCppJudge

IMAGE = "codearena-cpp-runner:1.0"
DOCKER_AVAILABLE = shutil.which("docker") is not None

@pytest.mark.skipif(not DOCKER_AVAILABLE, reason="Docker CLI not available")
class TestJudgeRegressionSuite:
    @pytest.fixture(autouse=True)
    def setup_judge(self):
        self.workspace_root = settings.JUDGE_WORKSPACE_ROOT
        self.judge = DockerCppJudge(IMAGE, compilation_timeout=10, workspace_root=self.workspace_root)

    def test_01_hello_world(self):
        source = """#include <iostream>
int main() {
    std::cout << "Hello World" << std::endl;
    return 0;
}
"""
        res = self.judge.evaluate(source, [Case("", "Hello World\n")], 2000, 256, 64)
        assert res.verdict == "ACCEPTED"
        assert res.passed == 1
        assert res.total == 1
        assert res.compile_time_ms is not None
        assert res.execution_time_ms is not None
        # Actual execution should be well under 1000ms (typically 0-50ms)
        assert res.execution_time_ms < 1000

    def test_02_addition(self):
        source = """#include <iostream>
int main() {
    int a, b;
    if (std::cin >> a >> b) {
        std::cout << (a + b) << std::endl;
    }
    return 0;
}
"""
        cases = [Case("5 7\n", "12"), Case("100 250\n", "350"), Case("-10 10\n", "0")]
        res = self.judge.evaluate(source, cases, 2000, 256, 64)
        assert res.verdict == "ACCEPTED"
        assert res.passed == 3
        assert res.total == 3
        assert res.compile_time_ms is not None
        assert res.execution_time_ms < 1000

    def test_03_binary_search(self):
        source = """#include <iostream>
#include <vector>
int main() {
    int n, target;
    if (!(std::cin >> n >> target)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; i++) std::cin >> arr[i];
    int l = 0, r = n - 1, ans = -1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == target) { ans = m; break; }
        if (arr[m] < target) l = m + 1;
        else r = m - 1;
    }
    std::cout << ans << std::endl;
    return 0;
}
"""
        cases = [
            Case("5 3\n1 2 3 4 5\n", "2"),
            Case("5 6\n1 2 3 4 5\n", "-1"),
            Case("1 10\n10\n", "0"),
        ]
        res = self.judge.evaluate(source, cases, 2000, 256, 64)
        assert res.verdict == "ACCEPTED"
        assert res.passed == 3

    def test_04_linear_search(self):
        source = """#include <iostream>
#include <vector>
int main() {
    int n, target;
    if (!(std::cin >> n >> target)) return 0;
    std::vector<int> arr(n);
    int ans = -1;
    for (int i = 0; i < n; i++) {
        std::cin >> arr[i];
        if (arr[i] == target && ans == -1) ans = i;
    }
    std::cout << ans << std::endl;
    return 0;
}
"""
        cases = [Case("4 40\n10 20 30 40\n", "3"), Case("3 99\n1 2 3\n", "-1")]
        res = self.judge.evaluate(source, cases, 2000, 256, 64)
        assert res.verdict == "ACCEPTED"
        assert res.passed == 2

    def test_05_dijkstra(self):
        source = """#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    vector<long long> dist(n + 1, 1e18);
    dist[1] = 0;
    pq.push({0, 1});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    cout << (dist[n] == 1e18 ? -1 : dist[n]) << endl;
    return 0;
}
"""
        cases = [
            Case("4 4\n1 2 2\n2 3 3\n3 4 1\n1 4 10\n", "6"),
            Case("3 1\n1 2 5\n", "-1"),
        ]
        res = self.judge.evaluate(source, cases, 2000, 256, 64)
        assert res.verdict == "ACCEPTED"
        assert res.passed == 2

    def test_06_compilation_error(self):
        source = """#include <iostream>
int main() {
    this_is_a_syntax_error();
    return 0;
}
"""
        res = self.judge.evaluate(source, [Case("", "")], 2000, 256, 64)
        assert res.verdict == "COMPILATION_ERROR"
        assert "this_is_a_syntax_error" in res.message
        assert res.passed == 0

    def test_07_timeout_infinite_loop(self):
        source = """int main() {
    while (true) {}
    return 0;
}
"""
        # Set a short time limit (200ms)
        res = self.judge.evaluate(source, [Case("", "")], 200, 256, 64)
        assert res.verdict == "TIME_LIMIT_EXCEEDED"
        assert res.passed == 0

    def test_08_memory_limit(self):
        source = """#include <vector>
int main() {
    // Allocate 150MB when memory limit is 64MB
    std::vector<std::vector<char>> v(150, std::vector<char>(1024 * 1024, 'a'));
    return 0;
}
"""
        res = self.judge.evaluate(source, [Case("", "")], 2000, 64, 64)
        assert res.verdict in ("MEMORY_LIMIT_EXCEEDED", "RUNTIME_ERROR")

    def test_09_incorrect_output(self):
        source = """#include <iostream>
int main() {
    std::cout << "Wrong Answer" << std::endl;
    return 0;
}
"""
        res = self.judge.evaluate(source, [Case("", "Expected Answer\n")], 2000, 256, 64)
        assert res.verdict == "WRONG_ANSWER"
        assert res.passed == 0
        assert res.case_results[0]["passed"] is False

    def test_10_multiple_test_cases(self):
        source = """#include <iostream>
int main() {
    int x;
    if (std::cin >> x) std::cout << (x * 2) << std::endl;
    return 0;
}
"""
        cases = [Case(f"{i}\n", f"{i * 2}\n") for i in range(1, 6)]
        res = self.judge.evaluate(source, cases, 2000, 256, 64)
        assert res.verdict == "ACCEPTED"
        assert res.passed == 5
        assert res.total == 5
        assert len(res.case_results) == 5

