// ======================= PART 1 — Imports + UI Components =======================
import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";

// Icons
import {
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  AppleIcon,
  LogoIcon,
} from "./Icons";

// ======================= INPUT FIELD =======================
const InputField = React.forwardRef<
  HTMLInputElement,
  {
    id: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    autoComplete?: string;
    label?: string;
  }
>(({ id, type, placeholder, value, onChange, disabled, autoComplete, label }, ref) => (
  <div className="w-full group">
    {label && (
      <label htmlFor={id} className="block mb-1.5 text-sm font-medium text-gray-300">
        {label}
      </label>
    )}

    <input
      ref={ref}
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      disabled={disabled}
      onChange={onChange}
      className="
        w-full px-5 py-4 rounded-2xl bg-[#1a1a2e]/60 text-white
        placeholder-gray-500 border border-white/10
        focus:border-[#a259ff] focus:ring-2 focus:ring-[#a259ff]/40
        outline-none transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    />
  </div>
));

// ======================= PASSWORD FIELD =======================
const PasswordField: React.FC<{
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  autoComplete?: string;
}> = ({ id, placeholder, value, onChange, label, autoComplete }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <InputField
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        label={label}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-[3.1rem] text-gray-400 hover:text-white transition"
      >
        {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

// ======================= AUTH BUTTON =======================
const AuthButton: React.FC<{
  onClick?: () => void;
  type?: "submit" | "button";
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, type = "button", isLoading = false, disabled = false, children }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || isLoading}
    className="
      w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 
      hover:to-fuchsia-500 text-white font-semibold py-4 rounded-full
      transition-all duration-300 active:scale-[0.97]
      disabled:opacity-50 shadow-[0_4px_20px_rgba(124,58,237,0.4)]
    "
  >
    {isLoading ? (
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
    ) : (
      children
    )}
  </button>
);

// ======================= SOCIAL BUTTON =======================
const SocialButton: React.FC<{
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}> = ({ icon, text, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      w-full flex items-center justify-center gap-3 bg-[#151525] 
      hover:bg-[#1e1e30] border border-white/5 text-gray-300 hover:text-white 
      py-3.5 px-4 rounded-2xl transition-all duration-200
    "
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="text-sm font-medium">{text}</span>
  </button>
);

// ======================= OTP INPUT =======================
const OtpInput = ({ value, onChange }) => {
  const refs = useRef([]);

  const update = (digit, i) => {
    if (!/^\d*$/.test(digit)) return;

    const arr = value.split("");
    arr[i] = digit.slice(-1);
    const final = arr.join("");
    onChange(final);

    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-3 my-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          maxLength={1}
          ref={(el) => (refs.current[i] = el)}
          value={value[i] || ""}
          onChange={(e) => update(e.target.value, i)}
          className="
            w-12 h-16 rounded-xl text-center text-2xl font-bold 
            bg-[#1a1a2e] border border-white/15 text-white 
            focus:ring-2 focus:ring-[#A259FF] outline-none
          "
        />
      ))}
    </div>
  );
};
// ======================= PART 2 — Onboarding + Login + Signup + OTP + Forgot =======================

// ----------------------- ONBOARDING VIDEO SCREEN -----------------------
const OnboardingScreen = ({ onContinue }) => (
  <div className="relative w-full h-full overflow-hidden bg-[#0a0a1a]">

    {/* 🔥 Fullscreen Video Background */}
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="https://res.cloudinary.com/dli7ryuqk/video/upload/v1765210277/onboarding_slgc5w.mp4" type="video/mp4" />
    </video>

    {/* Dark overlay */}
    <div className="absolute inset-0 bg-black/40"></div>

    {/* Main Content */}
    <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-full">

      <h1 className="text-white text-4xl font-bold leading-tight drop-shadow-lg">
        Discover Intelligence <br />
        with <span className="text-[#A259FF]">KL SmartQ</span>
      </h1>

      <p className="text-gray-300 text-lg mt-4 max-w-sm drop-shadow-md">
        Smart insights, modern queueing,
        seamless KL University experience.
      </p>

      {/* Dots */}
      <div className="flex gap-2 mt-6">
        <div className="w-2 h-2 rounded-full bg-[#A259FF]"></div>
        <div className="w-2 h-2 rounded-full bg-white/30"></div>
        <div className="w-2 h-2 rounded-full bg-white/30"></div>
      </div>

      {/* Get Started */}
      <button
        onClick={onContinue}
        className="
          absolute bottom-10 w-[80%] sm:w-[350px] py-4 rounded-xl 
          bg-[#F4A619] text-[#0a0a1a] font-semibold text-lg shadow-xl
          hover:shadow-[0_6px_30px_rgba(244,166,25,0.5)]
          transition-all duration-300
        "
      >
        Get Started →
      </button>
    </div>
  </div>
);


// ---------------------------- LOGIN SCREEN ----------------------------
const LoginScreen = ({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isLoading,
  goSignup,
  goForgot,
}) => (
  <div className="w-full h-full flex flex-col justify-center px-8 animate-fadeIn">

    <div className="flex flex-col items-center mb-10">
      <LogoIcon className="w-14 h-14 text-[#A259FF]" />
      <p className="mt-4 text-center text-lg text-white font-semibold">Sign In To Your Account</p>
      <p className="text-gray-400 text-sm mt-1">Access your account to manage settings & features.</p>
    </div>

    <form onSubmit={onSubmit} className="space-y-6">
      <InputField
        id="loginEmail"
        type="email"
        placeholder="name@example.com"
        value={email}
        autoComplete="username"
        onChange={(e) => setEmail(e.target.value)}
        label="Email"
      />

      <PasswordField
        id="loginPassword"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        label="Password"
      />

      {/* Extras */}
      <div className="flex justify-between text-sm mt-1">
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded bg-[#1a1a2e] border-gray-600" />
          Remember me
        </label>

        <button type="button" onClick={goForgot} className="text-[#A259FF] hover:text-[#b46bff] font-medium">
          Forgot password?
        </button>
      </div>

      <AuthButton type="submit" isLoading={isLoading} onClick={() => {}}>
        Get Started
      </AuthButton>
    </form>


    <p className="text-center text-gray-400 text-sm mt-6">
      Don’t have an account?{" "}
      <button onClick={goSignup} className="text-[#A259FF] hover:text-[#b46bff] font-semibold">Sign up</button>
    </p>
  </div>
);


// ---------------------------- SIGNUP SCREEN ----------------------------
const SignupScreen = ({
  email,
  setEmail,
  onSubmit,
  isLoading,
  goLogin,
}) => {
  const { checkEmailAvailability } = useAppContext();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  // Email check debounce
  useEffect(() => {
    if (!email) return;

    const t = setTimeout(async () => {
      setStatus("checking");
      const res = await checkEmailAvailability(email);
      setStatus(res.available ? "ok" : "bad");
      setMessage(res.message);
    }, 500);

    return () => clearTimeout(t);
  }, [email]);

  const match = password === confirm && password.length >= 8;
  const valid = name && status === "ok" && match;

  return (
    <div className="w-full h-full flex flex-col justify-center px-8">

      <div className="text-center mb-10">
        <LogoIcon className="w-14 h-14 text-[#A259FF]" />
        <p className="text-2xl font-semibold text-white mt-4">Create Account</p>
        <p className="text-gray-400 text-sm mt-1">
          Join KL SmartQ and modernize your campus experience.
        </p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(name, password);
        }}
      >
        <InputField
          id="signupName"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="Full Name"
        />

        <InputField
          id="signupEmail"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email Address"
          autoComplete="email"
        />

        {/* Status message */}
        <div className="h-5 text-xs ml-1">
          {status === "checking" && <span className="text-gray-400">Checking...</span>}
          {status === "ok" && <span className="text-green-400">{message}</span>}
          {status === "bad" && <span className="text-red-400">{message}</span>}
        </div>

        <PasswordField
          id="signupPass"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Password"
        />

        <PasswordField
          id="signupConfirm"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          label="Confirm Password"
        />

        {!match && confirm && (
          <p className="text-xs text-red-400 ml-1">Passwords do not match</p>
        )}

        <AuthButton type="submit" disabled={!valid} isLoading={isLoading} onClick={() => {}}>
          Create Account
        </AuthButton>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{" "}
        <button onClick={goLogin} className="text-[#A259FF] hover:text-[#b46bff] font-semibold">
          Log in
        </button>
      </p>
    </div>
  );
};


// ---------------------------- VERIFY OTP SCREEN ----------------------------
const VerifyOtpScreen = ({
  email,
  otp,
  setOtp,
  onSubmit,
  onResend,
  resendCooldown,
  isLoading,
  onBackToLogin,
}) => (
  <div className="w-full h-full flex flex-col justify-center px-8">

    <div className="text-center mb-10">
      <LogoIcon className="w-14 h-14 text-[#A259FF]" />
      <p className="text-2xl font-semibold text-white mt-4">Verify Your Email</p>
      <p className="text-gray-400 text-sm mt-2">
        Enter the code sent to <br />
        <span className="text-white font-medium">{email}</span>
      </p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col flex-1">
      <OtpInput value={otp} onChange={setOtp} />

      <p className="text-center text-sm text-gray-400 mb-6">
        Didn't get a code?
        <button
          type="button"
          onClick={onResend}
          disabled={resendCooldown > 0}
          className="ml-2 text-[#A259FF] disabled:opacity-40"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </button>
      </p>

      <div className="mt-auto space-y-4">
        <AuthButton type="submit" isLoading={isLoading} onClick={() => {}}>
          Verify Email
        </AuthButton>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-center text-sm text-gray-400 hover:text-white"
        >
          Back to Login
        </button>
      </div>
    </form>
  </div>
);


// ---------------------------- FORGOT PASSWORD ----------------------------
const ForgotPasswordScreen = ({
  email,
  setEmail,
  onSubmit,
  isLoading,
  onBackToLogin,
}) => (
  <div className="w-full h-full flex flex-col justify-center px-8">

    <div className="text-center mb-10">
      <LogoIcon className="w-14 h-14 text-[#A259FF]" />
      <p className="text-2xl font-semibold text-white mt-4">Reset Password</p>
      <p className="text-gray-400 text-sm mt-2">Enter your email to receive a reset link.</p>
    </div>

    <form onSubmit={onSubmit} className="space-y-6">
      <InputField
        id="resetEmail"
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        label="Email Address"
        autoComplete="email"
      />

      <AuthButton type="submit" isLoading={isLoading} onClick={() => {}}>
        Send Reset Link
      </AuthButton>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-center text-sm text-gray-400 hover:text-white"
      >
        Back to Login
      </button>
    </form>
  </div>
);
// ======================= PART 3 — MAIN AUTH PAGE CONTROLLER =======================

const StudentAuthPage = () => {
  const {
    login,
    signup,
    verifySignupOtp,
    resendSignupOtp,
    requestPasswordReset,
  } = useAppContext();

  // ONBOARDING should show only once when entering the page
  const [showOnboarding, setShowOnboarding] = useState(true);

  // login | signup | verify | forgot_password
  const [authState, setAuthState] = useState("login");

  // shared inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // messages
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // otp resend timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // loading state
  const [isLoading, setIsLoading] = useState(false);

  // store email for verifying OTP
  const otpEmailRef = useRef("");

  // reset error/info when switching screens
  const switchState = (state) => {
    setError("");
    setInfo("");
    setAuthState(state);
  };

  // ----------------------------
  // OTP cooldown timer
  // ----------------------------
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ----------------------------
  // LOGIN
  // ----------------------------
  const handleLogin = async (e) => {
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
        setInfo("Email not confirmed. New OTP sent.");
        switchState("verify");
      } else {
        setError(res.message);
      }
    }

    setIsLoading(false);
  };

  // ----------------------------
  // SIGNUP
  // ----------------------------
  const handleSignup = async (name, pass) => {
    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await signup(name, email, pass);

    if (res.success) {
      otpEmailRef.current = email;
      setResendCooldown(60);
      setInfo("Account created! OTP sent.");
      switchState("verify");
    } else {
      setError(res.message);
    }

    setIsLoading(false);
  };

  // ----------------------------
  // VERIFY OTP
  // ----------------------------
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await verifySignupOtp(otpEmailRef.current, otp);

    if (res.success) {
      setInfo("Email verified! You may now log in.");
      switchState("login");
    } else {
      setError(res.message);
    }

    setIsLoading(false);
  };

  // ----------------------------
  // RESEND OTP
  // ----------------------------
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    const res = await resendSignupOtp(otpEmailRef.current);
    if (res.success) {
      setResendCooldown(60);
      setInfo("New OTP sent!");
    } else {
      setError(res.message);
    }
  };

  // ----------------------------
  // FORGOT PASSWORD
  // ----------------------------
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    const res = await requestPasswordReset(email);

    if (!res.success) {
      setError(res.message);
    } else {
      setInfo("If registered, a reset link has been sent.");
      setTimeout(() => switchState("login"), 2500);
    }

    setIsLoading(false);
  };

  // ================================================================================================
  //                                 MAIN TWO-COLUMN LAYOUT (Final)
  // ================================================================================================

  return (
    <div className="w-full h-screen bg-[#05050f] font-['Sora'] flex overflow-hidden relative">

      {/* LEFT SIDE — ONBOARDING (full-screen on mobile, half-screen on laptop) */}
      <div
        className={`
          absolute inset-0 z-20 bg-[#0a0a1a]
          transition-transform duration-700 ease-out
          lg:static lg:w-1/2

          ${showOnboarding ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <OnboardingScreen onContinue={() => setShowOnboarding(false)} />
      </div>

      {/* RIGHT SIDE — AUTH FORMS */}
      <div
  className={`
    absolute inset-0 bg-[#05050f] flex flex-col px-8 py-12
    transition-transform duration-700 ease-in-out
    lg:relative lg:w-1/2 lg:translate-x-0
    ${showOnboarding ? "translate-x-full lg:translate-x-0" : "translate-x-0"}
  `}
>


        <div className="w-full max-w-md mx-auto">

          {/* MESSAGES */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {info}
            </div>
          )}

          {/* CONDITIONAL SCREENS */}
          {authState === "login" && (
            <LoginScreen
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              onSubmit={handleLogin}
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

        {/* FOOTER */}
       <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-xs text-gray-600 opacity-70">
  © {new Date().getFullYear()} KL SmartQ. All rights reserved.
</p>

      </div>
    </div>
  );
};

export default StudentAuthPage;
