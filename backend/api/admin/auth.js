import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Verifies admin authorization from request header
 * @param {object} req - Request object
 * @param {object} res - Response object  
 * @returns {object|null} - Decoded token or null if unauthorized
 */
export function verifyAdmin(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return null;
    }

    return decoded;
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}
