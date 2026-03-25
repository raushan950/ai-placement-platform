import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';

export default function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/login' : '/register';
    const data = await fetchAPI(endpoint, { email, password });
    
    if (data && data.error) {
      setError(data.error);
    } else if (data && data.token) {
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } else {
      setError('Something went wrong. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in">
        <h2 className="logo" style={{textAlign: 'center', margin: '0 0 20px 0'}}>Placement<span>AI</span></h2>
        <p className="subtext" style={{textAlign: 'center', marginBottom: '30px'}}>
          {isLogin ? 'Welcome back! Log in to pick up where you left off.' : 'Create an account to track your progress.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group" style={{marginTop: '20px'}}>
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && <div className="error-banner fade-in mt-4" style={{padding: '10px'}}>{error}</div>}

          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '30px', padding: '14px', fontSize: '1.05rem'}} disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-switch" style={{textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold'}}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>
    </div>
  );
}
