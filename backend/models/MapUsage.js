const mongoose = require('mongoose');

const mapUsageSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  loadCount: {
    type: Number,
    default: 0,
    required: true
  }
});

// Create a compound index for efficient querying
mapUsageSchema.index({ date: 1 });

module.exports = mongoose.model('MapUsage', mapUsageSchema); 