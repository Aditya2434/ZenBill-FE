import React from "react";
import { View } from "../App";
import {
  DashboardIcon,
  DocumentIcon,
  SettingsIcon,
  UsersIcon,
  BoxIcon,
  PdfIcon,
  QuotationIcon,
} from "./icons";

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  userEmail?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userEmail }) => {
  const isDev = import.meta.env.DEV;

  const primaryNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: DashboardIcon,
      views: ["dashboard"],
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: DocumentIcon,
      views: ["invoices", "create-invoice", "edit-invoice", "invoice-details"],
    },
    { id: "clients", label: "Clients", icon: UsersIcon, views: ["clients"] },
    { id: "products", label: "Products", icon: BoxIcon, views: ["products"] },
    // "Dummy PDF" is a dev-only tool — hidden in production
    ...(isDev
      ? [{ id: "DummyPDF", label: "Dummy PDF", icon: PdfIcon, views: ["DummyPDF"] }]
      : []),
  ];

  const quotationNavItem = {
    id: "create-quotation",
    label: "Quotation",
    icon: QuotationIcon,
    views: ["create-quotation"],
  };

  const settingsNavItem = {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
    views: ["settings"],
  };

  // Derive display name and initials from email
  const displayEmail = userEmail || "";
  const displayName = displayEmail.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            ZenBill
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</p>
        
        {primaryNavItems.map((item) => {
          const isActive = item.views.includes(currentView);
          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setView(item.id as View);
              }}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              {item.label}
            </a>
          );
        })}

        {/* ── Quotation Section ── */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <p className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documents</p>
          {[quotationNavItem].map((item) => {
            const isActive = item.views.includes(currentView);
            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setView(item.id as View);
                }}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {item.label}
                <span className="ml-auto text-[9px] font-bold bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full border border-sky-200">
                  NEW
                </span>
              </a>
            );
          })}
        </div>

        {/* ── Settings (bottom) ── */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <p className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</p>
          {[settingsNavItem].map((item) => {
            const isActive = item.views.includes(currentView);
            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setView(item.id as View);
                }}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ── Clickable Profile / Account Bottom Section ── */}
      <div className="p-4 bg-white border-t border-slate-200">
        <button 
          onClick={() => setView("account")}
          className={`w-full p-2 rounded-xl flex items-center gap-3 transition-all text-left focus:outline-none ${
            currentView === "account" ? "bg-slate-50 ring-1 ring-slate-200" : "hover:bg-slate-50"
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate capitalize">{displayName}</p>
            <p className="text-xs font-medium text-slate-500 truncate">{displayEmail || "Administrator"}</p>
          </div>
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};