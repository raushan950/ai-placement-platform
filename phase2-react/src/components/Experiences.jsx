import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Experiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  
  // Submit Experience Modal States
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generation Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiCompany, setAiCompany] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Detail Modal State
  const [activeExp, setActiveExp] = useState(null);

  const handleAiRequest = async (e) => {
    e.preventDefault();
    if (!aiCompany || !aiRole) {
      toast.error('Please enter company and role');
      return;
    }
    setIsAiGenerating(true);
    const toastId = toast.loading(`AI is synthesizing interview rounds for ${aiCompany}...`);
    try {
      const res = await fetchAPI('/generate-interview-experience', { company: aiCompany, role: aiRole }, 'POST');
      toast.dismiss(toastId);
      if (res && !res.error) {
        toast.success(`Success! Generated interview experience report for ${aiCompany}.`);
        setShowAiModal(false);
        setAiCompany('');
        setAiRole('');
        fetchExperiences();
      } else {
        toast.error(res?.error || 'AI generation failed');
      }
    } catch(err) {
      toast.dismiss(toastId);
      toast.error('Network error during generation');
    }
    setIsAiGenerating(false);
  };

  const fetchExperiences = async () => {
    setLoading(true);
    const data = await fetchAPI('/interview-experiences', {}, 'GET');
    if (data && !data.error) {
      setExperiences(data);
    } else {
      toast.error('Failed to load experiences');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCompany || !newRole || !newContent) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const res = await fetchAPI('/interview-experiences', {
      company: newCompany,
      role: newRole,
      content: newContent,
      rating: newRating
    }, 'POST');
    setIsSubmitting(false);

    if (res && !res.error) {
      toast.success('Your experience has been shared successfully!');
      setShowModal(false);
      // Reset form
      setNewCompany('');
      setNewRole('');
      setNewContent('');
      setNewRating(5);
      fetchExperiences();
    } else {
      toast.error(res?.error || 'Failed to submit experience');
    }
  };

  // Filter experiences
  const uniqueCompanies = ['All', ...new Set(experiences.map(e => e.company))];
  const filtered = experiences.filter(e => {
    const matchesSearch = e.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = selectedCompany === 'All' || e.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#fbbf24' : 'rgba(255,255,255,0.15)', fontSize: '0.9rem' }}>★</span>
    ));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Company Interview Experiences</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Learn from past candidates who successfully cleared top placement rounds</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => setShowAiModal(true)} style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            🤖 AI Synthesize Experience
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            ➕ Share Your Experience
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '20px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '240px' }}>
          <input 
            type="text" 
            placeholder="🔍 Search by company, role, keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
          />
        </div>
        <div className="input-group" style={{ width: '180px' }}>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
          >
            {uniqueCompanies.map((c, i) => (
              <option key={i} value={c} style={{ background: '#0f172a' }}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>Loading experiences...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '3rem' }}>📁</span>
          <h3 style={{ color: '#fff', marginTop: '15px' }}>No experiences found</h3>
          <p>Be the first to share an interview experience for this role or company!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filtered.map((exp) => (
            <div 
              key={exp._id} 
              className="glass-panel" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                padding: '24px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border)',
              }}
              onClick={() => setActiveExp(exp)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>{exp.company}</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>{exp.role}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex' }}>{renderStars(exp.rating)}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineStyle: '1.5', margin: '14px 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {exp.content}
                </p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shared by <strong style={{ color: '#fff' }}>{exp.user}</strong></span>
                <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>Read Full Review →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Experience Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#fff', margin: '0 0 20px 0' }}>Share Your Interview Experience</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Google, Amazon" 
                  value={newCompany} 
                  onChange={(e) => setNewCompany(e.target.value)} 
                  required
                />
              </div>
              <div className="input-group">
                <label>Job Title / Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Engineer (SDE-1), Analyst" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)} 
                  required
                />
              </div>
              <div className="input-group">
                <label>Interview Review (Rounds, Questions Asked, Tips)</label>
                <textarea 
                  rows="6" 
                  placeholder="Describe the recruitment rounds (OA, Technical, HR), what DSA or project questions were asked, and helpful recommendations for other candidates..."
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <div className="input-group">
                <label>Overall Difficulty Rating ({newRating}/5)</label>
                <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))}>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent / Tough</option>
                  <option value="4">⭐⭐⭐⭐ Very Good / Hard</option>
                  <option value="3">⭐⭐⭐ Good / Medium</option>
                  <option value="2">⭐⭐ Fair / Easy</option>
                  <option value="1">⭐ Basic / Very Easy</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Posting...' : 'Share Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Experience Details Modal */}
      {activeExp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveExp(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding: '40px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#fff', margin: 0 }}>{activeExp.company}</h2>
                <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: '4px 0 0 0' }}>{activeExp.role}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex' }}>{renderStars(activeExp.rating)}</div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Posted on {new Date(activeExp.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {activeExp.content}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shared by <strong style={{ color: 'white' }}>{activeExp.user}</strong></span>
              <button className="btn-secondary" onClick={() => setActiveExp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Request AI Experience Modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h2 style={{ color: '#fff', margin: '0 0 20px 0' }}>Request AI Experience Report</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Type any company name and role. Gemini AI will synthesize a highly detailed and realistic report based on real-world interview patterns.
            </p>
            <form onSubmit={handleAiRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Stripe, NVIDIA, Netflix" 
                  value={aiCompany} 
                  onChange={(e) => setAiCompany(e.target.value)} 
                  required
                />
              </div>
              <div className="input-group">
                <label>Job Title / Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Development Engineer (SDE-1)" 
                  value={aiRole} 
                  onChange={(e) => setAiRole(e.target.value)} 
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAiModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isAiGenerating}>
                  {isAiGenerating ? '🤖 Synthesizing...' : '🤖 Generate Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
