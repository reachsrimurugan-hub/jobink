const getApiKey = () => {
  return import.meta.env.VITE_GEOAPIFY_API_KEY || 'your_geoapify_api_key_here';
};

/**
 * Extract and normalize geocoded fields from Geoapify feature format
 */
export const parseGeoapifyResult = (feature) => {
  if (!feature || !feature.properties) return null;
  const props = feature.properties;
  
  // Extract locality: suburb -> neighbourhood -> village -> city_district -> district -> county
  const locality = props.suburb || props.neighbourhood || props.village || props.city_district || props.district || '';
  
  // Extract postalCode
  const postalCode = props.postcode || '';

  return {
    latitude: props.lat || 0,
    longitude: props.lon || 0,
    formattedAddress: props.formatted || '',
    locality: locality,
    city: props.city || props.town || props.village || '',
    district: props.district || props.county || '',
    state: props.state || '',
    postalCode: postalCode,
    country: props.country || ''
  };
};

/**
 * Convert GPS Coordinates into readable address fields using Geoapify Reverse Geocoding
 */
export const reverseGeocode = async (lat, lon) => {
  const apiKey = getApiKey();
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify reverse geocoding failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return parseGeoapifyResult(data.features[0]);
    }
    return null;
  } catch (error) {
    console.error("Geoapify reverseGeocode error:", error);
    throw error;
  }
};

/**
 * Autocomplete address queries using Geoapify Autocomplete
 */
export const autocompleteLocations = async (text) => {
  if (!text || text.trim().length < 2) return [];
  const apiKey = getApiKey();
  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:in&limit=5&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify autocomplete failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.features) {
      return data.features.map(parseGeoapifyResult).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error("Geoapify autocomplete error:", error);
    return [];
  }
};
