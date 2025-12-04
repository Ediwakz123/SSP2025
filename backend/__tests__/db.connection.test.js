/**
 * Database Connection Tests
 * Tests Supabase connectivity and basic CRUD operations
 */

import { supabase } from "../lib/supabaseClient.js";

describe("Database Connection", () => {
  describe("Supabase Client", () => {
    it("should have supabase client initialized", () => {
      expect(supabase).toBeDefined();
    });

    it("should have required environment variables", () => {
      expect(process.env.SUPABASE_URL).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    });
  });

  describe("Users Table", () => {
it("should connect to users table", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("uid, email")
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch user count", async () => {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      expect(error).toBeNull();
      expect(typeof count).toBe("number");
    });
  });

  describe("Businesses Table", () => {
    it("should connect to businesses table", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id")
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch business count", async () => {
      const { count, error } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });

      expect(error).toBeNull();
      expect(typeof count).toBe("number");
    });

    it("should fetch businesses with required fields", async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("business_id, business_name, general_category, latitude, longitude")
        .limit(5);

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
  });

  describe("Activity Logs Table", () => {
    it("should connect to activity_logs table", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id")
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("Clustering Results Table", () => {
    it("should connect to clustering_results table", async () => {
      const { data, error } = await supabase
        .from("clustering_results")
        .select("id")
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("Business Raw Table", () => {
    it("should connect to business_raw table", async () => {
      const { data, error } = await supabase
        .from("business_raw")
        .select("business_id")
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
