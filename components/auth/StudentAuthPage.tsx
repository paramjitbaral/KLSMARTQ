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
  const { login, signup, verifySignupOtp, resendSignupOtp, requestPasswordReset, submitPasswordReset } =
    useAppContext();

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("hasSeenOnboarding") !== "true";
  });

  const handleCompleteOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
  };

  const [authState, setAuthState] = useState<
    "login" | "signup" | "verify" | "forgot_password" | "reset_password"
  >("login");

  // Shared states
  const [email, setEmail] = useState(() => localStorage.getItem("kl_smartq_email") || "");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("kl_smartq_email"));
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

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

  const [captchaKey, setCaptchaKey] = useState(0);

  /* ----------------------- LOGIN ------------------------- */
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!recaptchaToken) {
      setError("Incorrect security verification answer.");
      setCaptchaKey(prev => prev + 1);
      return;
    }

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
      setIsLoading(false);
    } else {
      if (rememberMe) {
        localStorage.setItem("kl_smartq_email", email);
      } else {
        localStorage.removeItem("kl_smartq_email");
      }
    }
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
      setResendCooldown(60);
      switchState("reset_password");
    } else {
      setError(res.message || "Failed to send reset code.");
    }

    setIsLoading(false);
  };

  /* ---------------------- RESEND RESET OTP ---------------------- */
  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return;
    const res = await requestPasswordReset(otpEmailRef.current);

    if (res.success) {
      setResendCooldown(60);
      setInfo("New reset code sent.");
    } else {
      setError(res.message || "Failed to send reset code.");
    }
  };

  const handleSubmitPasswordReset = async (e: any) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await submitPasswordReset(email, otp, password);

    if (res.success) {
      setInfo("Password updated successfully. You can now login.");
      setTimeout(() => {
        setIsLoading(false);
        switchState("login");
      }, 2500);
    } else {
      setError(res.message || "Failed to reset password.");
      setIsLoading(false);
    }
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
        <HolographicDeck onComplete={handleCompleteOnboarding} />
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
          {/* Screens */}
          {authState === "login" && (
            <LoginScreen
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              onSubmit={handleLogin}
              isLoading={isLoading}
              goSignup={() => switchState("signup")}
              goForgot={() => switchState("forgot_password")}
              error={error}
              info={info}
              setRecaptchaToken={setRecaptchaToken}
              captchaKey={captchaKey}
            />
          )}

          {authState === "signup" && (
            <SignupScreen
              email={email}
              setEmail={setEmail}
              onSubmit={handleSignup}
              isLoading={isLoading}
              goLogin={() => switchState("login")}
              error={error}
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
              error={error}
              info={info}
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
              info={info}
              resendCooldown={resendCooldown}
              onResend={handleResendResetOtp}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAuthPage;
