import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

export default async function handler(req, res) {
  // Verify admin authentication
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("businesses").select("*");
      if (error) {
        console.error("Seed data GET error:", error);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, data });
    }

    if (req.method === "PUT") {
      const updated = req.body;

      // Clear all
      const { error: deleteError } = await supabase.from("businesses").delete().neq("id", 0);
      if (deleteError) {
        console.error("Seed data DELETE error:", deleteError);
        return res.status(500).json({ success: false, error: deleteError.message });
      }

      // Insert updated data
      const { error: insertError } = await supabase.from("businesses").insert(updated);
      if (insertError) {
        console.error("Seed data INSERT error:", insertError);
        return res.status(500).json({ success: false, error: insertError.message });
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === "POST") {
      // Reset to default — optional seed file
      return res.status(200).json({ success: true, message: "Reset complete" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Seed data API error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
