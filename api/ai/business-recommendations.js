import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      businessIdea, coordinates, zoneType, generalCategory,
      businessDensity, competitorDensity, nearbyBusinesses, nearbyCompetitors,
      clusterAnalytics, confidence, opportunity
    } = req.body;

    if (!coordinates || !zoneType) {
      return res.status(400).json({ error: "Missing location data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "AI not configured" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Helper function to convert percentage to user-friendly label
    const getConfidenceLabel = (confidence) => {
      if (confidence <= 25) return "Not Ideal";
      if (confidence <= 50) return "Could Work";
      if (confidence <= 75) return "Good Choice";
      return "Best Choice";
    };

    // Extract density metrics
    const b50 = businessDensity?.density_50m ?? 0;
    const b100 = businessDensity?.density_100m ?? 0;
    const b200 = businessDensity?.density_200m ?? 0;
    const c50 = competitorDensity?.competitor_50m ?? 0;
    const c100 = competitorDensity?.competitor_100m ?? 0;
    const c200 = competitorDensity?.competitor_200m ?? 0;

    // Format nearby businesses
    const topBiz = (nearbyBusinesses || []).slice(0, 10).map((b, i) =>
      `${i + 1}. ${b.business?.business_name || b.name} (${b.business?.general_category || b.category})`
    ).join("\n");

    // Format competitors
    const topCompetitors = (nearbyCompetitors || []).slice(0, 5).map((c, i) =>
      `${i + 1}. ${c.business?.business_name || c.name}`
    ).join("\n");

    // Cluster analytics
    const clusterProfile = clusterAnalytics?.clusterProfile || "Unknown";
    const dominantCategory = clusterAnalytics?.dominantCategory || generalCategory || "Mixed";
    const totalBusinesses = clusterAnalytics?.totalBusinesses ?? nearbyBusinesses?.length ?? 0;

    // Build comprehensive system prompt
    const systemPrompt = `You are an AI Business Recommendation Engine.

Use ONLY the provided data:
- User's business idea and category
- Cluster information: clusterId, centroid (lat/lng), number of businesses in each cluster

Your tasks:
1. Identify the best cluster and give it a friendly, easy-to-understand name.
   Examples: "Service Area", "Shopping Area", "Quiet Area", "Growing Area", "Mixed Business Area"

2. Recommend the Top 3 additional business ideas that fit well in that cluster.

3. For each recommended business, include:
   - name
   - score (0–100)
   - fitPercentage (0–100)
   - opportunityLevel (High/Medium/Low)
   - shortDescription (1–2 simple sentences)
   - fullDetails: write clearly using simple words. Explain why this business fits here, what is missing in the area, what benefits it brings, and any small risk explained simply.

4. Rename clusters using friendly names:
   - High business count → "Busy Area"
   - Medium count → "Active Area"
   - Low count → "Growing Area"

5. The FINAL SUGGESTION must be written in very simple language. Avoid jargon. Avoid technical terms. Speak like you are giving helpful advice to a regular person.

Examples of simple final suggestions:
- "This area is a good place for your business because there are not many similar shops yet."
- "This spot is promising because people nearby may need this service."

Output ONLY valid JSON.`;

    const userPrompt = `Business Idea: "${businessIdea || "General " + (generalCategory || "Business")}"
Detected Category: ${generalCategory || "Not specified"}

CLUSTERING RESULTS:
Location: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}
Zone Type: ${zoneType}
Cluster Profile: ${clusterProfile}
Dominant Category: ${dominantCategory}

BUSINESS DENSITY:
- Within 50m: ${b50} businesses
- Within 100m: ${b100} businesses
- Within 200m: ${b200} businesses

COMPETITION:
- Within 50m: ${c50} competitors
- Within 100m: ${c100} competitors
- Within 200m: ${c200} competitors

NEARBY BUSINESSES:
${topBiz || "No nearby businesses found"}

DIRECT COMPETITORS:
${topCompetitors || "No direct competitors found"}

OPPORTUNITY LEVEL: ${opportunity || "Moderate"}

Return ONLY valid JSON in this exact format:
{
  "bestCluster": {
    "clusterId": 1,
    "friendlyName": "Service Area",
    "reason": "Simple reason why this cluster is best",
    "confidence": 85
  },
  "topBusinesses": [
    {
      "name": "Business Name",
      "score": 92,
      "fitPercentage": 88,
      "opportunityLevel": "High",
      "shortDescription": "1-2 simple sentences about this business.",
      "fullDetails": "Clear explanation using simple words about why this business fits, what is missing, benefits, and any small risks."
    },
    {
      "name": "Business Name 2",
      "score": 85,
      "fitPercentage": 82,
      "opportunityLevel": "Medium",
      "shortDescription": "Short description.",
      "fullDetails": "Full explanation in simple words."
    },
    {
      "name": "Business Name 3",
      "score": 79,
      "fitPercentage": 77,
      "opportunityLevel": "Medium",
      "shortDescription": "Short description.",
      "fullDetails": "Full explanation in simple words."
    }
  ],
  "clusterSummary": [
    { "clusterId": 1, "friendlyName": "Busy Area", "businessCount": ${b50 + b100}, "competitionLevel": "High" },
    { "clusterId": 2, "friendlyName": "Active Area", "businessCount": ${b100}, "competitionLevel": "Medium" },
    { "clusterId": 3, "friendlyName": "Growing Area", "businessCount": ${Math.max(0, b200 - b100)}, "competitionLevel": "Low" }
  ],
  "finalSuggestion": "This cluster looks like a good place for your business because people in the area need these kinds of services, and there are still not many shops offering them."
}`;


    const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
    const text = result.response.text();

    let data;
    try {
      let clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
      data = JSON.parse(clean);

      // Ensure confidenceLabel is always set
      if (data.bestCluster && data.bestCluster.confidence) {
        data.bestCluster.confidenceLabel = getConfidenceLabel(data.bestCluster.confidence);
      }
    } catch {
      // Fallback response if JSON parsing fails
      const competitionLevel = c50 >= 3 ? "High" : c100 >= 5 ? "Medium" : "Low";
      const friendlyName = b50 + b100 >= 10 ? "Busy Area" : b50 + b100 >= 5 ? "Active Area" : "Growing Area";
      const score1 = Math.max(60, 90 - c50 * 5);
      const score2 = Math.max(55, score1 - 7);
      const score3 = Math.max(50, score2 - 6);
      const confValue = Math.min(95, Math.max(60, 85 - c50 * 5 + b100 * 2));

      data = {
        bestCluster: {
          clusterId: 1,
          friendlyName: friendlyName,
          reason: c50 === 0
            ? "This area has no direct competitors nearby, making it a great place to start."
            : `This is a ${zoneType.toLowerCase()} zone with ${competitionLevel.toLowerCase()} competition.`,
          confidence: confValue,
          confidenceLabel: getConfidenceLabel(confValue)
        },
        topBusinesses: [
          {
            name: businessIdea || `${generalCategory || "General"} Business`,
            score: score1,
            fitPercentage: score1 - 4,
            opportunityLevel: score1 >= 80 ? "High" : score1 >= 65 ? "Medium" : "Low",
            shortDescription: c50 === 0
              ? "No similar shops nearby. Good chance to be the first."
              : "Some competition exists, but you can stand out with good service.",
            fullDetails: c50 === 0
              ? "This business fits well here because there are no direct competitors within 50 meters. People in this area may need this service but currently have to go elsewhere. Being the first gives you an advantage."
              : `There are ${c50} similar businesses nearby. To succeed, focus on what makes your business different - better quality, price, or service.`
          },
          {
            name: `${generalCategory || "Retail"} Services`,
            score: score2,
            fitPercentage: score2 - 3,
            opportunityLevel: score2 >= 80 ? "High" : score2 >= 65 ? "Medium" : "Low",
            shortDescription: `Works well with the ${b100} businesses already here.`,
            fullDetails: `This area already has ${b100} businesses within 100 meters. Adding a service business can complement them and benefit from the foot traffic they bring.`
          },
          {
            name: "Convenience Store",
            score: score3,
            fitPercentage: score3 - 2,
            opportunityLevel: score3 >= 80 ? "High" : score3 >= 65 ? "Medium" : "Low",
            shortDescription: "Basic needs store that most areas can benefit from.",
            fullDetails: `A convenience store provides daily essentials that people need. In a ${zoneType.toLowerCase()} zone like this, there is usually steady demand for quick purchases.`
          }
        ],
        clusterSummary: [
          { clusterId: 1, friendlyName: friendlyName, businessCount: b50, competitionLevel: c50 >= 3 ? "High" : c50 >= 1 ? "Medium" : "Low" },
          { clusterId: 2, friendlyName: "Active Area", businessCount: Math.max(0, b100 - b50), competitionLevel: "Medium" },
          { clusterId: 3, friendlyName: "Growing Area", businessCount: Math.max(0, b200 - b100), competitionLevel: "Low" }
        ],
        finalSuggestion: c50 === 0
          ? "This looks like a good place for your business because there are not many similar shops yet. You could be one of the first here."
          : "This area has some competition, but there is still room for a new business if you offer something unique or better service."
      };
    }

    return res.status(200).json({ success: true, recommendations: data });

  } catch (err) {
    console.error("AI Error:", err.message);
    return res.status(500).json({ error: "AI error", message: err.message });
  }
}
