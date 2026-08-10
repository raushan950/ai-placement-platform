import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

// 12 Core pre-populated placement preparation problems
const INITIAL_PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    category: 'Arrays & Hashing',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9'
    ],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
    ],
    testcases: [
      { input: '[2,7,11,15]\n9', expected_output: '[0,1]', hidden: false },
      { input: '[3,2,4]\n6', expected_output: '[1,2]', hidden: false },
      { input: '[3,3]\n6', expected_output: '[0,1]', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    twoSum(nums, target) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\''
    ],
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Correctly matches brackets.' }
    ],
    testcases: [
      { input: '"()"', expected_output: 'true', hidden: false },
      { input: '"()[]{}"', expected_output: 'true', hidden: false },
      { input: '"(]"', expected_output: 'false', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    isValid(s) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    category: 'Linked Lists',
    difficulty: 'Easy',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    constraints: [
      'The number of nodes in the list is the range [0, 5000]',
      '-5000 <= Node.val <= 5000'
    ],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reversed order of elements.' }
    ],
    testcases: [
      { input: '[1,2,3,4,5]', expected_output: '[5,4,3,2,1]', hidden: false },
      { input: '[]', expected_output: '[]', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    reverseList(head) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'merge-sorted-array',
    title: 'Merge Sorted Array',
    category: 'Sorting & Searching',
    difficulty: 'Easy',
    description: 'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively.\nMerge nums1 and nums2 into a single array sorted in non-decreasing order.',
    constraints: [
      'nums1.length == m + n',
      '0 <= m, n <= 200'
    ],
    examples: [
      { input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3', output: '[1,2,2,3,5,6]', explanation: 'Merged in-place.' }
    ],
    testcases: [
      { input: '[1,2,3,0,0,0]\n3\n[2,5,6]\n3', expected_output: '[1,2,2,3,5,6]', hidden: false },
      { input: '[1]\n1\n[]\n0', expected_output: '[1]', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    merge(nums1, m, nums2, n) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'container-with-most-water',
    title: 'Container With Most Water',
    category: 'Arrays & Hashing',
    difficulty: 'Medium',
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\nFind two lines that together with the x-axis form a container, such that the container contains the most water.',
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Max area is between vertical lines with heights 8 and 7 (width 7, area 49).' }
    ],
    testcases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expected_output: '49', hidden: false },
      { input: '[1,1]', expected_output: '1', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public int maxArea(int[] height) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    maxArea(height) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'longest-palindromic-substring',
    title: 'Longest Palindromic Substring',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'Given a string s, return the longest palindromic substring in s.',
    constraints: [
      '1 <= s.length <= 1000',
      's consists of only digits and English letters.'
    ],
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' }
    ],
    testcases: [
      { input: '"babad"', expected_output: '"bab"', hidden: false },
      { input: '"cbbd"', expected_output: '"bb"', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    string longestPalindrome(string s) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public String longestPalindrome(String s) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    longestPalindrome(s) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values. (i.e., from left to right, level by level).',
    constraints: [
      'The number of nodes in the tree is in the range [0, 2000]',
      '-1000 <= Node.val <= 1000'
    ],
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'Traverse level-by-level.' }
    ],
    testcases: [
      { input: '[3,9,20,null,null,15,7]', expected_output: '[[3],[9,20],[15,7]]', hidden: false },
      { input: '[]', expected_output: '[]', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    levelOrder(root) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'number-of-islands',
    title: 'Number of Islands',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description: 'Given an m x n 2D binary grid grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      'grid[i][j] is \'0\' or \'1\'.'
    ],
    examples: [
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3', explanation: 'There are 3 separate groups of connected land cells.' }
    ],
    testcases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expected_output: '1', hidden: false },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expected_output: '3', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    numIslands(grid) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    category: 'Sorting & Searching',
    difficulty: 'Medium',
    description: 'There is an integer array nums sorted in ascending order (with distinct values).\nPrior to being passed to your function, nums is possibly rotated at an unknown pivot index k (1 <= k < nums.length).\nGiven the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.',
    constraints: [
      '1 <= nums.length <= 5000',
      '-10^4 <= nums[i] <= 10^4',
      'All values of nums are unique.',
      '-10^4 <= target <= 10^4'
    ],
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: 'Value 0 is found at index 4.' }
    ],
    testcases: [
      { input: '[4,5,6,7,0,1,2]\n0', expected_output: '4', hidden: false },
      { input: '[4,5,6,7,0,1,2]\n3', expected_output: '-1', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    search(nums, target) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    category: 'Linked Lists',
    difficulty: 'Hard',
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\nMerge all the linked-lists into one sorted linked-list and return it.',
    constraints: [
      'k == lists.length',
      '0 <= k <= 10^4',
      '0 <= lists[i].length <= 500',
      '-10^4 <= lists[i][j] <= 10^4'
    ],
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'All elements merged and sorted.' }
    ],
    testcases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', expected_output: '[1,1,2,3,4,4,5,6]', hidden: false },
      { input: '[]', expected_output: '[]', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    mergeKLists(lists) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'edit-distance',
    title: 'Edit Distance',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    description: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\nYou have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character',
    constraints: [
      '0 <= word1.length, word2.length <= 500',
      'word1 and word2 consist of lowercase English letters.'
    ],
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse -> rorse (replace \'h\' with \'r\') -> rose (remove \'r\') -> ros (remove \'e\')' }
    ],
    testcases: [
      { input: '"horse"\n"ros"', expected_output: '3', hidden: false },
      { input: '"intention"\n"execution"', expected_output: '5', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public int minDistance(String word1, String word2) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    minDistance(word1, word2) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'sliding-window-maximum',
    title: 'Sliding Window Maximum',
    category: 'Stacks & Queues',
    difficulty: 'Hard',
    description: 'You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position.\nReturn the max sliding window.',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
      '1 <= k <= nums.length'
    ],
    examples: [
      { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]', explanation: 'Window positions and max: [1 3 -1] -> 3, [3 -1 -3] -> 3, [-1 -3 5] -> 5, etc.' }
    ],
    testcases: [
      { input: '[1,3,-1,-3,5,3,6,7]\n3', expected_output: '[3,3,5,5,6,7]', hidden: false },
      { input: '[1]\n1', expected_output: '[1]', hidden: true }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    maxSlidingWindow(nums, k) {\n        // Write JavaScript code here\n    }\n}'
    }
  }
];

export default function Problems() {
  const [problems, setProblems] = useState(INITIAL_PROBLEMS);
  const [solvedTitles, setSolvedTitles] = useState([]);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Selected Problem Workspace
  const [activeProblem, setActiveProblem] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('cpp');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Tabs for compiler feedback
  const [activeTabLeft, setActiveTabLeft] = useState('description');
  const [activeTabRight, setActiveTabRight] = useState('testcases');
  const [customInput, setCustomInput] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Stats calculation
  const totalCount = problems.length;
  const solvedCount = problems.filter(p => solvedTitles.includes(p.title)).length;
  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const easySolved = problems.filter(p => p.difficulty === 'Easy' && solvedTitles.includes(p.title)).length;

  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const mediumSolved = problems.filter(p => p.difficulty === 'Medium' && solvedTitles.includes(p.title)).length;

  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;
  const hardSolved = problems.filter(p => p.difficulty === 'Hard' && solvedTitles.includes(p.title)).length;

  // Load user solved problems list from backend
  const loadSolvedStatus = async () => {
    try {
      const data = await fetchAPI('/solved-problems');
      if (data && !data.error) {
        setSolvedTitles(data.map(sub => sub.title));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSolvedStatus();
  }, []);

  // Filter problems array
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const isSolved = solvedTitles.includes(p.title);
    const matchesStatus = selectedStatus === 'All' || 
                          (selectedStatus === 'Solved' && isSolved) || 
                          (selectedStatus === 'Unsolved' && !isSolved);
    return matchesSearch && matchesDiff && matchesCat && matchesStatus;
  });

  // Dynamic AI Problem Generator
  const generateNewAiProblem = async () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    toast.loading("Generating custom placement DSA problem...");

    try {
      const data = await fetchAPI('/generate-interview-question', {
        company: 'Premium Tech Firm',
        level: 'intermediate',
        type: 'DSA',
        difficulty: 'Medium',
        format: 'written',
        subject: selectedCategory !== 'All' ? selectedCategory : 'Dynamic Programming',
        history: problems.map(p => p.title)
      });

      toast.dismiss();
      if (data && !data.error && data.title) {
        const newProb = {
          id: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: data.title,
          category: selectedCategory !== 'All' ? selectedCategory : 'Dynamic Programming',
          difficulty: 'Medium',
          description: data.description,
          constraints: data.constraints || [],
          examples: data.examples || [],
          testcases: data.testcases || [],
          templates: data.templates || {
            cpp: 'class Solution {\npublic:\n    int solve() {\n        // code\n    }\n};',
            python: 'class Solution:\n    def solve(self):\n        pass'
          }
        };
        setProblems([newProb, ...problems]);
        toast.success(`Generated: "${data.title}"!`);
      } else {
        toast.error("Could not generate problem. Try again.");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Generation service failed.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Open Problem
  const openProblemWorkspace = (prob) => {
    setActiveProblem(prob);
    setEditorLanguage('cpp');
    setUserCode(prob.templates?.cpp || prob.templates?.python || '');
    setExecutionResult(null);
    setSubmitResult(null);
    setActiveTabLeft('description');
    setActiveTabRight('testcases');
  };

  // Language Change helper
  const handleLanguageChange = (lang) => {
    setEditorLanguage(lang);
    if (activeProblem && activeProblem.templates?.[lang]) {
      setUserCode(activeProblem.templates[lang]);
    }
  };

  // Run/Submit Code helper
  const executeCodeSubmit = async (submitFlag) => {
    if (!activeProblem) return;
    setIsExecuting(true);
    setExecutionResult({ status: 'Running...' });
    setActiveTabRight('result');

    try {
      const payload = {
        language: editorLanguage,
        source_code: userCode,
        testcases: activeProblem.testcases,
        isSubmit: submitFlag,
        question: activeProblem,
        // Practice Problem specific payload tags to trigger backend tracking:
        problemId: activeProblem.id,
        title: activeProblem.title,
        category: activeProblem.category,
        difficulty: activeProblem.difficulty
      };

      const data = await fetchAPI('/execute-code', payload);
      setIsExecuting(false);

      if (data && !data.error) {
        if (submitFlag) {
          setSubmitResult(data);
          const hasError = data.compileErr || data.results.some(r => r.status !== 'Accepted');
          if (!hasError) {
            toast.success("Accepted! Solution logged successfully.");
            loadSolvedStatus(); // Refresh solved list checkmarks
          } else {
            toast.error("Wrong Answer or Compile Error. Try again!");
          }
        } else {
          // Single testcase preview
          const firstRes = data.results?.[0] || {};
          setExecutionResult({
            status: firstRes.status || (data.compileErr ? 'Compile Error' : 'Unknown'),
            input: firstRes.input || activeProblem.testcases[0].input,
            output: firstRes.output || 'No output.',
            expected: firstRes.expected || activeProblem.testcases[0].expected_output,
            time: firstRes.runtime || 'N/A',
            compileErr: data.compileErr
          });
        }
      } else {
        toast.error(data?.error || "Execution failed.");
        setExecutionResult(null);
      }
    } catch (err) {
      setIsExecuting(false);
      setExecutionResult(null);
      toast.error("Could not run submission.");
    }
  };

  if (activeProblem) {
    return (
      <div className="tab-pane fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setActiveProblem(null)} style={{ padding: '8px 12px' }}>🔙 Back to List</button>
            <h2 style={{ margin: 0 }}>{activeProblem.title}</h2>
            <span className={`badge ${activeProblem.difficulty.toLowerCase()}`}>{activeProblem.difficulty}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Language:</span>
            <select value={editorLanguage} onChange={(e) => handleLanguageChange(e.target.value)} style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', color: 'white', border: '1px solid var(--border)' }}>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>

        <div className="leetcode-layout fade-in mt-3" style={{ flex: 1, minHeight: 0 }}>
          {/* LEFT: Description panel */}
          <div className="problem-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="panel-header">
              <button className={`panel-tab ${activeTabLeft === 'description' ? 'active' : ''}`} onClick={() => setActiveTabLeft('description')}>Description</button>
            </div>
            <div className="panel-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>{activeProblem.description}</p>
              
              <h4 style={{ marginTop: '24px', color: 'white' }}>Examples</h4>
              {activeProblem.examples.map((ex, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginTop: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontFamily: 'monospace' }}><strong>Input:</strong> {ex.input}</p>
                  <p style={{ margin: '0 0 8px 0', fontFamily: 'monospace' }}><strong>Output:</strong> {ex.output}</p>
                  {ex.explanation && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Explanation:</strong> {ex.explanation}</p>}
                </div>
              ))}

              <h4 style={{ marginTop: '24px', color: 'white' }}>Constraints</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                {activeProblem.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>

          {/* RIGHT: Monaco Workspace */}
          <div className="code-workspace" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="editor-container" style={{ flex: 2, minHeight: 0, position: 'relative' }}>
              <Editor
                height="100%"
                theme="vs-dark"
                language={editorLanguage === 'cpp' ? 'cpp' : editorLanguage === 'java' ? 'java' : editorLanguage === 'python' ? 'python' : 'javascript'}
                value={userCode}
                onChange={(val) => setUserCode(val)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: "'Fira Code', monospace",
                  automaticLayout: true,
                  padding: { top: 12 }
                }}
              />
            </div>

            {/* Down output tabs */}
            <div className="output-panel" style={{ flex: 1.2, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.6)' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex' }}>
                  <button className={`panel-tab ${activeTabRight === 'testcases' ? 'active' : ''}`} onClick={() => setActiveTabRight('testcases')}>Test Cases</button>
                  <button className={`panel-tab ${activeTabRight === 'result' ? 'active' : ''}`} onClick={() => setActiveTabRight('result')}>Result Console</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px' }}>
                  <button className="btn-secondary" onClick={() => executeCodeSubmit(false)} disabled={isExecuting} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Run Testcase</button>
                  <button className="btn-primary" onClick={() => executeCodeSubmit(true)} disabled={isExecuting} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>🚀 Submit Solution</button>
                </div>
              </div>

              <div className="panel-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {activeTabRight === 'testcases' && (
                  <div>
                    <span className="test-io-label">Standard Input</span>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', margin: '8px 0 0 0', color: 'white' }}>
                      {activeProblem.testcases[0]?.input}
                    </pre>
                  </div>
                )}

                {activeTabRight === 'result' && (
                  <div>
                    {isExecuting ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        <span className="spinner" style={{ display: 'inline-block', marginBottom: '8px' }}></span>
                        <p style={{ margin: 0 }}>Executing code solution in remote sandbox...</p>
                      </div>
                    ) : submitResult ? (
                      <div className={`submit-result-card ${submitResult.compileErr || submitResult.results.some(r => r.status !== 'Accepted') ? 'rejected' : 'accepted'}`}>
                        <h3 style={{ margin: 0, color: submitResult.compileErr || submitResult.results.some(r => r.status !== 'Accepted') ? 'var(--danger)' : 'var(--success)' }}>
                          {submitResult.compileErr ? 'Compile Error' : submitResult.results.some(r => r.status !== 'Accepted') ? 'Wrong Answer' : 'Accepted ✅'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 12px 0' }}>{submitResult.feedback}</p>
                        
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <span><strong>Tests Passed:</strong> {submitResult.results.filter(r => r.status === 'Accepted').length} / {submitResult.results.length}</span>
                        </div>
                      </div>
                    ) : executionResult ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Status:</strong>
                          <span className={`badge ${executionResult.status === 'Accepted' ? 'easy' : 'hard'}`}>{executionResult.status}</span>
                        </div>

                        {executionResult.compileErr ? (
                          <pre style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5', padding: '12px', borderRadius: '6px', marginTop: '12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {executionResult.compileErr}
                          </pre>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Output</span>
                              <pre style={{ margin: '4px 0 0 0', fontFamily: 'monospace', color: 'white' }}>{executionResult.output}</pre>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Expected</span>
                              <pre style={{ margin: '4px 0 0 0', fontFamily: 'monospace', color: 'var(--success)' }}>{executionResult.expected}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        <p style={{ margin: 0 }}>Run your code to preview output results here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Solved Stats Lobby Card */}
      <div className="dashboard-charts-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
        <div className="chart-card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
          {/* Progress ring using CSS gradient */}
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '50%',
            background: `conic-gradient(var(--success) ${progressPercent}%, rgba(255,255,255,0.05) ${progressPercent}% 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '69px',
              height: '69px',
              borderRadius: '50%',
              background: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{progressPercent}%</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>SOLVED</span>
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>Problems Library</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Solved <strong>{solvedCount}</strong> out of <strong>{totalCount}</strong> coding challenges
            </p>
          </div>
        </div>

        {/* Categories statistics check counts */}
        <div className="chart-card glass-panel" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--success)', display: 'block', fontSize: '1.4rem', fontWeight: 800 }}>{easySolved} / {easyCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🟢 Easy Problems</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--warning)', display: 'block', fontSize: '1.4rem', fontWeight: 800 }}>{mediumSolved} / {mediumCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🟡 Medium Problems</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--danger)', display: 'block', fontSize: '1.4rem', fontWeight: 800 }}>{hardSolved} / {hardCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔴 Hard Problems</span>
          </div>
        </div>
      </div>

      {/* Adaptive Recommendations Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,0,0,0))', border: '1px solid var(--primary-glow)' }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎯</span> Recommended Placement Patterns (Adaptive Recommendations)
        </h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Based on your coding history, focus on these unsolved standard placement patterns to strengthen your weak areas:
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {problems
            .filter(p => !solvedTitles.includes(p.title))
            .slice(0, 2)
            .map(p => (
              <div 
                key={p.id} 
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flex: 1,
                  minWidth: '280px'
                }}
              >
                <div>
                  <strong style={{ color: 'white', display: 'block', fontSize: '0.92rem' }}>{p.title}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Category: <strong>{p.category}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${p.difficulty.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{p.difficulty}</span>
                  <button className="btn-primary" onClick={() => openProblemWorkspace(p)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Solve</button>
                </div>
              </div>
            ))
          }
          {problems.filter(p => !solvedTitles.includes(p.title)).length === 0 && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
              🎉 Incredible job! You have solved all problems in the library. Use "Generate AI DSA Problem" to spawn new ones.
            </p>
          )}
        </div>
      </div>

      {/* 2. Filter Controls Dashboard */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <input 
              type="text" 
              placeholder="🔍 Search problem title or tag..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', minWidth: '240px' }}
            />
            
            <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <option value="All">All Categories</option>
              <option value="Arrays & Hashing">Arrays & Hashing</option>
              <option value="Stacks & Queues">Stacks & Queues</option>
              <option value="Linked Lists">Linked Lists</option>
              <option value="Sorting & Searching">Sorting & Searching</option>
              <option value="Trees & Graphs">Trees & Graphs</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
            </select>

            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <option value="All">All Statuses</option>
              <option value="Solved">Solved</option>
              <option value="Unsolved">Unsolved</option>
            </select>
          </div>

          <button className="btn-primary" onClick={generateNewAiProblem} disabled={isAiGenerating} style={{ padding: '11px 20px', borderRadius: '8px' }}>
            {isAiGenerating ? '🤖 Spawning Question...' : '🤖 Generate AI DSA Problem'}
          </button>
        </div>
      </div>

      {/* 3. Problems List Table */}
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Problem Title</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Difficulty</th>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length > 0 ? (
              filteredProblems.map((prob) => {
                const isSolved = solvedTitles.includes(prob.title);
                return (
                  <tr key={prob.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '16px 20px' }}>
                      {isSolved ? <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Solved</span> : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'white' }}>{prob.title}</td>
                    <td style={{ padding: '16px 20px' }}><span className="badge secondary">{prob.category}</span></td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge ${prob.difficulty.toLowerCase()}`}>{prob.difficulty}</span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button className="btn-primary" onClick={() => openProblemWorkspace(prob)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Practice</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No coding challenges matched your filters. Click "Generate AI DSA Problem" to spawn a new one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
