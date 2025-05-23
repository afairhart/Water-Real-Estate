const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    listingType: {
        type: String,
        enum: ['on-market', 'off-market'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    waterAccess: {
        hasMunicipalWater: Boolean,
        hasWell: Boolean,
        hasWaterRights: Boolean,
        waterIssues: [String]
    },
    wastewaterAccess: {
        hasMunicipalSewer: Boolean,
        hasSeptic: Boolean,
        wastewaterIssues: [String]
    },
    environmentalIssues: [String],
    propertyDetails: {
        acres: Number,
        zoning: String,
        currentUse: String,
        potentialUse: String,
        improvements: [String]
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        required: true
    },
    sourceUrl: String,
    notes: String,
    geminiAnalysis: {
        summary: String,
        potentialValue: String,
        recommendedTechnologies: [String],
        confidence: Number
    }
});

// Create a geospatial index for coordinates
propertySchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema); 