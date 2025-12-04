/**
 * Rate Limiting Configuration
 * Protects API endpoints from abuse
 */

import rateLimit from 'express-rate-limit';
import logger from './logger.js';

/**
 * Default rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes',
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per 15 minutes (prevents brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes',
  },
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email?.substring(0, 3) + '***', // Log partial email for debugging
    });
    res.status(429).json(options.message);
  },
});

/**
 * AI endpoint rate limiter
 * 20 requests per minute (prevents API cost abuse)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI rate limit exceeded',
    message: 'Too many AI requests. Please wait a moment before trying again.',
    retryAfter: '1 minute',
  },
  handler: (req, res, next, options) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json(options.message);
  },
});

/**
 * Very strict limiter for sensitive operations
 * 5 requests per hour (password reset, etc.)
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests for this sensitive operation. Please try again later.',
    retryAfter: '1 hour',
  },
  handler: (req, res, next, options) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json(options.message);
  },
});

export default {
  apiLimiter,
  authLimiter,
  aiLimiter,
  strictLimiter,
};
