import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Box } from '@mui/material'; // Removed unused Container
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import PropertyMap from './components/PropertyMap';
import PropertyDetails from './components/PropertyDetails';
import FilterPanel from './components/FilterPanel';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    state: '',
    priceRange: [0, 1000000],
    listingType: 'all',
    waterAccess: false,
    wastewaterAccess: false,
    waterIssues: [],
    wastewaterIssues: [],
    environmentalIssues: []
  });

  const [totalReviewed, setTotalReviewed] = useState(0);
  const [reviewedPerMinute, setReviewedPerMinute] = useState(0);
  const reviewTimestamps = useRef([]);
  const reviewedPropertyIds = useRef(new Set()); // For tracking unique reviewed properties

  useEffect(() => {
    console.log('App.jsx: Calling fetchProperties on mount');
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    console.log('App.jsx: fetchProperties called');
    try {
      console.log('App.jsx: Attempting to fetch properties from /api/properties');
      const response = await axios.get('/api/properties');
      console.log('App.jsx: Properties API response received:', response);
      if (response && response.data) {
        console.log('App.jsx: Properties data (raw):', JSON.stringify(response.data, null, 2));
        console.log('App.jsx: Number of properties fetched:', response.data.length);
        setProperties(response.data);
      } else {
        console.error('App.jsx: No data in properties API response', response);
        setProperties([]);
      }
    } catch (error) {
      console.error('App.jsx: Failed to fetch properties:', error);
      if (error.response) {
        console.error('App.jsx: Error response data:', error.response.data);
        console.error('App.jsx: Error response status:', error.response.status);
        console.error('App.jsx: Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('App.jsx: Error request:', error.request);
      } else {
        console.error('App.jsx: Error message:', error.message);
      }
      setProperties([]);
    }
  };

  const filteredProperties = useMemo(() => {
    console.log('App.jsx: useMemo for filteredProperties triggered. Raw properties count:', properties.length, 'Filters:', JSON.stringify(filters));
    const targetStates = [
      'MT', 'WY', 'CO', 'NM', // Original four
      'ID', 'UT', 'AZ', 'NV', // West of the original four
      'CA', 'OR', 'WA'        // Pacific coast
      // Add 'AK', 'HI' here if desired
    ];
    const newlyFilteredProperties = properties.filter((property, index) => {
      console.log(`App.jsx: Filtering property ${index} with address:`, property.address);
      let passes = true;
      
      // State filter
      if (filters.state) {
        if (property.address?.state !== filters.state) {
          console.log(`App.jsx: Property ${index} FAILED active state filter (expected: ${filters.state}, got: ${property.address?.state})`);
          passes = false;
        }
      } else {
        if (!property.address?.state || !targetStates.includes(property.address.state)) {
          console.log(`App.jsx: Property ${index} FAILED default target states filter (target: ${targetStates.join(', ')}, got: ${property.address?.state})`);
          passes = false;
        }
      }

      // Price filter
      if (passes && (property.price < filters.priceRange[0] || property.price > filters.priceRange[1])) {
        console.log(`App.jsx: Property ${index} FAILED price filter (price: ${property.price}, range: ${filters.priceRange})`);
        passes = false;
      }

      // Water access filter
      if (passes && filters.waterAccess && !property.waterAccess) {
        console.log(`App.jsx: Property ${index} FAILED water access filter`);
        passes = false;
      }

      // Wastewater access filter
      if (passes && filters.wastewaterAccess && !property.wastewaterAccess) {
        console.log(`App.jsx: Property ${index} FAILED wastewater access filter`);
        passes = false;
      }

      // Water issues filter
      if (passes && filters.waterIssues.length > 0) {
        const propertyWaterIssues = Array.isArray(property.waterIssues) ? property.waterIssues : [];
        if (!filters.waterIssues.some(issue => propertyWaterIssues.includes(issue))) {
          console.log(`App.jsx: Property ${index} FAILED water issues filter (expected one of: ${filters.waterIssues.join(', ')}, got: ${propertyWaterIssues.join(', ')})`);
          passes = false;
        }
      }

      // Wastewater issues filter
      if (passes && filters.wastewaterIssues.length > 0) {
        const propertyWastewaterIssues = Array.isArray(property.wastewaterIssues) ? property.wastewaterIssues : [];
        if (!filters.wastewaterIssues.some(issue => propertyWastewaterIssues.includes(issue))) {
          console.log(`App.jsx: Property ${index} FAILED wastewater issues filter (expected one of: ${filters.wastewaterIssues.join(', ')}, got: ${propertyWastewaterIssues.join(', ')})`);
          passes = false;
        }
      }

      // Environmental issues filter
      if (passes && filters.environmentalIssues.length > 0) {
        const propertyEnvironmentalIssues = Array.isArray(property.environmentalIssues) ? property.environmentalIssues : [];
        if (!filters.environmentalIssues.some(issue => propertyEnvironmentalIssues.includes(issue))) {
          console.log(`App.jsx: Property ${index} FAILED environmental issues filter (expected one of: ${filters.environmentalIssues.join(', ')}, got: ${propertyEnvironmentalIssues.join(', ')})`);
          passes = false;
        }
      }

      if (passes) {
        console.log(`App.jsx: Property ${index} PASSED all filters`);
      } else {
        // This log is useful to see the first reason a property failed if multiple logs are too much.
        // console.log(`App.jsx: Property ${index} FAILED a filter.`);
      }

      return passes;
    });

    console.log('App.jsx: useMemo completed. newlyFiltered count:', newlyFilteredProperties.length);
    return newlyFilteredProperties;
  }, [properties, filters]);

  useEffect(() => {
    // This effect runs when filteredProperties changes to update statistics
    console.log('App.jsx: useEffect for stats calculation triggered. Filtered properties count:', filteredProperties.length);
    const now = Date.now();
    
    let newlyUniqueReviewedThisBatchCount = 0;
    filteredProperties.forEach(property => {
      // Ensure property.id exists before using it
      if (property && property.id && !reviewedPropertyIds.current.has(property.id)) {
        reviewedPropertyIds.current.add(property.id);
        newlyUniqueReviewedThisBatchCount++;
      }
    });

    if (newlyUniqueReviewedThisBatchCount > 0) {
      setTotalReviewed(prevTotal => prevTotal + newlyUniqueReviewedThisBatchCount);
    }

    // For reviewedPerMinute:
    // Add a timestamp for each property currently in filteredProperties for this calculation pass
    const currentBatchTimestamps = filteredProperties.map(() => now);
    
    // Add timestamps from the current batch to the ref
    reviewTimestamps.current.push(...currentBatchTimestamps);

    // Filter all stored timestamps (including old ones and newly added ones) to the last minute
    const oneMinuteAgo = now - 60000;
    reviewTimestamps.current = reviewTimestamps.current.filter(timestamp => timestamp > oneMinuteAgo);
    
    setReviewedPerMinute(reviewTimestamps.current.length); // The count of timestamps in the last minute

    console.log('App.jsx: Total reviewed state updated by (if >0):', newlyUniqueReviewedThisBatchCount);
    console.log('App.jsx: Reviewed per minute state updated to:', reviewTimestamps.current.length);

  }, [filteredProperties]); // Dependency: run when filteredProperties changes.

  // console.log("App.jsx: Rendering App component. Total reviewed state:", totalReviewed, "RPM state:", reviewedPerMinute);


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed"> {/* Changed to fixed to prevent overlap with map if map is full height */}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Western Water Properties
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 2 }}>
            <Typography variant="body1">
              Total Reviewed: {totalReviewed}
            </Typography>
            <Typography variant="body1">
              Reviewed/Min: {reviewedPerMinute}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This is a spacer to prevent content from going under the fixed AppBar */}
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}> {/* 64px is typical AppBar height */}
        <FilterPanel filters={filters} setFilters={setFilters} />
        <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}> 
          <PropertyMap properties={filteredProperties} />
        </Box>
      </Box>
      <Routes>
        {/* PropertyDetails might be a modal or a separate page, adjust path as needed */}
        <Route path="/property/:id" element={<PropertyDetails />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;