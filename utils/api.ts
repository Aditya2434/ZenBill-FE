// Use empty string for production (same server) or localhost for development
export const BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? "http://localhost:8080" : "");

type RequestOptions = RequestInit & { json?: any };

async function request(path: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Cookie-based authentication: include credentials to send cookies automatically
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // This sends cookies with every request
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
    // Handle structured validation errors from backend
    if (data && data.errors && typeof data.errors === "object") {
      // Map backend field names to user-friendly labels
      const fieldLabelMap: Record<string, string> = {
        billedToName: "Detail of Receiver (Billed To)",
        billedToCode: "State & Code",
        billedToState: "State & Code of Receiver",
        shippedToName: "Detail of Receiver (Shipped To)",
        shippedToCode: "Shipped To State & Code",
        shippedToState: "Shipped To State",
        items: "Invoice Items",
        invoiceNumber: "Tax Invoice No.",
        invoiceDate: "Invoice Date",
        billedToAddress: "Billed To Address",
        shippedToAddress: "Shipped To Address",
        billedToGstin: "Billed To GSTIN",
        shippedToGstin: "Shipped To GSTIN",
        transportMode: "Transport Mode",
        vehicleNo: "Vehicle No.",
        dateOfSupply: "Date of Supply",
        placeOfSupply: "Place of Supply",
        orderNo: "Order No.",
        cgstRate: "CGST Rate",
        sgstRate: "SGST Rate",
        igstRate: "IGST Rate",
        selectedBankName: "Bank Name",
        selectedAccountName: "Account Name",
        selectedAccountNumber: "Account Number",
        selectedIfscCode: "IFSC Code",
        termsAndConditions: "Terms and Conditions",
        ewayBillNo: "E-Way Bill No.",
      };

      const errorMessages = Object.entries(data.errors)
        .map(([field, message]) => {
          const friendlyLabel = fieldLabelMap[field] || field;
          return `${friendlyLabel} ${message}`;
        })
        .join(", ");
      const error = new Error(errorMessages);
      (error as any).validationErrors = data.errors;
      (error as any).originalMessage = data.message;
      throw error;
    }

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

export function apiLogout() {
  return request("/api/v1/auth/logout", { method: "POST" });
}

// Invoices API
export function apiCreateInvoice(payload: any) {
  return request("/api/v1/invoices", { method: "POST", json: payload });
}

export function apiListInvoices() {
  return request("/api/v1/invoices");
}

export function apiGetInvoiceDetails(invoiceId: string | number) {
  return request(
    `/api/v1/invoices/${encodeURIComponent(String(invoiceId))}/details`
  );
}

export function apiUpdateInvoice(invoiceId: string | number, payload: any) {
  return request(`/api/v1/invoices/${encodeURIComponent(String(invoiceId))}`, {
    method: "PUT",
    json: payload,
  });
}

// Company API
export function apiGetCompany() {
  return request("/api/v1/company");
}

export function apiUpdateCompany(payload: any) {
  return request("/api/v1/company", { method: "PUT", json: payload });
}

// Bank Details API
export function apiListBankDetails() {
  return request("/api/v1/bank-details");
}

export function apiCreateBankDetail(payload: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
}) {
  const body = {
    bankName: payload.bankName,
    accountName: payload.accountName,
    accountNumber: payload.accountNumber,
    bankBranch: payload.branch || "",
    ifscCode: payload.ifsc,
  };
  return request("/api/v1/bank-details", { method: "POST", json: body });
}

export function apiUpdateBankDetail(
  bankDetailId: string | number,
  payload: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    branch?: string;
    active?: boolean;
  }
) {
  const body = {
    bankName: payload.bankName,
    accountName: payload.accountName,
    accountNumber: payload.accountNumber,
    bankBranch: payload.branch || "",
    ifscCode: payload.ifsc,
    active: payload.active,
  };
  return request(
    `/api/v1/bank-details/${encodeURIComponent(String(bankDetailId))}`,
    { method: "PUT", json: body }
  );
}

export async function apiDeleteBankDetail(bankDetailId: string | number) {
  // Prefer RESTful path; fallback to body if BE expects no id in path
  try {
    return await request(
      `/api/v1/bank-details/${encodeURIComponent(String(bankDetailId))}`,
      { method: "DELETE" }
    );
  } catch (e) {
    return await request("/api/v1/bank-details", {
      method: "DELETE",
      json: { id: bankDetailId },
    });
  }
}

// Clients API
export function apiListClients() {
  return request("/api/v1/clients");
}

export function apiGetClient(clientId: string | number) {
  return request(`/api/v1/clients/${encodeURIComponent(String(clientId))}`);
}

export function apiCreateClient(payload: {
  name: string;
  address: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
}) {
  const body = {
    clientName: payload.name,
    clientAddress: payload.address,
    gstinNo: payload.gstin || "",
    state: payload.state || "",
    code: payload.stateCode || "",
  };
  return request("/api/v1/clients", { method: "POST", json: body });
}

export function apiUpdateClient(
  clientId: string | number,
  payload: {
    name: string;
    address: string;
    gstin?: string;
    state?: string;
    stateCode?: string;
  }
) {
  const body = {
    clientName: payload.name,
    clientAddress: payload.address,
    gstinNo: payload.gstin || "",
    state: payload.state || "",
    code: payload.stateCode || "",
  };
  return request(`/api/v1/clients/${encodeURIComponent(String(clientId))}`, {
    method: "PUT",
    json: body,
  });
}

export function apiDeleteClient(clientId: string | number) {
  return request(`/api/v1/clients/${encodeURIComponent(String(clientId))}`, {
    method: "DELETE",
  });
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
export async function apiStorageUpload(
  file: File,
  folder: string,
  bucket?: string
) {
  const url = new URL(`${BASE_URL}/api/v1/storage/upload`);
  if (folder) url.searchParams.set("folder", folder);
  if (bucket) url.searchParams.set("bucket", bucket);
  const form = new FormData();
  form.append("file", file);

  // Cookie-based authentication: credentials will be sent automatically
  const res = await fetch(url.toString(), {
    method: "POST",
    body: form,
    credentials: "include", // Send cookies with the request
  });
  const dataText = await res.text();
  let data: any = undefined;
  try {
    data = dataText ? JSON.parse(dataText) : undefined;
  } catch (_) {
    data = dataText;
  }
  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      res.statusText ||
      "Upload failed";
    throw new Error(message);
  }
  // Return the inner payload so callers can access fields like url directly
  return data && data.data ? data.data : data;
}

export function apiStorageSignUrl(payload: {
  bucket?: string;
  path: string;
  expiresIn?: number;
}) {
  return request("/api/v1/storage/sign-url", { method: "POST", json: payload });
}

// Fetch image through backend proxy (for private buckets)
export async function apiStorageGetImage(
  bucket: string,
  path: string
): Promise<string> {
  const url = new URL(`${BASE_URL}/api/v1/storage/image`);
  url.searchParams.set("bucket", bucket);
  url.searchParams.set("path", path);
  const headers: HeadersInit = {};
  try {
    const token = localStorage.getItem("zenbill_auth_token");
    if (token) (headers as any)["Authorization"] = `Bearer ${token}`;
  } catch (_) {}
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error("Failed to fetch image");
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
