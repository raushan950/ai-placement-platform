const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header: "Bearer <token>"
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: "Access denied. No token provided." });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // adds userId to the request
    next(); // move to the next function
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};
