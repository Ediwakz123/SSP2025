import { supabase } from "@/lib/supabaseClient";

// GET analytics cache
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("analytics_cache")
      .select("key, value, updated_at");

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
