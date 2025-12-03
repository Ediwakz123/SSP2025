import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ detail: "Token and new password are required." });
    }

    // HASH token to match stored token_hash
    const token_hash = crypto.createHash("sha256").update(token).digest("hex");

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Look up token
    const { data: resetToken, error: tokenErr } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token_hash", token_hash)
      .single();

    if (tokenErr || !resetToken) {
      return res.status(400).json({ detail: "Invalid or expired token." });
    }

    // Check expiry
    const now = new Date();
    const expires_at = new Date(resetToken.expires_at);

    if (now > expires_at) {
      // Delete expired token
      await supabase.from("password_reset_tokens").delete().eq("id", resetToken.id);
      return res.status(400).json({ detail: "This reset link has expired." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update user password
    const { error: updateErr } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", resetToken.user_id);

    if (updateErr) {
      console.error(updateErr);
      return res.status(500).json({ detail: "Failed to update password." });
    }

    // Delete token after successful password change
    await supabase.from("password_reset_tokens").delete().eq("id", resetToken.id);

    return res.status(200).json({ detail: "Password has been reset successfully." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: "Internal server error." });
  }
}
