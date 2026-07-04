const fs = require('fs');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  console.log(data.models.map(m => m.name).filter(n => n.includes('gemini')));
}
listModels();
