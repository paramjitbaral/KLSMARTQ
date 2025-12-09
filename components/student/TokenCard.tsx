import React from "react";
import { Token, TokenStatus } from "../../types";
import { QrCodeIcon } from "../common/Icons";

const PRIMARY = "#0A4DBF"; // same blue as your app

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
    <div
      className="
        max-w-4xl mx-auto mb-6
        bg-white rounded-3xl
        shadow-[0_10px_35px_rgba(15,23,42,0.12)]
        border border-slate-200
        overflow-hidden
      "
    >
      {/* TOP STRIP – OFFICE + STATUS */}
      <div
        className="
          flex items-center justify-between
          px-5 py-3
          border-b border-slate-200
          bg-slate-50
        "
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Office
          </span>
          <span className="text-base md:text-lg font-semibold text-slate-900">
            {officeName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Token
            </span>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {token.tokenNumber}
            </div>
          </div>

          <span
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              border
              ${
                token.status === TokenStatus.IN_PROGRESS
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : token.status === TokenStatus.WAITING
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }
            `}
          >
            {token.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-col md:flex-row relative">
        {/* LEFT PANEL – TOKEN & PURPOSE */}
        <div
          className="
            relative
            md:w-7/12
            px-6 py-5
            flex flex-col gap-4
          "
        >
          {/* Perforation circles (ticket feel) */}
          <div className="hidden md:block absolute right-[-16px] top-10 w-8 h-8 bg-slate-100 rounded-full" />
          <div className="hidden md:block absolute right-[-16px] bottom-10 w-8 h-8 bg-slate-100 rounded-full" />

          {/* Token big for mobile */}
          <div className="sm:hidden">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Token
            </p>
            <p className="text-4xl font-extrabold text-slate-900">
              {token.tokenNumber}
            </p>
          </div>

          {/* Student name & purpose */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Student
            </p>
            <p className="text-base md:text-lg font-semibold text-slate-900">
              {studentName}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Purpose
            </p>
            <p className="text-sm md:text-base text-slate-800">
              {token.purpose}
            </p>
          </div>

          {/* Small meta row */}
          <div className="mt-2 grid grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Queue Position
              </p>
              <p className="text-lg font-bold text-slate-900">{position}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Priority
              </p>
              <p className="text-sm font-medium text-slate-900">
                {token.priority}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL – BIG TOKEN + CHECK-IN */}
        <div
          className="
            md:w-5/12
            border-t md:border-t-0 md:border-l border-dashed border-slate-200
            px-6 py-5
            flex flex-col justify-between gap-4
            bg-slate-50/60
          "
        >
          {/* Big token for desktop */}
          <div className="hidden sm:flex flex-col items-center">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Your Token
            </p>
            <p className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              {token.tokenNumber}
            </p>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs md:text-sm">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Status
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {token.status.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Queue
              </p>
              <p className="mt-1 font-semibold text-slate-900">{position}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Est. Wait
              </p>
              <p className="mt-1 font-semibold text-slate-900">—</p>
            </div>
          </div>

          {/* Check-in button */}
          {isWaiting && (
            <button
              onClick={() => onCheckIn(token)}
              className="
                w-full mt-1 inline-flex items-center justify-center gap-2
                rounded-xl py-3
                text-sm md:text-base font-semibold
                text-white
                shadow-[0_10px_25px_rgba(15,23,42,0.35)]
                transition-transform duration-150
                active:scale-[0.97]
              "
              style={{ backgroundColor: PRIMARY }}
            >
              <QrCodeIcon className="w-5 h-5" />
              <span>Scan to Check In</span>
            </button>
          )}

          {!isWaiting && (
            <p className="text-[11px] text-slate-500 text-center mt-1">
              This token is no longer in waiting status.
            </p>
          )}
        </div>
      </div>

      {/* FOOTER STRIP */}
      <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between text-[11px] text-slate-500">
        <span>KL SmartQ · Digital Queue Pass</span>
        <span>Generated • {token.createdAt.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default TokenCard;
