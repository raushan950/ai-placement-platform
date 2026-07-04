const fs = require('fs');
require('dotenv').config();

async function callGemini(prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_free_gemini_key_here') throw new Error("Missing Gemini Key");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
  const generationConfig = { temperature: 0.7 };
  if (isJson) {
      generationConfig.responseMimeType = "application/json";
  }

  console.log("Fetching...");
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig
    })
  });
  
  if (!response.ok) {
     const errText = await response.text();
     console.error("Gemini API Error Payload:", errText);
     throw new Error("Gemini API Error: " + response.statusText);
  }
  const data = await response.json();
  let text = data.candidates[0].content.parts[0].text;
  
  text = text.replace(/```json|```/g, '').trim();
  return text;
}

const prompt = `You are an expert Competitive Programming setter for Google.
Generate a Medium difficulty Data Structures and Algorithms question.
The generated question MUST NOT have been asked before: None

Return ONLY valid JSON in this exact structure:
{
  "type": "DSA",
  "title": "Title of problem",
  "description": "Full problem description...",
  "constraints": ["Constraint 1", "Constraint 2"],
  "examples": [
      { "input": "...", "output": "...", "explanation": "..." }
  ],
  "testcases": [
      { "input": "...", "expected_output": "...", "hidden": false },
      { "input": "...", "expected_output": "...", "hidden": false },
      { "input": "...", "expected_output": "...", "hidden": true }
  ],
  "templates": {
      "cpp": "class Solution {\\npublic:\\n    int solve(vector<int>& A, int K) {\\n        // write your code here\\n    }\\n};",
      "java": "class Solution {\\n    public int solve(int[] A, int K) {\\n        // write your code here\\n    }\\n}",
      "python": "class Solution:\\n    def solve(self, A, K):\\n        # write your code here\\n        pass",
      "javascript": "class Solution {\\n    solve(A, K) {\\n        // write your code here\\n    }\\n}"
  },
  "optimal_solution": {
      "cpp": "class Solution { ... } // fully implemented",
      "explanation": "Approach analysis..."
  },
  "driver_codes": {
      "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\n<USER_CODE>\\n\\nint main() {\\n    // read inputs matching testcases and call Solution().solve()\\n    return 0;\\n}",
      "java": "import java.util.*;\\n\\n<USER_CODE>\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        // read inputs matching testcases and call new Solution().solve()\\n    }\\n}",
      "python": "import sys\\n\\n<USER_CODE>\\n\\nif __name__ == '__main__':\\n    # read sys.stdin matching testcases and call Solution().solve()",
      "javascript": "const fs = require('fs');\\n\\n<USER_CODE>\\n\\nfunction main() {\\n    // read fs.readFileSync(0, 'utf-8') matching testcases and call new Solution().solve()\\n}\\nmain();"
  }
}
Important Rules:
1. The "templates" object MUST contain ONLY the empty starter code (function signature). DO NOT write the solution logic inside "templates". It MUST be blank inside the function block (e.g. just // write your code here).
2. The "optimal_solution" object MUST contain the full working implementation and a brief string explanation of the strategy.
3. The "driver_codes" object MUST contain the wrapper code that reads STDIN exactly matching the testcases "input", calls the Solution class method, and prints to STDOUT.
4. The exactly literal string <USER_CODE> MUST be present in each driver_code string where the Solution class should be injected.
5. Ensure the STDIN reading logic in driver_codes handles multi-line string inputs exactly as they appear in testcases.`;

callGemini(prompt, true).then(res => console.log("SUCCESS:\n", res)).catch(err => console.error("FAILED:\n", err));
