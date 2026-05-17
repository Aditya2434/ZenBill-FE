import React, { useEffect, useState } from "react";
import { Invoice, InvoiceStatus, CompanyProfile } from "../types";
import { View } from "../App";
import { PlusIcon, DownloadIcon, TrashIcon } from "./icons";
import DummyPDF from "./DummyPDF";
import { pdf } from "@react-pdf/renderer";
import { Toast, ToastType } from "./Toast";
import {
  apiListInvoices,
  apiGetInvoiceDetails,
  apiListBankDetails,
  apiMarkInvoicePaid,
  BASE_URL,
} from "../utils/api";

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  setView: (view: View) => void;
  profile: CompanyProfile;
  onViewDetails?: (invoiceId: string | number) => void;
}

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
      status: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({ message: "", type: "success", isVisible: false });
  const [payConfirmModal, setPayConfirmModal] = useState<{ open: boolean; invoiceId: string | number | null }>({ open: false, invoiceId: null });

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

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
          status: it.status || "Unpaid", 
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
          ? (bankDetailsResponse as any).data
          : [];

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
    const invoiceNum = row.invoiceNumber.replace(/\//g, "-");
    const date = new Date(row.invoiceDate || Date.now());
    const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
    const billedToName = (row.billedToName || "")
      .replace(/[^a-zA-Z0-9]/g, "-") 
      .replace(/-+/g, "-") 
      .replace(/^-|-$/g, ""); 
    const fileName = `${invoiceNum}-${dateStr}-${billedToName}.pdf`;

    if (row.pdfUrl) {
      try {
        let absoluteUrl = row.pdfUrl;
        if (row.pdfUrl.startsWith("/api/")) {
          absoluteUrl = BASE_URL + row.pdfUrl;
        }

        const response = await fetch(absoluteUrl, {
          credentials: "include", 
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
        const match = invoices.find(
          (inv) => inv.invoiceNumber === row.invoiceNumber
        );
        if (match) {
          handleDownload(match);
        }
      }
      return;
    }
    const match = invoices.find(
      (inv) => inv.invoiceNumber === row.invoiceNumber
    );
    if (match) {
      handleDownload(match);
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      const { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total } = calculateInvoiceTotals(invoice);
      const blob = await pdf(
        <DummyPDF invoice={invoice} profile={profile} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const invoiceNum = invoice.invoiceNumber.replace(/\//g, "-");
      const date = new Date(invoice.issueDate || Date.now());
      const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
      const billedToName = (invoice.client?.name || "")
        .replace(/[^a-zA-Z0-9]/g, "-") 
        .replace(/-+/g, "-") 
        .replace(/^-|-$/g, ""); 
      
      link.download = `${invoiceNum}-${dateStr}-${billedToName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF", err);
    }
  };

  const confirmMarkPaid = async () => {
    if (!payConfirmModal.invoiceId) return;
    try {
      const res = await apiMarkInvoicePaid(payConfirmModal.invoiceId);
      if (res && res.status) {
        setRows(rows.map(r => 
          r.id === payConfirmModal.invoiceId ? { ...r, status: 'Paid' } : r
        ));
        showToast("Payment recorded successfully!", "success");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to record payment.", "error");
    } finally {
      setPayConfirmModal({ open: false, invoiceId: null });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} duration={3000} />

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
              <th scope="col" className="px-6 py-3 text-center">
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
              const isPaid = r.status === "Paid";
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
                  <td className="px-6 py-4 text-center">
                     {isPaid ? (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                           <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                           Paid
                        </span>
                     ) : (
                        <button 
                          onClick={() => setPayConfirmModal({ open: true, invoiceId: r.id })} 
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 transition-all shadow-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                          title="Click to mark this invoice as paid"
                        >
                          Mark as Paid
                        </button>
                     )}
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

      {/* --- CONFIRM PAYMENT MODAL --- */}
      {payConfirmModal.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-full mb-4">
               <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              Confirm Payment
            </h3>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Are you sure you want to mark this invoice as paid? This action will update your revenue records.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setPayConfirmModal({ open: false, invoiceId: null })}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkPaid}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 border border-transparent rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors"
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