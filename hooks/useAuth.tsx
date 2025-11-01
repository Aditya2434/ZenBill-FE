import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  login: (token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_KEY = "zenbill_auth_token";

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) setToken(saved);
  }, []);

  const login = useCallback((newToken?: string) => {
    const t = newToken || "dev-token";
    setToken(t);
    localStorage.setItem(AUTH_KEY, t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(token),
    token,
    login,
    logout,
  }), [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const RequireAuth: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};


