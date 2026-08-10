import React from 'react';

export default function DashboardCharts({ resumeReports = [], interviewSessions = [], mockTestSessions = [] }) {
  
  // Calculate average ATS score
  const avgATS = resumeReports.length > 0 
    ? Math.round(resumeReports.reduce((acc, r) => acc + (r.scores?.overall || 0), 0) / resumeReports.length)
    : 0;

  // Calculate average mock test score
  const avgMockTest = mockTestSessions.length > 0
    ? Math.round(mockTestSessions.reduce((acc, s) => acc + (s.score || 0), 0) / mockTestSessions.length)
    : 0;

  // Calculate average interview score (out of 10)
  const avgInterview = interviewSessions.length > 0
    ? Math.round((interviewSessions.reduce((acc, s) => acc + (s.score || 0), 0) / interviewSessions.length) * 10)
    : 0;

  // Placement readiness aggregate
  const placementReadiness = Math.round((avgATS * 0.4) + (avgMockTest * 0.4) + (avgInterview * 0.2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', marginTop: '30px' }}>
      
      {/* Visual Analytics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Circle Gauge Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'white' }}>Placement Readiness Score</h3>
          
          <div style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '50%', 
            background: `conic-gradient(var(--primary) ${placementReadiness * 3.6}deg, rgba(255,255,255,0.03) 0deg)`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
          }}>
            {/* Center mask */}
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: '#090d16', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{placementReadiness}%</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ready</span>
            </div>
          </div>

          <p className="subtext" style={{ fontSize: '0.8rem', marginTop: '16px' }}>
            Weighed average of ATS audits (40%), coding exams (40%), and verbal communications (20%).
          </p>
        </div>

        {/* Skill Matrix breakdown */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'white' }}>Placement Skill Breakdown</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Row 1: ATS score */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)' }}>Resume Quality & keywords</span>
                <strong style={{ color: 'white' }}>{avgATS}%</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${avgATS}%`, height: '100%', background: 'linear-gradient(to right, #ef4444, #f59e0b)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Row 2: DSA score */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)' }}>Data Structures & Algorithms</span>
                <strong style={{ color: 'white' }}>{avgMockTest}%</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${avgMockTest}%`, height: '100%', background: 'linear-gradient(to right, #3b82f6, var(--primary))', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Row 3: Communication */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)' }}>Verbal English & Communication</span>
                <strong style={{ color: 'white' }}>{avgInterview}%</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${avgInterview}%`, height: '100%', background: 'linear-gradient(to right, #10b981, #34d399)', borderRadius: '4px' }}></div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Historical Trend Chart */}
      {mockTestSessions.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'white' }}>Coding Mock Test Scores Trend</h3>
          
          <div style={{ 
            height: '140px', 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '15px', 
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            justifyContent: 'space-around'
          }}>
            {mockTestSessions.slice(0, 8).reverse().map((session, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                flex: 1, 
                maxWidth: '60px' 
              }}>
                <div 
                  style={{ 
                    height: `${session.score || 10}px`, 
                    width: '100%', 
                    background: 'linear-gradient(to top, rgba(99, 102, 241, 0.4), var(--primary))', 
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'white',
                    fontWeight: 700,
                    minHeight: '20px',
                    boxShadow: '0 0 8px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  {session.score}%
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                  Test {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
