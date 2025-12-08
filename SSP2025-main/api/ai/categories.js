import "../_loadEnv.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { businessIdea } = req.body;
        if (!businessIdea) return res.status(400).json({ error: "Missing businessIdea" });
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "AI not configured" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an AI business-category classifier for a Strategic Store Placement System.
Your job:
1. Analyze the user's business idea.
2. Assign the correct business category ONLY if the idea is clear and you are at least 60% confident.
3. If the idea is unclear, random, or not a valid business → return "no_category".
4. If the idea involves illegal, harmful, or restricted activities → return "prohibited".

──────────
VALID CATEGORIES (USE ONLY THESE):
- Retail
- Restaurant
- Entertainment / Leisure
- Merchandising / Trading
- Service

──────────
ILLEGAL / PROHIBITED BUSINESS IDEAS (NEVER CLASSIFY):
- Drugs, narcotics, cannabis (unless legally regulated)
- Cigarettes, vapes, tobacco distribution (if restricted)
- Gambling, casino, betting, illegal lottery
- Prostitution, escorting, adult sexual services
- Human trafficking, exploitation
- Selling weapons, firearms, explosives (if illegal)
- Cybercrime, fraud, piracy, scams
- Any explicitly illegal activity

If the input contains any prohibited activity, return:
{ "category": "prohibited", "confidence": 1, "reasoning": "The business idea involves illegal or restricted activities." }

──────────
OUTPUT FORMAT (STRICT):
{
  "category": "<Retail | Restaurant | Entertainment / Leisure | Merchandising / Trading | Service | no_category | prohibited>",
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief explanation>"
}

──────────
RULES:
- If AI confidence < 0.60, return "no_category".
- Do NOT guess or assign a random category.
- Do NOT default to "Service" when uncertain.
- If the idea is too vague (e.g., "scatter", "..." , "random"), return:
  { "category": "no_category", "confidence": 0, "reasoning": "The input does not describe a valid business idea." }

──────────
EXAMPLES:

Input: "Milk tea shop"
Output: { "category": "Restaurant", "confidence": 0.92, "reasoning": "Milk tea shops serve prepared food and beverages." }

Input: "Clothing boutique"
Output: { "category": "Retail", "confidence": 0.94, "reasoning": "A boutique sells apparel directly to consumers." }

Input: "Online casino"
Output: { "category": "prohibited", "confidence": 1, "reasoning": "Gambling is restricted or illegal." }

Input: "scatter"
Output: { "category": "no_category", "confidence": 0, "reasoning": "Not a business idea." }

──────────
Now classify this business idea: "${businessIdea}"

Reply with ONLY the JSON object, no markdown formatting.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");

        try {
            const data = JSON.parse(text);

            // Validate response structure
            const validCategories = [
                "Retail",
                "Restaurant",
                "Entertainment / Leisure",
                "Merchandising / Trading",
                "Service",
                "no_category",
                "prohibited"
            ];

            // Normalize category (handle variations)
            let normalizedCategory = data.category;
            if (normalizedCategory) {
                // Handle common variations
                const categoryMap = {
                    "entertainment": "Entertainment / Leisure",
                    "entertainment/leisure": "Entertainment / Leisure",
                    "leisure": "Entertainment / Leisure",
                    "merchandising": "Merchandising / Trading",
                    "merchandising/trading": "Merchandising / Trading",
                    "trading": "Merchandising / Trading",
                    "merchandise": "Merchandising / Trading",
                    "merchandise / trading": "Merchandising / Trading",
                    "services": "Service",
                    "food and beverages": "Restaurant",
                    "food & beverages": "Restaurant",
                    "f&b": "Restaurant"
                };

                const lowerCategory = normalizedCategory.toLowerCase().trim();
                if (categoryMap[lowerCategory]) {
                    normalizedCategory = categoryMap[lowerCategory];
                }
            }

            // Check if category is valid
            if (!validCategories.includes(normalizedCategory)) {
                normalizedCategory = "no_category";
            }

            // Check confidence threshold
            const confidence = parseFloat(data.confidence) || 0;
            if (confidence < 0.60 && normalizedCategory !== "prohibited" && normalizedCategory !== "no_category") {
                normalizedCategory = "no_category";
            }

            return res.status(200).json({
                category: normalizedCategory,
                confidence: confidence,
                explanation: data.reasoning || data.explanation || "Classified by AI"
            });
        } catch {
            // Fallback: if JSON parsing fails, return no_category
            console.error("Failed to parse AI response:", text);
            return res.status(200).json({
                category: "no_category",
                confidence: 0,
                explanation: "Could not parse AI response"
            });
        }

    } catch (err) {
        console.error("AI Category Error:", err.message);
        // Rate limit handling - return fallback
        if (err.message?.includes("429") || err.message?.includes("quota")) {
            return res.status(200).json({
                category: "no_category",
                confidence: 0,
                explanation: "Rate limited - please try again",
                rate_limited: true
            });
        }
        return res.status(500).json({ error: "AI error", message: err.message });
    }
}
