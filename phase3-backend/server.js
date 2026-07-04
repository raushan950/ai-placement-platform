require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Intialize DB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/authRoutes');
const featureRoutes = require('./routes/featureRoutes');

app.use('/api', authRoutes);
app.use('/api', featureRoutes);

app.get('/', (req, res) => res.send('AI Placement Assistant Core is Online! (Refactored MVC)'));

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Active on port ${PORT}`));
