import React from "react";
import AuthButton from "../ui/AuthButton";
import OtpInput from "../ui/OtpInput";

interface Props {
  email: string;
  otp: string;
  setOtp: (x: string) => void;
  onSubmit: (e: any) => void;
  onResend: () => void;
  resendCooldown: number;
  isLoading: boolean;
  onBackToLogin: () => void;
}

const VerifyOtpScreen = ({
  email,
  otp,
  setOtp,
  onSubmit,
  onResend,
  resendCooldown,
  isLoading,
  onBackToLogin,
}: Props) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10 text-center">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-slate-900">Verify Email</h2>
      <p className="text-slate-500 mt-2 text-sm">
        Code sent to <span className="text-slate-900 font-mono">{email}</span>
      </p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col">
      <OtpInput value={otp} onChange={setOtp} />

      <p className="text-center text-xs text-slate-500 mb-8 uppercase tracking-widest">
        Didn’t get it?
        <button
          type="button"
          onClick={onResend}
          disabled={resendCooldown > 0}
          className="ml-2 text-emerald-500 disabled:opacity-40 font-bold"
        >
          {resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}
        </button>
      </p>

      <AuthButton type="submit" isLoading={isLoading}>
        Verify
      </AuthButton>

      <button type="button" onClick={onBackToLogin} className="mt-6 text-slate-500 hover:text-slate-900 text-sm">
        Cancel
      </button>
    </form>
  </div>
);

export default VerifyOtpScreen;

