import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useProperties } from '../hooks/useProperties';

const formatAddress = (address) => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  const { street, city, state, zipCode } = address;
  return [street, city, state, zipCode].filter(Boolean).join(', ');
};

const PropertyScreeningTable = () => {
  const { properties, loading, error, approveProperty, deleteProperty } = useProperties();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Only show unapproved properties
  const pendingProperties = properties.filter((property) => !property.approved);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.style.height = isCollapsed ? '50vh' : '100px';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error loading properties: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid #eee',
        background: '#fafafa'
      }}>
        <Typography variant="h6">Property Screening</Typography>
        <IconButton onClick={handleCollapse} size="small">
          {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Box>
      <TableContainer component={Paper} className="table-container" sx={{ 
        height: '50vh',
        transition: 'height 0.3s ease-in-out'
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Beds</TableCell>
              <TableCell>Baths</TableCell>
              <TableCell>Sq Ft</TableCell>
              <TableCell>Water System</TableCell>
              <TableCell>Wastewater System</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                  No properties to review
                </TableCell>
              </TableRow>
            ) : (
              pendingProperties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell>{formatAddress(property.address)}</TableCell>
                  <TableCell>${property.price?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>{property.bedrooms || 'N/A'}</TableCell>
                  <TableCell>{property.bathrooms || 'N/A'}</TableCell>
                  <TableCell>{property.squareFeet?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>{property.propertyType || 'Unknown'}</TableCell>
                  <TableCell>{property.listingStatus || 'Unknown'}</TableCell>
                  <TableCell>
                    <IconButton
                      color="success"
                      onClick={() => approveProperty(property._id)}
                      title="Approve property"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => deleteProperty(property._id)}
                      title="Delete property"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PropertyScreeningTable; 