import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
// Always-needed (tiny): eagerly imported
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, useAuth } from "./hooks/useAuth";
import { useInvoices } from "./hooks/useInvoices";
import { useProfile } from "./hooks/useProfile";
import { useClients } from "./hooks/useClients";
import { useProducts } from "./hooks/useProducts";
import { Invoice } from "./types";

// Heavy components: lazy-loaded on first navigation
const Dashboard       = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const InvoiceList     = lazy(() => import("./components/InvoiceList").then(m => ({ default: m.InvoiceList })));
const InvoiceWizard   = lazy(() => import("./components/InvoiceWizard").then(m => ({ default: m.InvoiceWizard })));
const InvoiceView     = lazy(() => import("./components/InvoiceView"));
const Profile         = lazy(() => import("./components/Profile").then(m => ({ default: m.Profile })));
const ClientManager   = lazy(() => import("./components/ClientManager").then(m => ({ default: m.ClientManager })));
const ClientDetails   = lazy(() => import("./components/ClientDetails").then(m => ({ default: m.ClientDetails })));
const ProductManager  = lazy(() => import("./components/ProductManager").then(m => ({ default: m.ProductManager })));
const AccountSettings = lazy(() => import("./components/AccountSettings").then(m => ({ default: m.AccountSettings })));
const TemplateSelector = lazy(() => import("./components/TemplateSelector").then(m => ({ default: m.TemplateSelector })));
const QuotationList   = lazy(() => import("./components/QuotationList"));
const QuotationEditor = lazy(() => import("./components/QuotationEditor"));
const DummyPDF        = lazy(() => import("./components/DummyPDF"));

// Lazy-load PDF renderer only when needed
const PDFViewer = lazy(() => import("@react-pdf/renderer").then(m => ({ default: m.PDFViewer })));

// Lightweight in-content fallback (no full-screen spinner)
const PageLoader = () => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "60vh", gap: 12, flexDirection: "column",
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      border: "3px solid rgba(99,102,241,0.15)",
      borderTopColor: "#6366f1",
      animation: "spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", margin: 0 }}>Loading...</p>
  </div>
);

export type View =
  | "dashboard"
  | "invoices"
  | "create-invoice"
  | "edit-invoice"
  | "create-quotation"
  | "settings"
  | "account" 
  | "clients"
  | "client-details"
  | "products"
  | "DummyPDF"
  | "login"
  | "signup"
  | "invoice-details"
  | "templates";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    return (sessionStorage.getItem("zenbill_currentView") as View) || "dashboard";
  });

  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(() => {
    const stored = sessionStorage.getItem("zenbill_invoiceToEdit");
    return stored ? JSON.parse(stored) : null;
  });

  const [invoiceIdForDetails, setInvoiceIdForDetails] = useState<string | number | null>(() => {
    return sessionStorage.getItem("zenbill_invoiceIdForDetails") || null;
  });

  const [clientIdForDetails, setClientIdForDetails] = useState<string | null>(() => {
    return sessionStorage.getItem("zenbill_clientIdForDetails") || null;
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { profile, updateProfile } = useProfile();
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoadingProducts,
    loadError,
    refreshProducts,
  } = useProducts();
  const { userEmail } = useAuth();

  useEffect(() => {
    sessionStorage.setItem("zenbill_currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    if (invoiceToEdit) {
      sessionStorage.setItem("zenbill_invoiceToEdit", JSON.stringify(invoiceToEdit));
    } else {
      sessionStorage.removeItem("zenbill_invoiceToEdit");
    }
  }, [invoiceToEdit]);

  useEffect(() => {
    if (invoiceIdForDetails !== null) {
      sessionStorage.setItem("zenbill_invoiceIdForDetails", String(invoiceIdForDetails));
    } else {
      sessionStorage.removeItem("zenbill_invoiceIdForDetails");
    }
  }, [invoiceIdForDetails]);

  useEffect(() => {
    if (clientIdForDetails !== null) {
      sessionStorage.setItem("zenbill_clientIdForDetails", clientIdForDetails);
    } else {
      sessionStorage.removeItem("zenbill_clientIdForDetails");
    }
  }, [clientIdForDetails]);

  const handleSetView = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setCurrentView("edit-invoice");
  };

  const handleAddInvoice = useCallback(
    (invoice: Omit<Invoice, "id">): boolean => {
      return addInvoice(invoice);
    },
    [addInvoice]
  );

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard setView={handleSetView} />;
      case "invoices":
        return (
          <InvoiceList
            invoices={invoices}
            onEdit={handleEditInvoice}
            onDelete={deleteInvoice}
            setView={handleSetView}
            profile={profile}
            onViewDetails={(id) => {
              setInvoiceIdForDetails(id);
              setCurrentView("invoice-details");
            }}
          />
        );
      case "create-invoice":
        return (
          <InvoiceWizard
            addInvoice={handleAddInvoice}
            setView={handleSetView}
            profile={profile}
            invoices={invoices}
            clients={clients}
            products={products}
            addClient={addClient}
          />
        );
      case "edit-invoice":
        return invoiceToEdit ? (
          <InvoiceWizard
            existingInvoice={invoiceToEdit}
            updateInvoice={updateInvoice}
            setView={handleSetView}
            profile={profile}
            invoices={invoices}
            clients={clients}
            products={products}
            addClient={addClient}
          />
        ) : (
          <InvoiceList
            invoices={invoices}
            onEdit={handleEditInvoice}
            onDelete={deleteInvoice}
            setView={handleSetView}
            profile={profile}
          />
        );
      case "invoice-details":
        return invoiceIdForDetails != null ? (
          <InvoiceView
            invoiceId={invoiceIdForDetails}
            setView={handleSetView}
            profile={profile}
          />
        ) : (
          <InvoiceList
            invoices={invoices}
            onEdit={handleEditInvoice}
            onDelete={deleteInvoice}
            setView={handleSetView}
            profile={profile}
            onViewDetails={(id) => {
              setInvoiceIdForDetails(id);
              setCurrentView("invoice-details");
            }}
          />
        );
      case "templates":
        return <TemplateSelector setView={handleSetView} />;
      case "create-quotation":
        return <QuotationList setView={handleSetView} />;
      
      case "clients":
        return (
          <ClientManager
            clients={clients}
            addClient={addClient}
            updateClient={updateClient}
            deleteClient={deleteClient}
            onViewDetails={(id) => {
              setClientIdForDetails(id);
              setCurrentView("client-details");
            }}
          />
        );
        
      case "client-details":
        return clientIdForDetails != null ? (
          <ClientDetails
            clientId={clientIdForDetails}
            clients={clients}
            invoices={invoices}
            products={products}
            setView={handleSetView}
            updateClient={updateClient}
          />
        ) : (
          <ClientManager
            clients={clients}
            addClient={addClient}
            updateClient={updateClient}
            deleteClient={deleteClient}
            onViewDetails={(id) => {
              setClientIdForDetails(id);
              setCurrentView("client-details");
            }}
          />
        );

      case "products":
        return (
          <ProductManager
            products={products}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            loading={isLoadingProducts}
            error={loadError}
            reload={refreshProducts}
          />
        );
      case "settings":
        return <Profile profile={profile} updateProfile={updateProfile} />;
      case "account": 
        return <AccountSettings userEmail={userEmail} />;
      case "login":
        return <Login setView={handleSetView} />;
      case "signup":
        return <Signup setView={handleSetView} />;
      case "DummyPDF": {
        const sampleInvoice = invoices[0] || {
          id: "sample-id",
          invoiceNumber: "SAMPLE/001",
          client: {
            id: "client-1",
            name: "Sample Client",
            email: "",
            address: "Sample address",
            gstin: "",
            state: "",
            stateCode: "",
          },
          shippingDetails: undefined,
          items: [
            {
              id: "i1",
              description: "Sample Item",
              quantity: 1,
              unitPrice: 100,
              hsnCode: "",
              uom: "",
            },
          ],
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date().toISOString().split("T")[0],
          status: "Draft" as any,
          transportMode: "",
          vehicleNo: "",
          dateOfSupply: new Date().toISOString().split("T")[0],
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
          termsAndConditions: "",
          jurisdiction: profile.companyState || "",
        };
        return (
          <PDFViewer style={{ width: "100%", height: "100%" }} showToolbar>
            <DummyPDF invoice={sampleInvoice} profile={profile} />
          </PDFViewer>
        );
      }

      default:
        return <Dashboard setView={handleSetView} />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setView={handleSetView} />} />
      <Route path="/signup" element={<Signup setView={handleSetView} />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <div className="flex h-screen font-sans" style={{ background: 'var(--content-bg, #f4f6fb)' }}>
              {/* Desktop Sidebar */}
              <div className="hidden lg:flex lg:flex-shrink-0">
                <Sidebar currentView={currentView} setView={handleSetView} userEmail={userEmail} />
              </div>

              {/* Mobile Sidebar Drawer */}
              {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setMobileSidebarOpen(false)}
                  />

                  {/* Drawer Content */}
                  <div className="relative flex-1 flex flex-col max-w-[280px] w-full z-50 animate-fade-in-right" style={{ background: 'var(--sidebar-bg, #0b0e1a)' }}>
                    {/* Close Button */}
                    <div className="absolute top-4 right-4 z-50">
                      <button
                        onClick={() => setMobileSidebarOpen(false)}
                        className="p-1.5 rounded-lg focus:outline-none"
                        style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)" }}
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <Sidebar
                      currentView={currentView}
                      setView={(v) => {
                        handleSetView(v);
                        setMobileSidebarOpen(false);
                      }}
                      userEmail={userEmail}
                    />
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header setView={handleSetView} onMenuClick={() => setMobileSidebarOpen(true)} />
                <main className={`flex-1 overflow-x-hidden overflow-y-auto ${currentView === "create-invoice" || currentView === "edit-invoice" ? "p-0" : "p-4 md:p-6 lg:p-8"}`}>
                  <Suspense fallback={<PageLoader />}>
                    {renderContent()}
                  </Suspense>
                </main>
              </div>
            </div>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;