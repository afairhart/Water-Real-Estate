// State Assessor URLs
const STATE_ASSESSOR_URLS = {
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

// Default assessor URL fallback
const DEFAULT_ASSESSOR_URL = 'https://www.countyassessor.com';

// Minimum properties threshold for adding test data
const MIN_PROPERTIES_THRESHOLD = 20;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 30,
  delayBetweenRequests: 2000 // 2 seconds
};

// Cron job schedule for property updates
const CRON_SCHEDULE = '0 */6 * * *'; // Every 6 hours

module.exports = {
  STATE_ASSESSOR_URLS,
  DEFAULT_ASSESSOR_URL,
  MIN_PROPERTIES_THRESHOLD,
  RATE_LIMIT_CONFIG,
  CRON_SCHEDULE
}; 