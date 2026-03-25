import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';

export default function MockTest() {
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateMock = async () => {
    setIsLoading(true);
    const data = await fetchAPI('/generate-mock', {});
    if(data) setMockTest(data.questions);
    setIsLoading(false);
  };

  return (
    <div className="tab-pane fade-in">
      {isLoading && <div className="loader-overlay"><div className="spinner"></div><p style={{color:'white', fontWeight:500}}>Generating Assessment...</p></div>}
      <h1>Instant AI Mock Test</h1>
      <p className="subtext">Test your readiness under pressure.</p>
      <button className="btn-primary" onClick={handleGenerateMock} disabled={isLoading}>Generate Live Assessment</button>

      {mockTest && (
         <div className="mock-container mt-4">
            {mockTest.map((q, idx) => (
               <div key={idx} className="mock-question-card glass-panel" style={{marginBottom: '20px'}}>
                  <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <h3 style={{marginTop: '10px'}}>{q.title}</h3>
                  <p className="text-muted" style={{marginTop: '10px'}}>{q.description}</p>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
