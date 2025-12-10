import React from "react";
import { Token, Priority } from "../../types";

interface Props {
  token: Token;
  position: number;
  isServing?: boolean;
}

const TokenCard: React.FC<Props> = ({ token, position, isServing }) => {
  const priorityColors = {
    [Priority.NORMAL]: "border-l-neutral-400",
    [Priority.URGENT]: "border-l-red-500",
    [Priority.MEDICAL]: "border-l-blue-500",
  };

  return (
    <div
      className={`bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-sm flex justify-between items-center transition-all 
      ${priorityColors[token.priority]} border-l-4
      ${isServing ? "ring-2 ring-green-300 bg-green-50" : "hover:shadow-md"}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-neutral-800 w-8 text-center">
          {position}
        </span>

        <div>
          <p className="font-semibold text-neutral-900">
            {token.student?.name || "Unknown Student"}
          </p>
          <p className="text-sm text-neutral-600">{token.purpose}</p>

          <p className="text-xs text-neutral-400 mt-1">
            Token: {token.tokenNumber}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
          {token.priority}
        </span>

        {isServing && (
          <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow">
            SERVING
          </span>
        )}
      </div>
    </div>
  );
};

export default TokenCard;
