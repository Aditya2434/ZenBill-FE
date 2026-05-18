import React, { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { InvoiceList } from "./components/InvoiceList";
import { InvoiceForm } from "./components/InvoiceForm";
import { Profile } from "./components/Profile";
import { ClientManager } from "./components/ClientManager";
import { ProductManager } from "./components/ProductManager";
import { AccountSettings } from "./components/AccountSettings";
import { TemplateSelector } from "./components/TemplateSelector";
import { useInvoices } from "./hooks/useInvoices";
import { useProfile } from "./hooks/useProfile";
import { useClients } from "./hooks/useClients";
import { useProducts } from "./hooks/useProducts";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import { Invoice } from "./types";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, useAuth } from "./hooks/useAuth";
import DummyPDF from "./components/DummyPDF";
import { PDFViewer } from "@react-pdf/renderer";
import InvoiceView from "./components/InvoiceView";
import QuotationEditor from "./components/QuotationEditor";
import QuotationList from "./components/QuotationList";
import { ClientDetails } from "./components/ClientDetails";

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
          <InvoiceForm
            addInvoice={handleAddInvoice}
            setView={handleSetView}
            profile={profile}
            invoices={invoices}
            clients={clients}
            products={products}
          />
        );
      case "edit-invoice":
        return invoiceToEdit ? (
          <InvoiceForm
            existingInvoice={invoiceToEdit}
            updateInvoice={updateInvoice}
            setView={handleSetView}
            profile={profile}
            invoices={invoices}
            clients={clients}
            products={products}
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
            <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
              <Sidebar currentView={currentView} setView={handleSetView} userEmail={userEmail} />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header setView={handleSetView} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                  {renderContent()}
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