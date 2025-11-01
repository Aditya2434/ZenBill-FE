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
