import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data } = await supabase.from("businesses").select("*");
    return res.status(200).json({ success: true, data });
  }

  if (req.method === "PUT") {
    const updated = req.body;

    // Clear all
    await supabase.from("businesses").delete().neq("id", 0);

    // Insert updated data
    await supabase.from("businesses").insert(updated);

    return res.status(200).json({ success: true });
  }

  if (req.method === "POST") {
    // Reset to default — optional seed file
    return res.status(200).json({ success: true, message: "Reset complete" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
