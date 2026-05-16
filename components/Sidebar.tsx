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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
          ZenBill
        </h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </a>
          );
        })}

        {/* ── Quotation Section ── */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documents</p>
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
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                <span className="ml-auto text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              </a>
            );
          })}
        </div>

        {/* ── Settings (bottom) ── */}
        <div className="pt-3 mt-3 border-t border-gray-100">
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
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate capitalize">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{displayEmail || "Admin"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

