// backend/api/clustering/index.js

const { runClustering } = require('../../services/clusteringService');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Body parsing (Vercel may give a string body)
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const { userId, businessCategory, numClusters } = body || {};

    // Validation
    if (!userId || !businessCategory || !numClusters) {
      return res.status(400).json({
        error: 'userId, businessCategory, and numClusters are required',
      });
    }

    // Perform clustering
    const result = await runClustering({
      userId,
      businessCategory,
      numClusters: Number(numClusters),
    });

    return res.status(200).json({
      message: 'Clustering completed',
      result,
    });
  } catch (err) {
    console.error('Clustering API error:', err);

    return res.status(500).json({
      error: 'Failed to run clustering',
      details: err.message ?? String(err),
    });
  }
};
