import { TARGET_STATES, SPECIFIC_CHALLENGES } from '../constants';

/**
 * Filters properties based on the provided filter criteria
 * @param {Array} properties - Array of property objects
 * @param {Object} filters - Filter criteria object
 * @returns {Array} Filtered properties
 */
export const filterProperties = (properties, filters) => {
  if (!properties || !filters) return [];
  
  console.log('Filtering properties with filters:', filters);

  return properties.filter((property) => {
    let passes = true;

    // State filter
    if (filters.state && property.address?.state !== filters.state) {
      passes = false;
    }

    // Price filter
    if (passes && filters.priceRange) {
      if (filters.priceRange[1] && property.price > filters.priceRange[1]) {
        passes = false;
      }
      if (passes && filters.priceRange[0] && property.price < filters.priceRange[0]) {
        passes = false;
      }
    }

    // Property type filter (listingType in data)
    if (passes && filters.propertyType && filters.propertyType !== 'all') {
      const expectedListingType = filters.propertyType === 'listed' ? 'on-market' : filters.propertyType;
      if (property.listingType !== expectedListingType) {
        passes = false;
      }
    }

    // New Water Connectivity Filters
    // No Water Access: property must have NO municipal AND NO well
    if (passes && filters.noWaterAccess) {
      if (property.waterAccess?.hasMunicipalWater || property.waterAccess?.hasWell) {
        passes = false;
      }
    }

    // No Wastewater Access: property must have NO municipal sewer AND NO septic
    if (passes && filters.noWastewaterAccess) {
      if (property.wastewaterAccess?.hasMunicipalSewer || property.wastewaterAccess?.hasSeptic) {
        passes = false;
      }
    }
    
    // New Specific Challenges Filter
    // Property must have ALL checked specific challenges
    if (passes && filters.specificChallenges && filters.specificChallenges.length > 0) {
      const propertyChallenges = property.challenges || [];
      const allChallengesMet = filters.specificChallenges.every(challengeFilter => 
        propertyChallenges.includes(challengeFilter)
      );
      if (!allChallengesMet) {
        passes = false;
      }
    }

    // Ensure that ALL properties meet the base criteria of having at least one major issue:
    // EITHER no water access (no municipal AND no well)
    // OR no wastewater access (no municipal sewer AND no septic)
    if (passes) { // Only apply this if property has passed other filters
        const hasNoWater = !property.waterAccess?.hasMunicipalWater && !property.waterAccess?.hasWell;
        const hasNoWastewater = !property.wastewaterAccess?.hasMunicipalSewer && !property.wastewaterAccess?.hasSeptic;
        if (!hasNoWater && !hasNoWastewater) {
            // console.log(`Property ${property._id} failed base challenge criteria: NoWater: ${hasNoWater}, NoWastewater: ${hasNoWastewater}`);
            passes = false;
        }
    }

    // Removed old access and issue filters
    
    // if (!passes) {
    //   console.log(`Property ${property.address?.street || property._id} failed filter. Filters:`, filters, 'Property:', property);
    // }
    return passes;
  });
};

// Removed old helper functions (passesStateFilter, etc.) as logic is now inline or simpler. 