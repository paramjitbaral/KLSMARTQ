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

  return (
    <div className="flex justify-center gap-3 my-8">
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
          className="
            w-10 h-14 text-center font-bold text-xl
            bg-white/[0.05] text-white rounded-lg
            border border-white/10
            focus:border-emerald-400/40 focus:bg-white/[0.07]
            transition-all duration-150 font-mono
          "
        />
      ))}
    </div>
  );
};

export default OtpInput;
