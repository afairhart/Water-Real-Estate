const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { STATE_ASSESSOR_URLS, DEFAULT_ASSESSOR_URL, MIN_PROPERTIES_THRESHOLD } = require('../config/constants');
const testProperties = require('../data/testProperties');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({ approved: false }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
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

// Approve a property
router.put('/:id/approve', async (req, res) => {
  console.log('Approve route hit:', req.params.id);
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    property.approved = true;
    await property.save();
    console.log('Property approved:', property);
    res.json(property);
  } catch (err) {
    console.error('Error approving property:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a property
router.delete('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    await property.deleteOne();
    console.log('Property deleted:', req.params.id);
    res.json({ message: 'Property deleted' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 