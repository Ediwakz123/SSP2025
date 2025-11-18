// backend/services/clusteringService.js
const { supabase } = require('../lib/supabaseClient');
const { haversineDistance } = require('../utils/haversine');
const { kmeans, buildClusters } = require('./kmeans');

/* ----------------------------------------------------------
 *  Fetch all businesses with a specific category
 * ---------------------------------------------------------- */
async function fetchBusinessesByCategory(businessCategory) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('category', businessCategory);

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error('Failed to fetch businesses');
  }

  return data || [];
}

/* ----------------------------------------------------------
 * Compute metrics for each cluster
 * ---------------------------------------------------------- */
function computeClusterMetrics(cluster, allPoints) {
  const { centroid } = cluster;
  const { latitude: clat, longitude: clon } = centroid;

  if (!clat || !clon) {
    return {
      competitorCount: 0,
      totalBusinesses: allPoints.length,
      within500m: 0,
      within1km: 0,
      within2km: 0,
      nearestCompetitor: null,
      marketSaturation: 0,
      nearbyBusinesses: [],
    };
  }

  const distancesAll = allPoints.map((p) => ({
    ...p,
    distance: haversineDistance(clat, clon, p.latitude, p.longitude),
  }));

  const competitorCount = cluster.points.length;
  const totalBusinesses = allPoints.length;

  const within500m = distancesAll.filter((p) => p.distance <= 500).length;
  const within1km = distancesAll.filter((p) => p.distance <= 1000).length;
  const within2km = distancesAll.filter((p) => p.distance <= 2000).length;

  const nearestCompetitor = distancesAll.reduce(
    (min, p) => (p.distance < min ? p.distance : min),
    Infinity
  );

  const marketSaturation =
    totalBusinesses === 0 ? 0 : competitorCount / totalBusinesses;

  const nearbyBusinesses = distancesAll
    .filter((p) => p.distance <= 2000)
    .map((p) => ({
      id: p.id,
      business_id: p.business_id,
      business_name: p.business_name,
      category: p.category,
      latitude: p.latitude,
      longitude: p.longitude,
      street: p.street,
      zone_type: p.zone_type,
      distance_m: p.distance,
    }));

  return {
    competitorCount,
    totalBusinesses,
    within500m,
    within1km,
    within2km,
    nearestCompetitor: isFinite(nearestCompetitor)
      ? nearestCompetitor
      : null,
    marketSaturation,
    nearbyBusinesses,
  };
}

/* ----------------------------------------------------------
 * Pick BEST cluster (improved scoring)
 * ---------------------------------------------------------- */
function pickBestCluster(clusters, allPoints) {
  if (!clusters.length) return null;

  const scored = clusters.map((cluster) => {
    const metrics = computeClusterMetrics(cluster, allPoints);

    // Better scoring formula (closer to your FastAPI Python code):
    // LOW competitors + LOW saturation + HIGH distance to nearest competitor = GOOD
    const score =
      metrics.within1km * 2 +
      metrics.marketSaturation * 20 -
      (metrics.nearestCompetitor || 0) / 100;

    return { cluster, metrics, score };
  });

  scored.sort((a, b) => a.score - b.score);

  return scored[0];
}

/* ----------------------------------------------------------
 * Run Clustering and Save Result to Supabase
 * ---------------------------------------------------------- */
async function runClustering({ userId, businessCategory, numClusters }) {
  if (!userId) throw new Error('userId is required');
  if (!businessCategory) throw new Error('businessCategory is required');
  if (!numClusters || numClusters <= 0)
    throw new Error('numClusters must be > 0');

  const businesses = await fetchBusinessesByCategory(businessCategory);

  if (businesses.length === 0) {
    throw new Error('No businesses found for that category.');
  }

  // 🧠 Run KMeans
  const { centroids, assignments } = kmeans(businesses, numClusters);

  // Build cluster objects
  const clusters = buildClusters(businesses, centroids, assignments);

  // Choose the best cluster
  const best = pickBestCluster(clusters, businesses);
  if (!best) throw new Error('Unable to determine best cluster');

  const { cluster: bestCluster, metrics } = best;
  const { centroid } = bestCluster;

  // Confidence Score (0–1)
  const confidence =
    1 /
    (1 +
      metrics.marketSaturation * 10 +
      metrics.within1km / (metrics.totalBusinesses || 1));

  let opportunityLevel = 'Medium';
  if (confidence >= 0.7) opportunityLevel = 'High';
  else if (confidence <= 0.3) opportunityLevel = 'Low';

  const recommendedZoneType =
    bestCluster.points[0]?.zone_type || 'Unknown';

  // JSON summary of clusters
  const clustersData = clusters.map((c) => ({
    id: c.id,
    centroid: c.centroid,
    points: c.points.map((p) => ({
      id: p.id,
      business_id: p.business_id,
      business_name: p.business_name,
      category: p.category,
      latitude: p.latitude,
      longitude: p.longitude,
      street: p.street,
      zone_type: p.zone_type,
    })),
  }));

  /* ----------------------------------------------------------
   * SAVE to Supabase clustering_results
   * ---------------------------------------------------------- */

  const payload = {
    user_id: userId,
    business_category: businessCategory,
    num_clusters: numClusters,
    recommended_latitude: centroid.latitude,
    recommended_longitude: centroid.longitude,
    recommended_zone_type: recommendedZoneType,
    confidence,
    opportunity_level: opportunityLevel,
    total_businesses: metrics.totalBusinesses,
    competitor_count: metrics.competitorCount,
    competitors_within_500m: metrics.within500m,
    competitors_within_1km: metrics.within1km,
    competitors_within_2km: metrics.within2km,
    market_saturation: metrics.marketSaturation,
    nearest_competitor_distance: metrics.nearestCompetitor,
    clusters_data: clustersData,
    nearby_businesses: metrics.nearbyBusinesses,
  };

  const { data, error } = await supabase
    .from('clustering_results')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error);
    throw new Error('Failed to save clustering result');
  }

  return data;
}

module.exports = { runClustering };
