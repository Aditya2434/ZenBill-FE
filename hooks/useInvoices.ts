import { useState, useCallback } from "react";
import { Invoice, InvoiceStatus, Client, CompanyProfile } from "../types";
import { dummyInvoices } from "../utils/dummyInvoices";

export const getFinancialYearString = (date: Date): string => {
  const currentMonth = date.getMonth();
  let financialYearStart;
  if (currentMonth >= 3) {
    // April (month 3) or later
    financialYearStart = date.getFullYear();
  } else {
    // Jan, Feb, March
    financialYearStart = date.getFullYear() - 1;
  }
  const financialYearEnd = financialYearStart + 1;
  return `${financialYearStart}-${financialYearEnd}`;
};

export const getHighestInvoiceNumber = (
  existingInvoices: Invoice[],
  prefix: string
): number => {
  if (!prefix) return 0;
  const yearInvoices = existingInvoices.filter((inv) =>
    inv.invoiceNumber.startsWith(prefix)
  );

  const lastNumber =
    yearInvoices
      .map((inv) => parseInt(inv.invoiceNumber.split("/")[2], 10))
      .filter((num) => !isNaN(num))
      .sort((a, b) => b - a)[0] || 0;

  return lastNumber;
};

export const generateNextInvoiceNumber = (
  existingInvoices: Invoice[],
  companyProfile: CompanyProfile
): string => {
  const acronym =
    companyProfile.companyAcronym ||
    companyProfile.companyName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  const financialYearString = getFinancialYearString(new Date());
  const prefix = `${acronym}/${financialYearString}/`;

  const lastNumber = getHighestInvoiceNumber(existingInvoices, prefix);

  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
  return `${prefix}${nextNumber}`;
};

const initialInvoices: Invoice[] = dummyInvoices;

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  const addInvoice = useCallback(
    (invoice: Omit<Invoice, "id">) => {
      const isDuplicate = invoices.some(
        (inv) =>
          inv.invoiceNumber.toLowerCase() ===
          invoice.invoiceNumber.toLowerCase()
      );

      if (isDuplicate) {
        return false;
      }

      const newInvoice: Invoice = {
        ...invoice,
        id: `inv-${new Date().getTime()}`,
      };

      setInvoices((currentInvoices) =>
        [newInvoice, ...currentInvoices].sort(
          (a, b) =>
            b.issueDate.localeCompare(a.issueDate) ||
            b.invoiceNumber.localeCompare(a.invoiceNumber)
        )
      );
      return true;
    },
    [invoices]
  );

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
  }, []);

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  }, []);

  return { invoices, addInvoice, updateInvoice, deleteInvoice };
};
