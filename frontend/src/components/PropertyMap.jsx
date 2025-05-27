import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Alert, CircularProgress } from '@mui/material';
import { MAPBOX_ACCESS_TOKEN, MAP_CONFIG, CLUSTER_CONFIG } from '../constants';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const PropertyMap = ({ properties, loading }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initializeMap = async () => {
      try {
        if (!mapContainer.current) {
          setMapError('Map container not found');
          setIsMapLoading(false);
          return;
        }

        // Wait for container to have proper dimensions
        let attempts = 0;
        const maxAttempts = 50;
        const delay = 50;
        
        while ((!mapContainer.current || mapContainer.current.clientWidth === 0) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          if (!mapContainer.current) {
            setMapError('Map container removed while waiting.');
            setIsMapLoading(false);
            return;
          }
          attempts++;
        }

        if (!mapContainer.current || mapContainer.current.clientWidth === 0) {
          setMapError('Map container failed to size correctly.');
          setIsMapLoading(false);
          return;
        }

        // Clear container and create map
        mapContainer.current.innerHTML = '';
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: MAP_CONFIG.style,
          center: MAP_CONFIG.center,
          zoom: MAP_CONFIG.zoom,
          maxZoom: MAP_CONFIG.maxZoom,
          minZoom: MAP_CONFIG.minZoom,
          renderWorldCopies: false,
          preserveDrawingBuffer: false,
          attributionControl: true,
          trackResize: true
        });

        // Add controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.ScaleControl());

        map.current.on('load', () => {
          setIsMapLoading(false);
          addClusteringLayers();
          
          if (properties && properties.length > 0) {
            setTimeout(() => updatePropertiesData(), 100);
          }
          
          map.current.resize();
        });

        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Map error: ' + e.message);
          setIsMapLoading(false);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map: ' + error.message);
        setIsMapLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add clustering layers to the map
  const addClusteringLayers = () => {
    if (!map.current) return;

    // Add data source for properties with clustering enabled
    map.current.addSource('properties', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: CLUSTER_CONFIG.maxZoom,
      clusterRadius: CLUSTER_CONFIG.radius
    });

    // Add cluster circles
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'properties',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          CLUSTER_CONFIG.colors.small,
          10,
          CLUSTER_CONFIG.colors.medium,
          30,
          CLUSTER_CONFIG.colors.large
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          CLUSTER_CONFIG.sizes.small,
          10,
          CLUSTER_CONFIG.sizes.medium,
          30,
          CLUSTER_CONFIG.sizes.large
        ]
      }
    });

    // Add cluster count labels
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'properties',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Add individual property points (unclustered)
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'properties',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'listingType'], 'off-market'],
          '#ff4444',
          '#1976d2'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    addMapEventHandlers();
  };

  // Add event handlers for map interactions
  const addMapEventHandlers = () => {
    if (!map.current) return;

    // Cluster click handler
    map.current.on('click', 'clusters', (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      map.current.getSource('properties').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Individual property click handler
    map.current.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      const property = JSON.parse(properties.propertyData);
      
      const popupContent = createPopupContent(property);

      // Handle coordinate wrapping
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map.current);
    });

    // Cursor style handlers
    ['clusters', 'unclustered-point'].forEach(layer => {
      map.current.on('mouseenter', layer, () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layer, () => {
        map.current.getCanvas().style.cursor = '';
      });
    });
  };

  // Create popup content for properties
  const createPopupContent = (property) => {
    const statusText = property.listingType === 'off-market' ? 'Off Market' : 'Listed';
    
    return `
      <div style="padding: 8px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 1.1em; color: #333;">${property.address?.street || 'N/A'}</h3>
        <p style="margin: 0 0 4px 0; font-size: 0.9em; color: #666;">Price: $${property.price?.toLocaleString() || 'N/A'}</p>
        <p style="margin: 0 0 12px 0; font-size: 0.9em; color: #666;">Status: ${statusText}</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${property.sourceUrl ? `
            <a href="${property.sourceUrl}" target="_blank" rel="noopener noreferrer" 
              style="width: 100%; padding: 6px 12px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; text-decoration: none; text-align: center;">
              View on ${property.source || 'Source'}
            </a>
          ` : ''}
          ${property.assessorUrl ? `
            <a href="${property.assessorUrl}" target="_blank" rel="noopener noreferrer"
              style="width: 100%; padding: 6px 12px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; text-decoration: none; text-align: center;">
              County Assessor
            </a>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Update properties data when properties change
  useEffect(() => {
    if (map.current && map.current.loaded() && properties) {
      updatePropertiesData();
    } else if (map.current && properties && properties.length > 0) {
      const handleLoad = () => {
        updatePropertiesData();
        map.current.off('load', handleLoad);
      };
      map.current.on('load', handleLoad);
    }
  }, [properties]);

  // Update the map data source with new properties
  const updatePropertiesData = () => {
    if (!map.current || !properties) return;
    
    const source = map.current.getSource('properties');
    if (!source) return;
    
    const features = properties
      .filter(property => property.coordinates?.coordinates)
      .map(property => {
        const [lng, lat] = property.coordinates.coordinates;
        
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          return null;
        }

        return {
          type: 'Feature',
          properties: {
            id: property._id,
            listingType: property.listingType,
            propertyData: JSON.stringify(property)
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        };
      })
      .filter(feature => feature !== null);

    try {
      source.setData({
        type: 'FeatureCollection',
        features: features
      });

      // Fit map to show all properties
      if (features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach(feature => {
          bounds.extend(feature.geometry.coordinates);
        });
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error updating source data:', error);
    }
  };

  if (mapError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{mapError}</Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '500px',
        overflow: 'hidden',
      }}
    >
      {(isMapLoading || loading) && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1 
        }}>
          <CircularProgress />
        </Box>
      )}
      <div 
        ref={mapContainer} 
        style={{ 
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }} 
      />
    </Box>
  );
};

export default PropertyMap; 