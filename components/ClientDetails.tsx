import React, { useState, useEffect } from "react";
import { Client, Product } from "../types";
import { View } from "../App";
import { DataTable } from "./DataTable";
import { Toast, ToastType } from "./Toast";
import { apiGetClientOrders, apiCreateOrder, apiGetClientInvoices, apiDeleteOrder, apiUpdateOrder, apiMarkInvoicePaid } from "../utils/api";

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
  
  // Selected Order for Overview Details
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<BackendOrder | null>(null);

  // Payment Confirm Modal State
  const [payConfirmModal, setPayConfirmModal] = useState<{ open: boolean; invoiceId: string | number | null }>({ open: false, invoiceId: null });

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

  // --- Financial Balances ---
  const totalBilled = backendInvoices.reduce((sum, inv) => sum + (inv.totalAmountAfterTax || 0), 0);
  const totalPaid = backendInvoices.filter(inv => inv.status?.trim().toLowerCase() === 'paid').reduce((sum, inv) => sum + (inv.totalAmountAfterTax || 0), 0); 
  const totalDue = totalBilled - totalPaid;

  // --- Smart FIFO Order Fulfillment Calculation ---
  let totalOrderedQty = 0;
  let totalSoldQty = 0; 
  
  const globalBilled: Record<string, number> = {};

  // 1. Tally up everything that has been billed
  backendInvoices.forEach(inv => {
    if (Array.isArray(inv.items)) {
      inv.items.forEach((item: any) => {
        const qty = Number(item.quantity) || 0;
        totalSoldQty += qty;
        const name = item.description || item.productName;
        if (name) {
          globalBilled[name] = (globalBilled[name] || 0) + qty;
        }
      });
    }
  });

  // 2. Distribute the billed items across the orders (oldest first) to see which orders are fulfilled
  const sortedOrders = [...backendOrders].sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
  
  const orderFulfillment: Record<number, { items: any[], status: string, percent: number }> = {};

  sortedOrders.forEach(order => {
    const itemsData: any[] = [];
    let orderTotalOrdered = 0;
    let orderTotalBilled = 0;

    order.items.forEach(item => {
      const name = item.productName;
      const ordered = item.quantity;
      const available = globalBilled[name] || 0;
      const billed = Math.min(ordered, available);
      
      // Deduct from global pool
      globalBilled[name] = available - billed;

      orderTotalOrdered += ordered;
      orderTotalBilled += billed;
      totalOrderedQty += ordered;

      itemsData.push({
        name,
        uom: item.uom || '',
        ordered,
        billed,
        balance: ordered - billed,
        percent: ordered > 0 ? Math.min(100, (billed / ordered) * 100) : 100
      });
    });

    orderFulfillment[order.id] = {
      items: itemsData,
      status: orderTotalOrdered === orderTotalBilled ? 'Fulfilled' : (orderTotalBilled > 0 ? 'Partial' : 'Pending'),
      percent: orderTotalOrdered > 0 ? (orderTotalBilled / orderTotalOrdered) * 100 : 100
    };
  });

  const ordersLeftQty = Math.max(0, totalOrderedQty - totalSoldQty);

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

  // --- Handlers ---
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
      if (selectedOrderDetails?.id === deleteOrderConfirm.id) {
         setSelectedOrderDetails(null);
      }
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

  const confirmMarkPaid = async () => {
    if (!payConfirmModal.invoiceId) return;
    try {
      const res = await apiMarkInvoicePaid(payConfirmModal.invoiceId);
      if (res && res.status) {
        setBackendInvoices(backendInvoices.map(inv => 
          inv.id === payConfirmModal.invoiceId ? { ...inv, status: 'Paid' } : inv
        ));
        showToast("Payment recorded successfully!", "success");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to record payment.", "error");
    } finally {
      setPayConfirmModal({ open: false, invoiceId: null });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} duration={3000} />

      {/* --- HEADER --- */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-2xl shadow-xl text-white border border-white/10">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 z-10 w-full md:w-auto">
          <div className="flex items-center">
             <button onClick={() => setView("clients")} className="mr-4 p-2.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 backdrop-blur-sm" title="Back to Directory">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="hidden sm:flex h-14 w-14 min-w-[56px] rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 items-center justify-center shadow-inner border border-white/20 text-xl font-black text-white">
              {client.name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug break-words">
              {client.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 border border-white/10 backdrop-blur-md shadow-sm">
                 <svg className="w-3.5 h-3.5 mr-1.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 GSTIN: <span className="ml-1 font-mono">{client.gstin || "N/A"}</span>
              </span>
              <span className="inline-flex items-center rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-100 border border-indigo-400/20 backdrop-blur-md shadow-sm">
                <svg className="w-3.5 h-3.5 mr-1.5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {client.state}
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 sm:self-center">
           <button 
             onClick={() => setIsEditClientModalOpen(true)}
             className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 shadow-sm backdrop-blur-md transition-all group shrink-0 whitespace-nowrap"
           >
             <svg className="w-4 h-4 mr-2 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             Edit Profile
           </button>
        </div>
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
            <div>
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
                     Total Requirement Analytics
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-inner">
                    <div className="space-y-5">
                      <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                        <span className="text-sm font-semibold text-blue-900">Total Units Ordered</span> 
                        <span className="text-xl font-bold text-blue-900">{isLoadingData ? "..." : totalOrderedQty}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                        <span className="text-sm font-semibold text-blue-900">Total Units Billed</span> 
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

              {/* ORDERS & BALANCES SECTION */}
              <div className="mt-10">
                {!selectedOrderDetails ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      Orders & Fulfillment Balances
                    </h3>
                    
                    {backendOrders.length > 0 ? (
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50/80">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order No.</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfillment Status</th>
                              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sortedOrders.map(order => {
                              const fulfillment = orderFulfillment[order.id];
                              const isComplete = fulfillment.status === 'Fulfilled';
                              
                              return (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{order.orderNumber}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.orderDate}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center w-[250px]">
                                    {isComplete ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                          Fully Fulfilled
                                        </span>
                                    ) : (
                                        <div className="w-full mx-auto flex items-center gap-2">
                                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                              <div className={`h-full rounded-full ${fulfillment.percent > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${fulfillment.percent}%` }}></div>
                                          </div>
                                          <span className="text-xs font-semibold text-gray-500">{Math.round(fulfillment.percent)}%</span>
                                        </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button 
                                      onClick={() => setSelectedOrderDetails(order)} 
                                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-sm"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-sm font-medium text-gray-500">No product orders found to calculate balances.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setSelectedOrderDetails(null)} 
                          className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors shadow-sm"
                          title="Back to Orders List"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          Order Breakdown: <span className="text-blue-600 ml-2">{selectedOrderDetails.orderNumber}</span>
                        </h3>
                      </div>
                      <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                        Date: {selectedOrderDetails.orderDate}
                      </span>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/80">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Quantity</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity Fulfilled</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Balance Left</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orderFulfillment[selectedOrderDetails.id]?.items.map((item, idx) => {
                            const isComplete = item.balance <= 0;
                            return (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">{item.ordered} {item.uom}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-blue-600">{item.billed} {item.uom}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`text-sm font-bold ${item.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {Math.max(0, item.balance)} {item.uom}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center w-[180px]">
                                  {isComplete ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                        Fulfilled
                                      </span>
                                  ) : (
                                      <div className="w-full mx-auto flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.percent}%` }}></div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500">{Math.round(item.percent)}%</span>
                                      </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INVOICES TAB - SHOW STATUS BUTTONS AND CONFIRM MODAL */}
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
                      className: "text-center",
                      accessor: (inv) => {
                        const isPaid = inv.status?.trim().toLowerCase() === "paid";
                        return isPaid ? (
                           <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              Paid
                           </span>
                        ) : (
                           <button 
                             onClick={() => setPayConfirmModal({ open: true, invoiceId: inv.id })} 
                             className="px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 transition-all shadow-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                             title="Click to mark this invoice as paid"
                           >
                             Mark as Paid
                           </button>
                        );
                      }
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
                      header: "Type",
                      accessor: (order) => {
                        const isAuto = order.status === "AUTO_GENERATED";
                        return isAuto ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            <span>🤖</span> AUTO GENERATED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                            <span>📋</span> MANUAL ORDER
                          </span>
                        );
                      }
                    },
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
               <p className="mt-4 text-sm font-medium text-gray-900">Payment tracking functionality is live</p>
               <p className="mt-1 text-sm text-gray-500">You can now track paid invoices and calculate dues automatically from the Invoices tab.</p>
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

      {/* --- DELETE ORDER MODAL --- */}
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

      {/* --- CONFIRM PAYMENT MODAL --- */}
      {payConfirmModal.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-full mb-4">
               <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              Confirm Payment
            </h3>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Are you sure you want to mark this invoice as paid? This action will update your revenue records.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setPayConfirmModal({ open: false, invoiceId: null })}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkPaid}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 border border-transparent rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};