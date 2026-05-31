import React from "react";
import InputField from "../ui/InputField";
import PasswordField from "../ui/PasswordField";
import AuthButton from "../ui/AuthButton";
import { LogoIcon } from "../Icons";

interface Props {
  email: string;
  setEmail: (x: string) => void;
  password: string;
  setPassword: (x: string) => void;
  onSubmit: (e: any) => void;
  isLoading: boolean;
  goSignup: () => void;
  goForgot: () => void;
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
}: Props) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.04)]">
        <LogoIcon className="w-6 h-6 text-emerald-500" />
      </div>

      <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
      <p className="text-slate-500 mt-2 text-[15px]">Enter your credentials to continue.</p>
    </div>

    <form onSubmit={onSubmit} className="space-y-6">
      <InputField
        id="loginEmail"
        type="email"
        placeholder="student@university.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        label="Email"
      />

      <PasswordField
        id="loginPassword"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        label="Password"
      />

      <div className="flex justify-between text-xs text-slate-500">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-3.5 h-3.5 rounded bg-white border-slate-300" />
          Keep me logged in
        </label>

        <button type="button" onClick={goForgot} className="text-emerald-400 hover:text-emerald-300">
          Forgot?
        </button>
      </div>

      <AuthButton type="submit" isLoading={isLoading}>
        Login
      </AuthButton>
    </form>

    <div className="mt-8 text-center pt-6 border-t border-slate-200">
      <p className="text-slate-500 text-sm">
        New student?
        <button onClick={goSignup} className="text-slate-900 ml-1 font-semibold hover:text-emerald-500">
          Register
        </button>
      </p>
    </div>
  </div>
);

export default LoginScreen;
