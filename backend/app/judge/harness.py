"""
Generates C++ driver code for problems that use the LeetCode-style `class Solution` interface.
If a submission already contains `int main`, it is left untouched.
"""
import re

COMMON_HELPERS = """
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

static inline std::string _ca_trim(const std::string& s) {
    size_t f = s.find_first_not_of(" \\t\\r\\n");
    if (f == std::string::npos) return "";
    size_t l = s.find_last_not_of(" \\t\\r\\n");
    return s.substr(f, l - f + 1);
}

static inline std::vector<int> _ca_parse_vec_int(const std::string& str) {
    std::vector<int> res;
    size_t start = str.find('[');
    size_t end = str.find(']');
    if (start == std::string::npos || end == std::string::npos || start >= end) return res;
    std::string content = str.substr(start + 1, end - start - 1);
    std::stringstream ss(content);
    std::string token;
    while (std::getline(ss, token, ',')) {
        std::string t = _ca_trim(token);
        if (!t.empty()) {
            try { res.push_back(std::stoi(t)); } catch(...) {}
        }
    }
    return res;
}

static inline std::vector<char> _ca_parse_vec_char(const std::string& str) {
    std::vector<char> res;
    size_t start = str.find('[');
    size_t end = str.find(']');
    if (start == std::string::npos || end == std::string::npos || start >= end) return res;
    std::string content = str.substr(start + 1, end - start - 1);
    std::stringstream ss(content);
    std::string token;
    while (std::getline(ss, token, ',')) {
        std::string t = _ca_trim(token);
        for (char c : t) {
            if (c != '"' && c != '\\'') {
                res.push_back(c);
                break;
            }
        }
    }
    return res;
}

static inline std::string _ca_parse_string(const std::string& str) {
    size_t eq = str.find('=');
    std::string val = (eq != std::string::npos) ? str.substr(eq + 1) : str;
    size_t q1 = val.find('"');
    size_t q2 = val.rfind('"');
    if (q1 != std::string::npos && q2 != std::string::npos && q2 > q1) {
        return val.substr(q1 + 1, q2 - q1 - 1);
    }
    return _ca_trim(val);
}

static inline int _ca_parse_int_var(const std::string& str, const std::string& var_name) {
    size_t pos = str.find(var_name);
    if (pos == std::string::npos) return 0;
    size_t eq = str.find('=', pos);
    if (eq == std::string::npos) return 0;
    std::string sub = str.substr(eq + 1);
    size_t comma = sub.find(',');
    if (comma != std::string::npos) sub = sub.substr(0, comma);
    try {
        return std::stoi(_ca_trim(sub));
    } catch (...) {
        return 0;
    }
}
"""

DRIVERS = {
    "two-sum": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::vector<int> nums = _ca_parse_vec_int(line);
    int target = _ca_parse_int_var(line, "target");
    Solution sol;
    std::vector<int> ans = sol.twoSum(nums, target);
    std::cout << "[";
    for (size_t i = 0; i < ans.size(); i++) {
        std::cout << ans[i] << (i + 1 < ans.size() ? "," : "");
    }
    std::cout << "]" << "\\n";
    return 0;
}
""",
    "reverse-a-string": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::vector<char> s = _ca_parse_vec_char(line);
    Solution sol;
    sol.reverseString(s);
    std::cout << "[";
    for (size_t i = 0; i < s.size(); i++) {
        std::cout << "\\"" << s[i] << "\\"" << (i + 1 < s.size() ? "," : "");
    }
    std::cout << "]" << "\\n";
    return 0;
}
""",
    "valid-palindrome": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::string s = _ca_parse_string(line);
    Solution sol;
    bool ans = sol.isPalindrome(s);
    std::cout << (ans ? "true" : "false") << "\\n";
    return 0;
}
""",
    "binary-search": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::vector<int> nums = _ca_parse_vec_int(line);
    int target = _ca_parse_int_var(line, "target");
    Solution sol;
    int ans = sol.search(nums, target);
    std::cout << ans << "\\n";
    return 0;
}
""",
    "maximum-subarray": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::vector<int> nums = _ca_parse_vec_int(line);
    Solution sol;
    int ans = sol.maxSubArray(nums);
    std::cout << ans << "\\n";
    return 0;
}
""",
    "valid-parentheses": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::string s = _ca_parse_string(line);
    Solution sol;
    bool ans = sol.isValid(s);
    std::cout << (ans ? "true" : "false") << "\\n";
    return 0;
}
""",
    "merge-two-sorted-arrays": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    size_t p2 = line.find("nums2");
    std::string sub1 = (p2 != std::string::npos) ? line.substr(0, p2) : line;
    std::string sub2 = (p2 != std::string::npos) ? line.substr(p2) : "";
    std::vector<int> nums1 = _ca_parse_vec_int(sub1);
    int m = _ca_parse_int_var(sub1, "m");
    std::vector<int> nums2 = _ca_parse_vec_int(sub2);
    int n = _ca_parse_int_var(sub2, "n");
    Solution sol;
    sol.merge(nums1, m, nums2, n);
    std::cout << "[";
    for (size_t i = 0; i < nums1.size(); i++) {
        std::cout << nums1[i] << (i + 1 < nums1.size() ? "," : "");
    }
    std::cout << "]" << "\\n";
    return 0;
}
""",
    "first-unique-character": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::string s = _ca_parse_string(line);
    Solution sol;
    int ans = sol.firstUniqChar(s);
    std::cout << ans << "\\n";
    return 0;
}
""",
    "contains-duplicate": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::vector<int> nums = _ca_parse_vec_int(line);
    Solution sol;
    bool ans = sol.containsDuplicate(nums);
    std::cout << (ans ? "true" : "false") << "\\n";
    return 0;
}
""",
    "best-time-to-buy-and-sell-stock": """
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::vector<int> prices = _ca_parse_vec_int(line);
    Solution sol;
    int ans = sol.maxProfit(prices);
    std::cout << ans << "\\n";
    return 0;
}
""",
}


def wrap_source_code(source: str, slug: str | None = None, language: str = "cpp") -> str:
    """
    If source does not contain 'int main' and a driver exists for the given problem slug,
    append the test harness driver. For non-C++ languages, returns source as-is.
    """
    if language != "cpp":
        return source
    # Regex to check if main is already defined
    if re.search(r"\bint\s+main\s*\(", source):
        return source
    if not slug or slug not in DRIVERS:
        return source
    return f"{source}\n\n// --- CodeArena Judge Test Harness ---\n{COMMON_HELPERS}\n{DRIVERS[slug]}\n"
