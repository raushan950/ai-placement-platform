import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  streak, 
  progress,
  onLogout 
}) {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <h2 className="logo">Placement<span>AI</span></h2>
      <nav className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
          <span>📅</span> Daily Roadmap
        </NavLink>
        <NavLink to="/resume" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
          <span>📄</span> Resume Analyzer
        </NavLink>
        <NavLink to="/prep" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
          <span>🎯</span> Interview Simulator
        </NavLink>
        <NavLink to="/mock" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
          <span>📝</span> Live Mock Test
        </NavLink>
      </nav>
      
      <div className="stats-box mt-4">
         <h4>Your Stats</h4>
         <p><span>🔥 Streak</span> <span>{streak} Days</span></p>
         <p><span>📈 Progress</span> <span>{progress}%</span></p>
         <div className="progress-bar-bg">
           <div className="progress-bar-fill" style={{width: `${progress}%`}}></div>
         </div>
      </div>

      <button className="nav-btn" style={{marginTop: '15px'}} onClick={onLogout}>
        <span>🚪</span> Log Out
      </button>
    </aside>
  );
}
