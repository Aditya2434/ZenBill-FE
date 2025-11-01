export const BASE_URL = (import.meta as any)?.env?.VITE_API_BASE || "";

type RequestOptions = RequestInit & { json?: any };

async function request(path: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
    body:
      options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });
  const text = await res.text();
  let data: any = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch (_) {
    data = text;
  }
  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      res.statusText ||
      "Request failed";
    throw new Error(message);
  }
  return data;
}

export function apiRegister(payload: {
  email: string;
  password: string;
  companyName: string;
  state: string;
  code: string;
}) {
  return request("/api/v1/auth/register", { method: "POST", json: payload });
}

export function apiLogin(payload: { email: string; password: string }) {
  return request("/api/v1/auth/login", { method: "POST", json: payload });
}
