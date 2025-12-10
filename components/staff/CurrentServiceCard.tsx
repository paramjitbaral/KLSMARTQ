import React from "react";
import { Token } from "../../types";

interface Props {
  token: Token;
  isLoading?: boolean;
}

const CurrentServiceCard: React.FC<Props> = ({ token, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-7 shadow-[0_3px_30px_rgba(0,0,0,0.07)] border border-neutral-200">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-24"></div>
          <div className="h-10 bg-neutral-200 rounded"></div>
          <div className="h-4 bg-neutral-200 rounded w-32"></div>
          <div className="h-3 bg-neutral-200 rounded w-28"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-blue-500 to-blue-400 text-white p-7 rounded-3xl shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-4xl font-extrabold tracking-tight drop-shadow">
              {token.tokenNumber}
            </h3>

            <p className="text-lg font-semibold">{token.student?.name}</p>

            <p className="text-sm text-white/80 max-h-16 overflow-y-auto">
              {token.purpose}
            </p>
          </div>

          <span className="px-4 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase border border-white/30">
            IN PROGRESS
          </span>
        </div>

        <div className="flex gap-3 text-sm text-white/90">
          <span className="px-4 py-1 rounded-full bg-white/20 border border-white/20 font-semibold">
            Priority: {token.priority}
          </span>

          {token.calledAt && (
            <span className="px-4 py-1 rounded-full bg-white/10 border border-white/20">
              Started: {token.calledAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentServiceCard;
