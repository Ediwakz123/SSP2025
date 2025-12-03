/* ============================================================
   BASE URLS
============================================================ */
const API_URL = import.meta.env.VITE_API_URL || "";
const EDGE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTION_URL + "/make-server-c9aabe87";

/* ============================================================
   UNIVERSAL REQUEST HELPER
============================================================ */
async function request(method: string, url: string, token?: string, body?: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || `API error: ${res.status}`);
  }

  return data;
}

/* ============================================================
   LEGACY BACKEND ROUTES (your original)
============================================================ */

export function getActivityLogs(token: string) {
  return request("GET", `${API_URL}/api/logs`, token);
}

export function getAdminStats(token: string) {
  return request("GET", `${API_URL}/api/admin/stats`, token);
}

export function getAllUsers(token: string) {
  return request("GET", `${API_URL}/api/admin/users`, token);
}

export function getAllAnalyses(token: string) {
  return request("GET", `${API_URL}/api/analyses`, token);
}

export function getSeedDataStats() {
  return request("GET", `${API_URL}/api/seed/stats`);
}

export function getSeedData(token: string) {
  return request("GET", `${API_URL}/api/seed`, token);
}

export function createSeedBusiness(body: any, token: string) {
  return request("POST", `${API_URL}/api/seed`, token, body);
}

export function updateSeedBusiness(id: number, body: any, token: string) {
  return request("PUT", `${API_URL}/api/seed/${id}`, token, body);
}

export function deleteSeedBusiness(id: number, token: string) {
  return request("DELETE", `${API_URL}/api/seed/${id}`, token);
}

export function resetSeedData(token: string) {
  return request("POST", `${API_URL}/api/seed/reset`, token);
}

/* ============================================================
   SUPABASE EDGE FUNCTIONS (RAW BUSINESS PIPELINE)
============================================================ */

// GET all raw businesses
export function getRawBusinesses(token: string) {
  return request("GET", `${EDGE_URL}/raw`, token);
}

// INSERT new raw business
export function createRawBusiness(body: any, token: string) {
  return request("POST", `${EDGE_URL}/raw`, token, body);
}

// UPDATE single raw business
export function updateRawBusiness(id: string, body: any, token: string) {
  return request("PUT", `${EDGE_URL}/raw/${id}`, token, body);
}

// DELETE single raw business
export function deleteRawBusiness(id: string, token: string) {
  return request("DELETE", `${EDGE_URL}/raw/${id}`, token);
}

// DELETE all businesses (truncate)
export function resetRawBusinesses(token: string) {
  return request("DELETE", `${EDGE_URL}/raw`, token);
}

// Trigger ML TRAIN
export function trainModel(token: string) {
  return request("POST", `${EDGE_URL}/train`, token);
}
