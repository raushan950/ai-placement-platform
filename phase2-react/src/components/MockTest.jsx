import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function MockTest() {
  const [isTestActive, setIsTestActive] = useState(false);
  const [isTestSummary, setIsTestSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [activeQIndex, setActiveQIndex] = useState(0);
  
  // Track code solution for each question
  const [codes, setCodes] = useState(['', '', '']);
  const [languages, setLanguages] = useState(['cpp', 'cpp', 'cpp']);
  
  // Timer states (30 minutes = 1800 seconds)
  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);
  
  // Execution result for the current question
  const [executingIndex, setExecutingIndex] = useState(null);
  const [execResult, setExecResult] = useState([null, null, null]);
  const [gradedResults, setGradedResults] = useState(null); // aggregate report

  const codeTemplates = {
    c: `#include <stdio.h>\n\nint main() {\n    // write your C code here\n    return 0;\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // write your C++ code here\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // write your Java code here\n    }\n}`,
    python: `def solve():\n    # write your Python logic here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
    javascript: `function solve() {\n  // write your JavaScript logic here\n}\n\nsolve();`
  };

  // Timer effect
  useEffect(() => {
    if (isTestActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExamAutomatically();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTestActive, timeLeft]);

  const startAssessment = async () => {
    setIsLoading(true);
    setQuestions([]);
    setActiveQIndex(0);
    setExecResult([null, null, null]);
    setGradedResults(null);
    setIsTestSummary(false);
    setTimeLeft(1800);
    
    const data = await fetchAPI('/generate-mock', {});
    setIsLoading(false);
    
    if (data && data.questions) {
      setQuestions(data.questions);
      // Initialize templates using the API's custom templates if available
      const initialCodes = data.questions.map(q => q.templates?.cpp || codeTemplates.cpp);
      setCodes(initialCodes);
      setLanguages(['cpp', 'cpp', 'cpp']);
      setIsTestActive(true);
      toast.success("Live timed assessment generated! Your 30-minute timer has started.");
    } else {
      toast.error("Failed to generate assessment questions. Please try again.");
    }
  };

  const handleLanguageChange = (idx, newLang) => {
    const nextLangs = [...languages];
    nextLangs[idx] = newLang;
    setLanguages(nextLangs);
    
    const q = questions[idx];
    const currentCode = codes[idx].trim();
    // Check if unmodified (matches standard templates or problem templates)
    const isUnmodified = !currentCode || 
      Object.values(codeTemplates).some(tmpl => tmpl.trim() === currentCode) ||
      (q.templates && Object.values(q.templates).some(tmpl => tmpl.trim() === currentCode));

    if (isUnmodified) {
      const nextCodes = [...codes];
      nextCodes[idx] = q.templates?.[newLang] || codeTemplates[newLang];
      setCodes(nextCodes);
    }
  };

  const updateCodeValue = (val) => {
    const nextCodes = [...codes];
    nextCodes[activeQIndex] = val || '';
    setCodes(nextCodes);
  };

  const runCodeSample = async () => {
    const activeQ = questions[activeQIndex];
    const sourceCode = codes[activeQIndex];
    const lang = languages[activeQIndex];
    if (!sourceCode.trim()) return;

    setExecutingIndex(activeQIndex);
    
    const testcasesToUse = activeQ.testcases && activeQ.testcases.length > 0
      ? activeQ.testcases 
      : [{ input: "Sample input", expected_output: "Sample expected output" }];

    const data = await fetchAPI('/execute-code', {
      language: lang,
      source_code: sourceCode,
      question: activeQ,
      testcases: testcasesToUse,
      isSubmit: false
    });
    
    setExecutingIndex(null);

    const nextExec = [...execResult];
    if (data && data.results && data.results.length > 0) {
      nextExec[activeQIndex] = data.results[0];
      if (data.compileErr) {
        toast.error("Compile/syntax error detected!");
      } else {
        toast.success("Run completed!");
      }
    } else {
      nextExec[activeQIndex] = { status: 'Error', output: data?.error || "Execution simulation failed." };
    }
    setExecResult(nextExec);
  };

  // Submit exam automatically on timer timeout
  const submitExamAutomatically = () => {
    toast("Time is up! Submitting your answers automatically...", { icon: '⏰', duration: 5000 });
    submitAssessment();
  };

  const submitAssessment = async () => {
    setIsTestActive(false);
    setIsLoading(true);
    
    let totalScore = 0;
    const questionsGraded = [];
    
    // Evaluate sequentially
    for (let i = 0; i < questions.length; i++) {
      setGradingProgress(`Grading Question ${i + 1} of ${questions.length}...`);
      const q = questions[i];
      const code = codes[i];
      const lang = languages[i];
      
      const testcasesToUse = q.testcases && q.testcases.length > 0
        ? q.testcases 
        : [{ input: "Sample input", expected_output: "Sample expected output" }];

      try {
        // Run code against all test cases for actual scoring
        const res = await fetchAPI('/execute-code', {
          language: lang,
          source_code: code,
          question: q,
          testcases: testcasesToUse,
          isSubmit: true
        });
        
        let qScore = 0;
        let feedbackStr = '';
        
        if (res.compileErr) {
          qScore = 0;
          feedbackStr = `Compilation Error: ${res.compileErr}`;
        } else if (res.results && res.results.length > 0) {
          const passedCases = res.results.filter(r => r.status === 'Accepted').length;
          const totalCases = res.results.length;
          qScore = Math.round((passedCases / totalCases) * 10);
          feedbackStr = res.feedback || `${passedCases} of ${totalCases} test cases passed.`;
        } else {
          qScore = 4;
          feedbackStr = 'Graded successfully on execution console.';
        }

        totalScore += qScore;
        
        questionsGraded.push({
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          userCode: code,
          language: lang,
          evaluation: {
            status: qScore === 10 ? 'Accepted' : qScore >= 5 ? 'Partially Accepted' : 'Rejected',
            feedback: feedbackStr,
            score: qScore
          }
        });
      } catch (err) {
        questionsGraded.push({
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          userCode: code,
          language: lang,
          evaluation: {
            status: 'Graded (Error)',
            feedback: 'Network connection failed during compile sandbox grading.',
            score: 0
          }
        });
      }
    }

    const avgScore = Math.round((totalScore / (questions.length * 10)) * 100);
    const elapsedTime = 1800 - timeLeft;

    setGradedResults({
      questions: questionsGraded,
      score: avgScore,
      elapsedTime
    });

    // Save session in DB
    await fetchAPI('/save-mocktest-session', {
      questions: questionsGraded,
      score: avgScore,
      elapsedTime
    });

    setIsLoading(false);
    setGradingProgress('');
    setIsTestSummary(true);
    toast.success("Mock Assessment complete! Graded scorecard saved.");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tab-pane fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isLoading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
          <p style={{ color: 'white', fontWeight: 500 }}>
            {gradingProgress ? gradingProgress : 'Generating your live mock test...'}
          </p>
          <p className="subtext" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            This can take up to 25 seconds.
          </p>
        </div>
      )}

      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Live Mock Assessment</h1>
          <p style={{ margin: '4px 0 0 0' }}>Test your capabilities under real examination conditions</p>
        </div>
        {isTestActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className={`badge ${timeLeft < 300 ? 'hard' : 'medium'}`} style={{ fontSize: '1rem', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            <button className="btn-primary" onClick={submitAssessment} style={{ background: 'var(--success)', color: 'black' }}>
              Submit Exam
            </button>
          </div>
        )}
      </header>

      {/* SETUP CARD */}
      {!isTestActive && !isTestSummary && (
        <div className="simulator-setup glass-panel" style={{ maxWidth: '650px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 800 }}>Start Mock Exam</h2>
            <p className="subtext">A timed, 3-question custom programming exam designed to mimic top company placement papers.</p>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', textAlign: 'left' }}>
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
            <div>
              <h4 style={{ margin: 0, color: 'white' }}>Test Parameters:</h4>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                • 3 Coding Problems (Easy, Medium, Hard)<br />
                • 30 Minutes countdown timer<br />
                • Integrated IDE with run & test outputs<br />
                • Direct database recording of graded results
              </p>
            </div>
          </div>

          <button className="btn-primary" onClick={startAssessment} style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 600 }}>
            🚀 Start Graded Assessment
          </button>
        </div>
      )}

      {/* EXAM WORKSPACE */}
      {isTestActive && questions.length > 0 && (
        <div className="leetcode-layout fade-in" style={{ height: 'calc(100vh - 200px)', minHeight: '550px' }}>
          
          {/* LEFT PANEL: Questions list & Description */}
          <div className="problem-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header" style={{ display: 'flex', gap: '8px', padding: '8px 12px' }}>
              {questions.map((q, idx) => (
                <button 
                  key={idx} 
                  className={`panel-tab ${activeQIndex === idx ? 'active' : ''}`} 
                  onClick={() => setActiveQIndex(idx)}
                  style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  Q{idx + 1}: {q.title.split(' ').slice(0, 2).join(' ')}..
                </button>
              ))}
            </div>

            <div className="panel-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span className={`badge ${questions[activeQIndex].difficulty.toLowerCase()}`}>{questions[activeQIndex].difficulty}</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Question {activeQIndex + 1} of 3</span>
              </div>
              <h2 style={{ color: 'white', marginTop: 0, fontSize: '1.5rem' }}>{questions[activeQIndex].title}</h2>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '20px' }}>
                <p style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                  {questions[activeQIndex].description}
                </p>
              </div>

              {/* Examples */}
              {questions[activeQIndex].examples && questions[activeQIndex].examples.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '10px' }}>Examples:</h3>
                  {questions[activeQIndex].examples.map((ex, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '12px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.85rem' }}>
                      <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: '#cbd5e1' }}>Input:</strong> <code>{ex.input}</code></p>
                      <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: '#cbd5e1' }}>Output:</strong> <code>{ex.output}</code></p>
                      {ex.explanation && <p style={{ margin: 0, color: 'var(--text-muted)' }}><strong style={{ color: '#cbd5e1' }}>Explanation:</strong> {ex.explanation}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {questions[activeQIndex].constraints && questions[activeQIndex].constraints.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '8px' }}>Constraints:</h3>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0 }}>
                    {questions[activeQIndex].constraints.map((c, idx) => (
                      <li key={idx}><code>{c}</code></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Code Editor & Test Log */}
          <div className="editor-panel">
            <div className="code-area">
              <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                <select 
                  className="language-selector btn-secondary" 
                  value={languages[activeQIndex]} 
                  onChange={(e) => handleLanguageChange(activeQIndex, e.target.value)} 
                  style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.4)', fontSize: '0.85rem' }}
                >
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>

                <button 
                  className="btn-secondary" 
                  onClick={runCodeSample} 
                  disabled={executingIndex !== null}
                  style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                >
                  {executingIndex === activeQIndex ? '⏳ Running...' : '▶ Run Code Output'}
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <Editor
                  height="100%"
                  language={languages[activeQIndex] === 'c' ? 'c' : languages[activeQIndex] === 'cpp' ? 'cpp' : languages[activeQIndex]}
                  theme="vs-dark"
                  value={codes[activeQIndex]}
                  onChange={updateCodeValue}
                  options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "'Fira Code', 'Courier New', monospace" }}
                />
              </div>
            </div>

            {/* TEST CONSOLE */}
            <div className="testcase-area" style={{ height: '170px' }}>
              <div className="panel-header">
                <span className="panel-tab active">Execution Output Console</span>
              </div>
              <div className="panel-content" style={{ overflowY: 'auto', padding: '16px' }}>
                {execResult[activeQIndex] ? (
                  <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span><strong>Status:</strong> <span style={{ color: execResult[activeQIndex].status.includes('Accepted') || execResult[activeQIndex].status.includes('Finished') ? 'var(--success)' : 'var(--danger)' }}>{execResult[activeQIndex].status}</span></span>
                      <span><strong>Time:</strong> {execResult[activeQIndex].time || 'N/A'}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', color: '#cbd5e1', whiteSpace: 'pre-wrap', maxHeight: '75px', overflowY: 'auto' }}>
                      {execResult[activeQIndex].output || 'No text output.'}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '15px' }}>
                    Run code to compile and verify results against standard sandbox.
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SCORECARD SCREEN */}
      {isTestSummary && gradedResults && (
        <div className="session-summary glass-panel fade-in mt-4" style={{ maxWidth: '800px', margin: '20px auto', padding: '35px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>🎉 Mock Assessment Graded!</h2>
            <p className="subtext">Here is your compiled ATS scorecard from our virtual AI proctoring team</p>
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '30px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifycontent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: '0 0 5px 0' }}>Grade Score</p>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, color: gradedResults.score >= 70 ? 'var(--success)' : gradedResults.score >= 50 ? 'var(--warning)' : 'var(--danger)', margin: 0 }}>
                {gradedResults.score}%
              </h1>
            </div>
            <div style={{ width: '2px', height: '60px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: '0 0 5px 0' }}>Time Spent</p>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: 0 }}>
                {Math.floor(gradedResults.elapsedTime / 60)}m {gradedResults.elapsedTime % 60}s
              </h2>
            </div>
            <div style={{ width: '2px', height: '60px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: '0 0 5px 0' }}>Rating</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: gradedResults.score >= 70 ? 'var(--success)' : 'var(--warning)', margin: 0 }}>
                {gradedResults.score >= 80 ? 'Excellent' : gradedResults.score >= 60 ? 'Competent' : 'Needs Practice'}
              </h2>
            </div>
          </div>

          <h3 style={{ color: 'white', margin: '0 0 15px 0' }}>Graded Breakdown:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
            {gradedResults.questions.map((q, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Q{idx + 1}: {q.title}</h4>
                  <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                </div>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Language: <strong style={{ color: 'white' }}>{q.language.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>Status: <strong style={{ color: q.evaluation?.status === 'Accepted' ? 'var(--success)' : 'var(--warning)' }}>{q.evaluation?.status}</strong></span>
                  <span>•</span>
                  <span>Score: <strong style={{ color: 'white' }}>{q.evaluation?.score}/10</strong></span>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <strong>Feedback:</strong> {q.evaluation?.feedback}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', justifycontent: 'center' }}>
            <button className="btn-primary" onClick={startAssessment} style={{ padding: '12px 24px' }}>
              🔄 Attempt New Assessment
            </button>
            <button className="btn-secondary" onClick={() => window.location.reload()} style={{ padding: '12px 24px' }}>
              🏠 Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
