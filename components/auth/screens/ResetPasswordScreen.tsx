import React from "react";
import InputField from "../ui/InputField";
import AuthButton from "../ui/AuthButton";
import OtpInput from "../ui/OtpInput";

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
}: Props) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
      <p className="text-slate-500 mt-2 text-sm">
        Enter the code sent to <span className="font-mono text-slate-900">{email}</span> and your new password.
      </p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col space-y-4">
      <div className="flex flex-col items-center">
        <label className="text-sm font-semibold text-slate-700">Verification Code</label>
        <OtpInput value={otp} onChange={setOtp} />
      </div>

      <div className="h-6 -mt-4 mb-2 text-center">
        {error && <span className="text-sm text-rose-500 font-medium">{error}</span>}
      </div>

      <InputField
        id="newPassword"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        label="New Password"
      />

      <div className="pt-4">
        <AuthButton type="submit" isLoading={isLoading}>
          Reset Password
        </AuthButton>
      </div>

      <button type="button" onClick={onBackToLogin} className="mt-6 text-slate-500 hover:text-slate-900 text-sm">
        Cancel
      </button>
    </form>
  </div>
);

export default ResetPasswordScreen;
