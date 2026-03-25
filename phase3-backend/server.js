require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
app.use(express.json());
app.use(cors());

// Root Route
app.get('/', (req, res) => res.send('AI Placement Assistant Core is Online!'));

// DB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placementDB')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('DB Connection Error:', err));

// User Model (Stores Streak & Progress)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  progress: { type: Map, of: Boolean, default: {} },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// --- AI HELPER FUNCTION (Google Gemini Free Tier) ---
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_free_gemini_key_here') throw new Error("Missing Gemini Key");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    })
  });
  
  if (!response.ok) throw new Error("Gemini API Error");
  const data = await response.json();
  return data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
}

const fs = require('fs');
const path = require('path');

// Load Question DB
let questionDB = {};
try {
  questionDB = JSON.parse(fs.readFileSync(path.join(__dirname, 'questionDB.json'), 'utf8'));
} catch(err) { console.error("Could not load questionDB.json"); }

// ==========================================
// 1. SMART ROADMAP GENERATOR
// ==========================================
app.post('/api/generate-roadmap', async (req, res) => {
  const { company, days, level } = req.body;
  try {
    const compLower = company.toLowerCase();
    const isProduct = ['amazon', 'google', 'microsoft', 'meta', 'apple', 'netflix', 'atlassian'].some(c => compLower.includes(c));
    const isService = ['tcs', 'infosys', 'wipro', 'cognizant', 'accenture', 'capgemini', 'hcl'].some(c => compLower.includes(c));

    // Topic prioritizations
    const productTopics = ["Arrays", "Strings", "Two Pointers & Sliding Window", "Linked List", "Trees", "Graphs", "Dynamic Programming", "System Design", "HR & Mock Interviews"];
    const serviceTopics = ["Aptitude & Reasoning", "Strings", "Arrays", "Core CS (OS, DBMS, CN)", "HR & Mock Interviews"];
    const generalTopics = Object.keys(questionDB);

    let activeTopics = isProduct ? productTopics : (isService ? serviceTopics : generalTopics);

    // AI Dynamic adjustment (if Gemini is alive, let it reorder/prioritize)
    try {
       const prompt = `Rank these topics specifically for ${company} prep: ${activeTopics.join(', ')}. Return comma separated string of the top 6 most important.`;
       const aiText = await callGemini(prompt);
       const extracted = aiText.split(',').map(s=>s.trim()).filter(t => activeTopics.includes(t));
       if(extracted.length > 2) activeTopics = [...extracted, ...activeTopics.filter(t => !extracted.includes(t))];
    } catch(err) { /* silent fallback to default activeTopics order */ }

    let roadmap = [];
    let dbPointers = {}; // Track which question index we are at for each topic
    activeTopics.forEach(t => dbPointers[t] = 0);

    // Determine practice count per day based on level
    let qPerDay = level === 'advanced' ? 4 : (level === 'intermediate' ? 3 : 2);

    for(let i=1; i<=days; i++) {
        // Distribute topics systematically
        let topicTarget = activeTopics[Math.floor((i-1) / Math.max(1, (days / activeTopics.length))) % activeTopics.length];
        
        let dailyQuestions = [];
        let srcQuestions = questionDB[topicTarget] || [];
        
        // Grab non-repeating questions
        for(let q=0; q<qPerDay; q++) {
            if(dbPointers[topicTarget] < srcQuestions.length) {
                dailyQuestions.push(srcQuestions[dbPointers[topicTarget]]);
                dbPointers[topicTarget]++;
            }
        }

        // If we ran out of questions for this topic, fallback to revising it conceptually
        let taskDesc = dailyQuestions.length > 0 
           ? `Master the standard patterns and complete the assigned questions.`
           : `Concept revision: Revise theory, past notes, and give mock tests on ${topicTarget}.`;

        roadmap.push({
            day: i,
            week: Math.ceil(i/7),
            topic: topicTarget,
            task: taskDesc,
            practice: dailyQuestions.length,
            questions: dailyQuestions
        });
    }

    res.json({ source: "Smart Recommendation Engine", roadmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. RESUME ANALYZER
// ==========================================
app.post('/api/analyze-resume', async (req, res) => {
  const { resumeText, jobDescription, targetCompany } = req.body;
  
  if (!resumeText || resumeText.trim() === '') {
    return res.status(400).json({ error: "Resume text cannot be empty. Please paste your resume." });
  }

  try {
    const prompt = `Act as an expert technical recruiter and ATS system.

Analyze this resume and return:

1. Overall score (0-100)
2. Skills score (0-100)
3. Projects score (0-100)
4. ATS score (0-100)
5. Quick Evaluation (Overall: Good/Needs Improvement, Ready for placements: Yes/No)
6. Strengths (max 5 points)
7. Weaknesses (max 5 points)
8. Missing skills
9. Suggestions (short & practical)
10. ATS Optimization (Missing keywords, resume formatting issues, suggestions for ATS improvement)
11. JD Match (only if a Job Description is provided): match score (0-100), missing keywords, suggestions.
12. Company Readiness (only if a Target Company is provided): readiness score (0-100), missing skills.
13. Bullet Rewrites: rewrite 3-5 weak bullet points from the resume into strong, professional, metric-driven statements.

Keep it concise and practical. Use bullet points only for lists. No long paragraphs.
Return ONLY valid JSON in this exact format, with no markdown formatting:
{
  "scores": {
    "overall": 0,
    "skills": 0,
    "projects": 0,
    "ats": 0
  },
  "quick_evaluation": {
    "overall": "",
    "ready_for_placements": ""
  },
  "strengths": [""],
  "weaknesses": [""],
  "missing_skills": [""],
  "suggestions": [""],
  "ats_optimization": {
    "missing_keywords": [""],
    "formatting_issues": [""],
    "suggestions": [""]
  },
  "jd_match": {
    "score": 0,
    "missing_keywords": [""],
    "suggestions": [""]
  },
  "company_readiness": {
    "score": 0,
    "missing_skills": [""]
  },
  "bullet_rewrites": [
    { "original": "", "rewritten": "" }
  ]
}

Job Description (if any):
${jobDescription ? jobDescription.substring(0, 2000) : "None provided"}

Target Company (if any):
${targetCompany || "None provided"}

Resume:
${resumeText.substring(0, 4000)}`;

    const aiText = await callGemini(prompt);
    
    try {
      const parsedData = JSON.parse(aiText);
      res.json(parsedData);
    } catch(err) {
      return res.status(500).json({ error: "Google Gemini returned an invalid format. Please try again." });
    }
    
  } catch (error) {
    if (error.message === "Missing Gemini Key") {
        return res.status(401).json({ error: "Missing GEMINI_API_KEY in backend .env file. Create a free key at Google AI Studio." });
    }
    res.status(500).json({ error: "Failed to generate AI analysis: " + error.message });
  }
});

// ==========================================
// 2B. PDF RESUME UPLOADER (MULTER)
// ==========================================
app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  try {
     if (!req.file) return res.status(400).json({ error: "No file was uploaded." });
     if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: "Currently only PDF files are supported." });
     
     const pdfData = await pdfParse(req.file.buffer);
     
     if(!pdfData.text || pdfData.text.trim() === '') {
       return res.status(400).json({ error: "Could not extract text from this PDF. It might be scanned. Please paste text manually." });
     }

     res.json({ text: pdfData.text });
  } catch (err) {
     res.status(500).json({ error: "Failed to parse PDF: " + err.message });
  }
});

// ==========================================
// 3. WEAK AREA DETECTION
// ==========================================
app.post('/api/weak-areas', async (req, res) => {
  const { completedTopics } = req.body;
  try {
    const prompt = `User has completed these topics: ${completedTopics.join(', ')}. What are critical missing software engineering placement topics they should do next? 
    Return ONLY valid JSON: {"weak_areas": [".."], "suggested_next": [".."]}`;
    const aiText = await callGemini(prompt);
    res.json(JSON.parse(aiText));
  } catch (error) {
    res.json({ weak_areas: ["Dynamic Programming", "System Design"], suggested_next: ["Study Graph Traversals"] });
  }
});

// ==========================================
// 4. INTERVIEW QUESTION GENERATOR (DYNAMIC)
// ==========================================
app.post('/api/generate-interview-question', async (req, res) => {
  const { company, level, type, difficulty, history } = req.body;
  try {
    let prompt;
    
    if (type === 'DSA') {
       prompt = `You are an expert Competitive Programming setter for ${company}.
       Generate a ${difficulty} difficulty Data Structures and Algorithms question.
       The generated question MUST NOT have been asked before: ${history ? history.join('|') : 'None'}
       
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
    } else {
       prompt = `You are an expert AI interviewer for ${company}. 
       Generate exactly ONE ${difficulty} interview question.
       Type: ${type} (Technical Core or HR).
       Previously Asked: ${history ? history.join('|') : 'None'}

       Return ONLY valid JSON:
       {"type": "${type}", "question": "The question text here"}`;
    }

    const aiText = await callGemini(prompt);
    res.json(JSON.parse(aiText));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// ==========================================
// 4B. EVALUATE INTERVIEW ANSWER
// ==========================================
app.post('/api/evaluate-interview-answer', async (req, res) => {
  const { question, answer, type } = req.body;
  if (!answer || answer.trim() === '') {
    return res.status(400).json({ error: "Answer cannot be empty." });
  }

  try {
    const prompt = `Act as a polite, supportive, but highly constructive technical interviewer.
    Evaluate the candidate's answer to the following question.

    Question Type: "${type || 'General'}"
    Question: "${question}"
    Candidate's Answer: "${answer}"

    Analyze the answer specifically and provide:
    1. Granular Scores from 0 to 10 (Understanding, Approach, Clarity, Overall).
    2. Feedback: Polite, constructive, specific to their answer. If they got it wrong, gently explain why.
    3. Short Ideal Answer: Approach summary (2-3 lines), Key idea, Time Complexity (if applicable).
    4. Code Solution: Clean snippet (C++/Java/Python) ONLY if the question is DSA/Coding related, otherwise empty string.
    5. Key Takeaways: Key concept and important trick.
    6. Improvement Suggestion: Specifically what they should study next based on mistakes made.

    Return ONLY valid JSON in this exact format:
    {
      "scores": {
        "understanding": 8,
        "approach": 7,
        "clarity": 9,
        "overall": 8
      },
      "feedback": ["Point 1", "Point 2"],
      "ideal_answer": {
        "approach_summary": "...",
        "key_idea": "...",
        "time_complexity": "..."
      },
      "code_solution": "...",
      "key_takeaways": ["...", "..."],
      "improvement_suggestion": "Revise prefix sum problems"
    }`;

    const aiText = await callGemini(prompt);
    res.json(JSON.parse(aiText));
  } catch (error) {
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

// ==========================================
// 5. MOCK TEST GENERATOR
// ==========================================
app.post('/api/generate-mock', async (req, res) => {
  try {
    const prompt = `Generate a 3-question mock test for a tech interview (Easy, Medium, Hard). 
    Return ONLY valid JSON: {"questions": [{"difficulty": "Easy", "title": "...", "description": "..."}]}`;
    const aiText = await callGemini(prompt);
    res.json(JSON.parse(aiText));
  } catch (error) {
    res.json({ questions: [{difficulty: "Easy", title: "FizzBuzz", description: "Standard FizzBuzz implementation"}] });
  }
});

// ==========================================
// 6. CODE EXECUTION (PISTON API PROXY)
// ==========================================
app.post('/api/execute-code', async (req, res) => {
  const { language, source_code, driver_code, stdin } = req.body;

  try {
    const final_code = driver_code ? driver_code.replace('<USER_CODE>', source_code) : source_code;
    
    // Piston v2 API Payload
    const payload = { 
        language: language,
        version: "*",
        files: [{ content: final_code }],
        stdin: stdin || ""
    };

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.run) {
        res.json({
            status: "success",
            output: data.run.stdout,
            error: data.run.stderr || (data.compile ? data.compile.stderr : ""),
            stdout: data.run.stdout,
            stderr: data.run.stderr,
            compile_output: data.compile ? data.compile.stderr : ""
        });
    } else {
        res.status(500).json({ error: data.message || "Failed to execute on Piston API" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to connect to Code Execution Server (Piston)." });
  }
});

// Auth & Progress Tracking (Dashboard & Streak)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_placement_ai';

// Middleware to verify Auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access Denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid Token" });
    req.user = user;
    next();
  });
};

// 6. AUTHENTICATION ROUTES
// ==========================================
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, email: user.email, streak: user.streak, progress: user.progress } });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Update streak on login if they return next day
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000) user.streak = 1;
    user.lastActive = now;
    await user.save();

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, email: user.email, streak: user.streak, progress: user.progress } });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Update streak
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000 && user.streak > 0) user.streak = 1;
    user.lastActive = now;
    await user.save();

    res.json({ user: { _id: user._id, email: user.email, streak: user.streak, progress: user.progress } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post('/api/save-progress', authenticateToken, async (req, res) => {
    const { taskName, isCompleted } = req.body;
    const userId = req.user.id;
    try {
      const user = await User.findById(userId);
      if(user) {
         user.progress.set(taskName, isCompleted);
         await user.save();
         res.json({ streak: user.streak, progress: user.progress });
      } else res.status(404).json({error: "User not found"});
    } catch(err) { res.status(500).json({error: err.message}); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Active on port ${PORT}`));
