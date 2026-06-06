import React, { useState } from "react";
import InputField from "./InputField";
import { EyeIcon, EyeOffIcon } from "../Icons";

interface Props {
  id: string;
  name?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  autoComplete?: string;
}

const PasswordField: React.FC<Props> = ({
  id,
  name,
  placeholder,
  value,
  onChange,
  label,
  autoComplete,
}) => {
  const [show, setShow] = useState(false);

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
      <div className="relative">
        <InputField
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            text-slate-400 hover:text-emerald-500 transition-colors
          "
        >
          {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
