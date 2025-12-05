import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Business Recommendation Endpoint
 * Analyzes location data with structured output format
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      businessIdea,
      coordinates,
      zoneType,
      generalCategory,
      businessDensity,
      competitorDensity,
      clusterAnalytics,
      nearbyBusinesses,
      nearbyCompetitors,
      confidence,
      opportunity
    } = req.body;

    if (!coordinates || !zoneType) {
      return res.status(400).json({ error: "Missing required location data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return res.status(500).json({ error: "AI service not configured" });
    }

    console.log("🤖 AI Recommendations: Starting analysis...");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Process businesses - convert Miscellaneous to Restaurant, remove Pet Store
    const processedBusinesses = (nearbyBusinesses || []).map(b => {
      let category = b.business?.general_category || b.category || "Unknown";
      if (category.toLowerCase() === "miscellaneous") category = "Restaurant";
      if (category.toLowerCase() === "pet store") return null;
      return { ...b, processedCategory: category };
    }).filter(Boolean);

    // Build the structured prompt
    const prompt = `
You are an AI system that evaluates the commercial potential of a location using business density, competitor pressure, demand pockets, and cluster centroids.

=== CATEGORY RULES (APPLY FIRST) ===
- Convert any "Miscellaneous" category → "Restaurant"
- Remove "Pet Store" entirely
- Allowed categories ONLY: Retail, Services, Restaurant, Food & Beverages, Merchandise / Trading, Entertainment / Leisure

=== INPUT DATA ===

📍 Location:
- Coordinates: ${coordinates.latitude}, ${coordinates.longitude}
- Zone Type: ${zoneType}
- Category Analyzed: ${generalCategory || "Not specified"}
- Business Idea: ${businessIdea || "Not specified"}
- Confidence: ${(confidence * 100).toFixed(0)}%
- Opportunity Level: ${opportunity || "Moderate"}

📊 Business Density:
- 50m: ${businessDensity?.density_50m ?? 0} businesses
- 100m: ${businessDensity?.density_100m ?? 0} businesses
- 200m: ${businessDensity?.density_200m ?? 0} businesses

🎯 Competitor Density:
- 50m: ${competitorDensity?.competitor_50m ?? 0} competitors
- 100m: ${competitorDensity?.competitor_100m ?? 0} competitors
- 200m: ${competitorDensity?.competitor_200m ?? 0} competitors

🏪 Nearby Businesses (${processedBusinesses.length} total):
${processedBusinesses.slice(0, 30).map((b, i) =>
      `${i + 1}. ${b.business?.business_name || b.name || "Unknown"} — ${b.processedCategory} — ${b.business?.street || "Unknown St."} — ${b.business?.zone_type || zoneType}`
    ).join('\n') || "No nearby businesses"}

=== REQUIRED OUTPUT FORMAT ===

Return ONLY valid JSON matching this structure:

{
  "location_summary": "2-3 sentence description of the business environment",
  
  "business_presence": {
    "radius_50m": { "count": <number>, "categories": "list or none" },
    "radius_100m": { "count": <number>, "categories": "list or none" },
    "radius_200m": { "count": <number>, "categories": "list or none" }
  },
  
  "competitor_pressure": {
    "radius_50m": { "count": <number>, "names": "competitor names or none" },
    "radius_100m": { "count": <number>, "names": "competitor names or none" },
    "radius_200m": { "count": <number>, "names": "competitor names or none" }
  },
  
  "ai_interpretation": [
    "Insight about commercial activity",
    "Insight about competitor density",
    "Insight about business suitability",
    "Insight about zone type advantage"
  ],
  
  "map_description": "This interactive map visualizes all businesses in the area using centroid clusters. Click on any cluster or marker to reveal the businesses contained inside, along with their category and zone type. Use this map to explore commercial density, identify hotspots, and understand nearby opportunities.",
  
  "highlighted_businesses": [
    {
      "batch": "1-10",
      "businesses": [
        {
          "number": 1,
          "name": "Business Name",
          "category": "Category",
          "street": "Street Name",
          "zone": "Zone Type",
          "insight": "Short explanation of relevance"
        }
      ]
    },
    {
      "batch": "11-20",
      "businesses": []
    }
  ],
  
  "final_verdict": {
    "suitability": "Highly Suitable / Suitable / Moderately Suitable / Not Recommended",
    "best_recommendation": "Single best business type for this location",
    "actionable_advice": "1-2 sentences of practical advice"
  }
}

RULES:
- Generate highlighted businesses in batches of 10 (1-10, 11-20, 21-30, etc.)
- Each business needs a short insight explaining relevance
- Use ONLY the provided data
- NO generic assumptions about traffic or demographics
- Return ONLY valid JSON
`;

    const aiResult = await model.generateContent(prompt);
    const text = aiResult.response.text();

    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      const recommendations = JSON.parse(cleanedText);

      return res.status(200).json({
        success: true,
        recommendations,
        generated_at: new Date().toISOString()
      });

    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      console.error("Raw response:", text);

      return res.status(200).json({
        success: false,
        error: "Failed to parse AI response",
        raw_response: text,
        fallback: {
          location_summary: `${zoneType} zone with ${processedBusinesses.length} nearby businesses.`,
          business_presence: {
            radius_50m: { count: businessDensity?.density_50m ?? 0, categories: "See map" },
            radius_100m: { count: businessDensity?.density_100m ?? 0, categories: "See map" },
            radius_200m: { count: businessDensity?.density_200m ?? 0, categories: "See map" }
          },
          competitor_pressure: {
            radius_50m: { count: competitorDensity?.competitor_50m ?? 0, names: "See map" },
            radius_100m: { count: competitorDensity?.competitor_100m ?? 0, names: "See map" },
            radius_200m: { count: competitorDensity?.competitor_200m ?? 0, names: "See map" }
          },
          ai_interpretation: [
            "Analysis based on clustering data",
            `${opportunity || "Moderate"} opportunity level detected`,
            `${zoneType} zone characteristics apply`
          ],
          map_description: "This interactive map visualizes all businesses in the area using centroid clusters. Click on any cluster or marker to reveal the businesses contained inside, along with their category and zone type. Use this map to explore commercial density, identify hotspots, and understand nearby opportunities.",
          final_verdict: {
            suitability: "Analysis Incomplete",
            best_recommendation: generalCategory || "General Business",
            actionable_advice: "Please try again or consult with a business advisor."
          }
        }
      });
    }

  } catch (err) {
    console.error("AI Recommendation Error:", err);
    return res.status(500).json({
      error: "AI service error",
      message: err.message
    });
  }
}
