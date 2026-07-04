require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Bring in mongoose

const app = express();

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// We try to connect to the URL provided in our .env file
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB'))
  .catch((error) => console.log('❌ MongoDB Connection Error:', error));
// ---------------------------

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const featureRoutes = require('./routes/features');

app.use('/api/auth', authRoutes);
app.use('/api/features', featureRoutes); // These routes require login!

app.get('/', (req, res) => {
  res.send('Placement Assistant API is running!');
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({ error: "Internal Server Error!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});
