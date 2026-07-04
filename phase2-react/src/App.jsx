import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { fetchAPI } from './utils/api';
import { Toaster } from 'react-hot-toast';
// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import InterviewSimulator from './components/InterviewSimulator';
import MockTest from './components/MockTest';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dashboard & Global State
  const [roadmap, setRoadmap] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [streak, setStreak] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // Check Local Storage for Auth
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await fetchAPI('/me', {}, 'GET');
        if (data && data.user) {
          await handleLoginSuccess(data.user, false);
        } else {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
    // eslint-disable-next-line
  }, []);

  const handleLoginSuccess = async (userData, redirect = true) => {
    setUser(userData);
    setStreak(userData.streak || 0);
    if (userData.completedTasks) {
       const completedKeys = Object.keys(userData.completedTasks).filter(k => userData.completedTasks[k]);
       setCompleted(new Set(completedKeys));
    }
    
    // Fetch roadmap
    const rmData = await fetchAPI('/my-roadmap', {}, 'GET');
    if (rmData && rmData.data && rmData.data.length > 0) {
        setRoadmap(rmData.data);
    }

    if (redirect) {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRoadmap([]);
    setCompleted(new Set());
    setStreak(0);
    navigate('/login');
  };

  const toggleTask = async (dayIndex) => {
    const newDone = new Set(completed);
    const isCompleted = !newDone.has(dayIndex);
    
    if(isCompleted) newDone.add(dayIndex);
    else newDone.delete(dayIndex);
    
    setCompleted(newDone);
    
    if (user) {
       const data = await fetchAPI('/save-progress', { userId: user._id, taskName: dayIndex, isCompleted });
       if (data && data.streak !== undefined) {
          setStreak(data.streak);
       }
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/resume')) return 'Resume Analyzer';
    if (path.includes('/prep')) return 'Interview Simulator';
    if (path.includes('/mock')) return 'Mock Assessment';
    return 'Daily Roadmap';
  };

  const progress = roadmap.length ? Math.round((completed.size / roadmap.length) * 100) : 0;

  if (loading) {
    return <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>Loading...</div>;
  }

  // Auth routing implementation
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Toaster position="top-right" />
      
      <Routes>
        <Route path="/login" element={
          !user ? <AuthScreen onLogin={(user) => handleLoginSuccess(user, true)} /> : <Navigate to="/dashboard" replace />
        } />
        
        <Route path="/*" element={
          user ? (
            <div className="app-container">
              <Sidebar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
                streak={streak} 
                progress={progress} 
                onLogout={handleLogout}
              />

              <div className="main-wrapper">
                <div className="top-navbar">
                  <button className="mobile-menu-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
                  <h2>{getPageTitle()}</h2>
                  <div className="user-profile" style={{display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto'}}>
                    <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>👤 {user?.email.split('@')[0]}</span>
                  </div>
                </div>
                
                <main className="content-area">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard roadmap={roadmap} setRoadmap={setRoadmap} completed={completed} toggleTask={toggleTask} />} />
                    <Route path="/resume" element={<ResumeAnalyzer />} />
                    <Route path="/prep" element={<InterviewSimulator company="Tech Company" />} />
                    <Route path="/mock" element={<MockTest />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" replace />
        } />
      </Routes>
    </>
  );
}
