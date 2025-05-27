const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const propertyScraper = require('./services/scraper');
const MapUsage = require('./models/MapUsage');
const testProperties = require('./data/testProperties'); // Import test properties
const { 
  STATE_ASSESSOR_URLS, 
  DEFAULT_ASSESSOR_URL,
  MIN_PROPERTIES_THRESHOLD 
} = require('./config/constants'); // Import backend constants
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import Property model
const Property = require('./models/Property');

// API Routes
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find().sort({ lastUpdated: -1 });
    console.log('Found properties:', properties.length);
    
    // Add assessor URLs to existing properties if they don't have them
    const updatedProperties = properties.map(property => {
      const propertyObj = property.toObject();
      
      // Add assessor URL based on the property's state/location
      if (!propertyObj.assessorUrl) {
        propertyObj.assessorUrl = STATE_ASSESSOR_URLS[propertyObj.address?.state] || DEFAULT_ASSESSOR_URL;
      }
      
      return propertyObj;
    });
    
    if (properties.length < MIN_PROPERTIES_THRESHOLD) { // Use constant for threshold
      // Add realistic test properties for water investment
      // testProperties array is now imported

      // Add properties to database if they don't exist
      for (const testProp of testProperties) {
        const existingProp = await Property.findOne({ 
          'address.street': testProp.address.street,
          'address.city': testProp.address.city 
        });
        
        if (!existingProp) {
          const newProperty = new Property(testProp);
          await newProperty.save();
          console.log(`Added property: ${testProp.address.street}, ${testProp.address.city}, ${testProp.address.state}`);
          
          // Add assessor URL based on state
          const propertyObj = newProperty.toObject();
          propertyObj.assessorUrl = STATE_ASSESSOR_URLS[testProp.address.state] || DEFAULT_ASSESSOR_URL;
          
          updatedProperties.push(propertyObj);
        }
      }
      
      // Refresh the properties list to include newly added ones
      const allProperties = await Property.find().sort({ lastUpdated: -1 });
      const finalProperties = allProperties.map(property => {
        const propertyObj = property.toObject();
        
        // Add assessor URL based on state
        if (!propertyObj.assessorUrl) {
          propertyObj.assessorUrl = STATE_ASSESSOR_URLS[propertyObj.address?.state] || DEFAULT_ASSESSOR_URL;
        }
        
        return propertyObj;
      });
      
      res.json(finalProperties);
    } else {
      res.json(updatedProperties);
    }
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Schedule property updates
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled property update...');
  try {
    // Scrape on-market properties
    const onMarketProperties = await propertyScraper.scrapeOnMarketProperties();
    console.log(`Scraped ${onMarketProperties.length} on-market properties`);

    // Scrape off-market properties (to be implemented)
    const offMarketProperties = await propertyScraper.scrapeOffMarketProperties();
    console.log(`Scraped ${offMarketProperties.length} off-market properties`);

    // TODO: Analyze properties using Gemini
    // This will be implemented in the next step
  } catch (error) {
    console.error('Error in scheduled update:', error);
  }
});

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