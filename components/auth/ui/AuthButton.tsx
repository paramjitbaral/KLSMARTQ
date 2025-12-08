import React from "react";
import { playSfx } from "../soundEngine";

interface Props {
  onClick?: () => void;
  type?: "submit" | "button";
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const AuthButton: React.FC<Props> = ({
  onClick,
  type = "button",
  isLoading = false,
  disabled = false,
  children,
}) => {
  return (
    <button
      type={type}
      onClick={() => {
        if (!disabled && !isLoading) playSfx("click");
        onClick && onClick();
      }}
      disabled={disabled || isLoading}
      className="
        relative w-full py-4 rounded-lg font-semibold
        bg-white text-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-transform duration-150 active:scale-[0.97]
        overflow-hidden
      "
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 animate-spin rounded-full"></div>
        ) : (
          children
        )}
      </div>

      <div
        className="
          absolute inset-0 bg-emerald-400/20
          scale-x-0 group-hover:scale-x-100
          transition-transform origin-left duration-200
        "
      />
    </button>
  );
};

export default AuthButton;
