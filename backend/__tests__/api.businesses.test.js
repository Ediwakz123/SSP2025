/**
 * Businesses API Tests
 * Tests business CRUD operations
 */

import { supabase } from "../lib/supabaseClient.js";

describe("Businesses API Tests", () => {
  describe("GET Businesses", () => {
    it("should fetch all businesses", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("id", { ascending: true });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

it("should return businesses with required fields", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("business_id, business_name, general_category, latitude, longitude, zone_type")
        .limit(10);

      expect(error).toBeNull();
      
      if (data && data.length > 0) {
        const business = data[0];
        expect(business).toHaveProperty("business_id");
        expect(business).toHaveProperty("business_name");
        expect(business).toHaveProperty("general_category");
        expect(business).toHaveProperty("latitude");
        expect(business).toHaveProperty("longitude");
      }
    });

    it("should filter businesses by category", async () => {
      // First get available categories
      const { data: categories } = await supabase
        .from("businesses")
        .select("category")
        .limit(1);

      if (categories && categories.length > 0) {
        const testCategory = categories[0].category;

        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("category", testCategory);

        expect(error).toBeNull();
        if (data && data.length > 0) {
          data.forEach((business) => {
            expect(business.category).toBe(testCategory);
          });
        }
      }
    });

    it("should filter businesses by zone_type", async () => {
      // First get available zone types
      const { data: zones } = await supabase
        .from("businesses")
        .select("zone_type")
        .limit(1);

      if (zones && zones.length > 0) {
        const testZone = zones[0].zone_type;

        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("zone_type", testZone);

        expect(error).toBeNull();
        if (data && data.length > 0) {
          data.forEach((business) => {
            expect(business.zone_type).toBe(testZone);
          });
        }
      }
    });
  });

  describe("GET Business by ID", () => {
    let testBusinessId;

    beforeAll(async () => {
      // Get a valid business ID for testing
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .limit(1)
        .single();

      if (data) {
        testBusinessId = data.id;
      }
    });

    it("should fetch a single business by ID", async () => {
      if (!testBusinessId) {
        console.log("Skipping: No businesses in database");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", testBusinessId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(testBusinessId);
    });

    it("should return error for non-existent ID", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", 999999999)
        .single();

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });
  });

  describe("Business Data Validation", () => {
    it("should validate required fields for creation", () => {
      const validateBusiness = (data) => {
        const errors = [];
        const requiredFields = [
          "business_name",
          "category",
          "latitude",
          "longitude",
          "street",
          "zone_type",
        ];

        requiredFields.forEach((field) => {
          if (!data[field]) {
            errors.push(`Missing required field: ${field}`);
          }
        });

        return errors;
      };

      const invalidBusiness = {};
      const errors = validateBusiness(invalidBusiness);
      expect(errors.length).toBe(6);

      const validBusiness = {
        business_name: "Test Shop",
        category: "Retail",
        latitude: 14.5995,
        longitude: 120.9842,
        street: "Test Street",
        zone_type: "Commercial",
      };
      expect(validateBusiness(validBusiness).length).toBe(0);
    });

    it("should validate coordinate ranges", () => {
      const validateCoordinates = (lat, lng) => {
        const errors = [];
        
        if (typeof lat !== "number" || isNaN(lat)) {
          errors.push("Invalid latitude");
        } else if (lat < -90 || lat > 90) {
          errors.push("Latitude must be between -90 and 90");
        }

        if (typeof lng !== "number" || isNaN(lng)) {
          errors.push("Invalid longitude");
        } else if (lng < -180 || lng > 180) {
          errors.push("Longitude must be between -180 and 180");
        }

        return errors;
      };

      expect(validateCoordinates(14.5995, 120.9842).length).toBe(0);
      expect(validateCoordinates(200, 120)).toContain("Latitude must be between -90 and 90");
      expect(validateCoordinates(14, 200)).toContain("Longitude must be between -180 and 180");
      expect(validateCoordinates("invalid", 120)).toContain("Invalid latitude");
    });
  });

  describe("Business Categories", () => {
    it("should get unique categories from database", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("general_category");

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const categories = [...new Set(data.map((b) => b.general_category))];
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
      }
    });

    it("should get unique zone types from database", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("zone_type");

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const zoneTypes = [...new Set(data.map((b) => b.zone_type))];
        expect(Array.isArray(zoneTypes)).toBe(true);
      }
    });
  });

  describe("Business Statistics", () => {
    it("should calculate business count by category", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("general_category");

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const categoryCount = {};
        data.forEach((b) => {
          categoryCount[b.general_category] = (categoryCount[b.general_category] || 0) + 1;
        });

        expect(Object.keys(categoryCount).length).toBeGreaterThan(0);
      }
    });

    it("should calculate total business count", async () => {
      const { count, error } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });

      expect(error).toBeNull();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
