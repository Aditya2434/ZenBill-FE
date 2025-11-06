import React, { useState, useEffect } from "react";
import { Client } from "../types";
import { PlusIcon } from "./icons";
import { Toast, ToastType } from "./Toast";
import { DataTable } from "./DataTable";

interface ClientManagerProps {
  clients: Client[];
  addClient: (client: Omit<Client, "id" | "email">) => Promise<void> | void;
  updateClient: (client: Client) => Promise<void> | void;
  deleteClient: (clientId: string) => Promise<void> | void;
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
  updateClient,
  deleteClient,
}) => {
  const [formData, setFormData] = useState(emptyClient);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: string;
    name?: string;
  }>({ open: false });

  const showToast = (message: string, type: ToastType) => {
    // Automatically replace any existing toast with the new one
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        address: editingClient.address,
        gstin: editingClient.gstin || "",
        state: editingClient.state || "",
        stateCode: editingClient.stateCode || "",
      });
    } else {
      setFormData(emptyClient);
    }
  }, [editingClient]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate required fields
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
      if (editingClient) {
        await updateClient({ ...editingClient, ...formData });
        showToast(`Client "${formData.name}" updated successfully!`, "success");
      } else {
        await addClient(formData);
        showToast(`Client "${formData.name}" added successfully!`, "success");
        setFormData(emptyClient);
      }
      setEditingClient(null);
    } catch (err: any) {
      showToast(err?.message || "Operation failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    // Scroll to the form
    setTimeout(() => {
      const clientForm = document.getElementById("client-form");
      if (clientForm) {
        clientForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo(0, 0);
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const confirmDeleteClient = (client: Client) => {
    setDeleteConfirm({
      open: true,
      id: client.id,
      name: client.name,
    });
  };

  const performDeleteClient = async () => {
    if (!deleteConfirm.id) return;
    try {
      deleteClient(deleteConfirm.id);
      showToast(`Client "${deleteConfirm.name}" deleted successfully!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete client", "error");
    } finally {
      setDeleteConfirm({ open: false });
    }
  };

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
      <div id="client-form" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {editingClient ? "Edit Client" : "Add New Client"}
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {editingClient
            ? `Updating details for ${editingClient.name}`
            : "Fill in the details to add a new client."}
        </p>
        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="gstin"
                className="block text-sm font-medium text-gray-700"
              >
                GSTIN No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="gstin"
                id="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              placeholder="Line 1&#10;Line 2&#10;Line 3"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700"
              >
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                id="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="stateCode"
                className="block text-sm font-medium text-gray-700"
              >
                State Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="stateCode"
                id="stateCode"
                value={formData.stateCode}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>
          <div className="flex justify-end items-center space-x-3 pt-2">
            {editingClient && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <div className="relative group">
              {(() => {
                const missingFields: string[] = [];
                if (!formData.name?.trim()) missingFields.push("Client Name");
                if (!formData.gstin?.trim()) missingFields.push("GSTIN No");
                if (!formData.address?.trim()) missingFields.push("Address");
                if (!formData.state?.trim()) missingFields.push("State");
                if (!formData.stateCode?.trim()) missingFields.push("State Code");
                const isDisabled = missingFields.length > 0 || isSubmitting;

                return (
                  <>
                    <button
                      disabled={isDisabled}
                      type="submit"
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isDisabled
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      {isSubmitting
                        ? editingClient
                          ? "Saving..."
                          : "Adding..."
                        : editingClient
                        ? "Save Changes"
                        : "Add Client"}
                    </button>
                    {isDisabled &&
                      !isSubmitting &&
                      missingFields.length > 0 && (
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
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Client List</h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your existing clients.
          </p>
        </div>
        <div className="p-6">
          <DataTable<Client>
            data={clients}
            columns={[
              {
                header: "Client Name",
                accessor: "name",
                className: "font-medium text-gray-900",
              },
              {
                header: "GSTIN No.",
                accessor: "gstin",
              },
              {
                header: "Address",
                accessor: (client) => (
                  <span className="whitespace-pre-line">
                    {client.address || "-"}
                  </span>
                ),
              },
              {
                header: "State",
                accessor: "state",
              },
              {
                header: "State Code",
                accessor: "stateCode",
              },
            ]}
            searchable={true}
            searchPlaceholder="Search clients by name, GSTIN, address, state, or state code..."
            searchKeys={["name", "gstin", "address", "state", "stateCode"]}
            itemsPerPage={10}
            emptyMessage="No clients found. Add one using the form above."
            renderActions={(client) => (
              <>
                <button
                  onClick={() => handleEdit(client)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDeleteClient(client)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          />
        </div>
      </div>

      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900">
              Delete client?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete "{deleteConfirm.name}"? This
              action cannot be undone.
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
                onClick={performDeleteClient}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
