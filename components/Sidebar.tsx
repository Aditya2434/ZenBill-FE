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
    { id: "dashboard",  label: "Dashboard",  icon: DashboardIcon, views: ["dashboard"] },
    { id: "invoices",   label: "Invoices",   icon: DocumentIcon,  views: ["invoices", "create-invoice", "edit-invoice", "invoice-details"] },
    { id: "clients",    label: "Clients",    icon: UsersIcon,     views: ["clients", "client-details"] },
    { id: "products",   label: "Products",   icon: BoxIcon,       views: ["products"] },
    ...(isDev ? [{ id: "DummyPDF", label: "Dummy PDF", icon: PdfIcon, views: ["DummyPDF"] }] : []),
  ];

  const quotationNavItem = { id: "create-quotation", label: "Quotation", icon: QuotationIcon, views: ["create-quotation"] };
  const settingsNavItem  = { id: "settings",          label: "Settings",  icon: SettingsIcon,   views: ["settings"] };

  const displayEmail = userEmail || "";
  const displayName  = displayEmail.split("@")[0] || "User";
  const initials     = displayName.charAt(0).toUpperCase();

  const NavItem = ({
    item,
    badge,
  }: {
    item: { id: string; label: string; icon: React.FC<any>; views: string[] };
    badge?: React.ReactNode;
  }) => {
    const isActive = item.views.includes(currentView);
    return (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); setView(item.id as View); }}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "9px 12px",
          borderRadius: "10px",
          fontSize: "13.5px",
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
          background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
          border: isActive ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
          boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          textDecoration: "none",
          position: "relative",
          overflow: "hidden",
          marginBottom: "2px",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
          }
        }}
      >
        {/* Active left bar */}
        {isActive && (
          <span style={{
            position: "absolute",
            left: 0, top: "50%",
            transform: "translateY(-50%)",
            width: "3px", height: "60%",
            borderRadius: "0 3px 3px 0",
            background: "linear-gradient(180deg, #818cf8, #6366f1)",
          }} />
        )}
        <item.icon
          style={{
            width: 17, height: 17,
            marginRight: 10,
            flexShrink: 0,
            opacity: isActive ? 1 : 0.6,
            transition: "all 0.2s",
          }}
        />
        <span style={{ flex: 1 }}>{item.label}</span>
        {badge}
      </a>
    );
  };

  return (
    <div
      style={{
        width: 240,
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Ambient glow top-right */}
      <div style={{
        position: "absolute",
        top: -40, right: -40,
        width: 180, height: 180,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Logo ── */}
      <div style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: "1px solid var(--sidebar-border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            flexShrink: 0,
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display" style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.3px",
              lineHeight: 1,
              margin: 0,
            }}>ZenBill</h1>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, marginTop: 1, letterSpacing: "0.05em" }}>INVOICE MANAGER</p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        {/* Section label */}
        <p style={{
          fontSize: 10, fontWeight: 700,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "0 4px",
          marginBottom: 8, marginTop: 0,
        }}>Main Menu</p>

        {primaryNavItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}

        {/* Documents section */}
        <div style={{
          margin: "20px 0 8px",
          paddingTop: 16,
          borderTop: "1px solid var(--sidebar-border)",
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0 4px",
            marginBottom: 8, marginTop: 0,
          }}>Documents</p>
          <NavItem
            item={quotationNavItem}
            badge={
              <span style={{
                fontSize: 9, fontWeight: 800,
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                color: "white",
                padding: "2px 7px",
                borderRadius: 99,
                letterSpacing: "0.06em",
              }}>NEW</span>
            }
          />
        </div>

        {/* System section */}
        <div style={{
          margin: "20px 0 8px",
          paddingTop: 16,
          borderTop: "1px solid var(--sidebar-border)",
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0 4px",
            marginBottom: 8, marginTop: 0,
          }}>System</p>
          <NavItem item={settingsNavItem} />
        </div>
      </nav>

      {/* ── User card ── */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid var(--sidebar-border)",
        background: "rgba(0,0,0,0.2)",
        flexShrink: 0,
      }}>
        <button
          onClick={() => setView("account")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 12,
            background: currentView === "account"
              ? "rgba(99,102,241,0.15)"
              : "rgba(255,255,255,0.04)",
            border: currentView === "account"
              ? "1px solid rgba(99,102,241,0.3)"
              : "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            if (currentView !== "account") {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== "account") {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
            }
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 34, height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "white",
            flexShrink: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              textTransform: "capitalize",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{displayName}</p>
            <p style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              margin: 0, marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{displayEmail || "Administrator"}</p>
          </div>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};