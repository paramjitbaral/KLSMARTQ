import React, { useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { Token, TokenStatus } from "../../types";

/* ---------------- STATUS COLORS ---------------- */
const statusColor: Record<TokenStatus, string> = {
  "Waiting": "text-red-600",
  "In Progress": "text-blue-600",
  "Completed": "text-green-600",
  "Cancelled": "text-gray-500",
};

/* ---------------- SINGLE CARD ---------------- */
const TokenHistoryCard: React.FC<{ token: Token }> = ({ token }) => {
  const { offices, tokens } = useAppContext();
  const office = offices.find((o) => o.id === token.officeId);

  const bookedAt = new Date(token.createdAt);
  const completedAt = (token as any).completedAt
    ? new Date((token as any).completedAt)
    : null;

  // Compute queue position at the moment this token was booked
  const queuePositionAtBooking = useMemo(() => {
    const createdTime = new Date(token.createdAt).getTime();
    return (
      tokens.filter(
        (t) =>
          t.officeId === token.officeId &&
          new Date(t.createdAt).getTime() <= createdTime
      ).length || 1
    );
  }, [tokens, token]);

  const bookedString = `${bookedAt.toLocaleDateString()} • ${bookedAt.toLocaleTimeString()}`;
  const completedString = completedAt
    ? `${completedAt.toLocaleDateString()} • ${completedAt.toLocaleTimeString()}`
    : null;

  return (
    <div
      style={{ outline: "1px solid transparent" }} // 🔥 Flicker Fix #1
      className="
        relative w-full 
        bg-white/80 backdrop-blur-xl 
        border border-gray-200
        shadow-[0_8px_28px_rgba(0,0,0,0.08)]
        rounded-3xl 
        p-5

        /* 🔥 Flicker Fix #2 & #3 */
        transform-gpu 
        will-change-transform

        transition-all duration-300 
        hover:shadow-[0_16px_45px_rgba(0,0,0,0.16)]
        hover:-translate-y-0.5

        max-md:p-3
        max-md:rounded-2xl
      "
    >
      <div className="relative z-10 flex flex-col gap-3 max-md:gap-2">
        {/* OFFICE */}
        <p className="text-[11px] tracking-wide uppercase text-gray-500">
          {office?.name || "Office"}
        </p>

        {/* QUEUE POSITION + STATUS */}
        <div className="flex justify-between items-start w-full">
          <p className="text-2xl font-bold text-gray-900 max-md:text-xl">
            #{queuePositionAtBooking}
          </p>

          <span
            className={`
              font-semibold 
              text-sm max-md:text-xs 
              ${statusColor[token.status]}
            `}
          >
            {token.status}
          </span>
        </div>

        {/* PURPOSE */}
        <p
          className="
            text-gray-800 text-[15px] font-medium
            max-md:text-sm
            max-md:truncate max-md:w-[180px]
          "
        >
          {token.purpose}
        </p>

        {/* TIMES */}
        <div className="flex justify-between items-center mt-1">
          <p className="text-gray-600 text-sm max-md:text-[11px]">
            {bookedString}
          </p>

          {completedString ? (
            <p className="text-gray-600 text-sm max-md:text-[11px] text-right">
              {completedString}
            </p>
          ) : (
            <p className="italic text-gray-400 text-sm max-md:text-[11px]">
              Not Completed
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN PAGE ---------------- */
const TokenHistoryPage: React.FC = () => {
  const { currentUser, tokens } = useAppContext();

  const userTokens = useMemo(
    () =>
      tokens
        .filter((t) => t.studentId === currentUser?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [currentUser, tokens]
  );

  return (
    <div className="pb-10">
      <h1 className="text-3d font-bold text-neutral-800 mb-8">
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
