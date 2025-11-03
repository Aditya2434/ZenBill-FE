import React, { useState, useEffect } from "react";
import { Client } from "../types";
import { PlusIcon } from "./icons";

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
  const [feedback, setFeedback] = useState("");

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
    if (!formData.name) return;

    if (editingClient) {
      await updateClient({ ...editingClient, ...formData });
      setFeedback(`Client "${formData.name}" updated successfully!`);
    } else {
      await addClient(formData);
      setFeedback(`Client "${formData.name}" added successfully!`);
      setFormData(emptyClient);
    }
    setEditingClient(null);

    setTimeout(() => setFeedback(""), 3000);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className="fixed top-20 right-5 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg"
          role="alert"
        >
          <p className="font-bold">Success</p>
          <p>{feedback}</p>
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {editingClient ? "Edit Client" : "Add New Client"}
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {editingClient
            ? `Updating details for ${editingClient.name}`
            : "Fill in the details to add a new client."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Client Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="gstin"
                className="block text-sm font-medium text-gray-700"
              >
                GSTIN No.
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
          </div>
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              Address
            </label>
            <textarea
              name="address"
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              placeholder="Line 1&#10;Line 2&#10;Line 3"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700"
              >
                State
              </label>
              <input
                type="text"
                name="state"
                id="state"
                value={formData.state}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="stateCode"
                className="block text-sm font-medium text-gray-700"
              >
                State Code
              </label>
              <input
                type="text"
                name="stateCode"
                id="stateCode"
                value={formData.stateCode}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
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
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {editingClient ? "Save Changes" : "Add Client"}
            </button>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Client Name
                </th>
                <th scope="col" className="px-6 py-3">
                  GSTIN No.
                </th>
                <th scope="col" className="px-6 py-3">
                  Address
                </th>
                <th scope="col" className="px-6 py-3">
                  State
                </th>
                <th scope="col" className="px-6 py-3">
                  State Code
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4">{client.gstin || "-"}</td>
                  <td className="px-6 py-4 whitespace-pre-line">
                    {client.address || "-"}
                  </td>
                  <td className="px-6 py-4">{client.state || "-"}</td>
                  <td className="px-6 py-4">{client.stateCode || "-"}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    No clients found. Add one using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
