export const BASE_URL = "http://localhost:8080";

type RequestOptions = RequestInit & { json?: any };

async function request(path: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  try {
    const token = localStorage.getItem("zenbill_auth_token");
    if (token) {
      (headers as any)["Authorization"] = `Bearer ${token}`;
    }
  } catch (_) {}
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

// Invoices API
export function apiCreateInvoice(payload: any) {
  return request("/api/v1/invoices", { method: "POST", json: payload });
}

export function apiListInvoices() {
  return request("/api/v1/invoices");
}

export function apiGetInvoiceDetails(invoiceId: string | number) {
  return request(`/api/v1/invoices/${encodeURIComponent(String(invoiceId))}/details`);
}

export function apiUpdateInvoice(invoiceId: string | number, payload: any) {
  return request(`/api/v1/invoices/${encodeURIComponent(String(invoiceId))}`, {
    method: "PUT",
    json: payload,
  });
}

// Company API
export function apiGetCompany() {
  return request('/api/v1/company');
}

export function apiUpdateCompany(payload: any) {
  return request('/api/v1/company', { method: 'PUT', json: payload });
}

export function apiGetProduct(productId: string) {
  return request(`/api/v1/products/${encodeURIComponent(productId)}`);
}

export function apiUpdateProduct(
  productId: string,
  payload: { productName: string; hsnCode: string; uom: string }
) {
  return request(`/api/v1/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    json: payload,
  });
}

export function apiDeleteProduct(productId: string) {
  return request(`/api/v1/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export function apiListProducts() {
  return request("/api/v1/products");
}

export function apiCreateProduct(payload: {
  productName: string;
  hsnCode: string;
  uom: string;
}) {
  return request("/api/v1/products", { method: "POST", json: payload });
}

// Storage API (Supabase via backend)
export async function apiStorageUpload(file: File, folder: string, bucket?: string) {
  const url = new URL(`${BASE_URL}/api/v1/storage/upload`);
  if (folder) url.searchParams.set('folder', folder);
  if (bucket) url.searchParams.set('bucket', bucket);
  const form = new FormData();
  form.append('file', file);
  const headers: HeadersInit = {};
  try {
    const token = localStorage.getItem("zenbill_auth_token");
    if (token) (headers as any)["Authorization"] = `Bearer ${token}`;
  } catch (_) {}
  const res = await fetch(url.toString(), { method: 'POST', body: form, headers });
  const dataText = await res.text();
  let data: any = undefined;
  try {
    data = dataText ? JSON.parse(dataText) : undefined;
  } catch (_) {
    data = dataText;
  }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || res.statusText || 'Upload failed';
    throw new Error(message);
  }
  // Return the inner payload so callers can access fields like url directly
  return (data && data.data) ? data.data : data;
}

export function apiStorageSignUrl(payload: { bucket?: string; path: string; expiresIn?: number }) {
  return request('/api/v1/storage/sign-url', { method: 'POST', json: payload });
}

// Fetch image through backend proxy (for private buckets)
export async function apiStorageGetImage(bucket: string, path: string): Promise<string> {
  const url = new URL(`${BASE_URL}/api/v1/storage/image`);
  url.searchParams.set('bucket', bucket);
  url.searchParams.set('path', path);
  const headers: HeadersInit = {};
  try {
    const token = localStorage.getItem("zenbill_auth_token");
    if (token) (headers as any)["Authorization"] = `Bearer ${token}`;
  } catch (_) {}
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error('Failed to fetch image');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}