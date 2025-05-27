import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import PropertyMap from './components/PropertyMap';
import PropertyDetails from './components/PropertyDetails';
import FilterPanel from './components/FilterPanel';
import { useProperties } from './hooks/useProperties';
import { PRICE_RANGE_DEFAULT } from './constants';

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
  const [filters, setFilters] = useState({
    state: '',
    priceRange: PRICE_RANGE_DEFAULT,
    propertyType: 'all',
    noWaterAccess: false,
    noWastewaterAccess: false,
    specificChallenges: []
  });

  const { properties, loading, error, filteredProperties } = useProperties(filters);

  useEffect(() => {
    console.log('App.jsx: Filters updated', filters);
  }, [filters]);

  useEffect(() => {
    console.log('App.jsx: Properties data updated', { 
      rawProperties: properties.length,
      filtered: filteredProperties.length,
      loading,
      error
    });
  }, [properties, filteredProperties, loading, error]);

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            {error.message || 'Unknown error'}
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Western Water Properties
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 2 }}>
            <Typography variant="body1">
              Properties: {filteredProperties.length}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: '300px', p: 2, borderRight: '1px solid #ddd', overflowY: 'auto' }}>
          <FilterPanel filters={filters} setFilters={setFilters} />
        </Box>
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {loading && !properties.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
              <Typography sx={{ml: 2}}>Loading properties...</Typography>
            </Box>
          ) : (
            <Routes>
              <Route 
                path="/"
                element={<PropertyMap properties={filteredProperties} loading={loading} />} 
              />
              <Route path="/property/:id" element={<PropertyDetails properties={properties} />} />
            </Routes>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;