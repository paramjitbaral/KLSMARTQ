import React, { useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { Token, TokenStatus } from "../../types";

/* ---------------- STATUS COLORS ---------------- */
const statusStyle: Record<string, string> = {
  WAITING: "bg-[#FFF9EB] text-[#D97706] border border-[#FDE68A]",
  CALLED: "bg-orange-50 text-orange-700 border border-orange-200",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED: "bg-slate-50 text-slate-700 border border-slate-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
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

  const styleClass = statusStyle[token.status] || "bg-slate-50 text-slate-600 border border-slate-200";

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-5">
        
        {/* Left Side: Position & Details */}
        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
          
          {/* Position Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 sm:p-3 min-w-[64px] sm:min-w-[80px] flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">
              Pos
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#0A4DBF] leading-none">
              #{queuePositionAtBooking}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">
              {office?.name || "Office"}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
              {token.purpose}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 sm:mt-1.5">
              Booked: {bookedString}
            </span>
          </div>
        </div>

        {/* Right Side: Status & Timeline */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className={`inline-flex items-center justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0 sm:mb-2 ${styleClass}`}>
            {token.status.replace("_", " ")}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 text-right">
            {completedString ? (
              <>Completed:<br className="hidden sm:block" /> {completedString}</>
            ) : (
              "Not Completed"
            )}
          </span>
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
