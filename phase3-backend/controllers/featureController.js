const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { callGemini } = require('../utils/gemini');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

let questionDB = {};
try {
  questionDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../questionDB.json'), 'utf8'));
} catch(err) { console.error("Could not load questionDB.json"); }

exports.generateRoadmap = async (req, res, next) => {
  try {
    const { company, days, level } = req.body;
    const compLower = company.toLowerCase();
    const isProduct = ['amazon', 'google', 'microsoft', 'meta', 'apple', 'netflix', 'atlassian'].some(c => compLower.includes(c));
    const isService = ['tcs', 'infosys', 'wipro', 'cognizant', 'accenture', 'capgemini', 'hcl'].some(c => compLower.includes(c));

    const productTopics = ["Arrays", "Strings", "Two Pointers & Sliding Window", "Linked List", "Trees", "Graphs", "Dynamic Programming", "System Design", "HR & Mock Interviews"];
    const serviceTopics = ["Aptitude & Reasoning", "Strings", "Arrays", "Core CS (OS, DBMS, CN)", "HR & Mock Interviews"];
    const generalTopics = Object.keys(questionDB);

    let activeTopics = isProduct ? productTopics : (isService ? serviceTopics : generalTopics);

    try {
       const prompt = `Rank these topics specifically for ${company} prep: ${activeTopics.join(', ')}. Return comma separated string of the top 6 most important.`;
       const aiText = await callGemini(prompt);
       const extracted = aiText.split(',').map(s=>s.trim()).filter(t => activeTopics.includes(t));
       if(extracted.length > 2) activeTopics = [...extracted, ...activeTopics.filter(t => !extracted.includes(t))];
    } catch(err) {}

    let roadmap = [];
    let dbPointers = {};
    activeTopics.forEach(t => dbPointers[t] = 0);

    let qPerDay = level === 'advanced' ? 4 : (level === 'intermediate' ? 3 : 2);

    for(let i=1; i<=days; i++) {
        let topicTarget = activeTopics[Math.floor((i-1) / Math.max(1, (days / activeTopics.length))) % activeTopics.length];
        let dailyQuestions = [];
        let srcQuestions = questionDB[topicTarget] || [];
        
        for(let q=0; q<qPerDay; q++) {
            if(dbPointers[topicTarget] < srcQuestions.length) {
                dailyQuestions.push(srcQuestions[dbPointers[topicTarget]]);
                dbPointers[topicTarget]++;
            }
        }

        let taskDesc = dailyQuestions.length > 0 
           ? `Master the standard patterns and complete the assigned questions.`
           : `Concept revision: Revise theory, past notes, and give mock tests on ${topicTarget}.`;

        roadmap.push({ day: i, week: Math.ceil(i/7), topic: topicTarget, task: taskDesc, practice: dailyQuestions.length, questions: dailyQuestions });
    }

    // NEW DB PERSISTENCE
    if (req.user && req.user.id) {
        await Roadmap.deleteMany({ userId: req.user.id });
        const newRoadmap = new Roadmap({ userId: req.user.id, targetCompany: company, targetDays: days, level, plan: roadmap });
        await newRoadmap.save();
    }

    res.json({ source: "Smart Recommendation Engine", roadmap });
  } catch (err) {
    next(err);
  }
};

exports.getMyRoadmap = async (req, res, next) => {
    try {
       const rm = await Roadmap.findOne({ userId: req.user.id });
       if (!rm) return res.json({ data: [] });
       res.json({ data: rm.plan, meta: { company: rm.targetCompany, days: rm.targetDays } });
    } catch(err) { next(err); }
};

exports.saveProgress = async (req, res, next) => {
    try {
      const { taskName, isCompleted } = req.body;
      const user = await User.findById(req.user.id);
      if(user) {
         user.progress.set(taskName, isCompleted);
         await user.save();
         res.json({ streak: user.streak, progress: user.progress });
      } else res.status(404).json({error: "User not found"});
    } catch(err) { next(err); }
};

exports.weakAreas = async (req, res, next) => {
    const { completedTopics } = req.body;
    try {
      const prompt = `User has completed these topics in their interview prep roadmap: ${completedTopics.join(', ')}. What are critical missing software engineering placement topics they should do next or are specifically weak in relative to a full prep? 
      Return ONLY valid JSON: {"weak_areas": [".."], "suggested_next": [".."]}`;
      const aiText = await callGemini(prompt, true);
      const parsed = JSON.parse(aiText);
      // Persist to user doc
      if (req.user && parsed.weak_areas) {
          await User.findByIdAndUpdate(req.user.id, { weakAreas: parsed.weak_areas });
      }
      res.json(parsed);
    } catch (err) {
      res.json({ weak_areas: ["Dynamic Programming", "System Design"], suggested_next: ["Study Graph Traversals"] });
    }
};

// ... Remaining methods (Resume Analyzer, Interview Sim, Code Exec) exactly mirrored from server.js

exports.analyzeResume = async (req, res, next) => {
  const { resumeText, jobDescription, targetCompany } = req.body;
  if (!resumeText || resumeText.trim() === '') return res.status(400).json({ error: "Resume text cannot be empty." });
  try {
    const prompt = `Act as an expert technical recruiter and ATS system.\nAnalyze this resume and return:\n1. Overall score (0-100)\n2. Skills score (0-100)\n3. Projects score (0-100)\n4. ATS score (0-100)\n5. Quick Evaluation (Overall: Good/Needs Improvement, Ready for placements: Yes/No)\n6. Strengths (max 5 points)\n7. Weaknesses (max 5 points)\n8. Missing skills\n9. Suggestions (short & practical)\n10. ATS Optimization (Missing keywords, formatting issues)\n11. JD Match (only if a Job Description is provided)\n12. Company Readiness (only if a Target Company is provided)\n13. Bullet Rewrites: rewrite 3-5 weak bullet points from the resume into strong, professional, metric-driven statements.\n\nKeep it concise and practical. Use bullet points only for lists. No long paragraphs.\nReturn ONLY valid JSON in this exact format, with no markdown formatting:\n{\n  "scores": {\n    "overall": 0,\n    "skills": 0,\n    "projects": 0,\n    "ats": 0\n  },\n  "quick_evaluation": {\n    "overall": "",\n    "ready_for_placements": ""\n  },\n  "strengths": [""],\n  "weaknesses": [""],\n  "missing_skills": [""],\n  "suggestions": [""],\n  "ats_optimization": {\n    "missing_keywords": [""],\n    "formatting_issues": [""],\n    "suggestions": [""]\n  },\n  "jd_match": {\n    "score": 0,\n    "missing_keywords": [""],\n    "suggestions": [""]\n  },\n  "company_readiness": {\n    "score": 0,\n    "missing_skills": [""]\n  },\n  "bullet_rewrites": [\n    { "original": "", "rewritten": "" }\n  ]\n}\n\nJob Description (if any):\n${jobDescription ? jobDescription.substring(0, 2000) : "None provided"}\n\nTarget Company (if any):\n${targetCompany || "None provided"}\n\nResume:\n${resumeText.substring(0, 4000)}`;
    const aiText = await callGemini(prompt, true);
    res.json(JSON.parse(aiText));
  } catch (err) { next(err); }
};

exports.uploadResume = async (req, res, next) => {
  try {
     if (!req.file) return res.status(400).json({ error: "No file was uploaded." });
     if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: "Currently only PDF files are supported." });
     const pdfData = await pdfParse(req.file.buffer);
     if(!pdfData.text || pdfData.text.trim() === '') return res.status(400).json({ error: "Could not extract text from this PDF." });
     res.json({ text: pdfData.text });
  } catch (err) { next(err); }
};

exports.generateInterviewQuestion = async (req, res, next) => {
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
             "cpp": "class Solution {\\npublic:\\n    int solve(vector<int>& A, int K) {\\n\\n    }\\n};",
             "java": "class Solution {\\n    public int solve(int[] A, int K) {\\n\\n    }\\n}",
             "python": "class Solution:\\n    def solve(self, A, K):\\n        pass",
             "javascript": "class Solution {\\n    solve(A, K) {\\n\\n    }\\n}"
         },
         "optimal_solution": {
             "cpp": "class Solution {\\n    /* properly formatted multi-line code here with \\n for newlines */\\n}",
             "explanation": "Approach analysis..."
         }
       }
       Important Rules:
       1. The "templates" object MUST contain ONLY the empty starter code (function signature).
       2. The "optimal_solution" object MUST contain the full working implementation and a brief string explanation.
       3. DO NOT use LaTeX math formatting symbols. Use standard markdown backticks.`;
    } else {
       prompt = `You are an expert AI interviewer for ${company}. 
       Generate exactly ONE ${difficulty} interview question.
       Type: ${type} (Technical Core or HR).
       Previously Asked: ${history ? history.join('|') : 'None'}
       Return ONLY valid JSON:
       {"type": "${type}", "question": "The question text here"}`;
    }
    const aiText = await callGemini(prompt, true);
    res.json(JSON.parse(aiText));
  } catch (err) { next(err); }
};

exports.evaluateInterviewAnswer = async (req, res, next) => {
  const { question, answer, type } = req.body;
  if (!answer || answer.trim() === '') return res.status(400).json({ error: "Answer cannot be empty." });
  try {
    const prompt = `Act as a polite, supportive, but highly constructive technical interviewer.
    Evaluate the candidate's answer to the following question.
    Question Type: "${type || 'General'}"
    Question: "${question}"
    Candidate's Answer: "${answer}"
    Analyze the answer specifically and provide:
    1. Granular Scores from 0 to 10.
    2. Feedback: Polite, constructive, specific to their answer.
    3. Short Ideal Answer: Approach summary.
    4. Code Solution: Clean snippet ONLY if the question is DSA/Coding related, otherwise empty string.
    5. Key Takeaways: Key concept and important trick.
    6. Improvement Suggestion: Specifically what they should study next.
    Return ONLY valid JSON in this exact format:
    {
      "scores": { "understanding": 8, "approach": 7, "clarity": 9, "overall": 8 },
      "feedback": ["Point 1", "Point 2"],
      "ideal_answer": { "approach_summary": "...", "key_idea": "...", "time_complexity": "..." },
      "code_solution": "...",
      "key_takeaways": ["...", "..."],
      "improvement_suggestion": "Revise prefix sum problems"
    }`;
    const aiText = await callGemini(prompt, true);
    res.json(JSON.parse(aiText));
  } catch (err) { next(err); }
};

exports.executeCode = async (req, res, next) => {
  const { language, source_code, testcases, isSubmit, question } = req.body;
  try {
    if (!language || !source_code || !testcases || testcases.length === 0) return res.status(400).json({ error: "Missing language, source_code, or testcases" });
    const testcaseSubset = isSubmit ? testcases : [testcases[0]];
    const prompt = `You are a strict technical interviewer evaluating a candidate's code.
    Problem Description:
    ${question?.description || "Not provided"}
    Optimal Approach:
    ${JSON.stringify(question?.optimal_solution || {})}
    Candidate Code (${language}):
    ${source_code}
    Test cases:
    ${JSON.stringify(testcaseSubset)}
    Task: Semantically analyze if the Candidate Code is a valid, correct algorithm to solve the problem description.
    Do NOT manually compute loops. Instead, look at the algorithmic correctness based on the optimal approach.
    If there is a syntax error, set compileErr to the error details and set the first testcase result to "Compile Error".
    If the logic is perfectly correct, set the testcases to "Accepted" and output the expected_output. 
    If the logic is fundamentally flawed or missing, set status to "Wrong Answer" and output an explanatory wrong output.
    Return ONLY valid JSON in this exact structure. Skip all explanations.
    {
      "compileErr": null,
      "results": [
        { "status": "Accepted", "input": "...", "output": "Actual simulated output string", "expected": "...", "runtime": "12ms" }
      ],
      "feedback": "Short 1-line actionable feedback on bugs or runtime complexity."
    }`;
    const aiText = await callGemini(prompt, true);
    res.json(JSON.parse(aiText));
  } catch (err) { next(err); }
};

exports.generateMock = async (req, res, next) => {
  try {
    const prompt = `Generate a 3-question mock test for a tech interview (Easy, Medium, Hard). 
    Return ONLY valid JSON: {"questions": [{"difficulty": "Easy", "title": "...", "description": "..."}]}`;
    const aiText = await callGemini(prompt, true);
    res.json(JSON.parse(aiText));
  } catch (err) { next(err); }
};
