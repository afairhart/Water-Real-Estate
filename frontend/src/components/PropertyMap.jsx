import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Paper, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWZhaXJoYXJ0IiwiYSI6ImNtYjFkeWJxdjA2emMya3EyazJjbDFyMmQifQ.qGTETfy6sn0HB5Y5vf9SOA';

const PropertyMap = ({ properties }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  console.log('PropertyMap rendered with properties:', properties);
  if (properties.length > 0) {
    console.log('First property details:', {
      coordinates: properties[0].coordinates,
      address: properties[0].address,
      listingType: properties[0].listingType
    });
  }

  useEffect(() => {
    console.log('Map initialization useEffect triggered.');

    // Only initialize map if map.current is null and container is available
    if (map.current || !mapContainer.current) {
       if (!mapContainer.current) console.log('Map container ref not available for initialization check.');
       if (map.current) console.log('Map instance already exists, skipping initialization.');
       return;
    }

    console.log('Initializing map...');
    const initializeMap = async () => {
      try {
        if (!mapContainer.current) {
          console.error('Map container ref is not available');
          setMapError('Map container not found');
          setIsLoading(false); // Stop loading if container not found
          return;
        }

        console.log('Map container ref is valid.', mapContainer.current); // Added log to check ref validity

        // Log container dimensions before waiting
        let containerRect = mapContainer.current.getBoundingClientRect();
        console.log('Map container dimensions (initial): ', {
          width: containerRect.width,
          height: containerRect.height,
          top: containerRect.top,
          left: containerRect.left
        });

        // Wait for container to have proper dimensions
        let attempts = 0;
        const maxAttempts = 80; // Increased max attempts again
        const delay = 50; // Keep delay for quicker checks
        while ((!mapContainer.current || mapContainer.current.clientWidth === 0 || mapContainer.current.clientHeight === 0) && attempts < maxAttempts) {
          console.log(`Waiting for container to have proper dimensions... Attempt ${attempts + 1}. Current client size: ${mapContainer.current ? mapContainer.current.clientWidth : 'N/A'}x${mapContainer.current ? mapContainer.current.clientHeight : 'N/A'}`);
          await new Promise(resolve => setTimeout(resolve, delay));
           if (!mapContainer.current) { // Check if ref is lost during waiting
             console.error('Map container ref lost while waiting for dimensions.');
             setMapError('Map container removed while waiting.');
             setIsLoading(false);
             return;
           }
          containerRect = mapContainer.current.getBoundingClientRect();
          attempts++;
        }

        console.log('Map container dimensions (after wait): ', {
          width: containerRect.width,
          height: containerRect.height,
          top: containerRect.top,
          left: containerRect.left
        });
         console.log('Map container client dimensions (after wait): ', {
           clientWidth: mapContainer.current ? mapContainer.current.clientWidth : 'N/A',
           clientHeight: mapContainer.current ? mapContainer.current.clientHeight : 'N/A',
         });

        if (!mapContainer.current || containerRect.width === 0 || containerRect.height === 0) {
          console.error('Map container still has zero dimensions after multiple attempts or ref is lost. Check parent container styling.');
          setMapError('Map container failed to size correctly or was removed.');
          setIsLoading(false);
          return;
        }

        // Ensure the container is empty by explicitly setting innerHTML
        if (mapContainer.current) {
           mapContainer.current.innerHTML = '';
           console.log('Map container explicitly cleared using innerHTML.');
        }

        console.log('Creating map instance...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-98.5795, 39.8283], // Center of US
          zoom: 4,
          maxZoom: 18,
          minZoom: 3,
          renderWorldCopies: false,
          preserveDrawingBuffer: false,
          attributionControl: true,
          trackResize: true
        });

        console.log('Map instance created');

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add scale control
        map.current.addControl(new mapboxgl.ScaleControl());

        map.current.on('load', () => {
          console.log('Map loaded');
           if (map.current) { // Check if map instance is still valid
             console.log('Map instance container size after load:', { // Log map\'s internal container size
               width: map.current.getContainer().clientWidth,
               height: map.current.getContainer().clientHeight
             });
           }
          setIsLoading(false);
          // Update markers only after map is loaded and properties are available
          // This is now also triggered by the properties useEffect
          console.log('Map loaded. Relying on properties useEffect for initial marker update.'); // Updated log
          if (map.current) { // Ensure map instance is valid before resizing
            map.current.resize();
            console.log('Map.resize() called after load.');
          }
        });

        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Map error: ' + e.message);
          setIsLoading(false);
        });

        // Optimize marker updates
        let updateTimeout;
        map.current.on('moveend', () => {
          clearTimeout(updateTimeout);
           console.log('moveend event triggered.');
          // Update markers only after map is loaded and properties are available
           if (map.current && map.current.loaded() && properties && properties.length > 0) {
              console.log('Map loaded and properties available on moveend, calling updateMarkers.');
              updateTimeout = setTimeout(() => {
                updateMarkers();
              }, 100);
           } else {
             console.log('Skipping marker update on moveend: map not loaded or properties empty.');
           }
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map: ' + error.message);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        console.log('Cleaning up map.');
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array - ensure this runs only once on mount

  useEffect(() => {
    console.log('Properties changed useEffect triggered. Properties count:', properties ? properties.length : 0);
    // Only call updateMarkers if properties are not empty, map is loaded and available
    if (map.current && map.current.loaded() && properties && properties.length > 0) {
      console.log('Properties changed and map loaded, calling updateMarkers.');
      if (map.current) { // Ensure map instance is valid before resizing
        map.current.resize();
        console.log('Map.resize() called after properties change.');
      }
      updateMarkers();
    } else {
      console.log('Skipping marker update from properties useEffect: map not loaded, properties empty, or map not available.');
    }
  }, [properties]); // Only runs when properties change

  const updateMarkers = () => {
    console.log('Updating markers...');
    console.log('Properties count in updateMarkers (start):', properties ? properties.length : 0);
    console.log('Properties array content in updateMarkers (start):', [...properties]);

    // If properties are empty, remove existing markers and stop
    if (!properties || properties.length === 0) {
      console.log('Properties array is empty, removing all markers.');
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      console.log('Existing markers removed due to empty properties.');
      return;
    }

    // Remove existing markers before adding new ones
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
     console.log('Existing markers removed before adding new ones.');

    if (!map.current) {
      console.error('Map instance not available for marker update.');
      return;
    }
     if (!map.current.loaded()) {
       console.log('Map not yet loaded for marker update. Skipping.');
       return;
     }
      console.log('Map is loaded, proceeding with marker creation.');

    // Get current map bounds
    const bounds = map.current.getBounds();
    console.log('Current map bounds:', {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
    
    // Create a bounds object to fit all properties
    const propertyBounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    // Add all properties to the bounds and create markers
    properties.forEach((property, index) => {
      console.log(`Processing property ${index}:`, property);
      if (!property.coordinates?.coordinates) {
        console.log(`Property ${index} missing coordinates, skipping marker:`, property);
        return;
      }
      const [lng, lat] = property.coordinates.coordinates;
      
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        console.log(`Property ${index} has invalid coordinates format, skipping marker:`, property.coordinates);
        return;
      }
       console.log(`Attempting to add marker for property ${index}:`, { lng, lat, propertyId: property._id });

      propertyBounds.extend([lng, lat]);
      hasValidCoordinates = true;

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = property.listingType === 'auction' ? 'url(/auction-marker.png)' : 'url(/standard-marker.png)';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundSize = '100%';

      const popupContent = `
        <div>
          <h3 style="margin: 0 0 5px 0; font-size: 1.1em;">${property.address?.street || 'N/A'}</h3>
          <p style="margin: 0 0 3px 0; font-size: 0.9em;">Price: $${property.price?.toLocaleString() || 'N/A'}</p>
          <p style="margin: 0 0 8px 0; font-size: 0.9em;">Status: ${property.status || 'N/A'}</p>
          <button class="view-details-button" data-property-id='''${property._id}''' data-county-website='''${property.countyWebsite || ''}''' data-zillow-link='''${property.zillowLink || ''}'''>View Details</button>
        </div>
      `;
      
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '280px' })
        .setHTML(popupContent);

      try {
         const marker = new mapboxgl.Marker(el)
           .setLngLat([lng, lat])
           .setPopup(popup)
           .addTo(map.current);

         marker.getElement().addEventListener('click', () => {
           setSelectedProperty(property);
         });

         markers.current.push(marker);
          console.log(`Marker added successfully for property ${index}:`, property._id);
          console.log('Current markers array length after adding:', markers.current.length); // Log length after adding

      } catch (error) {
         console.error(`Error adding marker for property ${index}:`, property._id, error);
      }

    });

    console.log('Total properties processed in updateMarkers:', properties.length);
    console.log('Total markers added in this update cycle:', markers.current.length);
    console.log('Markers array state at end of updateMarkers:', [...markers.current]);

    // If we have valid coordinates, fit the map to show all properties
    if (hasValidCoordinates) {
      map.current.fitBounds(propertyBounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000
      });
      console.log('Map fitted to property bounds.');
    } else {
      console.log('No valid coordinates found to fit map bounds, skipping fitBounds.');
    }
  };

  const handlePropertyClick = (propertyId, countyWebsite, zillowLink) => {
    console.log('Property clicked:', propertyId, 'County Website:', countyWebsite, 'Zillow Link:', zillowLink);
    if (countyWebsite) {
      console.log('Opening county website:', countyWebsite);
      window.open(countyWebsite, '_blank', 'noopener,noreferrer');
    } else if (zillowLink) {
      console.log('Opening Zillow link:', zillowLink);
      window.open(zillowLink, '_blank', 'noopener,noreferrer');
    } else {
      console.log('Navigating to property details page for:', propertyId);
      navigate(`/property/${propertyId}`);
    }
  };

  // Effect to add event listeners to dynamically created buttons
  useEffect(() => {
    console.log('useEffect for popup button event listeners triggered.');
    // This observer is for dynamically added popup buttons
    const observer = new MutationObserver((mutationsList, observerInstance) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            // Check if the added node itself is a button or contains a button
            const buttons = node.querySelectorAll ? node.querySelectorAll('.view-details-button') : [];
            if (node.matches && node.matches('.view-details-button')) {
              // Element itself is a button
              const propertyId = node.dataset.propertyId;
              const countyWebsite = node.dataset.countyWebsite;
              const zillowLink = node.dataset.zillowLink;
              if (propertyId) {
                console.log('Attaching click listener to new button (direct match):', { propertyId, countyWebsite, zillowLink });
                node.addEventListener('click', () => handlePropertyClick(propertyId, countyWebsite, zillowLink));
              } else {
                console.warn('Button found without propertyId (direct match)');
              }
            } else if (buttons.length > 0) {
              // Element contains button(s)
              buttons.forEach(button => {
                // Check if listener already attached to prevent duplicates, though MutationObserver should handle new nodes correctly
                if (!button.hasAttribute('data-listener-attached')) {
                  const propertyId = button.dataset.propertyId;
                  const countyWebsite = button.dataset.countyWebsite;
                  const zillowLink = button.dataset.zillowLink;
                  if (propertyId) {
                    console.log('Attaching click listener to new button (queried):', { propertyId, countyWebsite, zillowLink });
                    button.addEventListener('click', () => handlePropertyClick(propertyId, countyWebsite, zillowLink));
                    button.setAttribute('data-listener-attached', 'true'); // Mark as listener attached
                  } else {
                    console.warn('Button found without propertyId (queried)');
                  }
                }
              });
            }
          });
        }
      }
    });

    if (map.current && map.current.getCanvasContainer()) {
      console.log('Starting MutationObserver for map canvas container.');
      observer.observe(map.current.getCanvasContainer(), { childList: true, subtree: true });
    } else {
      console.log('Map canvas container not available for MutationObserver.');
    }

    return () => {
      console.log('Stopping MutationObserver.');
      observer.disconnect();
    };
  }, [map, navigate, handlePropertyClick]); // Added handlePropertyClick to dependencies

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
      {isLoading && (
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
      
      {selectedProperty && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            p: 2,
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Typography variant="h6">{selectedProperty.address.street}</Typography>
          <Typography>
            {selectedProperty.address.city}, {selectedProperty.address.state}
          </Typography>
          <Typography>Price: ${selectedProperty.price.toLocaleString()}</Typography>
          <Typography>Acres: ${selectedProperty.propertyDetails.acres}</Typography>
          <Button
            variant="contained"
            onClick={() => handlePropertyClick(selectedProperty._id, selectedProperty.countyWebsite, selectedProperty.zillowLink)}
            sx={{ mt: 1 }}
          >
            View Details
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default PropertyMap; 