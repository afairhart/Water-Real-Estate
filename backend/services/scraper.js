const axios = require('axios');
const cheerio = require('cheerio');
const { Property } = require('../models/Property');
const HttpsProxyAgent = require('https-proxy-agent');
const { parseAddress } = require('parse-address');

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  delayBetweenRequests: 2000 // 2 seconds
};

// Proxy configuration
const PROXY_CONFIG = {
  enabled: process.env.USE_PROXY === 'true',
  proxyList: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
  currentProxyIndex: 0
};

class PropertyScraper {
  constructor() {
    this.sources = {
      zillow: {
        baseUrl: 'https://www.zillow.com',
        searchPath: '/search/',
        selectors: {
          listings: '[data-test="property-card"]',
          price: '[data-test="property-card-price"]',
          address: '[data-test="property-card-addr"]',
          details: '[data-test="property-card-details"]',
          waterInfo: '[data-test="water-info"]',
          wastewaterInfo: '[data-test="wastewater-info"]'
        }
      },
      landwatch: {
        baseUrl: 'https://www.landwatch.com',
        searchPath: '/search/',
        selectors: {
          listings: '.property-card',
          price: '.property-price',
          address: '.property-address',
          details: '.property-details',
          waterInfo: '.water-info',
          wastewaterInfo: '.wastewater-info'
        }
      },
      countyRecords: {
        baseUrl: 'https://county-records.example.com', // Replace with actual county records URL
        searchPath: '/search',
        selectors: {
          listings: '.record-item',
          address: '.record-address',
          details: '.record-details',
          waterRights: '.water-rights-info'
        }
      },
      taxAssessor: {
        baseUrl: 'https://tax-assessor.example.com', // Replace with actual tax assessor URL
        searchPath: '/search',
        selectors: {
          listings: '.property-record',
          address: '.property-address',
          details: '.property-details',
          waterInfo: '.water-info'
        }
      }
    };
  }

  getNextProxy() {
    if (!PROXY_CONFIG.enabled || PROXY_CONFIG.proxyList.length === 0) {
      return null;
    }
    const proxy = PROXY_CONFIG.proxyList[PROXY_CONFIG.currentProxyIndex];
    PROXY_CONFIG.currentProxyIndex = (PROXY_CONFIG.currentProxyIndex + 1) % PROXY_CONFIG.proxyList.length;
    return proxy;
  }

  async makeRequest(url, options = {}) {
    const proxy = this.getNextProxy();
    const config = {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...options.headers
      }
    };

    if (proxy) {
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }

    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      if (error.response?.status === 429) { // Rate limit exceeded
        console.log('Rate limit exceeded, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        return this.makeRequest(url, options);
      }
      throw error;
    }
  }

  async scrapeOnMarketProperties() {
    try {
      const properties = [];
      
      // Scrape from each source
      for (const [source, config] of Object.entries(this.sources)) {
        const sourceProperties = await this.scrapeSource(source, config);
        properties.push(...sourceProperties);
        
        // Rate limiting delay between sources
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
      }

      // Save new properties to database
      await this.saveProperties(properties);

      return properties;
    } catch (error) {
      console.error('Error scraping on-market properties:', error);
      throw error;
    }
  }

  async scrapeOffMarketProperties() {
    try {
      const properties = [];
      
      // Scrape all sources concurrently
      const scrapingPromises = [
        this.scrapeSource('countyRecords', this.sources.countyRecords),
        this.scrapeSource('taxAssessor', this.sources.taxAssessor)
      ];

      const results = await Promise.all(scrapingPromises);
      results.forEach(sourceProperties => properties.push(...sourceProperties));

      // Save new properties to database immediately
      await this.saveProperties(properties);

      return properties;
    } catch (error) {
      console.error('Error scraping off-market properties:', error);
      throw error;
    }
  }

  async scrapeSource(source, config) {
    try {
      const response = await this.makeRequest(`${config.baseUrl}${config.searchPath}`);
      const $ = cheerio.load(response.data);
      const properties = [];

      // Extract coordinates from the page
      const coordinates = this.extractCoordinates($, element);

      $(config.selectors.listings).each((i, element) => {
        const property = this.parseProperty($, element, config.selectors, source);
        if (property) {
          // Add coordinates to the property
          property.coordinates = coordinates;
          properties.push(property);
        }
      });

      return properties;
    } catch (error) {
      console.error(`Error scraping ${source}:`, error);
      return [];
    }
  }

  extractCoordinates($, element) {
    try {
      // Try to find coordinates in various formats
      const lat = $(element).find('[data-latitude]').attr('data-latitude') ||
                 $(element).find('.latitude').text() ||
                 $(element).find('[data-lat]').attr('data-lat');
      
      const lng = $(element).find('[data-longitude]').attr('data-longitude') ||
                 $(element).find('.longitude').text() ||
                 $(element).find('[data-lng]').attr('data-lng');

      if (lat && lng) {
        return {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        };
      }
      return null;
    } catch (error) {
      console.error('Error extracting coordinates:', error);
      return null;
    }
  }

  parseProperty($, element, selectors, source) {
    try {
      const priceText = $(element).find(selectors.price).text();
      const address = $(element).find(selectors.address).text();
      const details = $(element).find(selectors.details).text();
      const waterInfo = $(element).find(selectors.waterInfo).text();
      const wastewaterInfo = $(element).find(selectors.wastewaterInfo).text();

      // Extract price (remove currency symbol and commas)
      const price = parseInt(priceText.replace(/[^0-9]/g, ''));

      // Parse address using parse-address library
      const parsedAddress = parseAddress(address);
      
      // Extract water and wastewater information
      const waterAccess = this.parseWaterAccess(waterInfo);
      const wastewaterAccess = this.parseWastewaterAccess(wastewaterInfo);
      
      // Extract property details
      const propertyDetails = this.parsePropertyDetails(details);

      return {
        address: {
          street: parsedAddress.street,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zipCode: parsedAddress.zip
        },
        listingType: source === 'countyRecords' || source === 'taxAssessor' ? 'off-market' : 'on-market',
        price,
        waterAccess: waterAccess.hasAccess,
        wastewaterAccess: wastewaterAccess.hasAccess,
        waterIssues: waterAccess.issues,
        wastewaterIssues: wastewaterAccess.issues,
        environmentalIssues: this.parseEnvironmentalIssues(details),
        propertyDetails,
        lastUpdated: new Date(),
        source,
        sourceUrl: this.constructSourceUrl(source, element),
        notes: details
      };
    } catch (error) {
      console.error('Error parsing property:', error);
      return null;
    }
  }

  parseWaterAccess(waterInfo) {
    const issues = [];
    let hasAccess = false;

    if (waterInfo) {
      hasAccess = !waterInfo.toLowerCase().includes('no water');
      if (waterInfo.toLowerCase().includes('well')) {
        issues.push('Well water only');
      }
      if (waterInfo.toLowerCase().includes('shared')) {
        issues.push('Shared water rights');
      }
    }

    return { hasAccess, issues };
  }

  parseWastewaterAccess(wastewaterInfo) {
    const issues = [];
    let hasAccess = false;

    if (wastewaterInfo) {
      hasAccess = !wastewaterInfo.toLowerCase().includes('no sewer');
      if (wastewaterInfo.toLowerCase().includes('septic')) {
        issues.push('Septic system required');
      }
      if (wastewaterInfo.toLowerCase().includes('shared')) {
        issues.push('Shared wastewater system');
      }
    }

    return { hasAccess, issues };
  }

  parsePropertyDetails(details) {
    const acres = this.extractAcres(details);
    const zoning = this.extractZoning(details);
    const improvements = this.extractImprovements(details);

    return {
      acres,
      zoning,
      improvements
    };
  }

  extractAcres(details) {
    const match = details.match(/(\d+(?:\.\d+)?)\s*(?:acres|ac)/i);
    return match ? parseFloat(match[1]) : 0;
  }

  extractZoning(details) {
    const match = details.match(/zoning:\s*([A-Z0-9-]+)/i);
    return match ? match[1] : '';
  }

  extractImprovements(details) {
    const improvements = [];
    if (details.toLowerCase().includes('house')) improvements.push('House');
    if (details.toLowerCase().includes('barn')) improvements.push('Barn');
    if (details.toLowerCase().includes('fence')) improvements.push('Fence');
    return improvements;
  }

  parseEnvironmentalIssues(details) {
    const issues = [];
    const environmentalKeywords = [
      'flood zone',
      'wetland',
      'endangered species',
      'contamination',
      'hazardous waste'
    ];

    environmentalKeywords.forEach(keyword => {
      if (details.toLowerCase().includes(keyword)) {
        issues.push(keyword);
      }
    });

    return issues;
  }

  constructSourceUrl(source, element) {
    const baseUrl = this.sources[source].baseUrl;
    const id = element.attr('data-id') || element.attr('id');
    return id ? `${baseUrl}/property/${id}` : '';
  }

  async saveProperties(properties) {
    try {
      // Filter out properties that already exist in the database
      const existingProperties = await Property.find({
        'address.street': { $in: properties.map(p => p.address.street) }
      });

      const existingAddresses = new Set(
        existingProperties.map(p => p.address.street)
      );

      const newProperties = properties.filter(
        p => !existingAddresses.has(p.address.street)
      );

      if (newProperties.length > 0) {
        await Property.insertMany(newProperties);
        console.log(`Added ${newProperties.length} new properties`);
      }
    } catch (error) {
      console.error('Error saving properties:', error);
      throw error;
    }
  }
}

module.exports = new PropertyScraper(); 