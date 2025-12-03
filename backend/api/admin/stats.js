import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  try {
    const [{ data: users }, { data: analyses }, { data: businesses }] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("clustering_results").select("*"),
      supabase.from("businesses").select("*")
    ]);

    const stats = {
      total_users: users.length,
      active_users: users.filter(u => u.is_active).length,
      recent_signups: users.filter(u =>
        new Date(u.created_at) > Date.now() - 24 * 60 * 60 * 1000
      ).length,
      total_analyses: analyses.length,
      seed_businesses: businesses.length,
      system_status: "operational",
      last_updated: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to load admin stats" });
  }
}
