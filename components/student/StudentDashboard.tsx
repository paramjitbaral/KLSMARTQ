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

  const officeId = token.officeId;

  // 1️⃣ Get tokens for this office
  const officeTokens = tokens
    .filter((t) => t.officeId === officeId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const waitingList = officeTokens.filter((t) => t.status === TokenStatus.WAITING);
  const inProgressToken = officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS);

  // 2️⃣ Prevent scanning if another student is IN_PROGRESS
  if (inProgressToken && inProgressToken.id !== tokenId) {
    alert("You cannot scan. Another student is currently being served.");
    return;
  }

  // 3️⃣ Ensure it's the user's turn
  const nextWaiting = waitingList[0];
  if (nextWaiting && nextWaiting.id !== tokenId) {
    alert("Please wait for your turn. You are not next in queue.");
    return;
  }

  // 4️⃣ Call AppContext scan logic (fixing status + notifications)
  await scanOfficeQr(currentUser.id, officeId);

  setTokenToCheckIn(null);
};


  return (
    <div className="space-y-10 pb-10">

     {/* RESPONSIVE STATS THAT MATCH TOKEN CARD WIDTH */}
<div className="w-full flex justify-center">
  <div className="w-full max-w-3xl mx-auto flex justify-between px-3 gap-3">

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

          flex-1

          /* DESKTOP HEIGHT */
          md:h-32 md:min-w-[180px]

          /* MOBILE HEIGHT */
          h-24 min-w-[130px]

          ${item.mobile ? "flex" : "hidden md:flex"}
        `}
      >
        {/* TITLE */}
        <p className="text-[10px] md:text-xs uppercase tracking-wide font-semibold text-gray-600">
          {item.title}
        </p>

        {/* VALUE */}
        <p className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">
          {item.value}
        </p>
      </div>
    ))}

  </div>
</div>



      {/* ------------------------------------------------------ */}
      {/* ACTIVE TOKENS LIST */}
      {/* ------------------------------------------------------ */}

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
