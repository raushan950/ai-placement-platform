function generateRoadmap() {
  const companyInput = document.getElementById('company').value.trim();
  const daysInput = document.getElementById('days').value;
  const outputDiv = document.getElementById('roadmap-output');
  const title = document.getElementById('roadmap-title');
  const content = document.getElementById('roadmap-content');

  // Validation
  if (!companyInput || !daysInput || daysInput <= 0) {
      alert("Please enter a valid company name and number of days (greater than 0).");
      return;
  }

  const company = companyInput.toLowerCase();
  const days = parseInt(daysInput);
  
  // Logic for different company types
  const productBased = ['google', 'amazon', 'microsoft', 'meta', 'apple', 'netflix', 'atlassian', 'uber'];
  const serviceBased = ['tcs', 'infosys', 'wipro', 'cognizant', 'accenture', 'capgemini', 'hcl'];

  let phases = [];

  if (productBased.some(c => company.includes(c))) {
      // Product Based Roadmap
      phases = [
          {
              name: `Phase 1: Advanced DSA (Days 1 - ${Math.floor(days * 0.4)})`,
              desc: "Focus on Trees, Graphs, Dynamic Programming, and System constraints. Practice on LeetCode Medium/Hard."
          },
          {
              name: `Phase 2: System Design (Days ${Math.floor(days * 0.4) + 1} - ${Math.floor(days * 0.8)})`,
              desc: "High-level design, database sharding, microservices architecture, and API design."
          },
          {
              name: `Phase 3: Mock Interviews & Fundamentals (Days ${Math.floor(days * 0.8) + 1} - ${days})`,
              desc: "CS core subjects (OS, DBMS, Networks), behavioral questions, and mock interviews."
          }
      ];
  } else if (serviceBased.some(c => company.includes(c))) {
      // Service Based Roadmap
      phases = [
          {
              name: `Phase 1: Aptitude & Logic (Days 1 - ${Math.floor(days * 0.3)})`,
              desc: "Quantitative aptitude, logical reasoning, and verbal ability."
          },
          {
              name: `Phase 2: Core Coding & SQL (Days ${Math.floor(days * 0.3) + 1} - ${Math.floor(days * 0.7)})`,
              desc: "Basic programming (Strings, Arrays), OOPS concepts, and SQL queries."
          },
          {
              name: `Phase 3: Tech Interview Prep (Days ${Math.floor(days * 0.7) + 1} - ${days})`,
              desc: "Project explanation, fundamental CS basics, and company-specific previous papers."
          }
      ];
  } else {
      // Generic Roadmap
      phases = [
          {
              name: `Phase 1: Foundations & DSA (Days 1 - ${Math.floor(days * 0.4)})`,
              desc: "Master arrays, hash maps, sorting algorithms, and basic data structures."
          },
          {
              name: `Phase 2: Tech Stack Development (Days ${Math.floor(days * 0.4) + 1} - ${Math.floor(days * 0.7)})`,
              desc: "Build/Review 1-2 strong projects based on your core tech stack (Web/App dev, ML)."
          },
          {
              name: `Phase 3: Final Polish (Days ${Math.floor(days * 0.7) + 1} - ${days})`,
              desc: "Resume review, standard HR questions, and OS/DBMS theory revisions."
          }
      ];
  }

  // Render to UI
  title.textContent = `Your ${companyInput} Roadmap (${days} Days)`;
  content.innerHTML = phases.map(p => `
      <div class="roadmap-phase">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
      </div>
  `).join('');

  outputDiv.classList.remove('hidden');
}
