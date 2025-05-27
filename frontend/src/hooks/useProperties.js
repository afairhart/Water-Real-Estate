import { useState, useEffect, useMemo } from 'react';
import { propertiesAPI } from '../services/api';
import { filterProperties } from '../utils/propertyFilters';

/**
 * Custom hook for managing properties data and filtering
 * @param {Object} filters - Current filter state
 * @returns {Object} Properties data and loading state
 */
export const useProperties = (filters) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await propertiesAPI.getAll();
        setProperties(data);
      } catch (err) {
        setError(err.message);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    if (!properties.length) return [];
    return filterProperties(properties, filters);
  }, [properties, filters]);

  // Refresh properties data
  const refreshProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertiesAPI.getAll();
      setProperties(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    properties,
    filteredProperties,
    loading,
    error,
    refreshProperties
  };
}; 