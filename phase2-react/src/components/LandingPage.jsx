import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div className="landing-wrapper fade-in" style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(ellipse at top, #1e1b4b, #090d16)', 
      color: '#f8fafc',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      overflowX: 'hidden'
    }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 8%',
        background: 'rgba(9, 13, 22, 0.5)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Placement<span style={{ color: 'var(--primary)' }}>AI</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-secondary" onClick={handleStart} style={{ padding: '8px 20px', border: '1px solid var(--border)' }}>
            Sign In
          </button>
          <button className="btn-primary" onClick={handleStart} style={{ padding: '8px 20px' }}>
            Get Started Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '100px 5% 60px 5%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '10%',
          width: '300px',
          height: '300px',
          background: 'var(--primary-glow)',
          filter: 'blur(120px)',
          opacity: 0.3,
          zIndex: 0,
          pointerEvents: 'none'
        }}></div>

        <span className="badge" style={{ 
          background: 'rgba(99, 102, 241, 0.1)', 
          color: 'var(--primary)', 
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '6px 16px',
          borderRadius: '50px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '24px',
          zIndex: 1
        }}>
          ✨ Next-Generation Placement Prep Engine
        </span>

        <h1 style={{ 
          fontSize: '3.8rem', 
          fontWeight: 900, 
          lineHeight: '1.1', 
          color: 'white', 
          maxWidth: '850px', 
          margin: '0 0 20px 0',
          letterSpacing: '-1.5px',
          zIndex: 1
        }}>
          Master Technical & Coding Interviews with <span style={{ 
            background: 'linear-gradient(to right, #818cf8, #a78bfa)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>AI Recruiter Simulator</span>
        </h1>

        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-muted)', 
          maxWidth: '650px', 
          margin: '0 0 35px 0', 
          lineHeight: '1.6',
          zIndex: 1
        }}>
          Optimize your ATS resume, compile coding answers in real-time, take timed mock tests, and practice conversational interviews with our voice recruiter helper.
        </p>

        <div style={{ display: 'flex', gap: '15px', zIndex: 1 }}>
          <button className="btn-primary" onClick={handleStart} style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 600 }}>
            🚀 Start Preparing Free
          </button>
          <a href="#features" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            Explore Features
          </a>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" style={{ padding: '80px 8%', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 10px 0', color: 'white' }}>Engineered for Placement Excellence</h2>
          <p className="subtext" style={{ fontSize: '1.1rem' }}>Four specialized modules to get you hired at top companies</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '24px', 
          maxWidth: '1200px', 
          margin: '0 auto' 
        }}>
          
          {/* Box 1: ATS Analyzer */}
          <div className="glass-panel" style={{ 
            gridColumn: 'span 7', 
            padding: '35px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '320px'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📄</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 10px 0', color: 'white' }}>ATS Resume Reviewer</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Upload your resume to get instant grading. Get a list of missing keywords, projects compatibility analysis, and actionable metrics-driven bullet rewrites to maximize matching.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>ATS Scoring</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>AI Suggests</span>
            </div>
          </div>

          {/* Box 2: Voice Recruiter */}
          <div className="glass-panel" style={{ 
            gridColumn: 'span 5', 
            padding: '35px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '320px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.05), transparent)'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🎙️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 10px 0', color: 'white' }}>Conversational Recruiter</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                A turn-based verbal simulator that acts like a real recruiter. Features integrated audio visualizer orb, adjustable voices, speech rate speed controls, and scorecard metrics.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)' }}>Voice Assistant</span>
            </div>
          </div>

          {/* Box 3: Timed Assessments */}
          <div className="glass-panel" style={{ 
            gridColumn: 'span 5', 
            padding: '35px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '320px'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⏱️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 10px 0', color: 'white' }}>Timed Live Mock Tests</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Take timed 3-question assessments. Write solutions in Monaco Editor and execute/grade against real input parameters using Judge0 Secure Sandbox API.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>Monaco IDE</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>Sandbox Compile</span>
            </div>
          </div>

          {/* Box 4: Roadmaps & History */}
          <div className="glass-panel" style={{ 
            gridColumn: 'span 7', 
            padding: '35px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            minHeight: '320px'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📊</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 10px 0', color: 'white' }}>Historical Analytics Hub</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Inspect your score progress timelines, past resume reviews, coding test records, and full conversational transcripts. Save everything automatically to your secure database profile.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>MongoDB History</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>Performance Charts</span>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '50px 0', 
        background: 'rgba(0, 0, 0, 0.3)', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.9rem',
        color: 'var(--text-muted)'
      }}>
        <p style={{ margin: 0 }}>© 2026 PlacementAI Career Suite. Build with Secure Judge0 Sandbox.</p>
      </footer>
    </div>
  );
}
