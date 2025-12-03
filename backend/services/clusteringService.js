const supabase = require("../config/supabase");

/**
 * Backend ONLY: fetch raw business data.
 * FRONTEND handles all clustering, scoring, analysis.
 */
async function getBusinessesByCategory(category) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("general_category", category);

  if (error) {
    console.error("Supabase error:", error);
    throw new Error("Failed to fetch businesses");
  }

  return data || [];
}

module.exports = { getBusinessesByCategory };
