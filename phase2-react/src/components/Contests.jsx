import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

const CONTEST_PROBLEMS = [
  {
    id: 'anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    points: 100,
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.'
    ],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' }
    ],
    testcases: [
      { input: '"anagram"\n"nagaram"', expected_output: 'true' },
      { input: '"rat"\n"car"', expected_output: 'false' }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    isAnagram(s, t) {\n        // Write JavaScript code here\n    }\n}'
    }
  },
  {
    id: 'subset-sum',
    title: 'Subset Sum Problem',
    difficulty: 'Medium',
    points: 150,
    description: 'Given an array of non-negative integers arr and a target sum, determine if there is a subset of the given array with a sum equal to the given target.',
    constraints: [
      '1 <= arr.length <= 100',
      '1 <= arr[i] <= 100',
      '1 <= target <= 10^4'
    ],
    examples: [
      { input: 'arr = [3, 34, 4, 12, 5, 2], target = 9', output: 'true (subset [4, 5] sums to 9)' }
    ],
    testcases: [
      { input: '[3, 34, 4, 12, 5, 2]\n9', expected_output: 'true' },
      { input: '[3, 34, 4, 12, 5, 2]\n30', expected_output: 'false' }
    ],
    templates: {
      cpp: 'class Solution {\npublic:\n    bool isSubsetSum(vector<int>& arr, int target) {\n        // Write C++ code here\n    }\n};',
      java: 'class Solution {\n    public boolean isSubsetSum(int[] arr, int target) {\n        // Write Java code here\n    }\n}',
      python: 'class Solution:\n    def isSubsetSum(self, arr: List[int], target: int) -> bool:\n        # Write Python code here\n        pass',
      javascript: 'class Solution {\n    isSubsetSum(arr, target) {\n        // Write JavaScript code here\n    }\n}'
    }
  }
];

const LEADERBOARD_MOCK = [
  { rank: 1, name: 'Anik Dev', score: 250, time: '14m 23s' },
  { rank: 2, name: 'Nikita Rao', score: 250, time: '18m 45s' },
  { rank: 3, name: 'Saurav S.', score: 250, time: '21m 02s' },
  { rank: 4, name: 'Priya Joshi', score: 250, time: '25m 12s' },
  { rank: 5, name: 'Vikram Singh', score: 250, time: '30m 50s' },
  { rank: 6, name: 'Elena G.', score: 250, time: '34m 15s' },
  { rank: 7, name: 'Rahul M.', score: 100, time: '08m 10s' },
  { rank: 8, name: 'Divya P.', score: 100, time: '12m 44s' }
];

export default function Contests() {
  const [inContest, setInContest] = useState(false);
  const [contestFinished, setContestFinished] = useState(false);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  
  // Timer State (45 minutes = 2700 seconds)
  const [timeLeft, setTimeLeft] = useState(2700);
  const timerRef = useRef(null);

  // External live contest states
  const [externalContests, setExternalContests] = useState([]);
  const [loadingContests, setLoadingContests] = useState(false);

  useEffect(() => {
    const fetchContests = async () => {
      setLoadingContests(true);
      try {
        const data = await fetchAPI('/external-contests', {}, 'GET');
        if (data && !data.error) {
          setExternalContests(data);
        }
      } catch(err) {
        console.error("Error loading contests", err);
      }
      setLoadingContests(false);
    };
    fetchContests();
  }, []);

  // Editor states
  const [language, setLanguage] = useState('javascript');
  const [codes, setCodes] = useState({
    anagram: CONTEST_PROBLEMS[0].templates.javascript,
    'subset-sum': CONTEST_PROBLEMS[1].templates.javascript
  });
  
  // Submissions and Evaluations
  const [submissions, setSubmissions] = useState({
    anagram: { solved: false, code: '', attempts: 0 },
    'subset-sum': { solved: false, code: '', attempts: 0 }
  });

  const [score, setScore] = useState(0);
  const [rank, setRank] = useState(null);

  useEffect(() => {
    if (inContest && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishContest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [inContest]);

  const activeProblem = CONTEST_PROBLEMS[activeProblemIndex];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCodes(prev => ({
      ...prev,
      [activeProblem.id]: activeProblem.templates[lang] || ''
    }));
  };

  const startContest = () => {
    setInContest(true);
    setContestFinished(false);
    setTimeLeft(2700);
    setScore(0);
    setCodes({
      anagram: CONTEST_PROBLEMS[0].templates.javascript,
      'subset-sum': CONTEST_PROBLEMS[1].templates.javascript
    });
    setSubmissions({
      anagram: { solved: false, code: '', attempts: 0 },
      'subset-sum': { solved: false, code: '', attempts: 0 }
    });
  };

  const executeRun = async () => {
    toast.loading('Running dry run test cases...', { duration: 1500 });
    setTimeout(() => {
      toast.success('Dry run passed! Output matched expected results.');
    }, 1500);
  };

  const submitProblem = () => {
    const currentCode = codes[activeProblem.id];
    
    // Simulate grading
    toast.loading('Submitting code to judge...', { duration: 2000 });

    setTimeout(async () => {
      const isAccepted = Math.random() > 0.15; // 85% success rate for simulation
      const attempts = (submissions[activeProblem.id]?.attempts || 0) + 1;
      
      setSubmissions(prev => ({
        ...prev,
        [activeProblem.id]: {
          solved: isAccepted,
          code: currentCode,
          attempts
        }
      }));

      if (isAccepted) {
        toast.success(`ACCEPTED! Solved in attempt #${attempts}`);
      } else {
        toast.error('Wrong Answer / Compile Error on test case 4/5');
      }
    }, 2000);
  };

  const finishContest = async () => {
    clearInterval(timerRef.current);
    
    // Calculate final score
    let finalScore = 0;
    if (submissions['anagram'].solved) finalScore += CONTEST_PROBLEMS[0].points;
    if (submissions['subset-sum'].solved) finalScore += CONTEST_PROBLEMS[1].points;

    setScore(finalScore);
    
    // Mock user ranking
    let userRank = 9;
    if (finalScore === 250) userRank = 4; // Solved both
    else if (finalScore === 150) userRank = 7;
    else if (finalScore === 100) userRank = 8;
    
    setRank(userRank);
    setContestFinished(true);
    setInContest(false);

    // Save Mock Test Session (reusing it in backend)
    await fetchAPI('/save-mocktest-session', {
      questions: CONTEST_PROBLEMS.map(p => ({
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        userCode: submissions[p.id]?.code || codes[p.id],
        language,
        evaluation: {
          status: submissions[p.id]?.solved ? 'Accepted' : 'Wrong Answer',
          feedback: submissions[p.id]?.solved ? 'Optimal solution submitted.' : 'Failing on edge testcases.',
          score: submissions[p.id]?.solved ? p.points : 0
        }
      })),
      score: finalScore,
      elapsedTime: 2700 - timeLeft
    }, 'POST');

    toast.success('Contest completed successfully and scorecard saved.');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (inContest) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', color: '#fff', background: '#090d16' }}>
        {/* Contest Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#0f172a', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>Weekly Coding Contest 42</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Solve coding challenges under pressure</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ animation: 'pulse 1s infinite', color: '#ef4444' }}>🔴</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#fca5a5' }}>{formatTime(timeLeft)}</strong>
            </div>
            <button className="btn-primary" onClick={finishContest} style={{ background: '#ef4444' }}>
              Submit & End Contest
            </button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel: Problem Selector and Description */}
          <div style={{ width: '40%', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0c111d' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
              {CONTEST_PROBLEMS.map((prob, idx) => (
                <button
                  key={prob.id}
                  onClick={() => setActiveProblemIndex(idx)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: activeProblemIndex === idx ? 'var(--primary-glow)' : 'transparent',
                    border: 'none',
                    color: activeProblemIndex === idx ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: activeProblemIndex === idx ? '2px solid var(--primary)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Q{idx + 1}: {prob.title} ({prob.points} pts)
                  {submissions[prob.id]?.solved && <span style={{ marginLeft: '6px', color: '#10b981' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Description Area */}
            <div style={{ padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge ${activeProblem.difficulty.toLowerCase()}`}>{activeProblem.difficulty}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Attempts: {submissions[activeProblem.id]?.attempts || 0}</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 16px 0' }}>{activeProblem.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {activeProblem.description}
              </p>

              {/* Examples */}
              <h4 style={{ color: 'white', marginTop: '24px', marginBottom: '10px' }}>Examples</h4>
              {activeProblem.examples.map((ex, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '10px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Input:</strong> {ex.input}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff' }}><strong>Output:</strong> {ex.output}</p>
                </div>
              ))}

              {/* Constraints */}
              <h4 style={{ color: 'white', marginTop: '24px', marginBottom: '10px' }}>Constraints</h4>
              <ul style={{ color: 'var(--text-muted)', paddingLeft: '20px', fontSize: '0.9rem' }}>
                {activeProblem.constraints.map((c, i) => <li key={i} style={{ marginBottom: '6px' }}>{c}</li>)}
              </ul>
            </div>
          </div>

          {/* Right Panel: Editor and Output */}
          <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
            {/* Editor Config bar */}
            <div style={{ padding: '8px 16px', background: '#0c111d', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '4px', color: 'white' }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              {submissions[activeProblem.id]?.solved && (
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  🎉 Problem Solved
                </span>
              )}
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={codes[activeProblem.id]}
                onChange={(val) => setCodes(prev => ({ ...prev, [activeProblem.id]: val }))}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  padding: { top: 12 }
                }}
              />
            </div>

            {/* Submissions Bar */}
            <div style={{ padding: '16px 24px', background: '#0c111d', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={executeRun}>Run Testcases</button>
              <button className="btn-primary" onClick={submitProblem}>Submit Code</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Weekly Placement Contests</h1>
        <p style={{ color: 'var(--text-muted)' }}>Participate in virtual timed coding contests and climb the rankings</p>
      </div>

      {contestFinished && (
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px', background: 'radial-gradient(circle at 100% 100%, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 60%)', border: '1px solid var(--primary-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold' }}>CONTEST COMPLETED</span>
              <h2 style={{ color: 'white', marginTop: '12px', marginBottom: '8px' }}>Your Contest Scorecard</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>PlacementAI Weekly Contest 42 Results</p>
            </div>
            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SCORE</span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--primary)' }}>{score} / 250</h1>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>GLOBAL RANK</span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '4px 0 0 0', color: '#fbbf24' }}>#{rank || '-'}</h1>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Side: Contests Arena */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Contest Card */}
          <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>PRACTICE CONTEST</span>
                <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, marginTop: '8px', marginBottom: '6px' }}>Weekly Contest 42</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>45 minutes | 2 Coding Problems | 250 Max Points</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Test your DSA skills under pressure. Solve algorithmic challenges, pass testcases, and secure a rank on the global leaderboard. Results are archived in your history reports.
            </p>
            <button className="btn-primary" onClick={startContest} style={{ marginTop: '16px', padding: '12px 24px' }}>
              🚀 Start Contest Arena
            </button>
          </div>

          {/* Upcoming Contests */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.1rem' }}>Upcoming Competitive Coding Contests (Codeforces Schedule)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingContests ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  <span>Loading practice contest schedule...</span>
                </div>
              ) : externalContests.length > 0 ? (
                externalContests.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{c.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Starts: <strong>{c.startTime}</strong> | Duration: <strong>{c.duration}</strong></span>
                    </div>
                    <a href="https://codeforces.com/contests" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>
                      Register ↗
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  <span>No upcoming contests scheduled currently.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Leaderboard */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.1rem' }}>Practice Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {LEADERBOARD_MOCK.map((user) => (
              <div 
                key={user.rank} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 14px', 
                  background: 'rgba(255,255,255,0.01)', 
                  borderRadius: '6px', 
                  border: '1px solid rgba(255,255,255,0.03)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '20px', fontWeight: 'bold', color: user.rank <= 3 ? '#fbbf24' : 'var(--text-muted)' }}>#{user.rank}</span>
                  <span style={{ color: 'white', fontWeight: 500 }}>{user.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{user.score} pts</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.time}</div>
                </div>
              </div>
            ))}
            {contestFinished && rank && (
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px', 
                  background: 'var(--primary-glow)', 
                  borderRadius: '6px', 
                  border: '1px solid var(--primary)',
                  marginTop: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '20px', fontWeight: 'bold', color: 'white' }}>#{rank}</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>You (Mock Solver)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'white', fontSize: '0.9rem' }}>{score} pts</strong>
                  <div style={{ fontSize: '0.75rem', color: 'white', opacity: 0.8 }}>Active Session</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
