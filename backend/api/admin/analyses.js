import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

export default async function handler(req, res) {
  // Verify admin access
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  try {
    const { data, error } = await supabase.from("clustering_results").select("*");

    if (error) {
      console.error("Analyses error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, analyses: data });
  } catch (err) {
    console.error("Analyses API error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
