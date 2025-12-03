import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  return res.status(200).json({ success: true, logs: data });
}
