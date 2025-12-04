import { supabase } from "../../../lib/supabaseClient.js";
import { verifyAdmin } from "../auth.js";

export default async function handler(req, res) {
  // Verify admin authentication
  const admin = verifyAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, users(email, username)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { user_id, action, metadata } = req.body;

    const { error } = await supabase.from("activity_logs").insert({
      user_id,
      action,
      metadata,
    });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ message: "Log recorded" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
