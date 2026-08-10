import React, { useState } from 'react';

const PROJECT_IDEAS_DATABASE = {
  Fullstack: {
    Beginner: [
      {
        title: "Personal Portfolio & Blog Platform",
        desc: "A developer portfolio where you can showcase projects and write blogs using a lightweight markdown editor, backed by a Node/Express API.",
        tech: ["React.js", "Node.js", "Express", "MongoDB", "CSS Grid"],
        architecture: `
  +------------------+       HTTP Requests       +------------------+
  |  React Frontend  | <=======================> |   Express API    |
  |  (Vite + CSS)    |                           |  (JWT Authed)    |
  +------------------+                           +------------------+
                                                          ||
                                                          || Mongoose
                                                          \\/
                                                 +------------------+
                                                 |   MongoDB Atlas  |
                                                 +------------------+`,
        roadmap: [
          { phase: "Phase 1: Database & API", steps: "Initialize Express, connect to MongoDB, and build basic GET/POST endpoints for projects and blog posts." },
          { phase: "Phase 2: Authentication", steps: "Implement simple JWT login for the administrator to create, update, or delete blog posts." },
          { phase: "Phase 3: Frontend Setup", style: { color: 'var(--primary)' }, steps: "Create visual grid cards for projects, configure routing, and build Markdown support." },
          { phase: "Phase 4: Optimization", steps: "Add local caching, optimize bundle size, and host on Vercel/Render." }
        ],
        valuableFor: ["TCS", "Cognizant", "Infosys", "Medium-size Agencies"]
      }
    ],
    Intermediate: [
      {
        title: "E-Commerce Micro-Marketplace",
        desc: "A scalable online storefront supporting product listings, user checkout cart, mock payment gateway integration, and order history tracking.",
        tech: ["React.js", "Node.js", "Redux Toolkit", "MongoDB", "Stripe API"],
        architecture: `
  +-----------------------+                    +-----------------------+
  |    React Frontend     | <================> |  Node.js Express API  |
  |  (Redux State + UI)   |    REST Requests   |  (Auth + Cart Logic)  |
  +-----------------------+                    +-----------------------+
              ||                                           ||
              || Direct Token                              || SDK
              \\/                                           \\/
  +-----------------------+                    +-----------------------+
  |   Stripe Checkout     |                    |  MongoDB Database     |
  |   (Mock Gateway)      |                    |  (Users, Products)    |
  +-----------------------+                    +-----------------------+`,
        roadmap: [
          { phase: "Phase 1: Schema Design", steps: "Create schemas for Users, Products, Cart items, and Orders. Set up indexes on product search queries." },
          { phase: "Phase 2: Cart & Payments API", steps: "Build cart endpoints and integrate Stripe webhooks/sessions to handle order processing." },
          { phase: "Phase 3: Frontend UI", steps: "Construct storefront grid, search filters, state-driven cart drawer, and checkout status views." },
          { phase: "Phase 4: Security & Validation", steps: "Implement server-side inputs validation, express-validator, and test edge case transactions." }
        ],
        valuableFor: ["Amazon", "Flipkart", "PayPal", "Razorpay"]
      }
    ],
    Advanced: [
      {
        title: "Real-Time Collaborative Project Dashboard",
        desc: "A high-performance workspace like Trello or Notion, supporting concurrent editing, drag-and-drop task boards, and live notifications.",
        tech: ["React.js", "Node.js", "Socket.io", "Redis", "PostgreSQL", "Prisma"],
        architecture: `
               +-----------------------------+
               |  React UI Client (Tailwind) |
               +-----------------------------+
                   || Socket.io        || REST
                   \\/                  \\/
  +-----------------------+    Sync    +-----------------------+
  | Socket.io WS Server   | <========> |   Express API Server  |
  |  (Live Room States)   |            |   (HTTP Auth & Board) |
  +-----------------------+            +-----------------------+
              ||                                   ||
              \\/ Cache                             \\/ ORM
  +-----------------------+            +-----------------------+
  |    Redis In-Memory    |            |  PostgreSQL Database  |
  |  (Active User PubSub) |            |   (Persistent Boards) |
  +-----------------------+            +-----------------------+`,
        roadmap: [
          { phase: "Phase 1: WS Handshake & Room Logic", steps: "Configure socket events, join workspace rooms, and serialize room activities." },
          { phase: "Phase 2: Redis Caching & DB Sync", steps: "Cache board states in Redis for zero-latency sync. Persist changes to PostgreSQL in batches." },
          { phase: "Phase 3: Frontend Collaborative UI", steps: "Design drag-and-drop boards using react-beautiful-dnd and overlay cursors of active users." },
          { phase: "Phase 4: Scalability Audit", steps: "Test workspace under heavy socket concurrency, set up rate limiters, and cluster WS connections." }
        ],
        valuableFor: ["Atlassian", "Slack", "Microsoft", "Stripe"]
      }
    ]
  },
  AI_ML: {
    Beginner: [
      {
        title: "Spam Email Classifier",
        desc: "A machine learning utility that classifies email messages as Spam or Ham using natural language processing techniques and Naive Bayes.",
        tech: ["Python", "Flask", "Scikit-Learn", "NLTK", "Pandas"],
        architecture: `
  +-------------------+      Flask Request     +-------------------+
  |   Simple Web UI   | <====================> | Flask Backend App |
  | (HTML/CSS/JS Form)|                        | (NLTK pre-process)|
  +-------------------+                        +-------------------+
                                                         ||
                                                         || Predict
                                                         \\/
                                               +-------------------+
                                               | Trained ML Model  |
                                               | (Multinomial NB)  |
                                               +-------------------+`,
        roadmap: [
          { phase: "Phase 1: Dataset & Cleaning", steps: "Download SMS Spam dataset, clean texts, remove stop-words, and apply stemming/lemmatization." },
          { phase: "Phase 2: Vectorization & Fit", steps: "Convert raw texts to TF-IDF vectors, split dataset, and train Scikit-Learn MultinomialNB classifier." },
          { phase: "Phase 3: Flask Deploy API", steps: "Wrap the trained model in a simple Flask web API and construct the predict POST endpoint." },
          { phase: "Phase 4: Validation", steps: "Compute precision, recall, F1 scores, and test prediction on custom email inputs." }
        ],
        valuableFor: ["Oracle", "Capgemini", "Accenture"]
      }
    ],
    Intermediate: [
      {
        title: "AI-Powered PDF Summarizer & Q&A chatbot",
        desc: "Upload complex technical PDF documents and ask questions in natural language. The chatbot extracts relevant sections and highlights key points.",
        tech: ["Python", "FastAPI", "Gemini API / OpenAI", "LangChain", "ChromaDB"],
        architecture: `
  +--------------------+                     +--------------------+
  | React Web Client   | <=================> |    FastAPI App     |
  | (PDF Upload & Chat)|     REST Calls      | (LangChain Pipeline|
  +--------------------+                     +--------------------+
                                                       ||
                                       +---------------+---------------+
                                       || Embed                        || Retrieve
                                       \\/                              \\/
                             +--------------------+          +--------------------+
                             | Chroma Vector DB   |          |  Gemini Pro API    |
                             | (Document Chunks)  |          | (Context Synthesis)|
                             +--------------------+          +--------------------+`,
        roadmap: [
          { phase: "Phase 1: Document Processing", steps: "Extract text from uploaded PDFs, chunk it into standard pieces using recursive text splitters." },
          { phase: "Phase 2: Vector Database Setup", steps: "Vectorize chunks using Google GenAI / OpenAI embeddings, store vectors in ChromaDB or Pinecone." },
          { phase: "Phase 3: Q&A Retrieval Chain", steps: "Build a retrieval chain using LangChain. Construct prompts to ground model answers in the PDF context." },
          { phase: "Phase 4: Frontend Chat interface", steps: "Design message bubbles, loader animations, and PDF dropzones." }
        ],
        valuableFor: ["Google", "Microsoft", "OpenAI", "Consulting Firms"]
      }
    ],
    Advanced: [
      {
        title: "Intelligent Recommendation & Analytics Pipeline",
        desc: "A scalable event-driven recommendation engine tracking user clickstreams and using collaborative filtering to recommend articles in real time.",
        tech: ["Python", "Kafka", "Apache Spark", "Surprise Library", "FastAPI"],
        architecture: `
  +-----------------+      Publish Event     +-------------------+
  | Web Clickstream | =====================> |   Apache Kafka    |
  |   App Client    |                        |   (Ingest Topic)  |
  +-----------------+                        +-------------------+
                                                       ||
                                                       || Spark Stream
                                                       \\/
  +-----------------+      Fetch Stats       +-------------------+
  |   FastAPI UI    | <===================== |   Apache Spark    |
  | (Recommendations)|                        |  (MLlib Model)    |
  +-----------------+                        +-------------------+`,
        roadmap: [
          { phase: "Phase 1: Clickstream Producer", steps: "Set up a lightweight script or gateway API to publish page views and click events into Kafka." },
          { phase: "Phase 2: Real-time Ingestion", steps: "Configure Spark Streaming to read Kafka events, aggregate actions, and compute live user interest scores." },
          { phase: "Phase 3: Model Training", steps: "Deploy a Collaborative Filtering matrix factorization model (e.g. ALS) and save weights." },
          { phase: "Phase 4: API Serve & Deploy", steps: "Build FastAPI endpoints to look up recommendations from Spark cache tables and render them in the UI." }
        ],
        valuableFor: ["Netflix", "Meta", "Amazon", "Twitter"]
      }
    ]
  }
};

export default function ProjectRecommendations() {
  const [techStack, setTechStack] = useState('Fullstack');
  const [level, setLevel] = useState('Intermediate');
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const toastId = toast.loading('AI is crafting a custom project architecture blueprint...');
    try {
      const data = await fetchAPI('/generate-project-blueprint', { techStack, level }, 'POST');
      toast.dismiss(toastId);
      if (data && !data.error) {
        setGeneratedIdeas(data);
        setHasGenerated(true);
        toast.success('Successfully generated blueprint!');
      } else {
        toast.error('AI blueprint service failed. Using local backups.');
        const list = PROJECT_IDEAS_DATABASE[techStack]?.[level] || [];
        setGeneratedIdeas(list);
        setHasGenerated(true);
      }
    } catch(err) {
      toast.dismiss(toastId);
      toast.error('Connection failed.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Project Recommendations</h1>
        <p style={{ color: 'var(--text-muted)' }}>Generate premium resume-worthy software development project plans matching your target placement tier</p>
      </div>

      {/* Inputs Form */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontWeight: 600 }}>TECH STACK CATEGORY</label>
            <select 
              value={techStack} 
              onChange={(e) => setTechStack(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
            >
              <option value="Fullstack" style={{ background: '#0f172a' }}>Fullstack Web Development</option>
              <option value="AI_ML" style={{ background: '#0f172a' }}>AI & Machine Learning</option>
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontWeight: 600 }}>COMPLEXITY / SKILL LEVEL</label>
            <select 
              value={level} 
              onChange={(e) => setLevel(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
            >
              <option value="Beginner" style={{ background: '#0f172a' }}>Beginner (Core Skills)</option>
              <option value="Intermediate" style={{ background: '#0f172a' }}>Intermediate (Industry Standard)</option>
              <option value="Advanced" style={{ background: '#0f172a' }}>Advanced (Scale & System Design)</option>
            </select>
          </div>

          <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ padding: '14px 28px', fontSize: '0.98rem' }}>
            {loading ? '⚡ Generating...' : '⚡ Generate Project Blueprint'}
          </button>
        </div>
      </div>

      {/* Generated Project blueprints */}
      {hasGenerated && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {generatedIdeas.map((idea, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '36px' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {level} Project
                  </span>
                  <h2 style={{ color: '#fff', fontSize: '1.6rem', marginTop: '10px', marginBottom: '6px', fontWeight: 800 }}>{idea.title}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', margin: 0, lineHeight: '1.5' }}>{idea.desc}</p>
                </div>
              </div>

              {/* Grid Tech and Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ color: 'white', marginBottom: '10px' }}>Suggested Tech Stack</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {idea.tech.map((t, i) => (
                      <span key={i} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', color: 'white', fontWeight: 500 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: 'white', marginBottom: '10px' }}>Placement Value Tier</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Highly valued during tech screens and resume reviews at: <strong style={{ color: 'white' }}>{idea.valuableFor.join(', ')}</strong>.
                  </p>
                </div>
              </div>

              {/* System Architecture Section */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: 'white', marginBottom: '12px' }}>System Architecture Diagram</h4>
                <pre 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem', 
                    background: '#090d16', 
                    padding: '24px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    color: '#a5b4fc', 
                    overflowX: 'auto',
                    lineHeight: '1.4'
                  }}
                >
                  {idea.architecture}
                </pre>
              </div>

              {/* Implementation Roadmap */}
              <div>
                <h4 style={{ color: 'white', marginBottom: '16px' }}>Step-by-Step Implementation Roadmap</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {idea.roadmap.map((phase, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '8px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyAlignment: 'center', borderRadius: '50%', flexShrink: 0, fontWeight: 'bold', justifyContent: 'center' }}>
                        {i + 1}
                      </div>
                      <div>
                        <strong style={{ color: 'white', display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>{phase.phase}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>{phase.steps}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
      {!hasGenerated && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '3.5rem' }}>🏗️</span>
          <h3 style={{ color: '#fff', marginTop: '20px' }}>Blueprints ready for generation</h3>
          <p>Select your tech stack and target skill level, and click Generate to see system schematics and phase plans.</p>
        </div>
      )}
    </div>
  );
}
