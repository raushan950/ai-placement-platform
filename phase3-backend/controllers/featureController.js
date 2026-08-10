const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const ResumeReport = require('../models/ResumeReport');
const InterviewSession = require('../models/InterviewSession');
const MockTestSession = require('../models/MockTestSession');
const CodeSubmission = require('../models/CodeSubmission');
const Experience = require('../models/Experience');
const { callGemini } = require('../utils/gemini');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { executeCodeOnSandbox } = require('../utils/judge0');

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
    const parsedData = JSON.parse(aiText);

    // Save report in DB for authenticated users
    if (req.user && req.user.id) {
      const report = new ResumeReport({
        userId: req.user.id,
        targetCompany,
        jobDescription,
        scores: parsedData.scores,
        quick_evaluation: parsedData.quick_evaluation,
        strengths: parsedData.strengths,
        weaknesses: parsedData.weaknesses,
        missing_skills: parsedData.missing_skills,
        suggestions: parsedData.suggestions,
        ats_optimization: parsedData.ats_optimization,
        jd_match: parsedData.jd_match,
        company_readiness: parsedData.company_readiness,
        bullet_rewrites: parsedData.bullet_rewrites
      });
      await report.save();
    }

    res.json(parsedData);
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
  const { company, level, type, difficulty, history, format, subject, source } = req.body;
  try {
    let resumeText = '';
    if (source === 'resume' && req.user && req.user.id) {
       const latestResume = await ResumeReport.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
       if (latestResume) {
          resumeText = `
          Candidate's Resume Profile Data:
          Target Company: ${latestResume.targetCompany || 'General'}
          Strengths: ${latestResume.strengths ? latestResume.strengths.join(', ') : ''}
          Weaknesses: ${latestResume.weaknesses ? latestResume.weaknesses.join(', ') : ''}
          Missing Skills: ${latestResume.missing_skills ? latestResume.missing_skills.join(', ') : ''}
          Experience Bullet Points: ${latestResume.bullet_rewrites ? latestResume.bullet_rewrites.map(b => b.original).join('; ') : ''}
          `;
       } else {
          return res.status(400).json({ error: "No analyzed resume found. Please upload and analyze your resume in the Resume Analyzer first to start Resume Grill Mode!" });
       }
    }

    let prompt;
    const activeSubject = subject && subject !== 'All DSA Subjects' ? subject : 'General Data Structures & Algorithms';

    if (type === 'DSA') {
       if (format === 'oral') {
         prompt = `You are an expert technical recruiter conducting a verbal technical interview for ${company}.
         ${resumeText ? `Tailor the question specifically based on the candidate's projects or skills listed in their resume:
         ${resumeText}` : ''}
         Generate exactly ONE conceptual or algorithmic design question regarding the DSA subject: "${activeSubject}".
         Difficulty: ${difficulty}.
         The question should ask the candidate to explain their approach, logic, trade-offs, or complexity verbally.
         Do not ask them to write code.
         Examples: "Explain how a Red-Black tree maintains balance," "Describe how to detect a cycle in a directed graph," "How does a hash map resolve collisions under the hood?"
         Previously Asked: ${history ? history.join('|') : 'None'}
         Return ONLY valid JSON in this exact structure:
         {
           "type": "DSA",
           "question": "Conceptual DSA question text here"
         }`;
       } else {
         prompt = `You are an expert Competitive Programming setter and interviewer for ${company}.
         ${resumeText ? `Tailor the coding challenge specifically based on the candidate's projects or skills listed in their resume:
         ${resumeText}` : ''}
        Generate a ${difficulty} difficulty Data Structures and Algorithms programming challenge regarding the subject: "${activeSubject}".
        The generated question MUST NOT have been asked before: ${history ? history.join('|') : 'None'}
        Return ONLY valid JSON in this exact structure:
        {
          "type": "DSA",
          "title": "Title of problem",
          "description": "Provide a comprehensive, detailed LeetCode-style description focusing on the subject ${activeSubject}. Specify parameters, outputs, and edge cases.",
          "constraints": ["Constraint 1", "Constraint 2"],
          "examples": [
              { "input": "...", "output": "...", "explanation": "Step-by-step trace." }
          ],
          "testcases": [
              { "input": "...", "expected_output": "...", "hidden": false },
              { "input": "...", "expected_output": "...", "hidden": false },
              { "input": "...", "expected_output": "...", "hidden": true }
          ],
          "templates": {
              "cpp": "class Solution {\npublic:\n    int solve(vector<int>& A, int K) {\n        // write code here\n    }\n};",
              "java": "class Solution {\n    public int solve(int[] A, int K) {\n        // write code here\n    }\n}",
              "python": "class Solution:\n    def solve(self, A, K):\n        # write code here\n        pass",
              "javascript": "class Solution {\n    solve(A, K) {\n        // write code here\n    }\n}"
          },
          "optimal_solution": {
              "cpp": "class Solution {\npublic:\n    int solve(vector<int>& A, int K) {\n        // complete working solution\n    }\n};",
              "explanation": "Approach analysis detailing time complexity and space complexity."
          }
        }
        Important Rules:
        1. The "templates" object MUST contain ONLY the empty starter code (function signature).
        2. The "optimal_solution" object MUST contain the full working implementation and a brief string explanation of the strategy.
        3. DO NOT use LaTeX math formatting symbols (e.g. no $ signs). Use standard markdown formatting.
        4. Every string inside the JSON must be properly escaped. Do NOT write unescaped double quotes inside value strings. Use single quotes or escape them as \\\" if necessary.
        5. Return ONLY raw JSON. No prefix text, no comments, no markdown fences.`;
       }
    } else {
       prompt = `You are an expert AI interviewer for ${company}. 
       ${resumeText ? `Specifically grill the candidate on their resume projects, experience, or listed skills:
       ${resumeText}` : ''}
       Generate exactly ONE ${difficulty} interview question.
       Type: ${type} (Technical Core or HR).
       Previously Asked: ${history ? history.join('|') : 'None'}
       Return ONLY valid JSON:
       {"type": "${type}", "question": "The question text here"}`;
    }
    const aiText = await callGemini(prompt, true);
    let parsedData;
    try {
      parsedData = JSON.parse(aiText);
    } catch (e) {
      console.warn("Standard JSON parse failed, running clean regex formatting:", e.message);
      let clean = aiText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      parsedData = JSON.parse(clean);
    }
    res.json(parsedData);
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
  const { language, source_code, testcases, isSubmit, question, problemId, title, category, difficulty } = req.body;
  try {
    if (!language || !source_code || !testcases || testcases.length === 0) return res.status(400).json({ error: "Missing language, source_code, or testcases" });
    
    let compileErr = null;
    let results = [];
    let feedback = "Ran on code execution simulation.";

    // Check if RAPIDAPI_KEY is configured
    const apiKey = process.env.RAPIDAPI_KEY;
    if (apiKey && apiKey !== 'your_rapidapi_key_here') {
       feedback = "Ran on secure sandbox compilation engine.";
       const testcaseSubset = isSubmit ? testcases : [testcases[0]];
       
       for (const tc of testcaseSubset) {
         const runResult = await executeCodeOnSandbox(language, source_code, tc.input);
         if (runResult) {
           if (runResult.compile_output && runResult.status.includes("Compilation Error")) {
             compileErr = runResult.compile_output;
             results.push({
               status: "Compile Error",
               input: tc.input,
               output: runResult.compile_output,
               expected: tc.expected_output || tc.expected,
               runtime: runResult.time
             });
             break; // Stop execution on compilation error
           }

           const cleanOutput = (runResult.stdout || '').trim();
           const cleanExpected = (tc.expected_output || tc.expected || '').trim();
           const isMatch = cleanOutput === cleanExpected;

           results.push({
             status: isMatch ? "Accepted" : (runResult.status.includes("Runtime Error") ? "Runtime Error" : "Wrong Answer"),
             input: tc.input,
             output: cleanOutput || runResult.stderr || "No stdout.",
             expected: cleanExpected,
             runtime: runResult.time,
             memory: runResult.memory
           });
         } else {
           throw new Error("Sandbox execution returned null");
         }
       }
    } else {
       // FALLBACK: semantic simulation using Gemini
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
       const parsed = JSON.parse(aiText);
       compileErr = parsed.compileErr;
       results = parsed.results;
       feedback = parsed.feedback || "Semantic AI evaluation completed.";
    }

    // Save Practice Problem Submission
    if (problemId && isSubmit && req.user && req.user.id) {
       let finalStatus = "Accepted";
       if (compileErr) {
          finalStatus = "Compile Error";
       } else {
          const hasFailure = results.some(r => r.status !== 'Accepted');
          if (hasFailure) {
             finalStatus = "Wrong Answer";
          }
       }
       
       const submission = new CodeSubmission({
          userId: req.user.id,
          problemId,
          title: title || 'Practice Problem',
          category: category || 'Arrays',
          difficulty: difficulty || 'Medium',
          code: source_code,
          language,
          status: finalStatus
       });
       await submission.save();
    }

    res.json({
      compileErr,
      results,
      feedback
    });

  } catch (err) {
    console.warn("⚠️ Sandbox failed, falling back to Gemini semantic simulation:", err.message);
    try {
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
      const parsed = JSON.parse(aiText);
      
      // Save Practice Problem Submission
      if (problemId && isSubmit && req.user && req.user.id) {
         let finalStatus = "Accepted";
         if (parsed.compileErr) {
            finalStatus = "Compile Error";
         } else {
            const hasFailure = parsed.results.some(r => r.status !== 'Accepted');
            if (hasFailure) {
               finalStatus = "Wrong Answer";
            }
         }
         
         const submission = new CodeSubmission({
            userId: req.user.id,
            problemId,
            title: title || 'Practice Problem',
            category: category || 'Arrays',
            difficulty: difficulty || 'Medium',
            code: source_code,
            language,
            status: finalStatus
         });
         await submission.save();
      }

      res.json(parsed);
    } catch (fallbackErr) {
      next(fallbackErr);
    }
  }
};

exports.generateMock = async (req, res, next) => {
  try {
    let pastTitles = [];
    if (req.user && req.user.id) {
       const pastSessions = await MockTestSession.find({ userId: req.user.id }).select('questions.title');
       pastSessions.forEach(session => {
          if (session.questions) {
             session.questions.forEach(q => {
                if (q.title) pastTitles.push(q.title);
             });
          }
       });
    }

    // Limit to latest 50 titles to avoid large payloads
    pastTitles = [...new Set(pastTitles)].slice(-50);

    const prompt = `Generate a 3-question programming mock test for a competitive tech placement assessment (Easy, Medium, Hard).
    Each question must be a Data Structures and Algorithms problem.
    The generated questions MUST be unique and DIFFERENT from these previously generated questions: ${pastTitles.length > 0 ? pastTitles.join(', ') : 'None'}.
    Return ONLY valid JSON in this structure. Do NOT use markdown code blocks or LaTeX math symbols.
    {
      "questions": [
        {
          "difficulty": "Easy",
          "title": "Title of problem 1",
          "description": "Provide a comprehensive, detailed LeetCode-style description. Specify constraints and parameters.",
          "constraints": ["Constraint 1", "Constraint 2"],
          "examples": [
              { "input": "...", "output": "...", "explanation": "Step-by-step trace." }
          ],
          "testcases": [
              { "input": "...", "expected_output": "...", "hidden": false },
              { "input": "...", "expected_output": "...", "hidden": true }
          ],
          "templates": {
              "cpp": "class Solution {\npublic:\n    int solve(vector<int>& A, int K) {\n        // write code here\n    }\n};",
              "java": "class Solution {\n    public int solve(int[] A, int K) {\n        // write code here\n    }\n}",
              "python": "class Solution:\n    def solve(self, A, K):\n        # write code here\n        pass",
              "javascript": "class Solution {\n    solve(A, K) {\n        // write code here\n    }\n}"
          },
          "optimal_solution": {
              "cpp": "class Solution {\npublic:\n    int solve(vector<int>& A, int K) {\n        // solution\n    }\n};",
              "explanation": "Brief approach description."
          }
        },
        ...
      ]
    }`;
    const aiText = await callGemini(prompt, true);
    res.json(JSON.parse(aiText));
  } catch (err) { next(err); }
};

// Resume History
exports.getResumeHistory = async (req, res, next) => {
  try {
    const reports = await ResumeReport.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

// Interview History
exports.getInterviewHistory = async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// Mock Test History
exports.getMockTestHistory = async (req, res, next) => {
  try {
    const sessions = await MockTestSession.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// Save Interview Session
exports.saveInterviewSession = async (req, res, next) => {
  try {
    const { company, type, difficulty, elapsedTime, score, conversation, questions } = req.body;
    const session = new InterviewSession({
      userId: req.user.id,
      company,
      type,
      difficulty,
      elapsedTime,
      score,
      conversation,
      questions
    });
    await session.save();
    res.json({ message: "Interview session saved successfully!", id: session._id });
  } catch (err) {
    next(err);
  }
};

// Save Mock Test Session
exports.saveMockTestSession = async (req, res, next) => {
  try {
    const { questions, score, elapsedTime } = req.body;
    const session = new MockTestSession({
      userId: req.user.id,
      questions,
      score,
      elapsedTime
    });
    await session.save();
    res.json({ message: "Mock test session saved successfully!", id: session._id });
  } catch (err) {
    next(err);
  }
};

// Conversational Voice AI chatTurn handler
exports.chatTurn = async (req, res, next) => {
  const { company, type, difficulty, conversationHistory, latestAnswer } = req.body;
  if (!latestAnswer || latestAnswer.trim() === '') {
    return res.status(400).json({ error: "Candidate answer cannot be empty." });
  }

  try {
    // We build the conversational history text for Gemini
    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`)
      .join('\n');

    const prompt = `You are a polite, helpful, but expert technical and HR interviewer conducting a mock interview for ${company}.
The candidate is interviewing for a ${difficulty} difficulty ${type} role.

Conversation history so far:
${historyText}
Candidate: ${latestAnswer}

Evaluate the candidate's latest response in the context of the conversation. 
Decide if we have enough information to conclude the interview (typically after 3 rounds or 3 user answers), or if you should ask a follow-up query to explore further.

Rules:
1. If the interview is NOT complete (less than 3 user answers/questions answered):
   - Formulate a brief, conversational response (1-2 sentences) reacting to their statement.
   - Ask ONE relevant follow-up question.
   - Set "isComplete" to false.
2. If the interview IS complete (3 or more answers received):
   - Thank the candidate politely.
   - Set "isComplete" to true.
   - Provide the final detailed scorecard evaluations in "scores" (overall, understanding, approach, clarity from 0 to 10), feedback bullet points, ideal answer, and suggestions.

Return ONLY valid JSON in this exact structure:
{
  "isComplete": false,
  "interviewerSpeech": "Brief comment reacting to candidate + follow-up question.",
  "scores": null,
  "feedback": null,
  "ideal_answer": null,
  "improvement_suggestion": null
}

If isComplete is true:
{
  "isComplete": true,
  "interviewerSpeech": "Thank you for sharing your responses. That concludes our interview session. Let me compile your performance feedback.",
  "scores": { "understanding": 8, "approach": 7, "clarity": 8, "overall": 8 },
  "feedback": ["Strengths/weaknesses feedback point 1", "Strengths/weaknesses feedback point 2"],
  "ideal_answer": { "approach_summary": "Summary of what a perfect response would be.", "key_idea": "Key concept that should be mentioned.", "time_complexity": "N/A" },
  "improvement_suggestion": "Study recommendation based on their answers."
}`;

    const aiText = await callGemini(prompt, true);
    const parsed = JSON.parse(aiText);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
};

exports.getSolvedProblems = async (req, res, next) => {
  try {
    const solved = await CodeSubmission.find({ userId: req.user.id, status: 'Accepted' });
    res.json(solved);
  } catch (err) {
    next(err);
  }
};

// Seeded experiences database fallback
const SEEDED_EXPERIENCES = [
  {
    company: "Google",
    role: "Software Development Engineer (SDE-1)",
    user: "Rohan Sharma",
    content: "Round 1 was a phone screening with a sliding window DSA question. Round 2 was technical, focusing on Graph BFS/DFS traversal (similar to finding connected components). Round 3 was Googley & Leadership round (behavioral scenarios, handling team conflicts, etc.). Preparation tip: Focus on time and space complexity explanations, they drill down a lot into optimization!",
    rating: 5,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    company: "Amazon",
    role: "SDE Intern",
    user: "Sneha Patel",
    content: "Round 1 Online Assessment: 2 coding questions (medium difficulty) + 15 behavioral questions on Amazon Leadership Principles. Round 2 Technical: Discussed my resume projects for 20 minutes, then coded a Stack-based problem (Valid Parentheses variation) and a Dynamic Programming problem (Coin Change). Be ready to explain your design decisions clearly.",
    rating: 4,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    company: "TCS",
    role: "Digital Systems Engineer",
    user: "Aravind Kumar",
    content: "TCS National Qualifier Test (NQT) followed by Technical and HR interview rounds. Technical interview was heavily focused on Database Queries (SQL joins, grouping), Core CS subjects (OS memory management, deadlock prevention), and simple coding (reverse string, prime check). HR was standard, asking about relocate preferences and group project experience.",
    rating: 4,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  }
];

// Seeded Aptitude Database
const APTITUDE_QUESTIONS = [
  {
    id: "quant-1",
    category: "Quantitative Aptitude",
    topic: "Time & Work",
    question: "A can do a piece of work in 10 days and B can do it in 15 days. How many days will they take to complete the work working together?",
    options: ["5 days", "6 days", "8 days", "12 days"],
    answerIndex: 1,
    explanation: "A's 1-day work = 1/10\nB's 1-day work = 1/15\n(A + B)'s 1-day work = 1/10 + 1/15 = (3 + 2)/30 = 5/30 = 1/6.\nTherefore, working together they will finish in 6 days."
  },
  {
    id: "quant-2",
    category: "Quantitative Aptitude",
    topic: "Profit & Loss",
    question: "A merchant buys a watch for $120 and sells it for $150. What is his profit percentage?",
    options: ["20%", "25%", "30%", "15%"],
    answerIndex: 1,
    explanation: "Cost Price (CP) = $120\nSelling Price (SP) = $150\nProfit = SP - CP = 150 - 120 = $30\nProfit % = (Profit / CP) * 100 = (30 / 120) * 100 = (1/4) * 100 = 25%."
  },
  {
    id: "quant-3",
    category: "Quantitative Aptitude",
    topic: "Speed, Time & Distance",
    question: "A train 120 meters long passes a telegraph post in 6 seconds. Find the speed of the train in km/hr.",
    options: ["72 km/hr", "60 km/hr", "80 km/hr", "90 km/hr"],
    answerIndex: 0,
    explanation: "Distance = 120 m, Time = 6 s\nSpeed = Distance / Time = 120 / 6 = 20 m/s\nTo convert m/s to km/hr, multiply by 18/5:\nSpeed = 20 * (18 / 5) = 4 * 18 = 72 km/hr."
  },
  {
    id: "logic-1",
    category: "Logical Reasoning",
    topic: "Blood Relations",
    question: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
    options: ["His own", "His son's", "His father's", "His nephew's"],
    answerIndex: 1,
    explanation: "Since the speaker has no brother or sister, 'my father's son' is himself.\nSo, the statement becomes: 'that man's father is myself'.\nTherefore, the photograph is of the man's son."
  },
  {
    id: "logic-2",
    category: "Logical Reasoning",
    topic: "Number Series",
    question: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
    options: ["7", "10", "12", "13"],
    answerIndex: 1,
    explanation: "This is an alternating addition and subtraction series.\nIn the first pattern, 3 is added (7+3=10, 8+3=11, 9+3=12).\nIn the second pattern, 2 is subtracted (10-2=8, 11-2=9, 12-2=10).\nSo, the next term is 12 - 2 = 10."
  },
  {
    id: "logic-3",
    category: "Logical Reasoning",
    topic: "Syllogism",
    question: "Statements: All bags are pockets. All pockets are pouches. Conclusions: I. All bags are pouches. II. Some pouches are pockets. Which conclusions follow?",
    options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
    answerIndex: 2,
    explanation: "Since all bags are pockets and all pockets are pouches, bags are subsets of pockets, which are subsets of pouches. Thus, all bags are pouches (I follows).\nAlso, since pockets are subsets of pouches, some pouches are pockets (II follows)."
  },
  {
    id: "verbal-1",
    category: "Verbal Ability",
    topic: "Sentence Correction",
    question: "Find the correct sentence:",
    options: [
      "Neither Rohan nor his friends is going to the seminar.",
      "Neither Rohan nor his friends are going to the seminar.",
      "Neither Rohan or his friends are going to the seminar.",
      "Neither Rohan nor his friends has gone to the seminar."
    ],
    answerIndex: 1,
    explanation: "When two subjects are joined by 'neither... nor', the verb agrees with the closer subject. Here, 'his friends' (plural) is closer to the verb, so it must be 'are' (plural)."
  },
  {
    id: "verbal-2",
    category: "Verbal Ability",
    topic: "Synonyms",
    question: "Choose the word most similar in meaning to 'Candid':",
    options: ["Secretive", "Frank", "Vague", "Guarded"],
    answerIndex: 1,
    explanation: "'Candid' means truthful, straightforward, and frank. 'Secretive' and 'guarded' are antonyms, while 'vague' means unclear."
  }
];

// Fetch all interview experiences
exports.getExperiences = async (req, res, next) => {
  try {
    let list = await Experience.find().sort({ createdAt: -1 });
    if (list.length === 0) {
      await Experience.insertMany(SEEDED_EXPERIENCES);
      list = await Experience.find().sort({ createdAt: -1 });
    }
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// Post a new interview experience
exports.saveExperience = async (req, res, next) => {
  try {
    const { company, role, content, rating } = req.body;
    if (!company || !role || !content) {
      return res.status(400).json({ error: "Company, role, and content are required." });
    }
    const user = req.user ? req.user.email.split('@')[0] : "Anonymous User";
    const exp = new Experience({
      company,
      role,
      user,
      content,
      rating: rating || 5
    });
    await exp.save();
    res.json({ message: "Interview experience posted successfully!", data: exp });
  } catch (err) {
    next(err);
  }
};

// Dynamic AI Aptitude Generator
exports.generateAptitudeQuestions = async (req, res, next) => {
  try {
    const { category, topic } = req.body;
    if (!category) return res.status(400).json({ error: "Category is required." });

    const prompt = `Generate exactly 5 different, high-quality, realistic aptitude multiple-choice questions for the category "${category}" (topic: ${topic || 'general'}).
Each question must be a challenging, placement-level quantitative or logical problem.
Format your output as a valid JSON array. Do not include markdown wraps.
Each item in the array must be an object with the following schema:
[
  {
    "id": "unique string id, e.g. apt_qa_1",
    "category": "category name matching '${category}'",
    "topic": "the specific sub-topic",
    "question": "question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0-3,
    "explanation": "A detailed step-by-step mathematical or logical explanation showing how to arrive at the correct option."
  }
]`;

    const aiText = await callGemini(prompt, true);
    const questions = JSON.parse(aiText);
    res.json(questions);
  } catch (err) {
    console.error("AI Aptitude Generation Error:", err.message);
    res.json(APTITUDE_QUESTIONS.filter(q => q.category === req.body.category));
  }
};

// Dynamic AI Project Generator
exports.generateProjectBlueprint = async (req, res, next) => {
  try {
    const { techStack, level } = req.body;
    if (!techStack || !level) {
      return res.status(400).json({ error: "TechStack and level are required." });
    }

    const prompt = `Generate a single premium, placement-tier project blueprint for a ${level}-level project using the tech stack "${techStack}".
Format your output as a valid JSON object. Do not include markdown wraps.
The object must follow this schema:
{
  "title": "A compelling, unique project title",
  "desc": "A brief but professional high-level summary of the project and its core utility",
  "tech": ["tech1", "tech2", "tech3", "tech4", "tech5"],
  "architecture": "A clean ASCII system architecture diagram showing client, API, caching/queues, and database layers aligned vertically and horizontally using plain characters like +, -, |, = and arrows",
  "roadmap": [
    { "phase": "Phase 1: Database & Core APIs Setup", "steps": "Detailed guidelines on schemas, migrations, API setup, and initial tests" },
    { "phase": "Phase 2: Auth & Middleware Logic", "steps": "Details about authorization, security headers, validation, and session handling" },
    { "phase": "Phase 3: Client Integration & State Management", "steps": "Front-end structure, context/state stores, design guidelines, and API connections" },
    { "phase": "Phase 4: Deployment & Optimization", "steps": "Performance enhancements (indexing, query tuning) and hosting configuration" }
  ],
  "valuableFor": ["Company A", "Company B", "Company C"]
}`;

    const aiText = await callGemini(prompt, true);
    const blueprint = JSON.parse(aiText);
    res.json([blueprint]);
  } catch (err) {
    console.error("AI Project Generation Error:", err.message);
    res.json([{
      title: `${techStack} ${level} Project`,
      desc: "An AI-powered development tracking portal designed to automate placement workflows.",
      tech: [techStack, "Node.js", "React.js", "MongoDB"],
      architecture: `[Client] <==> [API Gateway] <==> [Database]`,
      roadmap: [
        { phase: "Phase 1", steps: "Setup development workspace and connect db." },
        { phase: "Phase 2", steps: "Build API routing and test endpoints." }
      ],
      valuableFor: ["Google", "Amazon"]
    }]);
  }
};

// Dynamic AI Interview Experience Synthesizer
exports.generateInterviewExperience = async (req, res, next) => {
  try {
    const { company, role } = req.body;
    if (!company || !role) {
      return res.status(400).json({ error: "Company and role are required." });
    }

    const existing = await Experience.findOne({ 
      company: { $regex: new RegExp('^' + company + '$', 'i') },
      role: { $regex: new RegExp('^' + role + '$', 'i') } 
    });

    if (existing) {
      return res.json({ message: "Loaded from database", data: existing });
    }

    const prompt = `Generate a highly detailed, realistic, and insightful interview experience report for a candidate who cleared the recruitment rounds at "${company}" for the role of "${role}".
Write it from a first-person perspective (e.g. 'I recently completed the SDE-1 hiring rounds...').
Include details about:
1. Online Assessment (OA) topics and complexity.
2. Technical Interview Round 1 (specific coding questions, DSA problems, or system design topics).
3. Technical Interview Round 2 (drill-down on projects, core CS questions on OS/DBMS/Networks).
4. Googley/Behavioral Round questions and STAR formatting answers.
5. Valuable preparation tips for future candidates.

Format your output as a valid JSON object. Do not include markdown wraps.
The object must follow this schema:
{
  "company": "${company}",
  "role": "${role}",
  "user": "An anonymous user name (e.g., Alok S.)",
  "content": "Full detailed description containing all the sections described above, formatted cleanly with section titles and spacing",
  "rating": a number from 1 to 5 indicating interview toughness
}`;

    const aiText = await callGemini(prompt, true);
    const data = JSON.parse(aiText);
    
    const exp = new Experience({
      company: data.company || company,
      role: data.role || role,
      user: data.user || "Anonymous",
      content: data.content,
      rating: data.rating || 4
    });
    await exp.save();

    res.json({ message: "Experience report generated successfully!", data: exp });
  } catch (err) {
    console.error("AI Experience Generation Error:", err.message);
    res.status(500).json({ error: "Could not generate interview report. Please try again." });
  }
};

// Dynamic AI CS Tutor
exports.explainCsTopic = async (req, res, next) => {
  try {
    const { subject, topic } = req.body;
    if (!subject || !topic) {
      return res.status(400).json({ error: "Subject and topic are required." });
    }

    const prompt = `Explain the Core Computer Science topic "${topic}" in the context of the subject "${subject}" for university placements.
Format your output as a valid JSON object. Do not include markdown wraps.
The object must follow this schema:
{
  "title": "A short summary title",
  "explanation": "A concise but thorough explanation of the core concepts, working principles, and importance.",
  "flashcards": [
    { "q": "Interactive question 1 about this topic?", "a": "Precise answers to card 1" },
    { "q": "Interactive question 2 about this topic?", "a": "Precise answers to card 2" },
    { "q": "Interactive question 3 about this topic?", "a": "Precise answers to card 3" }
  ],
  "interviewTips": "High-frequency interview questions and tips to answer them during viva/tech rounds."
}`;

    const aiText = await callGemini(prompt, true);
    const parsed = JSON.parse(aiText);
    res.json(parsed);
  } catch (err) {
    console.error("AI CS tutor error:", err.message);
    res.status(500).json({ error: "Could not fetch AI tutorial. Try again." });
  }
};

// Helper: Fetch Codeforces contests using Node native https module
const fetchCodeforcesContests = () => {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get('https://codeforces.com/api/contest.list?gym=false', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'OK') {
            resolve(parsed.result);
          } else {
            reject(new Error("Codeforces API error"));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Real-world Contests API Ingest
exports.getExternalContests = async (req, res, next) => {
  try {
    const list = await fetchCodeforcesContests();
    const upcoming = list
      .filter(c => c.phase === 'BEFORE')
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
      .slice(0, 5)
      .map(c => {
        const date = new Date(c.startTimeSeconds * 1000);
        return {
          id: c.id,
          name: c.name,
          duration: `${Math.round(c.durationSeconds / 3600)} Hours`,
          startTime: date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          startsInSeconds: c.relativeTimeSeconds * -1
        };
      });
    res.json(upcoming);
  } catch (err) {
    console.error("Failed to load Codeforces contests:", err.message);
    res.json([
      { id: 43, name: "Codeforces Round 998 (Div. 2) [FALLBACK]", duration: "2 Hours", startTime: "Tuesday, July 14, 2026, 14:35 UTC", startsInSeconds: 230000 },
      { id: 44, name: "Educational Codeforces Round 172 [FALLBACK]", duration: "2 Hours", startTime: "Thursday, July 16, 2026, 14:35 UTC", startsInSeconds: 400000 }
    ]);
  }
};
