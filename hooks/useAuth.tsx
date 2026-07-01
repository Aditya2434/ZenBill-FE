import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiGetCompany, apiLogout } from "../utils/api";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Tiny cache helpers (sessionStorage) ──────────────────────────────────────
const AUTH_CACHE_KEY = "zenbill_auth_state";
const AUTH_EMAIL_KEY = "zenbill_user_email";

function readCachedAuth(): { authenticated: boolean; email: string | null } | null {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedAuth(authenticated: boolean, email: string | null) {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ authenticated, email }));
    if (email) sessionStorage.setItem(AUTH_EMAIL_KEY, email);
  } catch {}
}

function clearCachedAuth() {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
    sessionStorage.removeItem(AUTH_EMAIL_KEY);
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  // Read cached state synchronously — no flicker, no spinner on revisit
  const cached = readCachedAuth();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    cached?.authenticated ?? false
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cached); // only show loading if no cache
  const [userEmail, setUserEmail] = useState<string | null>(
    cached?.email ??
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(AUTH_EMAIL_KEY) : null)
  );

  useEffect(() => {
    // If we have a cached positive auth state, re-validate silently in background
    // (don't block the UI — the user sees the dashboard immediately)
    const checkAuth = async () => {
      try {
        const response = await apiGetCompany();
        if (response) {
          setIsAuthenticated(true);
          writeCachedAuth(true, userEmail);
        } else {
          setIsAuthenticated(false);
          clearCachedAuth();
        }
      } catch {
        // Only log out if we were previously unauthenticated too
        if (!cached?.authenticated) {
          setIsAuthenticated(false);
          clearCachedAuth();
        }
        // If we had a cached authenticated state, keep showing the UI;
        // the user will be redirected if they try to make an API call
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    writeCachedAuth(true, email);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
      setUserEmail(null);
      clearCachedAuth();
      localStorage.removeItem("zenbill_auth_token");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      userEmail,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, userEmail, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ─── Premium loading screen ───────────────────────────────────────────────────

const AuthLoadingScreen = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0b0e1a 0%, #0f172a 60%, #1e1b4b 100%)",
    flexDirection: "column",
    gap: 20,
  }}>
    {/* Logo mark */}
    <div style={{
      width: 52, height: 52,
      borderRadius: 16,
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.5)",
      marginBottom: 4,
    }}>
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>

    <div style={{ textAlign: "center" }}>
      <h1 style={{
        fontSize: 22, fontWeight: 800,
        color: "white",
        margin: "0 0 4px",
        letterSpacing: "-0.3px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}>ZenBill</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>
        Invoice Manager
      </p>
    </div>

    {/* Spinner */}
    <div style={{ position: "relative" }}>
      <div style={{
        width: 40, height: 40,
        borderRadius: "50%",
        border: "3px solid rgba(99,102,241,0.2)",
        borderTopColor: "#6366f1",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>

    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 500 }}>
      Verifying your session…
    </p>
  </div>
);

// ─── RequireAuth ──────────────────────────────────────────────────────────────

export const RequireAuth: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
