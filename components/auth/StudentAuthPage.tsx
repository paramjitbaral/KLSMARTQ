import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { usePullToRefresh } from "./usePullToRefresh";
import HolographicDeck from "./HolographicDeck";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import VerifyOtpScreen from "./screens/VerifyOtpScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import PullToRefresh from "./PullToRefresh";


const StudentAuthPage = () => {
  usePullToRefresh();
  const { login, signup, verifySignupOtp, resendSignupOtp, requestPasswordReset } =
    useAppContext();

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [authState, setAuthState] = useState<
    "login" | "signup" | "verify" | "forgot_password"
  >("login");

  // Shared states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // UI feedback
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // OTP states
  const otpEmailRef = useRef("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const switchState = (s: typeof authState) => {
    setError("");
    setInfo("");
    setAuthState(s);
  };

  /* -------------------- RESEND TIMER -------------------- */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ----------------------- LOGIN ------------------------- */
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await login(email, password);

    if (!res.success) {
      if (res.code === "email_not_confirmed") {
        otpEmailRef.current = email;
        await resendSignupOtp(email);
        setResendCooldown(60);
        setInfo("Email not verified — OTP re-sent.");
        switchState("verify");
      } else {
        setError(res.message);
      }
    }

    setIsLoading(false);
  };

  /* ----------------------- SIGNUP ------------------------- */
  const handleSignup = async (name: string, pass: string) => {
    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await signup(name, email, pass);

    if (res.success) {
      otpEmailRef.current = email;
      setResendCooldown(60);
      setInfo("Account created — OTP sent.");
      switchState("verify");
    } else {
      setError(res.message);
    }

    setIsLoading(false);
  };

  /* ---------------------- VERIFY OTP ---------------------- */
  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    if (otp.length !== 6) {
      setError("Enter the full 6-digit OTP.");
      setIsLoading(false);
      return;
    }

    const res = await verifySignupOtp(otpEmailRef.current, otp);

    if (res.success) {
      setInfo("Email verified! You may now log in.");
      switchState("login");
    } else {
      setError(res.message);
    }

    setIsLoading(false);
  };

  /* ---------------------- RESEND OTP ---------------------- */
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const res = await resendSignupOtp(otpEmailRef.current);

    if (res.success) {
      setResendCooldown(60);
      setInfo("New OTP sent.");
    } else {
      setError(res.message);
    }
  };

  /* ---------------------- PASSWORD RESET ---------------------- */
  const handlePasswordReset = async (e: any) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await requestPasswordReset(email);

    if (res.success) {
      setInfo("If registered, a reset link has been emailed.");
      setTimeout(() => switchState("login"), 2500);
    } else {
      setError(res.message);
    }

    setIsLoading(false);
  };

  /* ---------------------- RENDER ---------------------- */

  return (
    <div
      className="w-full h-screen bg-slate-950 flex overflow-hidden relative selection:bg-emerald-500/30 selection:text-white"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* 🌟 GLOBAL PULL-TO-REFRESH */}
    <PullToRefresh onRefresh={() => window.location.reload()} />
      
      {/* LEFT — HOLOGRAPHIC ONBOARDING */}
      <div
        className={`
          absolute inset-0 z-20 bg-slate-950
          transition-transform duration-700 ease-out
          lg:static lg:w-1/2 lg:border-r border-white/5
          ${showOnboarding ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <HolographicDeck onComplete={() => setShowOnboarding(false)} />
      </div>

      {/* RIGHT — AUTH */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center px-6 bg-slate-950
          transition-transform duration-700 ease-in-out
          lg:relative lg:w-1/2
          ${showOnboarding ? "translate-x-full lg:translate-x-0" : "translate-x-0"}
        `}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Errors */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-mono flex items-center gap-3">
              <span className="text-xl">!</span> {error}
            </div>
          )}

          {/* Info */}
          {info && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono flex items-center gap-3">
              <span className="text-xl">✓</span> {info}
            </div>
          )}

          {/* Screens */}
          {authState === "login" && (
            <LoginScreen
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleLogin}
              isLoading={isLoading}
              goSignup={() => switchState("signup")}
              goForgot={() => switchState("forgot_password")}
            />
          )}

          {authState === "signup" && (
            <SignupScreen
              email={email}
              setEmail={setEmail}
              onSubmit={handleSignup}
              isLoading={isLoading}
              goLogin={() => switchState("login")}
            />
          )}

          {authState === "verify" && (
            <VerifyOtpScreen
              email={otpEmailRef.current}
              otp={otp}
              setOtp={setOtp}
              resendCooldown={resendCooldown}
              onResend={handleResendOtp}
              onSubmit={handleVerifyOtp}
              isLoading={isLoading}
              onBackToLogin={() => switchState("login")}
            />
          )}

          {authState === "forgot_password" && (
            <ForgotPasswordScreen
              email={email}
              setEmail={setEmail}
              onSubmit={handlePasswordReset}
              isLoading={isLoading}
              onBackToLogin={() => switchState("login")}
            />
          )}
        </div>

        <p className="absolute bottom-6 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase opacity-50">
          SECURE SYSTEM // KL UNIVERSITY // V2.0.4
        </p>
      </div>
    </div>
  );
};

export default StudentAuthPage;
