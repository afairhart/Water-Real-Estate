import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(`/api/properties/${id}`);
        setProperty(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch property details');
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!property) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Property not found</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Button
        variant="outlined"
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Back to List
      </Button>

      <Typography variant="h4" gutterBottom>
        {property.address}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Property Details
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Price: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(property.price)}
            </Typography>
            <Typography variant="subtitle1">
              Listing Type: {property.listingType}
            </Typography>
            <Typography variant="subtitle1">
              Last Updated: {new Date(property.lastUpdated).toLocaleDateString()}
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Water Access
          </Typography>
          <Box sx={{ mb: 2 }}>
            {property.waterAccess ? (
              <Chip label="Available" color="success" />
            ) : (
              <Chip label="Not Available" color="error" />
            )}
            {property.waterIssues?.map((issue, index) => (
              <Chip
                key={index}
                label={issue}
                color="warning"
                sx={{ ml: 1 }}
              />
            ))}
          </Box>

          <Typography variant="h6" gutterBottom>
            Wastewater Access
          </Typography>
          <Box sx={{ mb: 2 }}>
            {property.wastewaterAccess ? (
              <Chip label="Available" color="success" />
            ) : (
              <Chip label="Not Available" color="error" />
            )}
            {property.wastewaterIssues?.map((issue, index) => (
              <Chip
                key={index}
                label={issue}
                color="warning"
                sx={{ ml: 1 }}
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Gemini Analysis
          </Typography>
          {property.geminiAnalysis ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body1">
                  {property.geminiAnalysis.summary}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Potential Value
                </Typography>
                <Typography variant="body1">
                  {property.geminiAnalysis.potentialValue}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recommended Technologies
                </Typography>
                {property.geminiAnalysis.recommendedTechnologies?.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    color="primary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Confidence Score
                </Typography>
                <Typography variant="body1">
                  {property.geminiAnalysis.confidence}%
                </Typography>
              </Box>
            </>
          ) : (
            <Typography>No analysis available</Typography>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Source Information
      </Typography>
      <Typography variant="body1">
        Source: {property.source}
      </Typography>
      {property.sourceUrl && (
        <Button
          href={property.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 1 }}
        >
          View Original Listing
        </Button>
      )}
    </Paper>
  );
}

export default PropertyDetails; 