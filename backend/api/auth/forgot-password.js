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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ detail: 'Invalid email format' });
    }

    // Initialize Supabase with SERVICE_ROLE_KEY for database modifications
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if user exists
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    // Return generic success message to prevent user enumeration
    // Even if user doesn't exist, we show the same response
    if (userErr || !user) {
      return res.status(200).json({ 
        detail: "If an account with that email exists, a password reset link has been sent." 
      });
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
          user_id: user.uid,
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
    user_id: user.uid,
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
