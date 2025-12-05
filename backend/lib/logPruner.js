import { supabase } from "./supabaseClient.js";
import logger from "./logger.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function pruneActivityLogs() {
  const cutoff = new Date(Date.now() - ONE_DAY_MS).toISOString();

  const { error, count } = await supabase
    .from("activity_logs")
    .delete({ count: "exact", returning: "minimal" })
    .lt("created_at", cutoff);

  if (error) {
    logger.error("Daily activity log pruning failed", { error: error.message });
    return;
  }

  logger.info("Daily activity log pruning completed", {
    deleted: count ?? 0,
    cutoff,
  });
}

function msUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

export function startLogPruner() {
  const runPrune = () => pruneActivityLogs().catch((err) => {
    logger.error("Unexpected error during log pruning", { error: err.message });
  });

  // Clean up anything older than 24 hours on startup
  runPrune();

  const initialDelay = msUntilNextMidnight();
  const safeDelay = initialDelay > 0 ? initialDelay : ONE_DAY_MS;

  setTimeout(() => {
    runPrune();
    setInterval(runPrune, ONE_DAY_MS);
  }, safeDelay);

  logger.info("Scheduled daily activity log pruning", { runsInMs: safeDelay });
}
