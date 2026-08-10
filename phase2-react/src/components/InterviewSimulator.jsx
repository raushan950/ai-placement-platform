import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';
export default function InterviewSimulator({ company }) {
  const [interviewConfig, setInterviewConfig] = useState({ type: 'DSA', difficulty: 'Medium' });
  const [dsaSubject, setDsaSubject] = useState('All DSA Subjects');
  const [attemptFormat, setAttemptFormat] = useState('written'); // written or oral
  const [questionSource, setQuestionSource] = useState('general'); // general or resume
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

  // Web Speech API states
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionObj, setRecognitionObj] = useState(null);

  // Voice Assistant states
  const [isVoiceAssistantMode, setIsVoiceAssistantMode] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Custom Voice Settings
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voicesList, setVoicesList] = useState([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const list = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        setVoicesList(list);
        if (list.length > 0 && !selectedVoice) {
          setSelectedVoice(list[0].name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      
      recog.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setUserAnswer(prev => prev + (prev.trim() ? ' ' : '') + finalTranscript.trim());
        }
      };

      recog.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
           toast.error(`Microphone error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recog.onend = () => {
         setIsRecording(false);
      };
      
      setRecognitionObj(recog);
    }
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const toggleRecording = () => {
    if (!recognitionObj) {
       toast.error("Browser does not support Speech Recognition. Try Chrome or Edge.");
       return;
    }
    if (isRecording) {
      recognitionObj.stop();
      setIsRecording(false);
    } else {
      try {
         recognitionObj.start();
         setIsRecording(true);
         toast.success("Recording started... Speak now.");
      } catch (err) {
         toast.error("Failed to start microphone.");
      }
    }
  };

  const speakQuestion = () => {
    if (!('speechSynthesis' in window)) {
      toast.error("Browser does not support Text-to-Speech.");
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = typeof currentQuestion === 'string' ? currentQuestion : currentQuestion?.title;
    if (!textToSpeak) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    if (selectedVoice) {
      const activeVoice = window.speechSynthesis.getVoices().find(v => v.name === selectedVoice);
      if (activeVoice) utterance.voice = activeVoice;
    }
    window.speechSynthesis.speak(utterance);
  };
  
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

  const fetchInitialVoiceQuestion = async () => {
    const data = await fetchAPI('/generate-interview-question', {
      company: company || 'Tech Company',
      level: 'intermediate',
      type: interviewConfig.type,
      difficulty: interviewConfig.difficulty,
      history: [],
      format: isVoiceAssistantMode ? 'oral' : 'written',
      subject: dsaSubject,
      source: questionSource
    });
    if (data && data.error) {
      toast.error(data.error);
      return null;
    }
    return data ? (typeof data === 'string' ? data : (data.question || data.title)) : "Tell me about yourself and your background.";
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Browser does not support Text-to-Speech.");
      return;
    }
    window.speechSynthesis.cancel();
    if (isMuted) return;
    
    setIsAiSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    if (selectedVoice) {
      const activeVoice = window.speechSynthesis.getVoices().find(v => v.name === selectedVoice);
      if (activeVoice) utterance.voice = activeVoice;
    }
    
    utterance.onend = () => {
      setIsAiSpeaking(false);
      if (isVoiceAssistantMode && !isRecording && !evaluation) {
        startVoiceListening();
      }
    };
    
    utterance.onerror = () => {
      setIsAiSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startVoiceListening = () => {
    if (!recognitionObj) {
      toast.error("Browser does not support Speech Recognition.");
      return;
    }
    try {
      recognitionObj.start();
      setIsRecording(true);
      toast.success("AI Interviewer is listening... Speak now.");
    } catch (err) {
      console.warn("Speech recognition already active or failed:", err);
    }
  };

  const stopVoiceListening = () => {
    if (recognitionObj && isRecording) {
      recognitionObj.stop();
      setIsRecording(false);
    }
  };

  const submitVoiceTurn = async (answer) => {
    const textToSend = answer || userAnswer;
    if (!textToSend.trim()) return;

    setIsLoading(true);
    const userMessage = { role: 'user', text: textToSend };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setUserAnswer('');
    stopVoiceListening();
    
    const response = await fetchAPI('/interview/chat-turn', {
      company: company || 'Tech Company',
      type: interviewConfig.type,
      difficulty: interviewConfig.difficulty,
      conversationHistory: chatHistory,
      latestAnswer: textToSend
    });
    
    setIsLoading(false);

    if (response && response.error) {
      toast.error(response.error);
      return;
    }

    if (response) {
      const aiMessage = { role: 'assistant', text: response.interviewerSpeech };
      const nextHistory = [...updatedHistory, aiMessage];
      setChatHistory(nextHistory);
      speakText(response.interviewerSpeech);

      if (response.isComplete) {
        setEvaluation({
          scores: response.scores,
          feedback: response.feedback,
          ideal_answer: response.ideal_answer,
          improvement_suggestion: response.improvement_suggestion
        });
        
        // Auto-save session details in DB
        await fetchAPI('/save-interview-session', {
          company: company || 'Tech Company',
          type: interviewConfig.type,
          difficulty: interviewConfig.difficulty,
          elapsedTime,
          score: response.scores?.overall || 0,
          conversation: nextHistory,
          questions: [{
            question: chatHistory[0]?.text || "Initial question",
            answer: updatedHistory.map(m => m.text).join(' | '),
            evaluation: {
              scores: response.scores,
              feedback: response.feedback,
              ideal_answer: response.ideal_answer,
              improvement_suggestion: response.improvement_suggestion
            }
          }]
        });
        
        toast.success("Interview completed and graded!");
      }
    }
  };

  const startInterview = async () => {
    if (!company) { toast.error("Please set a Target Company in the Dashboard first!"); return; }
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
    
    if (isVoiceAssistantMode) {
      setChatHistory([]);
      const initialQuestionText = await fetchInitialVoiceQuestion();
      if (initialQuestionText) {
        const initialMessage = { role: 'assistant', text: initialQuestionText };
        setChatHistory([initialMessage]);
        setIsInterviewActive(true);
        setIsLoading(false);
        setTimeout(() => speakText(initialQuestionText), 600);
      } else {
        setIsLoading(false);
      }
    } else {
      await fetchNextQuestion([]);
      setIsInterviewActive(true);
      setIsLoading(false);
    }
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
      history: historyDocs,
      format: isVoiceAssistantMode ? 'oral' : 'written',
      subject: dsaSubject,
      source: questionSource
    });
    
    if (data && data.error) {
       toast.error(data.error);
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
                <select value={interviewConfig.type} onChange={(e) => {
                  const newType = e.target.value;
                  setInterviewConfig({...interviewConfig, type: newType});
                  // If switching from DSA, ensure default voice settings
                  if (newType !== 'DSA') {
                    setIsVoiceAssistantMode(true);
                  } else {
                    setIsVoiceAssistantMode(attemptFormat === 'oral');
                  }
                }} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
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

              <div className="input-group" style={{gridColumn: 'span 2', marginTop: '10px'}}>
                <label>Question Source</label>
                <select value={questionSource} onChange={(e)=>setQuestionSource(e.target.value)} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
                   <option value="general">🎯 General Target Company Profile ({company || 'Tech Company'})</option>
                   <option value="resume">📄 My Uploaded Resume Profile (AI Resume Grill Mode)</option>
                </select>
              </div>

              {interviewConfig.type === 'DSA' && (
                <>
                  <div className="input-group">
                    <label>DSA Focus Subject</label>
                    <select value={dsaSubject} onChange={(e)=>setDsaSubject(e.target.value)} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
                       <option value="All DSA Subjects">📚 All DSA Subjects</option>
                       <option value="Arrays & Hashing">Arrays & Hashing</option>
                       <option value="Linked Lists">Linked Lists</option>
                       <option value="Stacks & Queues">Stacks & Queues</option>
                       <option value="Recursion & Backtracking">Recursion & Backtracking</option>
                       <option value="Trees & Graphs">Trees & Graphs</option>
                       <option value="Dynamic Programming">Dynamic Programming</option>
                       <option value="Sorting & Searching">Sorting & Searching</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Attempt Format</label>
                    <select value={attemptFormat} onChange={(e) => {
                      setAttemptFormat(e.target.value);
                      setIsVoiceAssistantMode(e.target.value === 'oral');
                    }} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
                       <option value="written">💻 Written Coding Workspace (Monaco Editor)</option>
                       <option value="oral">🎙️ Oral Conceptual Interview (Voice Recruiter)</option>
                    </select>
                  </div>
                </>
              )}

              {interviewConfig.type !== 'DSA' && (
                <div className="input-group" style={{gridColumn: 'span 2'}}>
                  <label>Attempt Format</label>
                  <select value={isVoiceAssistantMode ? 'oral' : 'written'} onChange={(e) => setIsVoiceAssistantMode(e.target.value === 'oral')} style={{background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px 16px'}}>
                     <option value="oral">🎙️ Oral Conversational (Voice Recruiter Call)</option>
                     <option value="written">📝 Written Response Workspace</option>
                  </select>
                </div>
              )}
            </div>

            <button className="btn-primary mt-4" onClick={startInterview} style={{width:'100%', padding:'14px 20px', fontSize:'1rem', marginTop:'32px', justifyContent:'center'}}>
              🚀 Start Interview Session
            </button>
            <p style={{textAlign:'center', color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'20px', marginBottom:0}}>
               {isVoiceAssistantMode ? "Interactive conversation with AI recruiter • 3 rounds • Voice & Audio assisted" : "You will solve up to 3 interview questions • Session time is tracked"}
            </p>
         </div>
       )}

        {isInterviewActive && interviewConfig.type === 'DSA' && !isVoiceAssistantMode && (
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
                     <p style={{lineHeight: '1.6', fontSize: '1rem', color:'#f8fafc', whiteSpace: 'pre-wrap'}}>{currentQuestion.description}</p>
                     
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
        {/* INTERACTIVE VOICE ASSISTANT INTERVIEW VIEW */}
        {isInterviewActive && isVoiceAssistantMode && (
          <div className="voice-layout fade-in mt-4">
             {/* LEFT SIDE: Chat messages feed */}
             <div className="chat-panel">
                <div className="chat-messages" id="chat-messages-container">
                   {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`message-bubble ${msg.role}`}>
                         <span className={msg.role === 'assistant' ? 'assistant-tag' : 'user-tag'}>
                            {msg.role === 'assistant' ? 'Interviewer 🤖' : 'You 👤'}
                         </span>
                         <p style={{margin:0, whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                      </div>
                   ))}
                   {isLoading && (
                      <div className="message-bubble assistant" style={{opacity: 0.7}}>
                         <span>Interviewer is analyzing... ⚡</span>
                      </div>
                   )}
                </div>
                <div className="assistant-status">
                   <span>
                      {isAiSpeaking ? "🔊 AI Interviewer is speaking..." : isRecording ? "🎤 Listening to your answer..." : "💤 Idle"}
                   </span>
                </div>
             </div>

             {/* RIGHT SIDE: Audio visualizer orb & override tools */}
             <div className="voice-control-panel">
                <h3>Voice Recruiter Portal</h3>
                <p className="text-muted" style={{fontSize: '0.85rem', marginBottom: '25px'}}>Speak your responses. Fallback inputs allowed below.</p>
                
                <div className="voice-orb-container">
                   <div className={`pulse-ring-ambient ${isAiSpeaking ? 'active-pulse' : ''}`}></div>
                   <div className={`pulse-ring-ambient ${isRecording ? 'active-pulse-record' : ''}`}></div>
                   
                   <button 
                      className={`voice-orb ${isRecording ? 'listening' : ''}`} 
                      onClick={isRecording ? stopVoiceListening : startVoiceListening}
                      disabled={isAiSpeaking || isLoading || !!evaluation}
                   >
                      {isRecording ? '🛑' : '🎙️'}
                   </button>
                </div>
                
                <h4 style={{margin:0}}>{isRecording ? "Listening..." : isAiSpeaking ? "AI Interviewer Speaking" : "Click Microphone to Speak"}</h4>
                
                <div className={`wave-bars-container ${isRecording || isAiSpeaking ? 'listening' : ''}`} style={{opacity: isRecording || isAiSpeaking ? 1 : 0.2}}>
                   <div className="wave-bar animate-1"></div>
                   <div className="wave-bar animate-2"></div>
                   <div className="wave-bar animate-3"></div>
                   <div className="wave-bar animate-4"></div>
                   <div className="wave-bar animate-5"></div>
                </div>

                <div className="input-group mt-4" style={{width: '100%'}}>
                   <label style={{textAlign: 'left', fontSize: '0.8rem'}}>Type Answer (Manual Override)</label>
                   <div style={{display: 'flex', gap: '10px'}}>
                      <input 
                         type="text" 
                         className="custom-textarea" 
                         style={{height: '42px', margin:0, background: 'rgba(0,0,0,0.2)', fontSize: '0.9rem'}} 
                         placeholder="Type your response here..." 
                         value={userAnswer} 
                         onChange={(e) => setUserAnswer(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && submitVoiceTurn()}
                         disabled={isLoading || isRecording || !!evaluation}
                      />
                      <button 
                         className="btn-primary" 
                         onClick={() => submitVoiceTurn()} 
                         disabled={isLoading || isRecording || !userAnswer.trim() || !!evaluation}
                         style={{padding: '0 20px', height: '42px', display: 'flex', alignItems: 'center'}}
                      >
                         Send
                      </button>
                   </div>
                 </div>

                 {/* Voice Controls Selector & Rate Sliders */}
                 {voicesList.length > 0 && (
                   <div className="input-group mt-3" style={{width: '100%', textAlign: 'left'}}>
                     <label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>AI Recruiter Voice Accent</label>
                     <select 
                       value={selectedVoice} 
                       onChange={(e) => setSelectedVoice(e.target.value)}
                       className="btn-secondary"
                       style={{width: '100%', padding: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border)', borderRadius: '6px'}}
                     >
                       {voicesList.map((v, i) => (
                         <option key={i} value={v.name}>{v.name.replace('Microsoft', '').replace('Google', '').trim()}</option>
                       ))}
                     </select>
                   </div>
                 )}

                 <div style={{display: 'flex', gap: '15px', width: '100%', marginTop: '12px'}}>
                   <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                     <label style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Speech Rate: {voiceRate}x</label>
                     <input 
                       type="range" 
                       min="0.5" 
                       max="1.8" 
                       step="0.1" 
                       value={voiceRate} 
                       onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                       style={{width: '100%', accentColor: 'var(--primary)', cursor: 'pointer'}}
                     />
                   </div>
                   <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                     <label style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Pitch: {voicePitch}</label>
                     <input 
                       type="range" 
                       min="0.5" 
                       max="1.5" 
                       step="0.1" 
                       value={voicePitch} 
                       onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                       style={{width: '100%', accentColor: 'var(--primary)', cursor: 'pointer'}}
                     />
                   </div>
                 </div>

                <div style={{display: 'flex', gap: '12px', marginTop: '24px', width: '100%', justifyContent: 'center'}}>
                   <button 
                      className="btn-secondary" 
                      onClick={() => setIsMuted(!isMuted)}
                      style={{fontSize: '0.8rem', padding: '6px 12px', flex: 1}}
                   >
                      {isMuted ? '🔇 Unmute' : '🔊 Mute Audio'}
                   </button>
                   <button 
                      className="btn-secondary danger" 
                      onClick={endSession}
                      style={{fontSize: '0.8rem', padding: '6px 12px', flex: 1}}
                   >
                      ⏹️ End
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* LEGACY SINGLE-QUESTION VIEW FOR HR / TECHNICAL (NON-DSA) */}
        {isInterviewActive && interviewConfig.type !== 'DSA' && !isVoiceAssistantMode && typeof currentQuestion === 'string' && (
          <div className="focus-container fade-in mt-4">
             <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px'}}>
                <h2 className="current-question" style={{margin: 0}}>{currentQuestion}</h2>
                <button className="btn-secondary" onClick={speakQuestion} style={{padding: '8px 12px', borderRadius: '50%'}} title="Read Question Out Loud">
                  🔊
                </button>
             </div>
             {!evaluation ? (
               <div className="interactive-coding-environment mt-4">
                 <textarea className="text-input" style={{height:'200px', fontSize:'1rem', borderColor: isRecording ? 'var(--primary)' : 'var(--border)', transition: 'all 0.3s'}} placeholder="Type your answer here or click the microphone to speak..." value={userAnswer} onChange={(e)=>setUserAnswer(e.target.value)}></textarea>
                 <div style={{marginTop:'15px', display: 'flex', gap: '15px'}}>
                    <button className={`btn-primary ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} style={isRecording ? {background: 'var(--danger)', borderColor: 'var(--danger)'} : {background: 'var(--bg-secondary)', color: 'white', borderColor: 'var(--border)'}}>
                       {isRecording ? '⏹️ Stop Recording' : '🎤 Start Voice Answer'}
                    </button>
                    <button className="btn-primary" onClick={submitAnswerText} disabled={!userAnswer.trim() || isLoading || isRecording}>🚀 Submit Answer</button>
                 </div>
               </div>
             ) : (
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

        {/* DETAILED SCORECARD FOR CONVERSATIONAL VOICE INTERVIEWS */}
        {evaluation && isVoiceAssistantMode && (
          <div className="session-summary glass-panel fade-in mt-4" style={{maxWidth: '800px', margin: '20px auto', padding: '35px'}}>
             <div style={{textAlign:'center', marginBottom:'30px'}}>
                <h2 style={{fontSize: '2rem', fontWeight: 800, margin:0, color: 'white'}}>🎓 AI Performance Scorecard</h2>
                <p className="subtext">Detailed review of your conversational voice mock interview</p>
             </div>

             <div className="score-dashboard" style={{background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom:'30px'}}>
                <div style={{display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap'}}>
                   <div style={{width: '95px', height: '95px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center'}}>
                      <span style={{fontSize: '2rem', fontWeight:800, color: 'white', lineHeight:1}}>{evaluation.scores?.overall || 0}</span>
                      <span style={{fontSize: '0.6rem', opacity: 0.5, fontWeight:700, letterSpacing: '0.5px'}}>OVERALL</span>
                   </div>
                   <div style={{flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      <div className="score-bar"><span>Understanding:</span> <progress value={evaluation.scores?.understanding || 0} max="10"></progress> {evaluation.scores?.understanding || 0}/10</div>
                      <div className="score-bar"><span>Approach:</span> <progress value={evaluation.scores?.approach || 0} max="10"></progress> {evaluation.scores?.approach || 0}/10</div>
                      <div className="score-bar"><span>Clarity:</span> <progress value={evaluation.scores?.clarity || 0} max="10"></progress> {evaluation.scores?.clarity || 0}/10</div>
                   </div>
                </div>
             </div>

             <div className="analysis-grid" style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '25px'}}>
                <div className="analysis-card glass-panel" style={{margin: 0, padding: '20px'}}>
                   <h3 style={{color: 'white', marginTop: 0, fontSize: '1.1rem'}}>💪 Strengths & Critique</h3>
                   <ul className="custom-list" style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '20px'}}>
                      {evaluation.feedback?.map((f, i) => <li key={i} style={{marginBottom:'6px'}}>{f}</li>)}
                   </ul>
                </div>
                <div className="analysis-card glass-panel" style={{margin: 0, padding: '20px'}}>
                   <h3 style={{color: 'var(--warning)', marginTop: 0, fontSize: '1.1rem'}}>📖 Next Study Recommendations</h3>
                   <p style={{fontSize: '0.9rem', color: 'white', lineHeight: '1.5'}}>{evaluation.improvement_suggestion || "Review standard communication models."}</p>
                </div>
             </div>

             {evaluation.ideal_answer && (
                <div className="analysis-card glass-panel" style={{margin: '0 0 30px 0', padding: '20px'}}>
                   <h3 style={{color: 'white', marginTop: 0, fontSize: '1.1rem'}}>⭐ Optimal Strategy Comparison</h3>
                   <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5'}}><strong>Approach Summary:</strong> {evaluation.ideal_answer.approach_summary}</p>
                   <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '8px'}}><strong>Key Takeaway:</strong> {evaluation.ideal_answer.key_idea}</p>
                </div>
             )}

             <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
                <button className="btn-primary" onClick={() => { setEvaluation(null); setChatHistory([]); setIsSessionSummary(false); setIsInterviewActive(false); }} style={{padding: '12px 24px'}}>
                   🔄 Start New Interview
                </button>
                <button className="btn-secondary" onClick={() => window.location.reload()} style={{padding: '12px 24px'}}>
                   🏠 Exit to Dashboard
                </button>
             </div>
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
