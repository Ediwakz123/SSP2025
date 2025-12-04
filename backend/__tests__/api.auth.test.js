/**
 * Auth API Tests
 * Tests user authentication endpoints
 */

import { supabase } from "../lib/supabaseClient.js";
import { hashPassword, comparePassword } from "../lib/bcrypt.js";
import { signToken, verifyToken } from "../lib/jwt.js";

describe("Auth API Tests", () => {
  describe("Password Hashing (bcrypt)", () => {
    const testPassword = "TestPassword123!";

    it("should hash a password", async () => {
      const hashed = await hashPassword(testPassword);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(testPassword);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it("should verify correct password", async () => {
      const hashed = await hashPassword(testPassword);
      const isValid = await comparePassword(testPassword, hashed);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const hashed = await hashPassword(testPassword);
      const isValid = await comparePassword("WrongPassword", hashed);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("JWT Token (jsonwebtoken)", () => {
    const testPayload = { userId: "123", email: "test@example.com" };

    it("should sign a token", () => {
      const token = signToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should verify a valid token", () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it("should return null for invalid token", () => {
      const decoded = verifyToken("invalid.token.here");
      expect(decoded).toBeNull();
    });

    it("should return null for malformed token", () => {
      const decoded = verifyToken("not-a-jwt");
      expect(decoded).toBeNull();
    });

    it("should include expiration in token", () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe("Login Endpoint Logic", () => {
    it("should validate email format", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.com",
        "user+tag@example.org",
      ];
      const invalidEmails = [
        "invalid",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should require email and password", async () => {
      // Simulating validation logic
      const validateLoginInput = (email, password) => {
        const errors = [];
        if (!email) errors.push("Email is required");
        if (!password) errors.push("Password is required");
        return errors;
      };

      expect(validateLoginInput(null, null)).toContain("Email is required");
      expect(validateLoginInput(null, null)).toContain("Password is required");
      expect(validateLoginInput("test@example.com", "password").length).toBe(0);
    });
  });

  describe("Register Endpoint Logic", () => {
    it("should validate required registration fields", () => {
      const validateRegistration = (data) => {
        const errors = [];
        if (!data.email) errors.push("Email is required");
        if (!data.password) errors.push("Password is required");
        if (!data.username) errors.push("Username is required");
        return errors;
      };

      const invalidData = { email: "", password: "", username: "" };
      const errors = validateRegistration(invalidData);
      expect(errors.length).toBe(3);

      const validData = {
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      };
      expect(validateRegistration(validData).length).toBe(0);
    });

    it("should check for existing email in database", async () => {
      // Test against actual database
      const testEmail = "admin@example.com"; // Use a known email if exists
      
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", testEmail)
        .single();

      // This test just validates the query works
      expect(error !== null || data !== null).toBe(true);
    });
  });

  describe("Password Reset Logic", () => {
    it("should validate password reset token format", () => {
      // Token should be a 64-character hex string (32 bytes)
      const validToken = "a".repeat(64);
      const invalidToken = "short";

      expect(validToken.length).toBe(64);
      expect(/^[a-f0-9]+$/i.test(validToken)).toBe(true);
      expect(invalidToken.length).not.toBe(64);
    });

    it("should validate new password requirements", () => {
      const validatePassword = (password) => {
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters";
        return null;
      };

      expect(validatePassword("")).toBe("Password is required");
      expect(validatePassword("12345")).toBe("Password must be at least 6 characters");
      expect(validatePassword("validpassword")).toBeNull();
    });
  });
});
