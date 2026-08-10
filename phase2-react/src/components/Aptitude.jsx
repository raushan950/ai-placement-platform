import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Aptitude() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Game/Practice state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  
  // Progress tracker (stores solved question IDs)
  const [completedList, setCompletedList] = useState(new Set());

  useEffect(() => {
    const loadCompletedProgress = async () => {
      const rmData = await fetchAPI('/my-roadmap', {}, 'GET');
      // We can also extract solved aptitude items from the user profile if needed
    };

    loadCompletedProgress();
  }, []);

  const handleCategorySelect = async (cat) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setCorrectAnswersCount(0);
    
    setLoading(true);
    const toastId = toast.loading('AI is generating fresh placement aptitude problems...');
    try {
      const data = await fetchAPI('/generate-aptitude-questions', { category: cat }, 'POST');
      toast.dismiss(toastId);
      if (data && !data.error) {
        setQuestions(data);
        toast.success(`Generated fresh ${cat} challenges!`);
      } else {
        toast.error('Could not generate. Using local fallback.');
      }
    } catch(err) {
      toast.dismiss(toastId);
      toast.error('Error generating questions.');
    }
    setLoading(false);
  };

  const filteredQuestions = questions;
  const activeQuestion = filteredQuestions[currentIndex];

  const handleOptionSelect = async (optIdx) => {
    if (answered) return;
    
    setSelectedOption(optIdx);
    setAnswered(true);

    const isCorrect = optIdx === activeQuestion.answerIndex;
    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
      toast.success('Correct Answer! 🎉');
    } else {
      toast.error('Incorrect Answer. See explanation below.');
    }

    // Save progress to database
    try {
      const taskName = `aptitude_${activeQuestion.id}`;
      await fetchAPI('/save-progress', { taskName, isCompleted: true }, 'POST');
      setCompletedList(prev => {
        const next = new Set(prev);
        next.add(activeQuestion.id);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      toast.success(`Completed Category! Final Score: ${correctAnswersCount}/${filteredQuestions.length}`);
      setActiveCategory(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Aptitude & Reasoning Practice</h1>
        <p style={{ color: 'var(--text-muted)' }}>Master quantitative aptitude, logical reasoning, and verbal logic for company screening examinations</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Loading aptitude questions...</div>
      ) : !activeCategory ? (
        /* Category Chooser */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '20px' }}>
          
          <div 
            className="glass-panel" 
            onClick={() => handleCategorySelect('Quantitative Aptitude')}
            style={{ padding: '30px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: '2.5rem' }}>🧮</span>
            <h3 style={{ color: 'white', marginTop: '20px', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 700 }}>Quantitative Aptitude</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Practice time & work, profit & loss, speed & distance, and number solutions.</p>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginTop: '16px' }}>Start Practice →</span>
          </div>

          <div 
            className="glass-panel" 
            onClick={() => handleCategorySelect('Logical Reasoning')}
            style={{ padding: '30px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: '2.5rem' }}>🧠</span>
            <h3 style={{ color: 'white', marginTop: '20px', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 700 }}>Logical Reasoning</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Sharpen your analytical skills with blood relations, number series, and syllogisms.</p>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginTop: '16px' }}>Start Practice →</span>
          </div>

          <div 
            className="glass-panel" 
            onClick={() => handleCategorySelect('Verbal Ability')}
            style={{ padding: '30px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: '2.5rem' }}>🗣️</span>
            <h3 style={{ color: 'white', marginTop: '20px', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 700 }}>Verbal Ability</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Improve English syntax, grammar corrections, synonyms, and comprehension reasoning.</p>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginTop: '16px' }}>Start Practice →</span>
          </div>

        </div>
      ) : (
        /* Question Practice Arena */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Header Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button className="btn-secondary" onClick={() => setActiveCategory(null)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              ← Return Categories
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Question <strong>{currentIndex + 1}</strong> of <strong>{filteredQuestions.length}</strong>
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
            <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {activeQuestion.topic}
            </span>
            <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 500, marginTop: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              {activeQuestion.question}
            </h3>

            {/* Options list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === activeQuestion.answerIndex;
                
                let borderStyle = '1px solid var(--border)';
                let bgStyle = 'rgba(255,255,255,0.02)';
                
                if (answered) {
                  if (isCorrect) {
                    borderStyle = '1px solid #10b981';
                    bgStyle = 'rgba(16,185,129,0.1)';
                  } else if (isSelected) {
                    borderStyle = '1px solid #ef4444';
                    bgStyle = 'rgba(239,68,68,0.1)';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={answered}
                    onClick={() => handleOptionSelect(idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: bgStyle,
                      border: borderStyle,
                      borderRadius: '8px',
                      color: answered && (isCorrect || isSelected) ? '#fff' : 'var(--text-main)',
                      textAlign: 'left',
                      fontSize: '0.98rem',
                      fontWeight: answered && (isCorrect || isSelected) ? 600 : 500,
                      cursor: answered ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (!answered) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={(e) => { if (!answered) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <span style={{ marginRight: '12px', color: 'var(--text-muted)' }}>{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Step-by-Step Logic Explanation Box */}
            {answered && (
              <div 
                className="glass-panel" 
                style={{ 
                  marginTop: '30px', 
                  padding: '20px 24px', 
                  background: 'rgba(139,92,246,0.05)', 
                  border: '1px solid var(--primary-glow)',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 600 }}>💡 Step-by-Step Explanation</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {activeQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          {answered && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleNext} style={{ padding: '12px 24px' }}>
                {currentIndex < filteredQuestions.length - 1 ? 'Next Question →' : 'Finish Category'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
