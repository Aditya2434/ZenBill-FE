import React, { useState, useEffect } from "react";
import { Toast, ToastType } from "./Toast";

interface TemplateSelectorProps {
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
    badge: "New Layout",
  },
  {
    id: "modern",
    name: "Modern Crisp",
    description: "A sleek, contemporary design with accented typography, clean left-aligned sections, and minimal borders.",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
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
    color: "bg-purple-50 text-purple-700 border-purple-200",
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
  };

  const renderMiniThumbnail = (id: string) => {
    switch (id) {
      case "default":
        return (
          <div className="w-full h-24 bg-white rounded-lg border border-slate-200 p-1 flex flex-col justify-between overflow-hidden group-hover:border-blue-400 transition-colors text-[6px]">
            <div className="text-center border-b border-slate-200 pb-0.5">
              <div className="w-16 h-1.5 bg-slate-800 mx-auto rounded-xs" />
              <div className="w-24 h-1 bg-slate-300 mx-auto rounded-xs mt-0.5" />
            </div>
            <div className="grid grid-cols-2 gap-1 my-0.5 border-b border-slate-100 pb-0.5">
              <div className="space-y-0.5">
                <div className="w-10 h-1 bg-slate-400 rounded-xs" />
                <div className="w-12 h-1 bg-slate-300 rounded-xs" />
              </div>
              <div className="space-y-0.5">
                <div className="w-10 h-1 bg-slate-400 rounded-xs" />
                <div className="w-8 h-1 bg-slate-300 rounded-xs" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="w-full h-1 bg-slate-100 rounded-xs" />
              <div className="w-full h-1 bg-slate-100 rounded-xs" />
            </div>
            <div className="flex justify-between items-center pt-0.5 border-t border-slate-200 mt-auto">
              <div className="w-12 h-2 bg-slate-100 border border-slate-200 rounded-xs" />
              <div className="w-10 h-1.5 bg-slate-300 rounded-xs" />
            </div>
          </div>
        );
      case "tally":
        return (
          <div className="w-full h-24 bg-white rounded-lg border border-slate-200 p-1 flex flex-col overflow-hidden group-hover:border-emerald-400 transition-colors text-[6px]">
            <div className="flex justify-between border-b border-slate-200 pb-0.5 mb-0.5">
               <div className="w-10 h-2 bg-slate-300 rounded-xs" />
               <div className="w-16 h-2 bg-slate-800 rounded-xs" />
            </div>
            <div className="grid grid-cols-2 gap-0.5 border-b border-slate-200 pb-0.5 mb-0.5">
               <div className="h-6 border-r border-slate-200 pr-0.5 space-y-0.5">
                  <div className="w-full h-1 bg-slate-200" />
                  <div className="w-full h-1 bg-slate-200" />
               </div>
               <div className="h-6 pl-0.5 space-y-0.5">
                  <div className="w-full h-1 bg-slate-200" />
                  <div className="w-full h-1 bg-slate-200" />
               </div>
            </div>
            <div className="w-full h-4 border border-slate-200 mb-0.5" />
            <div className="w-full h-3 border border-slate-200 mb-0.5" />
            <div className="w-full h-4 border border-slate-200" />
          </div>
        );
      case "modern":
        return (
          <div className="w-full h-24 bg-slate-50 rounded-lg border border-slate-200 p-2 flex overflow-hidden group-hover:border-indigo-300 transition-colors">
            <div className="w-1.5 h-full bg-indigo-600 rounded-l -ml-2 mr-2" />
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="w-12 h-2.5 bg-slate-800 rounded" />
                  <div className="w-8 h-1.5 bg-slate-400 rounded" />
                </div>
                <div className="w-10 h-2 bg-slate-300 rounded" />
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-200 rounded" />
                <div className="w-3/4 h-1.5 bg-slate-200 rounded" />
              </div>
              <div className="w-full h-2 bg-slate-300 rounded-sm" />
            </div>
          </div>
        );
      case "simple":
        return (
          <div className="w-full h-24 bg-white rounded-lg border border-slate-200 p-2 flex flex-col justify-between overflow-hidden group-hover:border-slate-400 transition-colors">
            <div className="text-center border-b border-slate-100 pb-1">
              <div className="w-16 h-2 bg-slate-700 mx-auto rounded" />
            </div>
            <div className="grid grid-cols-3 gap-1 my-1">
              <div className="h-8 bg-slate-50 border border-slate-100 rounded-sm" />
              <div className="h-8 bg-slate-50 border border-slate-100 rounded-sm" />
              <div className="h-8 bg-slate-50 border border-slate-100 rounded-sm" />
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-xs" />
          </div>
        );
      case "creative":
        return (
          <div className="w-full h-24 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-lg border border-slate-200 p-2 flex flex-col justify-between overflow-hidden group-hover:border-purple-300 transition-colors">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 -mx-2 -mt-2 px-2 flex items-center justify-between">
              <div className="w-8 h-1 bg-white/60 rounded" />
              <div className="w-8 h-1 bg-white/80 rounded" />
            </div>
            <div className="space-y-1.5 my-2">
              <div className="flex justify-between">
                <div className="w-14 h-2 bg-slate-700 rounded" />
                <div className="w-6 h-2 bg-slate-400 rounded" />
              </div>
              <div className="w-full h-1 bg-slate-200 rounded" />
            </div>
            <div className="w-1/3 h-2 bg-purple-200 rounded self-end" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderLivePreviewInvoice = (id: string) => {
    switch (id) {
      case "default":
        return (
          <div className="w-full bg-white border border-slate-400 rounded-sm shadow-xl p-6 text-xs font-sans text-slate-800">
            {/* Header Block */}
            <div className="flex justify-between items-center mb-4">
              <div className="w-14 h-14 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-medium">
                YOUR LOGO
              </div>
              <div className="text-center flex-1 mx-4">
                <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">YOUR COMPANY NAME CO.</h4>
                <p className="text-[10px] text-slate-500">123 Corporate Office Blvd, Suite 400, Business District, State, Pincode</p>
                <p className="text-[10px] text-slate-800 font-bold mt-0.5">GSTIN: 22AAAAA0000A1Z0</p>
                <p className="text-[10px] text-slate-600 font-semibold">PAN: ABCDE1234F</p>
              </div>
              <div className="w-10 h-10 border border-slate-200 rounded bg-slate-50 flex items-center justify-center text-[8px] text-slate-400">
                MOCK QR
              </div>
            </div>
            <div className="text-center font-black tracking-widest text-sm text-slate-900 border-t border-b border-slate-800 py-1 bg-slate-50 mb-3">
              TAX INVOICE
            </div>
            <div className="grid grid-cols-2 border border-slate-800 mb-3 text-[11px] divide-x divide-slate-800">
              <div className="p-2 space-y-1">
                <div className="flex"><span className="w-[45%] text-slate-600">Tax Invoice No.</span><span className="w-3">:</span><span className="font-bold">INV/2026/0001</span></div>
                <div className="flex"><span className="w-[45%] text-slate-600">Date</span><span className="w-3">:</span><span className="font-bold">18-05-2026</span></div>
              </div>
              <div className="p-2 space-y-1">
                <div className="flex"><span className="w-[40%] text-slate-600">Transport Mode</span><span className="w-3">:</span><span>Road Transport</span></div>
                <div className="flex"><span className="w-[40%] text-slate-600">Vehicle No</span><span className="w-3">:</span><span className="font-bold">XX-00-XX-0000</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 border border-slate-800 mb-3 text-[11px] divide-x divide-slate-800">
              <div className="p-0">
                <div className="bg-slate-200 text-center font-bold border-b border-slate-800 py-0.5 text-[10px]">DETAILS OF RECEIVER (BILLED TO)</div>
                <div className="p-2 space-y-1">
                  <p className="font-bold">ABC Client Company Private Limited</p>
                  <p className="text-slate-600 text-[10px]">456 Commercial District, Block C, Destination City, State</p>
                </div>
              </div>
              <div className="p-0">
                <div className="bg-slate-200 text-center font-bold border-b border-slate-800 py-0.5 text-[10px]">DETAILS OF RECEIVER (SHIPPED TO)</div>
                <div className="p-2 space-y-1">
                  <p className="font-bold">ABC Client Company Private Limited</p>
                  <p className="text-slate-600 text-[10px]">Plot 99, Fulfillment Complex Phase 2, Shipped City, State</p>
                </div>
              </div>
            </div>
            <div className="border border-slate-800 mb-3 overflow-hidden">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 font-bold text-slate-900 text-center">
                    <th className="p-1 border-r border-slate-800 w-8">S.NO</th>
                    <th className="p-1 border-r border-slate-800 text-left">DESCRIPTION OF GOODS</th>
                    <th className="p-1 w-20">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr className="text-center">
                    <td className="p-1 border-r border-slate-800">1</td>
                    <td className="p-1 border-r border-slate-800 text-left font-medium">Sample Premium Product Line Item A</td>
                    <td className="p-1 text-right pr-2 font-semibold">50,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "tally":
        return (
          <div className="w-full bg-white border border-slate-400 rounded-sm shadow-xl p-6 text-[10px] font-sans text-slate-800">
            {/* Tally Style Header */}
            <div className="flex border border-slate-800 mb-0 border-b-0 divide-x divide-slate-800">
               <div className="w-1/2 p-2 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-slate-100 mb-2 flex items-center justify-center text-[8px] text-slate-400 border border-dashed border-slate-300">LOGO</div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">YOUR COMPANY NAME CO.</h4>
                    <p className="text-[9px] text-slate-600">123 Corporate Office Blvd, State</p>
                    <p className="text-[9px] mt-1">PAN: <span className="font-bold">ABCDE1234F</span> | GSTIN: <span className="font-bold">22AAAAA0000A1Z0</span></p>
                  </div>
               </div>
               <div className="w-1/2 relative">
                  <div className="absolute right-2 top-2 font-black text-sm tracking-widest">TAX INVOICE</div>
                  <div className="absolute right-2 top-8 w-10 h-10 border border-slate-300 bg-slate-50 text-[8px] flex items-center justify-center text-slate-400">QR</div>
               </div>
            </div>
            
            {/* Address & Meta Data Block */}
            <div className="flex border border-slate-800 border-b-0 divide-x divide-slate-800">
               <div className="w-1/2 flex flex-col divide-y divide-slate-800">
                  <div className="p-2 h-20">
                     <p className="text-slate-500 text-[8px] mb-1">Consignee (Ship to)</p>
                     <p className="font-bold">ABC Client Company Private Limited</p>
                     <p>Plot 99, Fulfillment Complex Phase 2, State</p>
                  </div>
                  <div className="p-2 h-20">
                     <p className="text-slate-500 text-[8px] mb-1">Buyer (Bill to)</p>
                     <p className="font-bold">ABC Client Company Private Limited</p>
                     <p>456 Commercial District, Block C, State</p>
                  </div>
               </div>
               <div className="w-1/2 grid grid-cols-2 divide-x divide-y divide-slate-800">
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Invoice No.</p><p className="font-bold">INV/2026/0001</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Dated</p><p className="font-bold">18-05-2026</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Delivery Note</p><p className="font-bold">-</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Mode/Terms of Payment</p><p className="font-bold">-</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Buyer's Order No.</p><p className="font-bold">ORD-00000</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Dated</p><p className="font-bold">-</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Dispatch Doc No.</p><p className="font-bold">-</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Delivery Note Date</p><p className="font-bold">-</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Dispatched through</p><p className="font-bold">Road</p></div>
                  <div className="p-2"><p className="text-slate-500 text-[8px]">Destination</p><p className="font-bold">City</p></div>
               </div>
            </div>

            {/* Table */}
            <div className="border border-slate-800 border-b-0">
               <div className="flex bg-slate-100 border-b border-slate-800 font-bold text-center divide-x divide-slate-800">
                  <div className="w-[5%] p-1">Sl</div>
                  <div className="w-[35%] p-1">Description of Goods</div>
                  <div className="w-[15%] p-1">HSN/SAC</div>
                  <div className="w-[15%] p-1">Quantity</div>
                  <div className="w-[15%] p-1">Rate</div>
                  <div className="w-[15%] p-1">Amount</div>
               </div>
               <div className="flex divide-x divide-slate-800 min-h-[100px]">
                  <div className="w-[5%] p-1 text-center">1</div>
                  <div className="w-[35%] p-1 font-bold">Sample Premium Product A</div>
                  <div className="w-[15%] p-1 text-center">000000</div>
                  <div className="w-[15%] p-1 text-right">10 NOS</div>
                  <div className="w-[15%] p-1 text-right">5,000.00</div>
                  <div className="w-[15%] p-1 text-right font-bold">50,000.00</div>
               </div>
            </div>

            {/* Totals & Footer */}
            <div className="flex border border-slate-800 divide-x divide-slate-800">
               <div className="w-[85%] p-1 text-right font-bold">Total</div>
               <div className="w-[15%] p-1 text-right font-bold">₹82,600.00</div>
            </div>
            <div className="border border-slate-800 border-t-0 p-2">
               <p className="text-slate-500 text-[8px] mb-0.5">Amount Chargeable (in words)</p>
               <p className="font-bold">EIGHTY TWO THOUSAND SIX HUNDRED RUPEES ONLY.</p>
            </div>
          </div>
        );

      case "modern":
      case "simple":
      case "creative":
        return (
           <div className="flex items-center justify-center h-64 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-400 font-medium">Select to preview Layout</p>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-5xl mx-auto animate-fade-in">
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

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEMPLATES.map((template) => {
            const isActive = activeTemplate === template.id;
            return (
              <div
                key={template.id}
                className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-200 group ${
                  isActive ? "border-indigo-600 shadow-md bg-indigo-50/30" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {template.badge && !isActive && (
                  <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {template.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Active Layout
                  </span>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${template.color}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 pr-12 leading-relaxed">{template.description}</p>
                  </div>
                </div>

                <div className="my-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Layout Blueprint Structure</span>
                  {renderMiniThumbnail(template.id)}
                </div>

                <div className="mt-5 pt-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplateId(template.id)}
                    className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Live Preview
                  </button>
                  <button
                    onClick={() => handleSelectTemplate(template.id)}
                    disabled={isActive}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                      isActive ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    }`}
                  >
                    {isActive ? "Currently Active" : "Select Layout"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {previewTemplateId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 md:p-6 transition-opacity animate-fade-in">
          <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-800">Live View Mockup: <span className="text-indigo-600">{TEMPLATES.find((t) => t.id === previewTemplateId)?.name}</span></h3>
              </div>
              <button onClick={() => setPreviewTemplateId(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-100/70 shadow-inner">
              {renderLivePreviewInvoice(previewTemplateId)}
            </div>
            <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 px-6 shrink-0">
              <button type="button" onClick={() => setPreviewTemplateId(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none">Close View</button>
              <button
                type="button"
                onClick={() => { handleSelectTemplate(previewTemplateId); setPreviewTemplateId(null); }}
                disabled={activeTemplate === previewTemplateId}
                className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                  activeTemplate === previewTemplateId ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                }`}
              >
                {activeTemplate === previewTemplateId ? "Active Template" : "Activate Layout Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};