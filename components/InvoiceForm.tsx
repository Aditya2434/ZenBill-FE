import React, { useState, useEffect, useMemo } from "react";
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Client,
  CompanyProfile,
  Product,
} from "../types";
import { View } from "../App";
import { PlusIcon, TrashIcon, DownloadIcon } from "./icons";
import {
  generateNextInvoiceNumber,
  getHighestInvoiceNumber,
} from "../hooks/useInvoices";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { apiCreateInvoice } from "../utils/api";
import DummyPDF from "./DummyPDF";

interface InvoiceFormProps {
  existingInvoice?: Invoice | null;
  addInvoice?: (invoice: Omit<Invoice, "id">) => boolean;
  updateInvoice?: (invoice: Invoice) => void;
  setView: (view: View) => void;
  profile: CompanyProfile;
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
}

function numberToWordsINR(num: number): string {
  const a = [
    "",
    "ONE ",
    "TWO ",
    "THREE ",
    "FOUR ",
    "FIVE ",
    "SIX ",
    "SEVEN ",
    "EIGHT ",
    "NINE ",
    "TEN ",
    "ELEVEN ",
    "TWELVE ",
    "THIRTEEN ",
    "FOURTEEN ",
    "FIFTEEN ",
    "SIXTEEN ",
    "SEVENTEEN ",
    "EIGHTEEN ",
    "NINETEEN ",
  ];
  const b = [
    "",
    "",
    "TWENTY ",
    "THIRTY ",
    "FORTY ",
    "FIFTY ",
    "SIXTY ",
    "SEVENTY ",
    "EIGHTY ",
    "NINETY ",
  ];

  const [integerPartStr] = num.toFixed(2).split(".");
  let n = parseInt(integerPartStr, 10);

  if (n === 0) return "ZERO RUPEES ONLY.";
  if (n > 999999999) return "NUMBER TOO LARGE";

  const inWords = (num: number, s: string) => {
    let str = "";
    if (num > 19) {
      str += b[Math.floor(num / 10)] + a[num % 10];
    } else {
      str += a[num];
    }
    if (num !== 0) {
      str += s;
    }
    return str;
  };

  let res = "";
  res += inWords(Math.floor(n / 10000000), "CRORE ");
  n %= 10000000;
  res += inWords(Math.floor(n / 100000), "LAKH ");
  n %= 100000;
  res += inWords(Math.floor(n / 1000), "THOUSAND ");
  n %= 1000;
  res += inWords(Math.floor(n / 100), "HUNDRED ");
  n %= 100;
  if (n > 0 && res.trim() !== "") {
    res += "AND ";
  }
  res += inWords(n, "");

  return res.trim().replace(/\s\s+/g, " ") + " RUPEES ONLY.";
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const FormField = ({
  label,
  name,
  value,
  onChange,
  fullWidth = false,
  type = "text",
  disabled,
  ...props
}: {
  label: string;
  name: string;
  value: any;
  onChange: any;
  fullWidth?: boolean;
  type?: string;
  disabled?: boolean;
}) => (
  <div className={`flex items-center ${fullWidth ? "w-full" : ""}`}>
    <label htmlFor={name} className="w-1/3 text-sm font-semibold">
      {label}
    </label>
    <span className="px-2">:</span>
    <input
      type={type}
      id={name}
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className={`flex-grow p-1 border border-gray-300 text-sm bg-white text-gray-900 ${
        disabled ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      {...props}
    />
  </div>
);

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  existingInvoice,
  addInvoice,
  updateInvoice,
  setView,
  profile,
  invoices,
  clients,
  products,
}) => {
  const emptyInvoice = useMemo(
    () => ({
      client: {
        id: "",
        name: "",
        email: "",
        address: "",
        gstin: "",
        state: "",
        stateCode: "",
      },
      items: [
        {
          id: `item-${Date.now()}`,
          description: "",
          quantity: 1,
          unitPrice: 0,
          hsnCode: "",
          uom: "",
        },
      ],
      issueDate: getTodayDateString(),
      dueDate: getTodayDateString(),
      status: InvoiceStatus.Draft,
      shippingDetails: {
        name: "",
        address: "",
        gstin: "",
        state: "",
        stateCode: "",
      },
      transportMode: "",
      vehicleNo: "",
      dateOfSupply: getTodayDateString(),
      placeOfSupply: "",
      orderNo: "",
      taxPayableOnReverseCharge: false,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      grLrNo: "",
      eWayBillNo: "",
      bankDetails: profile.defaultBankDetails,
      termsAndConditions:
        "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if the payment is not made within the stipulated time.",
      jurisdiction: "DURGAPUR",
    }),
    [profile]
  );

  const [invoice, setInvoice] = useState<
    Omit<Invoice, "id" | "invoiceNumber"> | Invoice
  >(existingInvoice || emptyInvoice);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [invoiceNumberPrefix, setInvoiceNumberPrefix] = useState("");
  const [invoiceNumberSequential, setInvoiceNumberSequential] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showEmptyInvoiceModal, setShowEmptyInvoiceModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showInvoiceNumberTip, setShowInvoiceNumberTip] = useState(false);
  const [hasSeenInvoiceNumberTip, setHasSeenInvoiceNumberTip] = useState(false);

  useEffect(() => {
    if (existingInvoice) {
      setInvoice(existingInvoice);
      const bill = existingInvoice.client;
      const ship = existingInvoice.shippingDetails;
      if (ship && (bill.name !== ship.name || bill.address !== ship.address)) {
        setSameAsBilling(false);
      } else {
        setSameAsBilling(true);
      }
      // Populate invoice number prefix and editable sequential from existing invoice
      const parts = existingInvoice.invoiceNumber.split("/");
      if (parts.length === 3) {
        setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
        setInvoiceNumberSequential(parts[2]);
      }
    } else {
      setInvoice(emptyInvoice);
      setSameAsBilling(true);
      const nextInvoiceNumber = generateNextInvoiceNumber(invoices, profile);
      const parts = nextInvoiceNumber.split("/");
      if (parts.length === 3) {
        setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
        setInvoiceNumberSequential(parts[2]);
      }
    }
  }, [existingInvoice, emptyInvoice, invoices, profile]);

  useEffect(() => {
    if (sameAsBilling && invoice.client) {
      const { name, address, gstin, state, stateCode } = invoice.client;
      setInvoice((prev) => ({
        ...prev,
        shippingDetails: {
          ...prev.shippingDetails,
          name,
          address,
          gstin,
          state,
          stateCode,
        },
      }));
    }
  }, [sameAsBilling, invoice.client]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClient = clients.find((c) => c.id === e.target.value);
    if (selectedClient) {
      setInvoice({ ...invoice, client: selectedClient });
    } else {
      setInvoice({ ...invoice, client: emptyInvoice.client });
    }
  };

  const handleShippingClientChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedClient = clients.find((c) => c.id === e.target.value);

    if (e.target.value) {
      setSameAsBilling(false);
    }

    if (selectedClient) {
      const { name, address, gstin, state, stateCode } = selectedClient;
      setInvoice((prev) => ({
        ...prev,
        shippingDetails: {
          ...prev.shippingDetails,
          name,
          address,
          gstin,
          state,
          stateCode,
        },
      }));
    } else {
      setInvoice((prev) => ({
        ...prev,
        shippingDetails: {
          name: "",
          address: "",
          gstin: "",
          state: "",
          stateCode: "",
        },
      }));
    }
  };

  const handleSequentialNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormError(null);
    const { value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, ""); // Only allow numbers
    if (numericValue.length <= 3) {
      setInvoiceNumberSequential(numericValue);
      // Live validations: duplicate and highest-number threshold
      const candidate = `${invoiceNumberPrefix}${numericValue.padStart(
        3,
        "0"
      )}`;
      const isDuplicate = invoices.some(
        (inv) => inv.invoiceNumber.toLowerCase() === candidate.toLowerCase()
      );
      const highestNumber = getHighestInvoiceNumber(
        invoices,
        invoiceNumberPrefix
      );
      let newError: string | null = null;
      if (isDuplicate) {
        newError = "Invoice number already exists.";
      } else if (numericValue !== "" && Number(numericValue) <= highestNumber) {
        newError = `Invoice no. must be > ${String(highestNumber).padStart(
          3,
          "0"
        )}.`;
      }
      setFormError(newError);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = invoice.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };

        // If description changes, check for product match and autofill
        if (field === "description") {
          const selectedProduct = products.find((p) => p.name === value);
          if (selectedProduct) {
            updatedItem.hsnCode = selectedProduct.hsnCode || "";
            updatedItem.uom = selectedProduct.uom || "";
          }
        }

        if (field === "quantity" || field === "unitPrice") {
          updatedItem[field] = Number(value) || 0;
        }
        return updatedItem;
      }
      return item;
    });
    setInvoice({ ...invoice, items: newItems });
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        {
          id: `item-${Date.now()}`,
          description: "",
          quantity: 1,
          unitPrice: 0,
          hsnCode: "",
          uom: "",
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setInvoice({
      ...invoice,
      items: invoice.items.filter((_, i) => i !== index),
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setInvoice((prev) => ({ ...prev, [name]: checked }));
    } else {
      setInvoice((prev) => ({
        ...prev,
        [name]: name.includes("Rate") ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleNestedChange = (
    section: "shippingDetails" | "bankDetails" | "client",
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [name]: value,
      },
    }));
  };

  const {
    cleanedItems,
    subtotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    total,
    previewInvoiceData,
  } = useMemo(() => {
    const itemsToProcess = invoice.items.filter(
      (item) => item.description.trim() !== ""
    );

    const sub = itemsToProcess.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );
    const cgst = sub * ((invoice.cgstRate || 0) / 100);
    const sgst = sub * ((invoice.sgstRate || 0) / 100);
    const igst = sub * ((invoice.igstRate || 0) / 100);
    const tax = cgst + sgst + igst;
    const grandTotal = sub + tax;

    const fullInvoiceNumber =
      "invoiceNumber" in invoice
        ? invoice.invoiceNumber
        : `${invoiceNumberPrefix}${invoiceNumberSequential.padStart(3, "0")}`;

    const previewData = {
      ...emptyInvoice,
      ...invoice,
      items: itemsToProcess,
      id: "invoiceNumber" in invoice ? (invoice as Invoice).id : "preview-id",
      invoiceNumber: fullInvoiceNumber,
    } as Invoice;

    return {
      cleanedItems: itemsToProcess,
      subtotal: sub,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalTax: tax,
      total: grandTotal,
      previewInvoiceData: previewData,
    };
  }, [invoice, invoiceNumberPrefix, invoiceNumberSequential, emptyInvoice]);

  const handleDownloadPdf = async () => {
    try {
      const blob = await pdf(
        <DummyPDF invoice={previewInvoiceData} profile={profile} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${previewInvoiceData.invoiceNumber.replace(
        /\//g,
        "-"
      )}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF", err);
    }
  };

  const proceedWithSubmit = async () => {
    setFormError(null);

    const cleanedInvoiceData = {
      ...invoice,
      items: cleanedItems,
    };

    if (existingInvoice && updateInvoice) {
      updateInvoice(cleanedInvoiceData as Invoice);
      setView("invoices");
    } else {
      const finalSequential = invoiceNumberSequential.padStart(3, "0");
      const fullInvoiceNumber = `${invoiceNumberPrefix}${finalSequential}`;

      const isDuplicate = invoices.some(
        (inv) =>
          inv.invoiceNumber.toLowerCase() === fullInvoiceNumber.toLowerCase()
      );
      if (isDuplicate) {
        setFormError("Invoice number already exists.");
        return;
      }

      const highestNumber = getHighestInvoiceNumber(
        invoices,
        invoiceNumberPrefix
      );
      const currentNumber = parseInt(finalSequential, 10);
      if (!isNaN(currentNumber) && currentNumber <= highestNumber) {
        setFormError(
          `Invoice no. must be > ${String(highestNumber).padStart(3, "0")}.`
        );
        return;
      }

      // Map to BE payload
      const payload: any = {
        invoiceDate: (cleanedInvoiceData as any).issueDate,
        transportMode: (cleanedInvoiceData as any).transportMode || null,
        vehicleNo: (cleanedInvoiceData as any).vehicleNo || null,
        dateOfSupply: (cleanedInvoiceData as any).dateOfSupply || null,
        placeOfSupply: (cleanedInvoiceData as any).placeOfSupply || null,
        orderNumber: (cleanedInvoiceData as any).orderNo || null,
        taxOnReverseCharge:
          (cleanedInvoiceData as any).taxPayableOnReverseCharge || false,
        grLrNo: (cleanedInvoiceData as any).grLrNo || null,
        billedToName: (cleanedInvoiceData as any).client?.name || "",
        billedToAddress: (cleanedInvoiceData as any).client?.address || "",
        billedToGstin: (cleanedInvoiceData as any).client?.gstin || "",
        billedToState: (cleanedInvoiceData as any).client?.state || "",
        billedToCode: (cleanedInvoiceData as any).client?.stateCode || "",
        shippedToName: (cleanedInvoiceData as any).shippingDetails?.name || "",
        shippedToAddress:
          (cleanedInvoiceData as any).shippingDetails?.address || "",
        shippedToGstin:
          (cleanedInvoiceData as any).shippingDetails?.gstin || "",
        shippedToState:
          (cleanedInvoiceData as any).shippingDetails?.state || "",
        shippedToCode:
          (cleanedInvoiceData as any).shippingDetails?.stateCode || "",
        items: (cleanedInvoiceData as any).items.map((it: any) => ({
          description: it.description,
          hsnCode: it.hsnCode || "",
          uom: it.uom || "",
          quantity: Number(it.quantity) || 0,
          rate: Number(it.unitPrice) || 0,
        })),
        cgstRate: (cleanedInvoiceData as any).cgstRate || 0,
        sgstRate: (cleanedInvoiceData as any).sgstRate || 0,
        igstRate: (cleanedInvoiceData as any).igstRate || 0,
        selectedBankName:
          (cleanedInvoiceData as any).bankDetails?.bankName ||
          profile.defaultBankDetails?.bankName ||
          "",
        selectedAccountName:
          (cleanedInvoiceData as any).bankDetails?.accountName ||
          profile.defaultBankDetails?.accountName ||
          "",
        selectedAccountNumber:
          (cleanedInvoiceData as any).bankDetails?.accountNumber ||
          profile.defaultBankDetails?.accountNumber ||
          "",
        selectedIfscCode:
          (cleanedInvoiceData as any).bankDetails?.ifsc ||
          profile.defaultBankDetails?.ifsc ||
          "",
        termsAndConditions:
          (cleanedInvoiceData as any).termsAndConditions || "",
        ewayBillNo: (cleanedInvoiceData as any).eWayBillNo || "",
      };

      try {
        await apiCreateInvoice(payload);
        setView("invoices");
      } catch (e: any) {
        setFormError(e?.message || "Failed to save invoice");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasItems = cleanedItems.length > 0;

    if (!hasItems && !existingInvoice) {
      setShowEmptyInvoiceModal(true);
      return;
    }

    await proceedWithSubmit();
  };

  const handleConfirmSaveEmpty = async () => {
    setShowEmptyInvoiceModal(false);
    await proceedWithSubmit();
  };

  const handleDiscardEmpty = () => {
    setShowEmptyInvoiceModal(false);
    setView("invoices");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {showEmptyInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900">Confirm Save</h3>
            <p className="mt-2 text-sm text-gray-600">
              There is no item added. Do you want to save it or discard it?
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleDiscardEmpty}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Discard it
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveEmpty}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Yes, save it
              </button>
            </div>
          </div>
        </div>
      )}
      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="text-xl font-semibold text-gray-800">
                Invoice Preview
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto bg-gray-200 p-8">
              <div className="flex justify-center">
                <div className="w-full h-[80vh] bg-white shadow-lg">
                  <PDFViewer
                    style={{ width: "100%", height: "100%" }}
                    showToolbar
                  >
                    <DummyPDF invoice={previewInvoiceData} profile={profile} />
                  </PDFViewer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showInvoiceNumberTip && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowInvoiceNumberTip(false);
            setHasSeenInvoiceNumberTip(true);
          }}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900">
              Invoice Number
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              You can edit only the last three digits of the invoice number.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceNumberTip(false);
                  setHasSeenInvoiceNumberTip(true);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceNumberTip(false);
                  setHasSeenInvoiceNumberTip(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {existingInvoice ? "Edit Invoice" : "Create Invoice"}
          </h2>
          <div>
            <button
              type="button"
              onClick={() => setView("invoices")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-2"
            >
              Print Preview
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
            >
              {existingInvoice ? "Save Changes" : "Save Invoice"}
            </button>
          </div>
        </div>

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
            >
              {/* Empty as per request */}
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
                {existingInvoice ? (
                  <span className="pl-2 font-medium">
                    {existingInvoice.invoiceNumber}
                  </span>
                ) : (
                  <div>
                    <div
                      className={`flex items-center border rounded-md overflow-hidden bg-white ${
                        formError ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <span className="px-2 py-1 text-gray-600 bg-gray-100">
                        {invoiceNumberPrefix}
                      </span>
                      <input
                        type="text"
                        value={invoiceNumberSequential}
                        onChange={handleSequentialNumberChange}
                        onFocus={() => {
                          if (!hasSeenInvoiceNumberTip) {
                            setShowInvoiceNumberTip(true);
                          }
                        }}
                        className="p-1 w-16 text-sm text-gray-900 bg-white focus:outline-none"
                        maxLength={3}
                      />
                    </div>
                    {formError && (
                      <p className="text-red-500 text-xs mt-1">{formError}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <label className="w-1/2 font-semibold">Date</label>:{" "}
                <input
                  type="date"
                  name="issueDate"
                  value={invoice.issueDate}
                  onChange={handleInputChange}
                  className="p-1 border border-gray-300 w-1/2 bg-white text-gray-900"
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/2 font-semibold">
                  Tax Payable on Reverse Charge
                </label>
                :{" "}
                <input
                  type="checkbox"
                  name="taxPayableOnReverseCharge"
                  checked={invoice.taxPayableOnReverseCharge}
                  onChange={handleInputChange}
                  className="ml-2"
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/2 font-semibold">State & Code</label>:{" "}
                <span className="p-1">
                  {`${profile.companyState || ""} ${
                    profile.companyStateCode || ""
                  }`.trim()}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <FormField
                label="Transport Mode"
                name="transportMode"
                value={invoice.transportMode}
                onChange={handleInputChange}
              />
              <FormField
                label="Vehicle No"
                name="vehicleNo"
                value={invoice.vehicleNo}
                onChange={handleInputChange}
              />
              <FormField
                label="Date of Supply"
                name="dateOfSupply"
                value={invoice.dateOfSupply}
                onChange={handleInputChange}
                type="date"
              />
              <FormField
                label="Place of Supply"
                name="placeOfSupply"
                value={invoice.placeOfSupply}
                onChange={handleInputChange}
              />
              <FormField
                label="Order No"
                name="orderNo"
                value={invoice.orderNo}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-2 space-y-1">
              <h3 className="font-bold bg-gray-200 text-center mb-2">
                DETAIL OF RECEIVER (BILLED TO)
              </h3>
              <select
                id="client"
                value={invoice.client.id}
                onChange={handleClientChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md mb-2"
              >
                <option value="">
                  Select a client or enter details manually
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FormField
                label="Name"
                name="name"
                value={invoice.client.name}
                onChange={(e) => handleNestedChange("client", e)}
              />
              <div className="flex items-start">
                <label
                  htmlFor="client-address"
                  className="w-1/3 text-sm font-semibold"
                >
                  Address
                </label>
                <span className="px-2">:</span>
                <textarea
                  id="client-address"
                  name="address"
                  value={invoice.client.address || ""}
                  onChange={(e) => handleNestedChange("client", e)}
                  rows={3}
                  className="flex-grow p-1 border border-gray-300 text-sm bg-white text-gray-900"
                />
              </div>
              <FormField
                label="GSTIN"
                name="gstin"
                value={invoice.client.gstin}
                onChange={(e) => handleNestedChange("client", e)}
              />
              <FormField
                label="State & Code"
                name="state"
                value={`${invoice.client.state || ""} ${
                  invoice.client.stateCode || ""
                }`}
                onChange={(e) => handleNestedChange("client", e)}
              />
            </div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold bg-gray-200 text-center flex-grow">
                  DETAIL OF RECEIVER (SHIPPED TO)
                </h3>
                <div className="flex items-center ml-2 text-xs">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="mr-1"
                  />
                  <label htmlFor="sameAsBilling">Same as billing</label>
                </div>
              </div>
              <select
                id="shippingClient"
                onChange={handleShippingClientChange}
                disabled={sameAsBilling}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md mb-2 ${
                  sameAsBilling ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">
                  Select a client or enter details manually
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FormField
                label="Name"
                name="name"
                value={invoice.shippingDetails?.name}
                onChange={(e) => handleNestedChange("shippingDetails", e)}
                disabled={sameAsBilling}
              />
              <div className="flex items-start">
                <label
                  htmlFor="shipping-address"
                  className="w-1/3 text-sm font-semibold"
                >
                  Address
                </label>
                <span className="px-2">:</span>
                <textarea
                  id="shipping-address"
                  name="address"
                  value={invoice.shippingDetails?.address || ""}
                  onChange={(e) => handleNestedChange("shippingDetails", e)}
                  disabled={sameAsBilling}
                  rows={3}
                  className={`flex-grow p-1 border border-gray-300 text-sm bg-white text-gray-900 ${
                    sameAsBilling ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>
              <FormField
                label="GSTIN"
                name="gstin"
                value={invoice.shippingDetails?.gstin}
                onChange={(e) => handleNestedChange("shippingDetails", e)}
                disabled={sameAsBilling}
              />
              <FormField
                label="State & Code"
                name="state"
                value={`${invoice.shippingDetails?.state || ""} ${
                  invoice.shippingDetails?.stateCode || ""
                }`}
                onChange={(e) => handleNestedChange("shippingDetails", e)}
                disabled={sameAsBilling}
              />
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
              {invoice.items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[3fr,14fr,4fr,4fr,4fr,4fr,5fr,2fr] items-center"
                >
                  <div className="text-center p-1">{index + 1}</div>

                  <input
                    type="text"
                    list="product-list"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 bg-white text-gray-900"
                  />
                  <datalist id="product-list">
                    {products.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>

                  <input
                    type="text"
                    placeholder="HSN"
                    value={item.hsnCode || ""}
                    onChange={(e) =>
                      handleItemChange(index, "hsnCode", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 bg-white text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="UOM"
                    value={item.uom || ""}
                    onChange={(e) =>
                      handleItemChange(index, "uom", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 bg-white text-gray-900"
                  />
                  <p className="text-right p-1">
                    ₹
                    {(item.quantity * item.unitPrice).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 flex justify-center"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-transparent rounded-lg hover:bg-blue-100"
            >
              <PlusIcon className="mr-1 w-4 h-4" /> Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 border-t border-b border-black">
            <div className="border-r border-black p-2 flex items-start">
              <span className="w-1/3 text-sm font-semibold">
                Total Amount in Words INR
              </span>
              <span className="px-2">:</span>
              <span className="flex-grow text-sm break-words font-medium text-gray-800">
                {numberToWordsINR(total)}
              </span>
            </div>
            <div className="p-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount before Tax</span>{" "}
                <span>
                  ₹
                  {subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-semibold w-24">Add: CGST @</span>
                  <input
                    type="number"
                    name="cgstRate"
                    value={invoice.cgstRate || ""}
                    onChange={handleInputChange}
                    className="w-16 p-1 border border-gray-300 text-right bg-white text-gray-900"
                  />{" "}
                  %
                </div>
                <span>
                  ₹
                  {cgstAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-semibold w-24">Add: SGST @</span>
                  <input
                    type="number"
                    name="sgstRate"
                    value={invoice.sgstRate || ""}
                    onChange={handleInputChange}
                    className="w-16 p-1 border border-gray-300 text-right bg-white text-gray-900"
                  />{" "}
                  %
                </div>
                <span>
                  ₹
                  {sgstAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-semibold w-24">Add: IGST @</span>
                  <input
                    type="number"
                    name="igstRate"
                    value={invoice.igstRate || ""}
                    onChange={handleInputChange}
                    className="w-16 p-1 border border-gray-300 text-right bg-white text-gray-900"
                  />{" "}
                  %
                </div>
                <span>
                  ₹
                  {igstAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-400 mt-1 pt-1">
                <span className="font-semibold">Total Tax Amount</span>{" "}
                <span>
                  ₹
                  {totalTax.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-400 mt-1 pt-1">
                <span className="font-semibold">Total Amount after Tax</span>{" "}
                <span>
                  ₹
                  {total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-1">
            <FormField
              label="GR/LR NO"
              name="grLrNo"
              value={invoice.grLrNo}
              onChange={handleInputChange}
            />
            <FormField
              label="E WAY BILL NO"
              name="eWayBillNo"
              value={invoice.eWayBillNo}
              onChange={handleInputChange}
            />
            <p className="font-bold underline">OUR BANK DETAIL :</p>
            <FormField
              label="A/C NAME"
              name="accountName"
              value={invoice.bankDetails?.accountName}
              onChange={(e) => handleNestedChange("bankDetails", e)}
            />
            <FormField
              label="A/C NO"
              name="accountNumber"
              value={invoice.bankDetails?.accountNumber}
              onChange={(e) => handleNestedChange("bankDetails", e)}
            />
            <FormField
              label="BANK"
              name="bankName"
              value={invoice.bankDetails?.bankName}
              onChange={(e) => handleNestedChange("bankDetails", e)}
            />
            <FormField
              label="BRANCH"
              name="branch"
              value={invoice.bankDetails?.branch}
              onChange={(e) => handleNestedChange("bankDetails", e)}
            />
            <FormField
              label="IFSC"
              name="ifsc"
              value={invoice.bankDetails?.ifsc}
              onChange={(e) => handleNestedChange("bankDetails", e)}
            />

            <div>
              <label className="font-semibold">
                Terms & Condition for Supply :
              </label>
              <textarea
                name="termsAndConditions"
                value={invoice.termsAndConditions}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-1 border border-gray-300 text-xs bg-white text-gray-900"
              ></textarea>
            </div>

            <div className="grid grid-cols-3 pt-4 text-xs">
              <div>
                Subject to{" "}
                <input
                  name="jurisdiction"
                  value={invoice.jurisdiction}
                  onChange={handleInputChange}
                  className="w-24 p-1 border border-gray-300 bg-white text-gray-900"
                />{" "}
                Jurisdiction
              </div>
              <div className="text-center">
                {profile.companySeal && (
                  <div className="h-24 flex items-center justify-center">
                    <img
                      src={profile.companySeal}
                      alt="Company Seal"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                Common seal
              </div>
              <div className="text-right">
                <p>For {profile.companyName}.</p>
                {profile.authorizedSignature ? (
                  <div className="h-20 flex justify-end items-center my-2">
                    <img
                      src={profile.authorizedSignature}
                      alt="Authorized Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-24"></div>
                )}
                <p className="font-bold">AUTHORISED.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
