import { useState, useCallback, useEffect } from "react";
import { CompanyProfile } from "../types";
import { apiGetCompany } from "../utils/api";

const initialProfile: CompanyProfile = {
  companyName: "Your Company Name",
  companyAddress: "",
  gstin: "",
  pan: "",
  companyState: "",
  companyStateCode: "",
  companyAcronym: "",
  logo: "",
  companySeal: "",
  authorizedSignature: "",
  defaultBankDetails: {
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    ifsc: "",
  },
};

export const useProfile = () => {
  const [profile, setProfile] = useState<CompanyProfile>(initialProfile);

  // Load profile from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const body = await apiGetCompany();
        const d: any = (body && (body as any).data) || body;
        if (!d) return;

        const BASE_URL = "http://localhost:8080";
        const toAbsoluteUrl = (url?: string) => {
          if (!url) return url;
          if (url.startsWith("/api/")) return BASE_URL + url;
          return url;
        };

        setProfile({
          companyName: d.companyName || initialProfile.companyName,
          companyAddress: d.companyAddress || initialProfile.companyAddress,
          gstin: d.gstinNo || initialProfile.gstin,
          pan: d.panNumber || initialProfile.pan,
          companyState: d.state || initialProfile.companyState,
          companyStateCode: d.code || initialProfile.companyStateCode,
          logo: toAbsoluteUrl(d.companyLogoUrl) || initialProfile.logo,
          companySeal:
            toAbsoluteUrl(d.companyStampUrl) || initialProfile.companySeal,
          authorizedSignature:
            toAbsoluteUrl(d.signatureUrl) || initialProfile.authorizedSignature,
          companyAcronym: d.invoicePrefix || initialProfile.companyAcronym,
          defaultBankDetails: initialProfile.defaultBankDetails,
        });
      } catch (error) {
        console.error("Failed to load company profile:", error);
      }
    })();
  }, []);

  const updateProfile = useCallback((newProfile: CompanyProfile) => {
    setProfile(newProfile);
  }, []);

  return { profile, updateProfile };
};
