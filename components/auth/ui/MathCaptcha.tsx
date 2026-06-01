import React, { useState, useEffect } from "react";

interface Props {
  onValidate: (isValid: boolean) => void;
}

const MathCaptcha: React.FC<Props> = ({ onValidate }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const generateProblem = () => {
    setNum1(Math.floor(Math.random() * 9) + 1);
    setNum2(Math.floor(Math.random() * 9) + 1);
    setInput("");
    setIsCorrect(false);
    onValidate(false);
  };

  useEffect(() => {
    generateProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const val = parseInt(input, 10);
    const correct = !isNaN(val) && val === num1 + num2;
    setIsCorrect(correct);
    onValidate(correct);
  }, [input, num1, num2, onValidate]);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
          Security Check
        </span>
        <button
          type="button"
          onClick={generateProblem}
          className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span>Refresh</span>
        </button>
      </div>
      <div className="flex gap-3">
        {/* Left side: Problem Box */}
        <div className="flex-1 flex items-center justify-center rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-sm py-3.5">
          <span className="font-mono text-[16px] font-bold text-slate-800 tracking-[0.15em]">
            {num1} + {num2} = ?
          </span>
        </div>

        {/* Right side: Answer Input */}
        <div className="relative w-1/3">
          <input
            id="math-captcha"
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ans"
            className="w-full px-3 py-3.5 rounded-xl text-center text-[14px] font-bold outline-none transition-all duration-200 shadow-sm bg-white border border-slate-200/80 text-slate-900 hover:border-slate-300 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      </div>
    </div>
  );
};

export default MathCaptcha;
