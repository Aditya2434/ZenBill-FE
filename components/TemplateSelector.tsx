import React, { useState, useEffect } from "react";
import { Toast, ToastType } from "./Toast";

export interface TemplateSelectorProps {
  setView: (view: any) => void;
}

interface TemplateDef {
  id: string;
  name: string;
  description: string;
  color: string;
  badge?: string;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: "default",
    name: "Default Standard (Classic)",
    description: "Your primary industry-standard billing layout. Features structured dual column summaries, full tax breakdowns, bank remittance tables, and official stamp positions.",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "Classic Look",
  },
  {
    id: "tally",
    name: "Template 2 (Tally ERP Format)",
    description: "A highly structured, grid-based layout matching traditional accounting software formats. Side-by-side addresses with a detailed tabular footer.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "template3",
    name: "Template 3 (Professional)",
    description: "A professional top-down hierarchy. Prominent company name, separated header details, split addresses, and structured metadata rows before the item table.",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "New Layout",
  },
  {
    id: "simple",
    name: "Simple Clean",
    description: "Minimalist and distraction-free design. Perfect for rapid billing and structured data presentation.",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    id: "creative",
    name: "Creative Studio",
    description: "A bold, stylized layout with modern geometric accents designed for freelancers, agencies, and studios.",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ setView }) => {
  const [activeTemplate, setActiveTemplate] = useState<string>("default");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

  useEffect(() => {
    const saved = localStorage.getItem("zenbill_template");
    if (saved) {
      setActiveTemplate(saved);
    }
  }, []);

  const handleSelectTemplate = (id: string) => {
    setActiveTemplate(id);
    localStorage.setItem("zenbill_template", id);
    showToast(`Template changed to ${TEMPLATES.find((t) => t.id === id)?.name}`, "success");
    setPreviewTemplateId(null); // Close modal if open
  };

  // Renders the exact A4 structured HTML for the invoices
  const renderLivePreviewInvoice = (id: string) => {
    switch (id) {
      case "default":
        return (
          <div className="w-[800px] h-[1130px] bg-white p-8 text-[13px] text-black font-sans box-border flex flex-col shadow-sm">
            <div className="border border-black flex-1 flex flex-col">
              {/* Header */}
              <div className="flex p-4 items-center shrink-0">
                <div className="w-20 h-20 bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-500 font-bold">LOGO</div>
                <div className="flex-1 text-center px-4">
                  <div className="text-2xl font-bold uppercase">YOUR COMPANY NAME CO.</div>
                  <div className="mt-1">123 Corporate Office Blvd, Business District, State</div>
                  <div className="font-bold mt-1">GSTIN: 22AAAAA0000A1Z0 &nbsp;&nbsp;&nbsp; PAN: ABCDE1234F</div>
                </div>
                <div className="w-20"></div>
              </div>
              
              <div className="text-center font-bold text-lg border-y border-black py-1 shrink-0">TAX INVOICE</div>
              
              {/* Details Block */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black shrink-0">
                <div className="p-3 space-y-1.5">
                  <div className="flex"><span className="w-48 font-semibold">Tax Invoice No.</span><span>: INV/2026/001</span></div>
                  <div className="flex"><span className="w-48 font-semibold">Date</span><span>: 18-05-2026</span></div>
                  <div className="flex"><span className="w-48 font-semibold">Tax Payable on Reverse Charge</span><span>: No</span></div>
                  <div className="flex"><span className="w-48 font-semibold">State & Code</span><span className="font-bold">: West Bengal 19</span></div>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex"><span className="w-36 font-semibold">Transport Mode</span><span>: Road</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Vehicle No</span><span className="font-bold">: WB-XX-0000</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Date of Supply</span><span className="font-bold">: 18-05-2026</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Place of Supply</span><span>: Destination City</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Order No</span><span className="font-bold">: ORD-999</span></div>
                  <div className="flex"><span className="w-36 font-semibold">GR/LR No</span><span className="font-bold">: -</span></div>
                  <div className="flex"><span className="w-36 font-semibold">E WAY BILL No</span><span className="font-bold">: -</span></div>
                </div>
              </div>

              {/* Billed / Shipped To */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black shrink-0">
                <div className="flex flex-col">
                  <div className="bg-gray-200 text-center font-bold py-1.5 border-b border-black">DETAILS OF RECEIVER (BILLED TO)</div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex"><span className="w-24 font-semibold">Name</span><span className="font-bold">: ABC Client Pvt Ltd</span></div>
                    <div className="flex"><span className="w-24 font-semibold">Address</span><span>: 456 Commercial Dist, State</span></div>
                    <div className="flex"><span className="w-24 font-semibold">GSTIN</span><span>: 19AAAAA0000A1Z5</span></div>
                    <div className="flex"><span className="w-24 font-semibold">State</span><span className="font-bold">: West Bengal 19</span></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="bg-gray-200 text-center font-bold py-1.5 border-b border-black">DETAILS OF RECEIVER (SHIPPED TO)</div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex"><span className="w-24 font-semibold">Name</span><span className="font-bold">: ABC Client Pvt Ltd</span></div>
                    <div className="flex"><span className="w-24 font-semibold">Address</span><span>: 456 Commercial Dist, State</span></div>
                    <div className="flex"><span className="w-24 font-semibold">GSTIN</span><span>: 19AAAAA0000A1Z5</span></div>
                    <div className="flex"><span className="w-24 font-semibold">State</span><span className="font-bold">: West Bengal 19</span></div>
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div className="flex border-b border-black font-bold text-center divide-x divide-black bg-gray-100 shrink-0">
                <div className="w-[6%] p-2">S.NO</div>
                <div className="w-[34%] p-2">DESCRIPTION OF GOODS</div>
                <div className="w-[12%] p-2">HSN CODE</div>
                <div className="w-[12%] p-2">UOM</div>
                <div className="w-[12%] p-2">QUANTITY</div>
                <div className="w-[12%] p-2">RATE</div>
                <div className="w-[12%] p-2">AMOUNT</div>
              </div>

              {/* Table Body (Flex-1 to stretch down) */}
              <div className="flex-1 flex divide-x divide-black border-b border-black">
                <div className="w-[6%] p-3 text-center">1</div>
                <div className="w-[34%] p-3 text-left font-semibold">Sample Premium Product</div>
                <div className="w-[12%] p-3 text-center">000000</div>
                <div className="w-[12%] p-3 text-center">NOS</div>
                <div className="w-[12%] p-3 text-right">10</div>
                <div className="w-[12%] p-3 text-right">5,000.00</div>
                <div className="w-[12%] p-3 text-right pr-4">50,000.00</div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black shrink-0">
                <div className="p-3">
                  <span className="font-bold block mb-1">Total Amount in Words INR:</span>
                  <span>FIFTY NINE THOUSAND RUPEES ONLY.</span>
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex justify-between"><span className="font-bold">Total Amount before tax</span><span>50,000.00</span></div>
                  <div className="flex justify-between font-bold"><span>Add: CGST @ 9%</span><span>4,500.00</span></div>
                  <div className="flex justify-between font-bold"><span>Add: SGST @ 9%</span><span>4,500.00</span></div>
                  <div className="flex justify-between font-bold border-t border-black mt-2 pt-2"><span>Total Tax Amount</span><span>9,000.00</span></div>
                  <div className="flex justify-between font-bold border-t border-black mt-2 pt-2"><span>Total Amount after Tax</span><span>59,000.00</span></div>
                </div>
              </div>

              {/* Footer Bank & Terms */}
              <div className="p-4 flex flex-col shrink-0">
                <div className="font-bold mb-2 uppercase tracking-wide">OUR BANK DETAIL :</div>
                <div className="flex"><span className="w-36 font-semibold">A/C NAME</span><span className="font-bold">: YOUR COMPANY NAME CO.</span></div>
                <div className="flex"><span className="w-36 font-semibold">A/C NO</span><span className="font-bold">: 758601010050048</span></div>
                <div className="flex"><span className="w-36 font-semibold">BANK</span><span className="font-bold">: UNION BANK OF INDIA</span></div>
                <div className="flex"><span className="w-36 font-semibold">BRANCH / IFSC</span><span className="font-bold">: CITY CENTRE / UBIN0815187</span></div>
                
                <div className="mt-3">
                  <div className="font-bold underline mb-1.5">Terms & Condition for Supply :</div>
                  <div>1. Goods once sold will not be taken back.</div>
                  <div>2. Interest @18% p.a. will be charged if payment is delayed.</div>
                </div>

                <div className="grid grid-cols-3 mt-4 items-end">
                  <div className="pb-1">Subject to <span className="font-bold">DURGAPUR</span> Jurisdiction</div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border border-gray-400 flex items-center justify-center text-gray-400 text-xs mb-1">SEAL</div>
                    <span>Common seal</span>
                  </div>
                  <div className="flex flex-col items-end pb-1">
                    <div className="font-bold mb-8">For YOUR COMPANY NAME CO.</div>
                    <div className="font-bold">Authorised</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "tally":
        return (
          <div className="w-[800px] h-[1130px] bg-white p-8 text-[13px] text-black font-sans box-border flex flex-col shadow-sm">
            <div className="border border-black flex-1 flex flex-col">
              {/* Header 3-Cols */}
              <div className="flex border-b border-black p-4 items-center shrink-0">
                <div className="w-1/4">
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-500 font-bold">LOGO</div>
                </div>
                <div className="w-1/2 text-center">
                  <div className="text-3xl font-black uppercase tracking-wide">YOUR COMPANY NAME CO.</div>
                  <div className="text-[14px] mt-2">123 Corporate Office Blvd, State</div>
                  <div className="text-[14px] mt-2">PAN: <span className="font-bold">ABCDE1234F</span> &nbsp;|&nbsp; GSTIN: <span className="font-bold">22AAAAA0000A1Z0</span></div>
                </div>
                <div className="w-1/4 flex justify-end">
                  <div className="w-24 h-24 border border-gray-400 bg-gray-50 flex items-center justify-center text-gray-500 font-bold">QR CODE</div>
                </div>
              </div>

              <div className="border-b border-black py-2.5 bg-gray-100 text-center font-black tracking-widest text-xl shrink-0">TAX INVOICE</div>
              
              {/* Address / Meta */}
              <div className="flex border-b border-black divide-x divide-black shrink-0">
                <div className="w-1/2 flex flex-col divide-y divide-black">
                  <div className="p-4 flex flex-col justify-center min-h-[140px]">
                    <div className="text-gray-600 text-[11px] uppercase font-bold mb-1.5 tracking-widest">Consignee (Ship to)</div>
                    <div className="font-bold text-lg">ABC Client Company Pvt Ltd</div>
                    <div className="mt-1">Plot 99, Fulfillment Complex Phase 2, State</div>
                    <div className="mt-1.5">GSTIN: 19AAAAA0000A1Z5</div>
                  </div>
                  <div className="p-4 flex flex-col justify-center min-h-[140px]">
                    <div className="text-gray-600 text-[11px] uppercase font-bold mb-1.5 tracking-widest">Buyer (Bill to)</div>
                    <div className="font-bold text-lg">ABC Client Company Pvt Ltd</div>
                    <div className="mt-1">456 Commercial District, Block C, State</div>
                    <div className="mt-1.5">GSTIN: 19AAAAA0000A1Z5</div>
                  </div>
                </div>
                <div className="w-1/2 grid grid-cols-2 divide-x divide-y divide-black">
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Invoice No.</div><div className="font-bold text-base mt-1">INV/2026/0001</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Dated</div><div className="font-bold text-base mt-1">18-05-2026</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Delivery Note</div><div className="font-bold text-base mt-1">-</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Buyer's Order No.</div><div className="font-bold text-base mt-1">ORD-00000</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">E-Way Bill No :</div><div className="font-bold text-base mt-1">-</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Delivery Date </div><div className="font-bold text-base mt-1">-</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Dispatched through</div><div className="font-bold text-base mt-1">Road</div></div>
                  <div className="p-3 flex flex-col justify-center"><div className="text-gray-600 text-[11px] uppercase font-bold">Destination</div><div className="font-bold text-base mt-1">City</div></div>
                </div>
              </div>

              {/* Table Header */}
              <div className="flex border-b border-black bg-gray-100 font-bold text-center divide-x divide-black py-2 shrink-0">
                <div className="w-[6%] p-2">Sl</div>
                <div className="w-[34%] p-2">Description of Goods</div>
                <div className="w-[12%] p-2">HSN/SAC</div>
                <div className="w-[14%] p-2">Quantity</div>
                <div className="w-[14%] p-2">Rate</div>
                <div className="w-[20%] p-2">Amount</div>
              </div>
              
              {/* Table Body (Flex-1) */}
              <div className="flex-1 flex divide-x divide-black">
                <div className="w-[6%] p-4 text-center">1</div>
                <div className="w-[34%] p-4 font-bold">Sample Premium Product A</div>
                <div className="w-[12%] p-4 text-center">000000</div>
                <div className="w-[14%] p-4 text-right">10 NOS</div>
                <div className="w-[14%] p-4 text-right">5,000.00</div>
                <div className="w-[20%] p-4 text-right font-bold pr-6">50,000.00</div>
              </div>

              {/* Tally Totals */}
              <div className="flex border-t border-b border-black divide-x divide-black bg-gray-100 shrink-0">
                <div className="w-[80%] p-4 text-right font-bold text-lg">Total</div>
                <div className="w-[20%] p-4 text-right font-bold text-lg pr-6">₹59,000.00</div>
              </div>

              <div className="p-4 bg-gray-50 border-b border-black shrink-0">
                <div className="text-gray-600 text-[12px] font-bold uppercase tracking-widest mb-1.5">Amount Chargeable (in words)</div>
                <div className="font-bold text-lg">FIFTY NINE THOUSAND RUPEES ONLY.</div>
              </div>

              {/* Tax Block */}
              <div className="flex border-b border-black font-bold text-center divide-x divide-black bg-gray-100 shrink-0">
                <div className="w-[20%] p-3">HSN/SAC</div>
                <div className="w-[20%] p-3">Taxable Value</div>
                <div className="w-[20%] p-3">CGST Amount</div>
                <div className="w-[20%] p-3">SGST Amount</div>
                <div className="w-[20%] p-3">Total Tax Amount</div>
              </div>
              <div className="flex border-b border-black text-center divide-x divide-black items-center shrink-0">
                <div className="w-[20%] p-4 font-medium">As per items</div>
                <div className="w-[20%] p-4 text-right">₹50,000.00</div>
                <div className="w-[20%] p-4 text-right">₹4,500.00</div>
                <div className="w-[20%] p-4 text-right">₹4,500.00</div>
                <div className="w-[20%] p-4 text-right font-bold bg-gray-50">₹9,000.00</div>
              </div>

              {/* Declaration / Auth */}
              <div className="flex shrink-0 min-h-[130px] justify-end">
                 <div className="w-1/2 p-4 flex flex-col justify-between items-end">
                    <div className="font-bold text-base">for YOUR COMPANY NAME CO.</div>
                    <div className="font-bold uppercase text-gray-600">Authorised Signatory</div>
                 </div>
              </div>
            </div>
          </div>
        );

      case "template3":
        return (
          <div className="w-[800px] h-[1130px] bg-white p-8 text-[13px] text-black font-sans box-border flex flex-col shadow-sm">
            <div className="border border-black flex-1 flex flex-col">
              
              {/* Box 1: Company Name */}
              <div className="border-b border-black p-3 text-center shrink-0 bg-gray-50">
                <div className="text-2xl font-bold uppercase tracking-wide">YOUR COMPANY NAME CO.</div>
              </div>

              {/* Box 2: Three Parts (Logo, Details, QR) */}
              <div className="flex border-b border-black divide-x divide-black shrink-0 items-center min-h-[90px]">
                <div className="w-[20%] flex justify-center p-2">
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-500 font-bold">LOGO</div>
                </div>
                <div className="w-[60%] p-2 text-center">
                  <div className="mt-1">123 Corporate Office Blvd, Business District, State</div>
                  <div className="mt-1">State: West Bengal | Code: 19</div>
                  <div className="font-bold mt-1">GSTIN: 22AAAAA0000A1Z0 &nbsp;&nbsp;&nbsp; PAN: ABCDE1234F</div>
                </div>
                <div className="w-[20%] flex justify-center p-2">
                  <div className="w-16 h-16 border border-gray-400 bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-xs">QR</div>
                </div>
              </div>

              {/* Box 3: Tax Invoice Heading */}
              <div className="text-center font-bold text-lg border-b border-black py-1.5 shrink-0 bg-gray-100 uppercase tracking-widest">
                TAX INVOICE
              </div>
              
              {/* Box 4: Bill To / Ship To */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black shrink-0">
                {/* Billed To */}
                <div className="flex flex-col">
                  <div className="bg-gray-200 text-center font-bold py-1.5 border-b border-black">DETAILS OF RECEIVER (BILLED TO)</div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex"><span className="w-24 font-semibold">Name</span><span className="font-bold">: ABC Client Pvt Ltd</span></div>
                    <div className="flex"><span className="w-24 font-semibold">Address</span><span>: 456 Commercial Dist, State</span></div>
                    <div className="flex"><span className="w-24 font-semibold">GSTIN</span><span>: 19AAAAA0000A1Z5</span></div>
                    <div className="flex"><span className="w-24 font-semibold">State</span><span className="font-bold">: West Bengal 19</span></div>
                  </div>
                </div>
                {/* Shipped To */}
                <div className="flex flex-col">
                  <div className="bg-gray-200 text-center font-bold py-1.5 border-b border-black">DETAILS OF RECEIVER (SHIPPED TO)</div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex"><span className="w-24 font-semibold">Name</span><span className="font-bold">: ABC Client Pvt Ltd</span></div>
                    <div className="flex"><span className="w-24 font-semibold">Address</span><span>: 456 Commercial Dist, State</span></div>
                    <div className="flex"><span className="w-24 font-semibold">GSTIN</span><span>: 19AAAAA0000A1Z5</span></div>
                    <div className="flex"><span className="w-24 font-semibold">State</span><span className="font-bold">: West Bengal 19</span></div>
                  </div>
                </div>
              </div>

              {/* Box 5: Meta Details Left / Right */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black shrink-0">
                {/* Left */}
                <div className="p-3 space-y-1.5">
                  <div className="flex"><span className="w-48 font-semibold">Tax Invoice No.</span><span className="font-bold">: INV/2026/001</span></div>
                  <div className="flex"><span className="w-48 font-semibold">Date</span><span className="font-bold">: 18-05-2026</span></div>
                  <div className="flex"><span className="w-48 font-semibold">Tax Payable on Reverse Charge</span><span>: No</span></div>
                  <div className="flex"><span className="w-48 font-semibold">State & Code</span><span className="font-bold">: West Bengal 19</span></div>
                </div>
                {/* Right */}
                <div className="p-3 space-y-1.5">
                  <div className="flex"><span className="w-36 font-semibold">Transport Mode</span><span>: Road</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Vehicle No</span><span className="font-bold">: WB-XX-0000</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Date of Supply</span><span className="font-bold">: 18-05-2026</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Place of Supply</span><span>: Destination City</span></div>
                  <div className="flex"><span className="w-36 font-semibold">Order No</span><span className="font-bold">: ORD-999</span></div>
                </div>
              </div>

              {/* Box 6: Product Table (Copied from default) */}
              <div className="flex border-b border-black font-bold text-center divide-x divide-black bg-gray-100 shrink-0">
                <div className="w-[6%] p-2">S.NO</div>
                <div className="w-[34%] p-2">DESCRIPTION OF GOODS</div>
                <div className="w-[12%] p-2">HSN CODE</div>
                <div className="w-[12%] p-2">UOM</div>
                <div className="w-[12%] p-2">QUANTITY</div>
                <div className="w-[12%] p-2">RATE</div>
                <div className="w-[12%] p-2">AMOUNT</div>
              </div>
              <div className="flex-1 flex divide-x divide-black border-b border-black">
                <div className="w-[6%] p-3 text-center">1</div>
                <div className="w-[34%] p-3 text-left font-semibold">Sample Premium Product</div>
                <div className="w-[12%] p-3 text-center">000000</div>
                <div className="w-[12%] p-3 text-center">NOS</div>
                <div className="w-[12%] p-3 text-right">10</div>
                <div className="w-[12%] p-3 text-right">5,000.00</div>
                <div className="w-[12%] p-3 text-right pr-4">50,000.00</div>
              </div>

              {/* Box 7+: Totals and Footer (Copied from default) */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black shrink-0">
                <div className="p-3">
                  <span className="font-bold block mb-1">Total Amount in Words INR:</span>
                  <span>FIFTY NINE THOUSAND RUPEES ONLY.</span>
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex justify-between"><span className="font-bold">Total Amount before tax</span><span>50,000.00</span></div>
                  <div className="flex justify-between font-bold"><span>Add: CGST @ 9%</span><span>4,500.00</span></div>
                  <div className="flex justify-between font-bold"><span>Add: SGST @ 9%</span><span>4,500.00</span></div>
                  <div className="flex justify-between font-bold border-t border-black mt-2 pt-2"><span>Total Tax Amount</span><span>9,000.00</span></div>
                  <div className="flex justify-between font-bold border-t border-black mt-2 pt-2"><span>Total Amount after Tax</span><span>59,000.00</span></div>
                </div>
              </div>

              <div className="p-4 flex flex-col shrink-0">
                <div className="font-bold mb-2 uppercase tracking-wide">OUR BANK DETAIL :</div>
                <div className="flex"><span className="w-36 font-semibold">A/C NAME</span><span className="font-bold">: YOUR COMPANY NAME CO.</span></div>
                <div className="flex"><span className="w-36 font-semibold">A/C NO</span><span className="font-bold">: 758601010050048</span></div>
                <div className="flex"><span className="w-36 font-semibold">BANK</span><span className="font-bold">: UNION BANK OF INDIA</span></div>
                <div className="flex"><span className="w-36 font-semibold">BRANCH / IFSC</span><span className="font-bold">: CITY CENTRE / UBIN0815187</span></div>
                
                <div className="mt-3">
                  <div className="font-bold underline mb-1.5">Terms & Condition for Supply :</div>
                  <div>1. Goods once sold will not be taken back.</div>
                  <div>2. Interest @18% p.a. will be charged if payment is delayed.</div>
                </div>

                <div className="grid grid-cols-3 mt-4 items-end">
                  <div className="pb-1">Subject to <span className="font-bold">DURGAPUR</span> Jurisdiction</div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border border-gray-400 flex items-center justify-center text-gray-400 text-xs mb-1">SEAL</div>
                    <span>Common seal</span>
                  </div>
                  <div className="flex flex-col items-end pb-1">
                    <div className="font-bold mb-8">For YOUR COMPANY NAME CO.</div>
                    <div className="font-bold">Authorised</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "simple":
      case "creative":
      default:
        return (
           <div className="w-[800px] h-[1130px] bg-gray-50 flex items-center justify-center border border-gray-200">
              <p className="text-gray-400 font-bold text-3xl">Preview Not Available</p>
           </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-[1600px] mx-auto animate-fade-in relative">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
        duration={3000}
      />

      <div className="p-6 border-b border-gray-200 flex items-center gap-4">
        <button
          onClick={() => setView("invoices")}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Invoice Templates</h2>
          <p className="text-sm text-gray-500 mt-1">Review and select professional layouts for generating PDFs.</p>
        </div>
      </div>

      <div className="p-6 md:p-8 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {TEMPLATES.map((template) => {
            const isActive = activeTemplate === template.id;
            return (
              <div
                key={template.id}
                className={`relative flex flex-col p-5 xl:p-6 rounded-2xl border-2 transition-all duration-300 bg-white group ${
                  isActive ? "border-indigo-600 shadow-md ring-4 ring-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:shadow-lg"
                }`}
              >
                {template.badge && !isActive && (
                  <span className="absolute top-5 right-5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 z-10">
                    {template.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute top-5 right-5 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm z-10">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Active
                  </span>
                )}

                {/* Card Text Info */}
                <div className="flex items-start gap-4 mb-6 z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${template.color}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg xl:text-xl font-extrabold text-gray-900 tracking-tight">{template.name}</h3>
                    <p className="text-xs xl:text-sm text-gray-500 mt-1.5 pr-2 leading-relaxed line-clamp-3 min-h-[60px]">{template.description}</p>
                  </div>
                </div>

                {/* Thumbnail Container */}
                <div className="mb-6 flex justify-center bg-slate-100 py-6 rounded-xl border border-slate-200 shadow-inner relative overflow-hidden">
                   <div className="relative w-[280px] h-[395px] bg-white overflow-hidden shadow-sm border border-gray-300">
                      <div className="absolute top-0 left-0 w-[800px] h-[1130px] origin-top-left scale-[0.35] pointer-events-none">
                         {renderLivePreviewInvoice(template.id)}
                      </div>
                   </div>

                   {/* Hover Overlay with Button */}
                   <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto z-20 backdrop-blur-[2px]">
                      <button
                        onClick={() => setPreviewTemplateId(template.id)}
                        className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:bg-indigo-50 hover:scale-105 transition-all flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Template
                      </button>
                   </div>
                </div>

                {/* Action Button */}
                <div className="mt-auto flex items-center justify-end z-10 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => handleSelectTemplate(template.id)}
                    disabled={isActive}
                    className={`w-full px-6 py-3 text-sm font-bold rounded-xl transition-all ${
                      isActive ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform active:scale-[0.98]"
                    }`}
                  >
                    {isActive ? "Currently Active Layout" : "Select Layout"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL VIEW MODAL */}
      {previewTemplateId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={() => setPreviewTemplateId(null)}>
           <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Preview: {TEMPLATES.find(t => t.id === previewTemplateId)?.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">True A4 Aspect Ratio View</p>
                    </div>
                 </div>
                 <button onClick={() => setPreviewTemplateId(null)} className="text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600 rounded-lg p-2 transition-colors focus:outline-none">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 flex justify-center bg-slate-200/50">
                 <div className="shadow-2xl ring-1 ring-black/5 bg-white transform origin-top shrink-0">
                   {renderLivePreviewInvoice(previewTemplateId)}
                 </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                 <button onClick={() => setPreviewTemplateId(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                   Close Preview
                 </button>
                 <button 
                    onClick={() => handleSelectTemplate(previewTemplateId)}
                    disabled={activeTemplate === previewTemplateId} 
                    className={`px-8 py-2.5 font-bold rounded-xl transition-all shadow-md ${
                      activeTemplate === previewTemplateId ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                 >
                   {activeTemplate === previewTemplateId ? "Already Active" : "Select This Layout"}
                 </button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;