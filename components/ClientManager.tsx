import React, { useState } from "react";
import { Client } from "../types";
import { PlusIcon } from "./icons";
import { Toast, ToastType } from "./Toast";
import { DataTable } from "./DataTable";

interface ClientManagerProps {
  clients: Client[];
  addClient: (client: Omit<Client, "id" | "email">) => Promise<void> | void;
  updateClient: (client: Client) => Promise<void> | void;
  deleteClient: (clientId: string) => Promise<void> | void;
  onViewDetails?: (clientId: string) => void;
}

const emptyClient: Omit<Client, "id" | "email"> = {
  name: "",
  address: "",
  gstin: "",
  state: "",
  stateCode: "",
};

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  addClient,
  onViewDetails,
}) => {
  const [formData, setFormData] = useState(emptyClient);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });
  const hideToast = () => setToast((prev) => ({ ...prev, isVisible: false }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const missingFields: string[] = [];
    if (!formData.name?.trim()) missingFields.push("Client Name");
    if (!formData.gstin?.trim()) missingFields.push("GSTIN No");
    if (!formData.address?.trim()) missingFields.push("Address");
    if (!formData.state?.trim()) missingFields.push("State");
    if (!formData.stateCode?.trim()) missingFields.push("State Code");

    if (missingFields.length > 0) {
      setErrorMsg(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await addClient(formData);
      showToast(`Client "${formData.name}" added successfully!`, "success");
      setFormData(emptyClient);
    } catch (err: any) {
      showToast(err?.message || "Operation failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingFields: string[] = [];
  if (!formData.name?.trim()) missingFields.push("Client Name");
  if (!formData.gstin?.trim()) missingFields.push("GSTIN No");
  if (!formData.address?.trim()) missingFields.push("Address");
  if (!formData.state?.trim()) missingFields.push("State");
  if (!formData.stateCode?.trim()) missingFields.push("State Code");
  const isFormDisabled = missingFields.length > 0 || isSubmitting;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
      
      {/* FORM CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Add New Client</h2>
          <p className="text-sm text-slate-500 mt-1">Register a new client to begin billing and generating quotations.</p>
        </div>
        
        <div className="p-8">
          {errorMsg && (
            <div className="mb-8 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 flex items-start shadow-sm">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Client Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm outline-none" 
                  placeholder="e.g. Acme Corp" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">GSTIN No <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="gstin" 
                  value={formData.gstin} 
                  onChange={handleInputChange} 
                  required 
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm outline-none font-mono uppercase" 
                  placeholder="22AAAAA0000A1Z5" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Address <span className="text-red-500">*</span></label>
              <textarea 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                rows={3} 
                required 
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm outline-none resize-y" 
                placeholder={"Building/Office Name\nStreet Address\nCity, PIN Code"}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">State <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                  required 
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm outline-none capitalize" 
                  placeholder="e.g. Maharashtra" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">State Code <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="stateCode" 
                  value={formData.stateCode} 
                  onChange={handleInputChange} 
                  required 
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm outline-none font-mono" 
                  placeholder="e.g. 27" 
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-slate-100 mt-8">
              <button
                disabled={isFormDisabled}
                type="submit"
                className={`inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 ${
                  isFormDisabled 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow border border-transparent"
                }`}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {isSubmitting ? "Adding Client..." : "Save Client"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* LIST CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Client Directory</h2>
            <p className="text-sm text-slate-500 mt-1">Manage and view details for all registered clients.</p>
          </div>
        </div>
        
        <div className="p-6">
          <DataTable<Client>
            data={clients}
            onRowClick={(client) => onViewDetails?.(client.id)}
            columns={[
              {
                header: "Client Name",
                accessor: "name",
                className: "font-semibold text-slate-900",
              },
              {
                header: "GSTIN No.",
                accessor: (client) => (
                  <span className="font-mono text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 tracking-wide">
                    {client.gstin || "-"}
                  </span>
                ),
              },
              {
                header: "Address",
                accessor: (client) => (
                  <span className="whitespace-pre-line text-sm text-slate-500 truncate max-w-xs inline-block">
                    {client.address || "-"}
                  </span>
                ),
              },
              {
                header: "State",
                accessor: (client) => (
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                    {client.state || "-"}
                  </span>
                ),
              },
              {
                header: "",
                accessor: () => (
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ),
                className: "text-right w-10",
              }
            ]}
            searchable={true}
            searchPlaceholder="Search clients by name, GSTIN, or location..."
            searchKeys={["name", "gstin", "address", "state", "stateCode"]}
            itemsPerPage={10}
            emptyMessage="No clients found. Add one using the form above."
          />
        </div>
      </div>
    </div>
  );
};