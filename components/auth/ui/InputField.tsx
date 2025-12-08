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
            className="block mb-2 text-xs font-semibold tracking-widest text-slate-400 uppercase"
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
            w-full px-4 py-3 rounded-xl bg-white/[0.05] text-white
            placeholder-slate-600 border border-white/10
            focus:border-emerald-400/40 focus:bg-white/[0.07]
            transition-all duration-150 outline-none text-sm font-mono
          "
        />
      </div>
    );
  }
);

export default InputField;
