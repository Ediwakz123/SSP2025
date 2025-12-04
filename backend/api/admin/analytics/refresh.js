import { supabase } from "../../../lib/supabaseClient.js";
import { verifyAdmin } from "../auth.js";

export default async function handler(req, res) {
  // Verify admin authentication
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Business count
    const { data: businesses } = await supabase.from("businesses").select("*");

    const categoryCount = {};
    businesses.forEach((b) => {
      categoryCount[b.category] = (categoryCount[b.category] || 0) + 1;
    });

    // 2. User stats
    const { data: users } = await supabase.from("users").select("*");

    const adminCount = users.filter((u) => u.is_superuser).length;
    const activeLast7Days = users.filter((u) => {
      const date = new Date(u.last_login || u.created_at);
      const diff = (Date.now() - date.getTime()) / 86400000;
      return diff <= 7;
    }).length;

    // 3. Clustering stats
    const { data: clustering } = await supabase
      .from("clustering_results")
      .select("*");

    const clusteringStats = {
      total_runs: clustering.length,
      last_run: clustering[clustering.length - 1]?.created_at || null,
    };

    // INSERT/UPDATE ANALYTICS CACHE
    const payload = {
      business_stats: {
        total: businesses.length,
        categoryCount,
      },

      user_stats: {
        total_users: users.length,
        adminCount,
        activeLast7Days,
      },

      clustering_stats: clusteringStats,
    };

    for (const key of Object.keys(payload)) {
      await supabase
        .from("analytics_cache")
        .upsert({
          key,
          value: payload[key],
          updated_at: new Date().toISOString(),
        });
    }

    return res.status(200).json({ message: "Analytics refreshed", payload });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
