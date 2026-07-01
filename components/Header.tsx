import React from 'react';
import { View } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  setView: (view: View) => void;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setView, onMenuClick }) => {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: 64,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(99,102,241,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      {/* Left: menu + welcome */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden"
            style={{
              padding: "7px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid rgba(99,102,241,0.15)",
              cursor: "pointer",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Open sidebar"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {userEmail && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 7, height: 7,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 0 2px rgba(16,185,129,0.3)",
            }} />
            <span style={{ fontSize: 13.5, color: "#64748b", fontWeight: 400 }}>
              Welcome back,{" "}
              <span style={{ fontWeight: 700, color: "#1e293b" }}>
                {userEmail.split("@")[0]}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Notification bell */}
        <button
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: "#6366f1",
            transition: "all 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)";
          }}
          title="Notifications"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification dot */}
          <span style={{
            position: "absolute",
            top: 7, right: 7,
            width: 6, height: 6,
            borderRadius: "50%",
            background: "#f43f5e",
            border: "1.5px solid white",
          }} />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#ef4444",
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "#ef4444";
            el.style.color = "white";
            el.style.borderColor = "#ef4444";
            el.style.transform = "translateY(-1px)";
            el.style.boxShadow = "0 4px 16px rgba(239,68,68,0.3)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(239,68,68,0.07)";
            el.style.color = "#ef4444";
            el.style.borderColor = "rgba(239,68,68,0.2)";
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};