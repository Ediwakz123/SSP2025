import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Ensure the requester is an admin
  const admin = verifyAdmin(req, res);
  if (!admin || admin.error) return;

  const { accounts } = req.body;

  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({
      error: "Invalid request: 'accounts' must be an array.",
    });
  }

  const results = [];

  // Loop through each account and create user
  for (const acc of accounts) {
    const { email, password, role } = acc;

    if (!email || !password) {
      results.push({
        email,
        success: false,
        error: "Missing email or password",
      });
      continue;
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: role || "user" },
      });

      results.push({
        email,
        success: !error,
        error: error?.message || null,
        user: data || null,
      });
    } catch (err) {
      results.push({
        email,
        success: false,
        error: err.message,
      });
    }
  }

  // Final response
  return res.status(200).json({
    success: true,
    created_by: admin.email,
    results,
  });
}
