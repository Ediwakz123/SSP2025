// -----------------------------------------------------------------------------
// SMART BUSINESS LOCATION ANALYSIS (No Grid, Road-Snapping, Traffic-Aware)
// -----------------------------------------------------------------------------

import {
  haversineDistance,
  calculateGeographicCentroid,
  GeoPoint,
} from "./haversine";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface Business {
  business_id: number;
  business_name: string;
  general_category: string;
  latitude: number;
  longitude: number;
  street: string;
  zone_type: string;
  business_density_50m: number;
  business_density_100m: number;
  business_density_200m: number;
  competitor_density_50m: number;
  competitor_density_100m: number;
  competitor_density_200m: number;
  zone_encoded: number;
  status: string;
}

export interface ClusterPoint {
  latitude: number;
  longitude: number;
  business: Business;
}

export interface Cluster {
  id: number;
  color: string;
  centroid: GeoPoint;
  points: ClusterPoint[];
}

export interface ClusteringResult {
  clusters: Cluster[];
  recommendedLocation: GeoPoint;
  nearbyBusinesses: Array<{ business: Business; distance: number }>;
  competitorAnalysis: {
    competitorCount: number;
    nearestCompetitor: Business | null;
    distanceToNearest: number;
    competitorsWithin500m: number;
    competitorsWithin1km: number;
    competitorsWithin2km: number;
    marketSaturation: number;
    recommendedStrategy: string;
   opportunity_score?: number;


  };
  zoneType: string;
  analysis: {
    confidence: number;
    opportunity: string;
    opportunity_score?: number;
    competitorCount: number;
  };
}

// -----------------------------------------------------------------------------
// COLORS
// -----------------------------------------------------------------------------

const CLUSTER_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#F97316", "#84CC16",
];

// -----------------------------------------------------------------------------
// FIX EMPTY CLUSTERS
// -----------------------------------------------------------------------------

function fixEmptyClusters(clusters: Cluster[], points: Business[]): void {
  clusters.forEach((cluster) => {
    if (cluster.points.length === 0) {
      const fallback = points[Math.floor(Math.random() * points.length)];
      cluster.points.push({
        latitude: fallback.latitude,
        longitude: fallback.longitude,
        business: fallback,
      });
    }
  });
}

// -----------------------------------------------------------------------------
// K-MEANS++ CENTROID INITIALIZATION
// -----------------------------------------------------------------------------

function initializeKMeansPlusPlus(points: Business[], k: number): GeoPoint[] {
  const centroids: Business[] = [];
  centroids.push(points[Math.floor(Math.random() * points.length)]);

  while (centroids.length < k) {
    const distances = points.map((p) => {
      const minD = Math.min(
        ...centroids.map((c) =>
          haversineDistance(
            { latitude: p.latitude, longitude: p.longitude },
            { latitude: c.latitude, longitude: c.longitude }
          )
        )
      );
      return minD * minD;
    });

    const sum = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;

    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push(points[i]);
        break;
      }
    }
  }

  return centroids.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
  }));
}

// -----------------------------------------------------------------------------
// TRAFFIC SCORING
// -----------------------------------------------------------------------------

function computeTrafficScore(
  b: Business,
  streetStats: Record<string, number>
): number {
  const key = b.street?.trim().toLowerCase() || "unknown";
  const streetPopularity = streetStats[key] ?? 0;

  return (
    b.business_density_50m * 0.3 +
    b.business_density_100m * 0.2 +
    b.business_density_200m * 0.1 -
    b.competitor_density_50m * 0.25 -
    b.competitor_density_100m * 0.1 -
    b.competitor_density_200m * 0.05 +
    b.zone_encoded * 0.1 +
    streetPopularity * 0.15
  );
}

// -----------------------------------------------------------------------------
// BARANGAY LIMITS
// -----------------------------------------------------------------------------

const BRGY_BOUNDS = {
  minLat: 14.8338,   // South boundary
  maxLat: 14.8413,   // North boundary
  minLng: 120.9518,  // West boundary
  maxLng: 120.9608,  // East boundary
};

function clampToBarangay(lat: number, lng: number) {
  return {
    latitude: Math.min(Math.max(lat, BRGY_BOUNDS.minLat), BRGY_BOUNDS.maxLat),
    longitude: Math.min(Math.max(lng, BRGY_BOUNDS.minLng), BRGY_BOUNDS.maxLng),
  };
}

// -----------------------------------------------------------------------------
// ELBOW METHOD — AUTOMATIC K SELECTION (K = 2 → 6)
// -----------------------------------------------------------------------------

function computeInertia(points: Business[], k: number): number {
  let centroids = initializeKMeansPlusPlus(points, k);
  let clusters: Cluster[] = [];

  for (let iteration = 0; iteration < 25; iteration++) {
    clusters = Array.from({ length: k }, (_, i) => ({
      id: i,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      centroid: centroids[i],
      points: [],
    }));

    for (const b of points) {
      let bestIdx = 0;
      let bestDist = Infinity;

      centroids.forEach((c, idx) => {
        const d = haversineDistance(
          { latitude: b.latitude, longitude: b.longitude },
          c
        );
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });

      clusters[bestIdx].points.push({
        latitude: b.latitude,
        longitude: b.longitude,
        business: b,
      });
    }

    fixEmptyClusters(clusters, points);

    const newCentroids = clusters.map((cluster) =>
      calculateGeographicCentroid(
        cluster.points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        }))
      )
    );

    if (JSON.stringify(newCentroids) === JSON.stringify(centroids)) break;
    centroids = newCentroids;
  }

  // inertia = sum of squared distances
  let inertia = 0;
  clusters.forEach((cluster) => {
    cluster.points.forEach((p) => {
      const d = haversineDistance(
        { latitude: p.latitude, longitude: p.longitude },
        cluster.centroid
      );
      inertia += d * d;
    });
  });

  return inertia;
}

function selectOptimalK(points: Business[]): number {
  const Ks = [2, 3, 4, 5, 6];
  const inertias = Ks.map((k) => computeInertia(points, k));

  const deltas = [];
  for (let i = 1; i < inertias.length; i++) {
    deltas.push(inertias[i - 1] - inertias[i]);
  }

  const firstDrop = deltas[0];
  const threshold = firstDrop * 0.25;

  for (let i = 1; i < deltas.length; i++) {
    if (deltas[i] < threshold) {
      return Ks[i]; // elbow found
    }
  }

  return 6; // fallback = max K
}


// -----------------------------------------------------------------------------
// FINAL FUNCTION — findOptimalLocation
// -----------------------------------------------------------------------------

export function findOptimalLocation(
  businesses: Business[],
  category: string
): ClusteringResult {

  const normalized = category.trim().toLowerCase();
  const filtered = businesses.filter(
    (b) => b.general_category.trim().toLowerCase() === normalized
  );
  const points = filtered.length ? filtered : businesses;

  // Build street popularity map
  const streetStats: Record<string, number> = {};
  for (const b of businesses) {
    const key = b.street?.trim().toLowerCase() || "unknown";
    streetStats[key] = (streetStats[key] || 0) + 1;
  }

  const K = selectOptimalK(points);

  let centroids = initializeKMeansPlusPlus(points, K);
  let clusters: Cluster[] = [];

  // K-MEANS LOOP
  for (let iteration = 0; iteration < 40; iteration++) {
    clusters = Array.from({ length: K }, (_, i) => ({
      id: i,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      centroid: centroids[i],
      points: [],
    }));

    // Assign businesses to centroids
    for (const b of points) {
      let bestIdx = 0;
      let bestDist = Infinity;

      centroids.forEach((c, idx) => {
        const d = haversineDistance(
          { latitude: b.latitude, longitude: b.longitude },
          c
        );
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });

      clusters[bestIdx].points.push({
        latitude: b.latitude,
        longitude: b.longitude,
        business: b,
      });
    }

    fixEmptyClusters(clusters, points);

    // Recompute centroids
    const newCentroids = clusters.map((cluster) =>
      calculateGeographicCentroid(
        cluster.points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        }))
      )
    );

    if (JSON.stringify(newCentroids) === JSON.stringify(centroids)) break;

    centroids = newCentroids;
  }

  // Score clusters
  const scoredClusters = clusters.map((cluster) => {
    const avgScore =
      cluster.points.reduce(
        (sum, p) => sum + computeTrafficScore(p.business, streetStats),
        0
      ) / cluster.points.length;

    return { cluster, score: avgScore };
  });

  // Choose best cluster
  let best = scoredClusters.sort((a, b) => b.score - a.score)[0].cluster;

  // Avoid low-traffic clusters
  const trafficOfBest =
    best.points.reduce(
      (sum, p) => sum + computeTrafficScore(p.business, streetStats),
      0
    ) / best.points.length;

  if (trafficOfBest < 1 && scoredClusters.length > 1) {
    best = scoredClusters[1].cluster;
  }

  // ------------------------------------------------------
  // SAFE SNAPPING LOGIC
  // ------------------------------------------------------

  const threshold = Math.max(
    3,
    Math.floor(
      Object.values(streetStats).reduce((a, b) => a + b, 0) /
        Object.keys(streetStats).length
    )
  );

  const majorRoads = Object.entries(streetStats)
    .filter(([_, count]) => count >= threshold)
    .map(([street]) => street.toLowerCase());

  const centroid = best.centroid;

  // Base recommended point = centroid
  let recommended = { ...centroid };

  // Snapping (only inside barangay + radius <300m)
  const candidateRoadBiz = businesses
    .filter((b) => majorRoads.includes(b.street.toLowerCase()))
    .filter(
      (b) =>
        b.latitude >= BRGY_BOUNDS.minLat &&
        b.latitude <= BRGY_BOUNDS.maxLat &&
        b.longitude >= BRGY_BOUNDS.minLng &&
        b.longitude <= BRGY_BOUNDS.maxLng
    )
    .map((b) => ({
      business: b,
      distance: haversineDistance(centroid, {
        latitude: b.latitude,
        longitude: b.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (candidateRoadBiz && candidateRoadBiz.distance < 0.3) {
    recommended = {
      latitude: candidateRoadBiz.business.latitude,
      longitude: candidateRoadBiz.business.longitude,
    };
  }

  // Clamp inside barangay
  recommended = clampToBarangay(recommended.latitude, recommended.longitude);

  // Determine zone type based on nearest business to recommended point
  const closestBizForZone = businesses
    .map((b) => ({
      business: b,
      distance: haversineDistance(recommended, {
        latitude: b.latitude,
        longitude: b.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  const inferredZoneType = closestBizForZone.business.zone_type;

  // --------------------------------------
  // NEARBY BUSINESSES (for UI only, show 10 closest)
  // --------------------------------------
  const nearbyBusinesses = businesses
    .map((b) => ({
      business: b,
      distance: haversineDistance(recommended, {
        latitude: b.latitude,
        longitude: b.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  // --------------------------------------
  // COMPETITOR ANALYSIS (same category only)
  // --------------------------------------

  // Competitors = same general_category as category input
  const competitors = businesses.filter(
    (b) => b.general_category.trim().toLowerCase() === normalized
  );

  // Pre-compute competitor distances from the recommended point
  const competitorDistances = competitors.map((b) => ({
    business: b,
    distance: haversineDistance(recommended, {
      latitude: b.latitude,
      longitude: b.longitude,
    }),
  }));

  // Total competitors (same category)
  const competitorCount = competitorDistances.length;

  // Nearest competitor
  const sortedCompetitors = [...competitorDistances].sort(
    (a, b) => a.distance - b.distance
  );
  const nearestCompetitorEntry = sortedCompetitors[0] || null;

  const nearestCompetitor = nearestCompetitorEntry
    ? nearestCompetitorEntry.business
    : null;

  const distanceToNearest = nearestCompetitorEntry
    ? nearestCompetitorEntry.distance
    : 0;

  // Competitors within radius ranges (in km)
  const competitorsWithin500m = competitorDistances.filter(
    (c) => c.distance <= 0.5
  ).length;

  const competitorsWithin1km = competitorDistances.filter(
    (c) => c.distance <= 1
  ).length;

  const competitorsWithin2km = competitorDistances.filter(
    (c) => c.distance <= 2
  ).length;

  // Businesses within 1km (all categories) for saturation baseline
  const businessesWithin1km = businesses.filter(
    (b) =>
      haversineDistance(recommended, {
        latitude: b.latitude,
        longitude: b.longitude,
      }) <= 1
  ).length;

  // Market saturation: share of businesses within 1km that are competitors
  const marketSaturation =
    businessesWithin1km > 0 ? competitorsWithin1km / businessesWithin1km : 0;

  // Confidence scoring (unchanged)
  const confidence =
    best.points.length / points.length >= 0.45
      ? 0.82
      : best.points.length / points.length >= 0.25
      ? 0.68
      : 0.55;

  const opportunity =
    confidence >= 0.8
      ? "EXCELLENT OPPORTUNITY — High foot-traffic indicators and healthy market space."
      : confidence >= 0.6
      ? "GOOD OPPORTUNITY — Balanced customer reach with moderate competition."
      : "CAUTION — Competition density is high relative to surroundings.";

  return {
    clusters,
    recommendedLocation: recommended,
    nearbyBusinesses,
    competitorAnalysis: {
      competitorCount,
      nearestCompetitor,
      distanceToNearest,
      competitorsWithin500m,
      competitorsWithin1km,
      competitorsWithin2km,
      marketSaturation,
      recommendedStrategy:
        confidence >= 0.8
          ? "Ideal location for business entry."
          : "Proceed with clear differentiation.",
    },
    zoneType: inferredZoneType,
    analysis: {
      confidence,
      opportunity,
      competitorCount,
    },
  };
}

export function computeOpportunityScore(metrics: {
  competitorCount: number;
  businessDensity50m: number;
  businessDensity100m: number;
  businessDensity200m: number;
  clusterStrength: number;
}) {
  // Competitor impact (inverse)
  const comp = Math.max(0, Math.min(1, 1 - metrics.competitorCount / 5));

  // Business density weighted more strongly
  const densityRaw =
    metrics.businessDensity50m * 0.5 +
    metrics.businessDensity100m * 0.3 +
    metrics.businessDensity200m * 0.2;

  const density = Math.min(1, densityRaw / 20);

  // Cluster strength (favor strong clusters)
  const cluster = Math.min(1, metrics.clusterStrength / 5);

  // New balanced formula:
  const score =
    comp * 0.45 +   // competition is most important
    density * 0.30 +
    cluster * 0.25;

  return Number(score.toFixed(3));
}



