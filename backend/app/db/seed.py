import asyncio
import re
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.problem import Problem, Tag, TestCase

SEED_PROBLEMS: List[Dict[str, Any]] = [
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "tags": ["Arrays", "Hash Table"],
        "description": (
            "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\n"
            "You may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\n"
            "You can return the answer in any order."
        ),
        "input_format": "A vector of integers `nums` and a single integer `target`.",
        "output_format": "A vector of two integers representing the 0-based indices.",
        "constraints": (
            "- 2 <= nums.length <= 10^4\n"
            "- -10^9 <= nums[i] <= 10^9\n"
            "- -10^9 <= target <= 10^9\n"
            "- Only one valid answer exists."
        ),
        "examples": [
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                "input": "nums = [3,2,4], target = 6",
                "output": "[1,2]",
                "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
            },
            {
                "input": "nums = [3,3], target = 6",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 6, we return [0, 1]."
            }
        ],
        "starter_code": (
            "#include <vector>\n"
            "#include <unordered_map>\n\n"
            "class Solution {\n"
            "public:\n"
            "    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n"
            "        // Complete your solution here\n"
            "        return {};\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "reverse-a-string",
        "title": "Reverse a String",
        "difficulty": "Easy",
        "tags": ["Two Pointers", "String"],
        "description": (
            "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\n"
            "You must do this by modifying the input array **in-place** with `O(1)` extra memory."
        ),
        "input_format": "An array of characters `s`.",
        "output_format": "Void (modify `s` in-place).",
        "constraints": (
            "- 1 <= s.length <= 10^5\n"
            "- `s[i]` is a printable ascii character."
        ),
        "examples": [
            {
                "input": 's = ["h","e","l","l","o"]',
                "output": '["o","l","l","e","h"]',
                "explanation": "The characters in s are reversed in place."
            },
            {
                "input": 's = ["H","a","n","n","a","h"]',
                "output": '["h","a","n","n","a","H"]',
                "explanation": "The characters in s are reversed in place."
            }
        ],
        "starter_code": (
            "#include <vector>\n\n"
            "class Solution {\n"
            "public:\n"
            "    void reverseString(std::vector<char>& s) {\n"
            "        // In-place character reversal\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "valid-palindrome",
        "title": "Valid Palindrome",
        "difficulty": "Easy",
        "tags": ["Two Pointers", "String"],
        "description": (
            "A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\n"
            "Given a string `s`, return `true` if it is a palindrome, or `false` otherwise."
        ),
        "input_format": "A single string `s`.",
        "output_format": "Boolean `true` if palindrome, `false` otherwise.",
        "constraints": (
            "- 1 <= s.length <= 2 * 10^5\n"
            "- `s` consists only of printable ASCII characters."
        ),
        "examples": [
            {
                "input": 's = "A man, a plan, a canal: Panama"',
                "output": "true",
                "explanation": '"amanaplanacanalpanama" is a palindrome.'
            },
            {
                "input": 's = "race a car"',
                "output": "false",
                "explanation": '"raceacar" is not a palindrome.'
            },
            {
                "input": 's = " "',
                "output": "true",
                "explanation": 's is an empty string "" after removing non-alphanumeric characters. Since an empty string reads the same forward and backward, it is a palindrome.'
            }
        ],
        "starter_code": (
            "#include <string>\n"
            "#include <cctype>\n\n"
            "class Solution {\n"
            "public:\n"
            "    bool isPalindrome(std::string s) {\n"
            "        // Complete your solution here\n"
            "        return false;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "binary-search",
        "title": "Binary Search",
        "difficulty": "Easy",
        "tags": ["Binary Search", "Arrays"],
        "description": (
            "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\n"
            "You must write an algorithm with `O(log n)` runtime complexity."
        ),
        "input_format": "A sorted vector of integers `nums` and a target integer `target`.",
        "output_format": "Integer index of `target`, or -1 if not found.",
        "constraints": (
            "- 1 <= nums.length <= 10^4\n"
            "- -10^4 < nums[i], target < 10^4\n"
            "- All the integers in `nums` are **unique**.\n"
            "- `nums` is sorted in ascending order."
        ),
        "examples": [
            {
                "input": "nums = [-1,0,3,5,9,12], target = 9",
                "output": "4",
                "explanation": "9 exists in nums and its index is 4."
            },
            {
                "input": "nums = [-1,0,3,5,9,12], target = 2",
                "output": "-1",
                "explanation": "2 does not exist in nums so return -1."
            }
        ],
        "starter_code": (
            "#include <vector>\n\n"
            "class Solution {\n"
            "public:\n"
            "    int search(std::vector<int>& nums, int target) {\n"
            "        // O(log n) binary search\n"
            "        return -1;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "maximum-subarray",
        "title": "Maximum Subarray",
        "difficulty": "Medium",
        "tags": ["Arrays", "Divide and Conquer", "Dynamic Programming"],
        "description": (
            "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n"
            "A **subarray** is a contiguous non-empty sequence of elements within an array."
        ),
        "input_format": "A vector of integers `nums`.",
        "output_format": "An integer representing the maximum contiguous subarray sum.",
        "constraints": (
            "- 1 <= nums.length <= 10^5\n"
            "- -10^4 <= nums[i] <= 10^4"
        ),
        "examples": [
            {
                "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
                "output": "6",
                "explanation": "The subarray [4,-1,2,1] has the largest sum 6."
            },
            {
                "input": "nums = [1]",
                "output": "1",
                "explanation": "The subarray [1] has the largest sum 1."
            },
            {
                "input": "nums = [5,4,-1,7,8]",
                "output": "23",
                "explanation": "The subarray [5,4,-1,7,8] has the largest sum 23."
            }
        ],
        "starter_code": (
            "#include <vector>\n"
            "#include <algorithm>\n\n"
            "class Solution {\n"
            "public:\n"
            "    int maxSubArray(std::vector<int>& nums) {\n"
            "        // Kadane's algorithm / DP\n"
            "        return 0;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "tags": ["String", "Stack"],
        "description": (
            "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\n"
            "An input string is valid if:\n"
            "1. Open brackets must be closed by the same type of brackets.\n"
            "2. Open brackets must be closed in the correct order.\n"
            "3. Every close bracket has a corresponding open bracket of the same type."
        ),
        "input_format": "A string `s` containing brackets.",
        "output_format": "Boolean `true` if valid, `false` otherwise.",
        "constraints": (
            "- 1 <= s.length <= 10^4\n"
            "- `s` consists of parentheses only `'()[]{}'`."
        ),
        "examples": [
            {
                "input": 's = "()"',
                "output": "true",
                "explanation": "The pair matches perfectly."
            },
            {
                "input": 's = "()[]{}"',
                "output": "true",
                "explanation": "All bracket pairs open and close in sequence."
            },
            {
                "input": 's = "(]"',
                "output": "false",
                "explanation": "Closing bracket does not match open bracket."
            }
        ],
        "starter_code": (
            "#include <string>\n"
            "#include <stack>\n\n"
            "class Solution {\n"
            "public:\n"
            "    bool isValid(std::string s) {\n"
            "        // Stack-based bracket balance check\n"
            "        return false;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "merge-two-sorted-arrays",
        "title": "Merge Two Sorted Arrays",
        "difficulty": "Easy",
        "tags": ["Arrays", "Two Pointers", "Sorting"],
        "description": (
            "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.\n\n"
            "**Merge** `nums1` and `nums2` into a single array sorted in non-decreasing order.\n\n"
            "The final sorted array should not be returned by the function, but instead be stored inside the array `nums1`. To accommodate this, `nums1` has a length of `m + n`, where the first `m` elements denote the elements that should be merged, and the last `n` elements are set to `0` and should be ignored. `nums2` has a length of `n`."
        ),
        "input_format": "nums1 of size m + n, m (valid count), nums2 of size n, n.",
        "output_format": "Void (in-place modification of nums1).",
        "constraints": (
            "- nums1.length == m + n\n"
            "- nums2.length == n\n"
            "- 0 <= m, n <= 200\n"
            "- 1 <= m + n <= 200\n"
            "- -10^9 <= nums1[i], nums2[j] <= 10^9"
        ),
        "examples": [
            {
                "input": "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3",
                "output": "[1,2,2,3,5,6]",
                "explanation": "The arrays we are merging are [1,2,3] and [2,5,6]. The result is [1,2,2,3,5,6]."
            },
            {
                "input": "nums1 = [1], m = 1, nums2 = [], n = 0",
                "output": "[1]",
                "explanation": "The arrays we are merging are [1] and []. The result is [1]."
            }
        ],
        "starter_code": (
            "#include <vector>\n\n"
            "class Solution {\n"
            "public:\n"
            "    void merge(std::vector<int>& nums1, int m, std::vector<int>& nums2, int n) {\n"
            "        // Three-pointer reverse merge\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "first-unique-character",
        "title": "First Unique Character",
        "difficulty": "Easy",
        "tags": ["Hash Table", "String", "Queue"],
        "description": (
            "Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`."
        ),
        "input_format": "A single lowercase string `s`.",
        "output_format": "Integer index of the first unique character, or -1.",
        "constraints": (
            "- 1 <= s.length <= 10^5\n"
            "- `s` consists of only lowercase English letters."
        ),
        "examples": [
            {
                "input": 's = "codearena"',
                "output": "0",
                "explanation": 'The character "c" at index 0 is non-repeating.'
            },
            {
                "input": 's = "loveleetcode"',
                "output": "2",
                "explanation": 'The character "v" at index 2 is non-repeating.'
            },
            {
                "input": 's = "aabb"',
                "output": "-1",
                "explanation": "Every character repeats, so return -1."
            }
        ],
        "starter_code": (
            "#include <string>\n"
            "#include <unordered_map>\n\n"
            "class Solution {\n"
            "public:\n"
            "    int firstUniqChar(std::string s) {\n"
            "        // Complete your solution here\n"
            "        return -1;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "difficulty": "Easy",
        "tags": ["Arrays", "Hash Table", "Sorting"],
        "description": (
            "Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct."
        ),
        "input_format": "A vector of integers `nums`.",
        "output_format": "Boolean `true` if duplicate exists, `false` otherwise.",
        "constraints": (
            "- 1 <= nums.length <= 10^5\n"
            "- -10^9 <= nums[i] <= 10^9"
        ),
        "examples": [
            {
                "input": "nums = [1,2,3,1]",
                "output": "true",
                "explanation": "1 occurs at indices 0 and 3."
            },
            {
                "input": "nums = [1,2,3,4]",
                "output": "false",
                "explanation": "All elements are distinct."
            },
            {
                "input": "nums = [1,1,1,3,3,4,3,2,4,2]",
                "output": "true",
                "explanation": "Multiple elements appear more than once."
            }
        ],
        "starter_code": (
            "#include <vector>\n"
            "#include <unordered_set>\n\n"
            "class Solution {\n"
            "public:\n"
            "    bool containsDuplicate(std::vector<int>& nums) {\n"
            "        // Hash set duplicate detection\n"
            "        return false;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
    {
        "slug": "best-time-to-buy-and-sell-stock",
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "tags": ["Arrays", "Dynamic Programming"],
        "description": (
            "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\n"
            "You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\n"
            "Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`."
        ),
        "input_format": "A vector of integer daily prices `prices`.",
        "output_format": "An integer representing the maximum profit achievable.",
        "constraints": (
            "- 1 <= prices.length <= 10^5\n"
            "- 0 <= prices[i] <= 10^4"
        ),
        "examples": [
            {
                "input": "prices = [7,1,5,3,6,4]",
                "output": "5",
                "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell."
            },
            {
                "input": "prices = [7,6,4,3,1]",
                "output": "0",
                "explanation": "In this case, no transactions are done and the max profit = 0."
            }
        ],
        "starter_code": (
            "#include <vector>\n"
            "#include <algorithm>\n\n"
            "class Solution {\n"
            "public:\n"
            "    int maxProfit(std::vector<int>& prices) {\n"
            "        // One-pass minimum tracking\n"
            "        return 0;\n"
            "    }\n"
            "};"
        ),
        "is_published": True,
    },
]


HIDDEN_TEST_CASES: Dict[str, List[Dict[str, str]]] = {
    "two-sum": [
        {"input": "nums = [1,5,8,10,14,20], target = 22", "output": "[2,4]"},
        {"input": "nums = [-3,4,3,90], target = 0", "output": "[0,2]"},
    ],
    "reverse-a-string": [
        {"input": 's = ["A"]', "output": '["A"]'},
        {"input": 's = ["C","o","d","e","A","r","e","n","a"]', "output": '["a","n","e","r","A","e","d","o","C"]'},
    ],
    "valid-palindrome": [
        {"input": 's = "0P"', "output": "false"},
        {"input": 's = "ab_a"', "output": "true"},
    ],
    "binary-search": [
        {"input": "nums = [2,5], target = 5", "output": "1"},
        {"input": "nums = [-1,0,3,5,9,12], target = 13", "output": "-1"},
    ],
    "maximum-subarray": [
        {"input": "nums = [-1]", "output": "-1"},
        {"input": "nums = [-2,-1]", "output": "-1"},
    ],
    "valid-parentheses": [
        {"input": 's = "(([]){})"', "output": "true"},
        {"input": 's = "[(])"', "output": "false"},
    ],
    "merge-two-sorted-arrays": [
        {"input": "nums1 = [2,0], m = 1, nums2 = [1], n = 1", "output": "[1,2]"},
        {"input": "nums1 = [4,5,6,0,0,0], m = 3, nums2 = [1,2,3], n = 3", "output": "[1,2,3,4,5,6]"},
    ],
    "first-unique-character": [
        {"input": 's = "aabb"', "output": "-1"},
        {"input": 's = "codearena"', "output": "1"},
    ],
    "contains-duplicate": [
        {"input": "nums = [1,1,1,3,3,4,3,2,4,2]", "output": "true"},
        {"input": "nums = [1,2,3,4,5,6,7,8,9,10]", "output": "false"},
    ],
    "best-time-to-buy-and-sell-stock": [
        {"input": "prices = [2,4,1]", "output": "2"},
        {"input": "prices = [3,2,6,5,0,3]", "output": "4"},
    ],
}


def slugify(text: str) -> str:
    """Normalize text into a URL slug."""
    text = text.lower().strip()
    return re.sub(r"[^\w\s-]", "", text).replace(" ", "-")


async def seed_problems(session: AsyncSession) -> int:
    """
    Idempotent database seeder for initial coding problems and test cases.
    Does not duplicate existing records.
    """
    # 1. Collect all tags
    all_tag_names = set()
    for p in SEED_PROBLEMS:
        for t in p["tags"]:
            all_tag_names.add(t)

    # Fetch existing tags
    result = await session.execute(select(Tag))
    existing_tags = {tag.name: tag for tag in result.scalars().all()}

    # Insert missing tags
    for tag_name in all_tag_names:
        if tag_name not in existing_tags:
            new_tag = Tag(name=tag_name, slug=slugify(tag_name))
            session.add(new_tag)
            existing_tags[tag_name] = new_tag

    await session.flush()

    # 2. Insert or update problems
    seeded_count = 0
    for p_data in SEED_PROBLEMS:
        result = await session.execute(
            select(Problem).where(Problem.slug == p_data["slug"])
        )
        existing_problem = result.scalar_one_or_none()

        tag_objs = [existing_tags[t_name] for t_name in p_data["tags"]]

        if not existing_problem:
            problem = Problem(
                slug=p_data["slug"],
                title=p_data["title"],
                difficulty=p_data["difficulty"],
                description=p_data["description"],
                input_format=p_data["input_format"],
                output_format=p_data["output_format"],
                constraints=p_data["constraints"],
                examples=p_data["examples"],
                starter_code=p_data["starter_code"],
                is_published=p_data["is_published"],
                tags=tag_objs,
            )
            session.add(problem)
            seeded_count += 1
            target_problem = problem
        else:
            # Update fields in-place idempotently
            existing_problem.title = p_data["title"]
            existing_problem.difficulty = p_data["difficulty"]
            existing_problem.description = p_data["description"]
            existing_problem.input_format = p_data["input_format"]
            existing_problem.output_format = p_data["output_format"]
            existing_problem.constraints = p_data["constraints"]
            existing_problem.examples = p_data["examples"]
            existing_problem.starter_code = p_data["starter_code"]
            existing_problem.is_published = p_data["is_published"]
            existing_problem.tags = tag_objs
            target_problem = existing_problem

        await session.flush()

        # Seed sample and hidden test cases for judge execution
        tc_check = await session.execute(
            select(TestCase).where(TestCase.problem_id == target_problem.id)
        )
        existing_tc_list = tc_check.scalars().all()
        if not existing_tc_list:
            order = 0
            for ex in p_data.get("examples", []):
                session.add(
                    TestCase(
                        problem_id=target_problem.id,
                        input_data=ex["input"],
                        expected_output=ex["output"],
                        is_sample=True,
                        explanation=ex.get("explanation"),
                        order=order,
                    )
                )
                order += 1

            for hidden in HIDDEN_TEST_CASES.get(p_data["slug"], []):
                session.add(
                    TestCase(
                        problem_id=target_problem.id,
                        input_data=hidden["input"],
                        expected_output=hidden["output"],
                        is_sample=False,
                        explanation="Hidden test case for judge evaluation.",
                        order=order,
                    )
                )
                order += 1

    await session.commit()
    return seeded_count


async def main():
    async with async_session_maker() as session:
        count = await seed_problems(session)
        print(f"Successfully seeded {count} problems.")


if __name__ == "__main__":
    asyncio.run(main())
