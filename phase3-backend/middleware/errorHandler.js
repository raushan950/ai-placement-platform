const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error Handler Caught:", err.message);
  
  if (err.message === "Missing Gemini Key") {
      return res.status(401).json({ error: "Missing GEMINI_API_KEY in backend .env file. Create a free key at Google AI Studio." });
  }

  res.status(500).json({ 
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
