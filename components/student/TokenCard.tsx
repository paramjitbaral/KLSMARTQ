import React from "react";
import { Token, TokenStatus } from "../../types";
import { QrCodeIcon } from "../common/Icons";

const PRIMARY = "#0A4DBF";

interface TokenCardProps {
  token: Token;
  officeName: string;
  studentName: string;
  position: number;
  onCheckIn: (t: Token) => void;
}

const TokenCard: React.FC<TokenCardProps> = ({
  token,
  officeName,
  studentName,
  position,
  onCheckIn,
}) => {
  const isWaiting = token.status === TokenStatus.WAITING;

  return (
    <div className="max-w-5xl mx-auto mb-6 bg-white rounded-[16px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-slate-200 overflow-hidden font-sans">

      {/* Top Header Strip */}
      <div className="flex justify-between items-center px-5 py-2 border-b border-slate-100 bg-slate-50/50">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Office
          </span>
          <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-none">
            {officeName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            Token
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide
              ${token.status === TokenStatus.IN_PROGRESS
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : token.status === TokenStatus.WAITING
                  ? "bg-[#FFF9EB] text-[#D97706] border border-[#FDE68A]"
                  : "bg-slate-50 text-slate-600 border border-slate-200"
              }
            `}
          >
            {token.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-row relative">
        
        {/* Left Section */}
        <div className="w-[60%] sm:w-[55%] p-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 relative justify-center">
          
          <div>
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Student
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-slate-800 truncate block">
              {studentName}
            </span>
          </div>
            
          <div>
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Purpose
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-600 truncate block">
              {token.purpose}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Queue
              </span>
              <span className="text-xs sm:text-sm md:text-base font-bold text-slate-800">
                {position}
              </span>
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Priority
              </span>
              <span className="text-xs sm:text-sm md:text-base font-bold text-slate-800 truncate block">
                {token.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Divider (All Screens) */}
        <div className="flex relative w-0 border-l border-dashed border-slate-200 flex-col justify-between items-center">
          <div className="absolute top-2 sm:top-3 left-[-6px] sm:left-[-8px] w-3 h-3 sm:w-4 sm:h-4 bg-[#F6F7FB] rounded-full" />
          <div className="absolute bottom-2 sm:bottom-3 left-[-6px] sm:left-[-8px] w-3 h-3 sm:w-3 sm:h-4 bg-[#F6F7FB] rounded-full" />
        </div>

        {/* Right Section */}
        <div className="w-[40%] sm:w-[45%] p-3 sm:px-5 sm:py-3 flex flex-col items-center justify-center">

          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
            Your Token
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 sm:mb-3">
            {token.tokenNumber}
          </span>

          <div className="flex w-full justify-around text-center gap-1 sm:gap-2 mb-2 sm:mb-3">
            <div>
              <span className="text-[8px] sm:text-[10px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                Status
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-800">
                {token.status.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-[8px] sm:text-[10px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                Wait
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-800">
                —
              </span>
            </div>
          </div>

          {isWaiting ? (
            <button
              onClick={() => onCheckIn(token)}
              className="w-full flex justify-center items-center gap-1 sm:gap-2 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold text-white transition-all active:scale-[0.98] shadow-sm hover:shadow-md mt-1"
              style={{ backgroundColor: PRIMARY }}
            >
              <QrCodeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Check In</span>
            </button>
          ) : (
            <div className="w-full text-center py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-slate-50 mt-1">
              <span className="text-[9px] sm:text-[11px] font-medium text-slate-500">Processed</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TokenCard;
