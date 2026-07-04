// --- AI HELPER FUNCTION (Google Gemini Free Tier) ---
async function callGemini(prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_free_gemini_key_here') throw new Error("Missing Gemini Key");
  
  const models = [
    'gemini-2.0-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-flash-latest'
  ];
  
  const generationConfig = { temperature: 0.7 };
  if (isJson) {
      generationConfig.responseMimeType = "application/json";
  }

  let lastError = null;

  for (let i = 0; i < models.length; i++) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${models[i]}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig
        })
      });
      
      if (!response.ok) {
         const errText = await response.text();
         console.error(`Gemini API Error with model ${models[i]}:`, errText);
         if (response.status === 503 || response.status === 429) {
            lastError = new Error(`Gemini API Error: ${response.statusText}`);
            continue; 
         }
         throw new Error("Gemini API Error: " + response.statusText);
      }
      
      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      text = text.replace(/```json|```/g, '').trim();
      return text;
      
    } catch (err) {
      lastError = err;
    }
  }
  
  throw lastError || new Error("All Gemini models failed due to high demand/rate limits.");
}

module.exports = { callGemini };
