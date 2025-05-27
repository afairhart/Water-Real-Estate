// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Map Configuration
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWZhaXJoYXJ0IiwiYSI6ImNtYjFkeWJxdjA2emMya3EyazJjbDFyMmQifQ.qGTETfy6sn0HB5Y5vf9SOA';

export const MAP_CONFIG = {
  center: [-98.5795, 39.8283], // Center of US
  zoom: 4,
  maxZoom: 18,
  minZoom: 3,
  style: 'mapbox://styles/mapbox/streets-v12'
};

// Target States for Property Investment
export const TARGET_STATES = [
  'MT', 'WY', 'CO', 'NM', // Original four
  'ID', 'UT', 'AZ', 'NV', // West of the original four
  'CA', 'OR', 'WA'        // Pacific coast
];

// State Assessor URLs
export const STATE_ASSESSOR_URLS = {
  'WA': 'https://www.kingcounty.gov/depts/assessor.aspx',
  'AZ': 'https://www.maricopa.gov/1326/Assessor',
  'CA': 'https://www.boe.ca.gov/proptaxes/',
  'CO': 'https://www.colorado.gov/pacific/dola/property-tax',
  'ID': 'https://tax.idaho.gov/i-1036.cfm',
  'MT': 'https://mtrevenue.gov/property/',
  'NV': 'https://www.washoecounty.us/assessor/',
  'NM': 'https://www.tax.newmexico.gov/property-taxes/',
  'OR': 'https://www.oregon.gov/dor/programs/property/Pages/default.aspx',
  'UT': 'https://propertytax.utah.gov/',
  'WY': 'https://revenue.wyo.gov/property-tax-division'
};

// Filter Options
// export const WATER_ISSUES = ['Low yield', 'Seasonal', 'Hard water'];
// export const WASTEWATER_ISSUES = ['Septic issues', 'No connection available'];
// export const ENVIRONMENTAL_ISSUES = ['Water scarcity', 'Water restrictions', 'Drought conditions'];

// UI Constants
export const PRICE_RANGE_MAX = 5000000;
export const PRICE_RANGE_DEFAULT = [0, 1000000];

// Specific Property Challenges
export const SPECIFIC_CHALLENGES = {
  VERY_LOW_SUPPLY: 'Very Low Supply',
  SEASONALLY_UNAVAILABLE_DRINKING_WATER: 'Seasonally Unavailable Drinking Water',
  SEPTIC_ENVIRONMENTAL_CHALLENGES: 'Septic Environmental Challenges',
  SEPTIC_SPATIAL_CHALLENGES: 'Septic Spatial Challenges',
  NO_DRINKING_WATER_AVAILABLE: 'No Drinking Water Available',
};

// Clustering Configuration
export const CLUSTER_CONFIG = {
  maxZoom: 14,
  radius: 50,
  colors: {
    small: '#51bbd6',
    medium: '#f1f075', 
    large: '#f28cb1'
  },
  sizes: {
    small: 20,
    medium: 30,
    large: 40
  }
}; 