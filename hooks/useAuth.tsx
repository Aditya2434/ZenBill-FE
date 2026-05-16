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

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication status on mount by trying to fetch protected data
  // If cookie exists and is valid, this will succeed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch company data - a protected endpoint
        // If cookie is valid, this will succeed
        const response = await apiGetCompany();

        if (response) {
          // Successfully fetched protected data = authenticated
          setIsAuthenticated(true);
          // We don't get email from company endpoint, but that's okay
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Failed to fetch = not authenticated or cookie expired
        setIsAuthenticated(false);
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback((email: string) => {
    // After successful login, cookie is already set by backend
    // Just update local state
    setIsAuthenticated(true);
    setUserEmail(email);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call result
      setIsAuthenticated(false);
      setUserEmail(null);

      // Clean up any old localStorage tokens
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

export const RequireAuth: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500">Loading ZenBill...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
