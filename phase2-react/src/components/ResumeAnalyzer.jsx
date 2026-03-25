import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
       setResumeError("Please explicitly paste your resume text first.");
       return;
    }
    setResumeError(null);
    setResumeAnalysis(null);
    setIsLoading(true);
    
    const data = await fetchAPI('/analyze-resume', { resumeText, jobDescription, targetCompany });
    if (data && data.error) {
       setResumeError(data.error);
    } else if (data) {
       setResumeAnalysis(data);
    } else {
       setResumeError("Server disconnected. Please start the backend.");
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
       setResumeError("Please upload a valid PDF file.");
       return;
    }

    setResumeError(null);
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('resumeFile', file);
    
    const data = await fetchAPI('/upload-resume', formData, 'POST', true);
    if (data && data.error) {
       setResumeError(data.error);
    } else if (data && data.text) {
       setResumeText(data.text);
       setResumeError("✅ PDF Extracted Successfully! You can now click Analyze.");
    } else {
       setResumeError("Could not connect to server for parsing.");
    }
    setIsLoading(false);
  };

  const renderList = (arr) => arr?.map((item, i) => <li key={i}>{item}</li>);

  return (
    <div className="tab-pane fade-in">
       {isLoading && <div className="loader-overlay"><div className="spinner"></div><p style={{color:'white', fontWeight:500}}>Analyzing Resume...</p></div>}
       <h1>Professional Resume Analyzer</h1>
       <p className="subtext">Upload your PDF or paste your resume text below for an instant AI audit.</p>

       <div className="upload-container">
         <label className="btn-secondary">
           📄 Upload PDF Resume
           <input type="file" accept="application/pdf" onChange={handleFileUpload} hidden />
         </label>
         <span className="upload-separator">OR PASTE BELOW</span>
       </div>

       <div className="grid-form">
         <textarea className="resume-input" style={{height:'150px'}} placeholder="Paste your entire resume here..." value={resumeText} onChange={(e)=>setResumeText(e.target.value)}></textarea>
         <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
           <textarea className="resume-input" style={{height:'85px', marginBottom:'0'}} placeholder="Optional: Paste Job Description for Match Score" value={jobDescription} onChange={(e)=>setJobDescription(e.target.value)}></textarea>
           <input type="text" className="resume-input" style={{height:'50px', marginBottom:'0', fontSize:'0.9rem'}} placeholder="Optional: Target Company" value={targetCompany} onChange={(e)=>setTargetCompany(e.target.value)} />
         </div>
       </div>
       
       {resumeError && <div className="error-banner fade-in" style={resumeError.includes('✅') ? {borderColor: 'var(--success)', color: 'var(--success)', background: 'rgba(16,185,129,0.1)'} : {}}>{resumeError}</div>}
       
       <button className="btn-primary" onClick={handleAnalyzeResume} disabled={isLoading || !resumeText.trim()}>Analyze Resume & Readiness</button>
       
       {resumeAnalysis && (
         <div className="resume-results fade-in mt-4">
           {/* Quick Evaluation & Scores */}
           <div className="score-dashboard glass-panel">
             <div className="score-main">
               <div className="circular-score" style={{ '--score': resumeAnalysis.scores?.overall || 0 }}>
                 <span className="score-value">{resumeAnalysis.scores?.overall || 0}</span>
                 <span className="score-max">/100</span>
               </div>
               <div className="quick-eval">
                 <h3>Quick Evaluation</h3>
                 <p><strong>Overall:</strong> {resumeAnalysis.quick_evaluation?.overall}</p>
                 <p><strong>Ready for placements:</strong> {resumeAnalysis.quick_evaluation?.ready_for_placements}</p>
               </div>
             </div>
             <div className="score-breakdown mt-4">
               <div className="score-bar"><span>Skills Score:</span> <progress value={resumeAnalysis.scores?.skills || 0} max="100"></progress> {resumeAnalysis.scores?.skills || 0}%</div>
               <div className="score-bar"><span>Projects Score:</span> <progress value={resumeAnalysis.scores?.projects || 0} max="100"></progress> {resumeAnalysis.scores?.projects || 0}%</div>
               <div className="score-bar"><span>ATS Score:</span> <progress value={resumeAnalysis.scores?.ats || 0} max="100"></progress> {resumeAnalysis.scores?.ats || 0}%</div>
             </div>
           </div>

           {/* Structured Output */}
           <div className="analysis-grid mt-4">
             <div className="analysis-card strengths glass-panel">
               <h3>💪 Strengths</h3>
               <ul>{renderList(resumeAnalysis.strengths)}</ul>
             </div>
             <div className="analysis-card weaknesses glass-panel">
               <h3>⚠️ Weaknesses & Missing Skills</h3>
               <ul>{renderList(resumeAnalysis.weaknesses)}</ul>
               <ul>{renderList(resumeAnalysis.missing_skills)}</ul>
             </div>
             
             {/* ATS Optimization */}
             <div className="analysis-card full-width ats-optimization glass-panel">
               <h3>🤖 ATS Optimization</h3>
               <div className="ats-grid">
                 <div>
                   <h4>Missing Keywords</h4>
                   <ul>{renderList(resumeAnalysis.ats_optimization?.missing_keywords)}</ul>
                 </div>
                 <div>
                   <h4>Formatting Issues</h4>
                   <ul>{renderList(resumeAnalysis.ats_optimization?.formatting_issues)}</ul>
                 </div>
               </div>
             </div>

             {/* JD & Company Match */}
             {(resumeAnalysis.jd_match || resumeAnalysis.company_readiness) && (
               <div className="analysis-card full-width jd-match glass-panel">
                 <h3>🎯 Role & Company Fit</h3>
                 <div className="ats-grid">
                   {resumeAnalysis.jd_match?.score !== undefined && (
                     <div>
                       <h4>JD Match Score: {resumeAnalysis.jd_match.score}/100</h4>
                       <p className="mt-2 text-muted"><strong>Missing:</strong> {resumeAnalysis.jd_match.missing_keywords?.join(', ')}</p>
                       <ul className="mt-2">{renderList(resumeAnalysis.jd_match.suggestions)}</ul>
                     </div>
                   )}
                   {resumeAnalysis.company_readiness?.score !== undefined && (
                     <div>
                       <h4>Readiness for {targetCompany}: {resumeAnalysis.company_readiness.score}/100</h4>
                       <p className="mt-2 text-muted"><strong>Missing Skills:</strong> {resumeAnalysis.company_readiness.missing_skills?.join(', ')}</p>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Rewrites */}
             {resumeAnalysis.bullet_rewrites && resumeAnalysis.bullet_rewrites.length > 0 && (
               <div className="analysis-card full-width rewrites glass-panel">
                 <h3>✨ Resume Improvement Generator (Rewrites)</h3>
                 <div className="rewrite-list mt-2">
                   {resumeAnalysis.bullet_rewrites.map((r, i) => (
                     <div key={i} className="rewrite-item" style={{background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'8px', marginBottom:'10px'}}>
                       <div className="original" style={{color:'#fca5a5', marginBottom:'8px', fontSize:'0.9rem'}}>❌ {r.original}</div>
                       <div className="rewritten" style={{color:'#6ee7b7'}}>✅ {r.rewritten}</div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="analysis-card full-width suggestions glass-panel">
               <h3>💡 Practical Suggestions</h3>
               <ul>{renderList(resumeAnalysis.suggestions)}</ul>
               <ul>{renderList(resumeAnalysis.ats_optimization?.suggestions)}</ul>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
