import React from "react";

interface Props {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
  label?: string;
}

const InputField = React.forwardRef<HTMLInputElement, Props>(
  ({ id, type, placeholder, value, onChange, disabled, autoComplete, label }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="
            w-full px-4 py-3 rounded-xl bg-white text-slate-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)]
            placeholder-slate-400 border border-slate-200 hover:border-slate-300
            focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10
            transition-all duration-200 outline-none text-sm font-mono
          "
        />
      </div>
    );
  }
);

export default InputField;
