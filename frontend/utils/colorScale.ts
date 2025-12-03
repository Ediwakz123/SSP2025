export function getOpportunityColor(score: number): string {
  if (score >= 0.75) return "#16a34a";   // green
  if (score >= 0.5) return "#facc15";    // yellow
  if (score >= 0.25) return "#fb923c";   // orange
  return "#ef4444";                      // red
}
