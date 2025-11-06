import React, { useState, useEffect } from "react";
import { CompanyProfile } from "../types";
import {
  apiGetCompany,
  apiUpdateCompany,
  apiStorageUpload,
  apiListBankDetails,
  apiCreateBankDetail,
  apiUpdateBankDetail,
  apiDeleteBankDetail,
} from "../utils/api";
import { Toast, ToastType } from "./Toast";

interface ProfileProps {
  profile: CompanyProfile;
  updateProfile: (profile: CompanyProfile) => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, updateProfile }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  // Uploads are now routed via backend using Supabase service role for private storage
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | number | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: string | number;
    name?: string;
  }>({ open: false });

  const generateAcronym = (companyName: string): string => {
    if (!companyName || !companyName.trim()) return "";
    return companyName
      .trim()
      .split(/\s+/)
      .map((word) => {
        // Find the first alphabetic character in the word
        const firstLetter = word
          .split("")
          .find((char) => /[a-zA-Z]/.test(char));
        return firstLetter ? firstLetter.toUpperCase() : "";
      })
      .filter((letter) => letter !== "") // Remove empty strings from words with no letters
      .join("");
  };

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const body = await apiGetCompany();
        const d: any = (body && (body as any).data) || body;
        if (!d) return;

        // Backend returns proxy URLs (relative paths like /api/v1/storage/image?...)
        // Convert them to ABSOLUTE URLs pointing to backend
        const BASE_URL = "http://localhost:8080";
        const toAbsoluteUrl = (url?: string) => {
          if (!url) return url;
          // If it starts with /api/, prepend backend URL
          if (url.startsWith("/api/")) return BASE_URL + url;
          // If it's already absolute, return as-is
          return url;
        };

        setFormData((prev) => {
          const companyName = d.companyName || prev.companyName;
          const companyAcronym = d.invoicePrefix || prev.companyAcronym;
          // Auto-generate acronym if company name exists but acronym is empty
          const finalAcronym =
            companyAcronym ||
            (companyName ? generateAcronym(companyName) : prev.companyAcronym);
          return {
            ...prev,
            companyName,
            companyAddress: d.companyAddress || prev.companyAddress,
            gstin: d.gstinNo || prev.gstin,
            pan: d.panNumber || prev.pan,
            companyState: d.state || prev.companyState,
            companyStateCode: d.code || prev.companyStateCode,
            logo: toAbsoluteUrl(d.companyLogoUrl) || prev.logo,
            companySeal: toAbsoluteUrl(d.companyStampUrl) || prev.companySeal,
            authorizedSignature:
              toAbsoluteUrl(d.signatureUrl) || prev.authorizedSignature,
            companyAcronym: finalAcronym,
          };
        });
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const body = await apiListBankDetails();
        const list = Array.isArray(body)
          ? body
          : Array.isArray((body as any)?.data)
          ? (body as any).data
          : [];
        setBankDetails(list);
      } catch (_) {}
    })();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Handle company acronym based on company name changes
      if (name === "companyName") {
        if (!value || !value.trim()) {
          // Clear acronym when company name is emptied
          updated.companyAcronym = "";
        } else {
          // Auto-generate acronym on every keystroke when company name changes
          const generatedAcronym = generateAcronym(value);
          if (generatedAcronym) {
            updated.companyAcronym = generatedAcronym;
          } else {
            updated.companyAcronym = "";
          }
        }
      }
      return updated;
    });
  };

  // Bank list handlers - use upper section for add/edit
  const addNewBank = () => {
    setSelectedBankId(null);
    setFormData((prev) => ({
      ...prev,
      defaultBankDetails: {
        bankName: "",
        accountName: "",
        accountNumber: "",
        branch: "",
        ifsc: "",
      },
    }));
  };

  const showToast = (message: string, type: ToastType) => {
    // Automatically replace any existing toast with the new one
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSaveBankDetails = async () => {
    try {
      const payload = {
        bankName: formData.defaultBankDetails.bankName || "",
        accountName: formData.defaultBankDetails.accountName || "",
        accountNumber: formData.defaultBankDetails.accountNumber || "",
        branch: formData.defaultBankDetails.branch || "",
        ifsc: (formData.defaultBankDetails.ifsc || "").toUpperCase().trim(),
      };
      if (payload.ifsc.length !== 11) {
        showToast("IFSC code must be 11 characters", "error");
        return;
      }
      if (selectedBankId != null) {
        await apiUpdateBankDetail(selectedBankId, payload);
        showToast("Bank details updated successfully", "success");
      } else {
        await apiCreateBankDetail(payload);
        showToast("Bank details added successfully", "success");
      }
      const body = await apiListBankDetails();
      const list = Array.isArray(body)
        ? body
        : Array.isArray((body as any)?.data)
        ? (body as any).data
        : [];
      setBankDetails(list);
      setSelectedBankId(null);
      // Clear form after successful save
      setFormData((prev) => ({
        ...prev,
        defaultBankDetails: {
          bankName: "",
          accountName: "",
          accountNumber: "",
          branch: "",
          ifsc: "",
        },
      }));
    } catch (err: any) {
      showToast(err?.message || "Failed to save bank details", "error");
    }
  };

  const startEditBank = (bd: any) => {
    setSelectedBankId(bd.id);
    setFormData((prev) => ({
      ...prev,
      defaultBankDetails: {
        bankName: bd.bankName ?? bd.bank_name ?? "",
        accountName: bd.accountName ?? bd.account_name ?? "",
        accountNumber: bd.accountNumber ?? bd.account_number ?? "",
        branch: bd.bankBranch ?? bd.branch ?? "",
        ifsc: bd.ifscCode ?? bd.ifsc ?? "",
      },
    }));
    // Scroll to Bank Details form
    setTimeout(() => {
      const bankDetailsForm = document.getElementById("bank-details-form");
      if (bankDetailsForm) {
        bankDetailsForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const confirmDeleteBank = (bd: any) => {
    setDeleteConfirm({
      open: true,
      id: bd.id,
      name: bd.bankName ?? bd.bank_name,
    });
  };

  const performDeleteBank = async () => {
    if (!deleteConfirm.id) return;
    try {
      await apiDeleteBankDetail(deleteConfirm.id);
      const body = await apiListBankDetails();
      const list = Array.isArray(body)
        ? body
        : Array.isArray((body as any)?.data)
        ? (body as any).data
        : [];
      setBankDetails(list);
      showToast("Bank detail deleted successfully", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete", "error");
    } finally {
      setDeleteConfirm({ open: false });
    }
  };

  const handleToggleActive = async (
    bankDetailId: string | number,
    currentActive: boolean
  ) => {
    try {
      // Find the bank detail to get all its data
      const bankDetail = bankDetails.find((bd) => bd.id === bankDetailId);
      if (!bankDetail) return;

      const payload = {
        bankName: bankDetail.bankName ?? bankDetail.bank_name ?? "",
        accountName: bankDetail.accountName ?? bankDetail.account_name ?? "",
        accountNumber:
          bankDetail.accountNumber ?? bankDetail.account_number ?? "",
        branch: bankDetail.bankBranch ?? bankDetail.branch ?? "",
        ifsc: bankDetail.ifscCode ?? bankDetail.ifsc ?? "",
        active: !currentActive, // Toggle active status
      };

      await apiUpdateBankDetail(bankDetailId, payload);
      showToast(
        `Bank detail ${
          !currentActive ? "activated" : "deactivated"
        } successfully`,
        "success"
      );

      // Refresh the list
      const body = await apiListBankDetails();
      const list = Array.isArray(body)
        ? body
        : Array.isArray((body as any)?.data)
        ? (body as any).data
        : [];
      setBankDetails(list);
    } catch (err: any) {
      showToast(err?.message || "Failed to update bank detail status", "error");
    }
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      defaultBankDetails: {
        ...prev.defaultBankDetails,
        [name]: value,
      },
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const d: any = await apiStorageUpload(file, "company/logo", "document");
      const BASE_URL = "http://localhost:8080";
      // Backend returns relative URL like /api/v1/storage/image?...&token=JWT
      let relativeUrl = d?.url; // Keep relative for DB storage
      let absoluteUrl = relativeUrl;
      if (absoluteUrl && absoluteUrl.startsWith("/api/")) {
        absoluteUrl = BASE_URL + absoluteUrl;
      }
      // Store absolute URL in state for immediate display, but save relative to DB
      setFormData((prev) => ({ ...prev, logo: absoluteUrl || prev.logo }));
      showToast("Logo uploaded successfully", "success");
    } catch (_) {
      showToast("Logo upload failed", "error");
    }
  };

  const handleSealChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const d: any = await apiStorageUpload(file, "company/stamp", "document");
      const BASE_URL = "http://localhost:8080";
      let absoluteUrl = d?.url;
      if (absoluteUrl && absoluteUrl.startsWith("/api/")) {
        absoluteUrl = BASE_URL + absoluteUrl;
      }
      setFormData((prev) => ({
        ...prev,
        companySeal: absoluteUrl || prev.companySeal,
      }));
      showToast("Stamp uploaded successfully", "success");
    } catch (_) {
      showToast("Stamp upload failed", "error");
    }
  };

  const handleSignatureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const d: any = await apiStorageUpload(
        file,
        "company/signature",
        "document"
      );
      const BASE_URL = "http://localhost:8080";
      let absoluteUrl = d?.url;
      if (absoluteUrl && absoluteUrl.startsWith("/api/")) {
        absoluteUrl = BASE_URL + absoluteUrl;
      }
      setFormData((prev) => ({
        ...prev,
        authorizedSignature: absoluteUrl || prev.authorizedSignature,
      }));
      showToast("Signature uploaded successfully", "success");
    } catch (_) {
      showToast("Signature upload failed", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required company fields only
    const missingFields: string[] = [];
    let firstMissingFieldId: string | null = null;

    if (!formData.companyName?.trim()) {
      missingFields.push("Company Name");
      if (!firstMissingFieldId) firstMissingFieldId = "companyName";
    }
    if (!formData.companyAddress?.trim()) {
      missingFields.push("Company Address");
      if (!firstMissingFieldId) firstMissingFieldId = "companyAddress";
    }
    if (!formData.gstin?.trim()) {
      missingFields.push("GSTIN");
      if (!firstMissingFieldId) firstMissingFieldId = "gstin";
    }
    if (!formData.pan?.trim()) {
      missingFields.push("PAN");
      if (!firstMissingFieldId) firstMissingFieldId = "pan";
    }
    if (!formData.companyState?.trim()) {
      missingFields.push("State");
      if (!firstMissingFieldId) firstMissingFieldId = "companyState";
    }
    if (!formData.companyStateCode?.trim()) {
      missingFields.push("State Code");
      if (!firstMissingFieldId) firstMissingFieldId = "companyStateCode";
    }

    if (missingFields.length > 0) {
      showToast(
        `Please fill required fields: ${missingFields.join(", ")}`,
        "error"
      );
      // Focus on the first missing field
      if (firstMissingFieldId) {
        setTimeout(() => {
          const field = document.getElementById(firstMissingFieldId!);
          if (field) {
            field.focus();
            field.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
      return;
    }

    try {
      const BASE_URL = "http://localhost:8080";

      // Extract just the storage path from proxy URLs before saving
      const extractPath = (url?: string) => {
        if (!url) return "";

        // Strip BASE_URL if present
        let relativeUrl = url;
        if (relativeUrl.startsWith(BASE_URL)) {
          relativeUrl = relativeUrl.substring(BASE_URL.length);
        }

        // If it's a proxy URL, extract just the path parameter
        if (relativeUrl.includes("/api/v1/storage/image?")) {
          const urlParams = new URLSearchParams(relativeUrl.split("?")[1]);
          const bucket = urlParams.get("bucket") || "document";
          const path = urlParams.get("path");
          if (path) {
            return `${bucket}/${path}`; // Save as "document/company/logo/uuid.png"
          }
        }

        return relativeUrl;
      };

      const payload = {
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        city: "",
        state: formData.companyState || "",
        code: formData.companyStateCode || "",
        gstinNo: formData.gstin,
        panNumber: formData.pan,
        companyLogoUrl: extractPath(formData.logo),
        companyStampUrl: extractPath(formData.companySeal),
        signatureUrl: extractPath(formData.authorizedSignature),
        invoicePrefix: formData.companyAcronym || "",
      };
      await apiUpdateCompany(payload);
      updateProfile(formData);
      showToast("Company details saved successfully!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to save company details", "error");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 max-w-4xl mx-auto">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
      <h2 className="text-2xl font-bold text-gray-800">Company Profile</h2>
      <p className="text-gray-500 mt-1 mb-6">
        Update your company information and branding.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label
              htmlFor="logo-upload"
              className="block text-sm font-medium text-gray-700"
            >
              Company Logo
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="w-24 h-24 rounded-md border border-gray-300 flex items-center justify-center overflow-hidden">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Logo</span>
                )}
              </div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Change
              </label>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700"
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="companyAcronym"
                className="block text-sm font-medium text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <span>Company Acronym (for Invoices)</span>
                  <div className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64">
                      <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg">
                        <p>
                          This acronym is used in invoice numbers. Default will
                          be the first letter of every word in your company
                          name.
                        </p>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                name="companyAcronym"
                id="companyAcronym"
                value={formData.companyAcronym}
                onChange={handleInputChange}
                placeholder={
                  formData.companyName
                    ? `Default: ${generateAcronym(formData.companyName)}`
                    : "e.g., PRM"
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="companyAddress"
                className="block text-sm font-medium text-gray-700"
              >
                Company Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="companyAddress"
                id="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                rows={2}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <div>
            <label
              htmlFor="seal-upload"
              className="block text-sm font-medium text-gray-700"
            >
              Company Seal / Stamp
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="w-24 h-24 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden">
                {formData.companySeal ? (
                  <img
                    src={formData.companySeal}
                    alt="Company Seal"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Seal</span>
                )}
              </div>
              <input
                type="file"
                id="seal-upload"
                accept="image/*"
                onChange={handleSealChange}
                className="hidden"
              />
              <label
                htmlFor="seal-upload"
                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Change
              </label>
            </div>
          </div>
          <div>
            <label
              htmlFor="signature-upload"
              className="block text-sm font-medium text-gray-700"
            >
              Authorized Signature (Optional)
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="w-48 h-24 rounded-md border border-gray-300 flex items-center justify-center overflow-hidden">
                {formData.authorizedSignature ? (
                  <img
                    src={formData.authorizedSignature}
                    alt="Authorized Signature"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Signature</span>
                )}
              </div>
              <input
                type="file"
                id="signature-upload"
                accept="image/*"
                onChange={handleSignatureChange}
                className="hidden"
              />
              <label
                htmlFor="signature-upload"
                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Change
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <div>
            <label
              htmlFor="gstin"
              className="block text-sm font-medium text-gray-700"
            >
              GSTIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="gstin"
              id="gstin"
              value={formData.gstin}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="pan"
              className="block text-sm font-medium text-gray-700"
            >
              PAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pan"
              id="pan"
              value={formData.pan}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="companyState"
              className="block text-sm font-medium text-gray-700"
            >
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyState"
              id="companyState"
              value={formData.companyState || ""}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="companyStateCode"
              className="block text-sm font-medium text-gray-700"
            >
              State Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyStateCode"
              id="companyStateCode"
              value={formData.companyStateCode || ""}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="flex justify-end items-center pt-6 border-t">
          <div className="relative group">
            {(() => {
              const missingFields: string[] = [];
              if (!formData.companyName?.trim())
                missingFields.push("Company Name");
              if (!formData.companyAddress?.trim())
                missingFields.push("Company Address");
              if (!formData.gstin?.trim()) missingFields.push("GSTIN");
              if (!formData.pan?.trim()) missingFields.push("PAN");
              if (!formData.companyState?.trim()) missingFields.push("State");
              if (!formData.companyStateCode?.trim())
                missingFields.push("State Code");
              const isDisabled = missingFields.length > 0;

              return (
                <>
                  <button
                    type="submit"
                    disabled={isDisabled}
                    className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isDisabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    save company Details
                  </button>
                  {isDisabled && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg max-w-xs">
                        <p className="font-semibold mb-1">
                          Please fill required fields:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {missingFields.map((field, index) => (
                            <li key={index}>{field}</li>
                          ))}
                        </ul>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div id="bank-details-form">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">Bank Details</h3>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="accountName"
                className="block text-sm font-medium text-gray-700"
              >
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountName"
                id="accountName"
                value={formData.defaultBankDetails.accountName}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountNumber"
                id="accountNumber"
                value={formData.defaultBankDetails.accountNumber}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="bankName"
                className="block text-sm font-medium text-gray-700"
              >
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bankName"
                id="bankName"
                value={formData.defaultBankDetails.bankName}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700"
              >
                Branch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="branch"
                id="branch"
                value={formData.defaultBankDetails.branch}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="ifsc"
                className="block text-sm font-medium text-gray-700"
              >
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ifsc"
                id="ifsc"
                value={formData.defaultBankDetails.ifsc}
                onChange={handleBankDetailsChange}
                maxLength={11}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center pt-6 border-t">
          <div className="relative group">
            {(() => {
              const missingFields: string[] = [];
              if (!formData.defaultBankDetails.bankName)
                missingFields.push("Bank Name");
              if (!formData.defaultBankDetails.accountName)
                missingFields.push("Account Name");
              if (!formData.defaultBankDetails.accountNumber)
                missingFields.push("Account Number");
              if (!formData.defaultBankDetails.branch)
                missingFields.push("Branch");
              if (!formData.defaultBankDetails.ifsc)
                missingFields.push("IFSC Code");
              const isDisabled = missingFields.length > 0;

              return (
                <>
                  <button
                    type="button"
                    onClick={handleSaveBankDetails}
                    disabled={isDisabled}
                    className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isDisabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {selectedBankId != null
                      ? "Edit Bank Details"
                      : "Add Bank Details"}
                  </button>
                  {isDisabled && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg max-w-xs">
                        <p className="font-semibold mb-1">
                          Please fill required fields:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {missingFields.map((field, index) => (
                            <li key={index}>{field}</li>
                          ))}
                        </ul>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Saved Bank Details List */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">
            Saved Bank Details
          </h3>
          {/* Removed inline add/edit form; using upper Bank Details inputs */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Bank</th>
                  <th className="px-6 py-3">Account Name</th>
                  <th className="px-6 py-3">Account No</th>
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-6 py-3">IFSC</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Sort bank details: active accounts first
                  const sortedBankDetails = [...bankDetails].sort((a, b) => {
                    const aActive = a.active === true;
                    const bActive = b.active === true;
                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;
                    return 0;
                  });

                  return sortedBankDetails.map((bd) => {
                    const isActive = bd.active === true;
                    return (
                      <tr
                        key={bd.id}
                        className={`bg-white border-b hover:bg-gray-50 ${
                          isActive ? "bg-green-50" : ""
                        }`}
                      >
                        <td className="px-6 py-3">
                          {bd.bankName ?? bd.bank_name}
                        </td>
                        <td className="px-6 py-3">
                          {bd.accountName ?? bd.account_name}
                        </td>
                        <td className="px-6 py-3">
                          {bd.accountNumber ?? bd.account_number}
                        </td>
                        <td className="px-6 py-3">
                          {bd.bankBranch ?? bd.branch}
                        </td>
                        <td className="px-6 py-3">{bd.ifscCode ?? bd.ifsc}</td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(bd.id, isActive)}
                            className={`font-medium px-3 py-1 text-xs rounded ${
                              isActive
                                ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditBank(bd)}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteBank(bd)}
                            className="font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
                {bankDetails.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No bank details found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="text-lg font-medium text-gray-900">
                Delete bank detail?
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ open: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={performDeleteBank}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
