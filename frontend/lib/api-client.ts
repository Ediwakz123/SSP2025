/* ============================================================
   API CLIENT - Type-safe API calls with error handling
============================================================ */

import { getApiUrl, getEdgeFunctionUrl } from "./env";
import { ApiError, NetworkError } from "../utils/errorHandler";
import { logger } from "../utils/logger";
import type { 
  Business, 
  ActivityLog, 
  AdminStats, 
  ApiResponse 
} from "../types";

/* ============================================================
   BASE URLS
============================================================ */
const getApiBaseUrl = (): string => getApiUrl() || "";
const getEdgeBaseUrl = (): string => {
  const url = getEdgeFunctionUrl();
  return url ? `${url}/make-server-c9aabe87` : "";
};

/* ============================================================
   HTTP METHODS TYPE
============================================================ */
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/* ============================================================
   REQUEST OPTIONS
============================================================ */
interface RequestOptions<TBody = unknown> {
  timeout?: number;
  body?: TBody;
}

/* ============================================================
   UNIVERSAL REQUEST HELPER
============================================================ */
async function request<TResponse, TBody = unknown>(
  method: HttpMethod,
  url: string,
  token?: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { timeout = 30000, body } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    logger.debug(`${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data: TResponse | null = null;
    
    try {
      data = await res.json();
    } catch {
      // Response body is not valid JSON
    }

    if (!res.ok) {
      const errorData = data as unknown as Record<string, unknown>;
      const errorMessage = (errorData?.error as string) || `API error: ${res.status}`;
      logger.error(`API Error: ${method} ${url}`, { status: res.status, error: errorMessage });
      throw new ApiError(errorMessage, res.status);
    }

    return data as TResponse;
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

/* ============================================================
   TYPED API FUNCTIONS - ACTIVITY LOGS
============================================================ */

export function getActivityLogs(token: string): Promise<ActivityLog[]> {
  return request<ActivityLog[]>("GET", `${getApiBaseUrl()}/api/logs`, token);
}

/* ============================================================
   TYPED API FUNCTIONS - ADMIN
============================================================ */

export function getAdminStats(token: string): Promise<ApiResponse<AdminStats>> {
  return request<ApiResponse<AdminStats>>("GET", `${getApiBaseUrl()}/api/admin/stats`, token);
}

export function getAllUsers(token: string): Promise<unknown[]> {
  return request<unknown[]>("GET", `${getApiBaseUrl()}/api/admin/users`, token);
}

export function getAllAnalyses(token: string): Promise<unknown[]> {
  return request<unknown[]>("GET", `${getApiBaseUrl()}/api/analyses`, token);
}

/* ============================================================
   TYPED API FUNCTIONS - SEED DATA
============================================================ */

interface SeedDataStats {
  count: number;
  categories: string[];
  zones: string[];
}

export function getSeedDataStats(): Promise<SeedDataStats> {
  return request<SeedDataStats>("GET", `${getApiBaseUrl()}/api/seed/stats`);
}

export function getSeedData(token: string): Promise<Business[]> {
  return request<Business[]>("GET", `${getApiBaseUrl()}/api/seed`, token);
}

export function createSeedBusiness(
  body: Partial<Business>,
  token: string
): Promise<Business> {
  return request<Business, Partial<Business>>(
    "POST",
    `${getApiBaseUrl()}/api/seed`,
    token,
    { body }
  );
}

export function updateSeedBusiness(
  id: number,
  body: Partial<Business>,
  token: string
): Promise<Business> {
  return request<Business, Partial<Business>>(
    "PUT",
    `${getApiBaseUrl()}/api/seed/${id}`,
    token,
    { body }
  );
}

export function deleteSeedBusiness(
  id: number,
  token: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    "DELETE",
    `${getApiBaseUrl()}/api/seed/${id}`,
    token
  );
}

export function resetSeedData(token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    "POST",
    `${getApiBaseUrl()}/api/seed/reset`,
    token
  );
}

/* ============================================================
   SUPABASE EDGE FUNCTIONS (RAW BUSINESS PIPELINE)
============================================================ */

// GET all raw businesses
export function getRawBusinesses(token: string): Promise<Business[]> {
  return request<Business[]>("GET", `${getEdgeBaseUrl()}/raw`, token);
}

// INSERT new raw business
export function createRawBusiness(
  body: Partial<Business>,
  token: string
): Promise<Business> {
  return request<Business, Partial<Business>>(
    "POST",
    `${getEdgeBaseUrl()}/raw`,
    token,
    { body }
  );
}

// UPDATE single raw business
export function updateRawBusiness(
  id: string,
  body: Partial<Business>,
  token: string
): Promise<Business> {
  return request<Business, Partial<Business>>(
    "PUT",
    `${getEdgeBaseUrl()}/raw/${id}`,
    token,
    { body }
  );
}

// DELETE single raw business
export function deleteRawBusiness(
  id: string,
  token: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    "DELETE",
    `${getEdgeBaseUrl()}/raw/${id}`,
    token
  );
}

// DELETE all businesses (truncate)
export function resetRawBusinesses(
  token: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("DELETE", `${getEdgeBaseUrl()}/raw`, token);
}

// Trigger ML TRAIN
export function trainModel(token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("POST", `${getEdgeBaseUrl()}/train`, token);
}
