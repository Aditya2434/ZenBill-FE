import { useCallback, useMemo, useState } from "react";
import {
  validateEmail,
  validatePassword,
  validateName,
  passwordsMatch,
} from "./helper";
import { useMutation } from "@tanstack/react-query";
import { apiRegister } from "../../../utils/api";

export default function useSignupData() {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [state, setState] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: (payload) => apiRegister(payload),
  });

  const isValid = useMemo(() => {
    return (
      validateName(name) &&
      validateName(companyName) &&
      validateName(state) &&
      validateName(code) &&
      validateEmail(email) &&
      validatePassword(password) &&
      passwordsMatch(password, confirmPassword) &&
      agreeTerms
    );
  }, [
    name,
    companyName,
    state,
    code,
    email,
    password,
    confirmPassword,
    agreeTerms,
  ]);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!validateName(name)) missing.push("Full name");
    if (!validateName(companyName)) missing.push("Company name");
    if (!validateName(state)) missing.push("State");
    if (!validateName(code)) missing.push("Code");
    if (!validateEmail(email)) missing.push("Email");
    if (!validatePassword(password)) missing.push("Password (min 6)");
    if (!passwordsMatch(password, confirmPassword))
      missing.push("Passwords must match");
    if (!agreeTerms) missing.push("Accept terms");
    return missing;
  }, [
    name,
    companyName,
    state,
    code,
    email,
    password,
    confirmPassword,
    agreeTerms,
  ]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((s) => !s);
  }, []);

  const toggleShowConfirm = useCallback(() => {
    setShowConfirm((s) => !s);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    if (!isValid) return;
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        email,
        password,
        companyName,
        state,
        code,
      });
      return true;
    } catch (e) {
      setError(e?.message || "Unable to create account. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [companyName, state, code, email, password, isValid, registerMutation]);

  const handleOAuth = useCallback(async (provider) => {
    setError("OAuth not implemented");
  }, []);

  return {
    name,
    companyName,
    state,
    code,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirm,
    agreeTerms,
    isLoading,
    error,
    isValid,
    missingFields,
    setName,
    setCompanyName,
    setState,
    setCode,
    setEmail,
    setPassword,
    setConfirmPassword,
    toggleShowPassword,
    toggleShowConfirm,
    setAgreeTerms,
    handleSubmit,
    handleOAuth,
  };
}
