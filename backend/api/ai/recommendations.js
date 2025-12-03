import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ error: "Missing category" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an AI assistant that recommends business ideas based on a chosen business category.

My available categories are:

Retail

Service

Merchandising / Trading

Miscellaneous

Entertainment / Leisure

Recommend 1–3 realistic business ideas even when no population density, foot traffic, or competitor data is available.

Assume the recommendations should be generally feasible for a town or city with average economic activity.

Format the response as a simple list with no explanation.

Example:
If category = ‘Retail’, you might output:

Convenience Store

Mobile Accessories Shop

Milk Tea Shop

Computer Parts Store

Mini Pharmacy

Now generate business recommendations for this category:
${category}
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse the list into an array
        // Filter out empty lines and potential markdown bullets if the AI adds them despite instructions
        const recommendations = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.replace(/^[-*]\s+/, '')); // Remove leading bullets if present

        return res.status(200).json({ recommendations });

    } catch (err) {
        console.error("Gemini recommendation error:", err);
        return res.status(500).json({ error: "AI error", message: err.message });
    }
}
