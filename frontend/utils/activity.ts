import { supabase } from "../lib/supabase";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* -----------------------------------------
   GLOBAL STATE FOR TIME TRACKING
----------------------------------------- */
let lastPageEnterTime: number | null = null;

/* -----------------------------------------
   CLEAN ACTION NAME GENERATOR
----------------------------------------- */
export function formatAction(raw: string) {
  const a = raw.toLowerCase();

  if (a.includes("dashboard")) return "Viewed Dashboard";
  if (a.includes("clustering")) return "Viewed Clustering Page";
  if (a.includes("ran clustering")) return "Ran Clustering";
  if (a.includes("analytics")) return "Viewed Analytics Page";
  if (a.includes("map")) return "Viewed Map Page";
  if (a.includes("opportunities")) return "Viewed Opportunities Page";
  if (a.includes("export")) return "Exported Report";
  if (a.includes("login")) return "User Logged In";

  return raw.replace(/^opened|clicked/gi, "").trim();
}

/* -----------------------------------------
   MAIN ACTIVITY LOGGER
----------------------------------------- */
export async function logActivity(action: string, metadata: any = {}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const now = Date.now();

    let timeSpentSeconds = null;
    if (lastPageEnterTime !== null) {
      timeSpentSeconds = Math.round((now - lastPageEnterTime) / 1000);
    }

    lastPageEnterTime = now;

    // Store raw machine-readable action
    const cleanAction = action
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\W+/g, "");

    const finalMetadata = {
      ...metadata,
      timeSpentSeconds,
      timestamp: new Date().toISOString(),
    };

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: cleanAction,                        // <-- RAW CODE
      details: JSON.stringify(finalMetadata),     // <-- FIXED JSON
    });
  } catch (err) {
    console.error("🔥 Error logging activity:", err);
  }
}


/* -----------------------------------------
   AUTO PAGE LOGGER
----------------------------------------- */

const PAGE_ACTIONS: Record<string, string> = {
  "/user/dashboard": "Viewed Dashboard",
  "/user/clustering": "Viewed Clustering Page",
  "/user/analytics": "Viewed Analytics Page",
  "/user/map": "Viewed Map Page",
  "/user/opportunities": "Viewed Opportunities Page",
  "/user/profile": "Viewed Profile Page",
};

export function useActivity() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const action =
      PAGE_ACTIONS[path] ||
      `Viewed ${path.replace("/user/", "").replace("/", "")}`;

    logActivity(action, { page: path });
  }, [location.pathname]);
}
