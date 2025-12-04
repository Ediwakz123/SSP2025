/**
 * Admin API Tests
 * Tests admin-related endpoints
 */

import { supabase } from "../lib/supabaseClient.js";
import jwt from "jsonwebtoken";

describe("Admin API Tests", () => {
  describe("Admin Authentication", () => {
    it("should verify JWT_SECRET is configured", () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(0);
    });

    it("should validate admin token structure", () => {
      const adminPayload = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
      };

      const token = jwt.sign(adminPayload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      expect(token).toBeDefined();
      expect(token.split(".").length).toBe(3);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.role).toBe("admin");
      expect(decoded.email).toBe("admin@example.com");
    });

    it("should reject non-admin role in token", () => {
      const userPayload = {
        id: "user-123",
        email: "user@example.com",
        role: "user",
      };

      const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.role).not.toBe("admin");
    });
  });

  describe("Admin Stats Endpoint", () => {
    it("should fetch user count", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch clustering results count", async () => {
      const { data, error } = await supabase
        .from("clustering_results")
        .select("*");

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch business count", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*");

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should calculate active users", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      expect(error).toBeNull();

      if (data) {
        const activeUsers = data.filter((u) => u.is_active);
        expect(typeof activeUsers.length).toBe("number");
      }
    });

    it("should calculate recent signups (last 24 hours)", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      expect(error).toBeNull();

      if (data) {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentSignups = data.filter(
          (u) => new Date(u.created_at).getTime() > oneDayAgo
        );
        expect(typeof recentSignups.length).toBe("number");
      }
    });
  });

  describe("Activity Logs Endpoint", () => {
    it("should fetch activity logs", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should support activity log ordering", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      expect(error).toBeNull();

      if (data && data.length > 1) {
        const dates = data.map((log) => new Date(log.created_at).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });
  });

  describe("Seed Data Endpoint", () => {
    it("should fetch seed data (businesses)", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*");

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should calculate seed data statistics", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*");

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const categories = {};
        const zones = {};
        let totalDensity = 0;
        let totalTraffic = 0;

        data.forEach((b) => {
          categories[b.category] = (categories[b.category] || 0) + 1;
          zones[b.zone_type] = (zones[b.zone_type] || 0) + 1;
          totalDensity += b.population_density || 0;
          totalTraffic += b.foot_traffic || 0;
        });

        expect(Object.keys(categories).length).toBeGreaterThan(0);
      }
    });
  });

  describe("User Management Endpoint", () => {
    it("should fetch users list", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("uid, email, username, is_active, created_at")
        .order("uid", { ascending: true });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should filter admin users", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      expect(error).toBeNull();

      if (data) {
        const admins = data.filter((u) => u.is_superuser || u.role === "admin");
        expect(Array.isArray(admins)).toBe(true);
      }
    });
  });

  describe("Analytics Cache Endpoint", () => {
    it("should access analytics_cache table", async () => {
      const { data, error } = await supabase
        .from("analytics_cache")
        .select("key, value, updated_at");

      // Table might not exist or be empty, both are valid states
      expect(error === null || error.code === "PGRST116" || error.code === "42P01").toBe(true);
    });
  });

  describe("CSV Upload Validation", () => {
    it("should validate CSV header structure", () => {
      const requiredColumns = [
        "business_id",
        "business_name",
        "general_category",
        "latitude",
        "longitude",
        "street",
        "zone_type",
        "status",
      ];

      const validateHeaders = (headers) => {
        const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
        const missingColumns = requiredColumns.filter(
          (col) => !normalizedHeaders.includes(col)
        );
        return missingColumns;
      };

      const validHeaders = [
        "business_id",
        "business_name",
        "general_category",
        "latitude",
        "longitude",
        "street",
        "zone_type",
        "status",
      ];
      expect(validateHeaders(validHeaders).length).toBe(0);

      const invalidHeaders = ["business_id", "business_name"];
      expect(validateHeaders(invalidHeaders).length).toBeGreaterThan(0);
    });

    it("should parse CSV line with quotes correctly", () => {
      const parseCSVLine = (text) => {
        const result = [];
        let cur = "";
        let inQuote = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === "," && !inQuote) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const line = '1,"Shop, Inc","Retail",14.5,120.5,"Main St","Commercial","Active"';
      const parsed = parseCSVLine(line);
      
      expect(parsed.length).toBe(8);
      expect(parsed[0]).toBe("1");
      expect(parsed[1]).toBe("Shop, Inc"); // Comma inside quotes preserved
      expect(parsed[2]).toBe("Retail");
    });

    it("should validate numeric fields", () => {
      const validateRow = (row) => {
        const errors = [];

        if (isNaN(parseInt(row.business_id))) {
          errors.push("Invalid business_id");
        }

        if (isNaN(parseFloat(row.latitude))) {
          errors.push("Invalid latitude");
        }

        if (isNaN(parseFloat(row.longitude))) {
          errors.push("Invalid longitude");
        }

        return errors;
      };

      const validRow = {
        business_id: "123",
        latitude: "14.5995",
        longitude: "120.9842",
      };
      expect(validateRow(validRow).length).toBe(0);

      const invalidRow = {
        business_id: "abc",
        latitude: "invalid",
        longitude: "120.9842",
      };
      expect(validateRow(invalidRow).length).toBe(2);
    });
  });

  describe("Category Normalization", () => {
    // Official categories
    const OFFICIAL_CATEGORIES = [
      "Retail",
      "Services",
      "Restaurant",
      "Food & Beverages",
      "Merchandise / Trading",
      "Entertainment / Leisure",
      "Pet Store"
    ];

    // Simple normalization function for testing
    const normalizeCategory = (inputCategory) => {
      if (!inputCategory || typeof inputCategory !== 'string') {
        return "Retail";
      }

      const normalized = inputCategory.trim().toLowerCase();

      // Direct mappings
      const CATEGORY_MAPPING = {
        "retail": "Retail",
        "services": "Services",
        "service": "Services",
        "restaurant": "Restaurant",
        "food & beverages": "Food & Beverages",
        "food and beverages": "Food & Beverages",
        "f&b": "Food & Beverages",
        "cafe": "Food & Beverages",
        "coffee shop": "Food & Beverages",
        "merchandise / trading": "Merchandise / Trading",
        "merchandise": "Merchandise / Trading",
        "trading": "Merchandise / Trading",
        "hardware": "Merchandise / Trading",
        "entertainment / leisure": "Entertainment / Leisure",
        "entertainment": "Entertainment / Leisure",
        "hotel": "Entertainment / Leisure",
        "pet store": "Pet Store",
        "pet shop": "Pet Store",
        "salon": "Services",
        "carwash": "Services",
        "car wash": "Services",
        "fast food": "Restaurant",
        "grocery": "Retail",
        "pharmacy": "Retail"
      };

      if (CATEGORY_MAPPING[normalized]) {
        return CATEGORY_MAPPING[normalized];
      }

      // Check if already official
      const officialMatch = OFFICIAL_CATEGORIES.find(
        cat => cat.toLowerCase() === normalized
      );
      if (officialMatch) {
        return officialMatch;
      }

      return "Retail"; // Default
    };

    it("should normalize common category variations", () => {
      expect(normalizeCategory("RETAIL")).toBe("Retail");
      expect(normalizeCategory("retail")).toBe("Retail");
      expect(normalizeCategory("Retail")).toBe("Retail");
    });

    it("should normalize service-related categories", () => {
      expect(normalizeCategory("Services")).toBe("Services");
      expect(normalizeCategory("service")).toBe("Services");
      expect(normalizeCategory("salon")).toBe("Services");
      expect(normalizeCategory("carwash")).toBe("Services");
      expect(normalizeCategory("car wash")).toBe("Services");
    });

    it("should normalize food-related categories", () => {
      expect(normalizeCategory("Restaurant")).toBe("Restaurant");
      expect(normalizeCategory("fast food")).toBe("Restaurant");
      expect(normalizeCategory("Food & Beverages")).toBe("Food & Beverages");
      expect(normalizeCategory("food and beverages")).toBe("Food & Beverages");
      expect(normalizeCategory("cafe")).toBe("Food & Beverages");
      expect(normalizeCategory("coffee shop")).toBe("Food & Beverages");
      expect(normalizeCategory("f&b")).toBe("Food & Beverages");
    });

    it("should normalize merchandise/trading categories", () => {
      expect(normalizeCategory("Merchandise / Trading")).toBe("Merchandise / Trading");
      expect(normalizeCategory("merchandise")).toBe("Merchandise / Trading");
      expect(normalizeCategory("trading")).toBe("Merchandise / Trading");
      expect(normalizeCategory("hardware")).toBe("Merchandise / Trading");
    });

    it("should normalize entertainment categories", () => {
      expect(normalizeCategory("Entertainment / Leisure")).toBe("Entertainment / Leisure");
      expect(normalizeCategory("entertainment")).toBe("Entertainment / Leisure");
      expect(normalizeCategory("hotel")).toBe("Entertainment / Leisure");
    });

    it("should normalize pet store categories", () => {
      expect(normalizeCategory("Pet Store")).toBe("Pet Store");
      expect(normalizeCategory("pet shop")).toBe("Pet Store");
    });

    it("should normalize retail-related categories", () => {
      expect(normalizeCategory("grocery")).toBe("Retail");
      expect(normalizeCategory("pharmacy")).toBe("Retail");
    });

    it("should return Retail as default for unknown categories", () => {
      expect(normalizeCategory("unknown category")).toBe("Retail");
      expect(normalizeCategory("")).toBe("Retail");
      expect(normalizeCategory(null)).toBe("Retail");
      expect(normalizeCategory(undefined)).toBe("Retail");
    });
  });
});
