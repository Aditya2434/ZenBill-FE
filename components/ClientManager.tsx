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
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
      
      {/* PREMIUM FORM CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Client</h2>
        <p className="text-sm text-gray-500 mt-1 mb-8">Register a new client to begin billing and generating quotations.</p>
        
        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 flex items-center shadow-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">GSTIN No <span className="text-red-500">*</span></label>
              <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono sm:text-sm" placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address <span className="text-red-500">*</span></label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm" placeholder={"Line 1\nLine 2\nLine 3"}></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. Maharashtra" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">State Code <span className="text-red-500">*</span></label>
              <input type="text" name="stateCode" value={formData.stateCode} onChange={handleInputChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. 27" />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              disabled={isFormDisabled}
              type="submit"
              className={`inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${isFormDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow"}`}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {isSubmitting ? "Adding..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>

      {/* PREMIUM LIST CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Client Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Click on any client to open their dashboard and manage details.</p>
        </div>
        <div className="p-6">
          <DataTable<Client>
            data={clients}
            onRowClick={(client) => onViewDetails?.(client.id)}
            columns={[
              {
                header: "Client Name",
                accessor: "name",
                className: "font-semibold text-gray-900",
              },
              {
                header: "GSTIN No.",
                accessor: (client) => <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">{client.gstin || "-"}</span>,
              },
              {
                header: "Address",
                accessor: (client) => <span className="whitespace-pre-line text-xs text-gray-500 truncate max-w-xs inline-block">{client.address || "-"}</span>,
              },
              {
                header: "State",
                accessor: (client) => <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/20">{client.state || "-"}</span>,
              },
              {
                header: "",
                accessor: () => (
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ),
                className: "text-right w-10",
              }
            ]}
            searchable={true}
            searchPlaceholder="Search clients..."
            searchKeys={["name", "gstin", "address", "state", "stateCode"]}
            itemsPerPage={10}
            emptyMessage="No clients found. Add one using the form above."
          />
        </div>
      </div>
    </div>
  );
};