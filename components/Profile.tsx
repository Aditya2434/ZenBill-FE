import React, { useState, useEffect } from "react";
import { CompanyProfile } from "../types";
import { apiGetCompany, apiUpdateCompany } from "../utils/api";

interface ProfileProps {
  profile: CompanyProfile;
  updateProfile: (profile: CompanyProfile) => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, updateProfile }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const body = await apiGetCompany();
        const d: any = (body && (body as any).data) || body;
        if (!d) return;
        setFormData((prev) => ({
          ...prev,
          companyName: d.companyName || prev.companyName,
          companyAddress: d.companyAddress || prev.companyAddress,
          gstin: d.gstinNo || prev.gstin,
          pan: d.panNumber || prev.pan,
          companyState: d.state || prev.companyState,
          companyStateCode: d.code || prev.companyStateCode,
          logo: d.companyLogoUrl || prev.logo,
          companySeal: d.companyStampUrl || prev.companySeal,
          authorizedSignature: d.signatureUrl || prev.authorizedSignature,
          companyAcronym: d.invoicePrefix || prev.companyAcronym,
        }));
      } catch (_) {}
    })();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          companySeal: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          authorizedSignature: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        city: "",
        state: formData.companyState || "",
        code: formData.companyStateCode || "",
        gstinNo: formData.gstin,
        panNumber: formData.pan,
        companyLogoUrl: formData.logo || "",
        companyStampUrl: formData.companySeal || "",
        signatureUrl: formData.authorizedSignature || "",
        invoicePrefix: formData.companyAcronym || "",
      };
      await apiUpdateCompany(payload);
      updateProfile(formData);
      setFeedback("Company details saved successfully!");
    } catch (err: any) {
      setFeedback(err?.message || "Failed to save company details");
    } finally {
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Company Profile</h2>
      <p className="text-gray-500 mt-1 mb-6">
        Update your company information and branding.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="companyAcronym"
                className="block text-sm font-medium text-gray-700"
              >
                Company Acronym (for Invoices)
              </label>
              <input
                type="text"
                name="companyAcronym"
                id="companyAcronym"
                value={formData.companyAcronym}
                onChange={handleInputChange}
                placeholder="e.g., PRM"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="companyAddress"
                className="block text-sm font-medium text-gray-700"
              >
                Company Address
              </label>
              <textarea
                name="companyAddress"
                id="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
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
              GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              id="gstin"
              value={formData.gstin}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="pan"
              className="block text-sm font-medium text-gray-700"
            >
              PAN
            </label>
            <input
              type="text"
              name="pan"
              id="pan"
              value={formData.pan}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="companyState"
              className="block text-sm font-medium text-gray-700"
            >
              State
            </label>
            <input
              type="text"
              name="companyState"
              id="companyState"
              value={formData.companyState || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="companyStateCode"
              className="block text-sm font-medium text-gray-700"
            >
              State Code
            </label>
            <input
              type="text"
              name="companyStateCode"
              id="companyStateCode"
              value={formData.companyStateCode || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="flex justify-end items-center pt-6 border-t">
          {feedback && (
            <span className="text-green-600 text-sm mr-4">{feedback}</span>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            save company Details
          </button>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-t pt-6">
            Default Bank Details
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="accountName"
                className="block text-sm font-medium text-gray-700"
              >
                Account Name
              </label>
              <input
                type="text"
                name="accountName"
                id="accountName"
                value={formData.defaultBankDetails.accountName}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                id="accountNumber"
                value={formData.defaultBankDetails.accountNumber}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="bankName"
                className="block text-sm font-medium text-gray-700"
              >
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                id="bankName"
                value={formData.defaultBankDetails.bankName}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700"
              >
                Branch
              </label>
              <input
                type="text"
                name="branch"
                id="branch"
                value={formData.defaultBankDetails.branch}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="ifsc"
                className="block text-sm font-medium text-gray-700"
              >
                IFSC Code
              </label>
              <input
                type="text"
                name="ifsc"
                id="ifsc"
                value={formData.defaultBankDetails.ifsc}
                onChange={handleBankDetailsChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center pt-6 border-t">
          {feedback && (
            <span className="text-green-600 text-sm mr-4">{feedback}</span>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Bank Details
          </button>
        </div>
      </form>
    </div>
  );
};
