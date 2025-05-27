import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

function PropertyList({ properties, filters }) {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    { field: 'address', headerName: 'Address', flex: 1 },
    { field: 'price', headerName: 'Price', width: 130, 
      valueFormatter: (params) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(params.value);
      }
    },
    { 
      field: 'listingType', 
      headerName: 'Property Type', 
      width: 130,
      valueFormatter: (params) => {
        return params.value === 'on-market' ? 'Listed' : 'Off Market';
      }
    },
    { field: 'waterAccess', headerName: 'Water Access', width: 130 },
    { field: 'wastewaterAccess', headerName: 'Wastewater', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(`/property/${params.row.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  const filteredProperties = properties.filter(property => {
    if (filters.state && property.state !== filters.state) return false;
    if (filters.priceRange[1] && property.price > filters.priceRange[1]) return false;
    if (filters.priceRange[0] && property.price < filters.priceRange[0]) return false;
    if (filters.propertyType !== 'all') {
      const expectedType = filters.propertyType === 'listed' ? 'on-market' : filters.propertyType;
      if (property.listingType !== expectedType) return false;
    }
    
    // Check water issues
    if (filters.waterIssues.length > 0) {
      const hasWaterIssue = filters.waterIssues.some(issue => 
        property.waterIssues?.includes(issue)
      );
      if (!hasWaterIssue) return false;
    }

    // Check wastewater issues
    if (filters.wastewaterIssues.length > 0) {
      const hasWastewaterIssue = filters.wastewaterIssues.some(issue => 
        property.wastewaterIssues?.includes(issue)
      );
      if (!hasWastewaterIssue) return false;
    }

    // Check environmental issues
    if (filters.environmentalIssues.length > 0) {
      const hasEnvironmentalIssue = filters.environmentalIssues.some(issue => 
        property.environmentalIssues?.includes(issue)
      );
      if (!hasEnvironmentalIssue) return false;
    }

    return true;
  });

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={filteredProperties}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[5, 10, 20]}
        checkboxSelection
        disableSelectionOnClick
        getRowId={(row) => row._id}
      />
    </Box>
  );
}

export default PropertyList; 