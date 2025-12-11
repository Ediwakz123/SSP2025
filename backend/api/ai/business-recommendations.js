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
    const systemPrompt = `SYSTEM ROLE:

You are the AI that gives business location recommendations for the Strategic Store Placement System.

The user has already run the K-Means clustering.
You will ALWAYS use the clustering results to give helpful suggestions.

Your Job:
Use the clustering data to recommend the best place(s) for the user's business.
Your answers must always appear, even if the data is missing or incomplete.

Your Output MUST Include:
1. Best Recommended Location - Tell which cluster/location is best based on foot traffic, competition, density, and market gaps
2. Why This Recommendation - Simple reasons why this location is good
3. Additional Opportunities - Extra suggestions like business variations or strategies
4. Confidence Score (0–100%) - How confident you are

Style Rules:
- Use simple words
- Short and clear sentences  
- Easy for any user to read
- No technical jargon
- Provide friendly, helpful advice

If Some Data Is Missing:
DO NOT say "No recommendations available."
Always provide something useful based on available data.`;

    const userPrompt = `Business Idea: "${businessIdea || "General " + (generalCategory || "Business")}"
Detected Category: ${generalCategory || "Not specified"}

CLUSTERING RESULTS:
Location Coordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}
Zone Type: ${zoneType}
Cluster Profile: ${clusterProfile}
Dominant Category in Area: ${dominantCategory}
Total Nearby Businesses: ${totalBusinesses}

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
CLUSTERING CONFIDENCE: ${confidence ? (confidence * 100).toFixed(0) + "%" : "N/A"}

Return ONLY valid JSON in this exact format:
{
  "category_validation": {
    "user_input": "${businessIdea || "Not specified"}",
    "mapped_category": "${generalCategory || "General"}",
    "reason": "Brief reason for category mapping"
  },
  "nearby_business_summary": {
    "total_businesses": ${totalBusinesses},
    "total_competitors": ${c200},
    "top_categories": ["Category1", "Category2", "Category3"],
    "area_behavior": "Brief description of what this area is known for"
  },
  "competitor_analysis": {
    "competition_level": "Low/Medium/High",
    "dominant_competitors": ["Competitor type 1", "Competitor type 2"],
    "saturation_notes": "Brief note about market saturation",
    "opportunity_gaps": ["Gap 1", "Gap 2"]
  },
  "location_analysis": {
    "zone_type": "${zoneType}",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "opportunity_level": "${opportunity || "Moderate"}",
    "suitability_score": "Score like 75/100 or Good/Excellent"
  },
  "recommendations": [
    {
      "business_name": "Specific business name idea",
      "general_category": "${generalCategory || "Retail"}",
      "fit_reason": "Why this business fits the location",
      "ecosystem_synergy": "How it benefits from nearby businesses",
      "competition_risk": "Low/Medium/High",
      "data_points_supporting": ["Data point 1", "Data point 2"]
    }
  ],
  "final_verdict": {
    "suitability": "Highly Suitable/Suitable/Moderately Suitable/Not Recommended",
    "best_recommendation": "The single best business recommendation",
    "actionable_advice": "One clear action the user should take"
  }
}`;

    const result = await model.generateContent([
      { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
    ]);
    const text = result.response.text();

    let data;
    try {
      let clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
      data = JSON.parse(clean);
    } catch {
      // Fallback response if JSON parsing fails
      const competitionLevel = c50 >= 3 ? "High" : c100 >= 5 ? "Medium" : "Low";
      const suitability = opportunity === "High" ? "Highly Suitable"
        : opportunity === "Moderate" ? "Suitable"
          : "Moderately Suitable";

      data = {
        category_validation: {
          user_input: businessIdea || "Not specified",
          mapped_category: generalCategory || "General",
          reason: "Classified based on business description."
        },
        nearby_business_summary: {
          total_businesses: totalBusinesses,
          total_competitors: c200,
          top_categories: [dominantCategory, "Mixed Services", "Retail"],
          area_behavior: `A ${zoneType.toLowerCase()} zone with ${b200} nearby businesses.`
        },
        competitor_analysis: {
          competition_level: competitionLevel,
          dominant_competitors: [generalCategory, "General Retail"],
          saturation_notes: c50 === 0 ? "Low saturation - good entry opportunity" : "Some competitors present",
          opportunity_gaps: c50 === 0 ? ["No direct competitors within 50m", "Market gap available"] : ["Differentiation needed"]
        },
        location_analysis: {
          zone_type: zoneType,
          strengths: [
            b100 >= 5 ? "Good foot traffic" : "Emerging area with potential",
            `${zoneType} zone environment`,
            c50 === 0 ? "No immediate competition" : "Established commercial area"
          ],
          weaknesses: c50 >= 3 ? ["High competition nearby"] : ["Market still developing"],
          opportunity_level: opportunity || "Moderate",
          suitability_score: `${Math.max(50, 85 - c50 * 10)}/100`
        },
        recommendations: [{
          business_name: `${businessIdea || generalCategory || "New Business"} Store`,
          general_category: generalCategory || "Retail",
          fit_reason: `Good match for this ${zoneType} location with ${opportunity || "moderate"} opportunity.`,
          ecosystem_synergy: `Can benefit from ${b100} nearby businesses for customer flow.`,
          competition_risk: competitionLevel,
          data_points_supporting: [
            `${b200} businesses within 200m`,
            `${c200} direct competitors`,
            `${zoneType} zone type`
          ]
        }],
        final_verdict: {
          suitability: suitability,
          best_recommendation: businessIdea || `${generalCategory || "General"} Business`,
          actionable_advice: c50 === 0
            ? "Good opportunity - proceed with market research and location scouting."
            : "Focus on differentiation strategy to stand out from competitors."
        }
      };
    }

    return res.status(200).json({ success: true, recommendations: data });

  } catch (err) {
    console.error("AI Error:", err.message);
    return res.status(500).json({ error: "AI error", message: err.message });
  }
}
