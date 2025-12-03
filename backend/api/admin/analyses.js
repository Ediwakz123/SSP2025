import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { data } = await supabase.from("clustering_results").select("*");
  return res.status(200).json({ success: true, analyses: data });
}
