import React from 'react';

export default function Sidebar({ 
  activeTab, 
  handleNavClick, 
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
        <button className={`nav-btn ${activeTab==='roadmap'?'active':''}`} onClick={()=>handleNavClick('roadmap')}>
          <span>📅</span> Daily Roadmap
        </button>
        <button className={`nav-btn ${activeTab==='resume'?'active':''}`} onClick={()=>handleNavClick('resume')}>
          <span>📄</span> Resume Analyzer
        </button>
        <button className={`nav-btn ${activeTab==='prep'?'active':''}`} onClick={()=>handleNavClick('prep')}>
          <span>🎯</span> Interview Simulator
        </button>
        <button className={`nav-btn ${activeTab==='mock'?'active':''}`} onClick={()=>handleNavClick('mock')}>
          <span>📝</span> Live Mock Test
        </button>
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
