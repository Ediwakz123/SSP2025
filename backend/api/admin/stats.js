import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

export default async function handler(req, res) {
  // Verify admin access
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  try {
    const [{ data: users }, { data: analyses }, { data: businesses }] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("clustering_results").select("*"),
      supabase.from("businesses").select("*")
    ]);

    const stats = {
      total_users: users?.length || 0,
      active_users: users?.filter(u => u.is_active).length || 0,
      recent_signups: users?.filter(u =>
        new Date(u.created_at) > Date.now() - 24 * 60 * 60 * 1000
      ).length || 0,
      total_analyses: analyses?.length || 0,
      seed_businesses: businesses?.length || 0,
      system_status: "operational",
      last_updated: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, stats });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ success: false, error: "Failed to load admin stats" });
  }
}
