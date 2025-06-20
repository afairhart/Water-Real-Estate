import { useState, useEffect, useMemo } from 'react';
import { getProperties, approveProperty as approvePropertyApi, deleteProperty as deletePropertyApi } from '../services/api';
import { filterProperties } from '../utils/propertyFilters';

/**
 * Custom hook for managing properties data and filtering
 * @param {Object} filters - Current filter state
 * @returns {Object} Properties data and loading state
 */
export const useProperties = (filters = {}) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties();
      setProperties(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const approveProperty = async (propertyId) => {
    try {
      await approvePropertyApi(propertyId);
      setProperties(properties.map(property => 
        property._id === propertyId 
          ? { ...property, approved: true }
          : property
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteProperty = async (propertyId) => {
    try {
      await deletePropertyApi(propertyId);
      setProperties(properties.filter(property => property._id !== propertyId));
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredProperties = useMemo(() => {
    if (!properties.length) return [];
    return filterProperties(properties, filters);
  }, [properties, filters]);

  return {
    properties,
    filteredProperties,
    loading,
    error,
    approveProperty,
    deleteProperty,
    refreshProperties: fetchProperties
  };
}; 