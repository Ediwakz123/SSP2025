// =============================================================================
// API ERROR HANDLING UTILITIES
// Provides consistent error handling across all API calls
// =============================================================================

import { toast } from "sonner";
import { logger } from "./logger";

// -----------------------------------------------------------------------------
// ERROR TYPES
// -----------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static fromResponse(response: Response, data?: Record<string, unknown>): ApiError {
    const message = (data?.error as string) || (data?.message as string) || response.statusText;
    return new ApiError(message, response.status, data?.code as string, data);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network error. Please check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

// -----------------------------------------------------------------------------
// ERROR MESSAGES
// -----------------------------------------------------------------------------

const ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "You are not authorized. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  408: "Request timed out. Please try again.",
  409: "A conflict occurred. The resource may already exist.",
  422: "Invalid data provided. Please check your input.",
  429: "Too many requests. Please wait a moment.",
  500: "Server error. Please try again later.",
  502: "Server is temporarily unavailable.",
  503: "Service is currently unavailable.",
};

export function getErrorMessage(statusCode: number, fallback?: string): string {
  return ERROR_MESSAGES[statusCode] || fallback || "An unexpected error occurred.";
}

// -----------------------------------------------------------------------------
// ERROR HANDLING
// -----------------------------------------------------------------------------

interface HandleErrorOptions {
  showToast?: boolean;
  logError?: boolean;
  rethrow?: boolean;
  context?: string;
}

export function handleApiError(
  error: unknown,
  options: HandleErrorOptions = {}
): string {
  const {
    showToast = true,
    logError = true,
    rethrow = false,
    context = "API Request",
  } = options;

  let message: string;

  if (ApiError.isApiError(error)) {
    message = error.message || getErrorMessage(error.statusCode);
    if (logError) {
      logger.error(`${context} failed`, {
        statusCode: error.statusCode,
        message: error.message,
        code: error.code,
      });
    }
  } else if (error instanceof NetworkError) {
    message = error.message;
    if (logError) {
      logger.error(`${context}: Network error`, error);
    }
  } else if (error instanceof ValidationError) {
    message = error.message;
    if (logError) {
      logger.warn(`${context}: Validation error`, { field: error.field, message: error.message });
    }
  } else if (error instanceof Error) {
    message = error.message || "An unexpected error occurred.";
    if (logError) {
      logger.error(`${context}: Unexpected error`, error);
    }
  } else {
    message = "An unexpected error occurred.";
    if (logError) {
      logger.error(`${context}: Unknown error type`, error);
    }
  }

  if (showToast) {
    toast.error(message);
  }

  if (rethrow) {
    throw error;
  }

  return message;
}

// -----------------------------------------------------------------------------
// FETCH WRAPPER WITH ERROR HANDLING
// -----------------------------------------------------------------------------

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithErrorHandling<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let data: Record<string, unknown> | null = null;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        // Response body is not valid JSON
      }
    }

    // Handle error responses
    if (!response.ok) {
      throw ApiError.fromResponse(response, data ?? undefined);
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError();
    }

    throw error;
  }
}

// -----------------------------------------------------------------------------
// RETRY LOGIC
// -----------------------------------------------------------------------------

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryOn?: number[];
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions & RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503],
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithErrorHandling<T>(url, fetchOptions);
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry =
        attempt < maxRetries &&
        ApiError.isApiError(error) &&
        retryOn.includes(error.statusCode);

      if (shouldRetry) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        logger.warn(`Retrying request to ${url} after ${delay}ms (attempt ${attempt + 1})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
}
