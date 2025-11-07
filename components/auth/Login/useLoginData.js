import { useCallback, useMemo, useState } from "react";
import { validateEmail, validatePassword } from "./helper";
import { useAuth } from "../../../hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiLogin } from "../../../utils/api";

export default function useLoginData() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => apiLogin({ email, password }),
  });

  const isValid = useMemo(() => {
    return validateEmail(email) && validatePassword(password);
  }, [email, password]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((s) => !s);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    if (!isValid) return;
    setIsLoading(true);
    try {
      // Login API call - cookie is set automatically by backend
      const response = await loginMutation.mutateAsync({ email, password });
      
      // Extract email from response
      const userEmail = response?.data?.email || response?.email || email;
      
      // Update auth context (cookie already set by backend)
      auth.login(userEmail);
      
      return true;
    } catch (e) {
      setError(e?.message || "Unable to sign in. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isValid, auth, loginMutation]);

  const handleOAuth = useCallback(async (provider) => {
    setError("OAuth not implemented");
  }, []);

  return {
    email,
    password,
    rememberMe,
    showPassword,
    isLoading,
    error,
    isValid,
    setEmail,
    setPassword,
    setRememberMe,
    toggleShowPassword,
    handleSubmit,
    handleOAuth,
  };
}


