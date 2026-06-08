export enum InvoiceStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Overdue = 'Overdue',
  Draft = 'Draft',
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
}

export interface Product {
  id: string;
  name: string;
  hsnCode?: string;
  uom?: string;
}

export interface ShippingDetails {
    name: string;
    address: string;
    gstin?: string;
    state?: string;
    stateCode?: string;
}

export interface InvoiceItem {
  id: string;
  description: string; // DESCRIPTION OF GOODS
  hsnCode?: string;
  uom?: string;
  quantity: number;
  unitPrice: number; // RATE
}

export interface BankDetails {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    branch?: string;
    ifsc?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: Client;
  shippingDetails?: ShippingDetails;
  items: InvoiceItem[];
  issueDate: string; // Date
  dueDate: string;
  status: InvoiceStatus;
  
  // Transport details
  transportMode?: string;
  vehicleNo?: string;
  dateOfSupply?: string;
  placeOfSupply?: string;
  orderNo?: string;

  taxPayableOnReverseCharge?: boolean;

  // Tax rates
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;

  // Footer details
  grLrNo?: string;
  deliveryNote?: string;
  eWayBillNo?: string;
  bankDetails?: BankDetails;
  termsAndConditions?: string; // Replaces 'notes'
  jurisdiction?: string;
}

export interface CompanyProfile {
  companyName: string;
  companyAddress: string;
  email?: string; // <-- Added this line to fix the TypeScript error
  gstin: string;
  pan: string;
  companyState?: string;
  companyStateCode?: string;
  companyAcronym?: string;
  logo?: string; // base64 encoded image
  companySeal?: string; // base64 encoded image
  authorizedSignature?: string; // base64 encoded image
  defaultBankDetails: BankDetails;
}