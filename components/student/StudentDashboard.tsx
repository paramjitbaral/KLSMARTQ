import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Token, TokenStatus } from "../../types";
import TokenCard from "./TokenCard";
import ScannerModal from "./ScannerModal";
import { TicketIcon } from "../common/Icons";

const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    tokens,
    offices,
    scanOfficeQr,
    notifications,
    clearNotification,
  } = useAppContext();

  const [tokenToCheckIn, setTokenToCheckIn] = useState<Token | null>(null);

  /* ------------ FILTER ACTIVE TOKENS ------------ */
  const activeTokens = useMemo(
    () =>
      tokens
        .filter(
          (t) =>
            t.studentId === currentUser?.id &&
            (t.status === TokenStatus.WAITING ||
              t.status === TokenStatus.IN_PROGRESS)
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [tokens, currentUser]
  );

  /* ------------ SCAN SUCCESS ------------ */
  const handleScanSuccess = async (tokenId: string) => {
    if (!currentUser) return;

    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return;

    await scanOfficeQr(currentUser.id, token.officeId);
    setTokenToCheckIn(null);
  };

  /* ------------ SIMPLE STAT CARD COMPONENT ------------ */
  const StatCard = ({
    title,
    value,
    color,
    show = true,
  }: {
    title: string;
    value: number;
    color: string;
    show?: boolean;
  }) =>
    !show ? null : (
      <div
        className={`
          flex flex-col justify-center items-center
          rounded-2xl px-6 py-4
          w-32 h-20 md:w-44 md:h-24
          bg-gradient-to-br ${color} 
          text-center
          transition-all duration-200
          hover:scale-[1.02]
        `}
      >
        <p className="text-[10px] md:text-xs font-semibold tracking-wide text-white/80">
          {title}
        </p>
        <p className="text-xl md:text-3xl font-extrabold text-white mt-1">
          {value}
        </p>
      </div>
    );

  return (
    <div className="space-y-8">

      {/* ----------- STATS SECTION ----------- */}
      <div className="w-full flex justify-center mt-2">
        <div className="flex gap-3 md:gap-6">

          {/* Active Tokens */}
          <StatCard
            title="Active Tokens"
            value={activeTokens.length}
            color="from-blue-500 to-indigo-500"
          />

          {/* Processing Now - hidden on mobile */}
          <StatCard
            title="Processing Now"
            value={activeTokens.filter((t) => t.status === TokenStatus.IN_PROGRESS).length}
            color="from-purple-500 to-pink-500"
            show={false}  // hidden for now as per your request
          />

          {/* Total Tokens */}
          <StatCard
            title="Total Tokens"
            value={tokens.filter((t) => t.studentId === currentUser?.id).length}
            color="from-emerald-500 to-teal-500"
          />
        </div>
      </div>

      {/* -------- ACTIVE TOKENS -------- */}
      {activeTokens.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-neutral-700">
            My Active Tokens
          </h2>

          {activeTokens.map((t) => {
            const office = offices.find((o) => o.id === t.officeId);

            const position = tokens.filter(
              (x) =>
                x.officeId === t.officeId &&
                x.status === TokenStatus.WAITING &&
                x.createdAt <= t.createdAt
            ).length;

            return (
              <TokenCard
                key={t.id}
                token={t}
                officeName={office?.name || "Office"}
                studentName={currentUser?.name || "Student"}
                position={position}
                onCheckIn={() => setTokenToCheckIn(t)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center bg-white p-10 rounded-xl shadow-sm border">
          <h2 className="text-2xl font-semibold text-neutral-700">
            No Active Tokens
          </h2>
          <p className="text-neutral-600 mb-6">
            You currently don't have any active tokens.
          </p>
          <Link
            to="/book-token"
            className="inline-flex gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg"
          >
            <TicketIcon className="w-5 h-5" />
            Book New Token
          </Link>
        </div>
      )}

      {/* -------- CAMERA MODAL -------- */}
      {tokenToCheckIn && (
        <ScannerModal
          token={tokenToCheckIn}
          studentId={currentUser?.id || ""}
          onClose={() => setTokenToCheckIn(null)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
