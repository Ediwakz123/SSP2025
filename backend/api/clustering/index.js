// backend/api/clustering/index.js

const { getBusinessesByCategory } = require("../../services/clusteringService");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const category = url.searchParams.get("category");

    if (!category) {
      return res.status(400).json({
        error: "Category is required",
      });
    }

    // Fetch raw businesses only
    const businesses = await getBusinessesByCategory(category);

    return res.status(200).json({ businesses });
  } catch (err) {
    console.error("Clustering API error:", err);

    return res.status(500).json({
      error: "Failed to fetch businesses",
      details: err.message ?? String(err),
    });
  }
};
