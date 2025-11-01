import React, { useEffect, useState } from "react";
import { apiGetInvoiceDetails } from "../utils/api";
import { View } from "../App";
import { CompanyProfile } from "../types";

interface InvoiceDetailsProps {
  invoiceId: string | number;
  setView: (view: View) => void;
  profile: CompanyProfile;
}

const DisplayField = ({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: any;
  fullWidth?: boolean;
}) => (
  <div className={`flex items-start ${fullWidth ? "w-full" : ""}`}>
    <label className="w-1/3 text-sm font-semibold">{label}</label>
    <span className="px-2">:</span>
    <div className="flex-grow p-1 text-sm text-gray-900 break-words">
      {value ?? ""}
    </div>
  </div>
);

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoiceId,
  setView,
  profile,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const body = await apiGetInvoiceDetails(invoiceId);
        const details = (body && (body as any).data) || body;
        if (!cancelled) setData(details);
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>
        <button
          type="button"
          onClick={() => setView("invoices")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && data && (
        <div className="border-2 border-black p-4 space-y-2 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start">
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
            {/* Section 3: Empty Placeholder */}
            <div
              className="empty-placeholder"
              style={{ width: "84px", flexShrink: 0, padding: "16px" }}
            />
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
              <DisplayField label="Name" value={data.billedToName} />
              <div className="flex items-start">
                <label className="w-1/3 text-sm font-semibold">Address</label>
                <span className="px-2">:</span>
                <div className="flex-grow p-1 text-sm text-gray-900 break-words">
                  {data.billedToAddress}
                </div>
              </div>
              <DisplayField label="GSTIN" value={data.billedToGstin} />
              <DisplayField label="State" value={data.billedToState} />
              <DisplayField label="Code" value={data.billedToCode} />
            </div>
            <div className="p-2 space-y-1">
              <h3 className="font-bold bg-gray-200 text-center mb-2">
                DETAIL OF RECEIVER (SHIPPED TO)
              </h3>
              <DisplayField label="Name" value={data.shippedToName} />
              <div className="flex items-start">
                <label className="w-1/3 text-sm font-semibold">Address</label>
                <span className="px-2">:</span>
                <div className="flex-grow p-1 text-sm text-gray-900 break-words">
                  {data.shippedToAddress}
                </div>
              </div>
              <DisplayField label="GSTIN" value={data.shippedToGstin} />
              <DisplayField label="State" value={data.shippedToState} />
              <DisplayField label="Code" value={data.shippedToCode} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="grid grid-cols-[3fr,14fr,4fr,4fr,4fr,4fr,5fr,2fr] border-b border-black font-bold text-center">
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
                  className="grid grid-cols-[3fr,14fr,4fr,4fr,4fr,4fr,5fr,2fr] items-center"
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
      )}
    </div>
  );
};

export default InvoiceDetails;
