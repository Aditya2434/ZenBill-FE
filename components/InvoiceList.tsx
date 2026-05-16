import React, { useEffect, useState } from "react";
import { Invoice, InvoiceStatus, CompanyProfile } from "../types";
import { View } from "../App";
import { PlusIcon, DownloadIcon, TrashIcon } from "./icons";
import DummyPDF from "./DummyPDF";
import { pdf } from "@react-pdf/renderer";
import {
  apiListInvoices,
  apiGetInvoiceDetails,
  apiListBankDetails,
  BASE_URL,
} from "../utils/api";

// html2canvas/jsPDF removed in favor of @react-pdf/renderer

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  setView: (view: View) => void;
  profile: CompanyProfile;
  onViewDetails?: (invoiceId: string | number) => void;
}

const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const baseClasses =
    "px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center";
  const statusClasses = {
    [InvoiceStatus.Paid]: "bg-green-100 text-green-800",
    [InvoiceStatus.Unpaid]: "bg-yellow-100 text-yellow-800",
    [InvoiceStatus.Overdue]: "bg-red-100 text-red-800",
    [InvoiceStatus.Draft]: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>
  );
};

// FIX: Added a helper function to calculate all invoice totals needed by InvoicePreview.
const calculateInvoiceTotals = (invoice: Invoice) => {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;
  return { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total };
};

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onEdit,
  onDelete,
  setView,
  profile,
  onViewDetails,
}) => {
  const [rows, setRows] = useState<
    Array<{
      id: number | string;
      invoiceNumber: string;
      invoiceDate: string;
      billedToName: string;
      totalAmountAfterTax: number;
      pdfUrl?: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const body = await apiListInvoices();
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
          ? body.data
          : [];
        const mapped = list.map((it: any) => ({
          id: it.id,
          invoiceNumber: String(it.invoiceNumber || ""),
          invoiceDate: String(it.invoiceDate || ""),
          billedToName: String(it.billedToName || ""),
          totalAmountAfterTax: Number(it.totalAmountAfterTax || 0),
          pdfUrl: it.pdfUrl,
        }));
        if (!cancelled) setRows(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load invoices");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEditClick = async (row: {
    id: number | string;
    invoiceNumber: string;
  }) => {
    const match = invoices.find(
      (inv) => inv.invoiceNumber === row.invoiceNumber
    );
    if (match) {
      onEdit(match);
      return;
    }
    // Fallback: fetch details from backend and map to local Invoice shape
    try {
      const body = await apiGetInvoiceDetails(row.id);
      const d: any = (body && (body as any).data) || body;
      if (!d) return;
      // Fetch bank details to get the branch information
      let bankBranch = "";
      try {
        const bankDetailsResponse = await apiListBankDetails();
        const bankDetailsList = Array.isArray(bankDetailsResponse)
          ? bankDetailsResponse
          : Array.isArray((bankDetailsResponse as any)?.data)
          ? (bankDetailsResponse as any).data
          : [];

        // Find matching bank detail by account number and bank name
        const matchingBank = bankDetailsList.find(
          (bd: any) =>
            (bd.accountName === d.selectedAccountName ||
              bd.account_name === d.selectedAccountName) &&
            (bd.accountNumber === d.selectedAccountNumber ||
              bd.account_number === d.selectedAccountNumber) &&
            (bd.bankName === d.selectedBankName ||
              bd.bank_name === d.selectedBankName)
        );

        if (matchingBank) {
          bankBranch = matchingBank.bankBranch || matchingBank.branch || "";
        }
      } catch (error) {
        console.warn(
          "Failed to fetch bank details for branch information:",
          error
        );
      }

      const mapped: Invoice = {
        id: String(d.id ?? row.id),
        invoiceNumber: String(d.invoiceNumber || row.invoiceNumber || ""),
        client: {
          id: "",
          name: String(d.billedToName || ""),
          email: "",
          address: String(d.billedToAddress || ""),
          gstin: d.billedToGstin || "",
          state: d.billedToState || "",
          stateCode: d.billedToCode || "",
        },
        shippingDetails: {
          name: String(d.shippedToName || ""),
          address: String(d.shippedToAddress || ""),
          gstin: d.shippedToGstin || "",
          state: d.shippedToState || "",
          stateCode: d.shippedToCode || "",
        },
        items: (Array.isArray(d.items) ? d.items : []).map(
          (it: any, idx: number) => ({
            id: `item-${Date.now()}-${idx}`,
            description: String(it.description || ""),
            hsnCode: it.hsnCode || "",
            uom: it.uom || "",
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.rate) || 0,
          })
        ),
        issueDate: String(d.invoiceDate || ""),
        dueDate: String(d.invoiceDate || ""),
        status: InvoiceStatus.Draft,
        transportMode: d.transportMode || "",
        vehicleNo: d.vehicleNo || "",
        dateOfSupply: d.dateOfSupply || "",
        placeOfSupply: d.placeOfSupply || "",
        orderNo: d.orderNumber || "",
        taxPayableOnReverseCharge: Boolean(d.taxOnReverseCharge) || false,
        cgstRate: Number(d.cgstRate) || 0,
        sgstRate: Number(d.sgstRate) || 0,
        igstRate: Number(d.igstRate) || 0,
        grLrNo: d.grLrNo || "",
        eWayBillNo: d.ewayBillNo || "",
        bankDetails: {
          accountName: d.selectedAccountName || "",
          accountNumber: d.selectedAccountNumber || "",
          bankName: d.selectedBankName || "",
          branch: bankBranch,
          ifsc: d.selectedIfscCode || "",
        },
        termsAndConditions: d.termsAndConditions || "",
        jurisdiction: "",
      };
      onEdit(mapped);
    } catch (_e) {
      if (onViewDetails) onViewDetails(row.id);
    }
  };

  const handleDownloadRow = async (row: {
    id: number | string;
    invoiceNumber: string;
    invoiceDate: string;
    billedToName: string;
    pdfUrl?: string;
  }) => {
    // Format filename: InvoiceNumber-DD-MM-YYYY-BilledToName.pdf
    const invoiceNum = row.invoiceNumber.replace(/\//g, "-");
    const date = new Date(row.invoiceDate || Date.now());
    const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
    const billedToName = (row.billedToName || "")
      .replace(/[^a-zA-Z0-9]/g, "-") // Replace special chars with hyphen
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
    const fileName = `${invoiceNum}-${dateStr}-${billedToName}.pdf`;

    // If PDF URL exists in Supabase, download it directly
    if (row.pdfUrl) {
      try {
        // Ensure URL is absolute
        let absoluteUrl = row.pdfUrl;
        if (row.pdfUrl.startsWith("/api/")) {
          absoluteUrl = BASE_URL + row.pdfUrl;
        }

        const response = await fetch(absoluteUrl, {
          credentials: "include", // Include cookies for authentication
        });
        if (!response.ok) {
          throw new Error("Failed to fetch PDF");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading PDF from Supabase:", error);
        // Fallback to generating PDF if download fails
        const match = invoices.find(
          (inv) => inv.invoiceNumber === row.invoiceNumber
        );
        if (match) {
          handleDownload(match);
        }
      }
      return;
    }
    // Fallback: generate PDF if no stored URL
    const match = invoices.find(
      (inv) => inv.invoiceNumber === row.invoiceNumber
    );
    if (match) {
      handleDownload(match);
    }
  };
  const handleDownload = async (invoice: Invoice) => {
    try {
      const { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total } =
        calculateInvoiceTotals(invoice);
      const blob = await pdf(
        <DummyPDF invoice={invoice} profile={profile} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Format filename: InvoiceNumber-DD-MM-YYYY-BilledToName.pdf
      const invoiceNum = invoice.invoiceNumber.replace(/\//g, "-");
      const date = new Date(invoice.issueDate || Date.now());
      const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
      const billedToName = (invoice.client?.name || "")
        .replace(/[^a-zA-Z0-9]/g, "-") // Replace special chars with hyphen
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
      
      link.download = `${invoiceNum}-${dateStr}-${billedToName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Invoices</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your invoices and track their status.
          </p>
        </div>
        <button
          onClick={() => setView("create-invoice")}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      </div>
      {error && (
        <div className="mx-6 mt-4 mb-0 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Invoice #
              </th>
              <th scope="col" className="px-6 py-3">
                Client
              </th>
              <th scope="col" className="px-6 py-3">
                Invoice Date
              </th>
              <th scope="col" className="px-6 py-3">
                Amount
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-sm">Loading invoices...</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">No invoices yet</p>
                    <p className="text-xs text-gray-400">Create your first invoice to get started.</p>
                    <button
                      onClick={() => setView("create-invoice")}
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="w-3.5 h-3.5 mr-1" /> Create Invoice
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.map((r) => {
              // Find matching local invoice for status (fallback to Draft if not found)
              const localInvoice = invoices.find(inv => inv.invoiceNumber === r.invoiceNumber);
              const status = localInvoice?.status ?? InvoiceStatus.Draft;
              return (
                <tr key={r.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {r.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">{r.billedToName}</td>
                  <td className="px-6 py-4">{r.invoiceDate}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    ₹{r.totalAmountAfterTax.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadRow(r)}
                      title="Download PDF"
                      className="p-1 font-medium text-gray-500 hover:text-blue-600"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditClick(r)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(r.id)}
                        className="font-medium text-gray-600 hover:underline"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Off-screen preview removed; react-pdf renders directly to Blob */}
    </div>
  );
};
