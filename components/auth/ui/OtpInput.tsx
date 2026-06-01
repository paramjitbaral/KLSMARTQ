import React, { useRef } from "react";
import { playSfx } from "../soundEngine";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const OtpInput = ({ value, onChange }: Props) => {
  const refs = useRef<HTMLInputElement[]>([]);

  const update = (digit: string, index: number) => {
    if (!/^\d*$/.test(digit)) return;

    const arr = value.split("");
    arr[index] = digit.slice(-1);
    const final = arr.join("");
    onChange(final);

    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
      // Optionally, clear the previous value when jumping back
      const arr = value.split("");
      arr[index - 1] = "";
      onChange(arr.join(""));
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3 my-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          maxLength={1}
          ref={(el) => (refs.current[i] = el!)}
          value={value[i] || ""}
          onChange={(e) => {
            playSfx("click");
            update(e.target.value, i);
          }}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="
            w-9 h-12 sm:w-12 sm:h-14 text-center font-bold text-lg sm:text-xl
            bg-white text-slate-900 rounded-lg sm:rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.04)]
            border border-slate-200 hover:border-slate-300
            focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10
            transition-all duration-200 font-mono
          "
        />
      ))}
    </div>
  );
};

export default OtpInput;
