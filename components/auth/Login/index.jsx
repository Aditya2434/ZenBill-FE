import React from "react";
import useLoginData from "./useLoginData";
import { useNavigate } from "react-router-dom";

const Login = ({ setView }) => {
  const {
    email,
    password,
    rememberMe,
    showPassword,
    isLoading,
    error,
    successMessage,
    isValid,
    setEmail,
    setPassword,
    setRememberMe,
    toggleShowPassword,
    handleSubmit,
    handleForgotPassword
  } = useLoginData();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* ─── LEFT PANEL (Form) ─── */}
      <div className="flex-1 flex flex-col justify-center relative px-6 sm:px-12 lg:px-20 xl:px-32">
        
        {/* Subtle ambient light matching dashboard theme */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-50 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[420px] mx-auto relative z-10 animate-fade-in-up">
          
          {/* Brand/Logo Header */}
          <div className="flex items-center gap-3 mb-10">
            <img 
              src="/favicon.ico" 
              alt="ZenBill Logo" 
              className="w-10 h-10 object-contain drop-shadow-md rounded-xl"
              onError={(e) => {
                // Fallback if favicon isn't exactly named favicon.ico at root
                e.target.style.display = 'none';
              }} 
            />
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              ZenBill.
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Log in to your account
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-8">
            Welcome back! Please enter your details to access your dashboard.
          </p>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await handleSubmit();
              if (ok) navigate("/");
            }}
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium hover:border-slate-300"
                placeholder="name@company.com"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium hover:border-slate-300"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required={!successMessage} // don't strictly require if they just wanted to trigger forgot password, but typical form behavior will require it for standard submit
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    disabled={isLoading}
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                  Remember for 30 days
                </span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-bold text-white transition-all duration-200 mt-2 ${
                isValid && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-1 focus:outline-none"
              disabled={isLoading}
            >
              Sign up for free
            </button>
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL (Visual/Premium Branding) ─── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900 flex-col items-center justify-center p-12">
        
        {/* Dynamic Abstract Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-[#0B0F19] to-slate-900 z-0"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen z-0"></div>
        <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen z-0"></div>
        
        {/* Elegant Abstract Branding */}
        <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center">
          
          <div className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Streamline your billing <br/> with absolute precision.
          </h3>
          <p className="text-lg text-indigo-100/70 font-medium leading-relaxed max-w-md mx-auto">
            ZenBill provides a seamless, secure, and automated experience for generating professional invoices and managing your company's workflow.
          </p>

        </div>

        {/* Abstract floating rings */}
        <div className="absolute top-[15%] right-[5%] w-64 h-64 border border-white/5 rounded-full z-0 pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-80 h-80 border border-indigo-500/10 rounded-full z-0 pointer-events-none" />
      </div>

    </div>
  );
};

export default Login;