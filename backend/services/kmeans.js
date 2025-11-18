// backend/services/kmeans.js
const { haversineDistance } = require('../utils/haversine');

/**
 * points: [{ id, latitude, longitude, ... }]
 * k: number of clusters
 * returns { centroids: [{lat, lon}], assignments: number[] }
 */
function kmeans(points, k, maxIters = 100, tolerance = 1e-6) {
  if (!points.length) {
    throw new Error('No points provided to kmeans');
  }

  if (k <= 0) {
    throw new Error('k must be > 0');
  }

  // --- 1. Initialize centroids by sampling k random points
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  let centroids = shuffled.slice(0, k).map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIters; iter++) {
    // --- 2. Assign each point to closest centroid
    let changed = false;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let bestCluster = 0;
      let bestDist = Infinity;

      for (let c = 0; c < centroids.length; c++) {
        const cent = centroids[c];
        const d = haversineDistance(
          p.latitude,
          p.longitude,
          cent.latitude,
          cent.longitude
        );
        if (d < bestDist) {
          bestDist = d;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        changed = true;
        assignments[i] = bestCluster;
      }
    }

    // --- 3. Recompute centroids
    const sums = centroids.map(() => ({
      latSum: 0,
      lonSum: 0,
      count: 0,
    }));

    for (let i = 0; i < points.length; i++) {
      const cluster = assignments[i];
      const p = points[i];
      sums[cluster].latSum += p.latitude;
      sums[cluster].lonSum += p.longitude;
      sums[cluster].count += 1;
    }

    const newCentroids = centroids.map((cent, idx) => {
      const s = sums[idx];
      if (s.count === 0) {
        // If no points in cluster, keep old centroid
        return cent;
      }
      return {
        latitude: s.latSum / s.count,
        longitude: s.lonSum / s.count,
      };
    });

    // --- 4. Check for convergence
    let maxShift = 0;
    for (let c = 0; c < centroids.length; c++) {
      const oldC = centroids[c];
      const newC = newCentroids[c];
      const shift = haversineDistance(
        oldC.latitude,
        oldC.longitude,
        newC.latitude,
        newC.longitude
      );
      if (shift > maxShift) maxShift = shift;
    }

    centroids = newCentroids;

    if (!changed || maxShift < tolerance) {
      break;
    }
  }

  return { centroids, assignments };
}

/**
 * Utility: build cluster objects from assignments
 */
function buildClusters(points, centroids, assignments) {
  const clusters = centroids.map((c, idx) => ({
    id: idx,
    centroid: c,
    points: [],
  }));

  for (let i = 0; i < points.length; i++) {
    const clusterId = assignments[i];
    clusters[clusterId].points.push(points[i]);
  }

  return clusters;
}

module.exports = { kmeans, buildClusters };
