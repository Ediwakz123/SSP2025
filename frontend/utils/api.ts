// -------------------------------
// BASIC HELPERS (your originals)
// -------------------------------

export async function apiGet(endpoint: string) {
  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error(`GET ${endpoint} failed`);
  }

  return res.json();
}

export async function apiPost(endpoint: string, body: any) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`POST ${endpoint} failed`);
  }

  return res.json();
}

// -------------------------------
// UNIVERSAL ADVANCED REQUEST
// -------------------------------
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore empty response
  }

  if (!res.ok) {
    throw new Error(
      data?.error || `API error: ${res.status} ${res.statusText}`
    );
  }

  return data;
}
