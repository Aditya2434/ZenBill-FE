import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  apiCreateClient,
  apiCreateOrder,
} from "../utils/api";
import DummyPDF from "./DummyPDF";
import { Toast, ToastType } from "./Toast";

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceWizardProps {
  existingInvoice?: Invoice | null;
  addInvoice?: (invoice: Omit<Invoice, "id">) => boolean;
  updateInvoice?: (invoice: Invoice) => void;
  setView: (view: View) => void;
  profile: CompanyProfile;
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  addClient?: (client: Omit<Client, "id" | "email">) => Promise<void> | void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Invoice Details",
  2: "Billing & Shipping",
  3: "Products & Tax",
  4: "Transport",
  5: "Bank Details",
  6: "Terms & Auth",
  7: "Preview",
};

// ============================================================================
// UTILITIES
// ============================================================================

function numberToWordsINR(num: number): string {
  const a = [
    "", "ONE ", "TWO ", "THREE ", "FOUR ", "FIVE ", "SIX ", "SEVEN ",
    "EIGHT ", "NINE ", "TEN ", "ELEVEN ", "TWELVE ", "THIRTEEN ", "FOURTEEN ",
    "FIFTEEN ", "SIXTEEN ", "SEVENTEEN ", "EIGHTEEN ", "NINETEEN ",
  ];
  const b = ["", "", "TWENTY ", "THIRTY ", "FORTY ", "FIFTY ", "SIXTY ", "SEVENTY ", "EIGHTY ", "NINETY "];
  const [integerPartStr] = num.toFixed(2).split(".");
  let n = parseInt(integerPartStr, 10);
  if (n === 0) return "ZERO RUPEES ONLY.";
  if (n > 999999999) return "NUMBER TOO LARGE";
  const inWords = (num: number, s: string) => {
    let str = "";
    if (num > 19) { str += b[Math.floor(num / 10)] + a[num % 10]; }
    else { str += a[num]; }
    if (num !== 0) str += s;
    return str;
  };
  let res = "";
  res += inWords(Math.floor(n / 10000000), "CRORE "); n %= 10000000;
  res += inWords(Math.floor(n / 100000), "LAKH "); n %= 100000;
  res += inWords(Math.floor(n / 1000), "THOUSAND "); n %= 1000;
  res += inWords(Math.floor(n / 100), "HUNDRED "); n %= 100;
  if (n > 0 && res.trim() !== "") res += "AND ";
  res += inWords(n, "");
  return res.trim().replace(/\s\s+/g, " ") + " RUPEES ONLY.";
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const getFinancialYearString = (date: Date): string => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const financialYearStart = month >= 4 ? year : year - 1;
  const financialYearEnd = financialYearStart + 1;
  return `${String(financialYearStart).slice(-2)}-${String(financialYearEnd).slice(-2)}`;
};

// ============================================================================
// REUSABLE FIELD COMPONENTS
// ============================================================================

interface WizardFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const WizardField: React.FC<WizardFieldProps> = ({ label, required, error, children, className }) => (
  <div className={`wz-field ${className || ""}`}>
    <label className="wz-label">
      {label}
      {required && <span className="wz-required">*</span>}
    </label>
    {children}
    {error && <p className="wz-error">{error}</p>}
  </div>
);

interface WizardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const WizardInput: React.FC<WizardInputProps> = ({ error, className, ...props }) => (
  <input
    className={`wz-input ${error ? "wz-input-error" : ""} ${className || ""}`}
    {...props}
  />
);

interface WizardTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const WizardTextarea: React.FC<WizardTextareaProps> = ({ error, className, ...props }) => (
  <textarea
    className={`wz-input wz-textarea ${error ? "wz-input-error" : ""} ${className || ""}`}
    {...props}
  />
);

// ============================================================================
// STEPPER COMPONENT
// ============================================================================

interface StepperProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  completedSteps: Set<number>;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick, completedSteps }) => {
  const steps = [1, 2, 3, 4, 5, 6, 7] as WizardStep[];
  return (
    <>
      {/* Desktop stepper */}
      <div className="wz-stepper-desktop">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(step);
          const isActive = step === currentStep;
          const isPast = step < currentStep;
          return (
            <React.Fragment key={step}>
              <button
                type="button"
                onClick={() => (isPast || isCompleted) ? onStepClick(step) : undefined}
                className={`wz-step ${isActive ? "wz-step-active" : ""} ${isCompleted || isPast ? "wz-step-done" : ""}`}
                title={STEP_LABELS[step]}
              >
                <div className="wz-step-circle">
                  {isCompleted || isPast ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="wz-step-check">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
                <span className="wz-step-label">{STEP_LABELS[step]}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`wz-step-connector ${isPast || isCompleted ? "wz-connector-done" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Mobile badge */}
      <div className="wz-stepper-mobile">
        <div className="wz-mobile-step-badge">
          <div className="wz-mobile-progress" style={{ width: `${((currentStep - 1) / 6) * 100}%` }} />
        </div>
        <p className="wz-mobile-step-label">
          Step {currentStep} of 7 &nbsp;·&nbsp; <strong>{STEP_LABELS[currentStep]}</strong>
        </p>
      </div>
    </>
  );
};

// ============================================================================
// STEP 1 – INVOICE DETAILS
// ============================================================================

interface Step1Props {
  invoice: any;
  invoiceNumberPrefix: string;
  invoiceNumberSequential: string;
  invoiceNumberError: string | null;
  existingInvoice?: Invoice | null;
  profile: CompanyProfile;
  showInvoiceNumberTip: boolean;
  hasSeenInvoiceNumberTip: boolean;
  onSequentialChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCloseTip: () => void;
  validationErrors: Record<string, string>;
}

const Step1InvoiceDetails: React.FC<Step1Props> = ({
  invoice, invoiceNumberPrefix, invoiceNumberSequential, invoiceNumberError,
  existingInvoice, profile, showInvoiceNumberTip, hasSeenInvoiceNumberTip,
  onSequentialChange, onInputChange, onCloseTip, validationErrors,
}) => (
  <div className="wz-step-content">
    <div className="wz-step-header">
      <div className="wz-step-icon wz-icon-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <h2 className="wz-step-title">Invoice Details</h2>
        <p className="wz-step-subtitle">Basic invoice information and reference numbers</p>
      </div>
    </div>

    <div className="wz-grid-2">
      {/* Tax Invoice No */}
      <WizardField label="Tax Invoice No." required error={invoiceNumberError || undefined}>
        {existingInvoice ? (
          <div className="wz-readonly-badge">{existingInvoice.invoiceNumber}</div>
        ) : (
          <div className="wz-invoice-number-input">
            <span className="wz-invoice-prefix">{invoiceNumberPrefix}</span>
            <input
              type="text"
              value={invoiceNumberSequential}
              onChange={onSequentialChange}
              onFocus={() => !hasSeenInvoiceNumberTip && onCloseTip()}
              className={`wz-invoice-seq ${invoiceNumberError ? "wz-input-error" : ""}`}
              maxLength={3}
              placeholder="001"
              id="wizard-invoice-number"
            />
          </div>
        )}
      </WizardField>

      {/* Date */}
      <WizardField label="Date" required error={validationErrors.issueDate}>
        <WizardInput
          type="date"
          name="issueDate"
          value={invoice.issueDate || ""}
          onChange={onInputChange}
          error={!!validationErrors.issueDate}
          id="wizard-issue-date"
        />
      </WizardField>

      {/* Tax Payable on Reverse Charge */}
      <WizardField label="Tax Payable on Reverse Charge" className="wz-field-row">
        <div className="wz-toggle-row">
          <label className="wz-toggle" htmlFor="wizard-reverse-charge">
            <input
              type="checkbox"
              id="wizard-reverse-charge"
              name="taxPayableOnReverseCharge"
              checked={!!invoice.taxPayableOnReverseCharge}
              onChange={onInputChange}
              className="wz-toggle-input"
            />
            <span className="wz-toggle-slider" />
          </label>
          <span className="wz-toggle-value">
            {invoice.taxPayableOnReverseCharge ? "Yes" : "No"}
          </span>
        </div>
      </WizardField>

      {/* State & Code (read-only from profile) */}
      <WizardField label="State & Code">
        <div className="wz-readonly-badge">
          {`${profile.companyState || ""} ${profile.companyStateCode || ""}`.trim() || "—"}
        </div>
      </WizardField>

      {/* Transport Mode */}
      <WizardField label="Transport Mode">
        <WizardInput
          type="text"
          name="transportMode"
          value={invoice.transportMode || ""}
          onChange={onInputChange}
          placeholder="Road / Rail / Air / Sea"
          id="wizard-transport-mode"
        />
      </WizardField>

      {/* Vehicle No */}
      <WizardField label="Vehicle No.">
        <WizardInput
          type="text"
          name="vehicleNo"
          value={invoice.vehicleNo || ""}
          onChange={onInputChange}
          placeholder="WB00AB0000"
          id="wizard-vehicle-no"
        />
      </WizardField>

      {/* Date of Supply */}
      <WizardField label="Date of Supply">
        <WizardInput
          type="date"
          name="dateOfSupply"
          value={invoice.dateOfSupply || ""}
          onChange={onInputChange}
          id="wizard-date-of-supply"
        />
      </WizardField>

      {/* Place of Supply */}
      <WizardField label="Place of Supply">
        <WizardInput
          type="text"
          name="placeOfSupply"
          value={invoice.placeOfSupply || ""}
          onChange={onInputChange}
          placeholder="City / State"
          id="wizard-place-of-supply"
        />
      </WizardField>

      {/* Order No */}
      <WizardField label="Order No.">
        <WizardInput
          type="text"
          name="orderNo"
          value={invoice.orderNo || ""}
          onChange={onInputChange}
          placeholder="PO-001"
          id="wizard-order-no"
        />
      </WizardField>
    </div>

    {showInvoiceNumberTip && (
      <div className="wz-tip-modal" onClick={onCloseTip}>
        <div className="wz-tip-card" onClick={e => e.stopPropagation()}>
          <p className="wz-tip-text">You can only edit the last 3 digits of the invoice number. The prefix is auto-generated from your company acronym and financial year.</p>
          <button onClick={onCloseTip} className="wz-btn wz-btn-primary">Got it</button>
        </div>
      </div>
    )}
  </div>
);

// ============================================================================
// STEP 2 – BILLING & SHIPPING
// ============================================================================

// ---- New-client data shape ----
interface NewClientData {
  name: string;
  gstin: string;
  address: string;
  state: string;
  stateCode: string;
}

type ClientMode = "existing" | "new";

interface Step2Props {
  invoice: any;
  sameAsBilling: boolean;
  clients: Client[];
  clientMode: ClientMode;
  newClientData: NewClientData;
  clientOrders: any[];
  isLoadingOrders: boolean;
  selectedOrderId: string;
  onClientModeChange: (mode: ClientMode) => void;
  onNewClientDataChange: (field: keyof NewClientData, value: string) => void;
  onClientChange: (id: string) => void;
  onShippingClientChange: (id: string) => void;
  onSameAsBillingChange: (v: boolean) => void;
  onNestedChange: (section: "client" | "shippingDetails", e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onOrderSelect: (orderId: string) => void;
  validationErrors: Record<string, string>;
}

const Step2BillingShipping: React.FC<Step2Props> = ({
  invoice, sameAsBilling, clients,
  clientMode, newClientData, clientOrders, isLoadingOrders, selectedOrderId,
  onClientModeChange, onNewClientDataChange,
  onClientChange, onShippingClientChange, onSameAsBillingChange, onNestedChange,
  onOrderSelect, validationErrors,
}) => {
  const clientOptions = [
    { value: "", label: "— Search or select a client —" },
    ...clients.map(c => ({ value: c.id, label: c.name })),
  ];
  const shipClientOptions = [
    { value: "", label: "— Select different ship-to... —" },
    ...clients.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="wz-step-content">
      <div className="wz-step-header">
        <div className="wz-step-icon wz-icon-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 className="wz-step-title">Billing & Shipping Details</h2>
          <p className="wz-step-subtitle">Who is being billed and where is the shipment going?</p>
        </div>
      </div>

      <div className="wz-billing-grid">
        {/* BILLED TO */}
        <div className="wz-section-card">
          <div className="wz-section-title wz-section-billing">
            <svg viewBox="0 0 20 20" fill="currentColor" className="wz-section-icon">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            Detail of Receiver (Billed To)
          </div>
          <div className="wz-section-body">

            {/* ── Mode Toggle ── */}
            <div className="wz-client-mode-toggle">
              <button
                type="button"
                className={`wz-mode-btn ${clientMode === "existing" ? "wz-mode-btn-active" : ""}`}
                onClick={() => onClientModeChange("existing")}
                id="client-mode-existing"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Select Existing Client
              </button>
              <button
                type="button"
                className={`wz-mode-btn ${clientMode === "new" ? "wz-mode-btn-active" : ""}`}
                onClick={() => onClientModeChange("new")}
                id="client-mode-new"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                + New Client
              </button>
            </div>

            {clientMode === "existing" ? (
              <>
                <WizardField label="Select Client">
                  <Dropdown
                    id="wizard-billing-client"
                    value={invoice.client?.id || ""}
                    onChange={onClientChange}
                    options={clientOptions}
                    searchable
                    placeholder="Search or select a client..."
                  />
                </WizardField>

                {/* Order picker: appears once a client is selected */}
                {invoice.client?.id && (
                  <div className="wz-order-select-wrap">
                    <div className="wz-order-select-label">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" style={{ flexShrink: 0 }}>
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      Available Orders
                      {isLoadingOrders && <span className="wz-orders-loading">Loading…</span>}
                    </div>
                    {!isLoadingOrders && clientOrders.length === 0 && (
                      <p className="wz-order-empty">No orders found — products will have no quantity restrictions.</p>
                    )}
                    {!isLoadingOrders && clientOrders.length > 0 && (
                      <>
                        <select
                          className="wz-input"
                          value={selectedOrderId}
                          onChange={e => onOrderSelect(e.target.value)}
                          id="wizard-order-select"
                        >
                          <option value="">— No specific order (unrestricted qty) —</option>
                          {clientOrders.map((order: any) => (
                            <option key={order.id} value={String(order.id)}>
                              {order.orderNumber} · {order.orderDate}
                              {order.status === "AUTO_GENERATED" ? " 🤖 Auto-generated" : ""}
                            </option>
                          ))}
                        </select>
                        {selectedOrderId && (() => {
                          const order = clientOrders.find((o: any) => String(o.id) === selectedOrderId);
                          return order && Array.isArray(order.items) && order.items.length > 0 ? (
                            <div className="wz-order-preview">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="wz-order-item-row">
                                  <span className="wz-order-item-name">{item.productName}</span>
                                  <span className="wz-order-item-qty">Qty: {item.quantity} {item.uom || ""}</span>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </>
                    )}
                  </div>
                )}

                <WizardField label="Name" required error={validationErrors.clientName}>
                  <WizardInput
                    name="name"
                    value={invoice.client?.name || ""}
                    onChange={e => onNestedChange("client", e)}
                    placeholder="Client / Company name"
                    error={!!validationErrors.clientName}
                    id="wizard-billed-name"
                  />
                </WizardField>
                <WizardField label="Address">
                  <WizardTextarea
                    name="address"
                    value={invoice.client?.address || ""}
                    onChange={e => onNestedChange("client", e)}
                    rows={3}
                    placeholder="Full billing address"
                    id="wizard-billed-address"
                  />
                </WizardField>
                <WizardField label="GSTIN">
                  <WizardInput
                    name="gstin"
                    value={invoice.client?.gstin || ""}
                    onChange={e => onNestedChange("client", e)}
                    placeholder="22AAAAA0000A1Z5"
                    id="wizard-billed-gstin"
                  />
                </WizardField>
                <div className="wz-grid-2-sm">
                  <WizardField label="State">
                    <WizardInput
                      name="state"
                      value={invoice.client?.state || ""}
                      onChange={e => onNestedChange("client", e)}
                      placeholder="West Bengal"
                      id="wizard-billed-state"
                    />
                  </WizardField>
                  <WizardField label="State Code">
                    <WizardInput
                      name="stateCode"
                      value={invoice.client?.stateCode || ""}
                      onChange={e => onNestedChange("client", e)}
                      placeholder="19"
                      id="wizard-billed-state-code"
                    />
                  </WizardField>
                </div>
              </>
            ) : (
              /* ── New Client inline form ── */
              <>
                <div className="wz-new-client-notice">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Client profile &amp; order record will be created automatically after invoice generation.</span>
                </div>
                <WizardField label="Client Name" required error={validationErrors.clientName}>
                  <WizardInput
                    name="name"
                    value={newClientData.name}
                    onChange={e => onNewClientDataChange("name", e.target.value)}
                    placeholder="e.g. ABC Steel Ltd."
                    error={!!validationErrors.clientName}
                    id="wizard-new-client-name"
                  />
                </WizardField>
                <WizardField label="GSTIN">
                  <WizardInput
                    name="gstin"
                    value={newClientData.gstin}
                    onChange={e => onNewClientDataChange("gstin", e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                    id="wizard-new-client-gstin"
                  />
                </WizardField>
                <WizardField label="Address">
                  <WizardTextarea
                    name="address"
                    value={newClientData.address}
                    onChange={e => onNewClientDataChange("address", e.target.value)}
                    rows={3}
                    placeholder="Full billing address"
                    id="wizard-new-client-address"
                  />
                </WizardField>
                <div className="wz-grid-2-sm">
                  <WizardField label="State">
                    <WizardInput
                      name="state"
                      value={newClientData.state}
                      onChange={e => onNewClientDataChange("state", e.target.value)}
                      placeholder="West Bengal"
                      id="wizard-new-client-state"
                    />
                  </WizardField>
                  <WizardField label="State Code">
                    <WizardInput
                      name="stateCode"
                      value={newClientData.stateCode}
                      onChange={e => onNewClientDataChange("stateCode", e.target.value)}
                      placeholder="19"
                      id="wizard-new-client-state-code"
                    />
                  </WizardField>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SHIPPED TO */}
        <div className="wz-section-card">
          <div className="wz-section-title wz-section-shipping">
            <svg viewBox="0 0 20 20" fill="currentColor" className="wz-section-icon">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
            Detail of Receiver (Shipped To)
            <label className="wz-same-billing-check" htmlFor="wizard-same-billing">
              <input
                id="wizard-same-billing"
                type="checkbox"
                checked={sameAsBilling}
                onChange={e => onSameAsBillingChange(e.target.checked)}
                className="wz-check-input"
              />
              <span className="wz-check-label">Same as billing</span>
            </label>
          </div>
          <div className={`wz-section-body ${sameAsBilling ? "wz-section-disabled" : ""}`}>
            <WizardField label="Select Client">
              <Dropdown
                id="wizard-shipping-client"
                value=""
                onChange={onShippingClientChange}
                options={shipClientOptions}
                searchable
                disabled={sameAsBilling}
                placeholder="Select different ship-to..."
              />
            </WizardField>
            <WizardField label="Name">
              <WizardInput
                name="name"
                value={invoice.shippingDetails?.name || ""}
                onChange={e => onNestedChange("shippingDetails", e)}
                placeholder="Recipient name"
                disabled={sameAsBilling}
                id="wizard-ship-name"
              />
            </WizardField>
            <WizardField label="Address">
              <WizardTextarea
                name="address"
                value={invoice.shippingDetails?.address || ""}
                onChange={e => onNestedChange("shippingDetails", e)}
                rows={3}
                placeholder="Delivery / shipping address"
                disabled={sameAsBilling}
                id="wizard-ship-address"
              />
            </WizardField>
            <WizardField label="GSTIN">
              <WizardInput
                name="gstin"
                value={invoice.shippingDetails?.gstin || ""}
                onChange={e => onNestedChange("shippingDetails", e)}
                placeholder="22AAAAA0000A1Z5"
                disabled={sameAsBilling}
                id="wizard-ship-gstin"
              />
            </WizardField>
            <div className="wz-grid-2-sm">
              <WizardField label="State">
                <WizardInput
                  name="state"
                  value={invoice.shippingDetails?.state || ""}
                  onChange={e => onNestedChange("shippingDetails", e)}
                  placeholder="West Bengal"
                  disabled={sameAsBilling}
                  id="wizard-ship-state"
                />
              </WizardField>
              <WizardField label="State Code">
                <WizardInput
                  name="stateCode"
                  value={invoice.shippingDetails?.stateCode || ""}
                  onChange={e => onNestedChange("shippingDetails", e)}
                  placeholder="19"
                  disabled={sameAsBilling}
                  id="wizard-ship-state-code"
                />
              </WizardField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STEP 3 – PRODUCTS & TAX
// ============================================================================

interface Step3Props {
  invoice: any;
  products: Product[];
  productOptionsForClient: { value: string; label: string }[];
  isIntraState: boolean;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  total: number;
  selectedTemplateId: string;
  onItemChange: (index: number, field: keyof InvoiceItem, value: string | number) => void;
  onAddItem: () => void;
  onDeleteItem: (index: number) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  validationErrors: Record<string, string>;
}

const Step3ProductsTax: React.FC<Step3Props> = ({
  invoice, products, productOptionsForClient, isIntraState,
  subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total,
  selectedTemplateId, onItemChange, onAddItem, onDeleteItem, onInputChange,
  validationErrors,
}) => {
  const MAX_ITEMS: Record<string, number> = { default: 10, tally: 8, template3: 10, simple: 12, creative: 12 };
  const maxItems = MAX_ITEMS[selectedTemplateId] || 10;

  return (
    <div className="wz-step-content">
      <div className="wz-step-header">
        <div className="wz-step-icon wz-icon-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <h2 className="wz-step-title">Products & Tax Details</h2>
          <p className="wz-step-subtitle">Add line items, quantities, rates, and tax information</p>
        </div>
      </div>

      {validationErrors.items && (
        <div className="wz-alert-error">
          <svg viewBox="0 0 20 20" fill="currentColor" className="wz-alert-icon">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {validationErrors.items}
        </div>
      )}

      {/* Product Table */}
      <div className="wz-product-table-wrap">
        <div className="wz-product-table">
          {/* Header */}
          <div className="wz-table-header">
            <div className="wz-col-sno">S.No</div>
            <div className="wz-col-desc">Description of Goods</div>
            <div className="wz-col-hsn">HSN</div>
            <div className="wz-col-uom">UOM</div>
            <div className="wz-col-qty">Qty</div>
            <div className="wz-col-rate">Rate (₹)</div>
            <div className="wz-col-amt">Amount (₹)</div>
            <div className="wz-col-del" />
          </div>

          {/* Rows */}
          {invoice.items.map((item: InvoiceItem, index: number) => (
            <div key={item.id} className="wz-table-row">
              <div className="wz-col-sno wz-cell-center wz-cell-gray">{index + 1}</div>
              <div className="wz-col-desc wz-cell-pad">
                <Combobox
                  value={item.description}
                  onChange={v => onItemChange(index, "description", v)}
                  options={productOptionsForClient}
                  placeholder="Search or type product..."
                  className="wz-combobox"
                />
              </div>
              <div className="wz-col-hsn wz-cell-pad">
                <input
                  type="text"
                  value={item.hsnCode || ""}
                  onChange={e => onItemChange(index, "hsnCode", e.target.value)}
                  className="wz-table-input wz-center"
                  placeholder="HSN"
                />
              </div>
              <div className="wz-col-uom wz-cell-pad">
                <input
                  type="text"
                  value={item.uom || ""}
                  onChange={e => onItemChange(index, "uom", e.target.value)}
                  className="wz-table-input wz-center wz-uppercase"
                  placeholder="PCS"
                />
              </div>
              <div className="wz-col-qty wz-cell-pad">
                <input
                  type="number"
                  value={item.quantity === 0 ? "" : item.quantity}
                  onChange={e => onItemChange(index, "quantity", e.target.value)}
                  className="wz-table-input wz-right"
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="wz-col-rate wz-cell-pad">
                <input
                  type="number"
                  value={item.unitPrice === 0 ? "" : item.unitPrice}
                  onChange={e => onItemChange(index, "unitPrice", e.target.value)}
                  className="wz-table-input wz-right"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="wz-col-amt wz-cell-amt">
                ₹{(item.quantity * item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="wz-col-del wz-cell-center">
                <button
                  type="button"
                  onClick={() => onDeleteItem(index)}
                  className="wz-delete-btn"
                  title="Remove item"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add row */}
          <div className="wz-table-footer">
            <button
              type="button"
              onClick={onAddItem}
              disabled={invoice.items.length >= maxItems}
              className="wz-add-item-btn"
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Add Item ({invoice.items.length}/{maxItems})
            </button>
          </div>
        </div>
      </div>

      {/* Tax Calculation */}
      <div className="wz-tax-section">
        <div className="wz-tax-left">
          <p className="wz-tax-words-label">Amount in Words</p>
          <p className="wz-tax-words">{numberToWordsINR(total)}</p>
        </div>
        <div className="wz-tax-right">
          <div className="wz-tax-rates">
            <div className="wz-tax-rate-group">
              <span className="wz-tax-rate-label">CGST %</span>
              <input
                type="number"
                name="cgstRate"
                value={isIntraState ? (invoice.cgstRate ?? "") : 0}
                onChange={onInputChange}
                disabled={!isIntraState}
                className={`wz-rate-input ${!isIntraState ? "wz-rate-disabled" : ""}`}
              />
            </div>
            <div className="wz-tax-rate-sep" />
            <div className="wz-tax-rate-group">
              <span className="wz-tax-rate-label">SGST %</span>
              <input
                type="number"
                name="sgstRate"
                value={isIntraState ? (invoice.sgstRate ?? "") : 0}
                onChange={onInputChange}
                disabled={!isIntraState}
                className={`wz-rate-input ${!isIntraState ? "wz-rate-disabled" : ""}`}
              />
            </div>
            <div className="wz-tax-rate-sep" />
            <div className="wz-tax-rate-group">
              <span className="wz-tax-rate-label">IGST %</span>
              <input
                type="number"
                name="igstRate"
                value={!isIntraState ? (invoice.igstRate ?? "") : 0}
                onChange={onInputChange}
                disabled={isIntraState}
                className={`wz-rate-input ${isIntraState ? "wz-rate-disabled" : ""}`}
              />
            </div>
          </div>
          <div className="wz-totals">
            <div className="wz-total-row">
              <span>Total Before Tax</span>
              <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {isIntraState ? (
              <>
                <div className="wz-total-row">
                  <span>CGST ({invoice.cgstRate || 0}%)</span>
                  <span>₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="wz-total-row">
                  <span>SGST ({invoice.sgstRate || 0}%)</span>
                  <span>₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="wz-total-row">
                <span>IGST ({invoice.igstRate || 0}%)</span>
                <span>₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="wz-total-row">
              <span>Total Tax</span>
              <span>₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="wz-total-row wz-grand-total">
              <span>Total After Tax</span>
              <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STEP 4 – TRANSPORT DETAILS
// ============================================================================

interface Step4Props {
  invoice: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const Step4Transport: React.FC<Step4Props> = ({ invoice, onInputChange }) => (
  <div className="wz-step-content">
    <div className="wz-step-header">
      <div className="wz-step-icon wz-icon-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
      <div>
        <h2 className="wz-step-title">Transport Details</h2>
        <p className="wz-step-subtitle">Goods receipt and e-way bill information</p>
      </div>
    </div>

    <div className="wz-grid-2">
      <WizardField label="GR / LR No.">
        <WizardInput
          type="text"
          name="grLrNo"
          value={invoice.grLrNo || ""}
          onChange={onInputChange}
          placeholder="Goods Receipt / Lorry Receipt Number"
          id="wizard-gr-lr-no"
        />
      </WizardField>
      <WizardField label="E-Way Bill No.">
        <WizardInput
          type="text"
          name="eWayBillNo"
          value={invoice.eWayBillNo || ""}
          onChange={onInputChange}
          placeholder="12-digit E-Way Bill Number"
          id="wizard-eway-bill"
        />
      </WizardField>
    </div>

    <div className="wz-info-card">
      <svg viewBox="0 0 20 20" fill="currentColor" className="wz-info-icon">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      <p>Transport details are optional. These fields appear in the footer section of the generated invoice. E-Way Bill is required for inter-state movement of goods above ₹50,000.</p>
    </div>
  </div>
);

// ============================================================================
// STEP 5 – BANK DETAILS
// ============================================================================

interface Step5Props {
  invoice: any;
  bankDetailsList: any[];
  selectedBankId: string;
  onBankSelect: (id: string) => void;
  onNestedChange: (section: "bankDetails", e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Step5BankDetails: React.FC<Step5Props> = ({
  invoice, bankDetailsList, selectedBankId, onBankSelect, onNestedChange,
}) => {
  const bankOptions = bankDetailsList.map(bd => ({
    value: String(bd.id),
    label: `${bd.bankName ?? bd.bank_name ?? ""} — ${bd.accountNumber ?? bd.account_number ?? ""}`,
  }));

  return (
    <div className="wz-step-content">
      <div className="wz-step-header">
        <div className="wz-step-icon wz-icon-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h2 className="wz-step-title">Bank Details</h2>
          <p className="wz-step-subtitle">Company bank account details to appear on the invoice</p>
        </div>
      </div>

      {bankOptions.length > 0 && (
        <WizardField label="Select Saved Bank Account" className="wz-mb-4">
          <Dropdown
            id="wizard-bank-select"
            value={selectedBankId}
            onChange={onBankSelect}
            options={bankOptions}
            searchable
            placeholder="Select a configured bank profile..."
          />
        </WizardField>
      )}

      <div className="wz-grid-2">
        <WizardField label="Account Name">
          <WizardInput
            name="accountName"
            value={invoice.bankDetails?.accountName || ""}
            onChange={e => onNestedChange("bankDetails", e)}
            placeholder="Account holder name"
            id="wizard-bank-acname"
          />
        </WizardField>
        <WizardField label="Account Number">
          <WizardInput
            name="accountNumber"
            value={invoice.bankDetails?.accountNumber || ""}
            onChange={e => onNestedChange("bankDetails", e)}
            placeholder="Account number"
            id="wizard-bank-acno"
          />
        </WizardField>
        <WizardField label="Bank Name">
          <WizardInput
            name="bankName"
            value={invoice.bankDetails?.bankName || ""}
            onChange={e => onNestedChange("bankDetails", e)}
            placeholder="State Bank of India"
            id="wizard-bank-name"
          />
        </WizardField>
        <WizardField label="Branch">
          <WizardInput
            name="branch"
            value={invoice.bankDetails?.branch || ""}
            onChange={e => onNestedChange("bankDetails", e)}
            placeholder="Branch name"
            id="wizard-bank-branch"
          />
        </WizardField>
        <WizardField label="IFSC Code">
          <WizardInput
            name="ifsc"
            value={invoice.bankDetails?.ifsc || ""}
            onChange={e => onNestedChange("bankDetails", e)}
            placeholder="SBIN0001234"
            className="wz-uppercase"
            id="wizard-bank-ifsc"
          />
        </WizardField>
      </div>
    </div>
  );
};

// ============================================================================
// STEP 6 – TERMS & AUTHORIZATION
// ============================================================================

interface Step6Props {
  invoice: any;
  profile: CompanyProfile;
  showSeal: boolean;
  showSignature: boolean;
  onShowSealChange: (v: boolean) => void;
  onShowSignatureChange: (v: boolean) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const Step6TermsAuth: React.FC<Step6Props> = ({
  invoice, profile, showSeal, showSignature,
  onShowSealChange, onShowSignatureChange, onInputChange,
}) => (
  <div className="wz-step-content">
    <div className="wz-step-header">
      <div className="wz-step-icon wz-icon-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div>
        <h2 className="wz-step-title">Terms & Authorization</h2>
        <p className="wz-step-subtitle">Terms and conditions, jurisdiction, and authorization details</p>
      </div>
    </div>

    <div className="wz-grid-1">
      <WizardField label="Terms & Conditions">
        <WizardTextarea
          name="termsAndConditions"
          value={invoice.termsAndConditions || ""}
          onChange={onInputChange}
          rows={5}
          placeholder="Enter your terms and conditions..."
          id="wizard-terms"
        />
      </WizardField>

      <WizardField label="Subject To (Jurisdiction City)">
        <WizardInput
          type="text"
          name="jurisdiction"
          value={invoice.jurisdiction || ""}
          onChange={onInputChange}
          placeholder="e.g. DURGAPUR"
          id="wizard-jurisdiction"
        />
      </WizardField>

      <div className="wz-auth-options">
        <label className="wz-auth-toggle" htmlFor="wizard-show-seal">
          <input
            id="wizard-show-seal"
            type="checkbox"
            checked={showSeal}
            onChange={e => onShowSealChange(e.target.checked)}
            className="wz-check-input"
          />
          <div className="wz-auth-toggle-content">
            <span className="wz-auth-toggle-title">Show Common Seal</span>
            <span className="wz-auth-toggle-sub">Display company seal on the invoice</span>
          </div>
          {profile.companySeal && showSeal && (
            <img src={profile.companySeal} alt="Seal" className="wz-auth-thumb" />
          )}
        </label>

        <label className="wz-auth-toggle" htmlFor="wizard-show-sig">
          <input
            id="wizard-show-sig"
            type="checkbox"
            checked={showSignature}
            onChange={e => onShowSignatureChange(e.target.checked)}
            className="wz-check-input"
          />
          <div className="wz-auth-toggle-content">
            <span className="wz-auth-toggle-title">Show Authorized Signatory</span>
            <span className="wz-auth-toggle-sub">Display authorized signature on the invoice</span>
          </div>
          {profile.authorizedSignature && showSignature && (
            <img src={profile.authorizedSignature} alt="Signature" className="wz-auth-thumb" />
          )}
        </label>
      </div>

      <div className="wz-company-info-card">
        <div className="wz-company-info-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="wz-company-info-body">
          <p className="wz-company-info-title">Company (Auto-fetched)</p>
          <p className="wz-company-info-name">{profile.companyName}</p>
          <p className="wz-company-info-detail">GSTIN: {profile.gstin} · PAN: {profile.pan}</p>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// STEP 7 – PREVIEW & GENERATE
// ============================================================================

interface Step7Props {
  previewInvoiceData: Invoice;
  profile: CompanyProfile;
  logoBase64: string;
  companySealBase64: string;
  signatureBase64: string;
  selectedTemplateId: string;
  isSubmitting: boolean;
  existingInvoice?: Invoice | null;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onSave: () => void;
  onGoToStep: (step: WizardStep) => void;
}

const Step7Preview: React.FC<Step7Props> = ({
  previewInvoiceData, profile, logoBase64, companySealBase64, signatureBase64,
  selectedTemplateId, isSubmitting, existingInvoice,
  onDownloadPdf, onPrint, onSave, onGoToStep,
}) => {
  const profileForPdf = {
    ...profile,
    logo: logoBase64 || profile.logo || "",
    companySeal: companySealBase64 || profile.companySeal || "",
    authorizedSignature: signatureBase64 || profile.authorizedSignature || "",
  };

  return (
    <div className="wz-step-content">
      <div className="wz-step-header">
        <div className="wz-step-icon wz-icon-7">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <h2 className="wz-step-title">Preview & Generate</h2>
          <p className="wz-step-subtitle">Review your invoice before saving — using your selected template</p>
        </div>
      </div>

      {/* Quick Edit Links */}
      <div className="wz-quick-edit-bar">
        <span className="wz-quick-edit-label">Quick edit:</span>
        {([1, 2, 3, 4, 5, 6] as WizardStep[]).map(s => (
          <button key={s} type="button" onClick={() => onGoToStep(s)} className="wz-quick-edit-btn">
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="wz-preview-actions">
        <button type="button" onClick={onDownloadPdf} className="wz-btn wz-btn-secondary wz-btn-icon">
          <DownloadIcon className="w-4 h-4" />
          Download PDF
        </button>
        <button type="button" onClick={onPrint} className="wz-btn wz-btn-secondary wz-btn-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Invoice
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="wz-btn wz-btn-primary wz-btn-icon"
        >
          {isSubmitting ? (
            <>
              <svg className="wz-spinner" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
              </svg>
              {existingInvoice ? "Save Changes" : "Generate Invoice"}
            </>
          )}
        </button>
      </div>

      {/* PDF Preview */}
      <div className="wz-pdf-preview-frame">
        <PDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar>
          <DummyPDF
            invoice={previewInvoiceData}
            profile={profileForPdf}
            templateId={selectedTemplateId}
          />
        </PDFViewer>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

const DRAFT_KEY = "zenbill_wizard_draft";

export const InvoiceWizard: React.FC<InvoiceWizardProps> = ({
  existingInvoice, addInvoice, updateInvoice,
  setView, profile, invoices, clients, products, addClient,
}) => {
  // ---------- Empty invoice factory ----------
  const emptyInvoice = useMemo(() => ({
    client: { id: "", name: "", email: "", address: "", gstin: "", state: "", stateCode: "" },
    items: [{ id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0, hsnCode: "", uom: "" }],
    issueDate: getTodayDateString(),
    dueDate: getTodayDateString(),
    status: InvoiceStatus.Draft,
    shippingDetails: { name: "", address: "", gstin: "", state: "", stateCode: "" },
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
    deliveryNote: "",
    eWayBillNo: "",
    bankDetails: profile.defaultBankDetails,
    termsAndConditions:
      "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if the payment is not made within the stipulated time.",
    jurisdiction: profile.companyState || "DURGAPUR",
  }), [profile]);

  // ---------- State ----------
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [invoice, setInvoice] = useState<Omit<Invoice, "id" | "invoiceNumber"> | Invoice>(() => {
    if (existingInvoice) return existingInvoice;
    // Try restoring draft
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!existingInvoice) return parsed.invoice || emptyInvoice;
      }
    } catch (_) {}
    return emptyInvoice;
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [newClientData, setNewClientData] = useState<NewClientData>({ name: "", gstin: "", address: "", state: "", stateCode: "" });
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [invoiceNumberPrefix, setInvoiceNumberPrefix] = useState("");
  const [invoiceNumberSequential, setInvoiceNumberSequential] = useState("");
  const [invoiceNumberError, setInvoiceNumberError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [bankDetailsList, setBankDetailsList] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [companySealBase64, setCompanySealBase64] = useState("");
  const [signatureBase64, setSignatureBase64] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("default");
  const [orderedProductLimits, setOrderedProductLimits] = useState<Record<string, number>>({});
  const [showSeal, setShowSeal] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showInvoiceNumberTip, setShowInvoiceNumberTip] = useState(false);
  const [hasSeenInvoiceNumberTip, setHasSeenInvoiceNumberTip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({ message: "", type: "success", isVisible: false });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e: any) => {
      const target = e.target;
      if (target && (target.tagName === "MAIN" || target === window || target === document)) {
        const scrollTop = target.scrollTop || 0;
        setScrolled(scrollTop > 40);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);
  const hideToast = useCallback(() => setToast(p => ({ ...p, isVisible: false })), []);

  // ---------- Template ----------
  useEffect(() => {
    const t = localStorage.getItem("zenbill_template");
    if (t) setSelectedTemplateId(t);
  }, []);

  // ---------- Invoice number generation ----------
  const generateNextInvoiceNumberFromBackend = useCallback(async (p: CompanyProfile): Promise<string> => {
    try {
      const backendInvoices = await apiListInvoices();
      const list: any[] = Array.isArray(backendInvoices) ? backendInvoices : Array.isArray(backendInvoices?.data) ? backendInvoices.data : [];
      const acronym = p.companyAcronym || p.companyName.split(" ").map(w => w[0]).join("").toUpperCase();
      const fyStr = getFinancialYearString(new Date());
      const prefix = `${acronym}/${fyStr}/`;
      const highest = list.filter(inv => String(inv.invoiceNumber || "").startsWith(prefix))
        .map(inv => parseInt(String(inv.invoiceNumber || "").split("/")[2] || "0", 10))
        .filter(n => !isNaN(n))
        .reduce((mx, n) => Math.max(mx, n), 0);
      return `${prefix}${(highest + 1).toString().padStart(3, "0")}`;
    } catch {
      return generateNextInvoiceNumber(invoices, p);
    }
  }, [invoices]);

  useEffect(() => {
    if (existingInvoice) {
      setInvoice(existingInvoice);
      const bill = existingInvoice.client;
      const ship = existingInvoice.shippingDetails;
      if (ship && (bill.name !== ship.name || bill.address !== ship.address)) setSameAsBilling(false);
      const parts = existingInvoice.invoiceNumber.split("/");
      if (parts.length === 3) {
        setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
        setInvoiceNumberSequential(parts[2]);
      }
    } else {
      (async () => {
        try {
          const next = await generateNextInvoiceNumberFromBackend(profile);
          const parts = next.split("/");
          if (parts.length === 3) {
            setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
            setInvoiceNumberSequential(parts[2]);
          }
        } catch {
          const fallback = generateNextInvoiceNumber(invoices, profile);
          const parts = fallback.split("/");
          if (parts.length === 3) {
            setInvoiceNumberPrefix(`${parts[0]}/${parts[1]}/`);
            setInvoiceNumberSequential(parts[2]);
          }
        }
      })();
    }
  }, [existingInvoice]);

  // ---------- Bank details ----------
  useEffect(() => {
    (async () => {
      try {
        const body = await apiListBankDetails();
        const list: any[] = Array.isArray(body) ? body : Array.isArray((body as any)?.data) ? (body as any).data : [];
        setBankDetailsList(list);
        if (!existingInvoice) {
          const active = list.find(bd => bd.active === true);
          if (active) {
            setSelectedBankId(String(active.id));
            setInvoice(prev => ({
              ...prev,
              bankDetails: {
                accountName: active.accountName ?? active.account_name ?? "",
                accountNumber: active.accountNumber ?? active.account_number ?? "",
                bankName: active.bankName ?? active.bank_name ?? "",
                branch: active.bankBranch ?? active.branch ?? "",
                ifsc: active.ifscCode ?? active.ifsc ?? "",
              }
            }));
          }
        }
      } catch (e) { console.error(e); }
    })();
  }, [existingInvoice]);

  // Sync selected bank id when invoice changes
  useEffect(() => {
    if (bankDetailsList.length > 0 && invoice.bankDetails) {
      const match = bankDetailsList.find(bd =>
        (bd.accountName ?? bd.account_name) === invoice.bankDetails?.accountName &&
        (bd.accountNumber ?? bd.account_number) === invoice.bankDetails?.accountNumber
      );
      if (match && String(match.id) !== selectedBankId) setSelectedBankId(String(match.id));
    }
  }, [invoice.bankDetails, bankDetailsList]);

  // ---------- Image to base64 ----------
  useEffect(() => {
    const convert = async (url: string | undefined, isLogo = false): Promise<string> => {
      if (!url) return "";
      if (url.startsWith("data:")) return url;
      try {
        let abs = url;
        if (url.startsWith("/api/")) abs = "http://localhost:8080" + url;
        const headers: HeadersInit = {};
        try { const t = localStorage.getItem("zenbill_auth_token"); if (t) (headers as any)["Authorization"] = `Bearer ${t}`; } catch (_) {}
        const res = await fetch(abs, { headers });
        if (!res.ok) return "";
        const blob = await res.blob();
        const isIco = abs.toLowerCase().includes(".ico") || blob.type === "image/x-icon" || blob.type === "image/vnd.microsoft.icon" || blob.type === "application/octet-stream";
        if (isIco && isLogo) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width || 128; canvas.height = img.height || 128;
              const ctx = canvas.getContext("2d");
              if (ctx) { ctx.drawImage(img, 0, 0); canvas.toBlob(b => { if (b) { const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(b); } else reject(new Error("fail")); }, "image/png"); }
              else reject(new Error("no ctx"));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          });
        }
        return new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result as string || "");
          r.onerror = () => reject(new Error("fail"));
          r.readAsDataURL(blob);
        });
      } catch { return ""; }
    };
    (async () => {
      setLogoBase64(await convert(profile.logo, true));
      setCompanySealBase64(await convert(profile.companySeal));
      setSignatureBase64(await convert(profile.authorizedSignature));
    })();
  }, [profile.logo, profile.companySeal, profile.authorizedSignature]);

  // ---------- Fetch client orders for order-picker ----------
  useEffect(() => {
    const clientId = (invoice as any).client?.id;
    if (!clientId || clientMode !== "existing") {
      setClientOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    apiGetClientOrders(clientId)
      .then((res: any) => {
        const orders = res?.success && Array.isArray(res.data) ? res.data : [];
        setClientOrders(orders);
      })
      .catch(() => setClientOrders([]))
      .finally(() => setIsLoadingOrders(false));
  }, [(invoice as any).client?.id, clientMode]);

  // ---------- Client orders (product limits) ----------
  useEffect(() => {
    const clientId = (invoice as any).client?.id;
    if (!clientId) { setOrderedProductLimits({}); return; }
    Promise.all([apiGetClientOrders(clientId), apiGetClientInvoices(clientId)])
      .then(([orderRes, invoiceRes]) => {
        const ordered: Record<string, number> = {};
        const billed: Record<string, number> = {};
        if (orderRes?.success && Array.isArray(orderRes.data)) {
          orderRes.data.forEach((order: any) => {
            if (Array.isArray(order.items)) order.items.forEach((item: any) => {
              const name = item.productName || item.description;
              if (name) ordered[name] = (ordered[name] || 0) + item.quantity;
            });
          });
        }
        if (invoiceRes?.success && Array.isArray(invoiceRes.data)) {
          invoiceRes.data.forEach((inv: any) => {
            if (existingInvoice && String(inv.id) === String(existingInvoice.id)) return;
            if (Array.isArray(inv.items)) inv.items.forEach((item: any) => {
              const name = item.description || item.productName;
              if (name) billed[name] = (billed[name] || 0) + (Number(item.quantity) || 0);
            });
          });
        }
        const limits: Record<string, number> = {};
        Object.keys(ordered).forEach(name => { limits[name] = Math.max(0, ordered[name] - (billed[name] || 0)); });
        setOrderedProductLimits(limits);
      })
      .catch(() => setOrderedProductLimits({}));
  }, [(invoice as any).client?.id, existingInvoice]);

  // ---------- Same as billing sync ----------
  useEffect(() => {
    if (sameAsBilling && (invoice as any).client) {
      const { name, address, gstin, state, stateCode } = (invoice as any).client;
      setInvoice(prev => ({
        ...prev,
        shippingDetails: { ...((prev as any).shippingDetails || {}), name, address, gstin, state, stateCode }
      }));
    }
  }, [sameAsBilling, (invoice as any).client]);

  // ---------- Persist draft to sessionStorage ----------
  useEffect(() => {
    if (!existingInvoice) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
          invoice, invoiceNumberPrefix, invoiceNumberSequential, currentStep
        }));
      } catch (_) {}
    }
  }, [invoice, invoiceNumberPrefix, invoiceNumberSequential, currentStep, existingInvoice]);

  // ---------- State code comparison ----------
  const companyStateCode = profile.companyStateCode?.trim().toLowerCase() || "";
  const clientStateCode = ((invoice as any).client?.stateCode?.trim().toLowerCase()) || "";
  const isIntraState = !clientStateCode || clientStateCode === companyStateCode;

  // ---------- Product options ----------
  const productOptionsForClient = useMemo(() => {
    const clientId = (invoice as any).client?.id;
    if (clientId && Object.keys(orderedProductLimits).length > 0) {
      return Object.entries(orderedProductLimits).map(([name, remaining]) => ({
        value: name, label: `${name} (Remaining: ${remaining})`,
      }));
    }
    return products.map(p => ({ value: p.name, label: p.name }));
  }, [products, (invoice as any).client?.id, orderedProductLimits]);

  // ---------- Tax calculations ----------
  const { cleanedItems, subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total, previewInvoiceData } = useMemo(() => {
    const items: InvoiceItem[] = ((invoice as any).items || []).filter((it: InvoiceItem) => it.description.trim() !== "");
    const sub = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const eCgst = isIntraState ? ((invoice as any).cgstRate || 0) : 0;
    const eSgst = isIntraState ? ((invoice as any).sgstRate || 0) : 0;
    const eIgst = !isIntraState ? ((invoice as any).igstRate || 0) : 0;
    const cgst = sub * (eCgst / 100);
    const sgst = sub * (eSgst / 100);
    const igst = sub * (eIgst / 100);
    const tax = cgst + sgst + igst;
    const grand = sub + tax;
    const fullInvoiceNumber = "invoiceNumber" in invoice ? (invoice as Invoice).invoiceNumber : `${invoiceNumberPrefix}${invoiceNumberSequential.padStart(3, "0")}`;
    const previewData: Invoice = {
      ...emptyInvoice,
      ...(invoice as any),
      cgstRate: eCgst, sgstRate: eSgst, igstRate: eIgst,
      items,
      id: "invoiceNumber" in invoice ? (invoice as Invoice).id : "preview-id",
      invoiceNumber: fullInvoiceNumber,
    };
    return { cleanedItems: items, subtotal: sub, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalTax: tax, total: grand, previewInvoiceData: previewData };
  }, [invoice, invoiceNumberPrefix, invoiceNumberSequential, emptyInvoice, isIntraState]);

  // ---------- Input handlers ----------
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setInvoice(prev => ({ ...prev, [name]: checked }));
    } else {
      setInvoice(prev => ({ ...prev, [name]: name.includes("Rate") ? parseFloat(value) || 0 : value }));
    }
  }, []);

  const handleNestedChange = useCallback((section: "client" | "shippingDetails" | "bankDetails", e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      [section]: { ...((prev as any)[section] || {}), [name]: value }
    }));
  }, []);

  const handleClientChange = useCallback((id: string) => {
    const found = clients.find(c => c.id === id);
    if (found) setInvoice(prev => ({ ...prev, client: found }));
    else setInvoice(prev => ({ ...prev, client: emptyInvoice.client }));
    setSelectedOrderId("");
    setOrderedProductLimits({});
  }, [clients, emptyInvoice]);

  const handleClientModeChange = useCallback((mode: ClientMode) => {
    setClientMode(mode);
    if (mode === "new") {
      // Clear existing client selection and product limits
      setInvoice(prev => ({ ...prev, client: { id: "", name: "", email: "", address: "", gstin: "", state: "", stateCode: "" } }));
      setSelectedOrderId("");
      setClientOrders([]);
      setOrderedProductLimits({});
    } else {
      // Clear new client form data
      setNewClientData({ name: "", gstin: "", address: "", state: "", stateCode: "" });
    }
  }, []);

  const handleNewClientDataChange = useCallback((field: keyof NewClientData, value: string) => {
    setNewClientData(prev => ({ ...prev, [field]: value }));
    // Keep invoice.client in sync so PDF preview and payload stay correct
    setInvoice(prev => ({
      ...prev,
      client: { ...((prev as any).client || {}), id: "", [field]: value },
    }));
  }, []);

  const handleOrderSelect = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    if (orderId) {
      const order = clientOrders.find((o: any) => String(o.id) === orderId);
      if (order && Array.isArray(order.items)) {
        // Build per-order limits filtered through global orderedProductLimits
        const filtered: Record<string, number> = {};
        order.items.forEach((item: any) => {
          const name = item.productName;
          if (name in orderedProductLimits) {
            filtered[name] = orderedProductLimits[name];
          } else {
            filtered[name] = Math.max(0, Number(item.quantity) || 0);
          }
        });
        setOrderedProductLimits(filtered);
      }
    } else {
      // No order selected: reset to global limits (re-trigger useEffect)
      setOrderedProductLimits({});
    }
  }, [clientOrders, orderedProductLimits]);

  const handleShippingClientChange = useCallback((id: string) => {
    if (id) setSameAsBilling(false);
    const found = clients.find(c => c.id === id);
    if (found) {
      const { name, address, gstin, state, stateCode } = found;
      setInvoice(prev => ({ ...prev, shippingDetails: { ...((prev as any).shippingDetails || {}), name, address, gstin, state, stateCode } }));
    } else {
      setInvoice(prev => ({ ...prev, shippingDetails: { name: "", address: "", gstin: "", state: "", stateCode: "" } }));
    }
  }, [clients]);

  const handleSequentialNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumberError(null);
    const num = e.target.value.replace(/[^0-9]/g, "");
    if (num.length <= 3) {
      setInvoiceNumberSequential(num);
      const candidate = `${invoiceNumberPrefix}${num.padStart(3, "0")}`;
      const isDuplicate = invoices.some(inv => inv.invoiceNumber.toLowerCase() === candidate.toLowerCase());
      const highest = getHighestInvoiceNumber(invoices, invoiceNumberPrefix);
      if (isDuplicate) setInvoiceNumberError("Invoice number already exists.");
      else if (num !== "" && Number(num) <= highest) setInvoiceNumberError(`Invoice no. must be > ${String(highest).padStart(3, "0")}.`);
    }
  }, [invoiceNumberPrefix, invoices]);

  const handleItemChange = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => {
      const items = [...((prev as any).items || [])];
      const item = { ...items[index], [field]: value };
      if (field === "description") {
        const found = products.find(p => p.name === value);
        if (found) { item.hsnCode = found.hsnCode || ""; item.uom = found.uom || ""; }
        const limit = orderedProductLimits[value as string];
        if (limit !== undefined && item.quantity > limit) {
          item.quantity = limit;
          showToast(`Quantity capped at ${limit} (Remaining Balance)`, "error");
        }
      }
      if (field === "quantity" || field === "unitPrice") {
        let n = value === "" ? 0 : Number(value);
        n = isNaN(n) ? 0 : n;
        if (field === "quantity") {
          const limit = orderedProductLimits[item.description];
          if (limit !== undefined && n > limit) { n = limit; showToast(`Cannot exceed remaining balance of ${limit}.`, "error"); }
        }
        item[field] = n;
      }
      items[index] = item;
      return { ...prev, items };
    });
  }, [products, orderedProductLimits, showToast]);

  const MAX_ITEMS_PER_TEMPLATE: Record<string, number> = { default: 10, tally: 8, template3: 10, simple: 12, creative: 12 };
  const maxItems = MAX_ITEMS_PER_TEMPLATE[selectedTemplateId] || 10;

  const addItem = useCallback(() => {
    if (((invoice as any).items || []).length >= maxItems) {
      showToast(`Maximum ${maxItems} items allowed for this template layout`, "error");
      return;
    }
    setInvoice(prev => ({
      ...prev,
      items: [...((prev as any).items || []), { id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0, hsnCode: "", uom: "" }]
    }));
  }, [invoice, maxItems, showToast]);

  const handleDeleteItem = useCallback((index: number) => {
    setItemToDelete(index);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteItem = useCallback(() => {
    if (itemToDelete !== null) {
      setInvoice(prev => ({ ...prev, items: ((prev as any).items || []).filter((_: any, i: number) => i !== itemToDelete) }));
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  }, [itemToDelete]);

  const handleBankSelect = useCallback((id: string) => {
    setSelectedBankId(id);
    const bank = bankDetailsList.find(bd => String(bd.id) === id);
    if (bank) {
      setInvoice(prev => ({
        ...prev,
        bankDetails: {
          accountName: bank.accountName ?? bank.account_name ?? "",
          accountNumber: bank.accountNumber ?? bank.account_number ?? "",
          bankName: bank.bankName ?? bank.bank_name ?? "",
          branch: bank.bankBranch ?? bank.branch ?? "",
          ifsc: bank.ifscCode ?? bank.ifsc ?? "",
        }
      }));
    }
  }, [bankDetailsList]);

  // ---------- PDF ----------
  const profileForPdf = useMemo(() => ({
    ...profile,
    logo: logoBase64 || profile.logo || "",
    companySeal: companySealBase64 || profile.companySeal || "",
    authorizedSignature: signatureBase64 || profile.authorizedSignature || "",
  }), [profile, logoBase64, companySealBase64, signatureBase64]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const blob = await pdf(<DummyPDF invoice={previewInvoiceData} profile={profileForPdf} templateId={selectedTemplateId} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const invoiceNum = previewInvoiceData.invoiceNumber.replace(/\//g, "-");
      const d = new Date(previewInvoiceData.issueDate || Date.now());
      const ds = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      const clientName = (previewInvoiceData.client?.name || "").replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      a.download = `${invoiceNum}-${ds}-${clientName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error("PDF download error", e); }
  }, [previewInvoiceData, profileForPdf, selectedTemplateId]);

  const generateAndUploadPdf = useCallback(async (data: Invoice): Promise<string | null> => {
    try {
      const blob = await pdf(<DummyPDF invoice={data} profile={profileForPdf} templateId={selectedTemplateId} />).toBlob();
      const invoiceNum = data.invoiceNumber.replace(/\//g, "-");
      const d = new Date(data.issueDate || Date.now());
      const ds = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      const clientName = (data.client?.name || "").replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const file = new File([blob], `${invoiceNum}-${ds}-${clientName}.pdf`, { type: "application/pdf" });
      const result: any = await apiStorageUpload(file, "invoices", "document");
      return result?.url || null;
    } catch (e) { console.error("PDF upload error", e); return null; }
  }, [profileForPdf, selectedTemplateId]);

  const handlePrint = useCallback(async () => {
    try {
      const blob = await pdf(<DummyPDF invoice={previewInvoiceData} profile={profileForPdf} templateId={selectedTemplateId} />).toBlob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) { win.onload = () => { win.print(); }; }
    } catch (e) { console.error("Print error", e); }
  }, [previewInvoiceData, profileForPdf, selectedTemplateId]);

  // ---------- Validation ----------
  const validateStep = useCallback((step: WizardStep): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!invoice.issueDate) errors.issueDate = "Date is required";
      if (!existingInvoice && !invoiceNumberSequential) errors.invoiceNumber = "Invoice number is required";
      if (invoiceNumberError) errors.invoiceNumber = invoiceNumberError;
    }
    if (step === 2) {
      if (clientMode === "new") {
        if (!newClientData.name.trim()) errors.clientName = "Client name is required";
      } else {
        if (!(invoice as any).client?.name?.trim()) errors.clientName = "Client name is required";
      }
    }
    if (step === 3) {
      if (cleanedItems.length === 0) errors.items = "At least one product item is required";
    }
    return errors;
  }, [invoice, existingInvoice, invoiceNumberSequential, invoiceNumberError, cleanedItems, clientMode, newClientData]);

  // ---------- Navigation ----------
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNext = useCallback(() => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    const next = (currentStep + 1) as WizardStep;
    if (next <= 7) goToStep(next);
  }, [currentStep, validateStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) goToStep((currentStep - 1) as WizardStep);
  }, [currentStep, goToStep]);

  const handleSaveDraft = useCallback(() => {
    showToast("Draft saved locally", "success");
  }, [showToast]);

  // ---------- Submit ----------
  const buildPayload = useCallback((data: any) => ({
    invoiceDate: data.issueDate,
    transportMode: data.transportMode || null,
    vehicleNo: data.vehicleNo || null,
    dateOfSupply: data.dateOfSupply || null,
    placeOfSupply: data.placeOfSupply || null,
    orderNumber: data.orderNo || null,
    taxOnReverseCharge: data.taxPayableOnReverseCharge || false,
    grLrNo: data.grLrNo || null,
    deliveryNote: data.deliveryNote || null,
    billedToName: data.client?.name || "",
    billedToAddress: data.client?.address || "",
    billedToGstin: data.client?.gstin || "",
    billedToState: data.client?.state || "",
    billedToCode: data.client?.stateCode || "",
    shippedToName: data.shippingDetails?.name || "",
    shippedToAddress: data.shippingDetails?.address || "",
    shippedToGstin: data.shippingDetails?.gstin || "",
    shippedToState: data.shippingDetails?.state || "",
    shippedToCode: data.shippingDetails?.stateCode || "",
    items: (data.items || []).map((it: any) => ({
      description: it.description,
      hsnCode: it.hsnCode || "",
      uom: it.uom || "",
      quantity: Number(it.quantity) || 0,
      rate: Number(it.unitPrice) || 0,
    })),
    cgstRate: isIntraState ? (data.cgstRate || 0) : 0,
    sgstRate: isIntraState ? (data.sgstRate || 0) : 0,
    igstRate: !isIntraState ? (data.igstRate || 0) : 0,
    selectedBankName: data.bankDetails?.bankName || profile.defaultBankDetails?.bankName || "",
    selectedAccountName: data.bankDetails?.accountName || profile.defaultBankDetails?.accountName || "",
    selectedAccountNumber: data.bankDetails?.accountNumber || profile.defaultBankDetails?.accountNumber || "",
    selectedIfscCode: data.bankDetails?.ifsc || profile.defaultBankDetails?.ifsc || "",
    termsAndConditions: data.termsAndConditions || "",
    ewayBillNo: data.eWayBillNo || "",
  }), [isIntraState, profile]);

  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const cleanData = { ...(invoice as any), items: cleanedItems };

      if (existingInvoice && updateInvoice) {
        const payload = buildPayload(cleanData);
        const pdfUrl = await generateAndUploadPdf(cleanData as Invoice);
        if (pdfUrl) (payload as any).pdfUrl = pdfUrl;
        await apiUpdateInvoice((existingInvoice as any).id, payload);
        updateInvoice(cleanData as Invoice);
        showToast("Invoice updated successfully!", "success");
        sessionStorage.removeItem(DRAFT_KEY);
        setTimeout(() => setView("invoices"), 1500);
      } else {
        const finalSeq = invoiceNumberSequential.padStart(3, "0");
        const fullNumber = `${invoiceNumberPrefix}${finalSeq}`;

        // Validate uniqueness against backend
        try {
          const backendInvoices = await apiListInvoices();
          const list: any[] = Array.isArray(backendInvoices) ? backendInvoices : Array.isArray(backendInvoices?.data) ? backendInvoices.data : [];
          const isDuplicate = list.some(inv => String(inv.invoiceNumber || "").toLowerCase() === fullNumber.toLowerCase());
          if (isDuplicate) {
            setInvoiceNumberError("Invoice number already exists.");
            showToast("Invoice number already exists.", "error");
            goToStep(1);
            setIsSubmitting(false);
            return;
          }
          const highest = list.filter(inv => String(inv.invoiceNumber || "").startsWith(invoiceNumberPrefix))
            .map(inv => parseInt(String(inv.invoiceNumber || "").split("/")[2] || "0", 10))
            .filter(n => !isNaN(n))
            .reduce((mx, n) => Math.max(mx, n), 0);
          if (!isNaN(parseInt(finalSeq, 10)) && parseInt(finalSeq, 10) <= highest) {
            const msg = `Invoice no. must be > ${String(highest).padStart(3, "0")}.`;
            setInvoiceNumberError(msg);
            showToast(msg, "error");
            goToStep(1);
            setIsSubmitting(false);
            return;
          }
        } catch { /* ignore, proceed */ }

        const invoiceDataForPdf: Invoice = {
          ...(cleanData as any),
          cgstRate: isIntraState ? (cleanData.cgstRate || 0) : 0,
          sgstRate: isIntraState ? (cleanData.sgstRate || 0) : 0,
          igstRate: !isIntraState ? (cleanData.igstRate || 0) : 0,
          invoiceNumber: fullNumber,
          id: "temp-id",
        };

        const payload = buildPayload(cleanData);
        const pdfUrl = await generateAndUploadPdf(invoiceDataForPdf);
        if (pdfUrl) (payload as any).pdfUrl = pdfUrl;
        await apiCreateInvoice(payload);
        showToast("Invoice created successfully!", "success");
        sessionStorage.removeItem(DRAFT_KEY);

        // ── Auto-create client & order for new-client mode ──
        if (clientMode === "new" && newClientData.name.trim()) {
          let createdClientId: string | null = null;
          try {
            const clientRes: any = await apiCreateClient({
              name: newClientData.name,
              address: newClientData.address,
              gstin: newClientData.gstin,
              state: newClientData.state,
              stateCode: newClientData.stateCode,
            });
            const d = clientRes?.data ?? clientRes;
            createdClientId = d?.id ? String(d.id) : null;
            // Optimistically refresh the parent client list
            if (addClient) {
              await addClient({
                name: newClientData.name,
                address: newClientData.address,
                gstin: newClientData.gstin,
                state: newClientData.state,
                stateCode: newClientData.stateCode,
              });
            }
          } catch (e) {
            console.warn("Auto client creation failed (invoice already saved):", e);
          }

          if (createdClientId) {
            try {
              const orderItems = cleanedItems
                .map(item => {
                  const prod = products.find(p => p.name === item.description);
                  return prod ? { productId: Number(prod.id), quantity: Number(item.quantity) || 0 } : null;
                })
                .filter(Boolean) as Array<{ productId: number; quantity: number }>;

              if (orderItems.length > 0) {
                await apiCreateOrder({
                  clientId: Number(createdClientId),
                  orderDate: new Date().toISOString().split("T")[0],
                  status: "AUTO_GENERATED",
                  items: orderItems,
                });
              }
            } catch (e) {
              console.warn("Auto order creation failed:", e);
            }
          }
        }

        setTimeout(() => setView("invoices"), 1500);
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to save invoice";
      showToast(msg, "error");
      if (msg.toLowerCase().includes("invoice number")) {
        setInvoiceNumberError(msg);
        goToStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [invoice, cleanedItems, existingInvoice, updateInvoice, buildPayload, generateAndUploadPdf,
    invoiceNumberSequential, invoiceNumberPrefix, isIntraState, showToast, setView, goToStep]);

  // ---------- Render current step ----------
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1InvoiceDetails
            invoice={invoice}
            invoiceNumberPrefix={invoiceNumberPrefix}
            invoiceNumberSequential={invoiceNumberSequential}
            invoiceNumberError={invoiceNumberError}
            existingInvoice={existingInvoice}
            profile={profile}
            showInvoiceNumberTip={showInvoiceNumberTip}
            hasSeenInvoiceNumberTip={hasSeenInvoiceNumberTip}
            onSequentialChange={handleSequentialNumberChange}
            onInputChange={handleInputChange}
            onCloseTip={() => { setShowInvoiceNumberTip(false); setHasSeenInvoiceNumberTip(true); }}
            validationErrors={validationErrors}
          />
        );
      case 2:
        return (
          <Step2BillingShipping
            invoice={invoice}
            sameAsBilling={sameAsBilling}
            clients={clients}
            clientMode={clientMode}
            newClientData={newClientData}
            clientOrders={clientOrders}
            isLoadingOrders={isLoadingOrders}
            selectedOrderId={selectedOrderId}
            onClientModeChange={handleClientModeChange}
            onNewClientDataChange={handleNewClientDataChange}
            onClientChange={handleClientChange}
            onShippingClientChange={handleShippingClientChange}
            onSameAsBillingChange={setSameAsBilling}
            onNestedChange={handleNestedChange as any}
            onOrderSelect={handleOrderSelect}
            validationErrors={validationErrors}
          />
        );
      case 3:
        return (
          <Step3ProductsTax
            invoice={invoice}
            products={products}
            productOptionsForClient={productOptionsForClient}
            isIntraState={isIntraState}
            subtotal={subtotal}
            cgstAmount={cgstAmount}
            sgstAmount={sgstAmount}
            igstAmount={igstAmount}
            totalTax={totalTax}
            total={total}
            selectedTemplateId={selectedTemplateId}
            onItemChange={handleItemChange}
            onAddItem={addItem}
            onDeleteItem={handleDeleteItem}
            onInputChange={handleInputChange}
            validationErrors={validationErrors}
          />
        );
      case 4:
        return <Step4Transport invoice={invoice} onInputChange={handleInputChange} />;
      case 5:
        return (
          <Step5BankDetails
            invoice={invoice}
            bankDetailsList={bankDetailsList}
            selectedBankId={selectedBankId}
            onBankSelect={handleBankSelect}
            onNestedChange={handleNestedChange as any}
          />
        );
      case 6:
        return (
          <Step6TermsAuth
            invoice={invoice}
            profile={profile}
            showSeal={showSeal}
            showSignature={showSignature}
            onShowSealChange={setShowSeal}
            onShowSignatureChange={setShowSignature}
            onInputChange={handleInputChange}
          />
        );
      case 7:
        return (
          <Step7Preview
            previewInvoiceData={previewInvoiceData}
            profile={profile}
            logoBase64={logoBase64}
            companySealBase64={companySealBase64}
            signatureBase64={signatureBase64}
            selectedTemplateId={selectedTemplateId}
            isSubmitting={isSubmitting}
            existingInvoice={existingInvoice}
            onDownloadPdf={handleDownloadPdf}
            onPrint={handlePrint}
            onSave={handleSave}
            onGoToStep={goToStep}
          />
        );
    }
  };

  // ---------- Render ----------
  return (
    <div className="wz-root">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} duration={5000} />

      {/* Sticky Top Bar (Header + Stepper) */}
      <div className={`wz-top-bar ${scrolled ? "wz-top-bar-scrolled" : ""}`}>
        {/* Header */}
        <div className="wz-header">
          <div className="wz-header-left">
            <h1 className="wz-main-title" data-step={`Step ${currentStep} of 7`}>
              {existingInvoice ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <p className="wz-main-sub">
              {existingInvoice ? `Editing: ${existingInvoice.invoiceNumber}` : "Complete all steps to generate your invoice"}
            </p>
          </div>
          <div className="wz-header-right">
            <span className={`wz-template-badge ${selectedTemplateId}`}>
              Template: {selectedTemplateId === "tally" ? "Tally ERP" : selectedTemplateId === "template3" ? "Professional" : selectedTemplateId === "simple" ? "Simple Clean" : selectedTemplateId === "creative" ? "Creative Studio" : "Default Standard"}
            </span>
            <button type="button" onClick={() => setView("invoices")} className="wz-btn wz-btn-ghost">
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="wz-stepper-wrap">
          <Stepper currentStep={currentStep} onStepClick={goToStep} completedSteps={completedSteps} />
        </div>
      </div>

      {/* Step content */}
      <div className="wz-content-wrap">
        {renderStep()}
      </div>

      {/* Footer Navigation (hidden on step 7) */}
      {currentStep < 7 && (
        <div className="wz-nav-footer">
          <div className="wz-nav-footer-inner">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="wz-btn wz-btn-ghost"
              id="wizard-back-btn"
            >
              ← Previous
            </button>
            <div className="wz-nav-center">
              <button type="button" onClick={handleSaveDraft} className="wz-btn wz-btn-outline" id="wizard-draft-btn">
                Save Draft
              </button>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="wz-btn wz-btn-primary"
              id="wizard-next-btn"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Delete item modal */}
      {showDeleteConfirm && (
        <div className="wz-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="wz-modal" onClick={e => e.stopPropagation()}>
            <h3 className="wz-modal-title">Remove Item?</h3>
            <p className="wz-modal-body">Are you sure you want to remove this product item? This cannot be undone.</p>
            <div className="wz-modal-actions">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="wz-btn wz-btn-ghost">Cancel</button>
              <button type="button" onClick={confirmDeleteItem} className="wz-btn wz-btn-danger">Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ================================================================
           WIZARD CSS – Inline styles for portability
           ================================================================ */

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .wz-root {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: #F1F5F9;
          min-height: 100vh;
          padding-bottom: 100px;
          color: #0F172A;
        }

        /* ---- STICKY TOP BAR ---- */
        .wz-top-bar {
          position: sticky;
          top: -24px;
          z-index: 40;
          background: #fff;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,.05), 0 2px 4px -1px rgba(0,0,0,.03);
          transition: all 0.2s ease;
        }
        @media (min-width: 768px) {
          .wz-top-bar {
            top: -32px;
          }
        }
        .wz-top-bar-scrolled {
          top: 0px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
          border-bottom: 1px solid #E2E8F0;
        }
        .wz-top-bar-scrolled .wz-header {
          padding: 6px 16px !important;
          border-bottom: none !important;
        }
        .wz-top-bar-scrolled .wz-main-title {
          font-size: 14px !important;
        }
        .wz-top-bar-scrolled .wz-main-title::after {
          content: " (" attr(data-step) ")" !important;
          font-size: 11px !important;
          color: #64748B !important;
          font-weight: 500 !important;
        }
        .wz-top-bar-scrolled .wz-main-sub {
          display: none !important;
        }
        .wz-top-bar-scrolled .wz-template-badge {
          display: none !important;
        }
        .wz-top-bar-scrolled .wz-header-right {
          gap: 4px !important;
        }
        .wz-top-bar-scrolled .wz-btn-ghost {
          padding: 4px 8px !important;
          font-size: 11px !important;
          min-height: 24px !important;
        }
        .wz-top-bar-scrolled .wz-stepper-wrap {
          padding: 2px 16px 6px !important;
        }
        .wz-top-bar-scrolled .wz-step-label {
          display: none !important;
        }
        .wz-top-bar-scrolled .wz-step-circle {
          width: 20px !important;
          height: 20px !important;
          font-size: 10px !important;
          border-width: 1.5px !important;
        }
        .wz-top-bar-scrolled .wz-step-check {
          width: 10px !important;
          height: 10px !important;
        }
        .wz-top-bar-scrolled .wz-step-connector {
          margin-bottom: 0px !important;
          height: 1.5px !important;
        }
        .wz-top-bar-scrolled .wz-mobile-step-label {
          display: none !important;
        }
        .wz-top-bar-scrolled .wz-mobile-step-badge {
          margin-bottom: 0px !important;
        }

        /* ---- HEADER ---- */
        .wz-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          background: #fff;
          border-bottom: 1px solid #E2E8F0;
          padding: 20px 24px;
          transition: padding 0.2s ease-in-out;
        }
        .wz-main-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          transition: font-size 0.2s ease-in-out;
        }
        .wz-main-sub {
          font-size: 13px;
          color: #64748B;
          margin: 2px 0 0;
        }
        .wz-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .wz-template-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          background: #EDE9FE;
          color: #5B21B6;
        }

        /* ---- BUTTONS ---- */
        .wz-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all .15s ease;
          text-decoration: none;
          white-space: nowrap;
          min-height: 38px;
        }
        .wz-btn:disabled { opacity: .55; cursor: not-allowed; }
        .wz-btn-primary { background: #4F46E5; color: #fff; box-shadow: 0 1px 4px rgba(79,70,229,.25); }
        .wz-btn-primary:hover:not(:disabled) { background: #4338CA; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,.3); }
        .wz-btn-secondary { background: #fff; color: #374151; border: 1.5px solid #D1D5DB; }
        .wz-btn-secondary:hover:not(:disabled) { background: #F9FAFB; border-color: #9CA3AF; }
        .wz-btn-outline { background: transparent; color: #4F46E5; border: 1.5px solid #C7D2FE; }
        .wz-btn-outline:hover:not(:disabled) { background: #EEF2FF; }
        .wz-btn-ghost { background: transparent; color: #64748B; }
        .wz-btn-ghost:hover:not(:disabled) { background: #F1F5F9; color: #0F172A; }
        .wz-btn-danger { background: #EF4444; color: #fff; }
        .wz-btn-danger:hover:not(:disabled) { background: #DC2626; }
        .wz-btn-icon { gap: 8px; }

        /* ---- STEPPER ---- */
        .wz-stepper-wrap {
          background: #fff;
          border-bottom: 1px solid #E2E8F0;
          padding: 16px 24px;
          transition: padding 0.2s ease-in-out;
        }
        .wz-stepper-desktop {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          overflow-x: auto;
        }
        @media (max-width: 768px) { .wz-stepper-desktop { display: none; } }
        .wz-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: default;
          padding: 0 4px;
          min-width: 80px;
        }
        .wz-step.wz-step-done { cursor: pointer; }
        .wz-step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #CBD5E1;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #94A3B8;
          transition: all .2s ease;
          position: relative;
          z-index: 1;
        }
        .wz-step.wz-step-done .wz-step-circle {
          background: #10B981;
          border-color: #10B981;
          color: #fff;
        }
        .wz-step.wz-step-active .wz-step-circle {
          background: #4F46E5;
          border-color: #4F46E5;
          color: #fff;
          box-shadow: 0 0 0 4px rgba(79,70,229,.15);
          animation: wz-pulse 2s infinite;
        }
        @keyframes wz-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(79,70,229,.15); }
          50% { box-shadow: 0 0 0 8px rgba(79,70,229,.07); }
        }
        .wz-step-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .04em;
          color: #94A3B8;
          text-align: center;
          line-height: 1.2;
          max-width: 80px;
        }
        .wz-step.wz-step-done .wz-step-label { color: #10B981; }
        .wz-step.wz-step-active .wz-step-label { color: #4F46E5; font-weight: 700; }
        .wz-step-check { width: 16px; height: 16px; }
        .wz-step-connector {
          flex: 1;
          height: 2px;
          background: #E2E8F0;
          margin-bottom: 18px;
          min-width: 24px;
          transition: background .2s;
        }
        .wz-connector-done { background: #10B981; }

        /* Mobile stepper */
        .wz-stepper-mobile { display: none; }
        @media (max-width: 768px) { .wz-stepper-mobile { display: block; } }
        .wz-mobile-step-badge {
          width: 100%;
          height: 4px;
          background: #E2E8F0;
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .wz-mobile-progress {
          height: 100%;
          background: linear-gradient(90deg, #4F46E5, #818CF8);
          border-radius: 99px;
          transition: width .35s ease;
        }
        .wz-mobile-step-label {
          font-size: 13px;
          color: #64748B;
          text-align: center;
          margin: 0;
        }
        .wz-mobile-step-label strong { color: #0F172A; }

        /* ---- CONTENT AREA ---- */
        .wz-content-wrap {
          max-width: 900px;
          margin: 24px auto;
          padding: 0 16px;
        }
        .wz-step-content {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
          overflow: hidden;
        }

        /* ---- STEP HEADER ---- */
        .wz-step-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid #F1F5F9;
        }
        .wz-step-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .wz-step-icon svg { width: 24px; height: 24px; }
        .wz-icon-1 { background: #EFF6FF; color: #2563EB; }
        .wz-icon-2 { background: #F0FDF4; color: #16A34A; }
        .wz-icon-3 { background: #FFF7ED; color: #EA580C; }
        .wz-icon-4 { background: #F5F3FF; color: #7C3AED; }
        .wz-icon-5 { background: #FDF2F8; color: #DB2777; }
        .wz-icon-6 { background: #FFF1F2; color: #E11D48; }
        .wz-icon-7 { background: #ECFDF5; color: #059669; }
        .wz-step-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }
        .wz-step-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 2px 0 0;
        }

        /* ---- FORM FIELDS ---- */
        .wz-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          padding: 24px;
        }
        @media (max-width: 640px) { .wz-grid-2 { grid-template-columns: 1fr; gap: 14px; padding: 16px; } }
        .wz-grid-1 { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
        .wz-grid-2-sm { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .wz-grid-2-sm { grid-template-columns: 1fr; } }

        .wz-field { display: flex; flex-direction: column; gap: 6px; }
        .wz-field-row { display: flex; flex-direction: column; gap: 6px; }
        .wz-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .wz-required { color: #EF4444; margin-left: 3px; }
        .wz-error { font-size: 11px; color: #EF4444; margin: 0; }

        .wz-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #0F172A;
          background: #fff;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
          min-height: 44px;
        }
        .wz-input:focus {
          outline: none;
          border-color: #4F46E5;
          box-shadow: 0 0 0 3px rgba(79,70,229,.1);
        }
        .wz-input:disabled {
          background: #F8FAFC;
          color: #94A3B8;
          cursor: not-allowed;
          border-color: #E2E8F0;
        }
        .wz-input-error { border-color: #EF4444 !important; }
        .wz-textarea { resize: vertical; min-height: 88px; }
        .wz-uppercase { text-transform: uppercase; }
        .wz-mb-4 { margin-bottom: 16px; }

        /* ---- INVOICE NUMBER ---- */
        .wz-invoice-number-input {
          display: flex;
          align-items: center;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          min-height: 44px;
        }
        .wz-invoice-prefix {
          padding: 10px 12px;
          background: #F8FAFC;
          color: #64748B;
          font-size: 13px;
          font-weight: 600;
          border-right: 1px solid #E2E8F0;
          white-space: nowrap;
        }
        .wz-invoice-seq {
          flex: 1;
          padding: 10px 12px;
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 700;
          color: #0F172A;
          background: transparent;
          min-width: 60px;
          font-family: inherit;
        }
        .wz-readonly-badge {
          padding: 10px 14px;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        /* ---- TOGGLE ---- */
        .wz-toggle-row { display: flex; align-items: center; gap: 10px; padding-top: 4px; }
        .wz-toggle { position: relative; display: inline-block; cursor: pointer; }
        .wz-toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
        .wz-toggle-slider {
          display: block;
          width: 44px;
          height: 24px;
          background: #CBD5E1;
          border-radius: 12px;
          transition: background .2s;
          position: relative;
        }
        .wz-toggle-slider::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px;
          width: 20px; height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: transform .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.15);
        }
        .wz-toggle-input:checked + .wz-toggle-slider { background: #4F46E5; }
        .wz-toggle-input:checked + .wz-toggle-slider::after { transform: translateX(20px); }
        .wz-toggle-value { font-size: 13px; font-weight: 600; color: #374151; }

        /* ---- TIP MODAL ---- */
        .wz-tip-modal {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }
        .wz-tip-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 360px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,.15);
          display: flex; flex-direction: column; gap: 16px;
        }
        .wz-tip-text { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; }

        /* ---- BILLING / SHIPPING ---- */
        .wz-billing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 24px;
        }
        @media (max-width: 768px) { .wz-billing-grid { grid-template-columns: 1fr; } }
        .wz-section-card {
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
        }
        .wz-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          flex-wrap: wrap;
        }
        .wz-section-billing { background: #EFF6FF; color: #1D4ED8; }
        .wz-section-shipping { background: #F0FDF4; color: #166534; }
        .wz-section-icon { width: 14px; height: 14px; flex-shrink: 0; }
        .wz-section-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .wz-section-disabled { opacity: .55; pointer-events: none; }
        .wz-same-billing-check {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          cursor: pointer;
        }
        .wz-check-input { width: 15px; height: 15px; accent-color: #4F46E5; cursor: pointer; }
        .wz-check-label { font-size: 11px; font-weight: 600; cursor: pointer; }

        /* ---- PRODUCT TABLE ---- */
        .wz-product-table-wrap {
          overflow-x: auto;
          padding: 0 24px 4px;
        }
        @media (max-width: 640px) { .wz-product-table-wrap { padding: 0 12px; } }
        .wz-product-table {
          width: 100%;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          overflow: hidden;
          min-width: 680px;
        }
        .wz-table-header {
          display: grid;
          grid-template-columns: 48px 1fr 90px 72px 80px 90px 100px 44px;
          background: #F8FAFC;
          border-bottom: 1.5px solid #E2E8F0;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #64748B;
        }
        .wz-table-header > div { padding: 10px 8px; text-align: center; }
        .wz-table-row {
          display: grid;
          grid-template-columns: 48px 1fr 90px 72px 80px 90px 100px 44px;
          border-bottom: 1px solid #F1F5F9;
          align-items: center;
        }
        .wz-table-row:last-child { border-bottom: none; }
        .wz-table-row:hover { background: #FAFBFF; }
        .wz-col-sno { }
        .wz-col-desc { }
        .wz-col-hsn { }
        .wz-col-uom { }
        .wz-col-qty { }
        .wz-col-rate { }
        .wz-col-amt { }
        .wz-col-del { }
        .wz-cell-center { display: flex; align-items: center; justify-content: center; }
        .wz-cell-gray { color: #94A3B8; font-size: 13px; font-weight: 600; }
        .wz-cell-pad { padding: 6px; }
        .wz-cell-amt {
          padding: 8px;
          text-align: right;
          font-weight: 700;
          font-size: 13px;
          color: #0F172A;
          background: #F8FAFC;
        }
        .wz-table-input {
          width: 100%;
          padding: 7px 8px;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          color: #0F172A;
          background: #fff;
          min-height: 36px;
          box-sizing: border-box;
          transition: border-color .15s;
        }
        .wz-table-input:focus { outline: none; border-color: #818CF8; box-shadow: 0 0 0 2px rgba(79,70,229,.08); }
        .wz-center { text-align: center; }
        .wz-right { text-align: right; }
        .wz-combobox { width: 100%; }
        .wz-delete-btn {
          width: 32px; height: 32px;
          border: none; background: none;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: #94A3B8;
          cursor: pointer;
          transition: all .15s;
        }
        .wz-delete-btn:hover { background: #FEF2F2; color: #EF4444; }
        .wz-table-footer {
          padding: 10px 16px;
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
        }
        .wz-add-item-btn {
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          background: #EEF2FF;
          color: #4F46E5;
          border: 1.5px solid #C7D2FE;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s;
          font-family: inherit;
        }
        .wz-add-item-btn:hover:not(:disabled) { background: #E0E7FF; }
        .wz-add-item-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ---- TAX SECTION ---- */
        .wz-tax-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px 24px;
          border-top: 1.5px solid #F1F5F9;
          margin-top: 4px;
        }
        @media (max-width: 640px) { .wz-tax-section { grid-template-columns: 1fr; } }
        .wz-tax-left { }
        .wz-tax-words-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #64748B;
          margin: 0 0 6px;
        }
        .wz-tax-words { font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.5; }
        .wz-tax-right { }
        .wz-tax-rates {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .wz-tax-rate-group { display: flex; align-items: center; gap: 6px; }
        .wz-tax-rate-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; white-space: nowrap; }
        .wz-rate-input {
          width: 56px;
          padding: 5px 6px;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          text-align: right;
          color: #0F172A;
          background: #fff;
          font-family: inherit;
        }
        .wz-rate-input:focus { outline: none; border-color: #4F46E5; }
        .wz-rate-disabled { background: #F1F5F9; color: #94A3B8; }
        .wz-tax-rate-sep { width: 1px; height: 20px; background: #E2E8F0; }
        .wz-totals { display: flex; flex-direction: column; gap: 6px; }
        .wz-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #374151;
          padding: 4px 0;
          border-bottom: 1px dashed #F1F5F9;
        }
        .wz-total-row:last-child { border-bottom: none; }
        .wz-grand-total {
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          background: #EEF2FF;
          padding: 10px 12px;
          border-radius: 8px;
          margin-top: 4px;
          border: none !important;
        }

        /* ---- ALERTS ---- */
        .wz-alert-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          font-size: 13px;
          color: #B91C1C;
          margin: 0 24px 4px;
        }
        .wz-alert-icon { width: 18px; height: 18px; flex-shrink: 0; }
        .wz-info-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 16px 24px;
          background: #F0F9FF;
          border-top: 1px solid #E0F2FE;
          font-size: 13px;
          color: #0369A1;
          line-height: 1.5;
          margin-top: 8px;
        }
        .wz-info-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

        /* ---- AUTH SECTION ---- */
        .wz-auth-options { display: flex; flex-direction: column; gap: 12px; }
        .wz-auth-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .wz-auth-toggle:hover { border-color: #C7D2FE; background: #FAFBFF; }
        .wz-auth-toggle-content { flex: 1; }
        .wz-auth-toggle-title { display: block; font-size: 13px; font-weight: 600; color: #0F172A; }
        .wz-auth-toggle-sub { display: block; font-size: 11px; color: #64748B; margin-top: 2px; }
        .wz-auth-thumb { width: 48px; height: 32px; object-fit: contain; border-radius: 4px; border: 1px solid #E2E8F0; }
        .wz-company-info-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
        }
        .wz-company-info-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: #EFF6FF;
          color: #2563EB;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .wz-company-info-icon svg { width: 20px; height: 20px; }
        .wz-company-info-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; margin: 0; letter-spacing: .05em; }
        .wz-company-info-name { font-size: 15px; font-weight: 800; color: #0F172A; margin: 2px 0; }
        .wz-company-info-detail { font-size: 12px; color: #64748B; margin: 0; }

        /* ---- PREVIEW STEP ---- */
        .wz-quick-edit-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px 24px;
          border-bottom: 1px solid #F1F5F9;
          background: #FAFBFF;
        }
        .wz-quick-edit-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .05em; }
        .wz-quick-edit-btn {
          padding: 4px 10px;
          border: 1px solid #C7D2FE;
          border-radius: 20px;
          background: #EEF2FF;
          color: #4338CA;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          font-family: inherit;
        }
        .wz-quick-edit-btn:hover { background: #E0E7FF; }
        .wz-preview-actions {
          display: flex;
          gap: 10px;
          padding: 16px 24px;
          border-bottom: 1px solid #F1F5F9;
          flex-wrap: wrap;
        }
        .wz-preview-actions .wz-btn-primary { margin-left: auto; }
        @media (max-width: 560px) { .wz-preview-actions .wz-btn-primary { margin-left: 0; width: 100%; justify-content: center; } }
        .wz-pdf-preview-frame {
          height: 72vh;
          min-height: 480px;
          border-top: 1px solid #E2E8F0;
        }

        /* ---- NAV FOOTER ---- */
        .wz-nav-footer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid #E2E8F0;
          z-index: 30;
          padding: 12px 24px;
        }
        .wz-nav-footer-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .wz-nav-center { flex: 1; display: flex; justify-content: center; }
        @media (max-width: 480px) {
          .wz-nav-footer { padding: 10px 12px; }
          .wz-btn { padding: 10px 14px; font-size: 13px; min-height: 44px; }
        }

        /* ---- SPINNER ---- */
        .wz-spinner { width: 16px; height: 16px; animation: wz-spin 1s linear infinite; }
        @keyframes wz-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ---- MODALS ---- */
        .wz-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 16px;
        }
        .wz-modal {
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
          display: flex; flex-direction: column; gap: 12px;
        }
        .wz-modal-title { font-size: 17px; font-weight: 800; color: #0F172A; margin: 0; }
        .wz-modal-body { font-size: 14px; color: #475569; line-height: 1.6; margin: 0; }
        .wz-modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

        /* ---- CLIENT MODE TOGGLE ---- */
        .wz-client-mode-toggle {
          display: flex; gap: 8px; margin-bottom: 16px;
          background: #F1F5F9; border-radius: 10px; padding: 4px;
        }
        .wz-mode-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 12px; border-radius: 7px; border: none; cursor: pointer;
          font-size: 12.5px; font-weight: 600; color: #64748B;
          background: transparent; transition: all 0.18s ease;
        }
        .wz-mode-btn:hover { background: #E2E8F0; color: #334155; }
        .wz-mode-btn-active {
          background: #fff; color: #1E40AF;
          box-shadow: 0 1px 4px rgba(0,0,0,.1);
        }

        /* ---- ORDER PICKER ---- */
        .wz-order-select-wrap {
          background: linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 100%);
          border: 1px solid #C7D2FE; border-radius: 10px;
          padding: 12px 14px; margin-bottom: 14px;
        }
        .wz-order-select-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; color: #3730A3;
          text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px;
        }
        .wz-orders-loading { font-size: 11px; font-weight: 500; color: #6366F1; margin-left: 4px; }
        .wz-order-empty { font-size: 12px; color: #64748B; margin: 0; font-style: italic; }
        .wz-order-preview {
          margin-top: 8px; border-top: 1px solid #C7D2FE; padding-top: 8px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .wz-order-item-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; padding: 3px 0;
        }
        .wz-order-item-name { color: #1E293B; font-weight: 600; }
        .wz-order-item-qty { color: #3730A3; font-weight: 700; font-size: 11px; }

        /* ---- NEW CLIENT NOTICE ---- */
        .wz-new-client-notice {
          display: flex; align-items: flex-start; gap: 8px;
          background: #FEF3C7; border: 1px solid #FDE68A;
          border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;
          font-size: 12.5px; color: #92400E; font-weight: 500; line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default InvoiceWizard;
