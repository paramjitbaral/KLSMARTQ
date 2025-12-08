import React from "react";
import InputField from "../ui/InputField";
import AuthButton from "../ui/AuthButton";

interface Props {
  email: string;
  setEmail: (x: string) => void;
  onSubmit: (e: any) => void;
  isLoading: boolean;
  onBackToLogin: () => void;
}

const ForgotPasswordScreen = ({
  email,
  setEmail,
  onSubmit,
  isLoading,
  onBackToLogin,
}: Props) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10">
      <h2 className="text-3xl font-bold text-white">Reset Password</h2>
      <p className="text-slate-400 mt-2 text-sm">
        A reset link will be emailed to you.
      </p>
    </div>

    <form onSubmit={onSubmit} className="space-y-6">
      <InputField
        id="resetEmail"
        type="email"
        placeholder="student@university.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        label="Email"
      />

      <AuthButton type="submit" isLoading={isLoading}>
        Send Reset Link
      </AuthButton>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-center text-slate-500 hover:text-white text-sm"
      >
        Back to Login
      </button>
    </form>
  </div>
);

export default ForgotPasswordScreen;
