// Geolocation coordinates for Coimbatore, Madurai, and Salem areas
export const AREA_COORDINATES = {
  "Coimbatore": {
    "Vadavalli": { lat: 11.0200, lng: 76.9000 },
    "Kovai Pudur": { lat: 10.9400, lng: 76.9200 },
    "RS Puram": { lat: 11.0100, lng: 76.9500 },
    "Ganapathy": { lat: 11.0300, lng: 76.9800 },
    "Ukkadam": { lat: 10.9850, lng: 76.9600 },
    "Kuniyamuthur": { lat: 10.9600, lng: 76.9550 },
    "Singanallur": { lat: 11.0000, lng: 77.0200 },
    "Gandhipuram": { lat: 11.0150, lng: 76.9700 },
    "selvapuram": { lat: 10.9600, lng: 76.9550 },
    "default": { lat: 11.0168, lng: 76.9558 }
  }
};

// Calculate distance between two coordinates using Haversine formula
export const getDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined || lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Format distance value for UI display
export const formatDistance = (km, t) => {
  if (km === null || km === undefined) return '';
  const suffix = t ? t('away') : 'away';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m ${suffix}`;
  }
  return `${km.toFixed(1)} km ${suffix}`;
};

// Get the default coordinates for a specific city and area
export const getDefaultCoordinates = (city, area) => {
  if (!city) return { lat: 11.0168, lng: 76.9558 }; // default Coimbatore
  const cityData = AREA_COORDINATES[city];
  if (!cityData) return { lat: 11.0168, lng: 76.9558 };
  return cityData[area] || cityData["default"];
};

// Determine job urgency status and return badge details
export const getJobUrgentBadge = (job) => {
  if (!job) return null;

  // 1. Starts soon check: job starts within the next 3 hours
  if (job.startDate) {
    const start = new Date(job.startDate);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    // Starts within 3 hours from now and hasn't started more than 3 hours ago
    if (diffMs > -threeHoursMs && diffMs <= threeHoursMs) {
      return { text: "Starts Soon", emoji: "🚨", type: "starts_soon" };
    }
  }

  // 2. Explicit selection check
  if (job.isUrgentExplicit) {
    return { text: "Immediate Hiring", emoji: "⚡", type: "immediate" };
  }

  // 3. Configurable period check: no applications after 24 hours from creation
  if (!job.applicants || job.applicants.length === 0) {
    const created = new Date(job.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (diffMs >= twentyFourHoursMs) {
      return { text: "Urgent", emoji: "🔥", type: "no_apps" };
    }
  }

  return null;
};
