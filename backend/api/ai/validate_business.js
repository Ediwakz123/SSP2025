import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { business_name } = req.body;

    if (!business_name || typeof business_name !== "string" || business_name.trim() === "") {
        return res.status(400).json({ valid: false, message: "Please enter a valid business type." });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const prompt = `
      You are an AI assistant validating business names entered by the user.

      Reject any input that is not a realistic business, such as:
      - random words (e.g., 'Scatter', 'Buyer', 'Orange', 'Table')
      - verbs or adjectives
      - personal names with no business context
      - nonsense text (e.g., 'asdfs', '123abc', 'aaa bbb')
      - single words that are NOT business types

      Accept only inputs that look like actual business names, such as:
      - 'Computer Shop'
      - 'Milk Tea Shop'
      - 'Car Wash'
      - 'Pharmacy'
      - 'Hardware Store'

      Input: "${business_name}"

      If the input is NOT a valid business:
      Return: { "valid": false, "message": "Please enter a valid business type." }

      If the input IS valid:
      Return: { "valid": true, "clean_value": "<normalized input>" }

      Return JSON only, no explanation.
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean and parse JSON manually
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        const validationResult = JSON.parse(cleaned);

        return res.status(200).json(validationResult);

    } catch (error) {
        console.error("Business validation error:", error);
        return res.status(500).json({ valid: false, message: "Validation service unavailable." });
    }
}
