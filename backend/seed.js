const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

const sampleProperties = [
  {
    address: {
      street: '123 Waterfront Drive',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101'
    },
    coordinates: {
      type: 'Point',
      coordinates: [-122.3321, 47.6062]
    },
    listingType: 'on-market',
    price: 750000,
    waterAccess: true,
    wastewaterAccess: true,
    waterIssues: [],
    wastewaterIssues: [],
    environmentalIssues: [],
    propertyDetails: {
      acres: 5,
      zoning: 'Residential',
      improvements: ['House', 'Barn', 'Well']
    },
    lastUpdated: new Date(),
    source: 'Zillow',
    sourceUrl: 'https://zillow.com/123-waterfront',
    notes: 'Beautiful waterfront property with existing well',
    geminiAnalysis: {
      summary: 'Prime waterfront property with existing water infrastructure. High potential for value appreciation.',
      potentialValue: 'Property could appreciate 20-30% with water rights development',
      recommendedTechnologies: ['Water Filtration System', 'Rainwater Harvesting'],
      confidence: 85
    }
  },
  {
    address: {
      street: '456 Desert Road',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    },
    coordinates: {
      type: 'Point',
      coordinates: [-112.0740, 33.4484]
    },
    listingType: 'off-market',
    price: 450000,
    waterAccess: false,
    wastewaterAccess: false,
    waterIssues: ['No Municipal Water', 'No Well Access'],
    wastewaterIssues: ['No Septic System'],
    environmentalIssues: ['Water Quality Issues'],
    propertyDetails: {
      acres: 10,
      zoning: 'Agricultural',
      improvements: ['Storage Shed']
    },
    lastUpdated: new Date(),
    source: 'LandWatch',
    sourceUrl: 'https://landwatch.com/456-desert',
    notes: 'Large parcel with water rights potential',
    geminiAnalysis: {
      summary: 'Challenging property with significant water infrastructure needs. High risk, high reward potential.',
      potentialValue: 'Property value could double with proper water infrastructure development',
      recommendedTechnologies: ['Solar Desalination', 'Water Recycling System'],
      confidence: 70
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing properties
    await Property.deleteMany({});
    console.log('Cleared existing properties');

    // Insert sample properties
    await Property.insertMany(sampleProperties);
    console.log('Added sample properties');

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed(); 