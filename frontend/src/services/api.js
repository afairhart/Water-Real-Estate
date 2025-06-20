import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Properties API
 */
export const propertiesAPI = {
  /**
   * Fetch all properties
   * @returns {Promise<Array>} Array of properties
   */
  getAll: async () => {
    try {
      const response = await api.get('/properties');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      throw new Error('Unable to load properties. Please try again later.');
    }
  },

  /**
   * Fetch property by ID
   * @param {string} id - Property ID
   * @returns {Promise<Object>} Property object
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch property ${id}:`, error);
      throw new Error('Unable to load property details. Please try again later.');
    }
  },

  /**
   * Create new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} Created property
   */
  create: async (propertyData) => {
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('Failed to create property:', error);
      throw new Error('Unable to create property. Please try again later.');
    }
  },

  /**
   * Update property
   * @param {string} id - Property ID
   * @param {Object} propertyData - Updated property data
   * @returns {Promise<Object>} Updated property
   */
  update: async (id, propertyData) => {
    try {
      const response = await api.put(`/properties/${id}`, propertyData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update property ${id}:`, error);
      throw new Error('Unable to update property. Please try again later.');
    }
  },

  /**
   * Delete property
   * @param {string} id - Property ID
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    try {
      await api.delete(`/properties/${id}`);
    } catch (error) {
      console.error(`Failed to delete property ${id}:`, error);
      throw new Error('Unable to delete property. Please try again later.');
    }
  }
};

export const getProperties = async () => {
  const response = await api.get('/properties');
  return response.data;
};

export const approveProperty = async (propertyId) => {
  const response = await api.put(`/properties/${propertyId}/approve`);
  return response.data;
};

export const deleteProperty = async (propertyId) => {
  const response = await api.delete(`/properties/${propertyId}`);
  return response.data;
};

export default api; 