import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';

export default function Dashboard({ roadmap, setRoadmap, completed, toggleTask }) {
  const [company, setCompany] = useState('');
  const [days, setDays] = useState('');
  const [level, setLevel] = useState('beginner');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if(!company || !days) return;
    setIsLoading(true);
    const data = await fetchAPI('/generate-roadmap', { company, days: parseInt(days), level });
    if(data && data.roadmap) setRoadmap(data.roadmap);
    setIsLoading(false);
  };

  return (
    <div className="tab-pane fade-in">
      {isLoading && <div className="loader-overlay"><div className="spinner"></div><p style={{color:'white', fontWeight:500}}>AI is processing...</p></div>}
      <header className="page-header">
        <h1>Welcome back! 👋</h1>
        <p>Let's build your personalized action plan.</p>
      </header>
      
      <form className="glass-panel" onSubmit={handleGenerateRoadmap} style={{marginBottom: '40px'}}>
        <div className="grid-form">
          <div className="input-group">
            <label>Target Company</label>
            <input type="text" placeholder="e.g. Amazon, TCS" value={company} onChange={(e)=>setCompany(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Days Left</label>
            <input type="number" placeholder="45" value={days} onChange={(e)=>setDays(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Current Level</label>
            <select value={level} onChange={(e)=>setLevel(e.target.value)}>
               <option value="beginner">Beginner</option>
               <option value="intermediate">Intermediate</option>
               <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{marginTop:'10px'}} disabled={isLoading}>✨ Generate with AI</button>
      </form>

      {roadmap.length > 0 && (
        <div className="roadmap-timeline">
          {roadmap.map((step, idx) => (
             <div key={idx} className={`task-card ${completed.has(step.day.toString()) ? 'completed' : ''}`} onClick={()=>toggleTask(step.day.toString())}>
                <div className="task-header">
                   <span className="day-badge">Day {step.day}</span>
                   <span className="week-badge">Week {step.week}</span>
                </div>
                <h3 className="topic-title">{step.topic}</h3>
                <p className="task-desc">{step.task}</p>
                
                {step.questions && step.questions.length > 0 && (
                  <div className="daily-questions">
                    <h4>📌 Today's Required Problems:</h4>
                    <ul>
                      {step.questions.map((q, i) => (
                        <li key={i}>
                          <a href={q.link} target="_blank" rel="noreferrer" className="question-link" onClick={(e) => e.stopPropagation()}>
                            <span className="q-name">{q.name}</span>
                            <span className="q-meta">
                              ({q.platform}{q.difficulty ? ` - ${q.difficulty}` : ''})
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="task-footer">
                   <span className="practice-badge">🎯 {step.practice} Problems</span>
                   <span className="platform-badge">🖥️ {step.platform || 'LeetCode'}</span>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
