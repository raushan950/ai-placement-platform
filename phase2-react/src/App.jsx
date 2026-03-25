import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchAPI } from './utils/api';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import InterviewSimulator from './components/InterviewSimulator';
import MockTest from './components/MockTest';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const [user, setUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('roadmap');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dashboard & Global State
  const [roadmap, setRoadmap] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [streak, setStreak] = useState(0);

  // Check Local Storage for Auth
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await fetchAPI('/me', {}, 'GET');
        if (data && data.user) handleLoginSuccess(data.user);
        else localStorage.removeItem('token');
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setStreak(userData.streak || 0);
    if (userData.progress) {
       // Convert progress object to Set of string keys where value is true
       const completedKeys = Object.keys(userData.progress).filter(k => userData.progress[k]);
       setCompleted(new Set(completedKeys));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRoadmap([]);
    setCompleted(new Set());
    setStreak(0);
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

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'roadmap': return 'Daily Roadmap';
      case 'resume': return 'Resume Analyzer';
      case 'prep': return 'Interview Simulator';
      case 'mock': return 'Mock Assessment';
      default: return 'Dashboard';
    }
  };

  const progress = roadmap.length ? Math.round((completed.size / roadmap.length) * 100) : 0;

  if (!user) {
    return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        handleNavClick={handleNavClick} 
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
             <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>👤 {user.email.split('@')[0]}</span>
          </div>
        </div>
        
        <main className="content-area">
          {activeTab === 'roadmap' && <Dashboard roadmap={roadmap} setRoadmap={setRoadmap} completed={completed} toggleTask={toggleTask} />}
          {activeTab === 'resume' && <ResumeAnalyzer />}
          {activeTab === 'prep' && <InterviewSimulator company="Tech Company" />}
          {activeTab === 'mock' && <MockTest />}
        </main>
      </div>
    </div>
  );
}
