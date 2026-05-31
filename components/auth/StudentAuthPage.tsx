import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { usePullToRefresh } from "./usePullToRefresh";
import HolographicDeck from "./HolographicDeck";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import VerifyOtpScreen from "./screens/VerifyOtpScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";


const StudentAuthPage = () => {
  usePullToRefresh();
  const { login, signup, verifySignupOtp, resendSignupOtp, requestPasswordReset } =
    useAppContext();

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [authState, setAuthState] = useState<
    "login" | "signup" | "verify" | "forgot_password" | "reset_password"
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
      setInfo("A reset code has been emailed to you.");
      otpEmailRef.current = email;
      switchState("reset_password");
    } else {
      setError(res.message || "Failed to send reset code.");
    }

    setIsLoading(false);
  };

  const handleSubmitPasswordReset = async (e: any) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    const { submitPasswordReset } = useAppContext();
    const res = await submitPasswordReset(email, otp, password);

    if (res.success) {
      setInfo("Password updated successfully. You can now login.");
      setTimeout(() => switchState("login"), 2500);
    } else {
      setError(res.message || "Failed to reset password.");
    }

    setIsLoading(false);
  };

  /* ---------------------- RENDER ---------------------- */

  return (
    <div
      className="w-full h-screen bg-slate-50 flex overflow-hidden relative selection:bg-emerald-500/30 selection:text-slate-900"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* LEFT — HOLOGRAPHIC ONBOARDING */}
      <div
        className={`
          absolute inset-0 z-20 bg-slate-950 bg-gradient-to-br from-slate-900 to-slate-950
          transition-transform duration-700 ease-out
          lg:static lg:w-1/2 lg:border-r border-black/5
          ${showOnboarding ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <HolographicDeck onComplete={() => setShowOnboarding(false)} />
      </div>

      {/* RIGHT — AUTH */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center px-6 bg-slate-50 bg-gradient-to-tl from-slate-50 to-white
          transition-transform duration-700 ease-in-out
          lg:relative lg:w-1/2
          ${showOnboarding ? "translate-x-full lg:translate-x-0" : "translate-x-0"}
        `}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Notifications */}
          <div className="absolute -top-24 left-0 right-0 flex flex-col items-center gap-3 z-50 pointer-events-none">
            {error && authState !== "verify" && (
              <div className="mx-auto w-fit px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-3 shadow-sm pointer-events-auto">
                <span className="text-rose-500 text-lg">!</span> {error}
              </div>
            )}
            {info && (
              <div className="mx-auto w-fit px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-medium flex items-center gap-3 shadow-sm pointer-events-auto">
                <span className="text-emerald-500 text-lg">✓</span> {info}
              </div>
            )}
          </div>

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
              error={error}
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

          {authState === "reset_password" && (
            <ResetPasswordScreen
              email={email}
              otp={otp}
              setOtp={setOtp}
              password={password}
              setPassword={setPassword}
              onSubmit={handleSubmitPasswordReset}
              isLoading={isLoading}
              onBackToLogin={() => switchState("login")}
              error={error}
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
