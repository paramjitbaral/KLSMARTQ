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
        relative w-full py-3.5 rounded-xl font-semibold text-[15px]
        bg-slate-900 text-white
        hover:bg-slate-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        active:translate-y-0 active:scale-[0.99]
        overflow-hidden
      "
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
        ) : (
          children
        )}
      </div>
    </button>
  );
};

export default AuthButton;
