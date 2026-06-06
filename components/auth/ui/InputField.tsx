import React from "react";

interface Props {
  id: string;
  name?: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
  label?: string;
}

const InputField = React.forwardRef<HTMLInputElement, Props>(
  ({ id, name, type, placeholder, value, onChange, disabled, autoComplete, label }, ref) => {
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
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="
            w-full px-4 py-3.5 rounded-xl bg-slate-50/80 text-slate-900
            placeholder-slate-400 border border-slate-200/80 hover:border-slate-300
            focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white
            transition-all duration-200 outline-none text-[14px]
          "
        />
      </div>
    );
  }
);

export default InputField;
