import React, { useState, useEffect } from "react";
import InputField from "../ui/InputField";
import PasswordField from "../ui/PasswordField";
import AuthButton from "../ui/AuthButton";
import { useAppContext } from "../../../context/AppContext";

interface Props {
  email: string;
  setEmail: (x: string) => void;
  onSubmit: (name: string, pass: string) => void;
  isLoading: boolean;
  goLogin: () => void;
  error?: string;
}

const SignupScreen = ({ email, setEmail, onSubmit, isLoading, goLogin, error }: Props) => {
  const { checkEmailAvailability } = useAppContext();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) return;

    const t = setTimeout(async () => {
      setStatus("checking");
      const res = await checkEmailAvailability(email);
      setStatus(res.available ? "ok" : "bad");
      setMessage(res.message);
    }, 400);

    return () => clearTimeout(t);
  }, [email]);

  const valid = name && password === confirm && password.length >= 8 && status === "ok";

  return (
    <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
        <p className="text-slate-500 mt-2 text-sm">Register your university identity.</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(name, password);
        }}
      >
        <InputField
          id="signupName"
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="Your Name"
        />

        <div>
          <InputField
            id="signupEmail"
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email"
          />

          <div className="h-4 text-[10px] mt-1 text-right font-bold tracking-widest">
            {status === "checking" && <span className="text-slate-500">Checking…</span>}
            {status === "ok" && <span className="text-emerald-500">{message}</span>}
            {status === "bad" && <span className="text-rose-500">{message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            label="Confirm"
          />
        </div>

        {!valid && confirm && password !== confirm && (
          <p className="text-xs text-rose-500 text-right">Passwords do not match</p>
        )}
        
        {error && (
          <div className="text-rose-500 text-sm font-medium mt-2">
            {error}
          </div>
        )}

        <AuthButton type="submit" disabled={!valid} isLoading={isLoading}>
          Create Account
        </AuthButton>
      </form>

      <div className="mt-8 text-center">
        <button onClick={goLogin} className="text-slate-500 hover:text-slate-900 text-sm">
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default SignupScreen;
