import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box } from '@mui/material';
import PropertyMap from './components/PropertyMap';
import FilterPanel from './components/FilterPanel';
import { PRICE_RANGE_DEFAULT } from './constants';
import PropertyScreeningTable from './components/PropertyScreeningTable';

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" disableGutters sx={{ height: '100vh' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Screening Table at the very top */}
          <Box sx={{ 
            height: '50vh',
            minHeight: '200px',
            maxHeight: '50vh',
            overflow: 'auto',
            borderBottom: '1px solid #eee',
            background: '#fff',
            zIndex: 2,
            position: 'relative',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'height 0.3s ease-in-out'
          }}>
            <PropertyScreeningTable />
          </Box>
          {/* Filter Panel below table */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid #eee', 
            background: '#fafafa', 
            zIndex: 1,
            position: 'relative'
          }}>
            <FilterPanel filters={filters} setFilters={setFilters} />
          </Box>
          {/* Map fills the rest */}
          <Box sx={{ 
            flex: 1, 
            minHeight: 0, 
            position: 'relative', 
            overflow: 'hidden',
            background: '#f5f5f5'
          }}>
            <PropertyMap />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;