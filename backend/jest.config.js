/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js", "**/__tests__/**/*.test.mjs"],
  moduleFileExtensions: ["js", "mjs", "json"],
  transform: {},
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    "api/**/*.js",
    "lib/**/*.js",
    "services/**/*.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ["./__tests__/setup.js"],
};
