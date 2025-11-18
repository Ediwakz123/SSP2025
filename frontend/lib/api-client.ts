const BASE_URL = import.meta.env.VITE_API_URL || "";

// ⬆️ Change this to your real backend URL

async function request(method: string, endpoint: string, token?: string, body?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
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

/* ------------------ ACTIVITY LOGS ------------------ */

export function getActivityLogs(token: string) {
  return request("GET", "/api/logs", token);
}

/* ------------------ ADMIN PORTAL STATS ------------------ */

export function getAdminStats(token: string) {
  return request("GET", "/api/admin/stats", token);
}

export function getAllUsers(token: string) {
  return request("GET", "/api/admin/users", token);
}

export function getAllAnalyses(token: string) {
  return request("GET", "/api/analyses", token);
}

/* ------------------ SEED DATA STATS ------------------ */

export function getSeedDataStats() {
  return request("GET", "/api/seed/stats");
}

/* ------------------ SEED DATA CRUD ------------------ */

export function getSeedData(token: string) {
  return request("GET", "/api/seed", token);
}

export function createSeedBusiness(body: any, token: string) {
  return request("POST", "/api/seed", token, body);
}

export function updateSeedBusiness(id: number, body: any, token: string) {
  return request("PUT", `/api/seed/${id}`, token, body);
}

export function deleteSeedBusiness(id: number, token: string) {
  return request("DELETE", `/api/seed/${id}`, token);
}

export function resetSeedData(token: string) {
  return request("POST", `/api/seed/reset`, token);
}
