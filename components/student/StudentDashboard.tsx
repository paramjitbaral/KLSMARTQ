import React, { useMemo, useState } from "react";
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
    checkInStudent,        // ✅ REQUIRED FIX
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

  /* ------------ SCAN SUCCESS (FINAL FIXED LOGIC) ------------ */
  const handleScanSuccess = async (tokenId: string) => {
    if (!currentUser) return;

    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return;

    const officeId = token.officeId;

    // 1️⃣ Get tokens for this office
    const officeTokens = tokens
      .filter((t) => t.officeId === officeId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const waitingList = officeTokens.filter((t) => t.status === TokenStatus.WAITING);
    const inProgressToken = officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS);
    const nextWaiting = waitingList[0];

    // 2️⃣ BLOCK if another student is in progress
    if (inProgressToken && inProgressToken.id !== tokenId) {
      alert("Another student is currently being served. Please wait.");
      return;
    }

    // 3️⃣ BLOCK if student is not next
    if (nextWaiting && nextWaiting.id !== tokenId) {
      alert("Please wait for your turn. You are not next in queue.");
      return;
    }

    // 4️⃣ BACKEND LOGIC → updates status, ETA, sends notifications
    await scanOfficeQr(currentUser.id, officeId);

    // 5️⃣ MISSING PART → mark token checked-in
    await checkInStudent(tokenId);

    setTokenToCheckIn(null);
  };

  return (
    <div className="space-y-8 pb-10">

      {/* RESPONSIVE STATS */}
      <div className="w-full flex justify-center pt-4">
        <div className="w-full max-w-3xl mx-auto flex justify-center px-3 gap-4">
          {[
            { title: "Active Tokens", value: activeTokens.length, color: "from-blue-50 to-blue-100", mobile: true },
            { title: "Processing Now", value: activeTokens.filter(t => t.status === TokenStatus.IN_PROGRESS).length, color: "from-purple-50 to-pink-100", mobile: false },
            { title: "Total Tokens", value: tokens.filter(t => t.studentId === currentUser?.id).length, color: "from-green-50 to-green-100", mobile: true },
          ].map((item, i) => (
            <div
              key={i}
              className={`
                flex flex-col items-center justify-center
                rounded-3xl bg-gradient-to-br ${item.color}
                border border-gray-200 backdrop-blur-xl
                w-[45%] max-w-[160px]
                md:h-32 md:max-w-[200px]
                h-24
                ${item.mobile ? "flex" : "hidden md:flex"}
              `}
            >
              <p className="text-[10px] md:text-xs uppercase tracking-wide font-semibold text-gray-600">
                {item.title}
              </p>
              <p className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE TOKENS LIST */}
      {activeTokens.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-neutral-700">
            My Active Tokens
          </h2>

          {activeTokens.map((t) => {
            const office = offices.find((o) => o.id === t.officeId);

            const officeTokens = tokens.filter(x => x.officeId === t.officeId);
            const position = officeTokens.filter(
              (x) =>
                x.status === TokenStatus.WAITING &&
                x.createdAt <= t.createdAt
            ).length;

            const completedTokens = officeTokens.filter(x => x.status === TokenStatus.COMPLETED && x.completedAt && x.calledAt);
            let avgMins = 5;
            if (completedTokens.length > 0) {
               const totalMs = completedTokens.reduce((acc, curr) => acc + (curr.completedAt!.getTime() - curr.calledAt!.getTime()), 0);
               avgMins = Math.round((totalMs / completedTokens.length) / 60000);
               if (avgMins < 1) avgMins = 1;
            }

            const waitMins = position * avgMins;
            const estimatedWait = waitMins > 0 ? `~${waitMins} min` : 'Next';

            return (
              <TokenCard
                key={t.id}
                token={t}
                officeName={office?.name || "Office"}
                studentName={currentUser?.name || "Student"}
                position={position}
                estimatedWait={estimatedWait}
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

      {/* CAMERA MODAL */}
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
