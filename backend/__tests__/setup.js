import * as dotenv from "dotenv";
import { jest } from "@jest/globals";

// Load environment variables before tests
dotenv.config();

// Global test utilities
globalThis.testUtils = {
  // Helper to create mock request object
  createMockRequest: (overrides = {}) => ({
    method: "GET",
    headers: {},
    body: {},
    query: {},
    ...overrides,
  }),

  // Helper to create mock response object
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to wait for async operations
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Suppress console output during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
