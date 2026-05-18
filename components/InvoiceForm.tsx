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
import { Dropdown } from "./Dropdown";
import { Combobox } from "./Combobox";
import {
  generateNextInvoiceNumber,
  getHighestInvoiceNumber,
} from "../hooks/useInvoices";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import {
  apiCreateInvoice,
  apiUpdateInvoice,
  apiListBankDetails,
  apiListInvoices,
  apiStorageUpload,
  apiGetClientOrders,
  apiGetClientInvoices,
} from "../utils/api";
import DummyPDF from "./DummyPDF";
import { Toast, ToastType } from "./Toast";

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
  value: string | number | undefined;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  fullWidth?: boolean;
  type?: string;
  disabled?: boolean;
  [key: string]: any;
}) => (
  <div className={`flex items-center ${fullWidth ? "w-full" : ""}`}>
    <label htmlFor={name} className="w-1/3 text-sm font-semibold">
      {label}
    </label>
    <span className="px-2">:</span>
    {type === 'textarea' ? (
       <textarea
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
    ) : (
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
    )}
  </div>
);

// This explicit export is what Vite is looking for
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
  const [invoiceNumberError, setInvoiceNumberError] = useState<string | null>(
    null
  );
  const [showEmptyInvoiceModal, setShowEmptyInvoiceModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showInvoiceNumberTip, setShowInvoiceNumberTip] = useState(false);
  const [hasSeenInvoiceNumberTip, setHasSeenInvoiceNumberTip] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({ message: "", type: "success", isVisible: false });
  const [bankDetailsList, setBankDetailsList] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [companySealBase64, setCompanySealBase64] = useState<string>("");
  const [signatureBase64, setSignatureBase64] = useState<string>("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  // Track selected template for Form Layout UI
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");

  // Mapped object of true REMAINING balances: { productName: remainingQuantity }
  const [orderedProductLimits, setOrderedProductLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedTemplate = localStorage.getItem("zenbill_template");
    if (savedTemplate) {
      setSelectedTemplateId(savedTemplate);
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const generateNextInvoiceNumberFromBackend = async (
    companyProfile: CompanyProfile
  ): Promise<string> => {
    try {
      const backendInvoices = await apiListInvoices();
      const invoiceList = Array.isArray(backendInvoices)
        ? backendInvoices
        : Array.isArray(backendInvoices?.data)
        ? backendInvoices.data
        : [];

      const acronym =
        companyProfile.companyAcronym ||
        companyProfile.companyName
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase();

      const financialYearString = getFinancialYearString(new Date());
      const prefix = `${acronym}/${financialYearString}/`;

      const backendInvoicesForPrefix = invoiceList.filter((inv: any) =>
        String(inv.invoiceNumber || "").startsWith(prefix)
      );

      const highestNumber = backendInvoicesForPrefix
        .map((inv: any) => {
          const parts = String(inv.invoiceNumber || "").split("/");
          return parseInt(parts[2] || "0", 10);
        })
        .filter((num) => !isNaN(num))
        .reduce((max, num) => Math.max(max, num), 0);

      const nextNumber = (highestNumber + 1).toString().padStart(3, "0");
      return `${prefix}${nextNumber}`;
    } catch (error) {
      console.warn(
        "Failed to generate invoice number from backend, falling back to local data:",
        error
      );
      return generateNextInvoiceNumber(invoices, companyProfile);
    }
  };

  const getFinancialYearString = (date: Date): string => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const financialYearStart = month >= 4 ? year : year - 1;
    const financialYearEnd = financialYearStart + 1;
    return `${String(financialYearStart).slice(-2)}-${String(
      financialYearEnd
    ).slice(-2)}`;
  };

  useEffect(() => {
    if (invoice.client && invoice.client.id) {
      Promise.all([
        apiGetClientOrders(invoice.client.id),
        apiGetClientInvoices(invoice.client.id)
      ])
        .then(([orderRes, invoiceRes]) => {
          const ordered: Record<string, number> = {};
          const billed: Record<string, number> = {};

          if (orderRes && orderRes.success && Array.isArray(orderRes.data)) {
            orderRes.data.forEach((order: any) => {
              if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  ordered[item.productName] = (ordered[item.productName] || 0) + item.quantity;
                });
              }
            });
          }

          if (invoiceRes && invoiceRes.success && Array.isArray(invoiceRes.data)) {
            invoiceRes.data.forEach((inv: any) => {
              if (existingInvoice && String(inv.id) === String(existingInvoice.id)) {
                return;
              }
              if (Array.isArray(inv.items)) {
                inv.items.forEach((item: any) => {
                  const name = item.description || item.productName;
                  if (name) {
                    billed[name] = (billed[name] || 0) + (Number(item.quantity) || 0);
                  }
                });
              }
            });
          }

          const limits: Record<string, number> = {};
          Object.keys(ordered).forEach((name) => {
            const remaining = ordered[name] - (billed[name] || 0);
            limits[name] = Math.max(0, remaining);
          });
          
          setOrderedProductLimits(limits);
        })
        .catch((err) => {
          console.error("Failed to fetch client orders/invoices:", err);
          setOrderedProductLimits({});
        });
    } else {
      setOrderedProductLimits({});
    }
  }, [invoice.client?.id, existingInvoice]);

  const productOptionsForClient = useMemo(() => {
    if (invoice.client?.id && Object.keys(orderedProductLimits).length > 0) {
      return products
        .filter((p) => orderedProductLimits[p.name] !== undefined)
        .map((p) => ({
          value: p.name,
          label: `${p.name} (Remaining: ${orderedProductLimits[p.name]})`,
        }));
    }
    return products.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }, [products, invoice.client?.id, orderedProductLimits]);

  useEffect(() => {
    (async () => {
      try {
        const body = await apiListBankDetails();
        const list = Array.isArray(body)
          ? body
          : Array.isArray((body as any)?.data)
          ? (body as any).data
          : [];
        setBankDetailsList(list);

        if (!existingInvoice) {
          const activeBankDetail = list.find((bd: any) => bd.active === true);
          if (activeBankDetail) {
            setSelectedBankId(String(activeBankDetail.id));
            const bankDetails = {
              accountName: activeBankDetail.accountName ?? activeBankDetail.account_name ?? "",
              accountNumber: activeBankDetail.accountNumber ?? activeBankDetail.account_number ?? "",
              bankName: activeBankDetail.bankName ?? activeBankDetail.bank_name ?? "",
              branch: activeBankDetail.bankBranch ?? activeBankDetail.branch ?? "",
              ifsc: activeBankDetail.ifscCode ?? activeBankDetail.ifsc ?? "",
            };
            setInvoice((prev) => ({ ...prev, bankDetails }));
          }
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [existingInvoice]);

  useEffect(() => {
    const convertImageToBase64 = async (
      imageUrl: string | undefined,
      isLogo: boolean = false
    ): Promise<string> => {
      if (!imageUrl) return "";
      if (imageUrl.startsWith("data:")) return imageUrl;

      try {
        let absoluteUrl = imageUrl;
        if (imageUrl.startsWith("/api/")) {
          const BASE_URL = "http://localhost:8080";
          absoluteUrl = BASE_URL + imageUrl;
        }

        const headers: HeadersInit = {};
        try {
          const token = localStorage.getItem("zenbill_auth_token");
          if (token) (headers as any)["Authorization"] = `Bearer ${token}`;
        } catch (_) {}

        const response = await fetch(absoluteUrl, { headers });
        if (!response.ok) return "";
        
        const blob = await response.blob();
        const isIco = absoluteUrl.toLowerCase().includes(".ico") || blob.type === "application/octet-stream" || blob.type === "image/x-icon" || blob.type === "image/vnd.microsoft.icon";

        if (isIco && isLogo) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width || 128;
                canvas.height = img.height || 128;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  canvas.toBlob((pngBlob) => {
                    if (pngBlob) {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.onerror = reject;
                      reader.readAsDataURL(pngBlob);
                    } else {
                      reject(new Error("Failed to create PNG blob"));
                    }
                  }, "image/png");
                } else {
                  reject(new Error("Failed to get canvas context"));
                }
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          });
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result) resolve(result);
            else reject(new Error("Failed to read image data"));
          };
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        return "";
      }
    };

    (async () => {
      setLogoBase64(await convertImageToBase64(profile.logo, true));
      setCompanySealBase64(await convertImageToBase64(profile.companySeal, false));
      setSignatureBase64(await convertImageToBase64(profile.authorizedSignature, false));
    })();
  }, [profile.logo, profile.companySeal, profile.authorizedSignature]);

  useEffect(() => {
    if (bankDetailsList.length > 0 && invoice.bankDetails) {
      const matchingBank = bankDetailsList.find(
        (bd) =>
          (bd.accountName ?? bd.account_name) === invoice.bankDetails?.accountName &&
          (bd.accountNumber ?? bd.account_number) === invoice.bankDetails?.accountNumber
      );
      if (matchingBank && String(matchingBank.id) !== selectedBankId) {
        setSelectedBankId(String(matchingBank.id));
      }
    }
  }, [invoice.bankDetails, bankDetailsList, selectedBankId]);

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
      const parts = existingInvoice.invoiceNumber.split("/");
      if (parts.length === 3) {
        setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
        setInvoiceNumberSequential(parts[2]);
      }
    } else {
      setInvoice(emptyInvoice);
      setSameAsBilling(true);
      (async () => {
        try {
          const nextInvoiceNumber = await generateNextInvoiceNumberFromBackend(profile);
          const parts = nextInvoiceNumber.split("/");
          if (parts.length === 3) {
            setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
            setInvoiceNumberSequential(parts[2]);
          }
        } catch (error) {
          const nextInvoiceNumber = generateNextInvoiceNumber(invoices, profile);
          const parts = nextInvoiceNumber.split("/");
          if (parts.length === 3) {
            setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
            setInvoiceNumberSequential(parts[2]);
          }
        }
      })();
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

  const handleClientChange = (selectedValue: string) => {
    const selectedClient = clients.find((c) => c.id === selectedValue);
    if (selectedClient) {
      setInvoice({ ...invoice, client: selectedClient });
    } else {
      setInvoice({ ...invoice, client: emptyInvoice.client });
    }
  };

  const handleShippingClientChange = (selectedValue: string) => {
    const selectedClient = clients.find((c) => c.id === selectedValue);

    if (selectedValue) {
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
    setInvoiceNumberError(null); 
    const { value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, ""); 
    if (numericValue.length <= 3) {
      setInvoiceNumberSequential(numericValue);
      const candidate = `${invoiceNumberPrefix}${numericValue.padStart(3, "0")}`;
      const isDuplicate = invoices.some(
        (inv) => inv.invoiceNumber.toLowerCase() === candidate.toLowerCase()
      );
      const highestNumber = getHighestInvoiceNumber(invoices, invoiceNumberPrefix);
      let newError: string | null = null;
      if (isDuplicate) {
        newError = "Invoice number already exists.";
      } else if (numericValue !== "" && Number(numericValue) <= highestNumber) {
        newError = `Invoice no. must be > ${String(highestNumber).padStart(3, "0")}.`;
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

        if (field === "description") {
          const selectedProduct = products.find((p) => p.name === value);
          if (selectedProduct) {
            updatedItem.hsnCode = selectedProduct.hsnCode || "";
            updatedItem.uom = selectedProduct.uom || "";
          }

          if (invoice.client?.id && orderedProductLimits[value as string] !== undefined) {
            const maxLimit = orderedProductLimits[value as string];
            if (updatedItem.quantity > maxLimit) {
               updatedItem.quantity = maxLimit;
               showToast(`Quantity capped at ${maxLimit} (Remaining Balance)`, "error");
            }
          }
        }

        if (field === "quantity" || field === "unitPrice") {
          let numericValue = value === "" ? 0 : Number(value);
          numericValue = isNaN(numericValue) ? 0 : numericValue;

          if (field === "quantity" && invoice.client?.id && orderedProductLimits[updatedItem.description] !== undefined) {
             const maxLimit = orderedProductLimits[updatedItem.description];
             if (numericValue > maxLimit) {
                numericValue = maxLimit;
                showToast(`Cannot exceed remaining balance of ${maxLimit}.`, "error");
             }
          }
          updatedItem[field] = numericValue;
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

  const handleDeleteItem = (index: number) => {
    setItemToDelete(index);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete !== null) {
      setInvoice({
        ...invoice,
        items: invoice.items.filter((_, i) => i !== itemToDelete),
      });
    }
    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
  };

  const cancelDeleteItem = () => {
    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
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
      const profileForPdf = {
        ...profile,
        logo: logoBase64 || profile.logo || "",
        companySeal: companySealBase64 || profile.companySeal || "",
        authorizedSignature:
          signatureBase64 || profile.authorizedSignature || "",
      };
      const blob = await pdf(
        <DummyPDF invoice={previewInvoiceData} profile={profileForPdf} templateId={selectedTemplateId} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const invoiceNum = previewInvoiceData.invoiceNumber.replace(/\//g, "-");
      const date = new Date(previewInvoiceData.issueDate || Date.now());
      const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${date.getFullYear()}`;
      const billedToName = (previewInvoiceData.client?.name || "")
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

  const generateAndUploadPdf = async (
    invoiceData: Invoice
  ): Promise<string | null> => {
    try {
      const profileForPdf = {
        ...profile,
        logo: logoBase64 || profile.logo || "",
        companySeal: companySealBase64 || profile.companySeal || "",
        authorizedSignature:
          signatureBase64 || profile.authorizedSignature || "",
      };

      const blob = await pdf(
        <DummyPDF invoice={invoiceData} profile={profileForPdf} templateId={selectedTemplateId} />
      ).toBlob();

      const invoiceNum = invoiceData.invoiceNumber.replace(/\//g, "-");
      const date = new Date(invoiceData.issueDate || Date.now());
      const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${date.getFullYear()}`;
      const billedToName = (invoiceData.client?.name || "")
        .replace(/[^a-zA-Z0-9]/g, "-") 
        .replace(/-+/g, "-") 
        .replace(/^-|-$/g, ""); 
      const fileName = `${invoiceNum}-${dateStr}-${billedToName}.pdf`;

      const file = new File([blob], fileName, { type: "application/pdf" });

      const uploadResult: any = await apiStorageUpload(
        file,
        "invoices",
        "document"
      );

      return uploadResult?.url || null;
    } catch (err) {
      console.error("Error generating or uploading PDF:", err);
      return null;
    }
  };

  const proceedWithSubmit = async () => {
    setFormError(null);
    setInvoiceNumberError(null);

    const cleanedInvoiceData = {
      ...invoice,
      items: cleanedItems,
    };

    if (existingInvoice && updateInvoice) {
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
        const pdfUrl = await generateAndUploadPdf(
          cleanedInvoiceData as Invoice
        );
        if (pdfUrl) {
          payload.pdfUrl = pdfUrl;
        }

        await apiUpdateInvoice((existingInvoice as any).id, payload);
        updateInvoice(cleanedInvoiceData as Invoice);
        showToast("Invoice updated successfully!", "success");
        setInvoiceNumberError(null); 

        setTimeout(() => {
          setView("invoices");
        }, 1500);
      } catch (e: any) {
        const errorMessage = e?.message || "Failed to update invoice";
        showToast(errorMessage, "error");

        if (e?.validationErrors && e.validationErrors.invoiceNumber) {
          setInvoiceNumberError(e.validationErrors.invoiceNumber);
        } else if (errorMessage.toLowerCase().includes("invoice number")) {
          setInvoiceNumberError(errorMessage);
        } else {
          setFormError(errorMessage);
        }
      }
    } else {
      const finalSequential = invoiceNumberSequential.padStart(3, "0");
      const fullInvoiceNumber = `${invoiceNumberPrefix}${finalSequential}`;

      try {
        const backendInvoices = await apiListInvoices();
        const invoiceList = Array.isArray(backendInvoices)
          ? backendInvoices
          : Array.isArray(backendInvoices?.data)
          ? backendInvoices.data
          : [];

        const isDuplicate = invoiceList.some(
          (inv: any) =>
            String(inv.invoiceNumber || "").toLowerCase() ===
            fullInvoiceNumber.toLowerCase()
        );
        if (isDuplicate) {
          setInvoiceNumberError("Invoice number already exists.");
          showToast("Invoice number already exists.", "error");
          return;
        }

        const backendInvoicesForPrefix = invoiceList.filter((inv: any) =>
          String(inv.invoiceNumber || "").startsWith(invoiceNumberPrefix)
        );

        const highestNumber = backendInvoicesForPrefix
          .map((inv: any) => {
            const parts = String(inv.invoiceNumber || "").split("/");
            return parseInt(parts[2] || "0", 10);
          })
          .filter((num) => !isNaN(num))
          .reduce((max, num) => Math.max(max, num), 0);

        const currentNumber = parseInt(finalSequential, 10);
        if (!isNaN(currentNumber) && currentNumber <= highestNumber) {
          const errorMsg = `Invoice no. must be > ${String(
            highestNumber
          ).padStart(3, "0")}.`;
          setInvoiceNumberError(errorMsg);
          showToast(errorMsg, "error");
          return;
        }
      } catch (e: any) {
        console.warn("Could not validate invoice number against backend:", e);
      }

      const invoiceDataForPdf = {
        ...cleanedInvoiceData,
        invoiceNumber: fullInvoiceNumber,
        id: "temp-id", 
      } as Invoice;

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
        const pdfUrl = await generateAndUploadPdf(invoiceDataForPdf);
        if (pdfUrl) {
          payload.pdfUrl = pdfUrl;
        }

        await apiCreateInvoice(payload);
        showToast("Invoice created successfully!", "success");
        setInvoiceNumberError(null); 

        setTimeout(() => {
          setView("invoices");
        }, 1500);
      } catch (e: any) {
        const errorMessage = e?.message || "Failed to save invoice";
        showToast(errorMessage, "error");

        if (e?.validationErrors && e.validationErrors.invoiceNumber) {
          setInvoiceNumberError(e.validationErrors.invoiceNumber);
        } else if (errorMessage.toLowerCase().includes("invoice number")) {
          setInvoiceNumberError(errorMessage);
        } else {
          setFormError(errorMessage);
        }
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

  // --- RENDERING OPTIONS FOR CLIENTS DROPDOWN ---
  const clientDropdownOptions = [
    { value: "", label: "Select a client or enter details manually" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  // ========================================================================
  // LAYOUT 1: DEFAULT CLASSIC FORM (The Original Editable View)
  // ========================================================================
  const renderDefaultLayout = () => (
    <div className="border-2 border-black p-4 space-y-2 text-sm bg-white text-black font-sans">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="company-logo" style={{ width: "84px", flexShrink: 0 }}>
          {profile.logo ? (
            <img src={profile.logo} alt="Company Logo" className="h-20 w-20 object-contain" />
          ) : (
            <div className="h-20 w-20 flex items-center justify-center bg-gray-100 rounded">
              <span className="text-sm font-bold">LOGO</span>
            </div>
          )}
        </div>
        <div className="company-name text-center px-4 flex-grow">
          <p className="font-bold text-3xl break-words">{profile.companyName}</p>
          <p className="text-sm">{profile.companyAddress}</p>
          <p className="text-sm">GSTIN: {profile.gstin} &nbsp;&nbsp; PAN: {profile.pan}</p>
        </div>
        <div className="empty-placeholder" style={{ width: "84px", flexShrink: 0, padding: "16px" }}></div>
      </div>
      <h2 className="text-center font-bold text-lg underline">TAX INVOICE</h2>

      {/* Top Section */}
      <div className="grid grid-cols-2 border-t border-b border-black">
        <div className="border-r border-black p-2 space-y-1">
          <div className="flex items-start">
            <label className="w-1/2 font-semibold pt-1">Tax Invoice No.</label>
            <span className="pr-2 pt-1">:</span>
            {existingInvoice ? (
              <span className="pl-2 font-medium">{existingInvoice.invoiceNumber}</span>
            ) : (
              <div>
                <div className={`flex items-center border rounded-md overflow-hidden bg-white ${invoiceNumberError ? "border-red-500" : "border-gray-300"}`}>
                  <span className="px-2 py-1 text-gray-600 bg-gray-100">{invoiceNumberPrefix}</span>
                  <input type="text" value={invoiceNumberSequential} onChange={handleSequentialNumberChange} onFocus={() => { if (!hasSeenInvoiceNumberTip) setShowInvoiceNumberTip(true); }} className="p-1 w-16 text-sm text-gray-900 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" maxLength={3} />
                </div>
                {invoiceNumberError && <p className="text-red-500 text-xs mt-1">{invoiceNumberError}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center"><label className="w-1/2 font-semibold">Date</label>: <input type="date" name="issueDate" value={invoice.issueDate} onChange={handleInputChange} className="p-1 border border-gray-300 w-1/2 bg-white text-gray-900" /></div>
          <div className="flex items-center"><label className="w-1/2 font-semibold">Tax Payable on Reverse Charge</label>: <input type="checkbox" name="taxPayableOnReverseCharge" checked={invoice.taxPayableOnReverseCharge} onChange={handleInputChange} className="ml-2" /></div>
          <div className="flex items-center"><label className="w-1/2 font-semibold">State & Code</label>: <span className="p-1">{`${profile.companyState || ""} ${profile.companyStateCode || ""}`.trim()}</span></div>
        </div>
        <div className="p-2 space-y-1">
          <FormField label="Transport Mode" name="transportMode" value={invoice.transportMode} onChange={handleInputChange} />
          <FormField label="Vehicle No" name="vehicleNo" value={invoice.vehicleNo} onChange={handleInputChange} />
          <FormField label="Date of Supply" name="dateOfSupply" value={invoice.dateOfSupply} onChange={handleInputChange} type="date" />
          <FormField label="Place of Supply" name="placeOfSupply" value={invoice.placeOfSupply} onChange={handleInputChange} />
          <FormField label="Order No" name="orderNo" value={invoice.orderNo} onChange={handleInputChange} />
        </div>
      </div>

      {/* Billed To / Shipped To */}
      <div className="grid grid-cols-2 border-b border-black">
        <div className="border-r border-black p-2 space-y-1">
          <h3 className="font-bold bg-gray-200 text-center mb-2">DETAIL OF RECEIVER (BILLED TO)</h3>
          <div className="mb-2"><Dropdown id="client" value={invoice.client.id} onChange={(v: string) => handleClientChange(v)} placeholder="Select client" options={clientDropdownOptions} searchable={true} className="mt-1" /></div>
          <FormField label="Name" name="name" value={invoice.client.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("client", e)} />
          <div className="flex items-start"><label className="w-1/3 text-sm font-semibold">Address</label><span className="px-2">:</span><textarea name="address" value={invoice.client.address || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNestedChange("client", e)} rows={3} className="flex-grow p-1 border border-gray-300 text-sm bg-white text-gray-900" /></div>
          <FormField label="GSTIN" name="gstin" value={invoice.client.gstin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("client", e)} />
          <FormField label="State & Code" name="state" value={`${invoice.client.state || ""} ${invoice.client.stateCode || ""}`} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("client", e)} />
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold bg-gray-200 text-center flex-grow">DETAIL OF RECEIVER (SHIPPED TO)</h3>
            <div className="flex items-center ml-2 text-xs"><input type="checkbox" id="sameAsBilling" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} className="mr-1" /><label htmlFor="sameAsBilling">Same as billing</label></div>
          </div>
          <div className="mb-2"><Dropdown id="shippingClient" value="" onChange={(v: string) => handleShippingClientChange(v)} disabled={sameAsBilling} placeholder="Select client" options={clientDropdownOptions} searchable={true} className="mt-1" /></div>
          <FormField label="Name" name="name" value={invoice.shippingDetails?.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} />
          <div className="flex items-start"><label className="w-1/3 text-sm font-semibold">Address</label><span className="px-2">:</span><textarea name="address" value={invoice.shippingDetails?.address || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} rows={3} className={`flex-grow p-1 border border-gray-300 text-sm bg-white text-gray-900 ${sameAsBilling ? "bg-gray-100 cursor-not-allowed" : ""}`} /></div>
          <FormField label="GSTIN" name="gstin" value={invoice.shippingDetails?.gstin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} />
          <FormField label="State & Code" name="state" value={`${invoice.shippingDetails?.state || ""} ${invoice.shippingDetails?.stateCode || ""}`} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="grid grid-cols-[3fr,14fr,4fr,4fr,4fr,4fr,5fr,2fr] border-b border-black font-bold text-center">
          <div className="p-1 border-r border-black">S.NO</div><div className="p-1 border-r border-black">DESCRIPTION OF GOODS</div><div className="p-1 border-r border-black">HSN CODE</div><div className="p-1 border-r border-black">UOM</div><div className="p-1 border-r border-black">QUANTITY</div><div className="p-1 border-r border-black">RATE</div><div className="p-1">AMOUNT</div>
        </div>
        <div className="space-y-1">
          {invoice.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[3fr,14fr,4fr,4fr,4fr,4fr,5fr,2fr] items-center">
              <div className="text-center p-1">{index + 1}</div>
              <div className="relative"><Combobox value={item.description} onChange={(value: string) => handleItemChange(index, "description", value)} placeholder="Type item description..." options={productOptionsForClient} className="w-full" /></div>
              <input type="text" placeholder="HSN" value={item.hsnCode || ""} onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)} className="w-full p-1 border border-gray-300 bg-white text-gray-900" />
              <input type="text" placeholder="UOM" value={item.uom || ""} onChange={(e) => handleItemChange(index, "uom", e.target.value)} className="w-full p-1 border border-gray-300 bg-white text-gray-900" />
              <input type="number" placeholder="Qty" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className="w-full p-1 border border-gray-300 bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <input type="number" placeholder="Price" value={item.unitPrice === 0 ? "" : item.unitPrice} onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)} className="w-full p-1 border border-gray-300 bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <p className="text-right p-1">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <button type="button" onClick={() => handleDeleteItem(index)} className="text-red-500 hover:text-red-700 flex justify-center"><TrashIcon /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-transparent rounded-lg hover:bg-blue-100"><PlusIcon className="mr-1 w-4 h-4" /> Add Item</button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 border-t border-b border-black">
        <div className="border-r border-black p-2 flex items-start">
          <span className="w-1/3 text-sm font-semibold">Total Amount in Words INR</span><span className="px-2">:</span><span className="flex-grow text-sm break-words font-medium text-gray-800">{numberToWordsINR(total)}</span>
        </div>
        <div className="p-2 text-sm">
          <div className="flex justify-between"><span className="font-semibold">Total Amount before Tax</span> <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center"><span className="font-semibold w-24">Add: CGST @</span><input type="number" name="cgstRate" value={invoice.cgstRate || ""} onChange={handleInputChange} className="w-16 p-1 border border-gray-300 text-right bg-white text-gray-900" /> %</div>
            <span>₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center"><span className="font-semibold w-24">Add: SGST @</span><input type="number" name="sgstRate" value={invoice.sgstRate || ""} onChange={handleInputChange} className="w-16 p-1 border border-gray-300 text-right bg-white text-gray-900" /> %</div>
            <span>₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center"><span className="font-semibold w-24">Add: IGST @</span><input type="number" name="igstRate" value={invoice.igstRate || ""} onChange={handleInputChange} className="w-16 p-1 border border-gray-300 text-right bg-white text-gray-900" /> %</div>
            <span>₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-t border-gray-400 mt-1 pt-1"><span className="font-semibold">Total Tax Amount</span> <span>₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold border-t border-gray-400 mt-1 pt-1"><span className="font-semibold">Total Amount after Tax</span> <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-1">
        <FormField label="GR/LR NO" name="grLrNo" value={invoice.grLrNo} onChange={handleInputChange} />
        <FormField label="E WAY BILL NO" name="eWayBillNo" value={invoice.eWayBillNo} onChange={handleInputChange} />
        <p className="font-bold underline">OUR BANK DETAIL :</p>
        {bankDetailsList.length > 0 && (
          <div className="mb-2">
            <Dropdown value={selectedBankId} onChange={(selectedId: string) => {
                setSelectedBankId(selectedId);
                const selectedBank = bankDetailsList.find((bd) => String(bd.id) === selectedId);
                if (selectedBank) {
                  setInvoice((prev) => ({
                    ...prev,
                    bankDetails: {
                      accountName: selectedBank.accountName ?? selectedBank.account_name ?? "",
                      accountNumber: selectedBank.accountNumber ?? selectedBank.account_number ?? "",
                      bankName: selectedBank.bankName ?? selectedBank.bank_name ?? "",
                      branch: selectedBank.bankBranch ?? selectedBank.branch ?? "",
                      ifsc: selectedBank.ifscCode ?? selectedBank.ifsc ?? "",
                    }
                  }));
                }
              }} placeholder="Select bank account" options={bankDetailsList.map((bd) => ({ value: String(bd.id), label: `${bd.bankName ?? bd.bank_name} - ${bd.accountNumber ?? bd.account_number}${bd.active === true ? " (Active)" : ""}` }))} searchable={true} className="mb-2" />
          </div>
        )}
        <FormField label="A/C NAME" name="accountName" value={invoice.bankDetails?.accountName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("bankDetails", e)} />
        <FormField label="A/C NO" name="accountNumber" value={invoice.bankDetails?.accountNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("bankDetails", e)} />
        <FormField label="BANK" name="bankName" value={invoice.bankDetails?.bankName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("bankDetails", e)} />
        <FormField label="BRANCH" name="branch" value={invoice.bankDetails?.branch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("bankDetails", e)} />
        <FormField label="IFSC" name="ifsc" value={invoice.bankDetails?.ifsc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange("bankDetails", e)} />
        <div>
          <label className="font-semibold">Terms & Condition for Supply :</label>
          <textarea name="termsAndConditions" value={invoice.termsAndConditions} onChange={handleInputChange} rows={3} className="w-full p-1 border border-gray-300 text-xs bg-white text-gray-900"></textarea>
        </div>
        <div className="grid grid-cols-3 pt-4 text-xs">
          <div>Subject to <input name="jurisdiction" value={invoice.jurisdiction} onChange={handleInputChange} className="w-24 p-1 border border-gray-300 bg-white text-gray-900" /> Jurisdiction</div>
          <div className="text-center">{profile.companySeal && (<div className="h-24 flex items-center justify-center"><img src={profile.companySeal} alt="Company Seal" className="max-h-full max-w-full object-contain" /></div>)}Common seal</div>
          <div className="text-right"><p>For {profile.companyName}.</p>{profile.authorizedSignature ? (<div className="h-20 flex justify-end items-center my-2"><img src={profile.authorizedSignature} alt="Authorized Signature" className="max-h-full max-w-full object-contain" /></div>) : (<div className="h-24"></div>)}<p className="font-bold">AUTHORISED.</p></div>
        </div>
      </div>
    </div>
  );


  // ========================================================================
  // LAYOUT 2: TALLY ERP STYLE FORM (Alternative Editable View)
  // ========================================================================
  const renderTallyLayout = () => (
    <div className="border border-black text-xs bg-white text-black font-sans shadow-sm">
      
      {/* 1. Header Row - Free positioning (Logo Left, Center Details, QR Right) */}
      <div className="border-b border-black p-4 relative min-h-[130px] flex items-center justify-center">
          <div className="absolute left-6 top-6 w-20 h-20 flex items-center justify-start">
              {profile.logo ? (
                 <img src={profile.logo} className="max-h-full max-w-full object-contain" alt="Logo" />
              ) : (
                 <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded border border-gray-200">LOGO</div>
              )}
          </div>
          
          <div className="flex flex-col items-center justify-center text-center px-32 w-full">
              <p className="font-bold text-xl md:text-2xl uppercase tracking-tight leading-none mb-2">{profile.companyName}</p>
              <p className="text-gray-700 text-sm mb-1">{profile.companyAddress}</p>
              <p className="text-gray-700 text-sm mb-1">State: <span className="font-medium">{profile.companyState}</span> | Code: <span className="font-medium">{profile.companyStateCode}</span></p>
              {profile.email && <p className="text-gray-700 text-sm mb-1">Email: {profile.email}</p>}
              <p className="mt-1 text-gray-700 text-sm">PAN No.: <span className="font-bold text-black">{profile.pan}</span> | GSTIN: <span className="font-bold text-black">{profile.gstin}</span></p>
          </div>

          <div className="absolute right-6 top-6 w-20 h-20 border border-gray-300 flex items-center justify-center text-gray-400 text-xs bg-gray-50">
              QR CODE
          </div>
      </div>
      
      {/* 2. TAX INVOICE Title Row */}
      <div className="border-b border-black py-2 bg-gray-50 text-center">
          <h2 className="text-lg font-black tracking-widest uppercase">TAX INVOICE</h2>
      </div>

      {/* 3. Address & Meta Data Block */}
      <div className="flex border-b border-black">
         {/* Left Col (Addresses) */}
         <div className="w-1/2 flex flex-col border-r border-black divide-y divide-black">
            <div className="p-3 flex-1 bg-gray-50/30">
               <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Consignee (Ship to)</p>
                  <div className="flex items-center text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                     <input type="checkbox" id="sameAsBillingTally" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} className="mr-1.5" />
                     <label htmlFor="sameAsBillingTally" className="font-medium text-gray-700 cursor-pointer">Same as billing</label>
                  </div>
               </div>
               <div className="mb-2 shadow-sm"><Dropdown id="shippingClientTally" value="" onChange={(v: string) => handleShippingClientChange(v)} disabled={sameAsBilling} placeholder="Select / Create Client" options={clientDropdownOptions} searchable={true} /></div>
               <input name="name" value={invoice.shippingDetails?.name || ""} onChange={(e) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} className="w-full mt-1.5 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" placeholder="Consignee Name" />
               <textarea name="address" value={invoice.shippingDetails?.address || ""} onChange={(e) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} className="w-full mt-1.5 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" rows={2} placeholder="Consignee Address" />
               <div className="flex gap-2 mt-1.5">
                  <input name="state" value={invoice.shippingDetails?.state || ""} onChange={(e) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} className="w-1/2 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="State" />
                  <input name="gstin" value={invoice.shippingDetails?.gstin || ""} onChange={(e) => handleNestedChange("shippingDetails", e)} disabled={sameAsBilling} className="w-1/2 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="GSTIN" />
               </div>
            </div>
            <div className="p-3 flex-1 bg-gray-50/30">
               <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Buyer (Bill to)</p>
               <div className="mb-2 shadow-sm"><Dropdown id="clientTally" value={invoice.client.id} onChange={(v: string) => handleClientChange(v)} placeholder="Select / Create Client" options={clientDropdownOptions} searchable={true} /></div>
               <input name="name" value={invoice.client.name || ""} onChange={(e) => handleNestedChange("client", e)} className="w-full mt-1.5 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" placeholder="Buyer Name" />
               <textarea name="address" value={invoice.client.address || ""} onChange={(e) => handleNestedChange("client", e)} className="w-full mt-1.5 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" rows={2} placeholder="Buyer Address" />
               <div className="flex gap-2 mt-1.5">
                  <input name="state" value={invoice.client.state || ""} onChange={(e) => handleNestedChange("client", e)} className="w-1/2 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="State" />
                  <input name="gstin" value={invoice.client.gstin || ""} onChange={(e) => handleNestedChange("client", e)} className="w-1/2 p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="GSTIN" />
               </div>
            </div>
         </div>
         {/* Right Col (Meta) */}
         <div className="w-1/2 grid grid-cols-2 divide-x divide-y divide-black bg-gray-50/30">
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Invoice No.</p>
               {existingInvoice ? <p className="font-bold text-sm mt-1">{existingInvoice.invoiceNumber}</p> : (
                  <div className="flex items-center mt-1 bg-white border border-gray-300 rounded-sm overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="text-gray-600 bg-gray-100 px-1.5 py-1 text-xs border-r border-gray-200">{invoiceNumberPrefix}</span>
                    <input value={invoiceNumberSequential} onChange={handleSequentialNumberChange} className="w-full p-1 text-sm outline-none" maxLength={3} />
                  </div>
               )}
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Dated</p>
               <input type="date" name="issueDate" value={invoice.issueDate} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Delivery Note</p>
               <input name="grLrNo" value={invoice.grLrNo} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Mode/Terms of Payment</p>
               <input className="w-full border border-gray-200 p-1 mt-1 rounded-sm bg-gray-100 text-gray-400 cursor-not-allowed" disabled value="-" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Reference No. & Date.</p>
               <input className="w-full border border-gray-200 p-1 mt-1 rounded-sm bg-gray-100 text-gray-400 cursor-not-allowed" disabled value="-" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Other Reference(s)</p>
               <input className="w-full border border-gray-200 p-1 mt-1 rounded-sm bg-gray-100 text-gray-400 cursor-not-allowed" disabled value="-" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Buyer's Order No.</p>
               <input name="orderNo" value={invoice.orderNo} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Dated</p>
               <input className="w-full border border-gray-200 p-1 mt-1 rounded-sm bg-gray-100 text-gray-400 cursor-not-allowed" disabled value="-" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Dispatch Doc No.</p>
               <input name="eWayBillNo" value={invoice.eWayBillNo} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Delivery Note Date</p>
               <input type="date" name="dateOfSupply" value={invoice.dateOfSupply} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Dispatched through</p>
               <input name="transportMode" value={invoice.transportMode} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Destination</p>
               <input name="placeOfSupply" value={invoice.placeOfSupply} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Bill of Lading/LR-RR No.</p>
               <input name="grLrNo" value={invoice.grLrNo} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Motor Vehicle No.</p>
               <input name="vehicleNo" value={invoice.vehicleNo} onChange={handleInputChange} className="w-full border border-gray-300 p-1 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="p-2 col-span-2 flex flex-col justify-center">
               <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Terms of Delivery</p>
               <input name="termsAndConditions" value={invoice.termsAndConditions} onChange={handleInputChange} className="w-full border border-gray-300 p-1.5 mt-1 rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
         </div>
      </div>

      {/* 4. Items Table Header */}
      <div className="flex bg-gray-100 border-b border-black font-bold text-center divide-x divide-black text-[11px] shadow-sm">
         <div className="w-[5%] p-1.5 py-2">Sl No.</div>
         <div className="w-[35%] p-1.5 py-2">Description of Goods</div>
         <div className="w-[12%] p-1.5 py-2">HSN/SAC</div>
         <div className="w-[12%] p-1.5 py-2">Quantity</div>
         <div className="w-[12%] p-1.5 py-2">Rate</div>
         <div className="w-[8%] p-1.5 py-2">Per</div>
         <div className="w-[16%] p-1.5 py-2">Amount</div>
      </div>

      {/* 5. Items List */}
      <div className="divide-y divide-gray-200 border-b border-black">
         {invoice.items.map((item, index) => (
            <div key={item.id} className="flex divide-x divide-black items-center group hover:bg-gray-50 transition-colors">
               <div className="w-[5%] p-1 text-center font-medium text-gray-600">{index + 1}</div>
               <div className="w-[35%] p-1.5 relative">
                  <Combobox value={item.description} onChange={(value) => handleItemChange(index, "description", value)} placeholder="Search or type product name..." options={productOptionsForClient} className="w-full" />
               </div>
               <div className="w-[12%] p-1.5"><input value={item.hsnCode || ""} onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)} className="w-full border border-gray-300 p-1 rounded-sm outline-none focus:border-blue-500 text-center" /></div>
               <div className="w-[12%] p-1.5"><input type="number" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className="w-full border border-gray-300 p-1 rounded-sm outline-none focus:border-blue-500 text-right" /></div>
               <div className="w-[12%] p-1.5"><input type="number" value={item.unitPrice === 0 ? "" : item.unitPrice} onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)} className="w-full border border-gray-300 p-1 rounded-sm outline-none focus:border-blue-500 text-right" /></div>
               <div className="w-[8%] p-1.5"><input value={item.uom || ""} onChange={(e) => handleItemChange(index, "uom", e.target.value)} className="w-full border border-gray-300 p-1 rounded-sm outline-none focus:border-blue-500 text-center uppercase" /></div>
               <div className="w-[16%] p-1.5 flex justify-between items-center bg-gray-50/50">
                  <span className="text-right flex-1 pr-2 font-bold text-gray-800">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <button type="button" onClick={() => handleDeleteItem(index)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
               </div>
            </div>
         ))}
      </div>
      <div className="p-2 border-b border-black bg-gray-50 flex justify-center">
         <button type="button" onClick={addItem} className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-gray-800 rounded shadow-sm hover:bg-gray-700 transition-colors"><PlusIcon className="mr-1.5 w-3.5 h-3.5" /> ADD NEW ROW</button>
      </div>

      {/* 6. Total Row */}
      <div className="flex border-b border-black divide-x divide-black bg-gray-100">
         <div className="w-[84%] p-3 flex justify-between items-center">
            <div className="flex gap-4 items-center bg-white p-1.5 rounded border border-gray-300 shadow-sm">
              <div className="flex items-center"><span className="text-gray-600 font-semibold mr-2 text-[10px] uppercase">CGST %</span><input type="number" name="cgstRate" value={invoice.cgstRate || ""} onChange={handleInputChange} className="w-14 border border-gray-300 p-1 rounded-sm outline-none text-right font-bold focus:border-blue-500" /></div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="flex items-center"><span className="text-gray-600 font-semibold mr-2 text-[10px] uppercase">SGST %</span><input type="number" name="sgstRate" value={invoice.sgstRate || ""} onChange={handleInputChange} className="w-14 border border-gray-300 p-1 rounded-sm outline-none text-right font-bold focus:border-blue-500" /></div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="flex items-center"><span className="text-gray-600 font-semibold mr-2 text-[10px] uppercase">IGST %</span><input type="number" name="igstRate" value={invoice.igstRate || ""} onChange={handleInputChange} className="w-14 border border-gray-300 p-1 rounded-sm outline-none text-right font-bold focus:border-blue-500" /></div>
            </div>
            <span className="font-black text-sm uppercase tracking-widest">Total</span>
         </div>
         <div className="w-[16%] p-3 text-right font-black text-sm flex items-center justify-end bg-yellow-50">
            ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
         </div>
      </div>

      {/* 7. Amount in words */}
      <div className="p-3 border-b border-black bg-gray-50/50">
         <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Amount Chargeable (in words)</p>
         <p className="font-bold text-sm tracking-wide">{numberToWordsINR(total)}</p>
      </div>

      {/* 8. Taxes breakdown */}
      <div className="flex border-b border-black divide-x divide-black bg-gray-100 font-bold text-center text-[10px]">
          <div className="w-[20%] p-1.5 py-2">HSN/SAC</div>
          <div className="w-[20%] p-1.5 py-2">Taxable Value</div>
          <div className="w-[20%] p-1.5 py-2">CGST Amount</div>
          <div className="w-[20%] p-1.5 py-2">SGST Amount</div>
          <div className="w-[20%] p-1.5 py-2">Total Tax Amount</div>
      </div>
      <div className="flex border-b border-black divide-x divide-black text-center text-[11px] items-center">
          <div className="w-[20%] p-2 font-medium">As per items</div>
          <div className="w-[20%] p-2 text-right">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="w-[20%] p-2 text-right">₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="w-[20%] p-2 text-right">₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="w-[20%] p-2 text-right font-bold bg-gray-50">₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      {/* 9. Bank & Tax Details */}
      <div className="flex border-b border-black divide-x divide-black bg-gray-50/30">
         <div className="w-1/2 p-4">
            <p className="font-bold uppercase tracking-wider text-[10px] text-gray-600 mb-3 border-b border-gray-300 pb-1 inline-block">Company's Bank Details</p>
            {bankDetailsList.length > 0 && (
              <div className="mb-3"><Dropdown value={selectedBankId} onChange={(selectedId: string) => {
                setSelectedBankId(selectedId);
                const selectedBank = bankDetailsList.find((bd) => String(bd.id) === selectedId);
                if (selectedBank) {
                  setInvoice((prev) => ({
                    ...prev,
                    bankDetails: {
                      accountName: selectedBank.accountName ?? selectedBank.account_name ?? "",
                      accountNumber: selectedBank.accountNumber ?? selectedBank.account_number ?? "",
                      bankName: selectedBank.bankName ?? selectedBank.bank_name ?? "",
                      branch: selectedBank.bankBranch ?? selectedBank.branch ?? "",
                      ifsc: selectedBank.ifscCode ?? selectedBank.ifsc ?? "",
                    }
                  }));
                }
              }} placeholder="Select configured bank account" options={bankDetailsList.map((bd) => ({ value: String(bd.id), label: `${bd.bankName ?? bd.bank_name} - ${bd.accountNumber ?? bd.account_number}${bd.active === true ? " (Active)" : ""}` }))} searchable={true} /></div>
            )}
            <div className="grid grid-cols-[100px_1fr] gap-y-2 items-center text-xs">
               <span className="text-gray-600 font-semibold">Bank Name</span>
               <input name="bankName" value={invoice.bankDetails?.bankName || ""} onChange={(e) => handleNestedChange("bankDetails", e)} className="border border-gray-300 p-1 rounded-sm outline-none" />
               <span className="text-gray-600 font-semibold">A/c Name</span>
               <input name="accountName" value={invoice.bankDetails?.accountName || ""} onChange={(e) => handleNestedChange("bankDetails", e)} className="border border-gray-300 p-1 rounded-sm outline-none font-bold" />
               <span className="text-gray-600 font-semibold">A/c No.</span>
               <input name="accountNumber" value={invoice.bankDetails?.accountNumber || ""} onChange={(e) => handleNestedChange("bankDetails", e)} className="border border-gray-300 p-1 rounded-sm outline-none font-bold tracking-widest" />
               <span className="text-gray-600 font-semibold">Branch & IFSC</span>
               <div className="flex gap-2">
                  <input name="branch" value={invoice.bankDetails?.branch || ""} onChange={(e) => handleNestedChange("bankDetails", e)} className="border border-gray-300 p-1 rounded-sm outline-none w-1/2" placeholder="Branch" />
                  <input name="ifsc" value={invoice.bankDetails?.ifsc || ""} onChange={(e) => handleNestedChange("bankDetails", e)} className="border border-gray-300 p-1 rounded-sm outline-none w-1/2 font-bold" placeholder="IFSC" />
               </div>
            </div>
         </div>
         <div className="w-1/2 p-4">
            <p className="font-bold uppercase tracking-wider text-[10px] text-gray-600 mb-3 border-b border-gray-300 pb-1 inline-block">Company's Tax Details</p>
            <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
               <span className="text-gray-600 font-semibold">PAN</span><span className="font-black tracking-widest">{profile.pan}</span>
               <span className="text-gray-600 font-semibold">GSTIN</span><span className="font-black tracking-widest">{profile.gstin}</span>
            </div>
         </div>
      </div>

      {/* 10. Declaration & Signature */}
      <div className="flex divide-x divide-black bg-white">
         <div className="w-1/2 p-4 flex flex-col">
            <p className="font-bold uppercase tracking-wider text-[10px] text-gray-600 mb-2 border-b border-gray-300 pb-1 inline-block">Declaration</p>
            <textarea name="termsAndConditions" value={invoice.termsAndConditions} onChange={handleInputChange} rows={4} className="w-full border border-gray-300 p-2 rounded-sm outline-none flex-1 focus:ring-1 focus:ring-blue-500 leading-relaxed text-[11px]" />
         </div>
         <div className="w-1/2 p-4 flex flex-col justify-between items-end border-t border-transparent">
            <p className="font-bold text-sm">for {profile.companyName}</p>
            {profile.authorizedSignature ? (
               <img src={profile.authorizedSignature} alt="Signature" className="h-20 object-contain mt-4 mb-2" />
            ) : <div className="h-20 mt-4 mb-2 flex items-center justify-center border border-dashed border-gray-200 w-48 text-[10px] text-gray-300">Authorized Signature Area</div>}
            <p className="font-bold uppercase tracking-widest text-[10px] text-gray-500 border-t border-gray-300 pt-1 w-48 text-right">Authorised Signatory</p>
         </div>
      </div>
      <div className="bg-gray-100 p-1 text-center border-t border-black text-[9px] text-gray-400 font-medium tracking-widest uppercase">
        Editable Tally Workspace • Form Layout Adaption Active
      </div>
    </div>
  );

  return (
    <div
      className="bg-gray-50 p-4 md:p-6 rounded-xl shadow-inner border border-gray-200"
    >
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={5000}
      />
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
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDeleteItem}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">Final PDF Preview</h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Layout: {selectedTemplateId === 'tally' ? 'Tally ERP' : 'Default Standard'}</p>
                 </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleDownloadPdf} className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-700 rounded-xl p-2.5 transition-all focus:outline-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto bg-slate-200/60 p-4 md:p-8 flex-1">
              <div className="flex justify-center max-w-4xl mx-auto">
                <div className="w-full h-[75vh] bg-white shadow-2xl rounded overflow-hidden border border-slate-300 ring-1 ring-slate-900/5">
                  <PDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar>
                    <DummyPDF
                      invoice={previewInvoiceData}
                      profile={{
                        ...profile,
                        logo: logoBase64 || profile.logo || "",
                        companySeal: companySealBase64 || profile.companySeal || "",
                        authorizedSignature: signatureBase64 || profile.authorizedSignature || "",
                      }}
                      templateId={selectedTemplateId}
                    />
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
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
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
      <form onSubmit={handleSubmit} className="space-y-4 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                {existingInvoice ? "Edit Invoice Workspace" : "Create Invoice Workspace"}
                {selectedTemplateId === 'tally' && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">Tally Form Active</span>
                )}
             </h2>
             <p className="text-sm text-gray-500 font-medium mt-1">Fill out the document below. The layout adapts to your selected Template.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("invoices")}
              className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center shadow-sm"
            >
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View PDF
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-md transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {existingInvoice ? "Save Changes" : "Save Invoice"}
            </button>
          </div>
        </div>

        {/* =====================================================
            CONDITIONAL RENDERING BASED ON SELECTED TEMPLATE 
            ===================================================== */}
        {selectedTemplateId === "tally" ? renderTallyLayout() : renderDefaultLayout()}

      </form>
    </div>
  );
};