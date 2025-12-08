import React, { useState } from "react";
import InputField from "./InputField";
import { EyeIcon, EyeOffIcon } from "../Icons";

interface Props {
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  autoComplete?: string;
}

const PasswordField: React.FC<Props> = ({
  id,
  placeholder,
  value,
  onChange,
  label,
  autoComplete,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full relative">
      <InputField
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        label={label}
        autoComplete={autoComplete}
      />

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="
          absolute right-4 top-[2.75rem]
          text-slate-500 hover:text-emerald-400 transition-colors
        "
      >
        {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PasswordField;
