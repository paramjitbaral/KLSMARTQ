import React, { useState } from "react";
import AuthButton from "../ui/AuthButton";
import OtpInput from "../ui/OtpInput";

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

interface Props {
  email: string;
  otp: string;
  setOtp: (x: string) => void;
  password: string;
  setPassword: (x: string) => void;
  onSubmit: (e: any) => void;
  isLoading: boolean;
  onBackToLogin: () => void;
  error?: string;
  info?: string;
  resendCooldown?: number;
  onResend?: () => void;
}

const ResetPasswordScreen = ({
  email,
  otp,
  setOtp,
  password,
  setPassword,
  onSubmit,
  isLoading,
  onBackToLogin,
  error,
  info,
  resendCooldown = 0,
  onResend,
}: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleNextStep = () => {
    setLocalError("");
    if (otp.length !== 6) {
      setLocalError("Please enter the full 6-digit verification code.");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = (e: any) => {
    e.preventDefault();
    setLocalError("");

    if (password.length < 8) return setLocalError("Password must be at least 8 characters long.");
    if (!/[A-Z]/.test(password)) return setLocalError("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(password)) return setLocalError("Password must contain at least one lowercase letter.");
    if (!/[0-9]/.test(password)) return setLocalError("Password must contain at least one number.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return setLocalError("Password must contain at least one special character.");

    if (password !== confirmPassword) {
      return setLocalError("Passwords do not match.");
    }

    onSubmit(e);
  };

  const currentError = localError || error;

  return (
    <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
        <p className="text-slate-500 mt-2 text-sm">
          {step === 1 
            ? <>Enter the code sent to <span className="font-mono text-slate-900">{email}</span></>
            : "Create a new strong password."
          }
        </p>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleFinalSubmit} className="flex flex-col space-y-4">
        {step === 1 && (
          <>
            <div className="flex flex-col items-center">
              <label className="text-sm font-semibold text-slate-700 mb-0">Verification Code</label>
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            
            <div className="text-center mt-0">
               <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={onResend}
                className="text-xs font-semibold text-[#0A4DBF] disabled:text-slate-400"
              >
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : "Didn't receive it? Resend Code"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="relative w-full">
              <label className="block mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] placeholder-slate-400 border border-slate-200 hover:border-slate-300 focus:border-[#0A4DBF]/50 focus:ring-4 focus:ring-[#0A4DBF]/10 transition-all duration-200 outline-none text-sm font-mono pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="relative w-full">
              <label className="block mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] placeholder-slate-400 border border-slate-200 hover:border-slate-300 focus:border-[#0A4DBF]/50 focus:ring-4 focus:ring-[#0A4DBF]/10 transition-all duration-200 outline-none text-sm font-mono pr-12"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            
            <div className={`text-xs text-slate-500 bg-slate-100 p-3 rounded-lg overflow-hidden transition-all duration-300 ${isFocused ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0 p-0 m-0 border-0"}`}>
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li className={password.length >= 8 ? "text-emerald-600" : ""}>At least 8 characters</li>
                <li className={/[A-Z]/.test(password) ? "text-emerald-600" : ""}>One uppercase letter</li>
                <li className={/[a-z]/.test(password) ? "text-emerald-600" : ""}>One lowercase letter</li>
                <li className={/[0-9]/.test(password) ? "text-emerald-600" : ""}>One number</li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-emerald-600" : ""}>One special character</li>
              </ul>
            </div>
          </div>
        )}

        <div className="h-6 mt-1 mb-2 text-center flex flex-col items-center justify-center">
          {currentError && <span className="text-sm text-rose-500 font-medium">{currentError}</span>}
          {info && !currentError && <span className="text-sm text-emerald-500 font-medium">{info}</span>}
        </div>

        <div className="pt-2">
          <AuthButton type="submit" isLoading={isLoading}>
            {step === 1 ? "Next" : "Reset Password"}
          </AuthButton>
        </div>

        <button type="button" onClick={() => { step === 2 ? setStep(1) : onBackToLogin(); setLocalError(""); }} className="mt-6 text-slate-500 hover:text-slate-900 text-sm font-semibold">
          {step === 2 ? "Back" : "Cancel"}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordScreen;
