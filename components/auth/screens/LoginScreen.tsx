import React from "react";
import InputField from "../ui/InputField";
import PasswordField from "../ui/PasswordField";
import AuthButton from "../ui/AuthButton";

import MathCaptcha from "../ui/MathCaptcha";

interface Props {
  email: string;
  setEmail: (x: string) => void;
  password: string;
  setPassword: (x: string) => void;
  onSubmit: (e: any) => void;
  isLoading: boolean;
  goSignup: () => void;
  goForgot: () => void;
  error?: string;
  info?: string;
  setRecaptchaToken: (valid: string | null) => void;
  captchaKey?: number;
}

const LoginScreen = ({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isLoading,
  goSignup,
  goForgot,
  error,
  info,
  setRecaptchaToken,
  captchaKey
}: Props) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    {/* Header */}
    <div className="mb-10 text-center flex flex-col items-center">
      <img src="/logo.png" alt="SmartQ Logo" className="h-16 mb-4 object-contain" />
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
        Welcome back
      </h2>
      <p className="text-slate-500 mt-2 text-[15px]">
        Sign in to your SmartQ account
      </p>
    </div>

    {/* Form */}
    <form onSubmit={onSubmit} className="space-y-3.5">
      <InputField
        id="loginEmail"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
      />

      <PasswordField
        id="loginPassword"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <MathCaptcha key={captchaKey} onValidate={(isValid) => setRecaptchaToken(isValid ? "valid" : null)} />

      {/* Options row */}
      <div className="flex justify-between items-center text-[13px] pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded-md border-slate-300 text-emerald-500 focus:ring-emerald-500/20 transition"
          />
          <span className="text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
        </label>

        <button
          type="button"
          onClick={goForgot}
          className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Error/Info messages */}
      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-[13px] font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
          {error}
        </div>
      )}
      {info && (
        <div className="flex items-center gap-2 text-emerald-600 text-[13px] font-medium bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {info}
        </div>
      )}

      {/* Submit */}
      <div className="pt-3">
        <AuthButton type="submit" isLoading={isLoading}>
          Sign In
        </AuthButton>
      </div>
    </form>

    {/* Footer */}
    <div className="mt-8 text-center">
      <p className="text-slate-500 text-[13px]">
        Don't have an account?{" "}
        <button onClick={goSignup} className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
          Create one
        </button>
      </p>
    </div>
  </div>
);

export default LoginScreen;
