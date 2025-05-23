import { useState } from 'react';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material';

const states = [
  'Washington',
  'Oregon',
  'California',
  'Arizona',
  'Utah',
  'Idaho',
  'Nevada'
];

const waterIssues = [
  'No Municipal Water',
  'No Well Access',
  'No Water Rights',
  'Insufficient Water Supply'
];

const wastewaterIssues = [
  'No Municipal Sewer',
  'No Septic System',
  'Septic System Issues',
  'Wastewater Treatment Required'
];

const environmentalIssues = [
  'Water Quality Issues',
  'Environmental Restrictions',
  'Protected Areas',
  'Flood Risk'
];

function FilterPanel({ filters, setFilters }) {
  const handleStateChange = (event) => {
    setFilters({ ...filters, state: event.target.value });
  };

  const handlePriceChange = (event, newValue) => {
    setFilters({ ...filters, priceRange: newValue });
  };

  const handleListingTypeChange = (event) => {
    setFilters({ ...filters, listingType: event.target.value });
  };

  const handleIssueChange = (category) => (event) => {
    const { checked, name } = event.target;
    setFilters({
      ...filters,
      [category]: checked
        ? [...filters[category], name]
        : filters[category].filter(item => item !== name)
    });
  };

  return (
    <Paper sx={{ p: 2, width: 300 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>State</InputLabel>
        <Select
          value={filters.state}
          label="State"
          onChange={handleStateChange}
        >
          <MenuItem value="">All States</MenuItem>
          {states.map(state => (
            <MenuItem key={state} value={state}>{state}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Price Range</Typography>
        <Slider
          value={filters.priceRange}
          onChange={handlePriceChange}
          valueLabelDisplay="auto"
          min={0}
          max={1000000}
          step={10000}
        />
      </Box>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Listing Type</InputLabel>
        <Select
          value={filters.listingType}
          label="Listing Type"
          onChange={handleListingTypeChange}
        >
          <MenuItem value="all">All Listings</MenuItem>
          <MenuItem value="on-market">On Market</MenuItem>
          <MenuItem value="off-market">Off Market</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="subtitle1" gutterBottom>
        Water Issues
      </Typography>
      <FormGroup>
        {waterIssues.map(issue => (
          <FormControlLabel
            key={issue}
            control={
              <Checkbox
                checked={filters.waterIssues.includes(issue)}
                onChange={handleIssueChange('waterIssues')}
                name={issue}
              />
            }
            label={issue}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Wastewater Issues
      </Typography>
      <FormGroup>
        {wastewaterIssues.map(issue => (
          <FormControlLabel
            key={issue}
            control={
              <Checkbox
                checked={filters.wastewaterIssues.includes(issue)}
                onChange={handleIssueChange('wastewaterIssues')}
                name={issue}
              />
            }
            label={issue}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Environmental Issues
      </Typography>
      <FormGroup>
        {environmentalIssues.map(issue => (
          <FormControlLabel
            key={issue}
            control={
              <Checkbox
                checked={filters.environmentalIssues.includes(issue)}
                onChange={handleIssueChange('environmentalIssues')}
                name={issue}
              />
            }
            label={issue}
          />
        ))}
      </FormGroup>
    </Paper>
  );
}

export default FilterPanel; 