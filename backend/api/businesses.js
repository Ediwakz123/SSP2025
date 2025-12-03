import { supabase } from "../lib/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("businesses")
      .select("*");

    if (error) return res.status(500).json({ error });

    return res.status(200).json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}
