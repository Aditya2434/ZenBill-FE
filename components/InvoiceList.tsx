import React, { useEffect, useState, lazy } from "react";
import { Invoice, InvoiceStatus, CompanyProfile } from "../types";
import { View } from "../App";
import { PlusIcon, DownloadIcon, TrashIcon } from "./icons";
import { Toast, ToastType } from "./Toast";
import {
  apiListInvoices,
  apiGetInvoiceDetails,
  apiListBankDetails,
  apiMarkInvoicePaid,
  BASE_URL,
} from "../utils/api";

// ── Heavy PDF deps: lazy-loaded only when user actually clicks Download ───────
let _pdfLib: any = null;
let _DummyPDF: any = null;

async function getPdfDeps() {
  if (!_pdfLib || !_DummyPDF) {
    const [pdfMod, dummyMod] = await Promise.all([
      import("@react-pdf/renderer"),
      import("./DummyPDF"),
    ]);
    _pdfLib = pdfMod;
    _DummyPDF = dummyMod.default;
  }
  return { pdf: _pdfLib.pdf, DummyPDF: _DummyPDF };
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_KEY    = "zenbill_cached_invoices";
const CACHE_AT_KEY = "zenbill_cached_invoices_at";
const STALE_MS     = 60_000; // 60 seconds

function readCache(): any[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const at  = Number(localStorage.getItem(CACHE_AT_KEY) || 0);
    if (raw && Date.now() - at < STALE_MS) return JSON.parse(raw);
  } catch {}
  return null;
}

function writeCache(list: any[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    localStorage.setItem(CACHE_AT_KEY, String(Date.now()));
  } catch {}
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RowData {
  id: number | string;
  invoiceNumber: string;
  invoiceDate: string;
  billedToName: string;
  totalAmountAfterTax: number;
  pdfUrl?: string;
  status: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  setView: (view: View) => void;
  profile: CompanyProfile;
  onViewDetails?: (invoiceId: string | number) => void;
}

const calculateInvoiceTotals = (invoice: Invoice) => {
  const subtotal    = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cgstAmount  = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount  = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount  = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax    = cgstAmount + sgstAmount + igstAmount;
  return { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total: subtotal + totalTax };
};

// ── Skeleton row (shown while loading) ────────────────────────────────────────
const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
    {[200, 160, 100, 100, 80, 100].map((w, i) => (
      <td key={i} style={{ padding: "14px 20px" }}>
        <div style={{
          height: 12, borderRadius: 6,
          width: w,
          background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite linear",
          animationDelay: `${i * 80}ms`,
        }} />
      </td>
    ))}
  </tr>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const lower = status.trim().toLowerCase();
  const styles: Record<string, React.CSSProperties> = {
    paid:    { background: "rgba(16,185,129,0.1)",  color: "#059669", border: "1px solid rgba(16,185,129,0.25)" },
    unpaid:  { background: "rgba(245,158,11,0.1)",  color: "#d97706", border: "1px solid rgba(245,158,11,0.25)" },
    overdue: { background: "rgba(244,63,94,0.1)",   color: "#e11d48", border: "1px solid rgba(244,63,94,0.25)" },
    draft:   { background: "rgba(148,163,184,0.1)", color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" },
  };
  const s = styles[lower] || styles.draft;
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <span style={{
      ...s,
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 99,
      letterSpacing: "0.03em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      {label}
    </span>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices, onEdit, onDelete, setView, profile, onViewDetails,
}) => {
  // Initialise rows from cache immediately — no spinner on revisit
  const [rows, setRows] = useState<RowData[]>(() => {
    try {
      const cached = readCache();
      if (cached) {
        return cached.map((it: any) => ({
          id: it.id,
          invoiceNumber: String(it.invoiceNumber || ""),
          invoiceDate: String(it.invoiceDate || ""),
          billedToName: String(it.billedToName || ""),
          totalAmountAfterTax: Number(it.totalAmountAfterTax || 0),
          pdfUrl: it.pdfUrl,
          status: it.status || "Unpaid",
        }));
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(rows.length === 0);
  const [error, setError]   = useState("");
  const [toast, setToast]   = useState<{ message: string; type: ToastType; isVisible: boolean }>(
    { message: "", type: "success", isVisible: false }
  );
  const [payConfirmModal, setPayConfirmModal] = useState<{ open: boolean; invoiceId: string | number | null }>(
    { open: false, invoiceId: null }
  );
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

  useEffect(() => {
    let cancelled = false;

    // If cache was fresh, skip the network call entirely
    const cached = readCache();
    if (cached) {
      setIsLoading(false);
      return;
    }

    // No fresh cache → fetch, but only show spinner if rows are empty
    (async () => {
      try {
        setIsLoading(rows.length === 0);
        setError("");
        const body = await apiListInvoices();
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        writeCache(list);
        const mapped: RowData[] = list.map((it: any) => ({
          id: it.id,
          invoiceNumber: String(it.invoiceNumber || ""),
          invoiceDate: String(it.invoiceDate || ""),
          billedToName: String(it.billedToName || ""),
          totalAmountAfterTax: Number(it.totalAmountAfterTax || 0),
          pdfUrl: it.pdfUrl,
          status: it.status || "Unpaid",
        }));
        if (!cancelled) setRows(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load invoices");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Edit handler ─────────────────────────────────────────────────────────────

  const handleEditClick = async (row: { id: number | string; invoiceNumber: string }) => {
    const match = invoices.find(inv => inv.invoiceNumber === row.invoiceNumber);
    if (match) { onEdit(match); return; }
    try {
      const body = await apiGetInvoiceDetails(row.id);
      const d: any = (body && (body as any).data) || body;
      if (!d) return;
      let bankBranch = "";
      try {
        const bankDetailsResponse = await apiListBankDetails();
        const bankDetailsList = Array.isArray(bankDetailsResponse)
          ? bankDetailsResponse
          : Array.isArray((bankDetailsResponse as any)?.data)
          ? (bankDetailsResponse as any).data : [];
        const matchingBank = bankDetailsList.find((bd: any) =>
          (bd.accountName === d.selectedAccountName || bd.account_name === d.selectedAccountName) &&
          (bd.accountNumber === d.selectedAccountNumber || bd.account_number === d.selectedAccountNumber) &&
          (bd.bankName === d.selectedBankName || bd.bank_name === d.selectedBankName)
        );
        if (matchingBank) bankBranch = matchingBank.bankBranch || matchingBank.branch || "";
      } catch { /* non-critical */ }
      const mapped: Invoice = {
        id: String(d.id ?? row.id),
        invoiceNumber: String(d.invoiceNumber || row.invoiceNumber || ""),
        client: { id: "", name: String(d.billedToName || ""), email: "", address: String(d.billedToAddress || ""), gstin: d.billedToGstin || "", state: d.billedToState || "", stateCode: d.billedToCode || "" },
        shippingDetails: { name: String(d.shippedToName || ""), address: String(d.shippedToAddress || ""), gstin: d.shippedToGstin || "", state: d.shippedToState || "", stateCode: d.shippedToCode || "" },
        items: (Array.isArray(d.items) ? d.items : []).map((it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          description: String(it.description || ""),
          hsnCode: it.hsnCode || "", uom: it.uom || "",
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.rate) || 0,
        })),
        issueDate: String(d.invoiceDate || ""),
        dueDate: String(d.invoiceDate || ""),
        status: InvoiceStatus.Draft,
        transportMode: d.transportMode || "", vehicleNo: d.vehicleNo || "",
        dateOfSupply: d.dateOfSupply || "", placeOfSupply: d.placeOfSupply || "",
        orderNo: d.orderNumber || "",
        taxPayableOnReverseCharge: Boolean(d.taxOnReverseCharge) || false,
        cgstRate: Number(d.cgstRate) || 0, sgstRate: Number(d.sgstRate) || 0, igstRate: Number(d.igstRate) || 0,
        grLrNo: d.grLrNo || "", deliveryNote: d.deliveryNote || "", eWayBillNo: d.ewayBillNo || "",
        bankDetails: { accountName: d.selectedAccountName || "", accountNumber: d.selectedAccountNumber || "", bankName: d.selectedBankName || "", branch: bankBranch, ifsc: d.selectedIfscCode || "" },
        termsAndConditions: d.termsAndConditions || "",
        jurisdiction: "",
      };
      onEdit(mapped);
    } catch { if (onViewDetails) onViewDetails(row.id); }
  };

  // ── Download handler — PDF libs loaded lazily on first click ─────────────────

  const handleDownloadRow = async (row: RowData) => {
    const invoiceNum   = row.invoiceNumber.replace(/\//g, "-");
    const date         = new Date(row.invoiceDate || Date.now());
    const dateStr      = `${String(date.getDate()).padStart(2,"0")}-${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}`;
    const billedToName = (row.billedToName || "").replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const fileName     = `${invoiceNum}-${dateStr}-${billedToName}.pdf`;

    setDownloadingId(row.id);
    try {
      if (row.pdfUrl) {
        let absoluteUrl = row.pdfUrl;
        if (row.pdfUrl.startsWith("/api/")) absoluteUrl = BASE_URL + row.pdfUrl;
        const response = await fetch(absoluteUrl, { credentials: "include" });
        if (response.ok) {
          const blob = await response.blob();
          const url  = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url; link.download = fileName; link.click();
          URL.revokeObjectURL(url);
          return;
        }
      }
      // Fall back to generating PDF client-side (lazy-loaded)
      const match = invoices.find(inv => inv.invoiceNumber === row.invoiceNumber);
      if (match) await handleDownload(match, fileName);
    } catch (err) {
      console.error("Download error", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = async (invoice: Invoice, fileName?: string) => {
    try {
      const { pdf, DummyPDF } = await getPdfDeps(); // lazy load only now
      const blob = await pdf(<DummyPDF invoice={invoice} profile={profile} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      if (!fileName) {
        const invoiceNum = invoice.invoiceNumber.replace(/\//g, "-");
        const date       = new Date(invoice.issueDate || Date.now());
        const dateStr    = `${String(date.getDate()).padStart(2,"0")}-${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}`;
        const name       = (invoice.client?.name || "").replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        fileName = `${invoiceNum}-${dateStr}-${name}.pdf`;
      }
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error("Error generating PDF", err); }
  };

  // ── Mark as Paid ──────────────────────────────────────────────────────────────

  const confirmMarkPaid = async () => {
    if (!payConfirmModal.invoiceId) return;
    try {
      const res = await apiMarkInvoicePaid(payConfirmModal.invoiceId);
      if (res && res.status) {
        setRows(rows.map(r => r.id === payConfirmModal.invoiceId ? { ...r, status: "Paid" } : r));
        showToast("Payment recorded successfully!", "success");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to record payment.", "error");
    } finally {
      setPayConfirmModal({ open: false, invoiceId: null });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid rgba(99,102,241,0.08)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(99,102,241,0.06)",
      overflow: "hidden",
    }}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} duration={3000} />

      {/* Header */}
      <div style={{
        padding: "20px 24px 18px",
        borderBottom: "1px solid rgba(99,102,241,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Invoices</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0", fontWeight: 400 }}>Manage and track your billing</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setView("templates" as any)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", fontSize: 13, fontWeight: 600,
              color: "#6366f1",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 11, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(99,102,241,0.14)"; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(99,102,241,0.08)"; el.style.transform = "translateY(0)"; }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Templates
          </button>
          <button
            onClick={() => setView("create-invoice")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", fontSize: 13, fontWeight: 700,
              color: "white",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 11, cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px) scale(1.02)"; el.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0) scale(1)"; el.style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)"; }}
          >
            <PlusIcon style={{ width: 15, height: 15 }} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: "12px 24px 0",
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(244,63,94,0.06)",
          border: "1px solid rgba(244,63,94,0.2)",
          color: "#e11d48",
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
              {["Invoice #", "Client", "Date", "Amount", "Status", "Actions"].map((h, i) => (
                <th key={h} style={{
                  padding: "11px 20px",
                  textAlign: i === 4 ? "center" : i === 5 ? "right" : "left",
                  fontSize: 11, fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  background: "rgba(248,250,252,0.8)",
                  whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Skeleton rows while loading */}
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {/* Empty state */}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "60px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#94a3b8" }}>
                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: 0 }}>No invoices yet</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Create your first invoice to get started.</p>
                    <button
                      onClick={() => setView("create-invoice")}
                      style={{
                        marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "white",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        border: "none", borderRadius: 10, cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                      }}
                    >
                      <PlusIcon style={{ width: 14, height: 14 }} />
                      Create Invoice
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {rows.map((r) => {
              const isPaid = r.status?.trim().toLowerCase() === "paid";
              const isDownloading = downloadingId === r.id;
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid rgba(99,102,241,0.05)", transition: "background 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.025)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "13px 20px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>
                    {r.invoiceNumber}
                  </td>
                  <td style={{ padding: "13px 20px", color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.billedToName}
                  </td>
                  <td style={{ padding: "13px 20px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {r.invoiceDate}
                  </td>
                  <td style={{ padding: "13px 20px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                    ₹{r.totalAmountAfterTax.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "13px 20px", textAlign: "center" }}>
                    {isPaid ? (
                      <StatusBadge status="Paid" />
                    ) : (
                      <button
                        onClick={() => setPayConfirmModal({ open: true, invoiceId: r.id })}
                        style={{
                          padding: "4px 12px", fontSize: 11, fontWeight: 700,
                          color: "#d97706",
                          background: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.25)",
                          borderRadius: 99, cursor: "pointer",
                          transition: "all 0.18s",
                        }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(245,158,11,0.18)"; el.style.borderColor = "rgba(245,158,11,0.4)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(245,158,11,0.1)"; el.style.borderColor = "rgba(245,158,11,0.25)"; }}
                        title="Click to mark as paid"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "13px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {/* Download */}
                      <button
                        onClick={() => handleDownloadRow(r)}
                        title="Download PDF"
                        disabled={isDownloading}
                        style={{
                          padding: "5px 8px", borderRadius: 8,
                          background: isDownloading ? "rgba(99,102,241,0.1)" : "transparent",
                          border: "1px solid transparent",
                          cursor: isDownloading ? "not-allowed" : "pointer",
                          color: "#6366f1", transition: "all 0.18s",
                          display: "inline-flex", alignItems: "center",
                          opacity: isDownloading ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { if (!isDownloading) { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(99,102,241,0.08)"; el.style.borderColor = "rgba(99,102,241,0.2)"; } }}
                        onMouseLeave={e => { if (!isDownloading) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "transparent"; } }}
                      >
                        {isDownloading
                          ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", animation: "spin 0.7s linear infinite" }} />
                          : <DownloadIcon style={{ width: 15, height: 15 }} />
                        }
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => handleEditClick(r)}
                        style={{
                          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          color: "#6366f1",
                          background: "rgba(99,102,241,0.07)",
                          border: "1px solid rgba(99,102,241,0.15)",
                          cursor: "pointer", transition: "all 0.18s",
                        }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#6366f1"; el.style.color = "white"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(99,102,241,0.07)"; el.style.color = "#6366f1"; }}
                      >
                        Edit
                      </button>
                      {/* View */}
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(r.id)}
                          style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            color: "#475569",
                            background: "rgba(100,116,139,0.07)",
                            border: "1px solid rgba(100,116,139,0.15)",
                            cursor: "pointer", transition: "all 0.18s",
                          }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(100,116,139,0.14)"; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(100,116,139,0.07)"; }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Confirm Payment Modal ── */}
      {payConfirmModal.open && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 60, padding: 16,
        }}>
          <div style={{
            background: "white", borderRadius: 20,
            padding: 28, maxWidth: 360, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            border: "1px solid rgba(99,102,241,0.1)",
            animation: "fadeInUp 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{
              width: 48, height: 48,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#10b981">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-display" style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 8px" }}>
              Confirm Payment
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
              Are you sure you want to mark this invoice as paid? This will update your revenue records.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPayConfirmModal({ open: false, invoiceId: null })}
                style={{
                  flex: 1, padding: "10px", fontSize: 13, fontWeight: 600,
                  color: "#475569", background: "white",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 12, cursor: "pointer",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkPaid}
                style={{
                  flex: 1, padding: "10px", fontSize: 13, fontWeight: 700,
                  color: "white",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none", borderRadius: 12, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 8px 20px rgba(16,185,129,0.45)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 4px 14px rgba(16,185,129,0.4)"; }}
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};