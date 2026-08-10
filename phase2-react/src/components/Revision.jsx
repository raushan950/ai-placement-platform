import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';
import toast from 'react-hot-toast';

const REVISION_DATA = {
  OS: {
    title: "Operating Systems",
    desc: "Memory management, process scheduling, thread synchronization, deadlocks, and virtualization.",
    flashcards: [
      { q: "What is a Deadlock?", a: "A situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process. Four conditions must hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait." },
      { q: "Virtual Memory & Paging", a: "A memory management technique that mapped logical addresses to physical addresses using page tables. It allows execution of processes larger than the physical memory by swapping pages in and out of secondary storage (disk)." },
      { q: "Mutex vs. Semaphore", a: "A Mutex (Mutual Exclusion) is a locking mechanism used to synchronize access to a resource (owned by one thread at a time). A Semaphore is a signaling mechanism (using an integer value) that allows a specified number of threads to access a resource pool." },
      { q: "Thrashing in OS", a: "A state in which a virtual memory system spends more time swapping pages in and out of the disk than executing instructions. It occurs when processes do not have enough physical frames to hold their working sets." }
    ],
    faqs: [
      { q: "What are the different process scheduling algorithms?", a: "1. First-Come, First-Served (FCFS)\n2. Shortest Job First (SJF) (non-preemptive and preemptive SRTF)\n3. Round Robin (RR) (time-slice based)\n4. Priority Scheduling\n5. Multilevel Queue Scheduling." },
      { q: "Explain the banker's algorithm.", a: "A resource allocation and deadlock avoidance algorithm that tests for safety by simulating the allocation for predetermined maximum possible claims of all resources, determining if a 'safe state' exists before authorizing allocation." }
    ]
  },
  DBMS: {
    title: "Database Management Systems",
    desc: "Relational models, SQL query structures, ACID transactions, normalization, and indexing keys.",
    flashcards: [
      { q: "ACID Properties", a: "Atomicity (all-or-nothing), Consistency (integrity constraints), Isolation (concurrent executions do not affect each other), and Durability (permanence after commit)." },
      { q: "1NF, 2NF, 3NF Normalization", a: "1NF: Atomic values only. 2NF: 1NF + no partial dependency (every non-prime attribute fully functionally dependent on primary key). 3NF: 2NF + no transitive dependency." },
      { q: "Database Indexing", a: "A data structure (often B-Trees or B+ Trees) that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space." },
      { q: "Clustered vs. Non-Clustered Index", a: "A clustered index defines the physical order of data storage in a table (only 1 per table). A non-clustered index creates a separate pointer list to the physical rows (multiple allowed)." }
    ],
    faqs: [
      { q: "What is the difference between inner join, left join, and right join?", a: "- INNER JOIN: Returns records that have matching values in both tables.\n- LEFT JOIN: Returns all records from the left table, and the matched records from the right table (NULL if no match).\n- RIGHT JOIN: Returns all records from the right table, and the matched records from the left table." },
      { q: "What is a transaction state?", a: "A transaction goes through several states during its execution: Active, Partially Committed, Committed, Failed, and Aborted." }
    ]
  },
  CN: {
    title: "Computer Networks",
    desc: "TCP/IP vs. OSI model layers, routing, flow control, DNS, HTTP/HTTPS, and network security protocols.",
    flashcards: [
      { q: "OSI Model Layers", a: "7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application (Mnemonic: Please Do Not Throw Sausage Pizza Away)." },
      { q: "TCP vs. UDP", a: "TCP is connection-oriented, reliable, guarantees packet order, and does flow/congestion control. UDP is connectionless, fast, unreliable, doesn't guarantee order, and is used for video streaming/gaming." },
      { q: "What happens when you type a URL in browser?", a: "1. Browser checks cache. 2. DNS query resolves IP address. 3. TCP handshake established. 4. HTTP request sent. 5. Server processes request and sends HTTP response. 6. Browser renders HTML/CSS/JS." },
      { q: "DNS (Domain Name System)", a: "The phonebook of the Internet. It translates human-friendly domain names (e.g. google.com) into computer-friendly IP addresses (e.g. 142.250.190.46)." }
    ],
    faqs: [
      { q: "Explain the three-way handshake of TCP.", a: "It is the process used to establish a TCP socket connection:\n1. SYN: Client sends SYN packet to server.\n2. SYN-ACK: Server responds with a SYN-ACK packet.\n3. ACK: Client sends an ACK packet back. The connection is now established." },
      { q: "What is the difference between HTTP and HTTPS?", a: "HTTPS is HTTP with security. It uses SSL/TLS protocols to encrypt data transmission between browser and server, operating on port 443 instead of port 80." }
    ]
  },
  OOP: {
    title: "Object-Oriented Programming",
    desc: "Classes, objects, encapsulation, inheritance, polymorphism, and abstraction principles.",
    flashcards: [
      { q: "Four Pillars of OOP", a: "1. Encapsulation (data hiding inside classes)\n2. Inheritance (reusing parent class properties)\n3. Polymorphism (one interface, many forms)\n4. Abstraction (hiding implementation details)." },
      { q: "Compile-Time vs. Run-Time Polymorphism", a: "Compile-time polymorphism is achieved via Method Overloading (same name, different arguments). Run-time polymorphism is achieved via Method Overriding (subclass redefining parent method; resolved at runtime)." },
      { q: "Abstract Class vs. Interface", a: "An abstract class can have both abstract and concrete methods, and instance variables. An interface can only have abstract methods (in pure OOP) and static constants. A class can inherit only one class but implement multiple interfaces." },
      { q: "Method Overloading vs Overriding", a: "Overloading: Multiple methods in same class with same name but different signatures. Overriding: Subclass method matching parent method signature exactly to provide custom behavior." }
    ],
    faqs: [
      { q: "What is a virtual function?", a: "A member function in a base class that is redefined (overridden) in a derived class. It ensures that the correct function is called for an object, regardless of the type of reference/pointer used to call it (used for runtime polymorphism)." },
      { q: "Explain inheritance types.", a: "Single, Multiple (supported in C++ but not Java directly), Multilevel, Hierarchical, and Hybrid inheritance." }
    ]
  }
};

export default function Revision() {
  const [activeTab, setActiveTab] = useState('OS');
  const [flippedCard, setFlippedCard] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const subject = REVISION_DATA[activeTab];

  const handleCardClick = (idx) => {
    setFlippedCard(flippedCard === idx ? null : idx);
  };

  const handleFaqClick = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFlippedCard(null);
    setExpandedFaq(null);
    setAiResult(null);
    setAiQuery('');
  };

  const handleAiTutorSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    const toastId = toast.loading(`AI Tutor is compiling revision guides for "${aiQuery}"...`);
    try {
      const data = await fetchAPI('/explain-cs-topic', { subject: REVISION_DATA[activeTab].title, topic: aiQuery }, 'POST');
      toast.dismiss(toastId);
      if (data && !data.error) {
        setAiResult(data);
        setFlippedCard(null);
        setExpandedFaq(null);
        toast.success(`Study guides compiled!`);
      } else {
        toast.error('AI Tutor is busy. Try again later.');
      }
    } catch(err) {
      toast.dismiss(toastId);
      toast.error('Connection failed.');
    }
    setIsAiLoading(false);
  };

  const handleClearAiResult = () => {
    setAiResult(null);
    setAiQuery('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Core CS Fundamentals Revision</h1>
        <p style={{ color: 'var(--text-muted)' }}>Quickly revise Operating Systems, DBMS, Networks, and OOP concepts for written exams and technical rounds</p>
      </div>

      {/* AI Tutor search bar */}
      <form onSubmit={handleAiTutorSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder={`🔍 Ask AI Tutor anything about ${subject.title} (e.g. explain process synchronization, B-Trees vs B+ Trees)...`}
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          disabled={isAiLoading}
          style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', outline: 'none' }}
        />
        <button className="btn-primary" type="submit" disabled={isAiLoading} style={{ padding: '14px 24px' }}>
          {isAiLoading ? '🤖 Compiling...' : '🤖 Ask AI Tutor'}
        </button>
        {aiResult && (
          <button className="btn-secondary" type="button" onClick={handleClearAiResult} style={{ padding: '14px 24px', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', cursor: 'pointer', background: 'transparent' }}>
            Clear AI Result
          </button>
        )}
      </form>

      {/* Subject Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '1px', marginBottom: '24px', overflowX: 'auto' }}>
        {Object.keys(REVISION_DATA).map((tab) => (
          <button
            key={tab}
            className={`eval-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
            style={{ fontSize: '1rem', padding: '14px 24px' }}
          >
            {REVISION_DATA[tab].title}
          </button>
        ))}
      </div>

      {aiResult ? (
        /* AI TUTOR RESULTS */
        <div>
          {/* Subject Header */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px', background: 'rgba(139,92,246,0.05)', border: '1px solid var(--primary-glow)' }}>
            <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>AI TUTOR COMPILED GUIDE</span>
            <h2 style={{ color: 'white', margin: '10px 0 8px 0', fontSize: '1.4rem' }}>{aiResult.title}</h2>
            <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.98rem', lineHeight: '1.6' }}>{aiResult.explanation}</p>
          </div>

          {/* Grid: Flashcards */}
          <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>💡 Interactive AI Flashcards (Click to Flip)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {aiResult.flashcards.map((card, idx) => {
              const isFlipped = flippedCard === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => handleCardClick(idx)}
                  style={{
                    perspective: '1000px',
                    height: '180px',
                    cursor: 'pointer'
                  }}
                >
                  <div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'none'
                    }}
                  >
                    {/* Front Side */}
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '20px',
                        boxSizing: 'border-box',
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Concept</span>
                      <h4 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 600 }}>{card.q}</h4>
                    </div>

                    {/* Back Side */}
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        boxSizing: 'border-box',
                        border: '1px solid var(--primary-glow)',
                        background: 'var(--bg-hover)',
                        overflowY: 'auto'
                      }}
                    >
                      <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>
                        {card.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Interview Tips */}
          <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>📋 AI Interview Tips & High-Frequency Questions</h3>
          <div className="glass-panel" style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {aiResult.interviewTips}
          </div>
        </div>
      ) : (
        /* STANDARD SUBJECT LIST */
        <div>
          {/* Subject Header */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
            <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.4rem' }}>{subject.title}</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.98rem' }}>{subject.desc}</p>
          </div>

          {/* Grid: Flashcards */}
          <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>💡 Interactive Flashcards (Click to Flip)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {subject.flashcards.map((card, idx) => {
              const isFlipped = flippedCard === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => handleCardClick(idx)}
                  style={{
                    perspective: '1000px',
                    height: '180px',
                    cursor: 'pointer'
                  }}
                >
                  <div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'none'
                    }}
                  >
                    {/* Front Side */}
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '20px',
                        boxSizing: 'border-box',
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Concept</span>
                      <h4 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 600 }}>{card.q}</h4>
                    </div>

                    {/* Back Side */}
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        boxSizing: 'border-box',
                        border: '1px solid var(--primary-glow)',
                        background: 'var(--bg-hover)',
                        overflowY: 'auto'
                      }}
                    >
                      <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>
                        {card.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cheat Sheet Collapsible FAQs */}
          <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>📋 High-Frequency Interview Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subject.faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div 
                  key={idx}
                  className="glass-panel"
                  style={{ 
                    padding: '0', 
                    border: isOpen ? '1px solid var(--primary-glow)' : '1px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* FAQ Header */}
                  <div 
                    onClick={() => handleFaqClick(idx)}
                    style={{ 
                      padding: '20px 24px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      background: isOpen ? 'rgba(255,255,255,0.01)' : 'transparent',
                      userSelect: 'none'
                    }}
                  >
                    <h4 style={{ color: 'white', margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>{faq.q}</h4>
                    <span style={{ fontSize: '1.1rem', color: 'var(--primary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </div>
                  
                  {/* FAQ Content */}
                  {isOpen && (
                    <div 
                      style={{ 
                        padding: '20px 24px', 
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(0,0,0,0.1)'
                      }}
                    >
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
