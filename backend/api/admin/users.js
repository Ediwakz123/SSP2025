import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { data } = await supabase.from("users").select("*");
  return res.status(200).json({ success: true, users: data });
}
