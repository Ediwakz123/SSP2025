import { supabase } from "../../lib/supabaseClient.js";
import { verifyAdmin } from "./auth.js";

/**
 * Admin User Actions API
 * Handles approve/decline actions for user accounts
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify admin authentication
    const admin = verifyAdmin(req, res);
    if (!admin || admin.error) return;

    const { userId, action } = req.body;

    // Validate request
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    if (!["approve", "decline"].includes(action)) {
        return res.status(400).json({ error: "action must be 'approve' or 'decline'" });
    }

    try {
        // Get the target user's info for logging
        const { data: targetUser, error: fetchError } = await supabase
            .from("profiles")
            .select("email, full_name, approval_status")
            .eq("id", userId)
            .single();

        if (fetchError || !targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Determine new status
        const newStatus = action === "approve" ? "approved" : "declined";

        // Update the user's approval status
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                approval_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (updateError) {
            console.error("Error updating user status:", updateError);
            return res.status(500).json({ error: updateError.message });
        }

        // Log the action in activity_logs
        await supabase.from("activity_logs").insert({
            user_id: admin.id,
            action: `user_${action}d`,
            user_email: admin.email,
            details: `Admin ${admin.email} ${action}d user ${targetUser.email || userId}`,
            metadata: {
                target_user_id: userId,
                target_user_email: targetUser.email,
                target_user_name: targetUser.full_name,
                previous_status: targetUser.approval_status,
                new_status: newStatus,
                admin_id: admin.id,
                admin_email: admin.email
            }
        });

        return res.status(200).json({
            success: true,
            message: `User ${action}d successfully`,
            newStatus,
            user: {
                id: userId,
                email: targetUser.email,
                full_name: targetUser.full_name
            }
        });

    } catch (error) {
        console.error("User action error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
