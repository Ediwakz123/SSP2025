import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ detail: "Email is required" });
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Check if user exists
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ detail: "No account found with this email." });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString(); 
    // expires in 15 min

    // Save token in DB
    const { error: tokenErr } = await supabase
      .from("password_reset_tokens")
      .insert([
        {
          user_id: user.id,
          token_hash: crypto.createHash("sha256").update(token).digest("hex"),
          expires_at: expiresAt
        }
      ]);

    if (tokenErr) {
      console.error(tokenErr);
      return res.status(500).json({ detail: "Failed to generate reset token." });
    }

    // Reset URL (frontend route)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Setup mail transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Password Reset Instructions",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.first_name},</p>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" 
           style="background:#4f46e5;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">
           Reset Password
        </a>
        <p>This link expires in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });

    await supabase.from("activity_logs").insert([
  {
    user_id: user.id,
    action: "User requested password reset",
    timestamp: new Date().toISOString()
  }
]);

    return res.status(200).json({
      detail: "Reset password instructions sent."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: "Internal server error." });
  }
}
