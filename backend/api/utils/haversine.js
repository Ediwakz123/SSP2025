// backend/utils/haversine.js

const EARTH_RADIUS_M = 6371e3; // meters

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates in KILOMETERS
 * a = { latitude, longitude }
 * b = { latitude, longitude }
 */
function haversineDistance(a, b) {
  const lat1 = a.latitude;
  const lon1 = a.longitude;
  const lat2 = b.latitude;
  const lon2 = b.longitude;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  const distanceMeters = EARTH_RADIUS_M * c;
  return distanceMeters / 1000; // Convert to KM
}

module.exports = { haversineDistance };
