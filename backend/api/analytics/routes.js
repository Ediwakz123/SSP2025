import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Random stable colors for clusters
const CLUSTER_COLORS = [
  "#6366F1", // indigo
  "#10B981", // green
  "#EF4444", // red
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#EC4899", // pink
  "#8B5CF6", // violet
];

export async function GET() {
  try {
    // 1. Load ALL businesses (seed + user data)
    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("id, latitude, longitude, category, zone_type, cluster_id");

    if (error) throw error;

    // 2. Compute cluster centroid + density (number of assigned businesses)
    const clusterMap = {};

    businesses.forEach((b) => {
      if (b.cluster_id == null) return;

      if (!clusterMap[b.cluster_id]) {
        clusterMap[b.cluster_id] = {
          cluster_id: b.cluster_id,
          latitudeSum: 0,
          longitudeSum: 0,
          count: 0,
        };
      }

      clusterMap[b.cluster_id].latitudeSum += b.latitude;
      clusterMap[b.cluster_id].longitudeSum += b.longitude;
      clusterMap[b.cluster_id].count += 1;
    });

    const centroids = Object.values(clusterMap).map((c, index) => ({
      cluster_id: c.cluster_id,
      latitude: c.latitudeSum / c.count,
      longitude: c.longitudeSum / c.count,
      density: c.count,
      color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
    }));

    return new Response(
      JSON.stringify({
        clusterCentroids: centroids,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
