import React, { useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { Token, TokenStatus } from "../../types";

/* -------- TEXT COLORS FOR STATUS (No pill backgrounds) -------- */
const statusTextColor: Record<TokenStatus, string> = {
  [TokenStatus.WAITING]: "text-red-600",
  [TokenStatus.IN_PROGRESS]: "text-blue-600",
  [TokenStatus.COMPLETED]: "text-green-600",
  [TokenStatus.CANCELLED]: "text-gray-600",
};

/* ---------------- SINGLE HISTORY CARD ---------------- */
const TokenHistoryCard: React.FC<{ token: Token }> = ({ token }) => {
  const { offices, tokens } = useAppContext();
  const office = offices.find((o) => o.id === token.officeId);

  /* Queue position based on order of creation */
  const queuePosition = tokens
    .filter(
      (t) =>
        t.officeId === token.officeId &&
        t.createdAt <= token.createdAt &&
        t.status !== TokenStatus.CANCELLED
    )
    .length;

  return (
    <div
      className="
        relative p-6 rounded-3xl
        bg-white/60 backdrop-blur-2xl
        border border-white/50
        shadow-[0_10px_40px_rgba(0,0,0,0.06)]
        overflow-hidden transition-all duration-300
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]
        hover:scale-[1.015]
      "
    >
      {/* Soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-3xl pointer-events-none" />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">

        {/* LEFT SECTION */}
        <div>
          <p className="text-xs tracking-wide uppercase text-gray-500 mb-1">
            {office?.name || "Office"}
          </p>

          {/* Queue Position */}
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            #{queuePosition}
          </p>

          {/* Purpose */}
          <p className="mt-1 text-gray-700 text-[15px] font-medium">
            {token.purpose}
          </p>
        </div>

        {/* STATUS TEXT ONLY (RIGHT SIDE, ALWAYS FIXED PLACE) */}
        <div className="flex-1 flex md:justify-end">
          <p className={`text-sm font-semibold ${statusTextColor[token.status]}`}>
            {token.status}
          </p>
        </div>

        {/* DATE / TIME */}
        <div className="text-right text-sm text-gray-500 whitespace-nowrap">
          <p>{new Date(token.createdAt).toLocaleDateString()}</p>
          <p>{new Date(token.createdAt).toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN PAGE ---------------- */
const TokenHistoryPage: React.FC = () => {
  const { currentUser, tokens } = useAppContext();

  const userTokens = useMemo(() => {
    return tokens
      .filter((t) => t.studentId === currentUser?.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [currentUser, tokens]);

  return (
    <div className="pb-10">
      <h1 className="text-3xl font-bold text-neutral-800 mb-8">
        My Token History
      </h1>

      {userTokens.length > 0 ? (
        <div className="space-y-5">
          {userTokens.map((token) => (
            <TokenHistoryCard key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white/70 backdrop-blur-xl p-10 rounded-3xl border shadow-sm">
          <p className="text-neutral-600">You have no token history yet.</p>
        </div>
      )}
    </div>
  );
};

export default TokenHistoryPage;
