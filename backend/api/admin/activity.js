import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

export default async function handler(req, res) {
  // Verify admin access
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Activity logs error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, logs: data });
  } catch (err) {
    console.error("Activity API error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
