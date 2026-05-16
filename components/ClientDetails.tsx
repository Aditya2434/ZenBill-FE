import React, { useState, useEffect } from "react";
import { Client, Product } from "../types";
import { View } from "../App";
import { DataTable } from "./DataTable";
import { Toast, ToastType } from "./Toast";
import { apiGetClientOrders, apiCreateOrder, apiGetClientInvoices, apiDeleteOrder, apiUpdateOrder } from "../utils/api";

interface ClientDetailsProps {
  clientId: string;
  clients: Client[];
  invoices: any[];
  products: Product[];
  setView: (view: View) => void;
  updateClient: (client: Client) => Promise<void> | void;
}

type TabType = "overview" | "invoices" | "orders" | "payments";

interface OrderItemForm {
  product: Product;
  quantity: number;
}

interface BackendOrderItem {
  productId: number;
  productName: string;
  uom: string;
  quantity: number;
}

interface BackendOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  clientId: number;
  items: BackendOrderItem[];
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({
  clientId,
  clients,
  products,
  setView,
  updateClient,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Client Edit States
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState<Client | null>(null);

  // Order Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState<number | null>(null); 
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderQuantity, setOrderQuantity] = useState<number | "">(1);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItemForm[]>([]);
  const [deleteOrderConfirm, setDeleteOrderConfirm] = useState<{ open: boolean; id?: number }>({ open: false });
  
  // Real Backend State
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [backendInvoices, setBackendInvoices] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({ message: "", type: "success", isVisible: false });

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

  const client = clients.find((c) => c.id === clientId);

  // --- FETCH DATA FROM BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const orderRes = await apiGetClientOrders(clientId);
        if (orderRes && orderRes.success) setBackendOrders(orderRes.data);

        const invoiceRes = await apiGetClientInvoices(clientId);
        if (invoiceRes && invoiceRes.success) setBackendInvoices(invoiceRes.data);
      } catch (error) {
        console.error("Failed to fetch client data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    if (clientId) fetchData();
  }, [clientId]);

  // Sync client form when modal opens
  useEffect(() => {
    if (client) setClientFormData({ ...client });
  }, [client, isEditClientModalOpen]);

  if (!client) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Client not found.</p>
        <button onClick={() => setView("clients")} className="mt-4 text-blue-600 hover:underline">&larr; Back to Clients</button>
      </div>
    );
  }

  // --- Calculations ---
  const totalBilled = backendInvoices.reduce((sum, inv) => sum + (inv.totalAmountAfterTax || 0), 0);
  const totalPaid = 0; 
  const totalDue = totalBilled - totalPaid;

  let totalOrderedQty = 0;
  backendOrders.forEach(order => order.items.forEach(item => totalOrderedQty += item.quantity));
  let totalSoldQty = 0; 
  const ordersLeftQty = Math.max(0, totalOrderedQty - totalSoldQty);

  // --- Logic for Disabling "Save Changes" Buttons ---
  const isClientUnchanged = Boolean(
    clientFormData &&
    client &&
    clientFormData.name === client.name &&
    clientFormData.address === client.address &&
    clientFormData.gstin === client.gstin &&
    clientFormData.state === client.state &&
    clientFormData.stateCode === client.stateCode
  );

  const originalOrder = isEditingOrder ? backendOrders.find(o => o.id === isEditingOrder) : null;
  let isOrderUnchanged = false;
  if (isEditingOrder && originalOrder) {
    if (currentOrderItems.length === originalOrder.items.length) {
      isOrderUnchanged = currentOrderItems.every(coi => {
        const orig = originalOrder.items.find(oi => oi.productId === Number(coi.product.id));
        return orig && orig.quantity === coi.quantity;
      });
    }
  }

  // --- Client Edit Handlers ---
  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (clientFormData) setClientFormData({ ...clientFormData, [e.target.name]: e.target.value });
  };

  const handleSaveClientInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormData) return;
    try {
      await updateClient(clientFormData);
      setIsEditClientModalOpen(false);
      showToast("Client information updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update client.", "error");
    }
  };


  // --- Order Modal Handlers ---
  const handleAddItemToOrder = () => {
    if (!selectedProductId || !orderQuantity || orderQuantity <= 0) return;
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      const existingItemIndex = currentOrderItems.findIndex(item => item.product.id === product.id);
      if (existingItemIndex >= 0) {
        const updatedItems = [...currentOrderItems];
        updatedItems[existingItemIndex].quantity += Number(orderQuantity);
        setCurrentOrderItems(updatedItems);
      } else {
        setCurrentOrderItems([...currentOrderItems, { product, quantity: Number(orderQuantity) }]);
      }
      setSelectedProductId("");
      setOrderQuantity(1);
    }
  };

  const handleRemoveItemFromOrder = (indexToRemove: number) => {
    setCurrentOrderItems(currentOrderItems.filter((_, index) => index !== indexToRemove));
  };

  const openNewOrderModal = () => {
    setIsEditingOrder(null);
    setCurrentOrderItems([]);
    setIsOrderModalOpen(true);
  };

  const handleEditOrderClick = (e: React.MouseEvent, order: BackendOrder) => {
    e.stopPropagation();
    setIsEditingOrder(order.id);
    const reconstructedItems = order.items.map(item => ({
      product: products.find(p => p.id === String(item.productId)) || { id: String(item.productId), name: item.productName, uom: item.uom, hsnCode: "" },
      quantity: item.quantity
    }));
    setCurrentOrderItems(reconstructedItems);
    setIsOrderModalOpen(true);
  };

  const handleDeleteOrderClick = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    setDeleteOrderConfirm({ open: true, id: orderId });
  };

  const performDeleteOrder = async () => {
    if (!deleteOrderConfirm.id) return;
    try {
      await apiDeleteOrder(deleteOrderConfirm.id);
      setBackendOrders(backendOrders.filter(o => o.id !== deleteOrderConfirm.id));
      showToast("Order deleted successfully", "success");
    } catch (err: any) {
      showToast("Failed to delete order. Check backend connection.", "error");
    } finally {
      setDeleteOrderConfirm({ open: false });
    }
  };

  const handleSaveOrder = async () => {
    if (currentOrderItems.length === 0) {
      showToast("Please add at least one product to the order.", "error");
      return;
    }
    setIsSavingOrder(true);
    try {
      const payload = {
        clientId: Number(clientId),
        orderDate: new Date().toISOString().split('T')[0],
        status: "Pending",
        items: currentOrderItems.map(item => ({
          productId: Number(item.product.id),
          quantity: item.quantity
        }))
      };

      if (isEditingOrder) {
        const response = await apiUpdateOrder(isEditingOrder, payload);
        if (response && response.success) {
          setBackendOrders(backendOrders.map(o => o.id === isEditingOrder ? response.data : o));
          showToast("Order updated successfully!", "success");
        }
      } else {
        const response = await apiCreateOrder(payload);
        if (response && response.success) {
          setBackendOrders([response.data, ...backendOrders]);
          showToast("Order created successfully!", "success");
        }
      }
      setIsOrderModalOpen(false);
    } catch (error: any) {
      showToast(error?.message || "Failed to save order. Make sure backend endpoint is available.", "error");
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} duration={3000} />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-2xl shadow-lg text-white">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView("clients")} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Back to Directory">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{client.name}</h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className="inline-flex items-center rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm">GSTIN: {client.gstin || "N/A"}</span>
              <span className="inline-flex items-center rounded-md bg-blue-400/20 px-2.5 py-0.5 text-xs font-semibold text-blue-100 border border-blue-400/20 backdrop-blur-sm">{client.state}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsEditClientModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-white text-indigo-900 text-sm font-bold rounded-xl hover:bg-gray-100 shadow-sm transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit Profile
        </button>
      </div>

      {/* --- QUICK STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Billed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalBilled.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Paid</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">₹{totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Outstanding Due</p>
          <p className="text-3xl font-bold text-rose-600 mt-2">₹{totalDue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{backendInvoices.length}</p>
        </div>
      </div>

      {/* --- MAIN TABS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50">
          <nav className="flex -mb-px px-6">
            {(["overview", "invoices", "orders", "payments"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-all ${
                    activeTab === tab ? "border-blue-600 text-blue-700 bg-blue-50/30" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="p-8">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                   <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   Company Details
                </h3>
                <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registered Address</span>
                    <p className="text-sm text-gray-900 whitespace-pre-line font-medium leading-relaxed">{client.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/60">
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State</span>
                      <p className="text-sm text-gray-900 font-medium">{client.state}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State Code</span>
                      <p className="text-sm text-gray-900 font-medium">{client.stateCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                   <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                   Requirement Analytics
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-inner">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                      <span className="text-sm font-semibold text-blue-900">Total Units Ordered</span> 
                      <span className="text-xl font-bold text-blue-900">{isLoadingData ? "..." : totalOrderedQty}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                      <span className="text-sm font-semibold text-blue-900">Units Billed (Estimated)</span> 
                      <span className="text-xl font-bold text-emerald-700">{totalSoldQty}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-bold text-blue-950">Pending Fulfillment</span> 
                      <span className="text-2xl font-black text-rose-600">{isLoadingData ? "..." : ordersLeftQty}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVOICES TAB */}
          {activeTab === "invoices" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Billing History</h3>
              </div>
              {isLoadingData ? (
                <div className="text-center py-12 text-gray-500 animate-pulse">Loading invoices...</div>
              ) : (
                <DataTable<any>
                  data={backendInvoices}
                  columns={[
                    { header: "Invoice No.", accessor: "invoiceNumber", className: "font-semibold text-gray-900" },
                    { header: "Issue Date", accessor: "invoiceDate", className: "text-gray-600" },
                    {
                      header: "Amount",
                      accessor: (inv) => <span className="font-bold text-gray-900">₹{(inv.totalAmountAfterTax || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>,
                    },
                    {
                      header: "Status",
                      accessor: () => <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200">Unpaid</span>,
                    },
                  ]}
                  searchable={true}
                  searchKeys={["invoiceNumber", "invoiceDate"]}
                  searchPlaceholder="Search invoices..."
                  emptyMessage="No invoices generated for this client yet."
                />
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Order Manifest</h3>
                <button 
                  onClick={openNewOrderModal}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add New Order
                </button>
              </div>
              
              {isLoadingData ? (
                <div className="text-center py-12 text-gray-500 animate-pulse">Loading orders...</div>
              ) : backendOrders.length > 0 ? (
                <DataTable<BackendOrder>
                  data={backendOrders}
                  columns={[
                    { header: "Order ID", accessor: "orderNumber", className: "font-mono font-semibold text-blue-700 text-xs" },
                    { header: "Date", accessor: "orderDate", className: "text-gray-600 font-medium" },
                    { 
                      header: "Products Requested", 
                      accessor: (order) => (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center bg-gray-50 px-2 py-1 rounded text-xs border border-gray-200">
                              <span className="text-gray-600 truncate max-w-[150px] mr-1">{item.productName}</span>
                              <span className="font-bold text-gray-900">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                      ) 
                    },
                    { 
                      header: "Status",
                      accessor: (order) => <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200">{order.status || "Pending"}</span>
                    },
                    {
                      header: "Actions",
                      className: "text-right",
                      accessor: (order) => (
                        <div className="flex items-center justify-end space-x-2">
                           <button onClick={(e) => handleEditOrderClick(e, order)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Order">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                           </button>
                           <button onClick={(e) => handleDeleteOrderClick(e, order.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Order">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      )
                    }
                  ]}
                  searchable={true}
                  searchKeys={["orderNumber", "orderDate"]}
                  searchPlaceholder="Search order manifest..."
                />
              ) : (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="mt-4 text-sm font-medium text-gray-900">No orders logged</p>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new order.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
               <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p className="mt-4 text-sm font-medium text-gray-900">Payment tracking coming soon</p>
               <p className="mt-1 text-sm text-gray-500">Record advances and settlements to calculate exact dues.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- EDIT CLIENT MODAL --- */}
      {isEditClientModalOpen && clientFormData && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Client Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Update registration and address details.</p>
              </div>
              <button onClick={() => setIsEditClientModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm border border-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <form id="edit-client-form" onSubmit={handleSaveClientInfo} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={clientFormData.name} onChange={handleClientFormChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">GSTIN No</label>
                    <input type="text" name="gstin" value={clientFormData.gstin} onChange={handleClientFormChange} className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address <span className="text-red-500">*</span></label>
                  <textarea name="address" value={clientFormData.address} onChange={handleClientFormChange} rows={3} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
                    <input type="text" name="state" value={clientFormData.state} onChange={handleClientFormChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">State Code <span className="text-red-500">*</span></label>
                    <input type="text" name="stateCode" value={clientFormData.stateCode} onChange={handleClientFormChange} required className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm" />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsEditClientModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Cancel</button>
              <button 
                type="submit" 
                form="edit-client-form" 
                disabled={isClientUnchanged}
                className={`px-6 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white shadow-sm transition-colors ${
                  isClientUnchanged ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT ORDER MODAL --- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{isEditingOrder ? "Edit Order Details" : "Create New Order"}</h2>
                <p className="text-sm text-gray-500 mt-1">Specify requested products and quantities.</p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm border border-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex flex-col sm:flex-row gap-4 items-end mb-8 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-semibold text-blue-900 mb-1.5">Select Catalog Product</label>
                  <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm bg-white">
                    <option value="">-- Choose a product --</option>
                    {products.map(product => <option key={product.id} value={product.id}>{product.name} {product.uom ? `(${product.uom})` : ''}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-semibold text-blue-900 mb-1.5">Quantity</label>
                  <input type="number" min="1" value={orderQuantity} onChange={(e) => setOrderQuantity(e.target.value === "" ? "" : Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm bg-white text-center font-bold" />
                </div>
                <button onClick={handleAddItemToOrder} disabled={!selectedProductId || !orderQuantity} className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black disabled:bg-gray-400 transition-colors shadow-sm">
                  Add Item
                </button>
              </div>

              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Composition</h3>
              {currentOrderItems.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentOrderItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.product.name}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-700">{item.quantity} <span className="text-xs font-normal text-gray-500">{item.product.uom}</span></td>
                          <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                            <button onClick={() => handleRemoveItemFromOrder(index)} className="text-rose-500 hover:text-rose-700 font-semibold p-1 bg-rose-50 rounded-lg transition-colors">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-500">Cart is empty. Add products above.</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
              <button onClick={() => setIsOrderModalOpen(false)} disabled={isSavingOrder} className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50">Cancel</button>
              <button 
                onClick={handleSaveOrder} 
                disabled={currentOrderItems.length === 0 || isSavingOrder || isOrderUnchanged} 
                className={`px-6 py-2.5 border border-transparent rounded-xl text-sm font-bold text-white shadow-sm flex items-center transition-all ${
                  (currentOrderItems.length === 0 || isOrderUnchanged) ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSavingOrder ? (
                  <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                ) : ( isEditingOrder ? "Update Order" : "Save Order" )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE ORDER MODAL (PREMIUM WEBSITE POPUP) --- */}
      {deleteOrderConfirm.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              Delete Order
            </h3>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Are you sure you want to permanently delete this order? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setDeleteOrderConfirm({ open: false })}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDeleteOrder}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};