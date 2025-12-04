import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

export default async function handler(req, res) {
  // Verify admin authentication
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  try {
    const { data: businesses } = await supabase.from("businesses").select("*");

    const categories = {};
    const zones = {};
    let totalDensity = 0;
    let totalTraffic = 0;

    businesses.forEach(b => {
      categories[b.general_category] = (categories[b.general_category] || 0) + 1;
      zones[b.zone_type] = (zones[b.zone_type] || 0) + 1;
      totalDensity += b.population_density || 0;
      totalTraffic += b.foot_traffic || 0;
    });

    const stats = {
      total_businesses: businesses.length,
      categories,
      zones,
      avg_population_density: Math.round(totalDensity / businesses.length),
      avg_foot_traffic: Math.round(totalTraffic / businesses.length)
    };

    return res.status(200).json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch seed stats" });
  }
}
