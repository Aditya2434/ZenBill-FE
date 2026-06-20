import React, { useEffect, useState } from "react";
import { apiGetInvoiceDetails, apiListBankDetails, apiUploadInvoicePdf } from "../utils/api";
import { View } from "../App";
import { CompanyProfile, Invoice } from "../types";
import { pdf } from "@react-pdf/renderer";
import DummyPDF from "./DummyPDF";

interface InvoiceViewProps {
  invoiceId: string | number;
  setView: (view: View) => void;
  profile: CompanyProfile;
}

const DisplayField = ({
  label,
  value,
  fullWidth = false,
  labelWidth = "w-1/3",
}: {
  label: string;
  value: any;
  fullWidth?: boolean;
  labelWidth?: string;
}) => (
  <div className={`flex items-start ${fullWidth ? "w-full" : ""}`}>
    <label className={`${labelWidth} text-sm font-semibold`}>{label}</label>
    <span className="px-2">:</span>
    <div className="flex-grow p-1 text-sm text-gray-900 break-words">
      {value ?? ""}
    </div>
  </div>
);

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoiceId,
  setView,
  profile,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankBranch, setBankBranch] = useState<string>("");
  
  // States for the PDF Upload feature
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const body = await apiGetInvoiceDetails(invoiceId);
        const details = (body && (body as any).data) || body;
        if (!cancelled) {
          setData(details);

          // Fetch bank details to get the branch information
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
                (bd.accountName === details.selectedAccountName ||
                  bd.account_name === details.selectedAccountName) &&
                (bd.accountNumber === details.selectedAccountNumber ||
                  bd.account_number === details.selectedAccountNumber) &&
                (bd.bankName === details.selectedBankName ||
                  bd.bank_name === details.selectedBankName)
            );

            if (matchingBank) {
              setBankBranch(
                matchingBank.bankBranch || matchingBank.branch || ""
              );
            }
          } catch (error) {
            console.warn(
              "Failed to fetch bank details for branch information:",
              error
            );
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  // Handle PDF Generation and Upload
  const handleUploadPdf = async () => {
    if (!data) return;
    setUploadingPdf(true);
    setError("");
    setUploadSuccess(false);

    try {
      // Map the current detailed data back into the `Invoice` interface expected by DummyPDF
      const mappedInvoice: Invoice = {
        id: String(data.id),
        invoiceNumber: data.invoiceNumber,
        client: {
          id: "", // Not strictly needed for PDF generation
          name: data.billedToName,
          email: "",
          address: data.billedToAddress,
          gstin: data.billedToGstin,
          state: data.billedToState,
          stateCode: data.billedToCode,
        },
        shippingDetails: data.shippedToName ? {
          name: data.shippedToName,
          address: data.shippedToAddress,
          gstin: data.shippedToGstin,
          state: data.shippedToState,
          stateCode: data.shippedToCode,
        } : undefined,
        items: data.items,
        issueDate: data.invoiceDate,
        dueDate: data.invoiceDate, // Using issue date as fallback
        status: data.status || "Unpaid",
        transportMode: data.transportMode,
        vehicleNo: data.vehicleNo,
        dateOfSupply: data.dateOfSupply,
        placeOfSupply: data.placeOfSupply,
        orderNo: data.orderNumber,
        taxPayableOnReverseCharge: data.taxOnReverseCharge,
        cgstRate: data.cgstRate,
        sgstRate: data.sgstRate,
        igstRate: data.igstRate,
        grLrNo: data.grLrNo,
        eWayBillNo: data.eWayBillNo,
        bankDetails: {
          bankName: data.selectedBankName,
          accountName: data.selectedAccountName,
          accountNumber: data.selectedAccountNumber,
          ifsc: data.selectedIfscCode,
          branch: bankBranch || data.selectedBankBranch || "",
        },
        termsAndConditions: data.termsAndConditions,
        jurisdiction: data.jurisdictionCity || profile.companyState || "",
      };

      // 1. Generate the PDF Blob locally using @react-pdf/renderer
      const blob = await pdf(<DummyPDF invoice={mappedInvoice} profile={profile} />).toBlob();
      
      // 2. Convert Blob to File object
      const safeInvoiceNumber = data.invoiceNumber.replace(/[^a-zA-Z0-9.-]/g, "_");
      const file = new File([blob], `Invoice_${safeInvoiceNumber}.pdf`, { type: "application/pdf" });
      
      // 3. Upload to Supabase via our Backend API
      const response = await apiUploadInvoicePdf(invoiceId, file);
      
      // Update local state with the new PDF URL so the link shows up immediately
      setData(response);
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000); // hide success message after 3 seconds
    } catch (err: any) {
      console.error("PDF Upload Error:", err);
      setError(err.message || "Failed to upload PDF to cloud.");
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>
        <div className="flex items-center gap-3">
          
          {/* View Saved PDF Button (If URL exists) */}
          {data?.pdfUrl && (
            <a
              href={data.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              View PDF
            </a>
          )}

          {/* Generate & Save PDF Button */}
          {data && (
            <button
              type="button"
              onClick={handleUploadPdf}
              disabled={uploadingPdf}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                ${uploadingPdf ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}
              `}
            >
              {uploadingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : uploadSuccess ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Saved to Cloud!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>
                  Save PDF to Cloud
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setView("invoices")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      
      {!loading && data && (
        <div className="overflow-x-auto w-full">
          <div className="border-2 border-black p-4 space-y-2 text-sm min-w-[768px]">
            {/* Header */}
            <div className="flex justify-between items-start pt-2">
              {/* Section 1: Logo */}
              <div
                className="company-logo"
                style={{ width: "84px", flexShrink: 0 }}
              >
                {profile.logo ? (
                  <img
                    src={profile.logo}
                    alt="Company Logo"
                    className="h-20 w-20 object-contain"
                  />
                ) : (
                  <div className="h-20 w-20 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-sm font-bold">LOGO</span>
                  </div>
                )}
              </div>
              {/* Section 2: Company Details */}
              <div className="company-name text-center px-4 flex-grow">
                <p className="font-bold text-3xl break-words">
                  {profile.companyName}
                </p>
                <p className="text-sm">{profile.companyAddress}</p>
                <p className="text-sm">
                  GSTIN: {profile.gstin} &nbsp;&nbsp; PAN: {profile.pan}
                </p>
              </div>
              {/* Section 3: QR Code Box */}
              <div className="company-qr flex items-center justify-center border border-black bg-gray-50 text-gray-400 font-bold" style={{ width: '84px', height: '80px', flexShrink: 0, fontSize: '10px' }}>
                QR CODE
              </div>
            </div>
            <h2 className="text-center font-bold text-lg underline">
              TAX INVOICE
            </h2>
            {/* Top Section */}
            <div className="grid grid-cols-2 border-t border-b border-black">
              <div className="border-r border-black p-2 space-y-1">
                <div className="flex items-start">
                  <label className="w-1/2 font-semibold pt-1">
                    Tax Invoice No.
                  </label>
                  <span className="pr-2 pt-1">:</span>
                  <span className="pl-2 font-medium">{data.invoiceNumber}</span>
                </div>
                <div className="flex items-center">
                  <label className="w-1/2 font-semibold">Date</label>:{" "}
                  <span className="p-1">{data.invoiceDate}</span>
                </div>
                <div className="flex items-center">
                  <label className="w-1/2 font-semibold">
                    Tax Payable on Reverse Charge
                  </label>
                  :{" "}
                  <span className="p-1">
                    {data.taxOnReverseCharge ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center">
                  <label className="w-1/2 font-semibold">Place of Supply</label>:{" "}
                  <span className="p-1">{data.placeOfSupply}</span>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <DisplayField label="Transport Mode" value={data.transportMode} />
                <DisplayField label="Vehicle No" value={data.vehicleNo} />
                <DisplayField label="Date of Supply" value={data.dateOfSupply} />
                <DisplayField label="Order No" value={data.orderNumber} />
              </div>
            </div>

            {/* Billed To / Shipped To */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="border-r border-black p-2 space-y-1">
                <h3 className="font-bold bg-gray-200 text-center mb-2">
                  DETAIL OF RECEIVER (BILLED TO)
                </h3>
                <DisplayField label="Name" value={data.billedToName} labelWidth="w-[16%]" />
                <div className="flex items-start">
                  <label className="w-[16%] text-sm font-semibold">Address</label>
                  <span className="px-2">:</span>
                  <div className="flex-grow p-1 text-sm text-gray-900 break-words">
                    {data.billedToAddress}
                  </div>
                </div>
                <DisplayField label="GSTIN" value={data.billedToGstin} labelWidth="w-[16%]" />
                <DisplayField label="State" value={data.billedToState} labelWidth="w-[16%]" />
                <DisplayField label="Code" value={data.billedToCode} labelWidth="w-[16%]" />
              </div>
              <div className="p-2 space-y-1">
                <h3 className="font-bold bg-gray-200 text-center mb-2">
                  DETAIL OF RECEIVER (SHIPPED TO)
                </h3>
                <DisplayField label="Name" value={data.shippedToName} labelWidth="w-[16%]" />
                <div className="flex items-start">
                  <label className="w-[16%] text-sm font-semibold">Address</label>
                  <span className="px-2">:</span>
                  <div className="flex-grow p-1 text-sm text-gray-900 break-words">
                    {data.shippedToAddress}
                  </div>
                </div>
                <DisplayField label="GSTIN" value={data.shippedToGstin} labelWidth="w-[16%]" />
                <DisplayField label="State" value={data.shippedToState} labelWidth="w-[16%]" />
                <DisplayField label="Code" value={data.shippedToCode} labelWidth="w-[16%]" />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="grid grid-cols-[2fr,14fr,4fr,4fr,4fr,5fr,5fr,2fr] border-b border-black font-bold text-center">
                <div className="p-1 border-r border-black">S.NO</div>
                <div className="p-1 border-r border-black">
                  DESCRIPTION OF GOODS
                </div>
                <div className="p-1 border-r border-black">HSN CODE</div>
                <div className="p-1 border-r border-black">UOM</div>
                <div className="p-1 border-r border-black">QUANTITY</div>
                <div className="p-1 border-r border-black">RATE</div>
                <div className="p-1">AMOUNT</div>
              </div>
              <div className="space-y-1">
                {(data.items || []).map((item: any, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-[2fr,14fr,4fr,4fr,4fr,5fr,5fr,2fr] items-center"
                  >
                    <div className="text-center p-1">{index + 1}</div>
                    <div className="p-1 text-gray-900">{item.description}</div>
                    <div className="p-1 text-gray-900">{item.hsnCode || ""}</div>
                    <div className="p-1 text-gray-900">{item.uom || ""}</div>
                    <div className="p-1 text-gray-900">{item.quantity}</div>
                    <div className="p-1 text-gray-900">{item.rate}</div>
                    <p className="text-right p-1">
                      ₹
                      {(Number(item.quantity) * Number(item.rate)).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </p>
                    <div />
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 border-t border-b border-black">
              <div className="border-r border-black p-2 flex items-start">
                <span className="w-1/3 text-sm font-semibold">
                  Total Amount in Words INR
                </span>
                <span className="px-2">:</span>
                <span className="flex-grow text-sm break-words font-medium text-gray-800">
                  {data.totalAmountInWords}
                </span>
              </div>
              <div className="p-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Amount before Tax</span>{" "}
                  <span>
                    ₹
                    {Number(data.totalAmountBeforeTax || 0).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-semibold w-24">Add: CGST @</span>
                    <span className="w-16 p-1 text-right">
                      {data.cgstRate ?? 0}
                    </span>{" "}
                    %
                  </div>
                  <span>
                    ₹
                    {Number(data.cgstAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-semibold w-24">Add: SGST @</span>
                    <span className="w-16 p-1 text-right">
                      {data.sgstRate ?? 0}
                    </span>{" "}
                    %
                  </div>
                  <span>
                    ₹
                    {Number(data.sgstAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-semibold w-24">Add: IGST @</span>
                    <span className="w-16 p-1 text-right">
                      {data.igstRate ?? 0}
                    </span>{" "}
                    %
                  </div>
                  <span>
                    ₹
                    {Number(data.igstAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-400 mt-1 pt-1">
                  <span className="font-semibold">Total Tax Amount</span>{" "}
                  <span>
                    ₹
                    {Number(data.totalTaxAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-400 mt-1 pt-1">
                  <span className="font-semibold">Total Amount after Tax</span>{" "}
                  <span>
                    ₹
                    {Number(data.totalAmountAfterTax || 0).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-1">
              <DisplayField label="GR/LR NO" value={data.grLrNo} />
              <DisplayField label="E WAY BILL NO" value={data.ewayBillNo} />
              <p className="font-bold underline">OUR BANK DETAIL :</p>
              <DisplayField label="BANK" value={data.selectedBankName} />
              <DisplayField label="A/C NAME" value={data.selectedAccountName} />
              <DisplayField label="A/C NO" value={data.selectedAccountNumber} />
              <DisplayField
                label="BRANCH"
                value={bankBranch || data.selectedBankBranch}
              />
              <DisplayField label="IFSC" value={data.selectedIfscCode} />
              <div>
                <label className="font-semibold">
                  Terms & Condition for Supply :
                </label>
                <div className="w-full p-1 text-xs text-gray-900 whitespace-pre-wrap">
                  {data.termsAndConditions || ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceView;