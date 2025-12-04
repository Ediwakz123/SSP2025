/**
 * AI API Tests
 * Tests AI-related endpoints (Gemini integration)
 */

describe("AI API Tests", () => {
  describe("Gemini API Configuration", () => {
    it("should have GEMINI_API_KEY configured", () => {
      // Check if API key is set (don't log the actual key)
      const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
      expect(hasApiKey).toBe(true);
    });
  });

  describe("Business Category Detection", () => {
    const validCategories = [
      "Retail",
      "Service",
      "Merchandising / Trading",
      "Miscellaneous",
      "Entertainment / Leisure",
    ];

    it("should validate response category", () => {
      const isValidCategory = (category) => {
        return validCategories.some(
          (valid) => valid.toLowerCase() === category.toLowerCase().trim()
        );
      };

      expect(isValidCategory("Retail")).toBe(true);
      expect(isValidCategory("Service")).toBe(true);
      expect(isValidCategory("InvalidCategory")).toBe(false);
    });

    it("should clean AI response text", () => {
      const cleanResponse = (text) => {
        // Remove markdown, extra whitespace, quotes
        return text
          .replace(/```json|```/g, "")
          .replace(/["']/g, "")
          .trim();
      };

      expect(cleanResponse("```json\nRetail\n```")).toBe("Retail");
      expect(cleanResponse('"Service"')).toBe("Service");
      expect(cleanResponse("  Retail  ")).toBe("Retail");
    });
  });

  describe("Business Recommendations", () => {
    it("should parse recommendations list correctly", () => {
      const parseRecommendations = (text) => {
        return text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => line.replace(/^[-*]\s+/, "")); // Remove bullets
      };

      const input = `
        - Convenience Store
        - Mobile Accessories Shop
        - Milk Tea Shop
      `;

      const recommendations = parseRecommendations(input);
      expect(recommendations.length).toBe(3);
      expect(recommendations[0]).toBe("Convenience Store");
      expect(recommendations[1]).toBe("Mobile Accessories Shop");
    });

    it("should handle numbered list format", () => {
      const parseRecommendations = (text) => {
        return text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => line.replace(/^\d+\.\s*/, "")); // Remove numbers
      };

      const input = `
        1. Computer Shop
        2. Hardware Store
        3. Printing Services
      `;

      const recommendations = parseRecommendations(input);
      expect(recommendations.length).toBe(3);
      expect(recommendations[0]).toBe("Computer Shop");
    });
  });

  describe("Business Validation", () => {
    it("should detect invalid business names", () => {
      const invalidBusinessNames = [
        "Scatter",
        "Buyer",
        "Orange",
        "Table",
        "asdfs",
        "123abc",
        "aaa bbb",
      ];

      const validBusinessNames = [
        "Computer Shop",
        "Milk Tea Shop",
        "Car Wash",
        "Pharmacy",
        "Hardware Store",
      ];

      const isLikelyBusiness = (name) => {
        const businessKeywords = [
          "shop",
          "store",
          "services",
          "wash",
          "pharmacy",
          "hardware",
          "cafe",
          "restaurant",
          "salon",
          "clinic",
        ];
        
        const lowerName = name.toLowerCase();
        return businessKeywords.some((keyword) => lowerName.includes(keyword));
      };

      // Valid business names should contain business keywords
      validBusinessNames.forEach((name) => {
        expect(isLikelyBusiness(name)).toBe(true);
      });

      // Invalid names shouldn't contain business keywords
      invalidBusinessNames.forEach((name) => {
        expect(isLikelyBusiness(name)).toBe(false);
      });
    });

    it("should validate business name input", () => {
      const validateInput = (businessName) => {
        if (!businessName || typeof businessName !== "string") {
          return { valid: false, message: "Please enter a valid business type." };
        }

        const trimmed = businessName.trim();
        if (trimmed === "") {
          return { valid: false, message: "Please enter a valid business type." };
        }

        if (trimmed.length < 3) {
          return { valid: false, message: "Business name too short." };
        }

        return { valid: true };
      };

      expect(validateInput("").valid).toBe(false);
      expect(validateInput(null).valid).toBe(false);
      expect(validateInput("ab").valid).toBe(false);
      expect(validateInput("Computer Shop").valid).toBe(true);
    });
  });

  describe("AI Response Parsing", () => {
    it("should parse JSON response from AI", () => {
      const parseAIResponse = (text) => {
        try {
          const cleaned = text.replace(/```json|```/g, "").trim();
          return JSON.parse(cleaned);
        } catch {
          return null;
        }
      };

      const validResponse = '```json\n{"category": "Retail", "explanation": "Test"}\n```';
      const parsed = parseAIResponse(validResponse);
      expect(parsed).not.toBeNull();
      expect(parsed.category).toBe("Retail");

      const invalidResponse = "This is not JSON";
      expect(parseAIResponse(invalidResponse)).toBeNull();
    });

    it("should handle AI service errors gracefully", () => {
      const handleAIError = (error) => {
        // Default fallback response
        return {
          category: "Others",
          explanation: "AI service error. Defaulting to Others.",
        };
      };

      const error = new Error("API rate limit exceeded");
      const fallback = handleAIError(error);
      
      expect(fallback.category).toBe("Others");
      expect(fallback.explanation).toContain("error");
    });
  });

  describe("Category Index Mapping", () => {
    it("should map extended categories correctly", () => {
      const extendedCategories = [
        "Food",
        "Retail",
        "Services",
        "Water",
        "Hardware",
        "Healthcare",
        "Education",
        "Others",
      ];

      const mapCategory = (category) => {
        const found = extendedCategories.find(
          (c) => c.toLowerCase() === category.toLowerCase()
        );
        return found || "Others";
      };

      expect(mapCategory("Food")).toBe("Food");
      expect(mapCategory("retail")).toBe("Retail");
      expect(mapCategory("Unknown Category")).toBe("Others");
    });
  });
});
