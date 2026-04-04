import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { fetchAPI } from '../utils/api';

export default function InterviewSimulator({ company }) {
  const [interviewConfig, setInterviewConfig] = useState({ type: 'DSA', difficulty: 'Medium' });
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isSessionSummary, setIsSessionSummary] = useState(false);
  
  // currentQuestion can be a string (HR/Tech) or an Object (DSA structured)
  const [currentQuestion, setCurrentQuestion] = useState(null);
  
  const [userAnswer, setUserAnswer] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('cpp');
  
  // Execution states for LeetCode layout
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabLeft, setActiveTabLeft] = useState('description'); // description, solution
  const [activeTabRight, setActiveTabRight] = useState('testcases'); // testcases, result
  const [activeTestcaseIndex, setActiveTestcaseIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  
  // Result states
  const [executionResult, setExecutionResult] = useState(null); // { status, input, output, expected, time, memory }
  const [submitResult, setSubmitResult] = useState(null); // { status, passed, total, runtime }

  const [evaluation, setEvaluation] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [evalTab, setEvalTab] = useState('explanation');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const codeTemplates = {
    c: `#include <stdio.h>\n\nint main() {\n    // write your code here\n    \n    return 0;\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // write your code here\n    \n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // write your code here\n        \n    }\n}`,
    python: `def solve():\n    # write your logic here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
    javascript: `function solve() {\n  // write your logic here\n  \n}\n\nsolve();`
  };

  useEffect(() => {
    let interval;
    if (isInterviewActive && !evaluation && !submitResult) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isInterviewActive, evaluation, submitResult]);
  
  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setEditorLanguage(lang);
    
    // Auto-swap template if user hasn't typed anything custom
    const isUnmodified = !userAnswer.trim() || 
       Object.values(codeTemplates).includes(userAnswer.trim()) || 
       (currentQuestion?.templates && Object.values(currentQuestion.templates).includes(userAnswer.trim()));
       
    if (isUnmodified) {
      setUserAnswer(currentQuestion?.templates?.[lang] || codeTemplates[lang]);
    }
  };

  const startInterview = async () => {
    if (!company) { alert("Please set a Target Company in the Dashboard first!"); return; }
    setIsLoading(true);
    setSessionHistory([]);
    setIsSessionSummary(false);
    setUserAnswer('');
    setEvaluation(null);
    setAiFeedback(null);
    setExecutionResult(null);
    setSubmitResult(null);
    setElapsedTime(0);
    setShowSolution(false);
    await fetchNextQuestion([]);
    setIsInterviewActive(true);
    setIsLoading(false);
  };

  const fetchNextQuestion = async (historyDocs) => {
    setIsLoading(true);
    setEvaluation(null);
    setAiFeedback(null);
    setExecutionResult(null);
    setSubmitResult(null);
    setElapsedTime(0);
    setActiveTabLeft('description');
    setActiveTabRight('testcases');

    const data = await fetchAPI('/generate-interview-question', {
      company: company || 'Tech Company',
      level: 'intermediate',
      type: interviewConfig.type,
      difficulty: interviewConfig.difficulty,
      history: historyDocs
    });
    
    if (data && data.error) {
       alert(data.error);
       setIsInterviewActive(false);
       setIsLoading(false);
       return;
    }

    // If it's DSA, the prompt returns structured JSON object directly.
    // If HR/Tech, it returns { question: "..." }
    if (data) {
       const qData = interviewConfig.type === 'DSA' ? data : data.question;
       setCurrentQuestion(qData);
       
       if (interviewConfig.type === 'DSA') {
           setUserAnswer(data.templates?.[editorLanguage] || codeTemplates[editorLanguage]);
           if (data.testcases && data.testcases.length > 0) {
               setCustomInput(data.testcases[0].input || '');
           }
       } else {
           setUserAnswer('');
       }
    }
    setIsLoading(false);
  };

  // ----------------------------------------------------------------------------------
  // LEETCODE EXECUTION LOGIC (DSA)
  // ----------------------------------------------------------------------------------
  const runCodeCustom = async () => {
    if (!userAnswer.trim()) return;
    setIsExecuting(true);
    setActiveTabRight('result');
    setExecutionResult({ status: 'Running...', time: '-', memory: '-' });
    setAiFeedback(null);
    
    try {
      const data = await fetchAPI('/execute-code', {
        language: editorLanguage,
        source_code: userAnswer,
        question: currentQuestion,
        testcases: [{ input: customInput, expected_output: currentQuestion?.testcases?.[activeTestcaseIndex]?.expected_output || '?' }],
        isSubmit: false
      });

      if (data && data.results && data.results.length > 0) {
          const res = data.results[0];
          setExecutionResult({ 
             status: res.status || (data.compileErr ? 'Runtime Error' : 'Finished'),
             input: res.input, 
             output: res.output, 
             expected: res.expected,
             time: res.runtime || '0ms',
             memory: '-'
          });
          if (res.status === 'Compile Error' || res.status === 'Runtime Error') {
              setExecutionResult(prev => ({...prev, compileErr: res.output || data.compileErr}));
          }
          if (data.feedback) setAiFeedback(data.feedback);
      } else {
          setExecutionResult({ status: 'Error', output: data?.error || data?.message || "Failed to simulate execution." });
      }
    } catch (err) {
      setExecutionResult({ status: 'Network Error', output: "Could not reach backend." });
    }
    setIsExecuting(false);
  };

  const submitCodeDSA = async () => {
     if (!userAnswer.trim() || !currentQuestion?.testcases) return;
     setIsExecuting(true);
     setActiveTabRight('result');
     setExecutionResult({ status: 'Judging...', time: '-', memory: '-' });
     setSubmitResult(null);
     setAiFeedback(null);
     
     try {
       const data = await fetchAPI('/execute-code', {
          language: editorLanguage,
          source_code: userAnswer,
          question: currentQuestion,
          testcases: currentQuestion.testcases,
          isSubmit: true
       });

       if (data && data.results) {
           let passed = 0;
           const total = currentQuestion.testcases.length;
           let firstFailedResult = null;
           
           for (let i = 0; i < total; i++) {
               const res = data.results[i];
               if (!res) continue;
               
               if (res.status === 'Accepted') {
                   passed++;
               } else if (!firstFailedResult) {
                   firstFailedResult = {
                       input: currentQuestion.testcases[i]?.hidden ? 'Hidden Testcase' : res.input,
                       output: res.output,
                       expected: res.expected,
                       hidden: currentQuestion.testcases[i]?.hidden,
                       compileErr: (res.status === 'Compile Error' || res.status === 'Runtime Error') ? (res.output || data.compileErr) : data.compileErr
                   };
                   break; // Stop evaluating on first failure like LeetCode
               }
           }
           
           if (passed === total) {
              setSubmitResult({ status: 'Accepted', passed, total, time: data.results[0]?.runtime || '10ms' });
           } else {
              setSubmitResult({ 
                 status: firstFailedResult?.compileErr ? 'Runtime Error' : 'Wrong Answer', 
                 passed, total, 
                 failedCase: firstFailedResult 
              });
           }
           if (data.feedback) setAiFeedback(data.feedback);
       } else {
           setSubmitResult({ status: 'Error', passed: 0, total: currentQuestion.testcases.length, failedCase: { compileErr: data?.error || "AI simulation failed."} });
       }
     } catch(err) {
       setSubmitResult({ status: 'Network Error', passed: 0, total: currentQuestion.testcases.length });
     }
     setIsExecuting(false);
  };

  // ----------------------------------------------------------------------------------
  // OLD API SUBMIT FOR HR/TECH
  // ----------------------------------------------------------------------------------
  const submitAnswerText = async () => {
    if (!userAnswer.trim()) return;
    setIsLoading(true);
    const data = await fetchAPI('/evaluate-interview-answer', {
      question: currentQuestion,
      answer: userAnswer,
      type: interviewConfig.type
    });
    if (data) setEvaluation(data);
    setIsLoading(false);
  };

  const nextQuestion = () => {
    const qText = typeof currentQuestion === 'string' ? currentQuestion : currentQuestion.title;
    const score = interviewConfig.type === 'DSA' 
        ? (submitResult?.status === 'Accepted' ? 10 : 0) 
        : (evaluation?.scores?.overall || 0);

    const updatedHistory = [...sessionHistory, { 
       question: qText, 
       answer: userAnswer, 
       evaluation: evaluation || { scores: {overall: score} } 
    }];
    setSessionHistory(updatedHistory);
    
    if (updatedHistory.length >= 3) { // 3 for DSA is plenty
      setIsInterviewActive(false);
      setIsSessionSummary(true);
    } else {
      fetchNextQuestion(updatedHistory.map(h => h.question));
    }
  };

  const endSession = () => {
    setIsInterviewActive(false);
    setIsSessionSummary(true);
  };

  return (
    <div className="tab-pane fade-in" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
       {isLoading && <div className="loader-overlay"><div className="spinner"></div><p style={{color:'white', fontWeight:500}}>AI is generating your question...</p><p className="subtext" style={{fontSize: '0.8rem', marginTop: '5px'}}>This can take up to 20 seconds.</p></div>}
       
       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom: '20px'}}>
         <h1 style={{margin:0}}>Interview Simulator {isInterviewActive && <span className="badge medium ml-2">{formatTime(elapsedTime)}</span>}</h1>
         {isInterviewActive && <button className="btn-secondary danger" onClick={endSession}>End Interview</button>}
       </div>
       
       {!isInterviewActive && !isSessionSummary && (
         <div className="simulator-setup glass-panel">
           <div style={{marginBottom:'32px', textAlign:'center'}}>
              <h1 style={{margin:'0 0 8px 0', fontSize:'2rem', fontWeight:700}}>Interview Simulator</h1>
              <p className="subtext" style={{margin:0}}>Prepare for {company || 'your target company'} with realistic interview questions</p>
           </div>
           <div style={{background:'rgba(16, 185, 129, 0.1)', border:'1px solid rgba(16, 185, 129, 0.3)', padding:'12px 16px', borderRadius:'8px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{fontSize:'1.2rem'}}>✅</span>
              <p style={{margin:0, color:'var(--success)', fontSize:'0.95rem'}}>AI Code Execution Simulator Connected</p>
           </div>
           <div className="grid-form">
             <div className="input-group">
               <label>Question Type</label>
               <select value={interviewConfig.type} onChange={(e)=>setInterviewConfig({...interviewConfig, type: e.target.value})} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
                 <option value="DSA">📊 Data Structures & Algorithms (LeetCode Style)</option>
                 <option value="Technical">💻 Technical Core Knowledge</option>
                 <option value="HR">🎤 Behavioral / HR</option>
               </select>
             </div>
             <div className="input-group">
               <label>Difficulty Level</label>
               <select value={interviewConfig.difficulty} onChange={(e)=>setInterviewConfig({...interviewConfig, difficulty: e.target.value})} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
                 <option value="Easy">🟢 Easy</option>
                 <option value="Medium">🟡 Medium</option>
                 <option value="Hard">🔴 Hard</option>
               </select>
             </div>
           </div>
           <button className="btn-primary mt-4" onClick={startInterview} style={{width:'100%', padding:'14px 20px', fontSize:'1rem', marginTop:'32px', justifyContent:'center'}}>
             🚀 Start Interview Session
           </button>
           <p style={{textAlign:'center', color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'20px', marginBottom:0}}>
              You will solve up to 3 interview questions • Session time is tracked
           </p>
         </div>
       )}

       {isInterviewActive && interviewConfig.type === 'DSA' && currentQuestion?.type === 'DSA' && (
         <div className="leetcode-layout fade-in">
            {/* LEFT PANEL: Problem Statement */}
            <div className="problem-panel">
               <div className="panel-header">
                 <button className={`panel-tab ${activeTabLeft==='description'?'active':''}`} onClick={()=>setActiveTabLeft('description')}>Description</button>
                 <button className={`panel-tab ${activeTabLeft==='solution'?'active':''}`} onClick={()=>setActiveTabLeft('solution')}>Solution</button>
               </div>
               <div className="panel-content">
                 {activeTabLeft === 'description' && (
                   <>
                     <h2 style={{marginTop:0}}>{currentQuestion.title}</h2>
                     <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                        <span className={`badge ${interviewConfig.difficulty.toLowerCase()}`}>{interviewConfig.difficulty}</span>
                        <span className="badge" style={{background:'rgba(255,255,255,0.1)'}}>{company}</span>
                     </div>
                     <p style={{lineHeight: '1.6', fontSize: '1rem', color:'#f8fafc'}}>{currentQuestion.description}</p>
                     
                     <h4 className="mt-4" style={{color:'white'}}>Examples:</h4>
                     <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        {currentQuestion.examples?.map((ex, i) => (
                           <div key={i} style={{background:'rgba(139, 92, 246, 0.08)', padding:'16px', borderRadius:'8px', border:'1px solid rgba(139, 92, 246, 0.3)', transition:'all 0.2s'}}>
                              <p style={{margin:'0 0 8px 0', fontSize:'0.85rem', fontWeight:600, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Example {i+1}</p>
                              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'8px'}}>
                                 <div>
                                    <p style={{margin:'0 0 4px 0', fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:500}}>Input:</p>
                                    <code style={{fontFamily:'Fira Code, monospace', fontSize:'0.9rem', color:'#60a5fa', background:'rgba(0,0,0,0.2)', padding:'8px', borderRadius:'4px', display:'block', whiteSpace:'pre-wrap'}}>{ex.input}</code>
                                 </div>
                                 <div>
                                    <p style={{margin:'0 0 4px 0', fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:500}}>Output:</p>
                                    <code style={{fontFamily:'Fira Code, monospace', fontSize:'0.9rem', color:'#6ee7b7', background:'rgba(0,0,0,0.2)', padding:'8px', borderRadius:'4px', display:'block', whiteSpace:'pre-wrap'}}>{ex.output}</code>
                                 </div>
                              </div>
                              {ex.explanation && (
                                 <div>
                                    <p style={{margin:'0 0 4px 0', fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:500}}>Explanation:</p>
                                    <p style={{margin:'0', fontSize:'0.9rem', color:'white', lineHeight:'1.5'}}>{ex.explanation}</p>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>

                     <h4 className="mt-4" style={{color:'white'}}>Constraints:</h4>
                     <ul style={{fontFamily:'Fira Code, monospace', fontSize:'0.9rem', color:'var(--warning)'}}>
                        {currentQuestion.constraints?.map((c, i) => <li key={i}>{c}</li>)}
                     </ul>
                   </>
                 )}
                 {activeTabLeft === 'solution' && (
                    <div style={{padding:'20px 10px'}}>
                       {!showSolution ? (
                          <div style={{textAlign:'center', padding:'40px 10px'}}>
                             <p style={{fontSize:'1.2rem'}}>🔒 Solution is hidden to test your skills.</p>
                             <button className="btn-secondary mt-4" onClick={() => setShowSolution(true)}>Show Answer</button>
                          </div>
                       ) : (
                          <div className="fade-in">
                             <h3 style={{color:'white', marginTop:0}}>Optimal Approach</h3>
                             <p style={{color:'var(--text-muted)', lineHeight:'1.6'}}>{currentQuestion?.optimal_solution?.explanation || "No explanation provided."}</p>
                             <h4 style={{color:'white', marginTop:'20px'}}>Implementation</h4>
                             <pre className="code-block" style={{marginTop:'10px'}}>
                                {currentQuestion?.optimal_solution?.[editorLanguage] || currentQuestion?.optimal_solution?.cpp || "Solution unavailable."}
                             </pre>
                             <p className="subtext mt-4">Review the solution, understand the logic, and try to write it out yourself in the editor!</p>
                          </div>
                       )}
                    </div>
                 )}
               </div>
            </div>

            {/* RIGHT PANEL: Editor & Testcases */}
            <div className="editor-panel">
               <div className="code-area">
                  <div className="panel-header" style={{justifyContent: 'space-between'}}>
                     <select className="language-selector btn-secondary" value={editorLanguage} onChange={handleLanguageChange} style={{padding: '4px 10px', background: 'rgba(0,0,0,0.4)', fontSize: '0.85rem'}}>
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                     </select>
                     <div>
                        <button className="btn-secondary danger" style={{padding: '6px 16px', fontSize: '0.85rem', marginRight:'10px'}} onClick={() => { setExecutionResult(null); setSubmitResult(null); setAiFeedback(null); }}>Clear Output</button>
                        <button className="btn-secondary" style={{padding: '6px 16px', fontSize: '0.85rem', color: '#cbd5e1', marginRight:'10px'}} onClick={runCodeCustom} disabled={isExecuting}>
                          {isExecuting ? '⏳ Running...' : '▶ Run Code'}
                        </button>
                        <button className="btn-primary" style={{padding: '6px 16px', fontSize: '0.85rem', background: '#10b981', color:'#000'}} onClick={submitCodeDSA} disabled={isExecuting}>
                          Submit All
                        </button>
                     </div>
                  </div>
                  <div style={{flex:1}}>
                    <Editor
                      height="100%"
                      language={editorLanguage === 'c' ? 'c' : editorLanguage === 'cpp' ? 'cpp' : editorLanguage}
                      theme="vs-dark"
                      value={userAnswer}
                      onChange={(value) => setUserAnswer(value || '')}
                      options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'Fira Code', 'Courier New', monospace", padding: { top: 16 } }}
                    />
                  </div>
               </div>

               <div className="testcase-area">
                  <div className="panel-header">
                     <button className={`panel-tab ${activeTabRight==='testcases'?'active':''}`} onClick={()=>setActiveTabRight('testcases')}>Testcases</button>
                     <button className={`panel-tab ${activeTabRight==='result'?'active':''}`} onClick={()=>setActiveTabRight('result')}>Test Result</button>
                     {submitResult && <button className="btn-primary" style={{marginLeft:'auto', padding:'4px 10px', fontSize:'0.8rem'}} onClick={nextQuestion}>Next Question</button>}
                  </div>
                  <div className="panel-content">
                     {activeTabRight === 'testcases' && (
                        <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
                           <div style={{marginBottom:'16px'}}>
                              <p style={{fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:'12px', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px'}}>📋 Test Cases ({currentQuestion.testcases?.filter(t=>!t.hidden).length || 0})</p>
                              <div className="testcase-tabs">
                                 {currentQuestion.testcases?.filter(t=>!t.hidden).map((tc, i) => (
                                    <div key={i} className={`testcase-tab ${activeTestcaseIndex===i?'active':''}`} onClick={()=>{setActiveTestcaseIndex(i); setCustomInput(tc.input);}} style={{cursor:'pointer', transition:'all 0.2s'}}>
                                       Case {i+1}
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <div style={{flex:1, display:'flex', flexDirection:'column', gap:'12px'}}>
                              <div>
                                 <span className="test-io-label">Input</span>
                                 <textarea className="custom-textarea" value={customInput} onChange={(e)=>setCustomInput(e.target.value)} style={{height:'140px'}} />
                              </div>
                              <div>
                                 <span className="test-io-label">Expected Output</span>
                                 <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid var(--border)', borderRadius:'6px', padding:'10px', fontFamily:"'Fira Code', monospace", fontSize:'0.9rem', color:'#6ee7b7', maxHeight:'100px', overflowY:'auto', whiteSpace:'pre-wrap'}}>
                                    {currentQuestion.testcases?.[activeTestcaseIndex]?.expected_output || '(No expected output)'}
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                     
                     {activeTabRight === 'result' && (
                        <div className="result-container">
                           {submitResult ? (
                              <div className="fade-in">
                                 <div className={`test-result-header ${submitResult.status === 'Accepted' ? 'accepted' : 'rejected'}`}>
                                    <div className="test-status-icon">
                                       {submitResult.status === 'Accepted' ? '✅' : '❌'}
                                    </div>
                                    <div className="test-status-text">
                                       <h2 style={{color: submitResult.status === 'Accepted' ? 'var(--success)' : 'var(--danger)'}}>{submitResult.status}</h2>
                                       <p>Test Submission Result</p>
                                    </div>
                                    <div className={`testcase-counter ${submitResult.passed === submitResult.total ? 'all-passed' : submitResult.passed > 0 ? 'partial' : 'failed'}`}>
                                       <span>{submitResult.passed}</span>
                                       <span style={{opacity: 0.5}}>/</span>
                                       <span>{submitResult.total}</span>
                                    </div>
                                 </div>

                                 {submitResult.failedCase && (
                                     <div className="failed-testcase fade-in">
                                        <h4>🔍 First Failed Test Case</h4>
                                        {submitResult.failedCase.compileErr ? (
                                           <div>
                                              <span className="test-io-label">Error Details</span>
                                              <pre style={{color:'#fca5a5', margin:0, background:'rgba(0,0,0,0.3)', padding:'12px', borderRadius:'6px', border:'1px solid rgba(239,68,68,0.3)', whiteSpace:'pre-wrap'}}>{submitResult.failedCase.compileErr}</pre>
                                           </div>
                                        ) : (
                                           <div className="test-io-grid">
                                             <div className="test-io-block">
                                                <span className="test-io-label">Input</span>
                                                <div className="test-io-content">{submitResult.failedCase.hidden ? "🔒 Hidden Testcase" : submitResult.failedCase.input}</div>
                                             </div>
                                             <div className="test-io-block">
                                                <span className="test-io-label">Expected Output</span>
                                                <div className="test-io-content test-expected">{submitResult.failedCase.expected}</div>
                                             </div>
                                             <div className="test-io-block error" style={{gridColumn: '1 / -1'}}>
                                                <span className="test-io-label">Your Output</span>
                                                <div className="test-io-content output-mismatch">{submitResult.failedCase.output}</div>
                                             </div>
                                           </div>
                                        )}
                                     </div>
                                 )}
                              </div>
                           ) : executionResult ? (
                              <div className="fade-in">
                                 <div className={`test-result-header ${executionResult.status === 'Accepted' || executionResult.status === 'Finished' ? 'accepted' : 'rejected'}`}>
                                    <div className="test-status-icon">
                                       {executionResult.status === 'Running...' ? '⏳' :
                                        executionResult.status === 'Accepted' || executionResult.status === 'Finished' ? '✅' :
                                        executionResult.status.includes('Error') ? '⚠️' : '❌'}
                                    </div>
                                    <div className="test-status-text">
                                       <h2 style={{color:
                                          executionResult.status === 'Accepted' || executionResult.status === 'Finished' ? 'var(--success)' :
                                          executionResult.status === 'Running...' ? 'var(--warning)' :
                                          'var(--danger)'
                                       }}>{executionResult.status}</h2>
                                       <p>Single Test Execution</p>
                                    </div>
                                 </div>

                                 {executionResult.status !== 'Running...' && (
                                    <div className="submit-meta" style={{marginTop: '16px'}}>
                                       <div className="submit-stat">
                                          <span>⏱️</span>
                                          <span><strong>Runtime:</strong> {executionResult.time}</span>
                                       </div>
                                       <div className="submit-stat">
                                          <span>💾</span>
                                          <span><strong>Memory:</strong> N/A (Simulation)</span>
                                       </div>
                                    </div>
                                 )}

                                 {executionResult.compileErr ? (
                                    <div style={{background:'rgba(239, 68, 68, 0.08)', border:'1px solid rgba(239, 68, 68, 0.3)', borderRadius:'var(--radius-md)', padding:'16px', marginTop:'16px'}}>
                                       <span className="test-io-label">⚠️ Compilation Error</span>
                                       <pre style={{color:'#fca5a5', whiteSpace:'pre-wrap', margin:'8px 0 0 0', fontFamily: "'Fira Code', monospace", fontSize:'0.9rem'}}>{executionResult.compileErr}</pre>
                                    </div>
                                 ) : (
                                    <div className="test-io-grid" style={{marginTop: '16px'}}>
                                     <div className="test-io-block">
                                        <span className="test-io-label">Input</span>
                                        <div className="test-io-content">{executionResult.input || 'N/A'}</div>
                                     </div>
                                     <div className="test-io-block">
                                        <span className="test-io-label">Expected</span>
                                        <div className="test-io-content test-expected">{executionResult.expected || '-'}</div>
                                     </div>
                                     <div className={`test-io-block ${executionResult.status.includes('Error') ? 'error' : ''}`} style={{gridColumn: '1 / -1'}}>
                                        <span className="test-io-label">Your Output</span>
                                        <div className={`test-io-content ${executionResult.status.includes('Error') ? 'output-mismatch' : ''}`}>{executionResult.output || 'No output.'}</div>
                                     </div>
                                   </div>
                                 )}
                              </div>
                           ) : (
                              <div style={{textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)'}}>
                                 <p style={{fontSize: '1.1rem', margin: '0 0 8px 0'}}>📝 No test results yet</p>
                                 <p style={{margin: 0}}>Click "Run Code" to test your solution</p>
                              </div>
                           )}

                           {aiFeedback && (
                               <div className="fade-in" style={{background:'rgba(59, 130, 246, 0.08)', border:'1px solid rgba(59, 130, 246, 0.3)', borderRadius:'var(--radius-md)', padding:'16px', marginTop:'0'}}>
                                   <h4 style={{color:'#60a5fa', margin:'0 0 10px 0', display:'flex', alignItems:'center', gap:'8px'}}>🤖 AI Feedback</h4>
                                   <p style={{color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:'1.5', margin:0, whiteSpace:'pre-line'}}>{aiFeedback}</p>
                               </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* LEGACY VIEW FOR HR / TECHNICAL (NON-DSA) */}
       {isInterviewActive && interviewConfig.type !== 'DSA' && typeof currentQuestion === 'string' && (
         <div className="focus-container fade-in mt-4">
            <h2 className="current-question">{currentQuestion}</h2>
            {!evaluation ? (
              <div className="interactive-coding-environment mt-4">
                <textarea className="text-input" style={{height:'200px', fontSize:'1rem'}} placeholder="Type your answer here..." value={userAnswer} onChange={(e)=>setUserAnswer(e.target.value)}></textarea>
                <div style={{marginTop:'15px'}}>
                   <button className="btn-primary" onClick={submitAnswerText} disabled={!userAnswer.trim() || isLoading}>🚀 Submit Answer</button>
                </div>
              </div>
            ) : (
               /* ... Evaluation rendering ... Note: shortened for brevity as non-DSA wasn't the focus, but functional */
               <div className="evaluation-section fade-in mt-4">
                 <div className="eval-score">
                    <h3>Overall Score: {evaluation.scores?.overall || 0}/10</h3>
                    <ul className="custom-list mt-2">{evaluation.feedback?.map((f,i)=><li key={i}>{f}</li>)}</ul>
                    <button className="btn-primary mt-4" onClick={nextQuestion}>Next Question</button>
                 </div>
               </div>
            )}
         </div>
       )}

       {isSessionSummary && (
         <div className="session-summary glass-panel fade-in mt-4" style={{maxWidth:'700px', margin:'40px auto', padding:'40px', textAlign:'center'}}>
            <div style={{marginBottom:'24px'}}>
               <h2 style={{margin:'0 0 8px 0', fontSize:'2rem', fontWeight:700}}>🎉 Session Complete!</h2>
               <p className="subtext" style={{margin:0}}>Great effort! You completed your interview session</p>
            </div>

            <div style={{background:'rgba(139, 92, 246, 0.08)', border:'1px solid rgba(139, 92, 246, 0.3)', borderRadius:'var(--radius-md)', padding:'24px', marginBottom:'24px'}}>
               <p style={{color:'var(--text-muted)', fontSize:'0.9rem', margin:'0 0 12px 0', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600}}>Performance Summary</p>
               <div style={{display:'flex', justifyContent:'space-around', gap:'16px', flexWrap:'wrap'}}>
                  <div>
                     <p style={{fontSize:'2rem', fontWeight:800, color:'white', margin:0}}>{sessionHistory.length}</p>
                     <p style={{color:'var(--text-muted)', fontSize:'0.9rem', margin:'4px 0 0 0'}}>Questions Solved</p>
                  </div>
                  <div>
                     <p style={{fontSize:'2rem', fontWeight:800, color:'var(--success)', margin:0}}>
                        {sessionHistory.reduce((acc, h) => acc + (h.evaluation?.scores?.overall || 0), 0)}
                     </p>
                     <p style={{color:'var(--text-muted)', fontSize:'0.9rem', margin:'4px 0 0 0'}}>Total Score</p>
                  </div>
                  <div>
                     <p style={{fontSize:'2rem', fontWeight:800, color:'var(--warning)', margin:0}}>
                        {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
                     </p>
                     <p style={{color:'var(--text-muted)', fontSize:'0.9rem', margin:'4px 0 0 0'}}>Time Taken</p>
                  </div>
               </div>
            </div>

            {sessionHistory.length > 0 && (
               <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'20px', marginBottom:'24px', textAlign:'left'}}>
                  <h4 style={{margin:'0 0 16px 0', color:'white', fontSize:'1rem', display:'flex', alignItems:'center', gap:'8px'}}>📝 Attempted Questions</h4>
                  <div className="custom-list">
                     {sessionHistory.map((h, i) => (
                        <li key={i}>{i+1}. {h.question}</li>
                     ))}
                  </div>
               </div>
            )}

            <div style={{display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap'}}>
               <button className="btn-primary" onClick={()=>setIsSessionSummary(false)} style={{padding:'12px 24px', fontSize:'1rem'}}>
                  🔄 Start New Session
               </button>
               <button className="btn-secondary" onClick={()=>window.location.reload()} style={{padding:'12px 24px', fontSize:'1rem'}}>
                  🏠 Back to Dashboard
               </button>
            </div>
         </div>
       )}
    </div>
  );
}
