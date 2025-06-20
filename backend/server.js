const express = require('express');
const cors = require('cors');
// const cron = require('node-cron'); // No longer needed
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// const propertyScraper = require('./services/scraper'); // No longer needed
const MapUsage = require('./models/MapUsage');
const propertyRoutes = require('./routes/properties');
const { 
  STATE_ASSESSOR_URLS, 
  DEFAULT_ASSESSOR_URL,
  MIN_PROPERTIES_THRESHOLD 
} = require('./config/constants'); // Import backend constants
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Initialize Gemini
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('GEMINI_API_KEY not found in .env. Features using Gemini will be disabled.');
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/water-fund';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import Property model
const Property = require('./models/Property');

// Use property routes
app.use('/api/properties', propertyRoutes);

// The scheduled property update job has been completely removed.
// The application will now rely on the static test data.

// Map usage tracking endpoints
app.get('/api/map/usage', async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await MapUsage.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalLoads: { $sum: '$loadCount' }
        }
      }
    ]);

    const totalLoads = usage[0]?.totalLoads || 0;
    const remainingLoads = Math.max(0, 100000 - totalLoads);

    res.json({
      totalLoads,
      remainingLoads,
      monthlyLimit: 100000
    });
  } catch (error) {
    console.error('Error getting map usage:', error);
    res.status(500).json({ error: 'Failed to get map usage' });
  }
});

app.post('/api/map/load', async (req, res) => {
  try {
    await MapUsage.create({
      date: new Date(),
      loadCount: 1
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking map load:', error);
    res.status(500).json({ error: 'Failed to track map load' });
  }
});

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Water Real Estate Fund Agent API' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 