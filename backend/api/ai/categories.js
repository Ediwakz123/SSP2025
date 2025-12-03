import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { businessIdea } = req.body;

    if (!businessIdea) {
      return res.status(400).json({ error: "Missing businessIdea" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // NOW THIS WORKS ON VERCEL (latest SDK)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Classify this business idea into one of the following categories:
      - Retail
      - Service
      - Merchandising / Trading
      - Miscellaneous
      - Entertainment / Leisure

      Consider the nature of the business, what it offers, and its business model.

      Business Idea: "${businessIdea}"

      Return ONLY the best matching category name (no explanation).
    `;

    const aiRes = await model.generateContent(prompt);
    const text = aiRes.response.text();

    // The prompt asks for ONLY the category name, so we just trim the result.
    // We wrap it in a JSON object for the frontend.
    return res.status(200).json({ category: text.trim() });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI error", message: err.message });
  }
}
