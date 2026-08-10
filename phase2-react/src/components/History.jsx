import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function History() {
  const [activeTab, setActiveTab] = useState('resumes');
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item for Detailed Modal view
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedMockTest, setSelectedMockTest] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const resData = await fetchAPI('/resume-history', {}, 'GET');
        const intData = await fetchAPI('/interview-history', {}, 'GET');
        const mockData = await fetchAPI('/mocktest-history', {}, 'GET');

        if (Array.isArray(resData)) setResumes(resData);
        if (Array.isArray(intData)) setInterviews(intData);
        if (Array.isArray(mockData)) setMockTests(mockData);
      } catch (err) {
        toast.error("Failed to load history metrics.");
      }
      setIsLoading(false);
    };

    loadHistory();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  const getScoreClass = (score, max = 100) => {
    const pct = (score / max) * 100;
    if (pct >= 75) return 'high';
    if (pct >= 50) return 'mid';
    return 'low';
  };

  return (
    <div className="tab-pane fade-in" style={{ height: '100%' }}>
      {isLoading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
          <p style={{ color: 'white', fontWeight: 500 }}>Syncing profile analytics...</p>
        </div>
      )}

      <header className="page-header" style={{ marginBottom: '30px' }}>
        <h1>History & Assessment Analytics</h1>
        <p>Review your historical scores, placement audits, and interview transcripts</p>
      </header>

      {/* Tabs navigation */}
      <div className="panel-header" style={{ display: 'flex', gap: '10px', marginBottom: '25px', padding: 0, background: 'transparent', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`panel-tab ${activeTab === 'resumes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('resumes')}
          style={{ padding: '12px 24px', fontSize: '1rem' }}
        >
          📄 Resume Reviews ({resumes.length})
        </button>
        <button 
          className={`panel-tab ${activeTab === 'interviews' ? 'active' : ''}`} 
          onClick={() => setActiveTab('interviews')}
          style={{ padding: '12px 24px', fontSize: '1rem' }}
        >
          🎯 Mock Interviews ({interviews.length})
        </button>
        <button 
          className={`panel-tab ${activeTab === 'mocktests' ? 'active' : ''}`} 
          onClick={() => setActiveTab('mocktests')}
          style={{ padding: '12px 24px', fontSize: '1rem' }}
        >
          📝 Timed Assessments ({mockTests.length})
        </button>
      </div>

      {/* TAB 1: RESUME REPORTS */}
      {activeTab === 'resumes' && (
        <div className="history-container">
          {resumes.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <h3>No Resume Reports Found</h3>
              <p style={{ marginTop: '5px' }}>Upload your resume in the Resume Analyzer to trigger an AI review.</p>
            </div>
          ) : (
            resumes.map((report) => (
              <div key={report._id} className="history-card" onClick={() => setSelectedResume(report)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className={`history-score-circle ${getScoreClass(report.scores?.overall || 0)}`}>
                    {report.scores?.overall || 0}
                    <span className="max-lbl">/100</span>
                  </div>
                  <div>
                    <h3 style={{ color: 'white', margin: 0 }}>Resume Audit Report</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                      {report.targetCompany ? `Target: ${report.targetCompany}` : 'General Placement Readiness'} • {formatDate(report.createdAt)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>ATS: {report.scores?.ats || 0}%</span>
                  <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>View Report ➔</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MOCK INTERVIEWS */}
      {activeTab === 'interviews' && (
        <div className="history-container">
          {interviews.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <h3>No Interview Logs Found</h3>
              <p style={{ marginTop: '5px' }}>Start an Interview Session in the simulator to evaluate your skills.</p>
            </div>
          ) : (
            interviews.map((session) => (
              <div key={session._id} className="history-card" onClick={() => setSelectedInterview(session)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className={`history-score-circle ${getScoreClass(session.score || 0, 10)}`}>
                    {session.score || 0}
                    <span className="max-lbl">/10</span>
                  </div>
                  <div>
                    <h3 style={{ color: 'white', margin: 0 }}>{session.type} Simulation ({session.company})</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Difficulty: {session.difficulty} • Duration: {formatDuration(session.elapsedTime)} • {formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>Read Transcript ➔</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MOCK TESTS */}
      {activeTab === 'mocktests' && (
        <div className="history-container">
          {mockTests.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <h3>No Mock Assessments Found</h3>
              <p style={{ marginTop: '5px' }}>Generate and submit a Timed Assessment in the Mock Test portal.</p>
            </div>
          ) : (
            mockTests.map((session) => (
              <div key={session._id} className="history-card" onClick={() => setSelectedMockTest(session)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className={`history-score-circle ${getScoreClass(session.score || 0)}`}>
                    {session.score || 0}
                    <span className="max-lbl">%</span>
                  </div>
                  <div>
                    <h3 style={{ color: 'white', margin: 0 }}>Timed Mock Examination</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Solved: {session.questions?.length || 0} Problems • Time Taken: {formatDuration(session.elapsedTime)} • {formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>View Scorecard ➔</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAILED MODALS */}
      {/* ======================================================== */}

      {/* RESUME REPORT MODAL */}
      {selectedResume && (
        <div className="modal-overlay" onClick={() => setSelectedResume(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedResume(null)}>×</button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '5px' }}>Resume Audit Scorecard</h2>
            <p className="text-muted" style={{ marginBottom: '25px', fontSize: '0.85rem' }}>{formatDate(selectedResume.createdAt)}</p>

            <div className="score-dashboard" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className={`history-score-circle ${getScoreClass(selectedResume.scores?.overall || 0)}`} style={{ width: '84px', height: '84px', fontSize: '1.8rem' }}>
                  {selectedResume.scores?.overall || 0}
                  <span className="max-lbl">/100</span>
                </div>
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="score-bar" style={{ fontSize: '0.85rem' }}><span>Skills Match:</span> <progress value={selectedResume.scores?.skills || 0} max="100"></progress> {selectedResume.scores?.skills || 0}%</div>
                  <div className="score-bar" style={{ fontSize: '0.85rem' }}><span>Projects Quality:</span> <progress value={selectedResume.scores?.projects || 0} max="100"></progress> {selectedResume.scores?.projects || 0}%</div>
                  <div className="score-bar" style={{ fontSize: '0.85rem' }}><span>ATS Parser Compatibility:</span> <progress value={selectedResume.scores?.ats || 0} max="100"></progress> {selectedResume.scores?.ats || 0}%</div>
                </div>
              </div>
            </div>

            <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div className="analysis-card glass-panel" style={{ margin: 0, padding: '20px' }}>
                <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.1rem' }}>💪 Key Strengths</h3>
                <ul className="custom-list" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '15px' }}>
                  {selectedResume.strengths?.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
                </ul>
              </div>
              <div className="analysis-card glass-panel" style={{ margin: 0, padding: '20px' }}>
                <h3 style={{ color: 'var(--danger)', marginTop: 0, fontSize: '1.1rem' }}>⚠️ Development Areas</h3>
                <ul className="custom-list" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '15px' }}>
                  {selectedResume.weaknesses?.map((w, i) => <li key={i} style={{ marginBottom: '6px' }}>{w}</li>)}
                  {selectedResume.missing_skills?.map((ms, i) => <li key={i} style={{ marginBottom: '6px', color: 'var(--warning)' }}>Missing Skill: {ms}</li>)}
                </ul>
              </div>
            </div>

            {selectedResume.bullet_rewrites && selectedResume.bullet_rewrites.length > 0 && (
              <div className="analysis-card glass-panel" style={{ margin: '0 0 25px 0', padding: '20px' }}>
                <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.1rem' }}>✨ Metrics-Driven Resume Rewrites</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {selectedResume.bullet_rewrites.map((r, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0 }}>❌ {r.original}</p>
                      <p style={{ color: '#6ee7b7', fontSize: '0.85rem', margin: '4px 0 0 0' }}>✅ {r.rewritten}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="analysis-card glass-panel" style={{ margin: 0, padding: '20px' }}>
              <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.1rem' }}>💡 Practical Suggestions</h3>
              <ul className="custom-list" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '15px' }}>
                {selectedResume.suggestions?.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
                {selectedResume.ats_optimization?.suggestions?.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>ATS Tip: {s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MOCK INTERVIEW MODAL */}
      {selectedInterview && (
        <div className="modal-overlay" onClick={() => setSelectedInterview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedInterview(null)}>×</button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '5px' }}>Interview Transcript & Grading</h2>
            <p className="text-muted" style={{ marginBottom: '25px', fontSize: '0.85rem' }}>
              {selectedInterview.type} Interview for {selectedInterview.company} • {formatDate(selectedInterview.createdAt)}
            </p>

            <div className="score-dashboard" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '25px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className={`history-score-circle ${getScoreClass(selectedInterview.score || 0, 10)}`} style={{ width: '84px', height: '84px', fontSize: '1.8rem' }}>
                  {selectedInterview.score || 0}
                  <span className="max-lbl">/10</span>
                </div>
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <strong>Difficulty:</strong> {selectedInterview.difficulty}<br />
                    <strong>Duration:</strong> {formatDuration(selectedInterview.elapsedTime)}
                  </p>
                </div>
              </div>
            </div>

            {selectedInterview.conversation && selectedInterview.conversation.length > 0 && (
              <div className="chat-panel" style={{ maxHeight: '350px', marginBottom: '25px', height: 'auto' }}>
                <h4 style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border)', margin: 0, color: 'white' }}>Transcript History</h4>
                <div className="chat-messages" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '300px' }}>
                  {selectedInterview.conversation.map((msg, idx) => (
                    <div key={idx} className={`message-bubble ${msg.role === 'assistant' ? 'assistant' : 'user'}`} style={{ fontSize: '0.85rem', padding: '10px 14px' }}>
                      <span className={msg.role === 'assistant' ? 'assistant-tag' : 'user-tag'} style={{ fontSize: '0.65rem' }}>
                        {msg.role === 'assistant' ? 'Interviewer 🤖' : 'You 👤'}
                      </span>
                      <p style={{ margin: 0 }}>{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedInterview.questions?.[0]?.evaluation && (
              <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                <div className="analysis-card glass-panel" style={{ margin: 0, padding: '20px' }}>
                  <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.1rem' }}>📝 AI Feedback Critique</h3>
                  <ul className="custom-list" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '15px' }}>
                    {selectedInterview.questions[0].evaluation.feedback?.map((f, i) => <li key={i} style={{ marginBottom: '6px' }}>{f}</li>)}
                  </ul>
                </div>
                <div className="analysis-card glass-panel" style={{ margin: 0, padding: '20px' }}>
                  <h3 style={{ color: 'var(--warning)', marginTop: 0, fontSize: '1.1rem' }}>📖 Study Recommendation</h3>
                  <p style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.5' }}>
                    {selectedInterview.questions[0].evaluation.improvement_suggestion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TIMED ASSESSMENT MODAL */}
      {selectedMockTest && (
        <div className="modal-overlay" onClick={() => setSelectedMockTest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedMockTest(null)}>×</button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '5px' }}>Timed Mock Test Report</h2>
            <p className="text-muted" style={{ marginBottom: '25px', fontSize: '0.85rem' }}>{formatDate(selectedMockTest.createdAt)}</p>

            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: '0 0 4px 0' }}>Grade Score</p>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: selectedMockTest.score >= 70 ? 'var(--success)' : selectedMockTest.score >= 50 ? 'var(--warning)' : 'var(--danger)', margin: 0 }}>
                  {selectedMockTest.score}%
                </h2>
              </div>
              <div style={{ width: '1px', height: '45px', background: 'var(--border)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: '0 0 4px 0' }}>Time Spent</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>
                  {formatDuration(selectedMockTest.elapsedTime)}
                </h3>
              </div>
            </div>

            <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '1.1rem' }}>Questions & Submissions:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {selectedMockTest.questions?.map((q, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Q{idx + 1}: {q.title}</h4>
                    <span className={`badge ${q.difficulty?.toLowerCase() || 'medium'}`}>{q.difficulty || 'Medium'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Language: <strong style={{ color: 'white' }}>{q.language?.toUpperCase() || 'CPP'}</strong> • Status: <strong style={{ color: q.evaluation?.status === 'Accepted' ? 'var(--success)' : 'var(--warning)' }}>{q.evaluation?.status || 'Graded'}</strong> • Score: <strong style={{ color: 'white' }}>{q.evaluation?.score || 0}/10</strong>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong>AI Feedback:</strong> {q.evaluation?.feedback || 'Evaluated successfully.'}
                  </p>
                  {q.userCode && (
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code Submitted:</span>
                      <pre style={{ background: '#090d16', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)', color: '#68d391', fontFamily: 'monospace', fontSize: '0.8rem', maxHeight: '150px', overflowY: 'auto', margin: '4px 0 0 0' }}>
                        {q.userCode}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
