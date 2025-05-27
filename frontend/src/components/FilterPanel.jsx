import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Chip,
  OutlinedInput
} from '@mui/material';
import { 
  TARGET_STATES, 
  PRICE_RANGE_MAX,
  SPECIFIC_CHALLENGES
} from '../constants';

const FilterPanel = ({ filters, setFilters }) => {
  const handleStateChange = (event) => {
    setFilters({ ...filters, state: event.target.value });
  };

  const handlePriceRangeChange = (event, newValue) => {
    setFilters({ ...filters, priceRange: newValue });
  };

  const handlePropertyTypeChange = (event) => {
    setFilters({ ...filters, propertyType: event.target.value });
  };

  const handleNoWaterAccessChange = (event) => {
    setFilters({ ...filters, noWaterAccess: event.target.checked });
  };

  const handleNoWastewaterAccessChange = (event) => {
    setFilters({ ...filters, noWastewaterAccess: event.target.checked });
  };

  const handleSpecificChallengeChange = (challengeKey) => (event) => {
    setFilters(prevFilters => {
      const currentChallenges = prevFilters.specificChallenges || [];
      let newChallenges;
      if (event.target.checked) {
        newChallenges = [...currentChallenges, SPECIFIC_CHALLENGES[challengeKey]];
      } else {
        newChallenges = currentChallenges.filter(c => c !== SPECIFIC_CHALLENGES[challengeKey]);
      }
      return { ...prevFilters, specificChallenges: newChallenges };
    });
  };

  const formatPrice = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Paper 
      sx={{ 
        width: 300, 
        p: 2, 
        height: '100%', 
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: 0,
        boxShadow: 2,
        boxSizing: 'border-box'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word', maxWidth: '100%' }}>
        Filters
      </Typography>

      {/* State Filter */}
      <FormControl fullWidth sx={{ mb: 2, maxWidth: '100%' }}>
        <InputLabel>State</InputLabel>
        <Select
          value={filters.state}
          label="State"
          onChange={handleStateChange}
          sx={{ maxWidth: '100%', minWidth: 0 }}
        >
          <MenuItem value="">All Target States</MenuItem>
          {TARGET_STATES.map((state) => (
            <MenuItem key={state} value={state}>{state}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Price Range Filter */}
      <Box sx={{ mb: 3, maxWidth: '100%', minWidth: 0 }}>
        <Typography gutterBottom sx={{ wordBreak: 'break-word', maxWidth: '100%' }}>
          Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
        </Typography>
        <Slider
          value={filters.priceRange}
          onChange={handlePriceRangeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={formatPrice}
          min={0}
          max={PRICE_RANGE_MAX}
          step={50000}
          sx={{ maxWidth: '100%' }}
        />
      </Box>

      {/* Property Type Filter */}
      <FormControl fullWidth sx={{ mb: 2, maxWidth: '100%' }}>
        <InputLabel>Property Type</InputLabel>
        <Select
          value={filters.propertyType}
          label="Property Type"
          onChange={handlePropertyTypeChange}
          sx={{ maxWidth: '100%', minWidth: 0 }}
        >
          <MenuItem value="all">All Properties</MenuItem>
          <MenuItem value="listed">Listed</MenuItem>
          <MenuItem value="off-market">Off Market</MenuItem>
        </Select>
      </FormControl>

      {/* Water Connectivity Section (Replaces Access Requirements) */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, wordBreak: 'break-word', maxWidth: '100%' }}>Water Connectivity</Typography>
      <FormGroup sx={{ mb: 2, maxWidth: '100%', minWidth: 0 }}>
        <FormControlLabel 
          control={<Checkbox checked={filters.noWaterAccess || false} onChange={handleNoWaterAccessChange} />} 
          label="No Water Access"
          sx={{ maxWidth: '100%', '& .MuiFormControlLabel-label': { wordBreak: 'break-word' } }}
        />
        <FormControlLabel 
          control={<Checkbox checked={filters.noWastewaterAccess || false} onChange={handleNoWastewaterAccessChange} />} 
          label="No Wastewater Access"
          sx={{ maxWidth: '100%', '& .MuiFormControlLabel-label': { wordBreak: 'break-word' } }}
        />
      </FormGroup>

      {/* Specific Challenges Section (Replaces Issue Filters) */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, wordBreak: 'break-word', maxWidth: '100%' }}>Specific Challenges</Typography>
      <FormGroup sx={{ mb: 2, maxWidth: '100%', minWidth: 0 }}>
        {Object.entries(SPECIFIC_CHALLENGES).map(([key, label]) => (
          <FormControlLabel 
            key={key} 
            control={
              <Checkbox 
                checked={(filters.specificChallenges || []).includes(label)} 
                onChange={handleSpecificChallengeChange(key)} 
              />
            } 
            label={label}
            sx={{ maxWidth: '100%', '& .MuiFormControlLabel-label': { wordBreak: 'break-word' } }}
          />
        ))}
      </FormGroup>
    </Paper>
  );
};

export default FilterPanel; 