import React, { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { Token, TokenStatus, Priority } from "../../types";

/* ============================================================
   REUSABLE COMPONENTS
============================================================ */

const StatCard: React.FC<{ title: string; value: number | string; color: string; mobile?: boolean }> =
({ title, value, color, mobile = true }) => (
  <div
    className={`
      flex flex-col items-center justify-center
      rounded-[32px] bg-gradient-to-br ${color}
      flex-1
      h-24 md:h-32
      min-w-[130px] md:min-w-[200px]
      ${mobile ? "flex" : "hidden md:flex"}
    `}
  >
    <p className="text-[10px] md:text-xs uppercase tracking-wide font-semibold text-gray-600">
      {title}
    </p>
    <p className="text-3xl md:text-4xl font-extrabold text-[#0A0F1C] mt-1">
      {value}
    </p>
  </div>
);

const TokenCard: React.FC<{ token: Token; position: number; isServing?: boolean }> =
({ token, position, isServing }) => {
  const priorityClasses = {
    [Priority.NORMAL]: "border-l-neutral-400",
    [Priority.URGENT]: "border-l-red-500",
    [Priority.MEDICAL]: "border-l-blue-500",
  };

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-sm border ${priorityClasses[token.priority]} border-l-4 
      flex justify-between items-center ${isServing ? "bg-green-50 ring-1 ring-green-200" : ""}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-neutral-800 w-8 text-center">{position}</span>
        <div>
          <p className="font-semibold text-neutral-900">{token.student?.name || "Unknown Student"}</p>
          <p className="text-sm text-neutral-600">{token.purpose}</p>
          <p className="text-xs text-neutral-500 mt-1">Token: {token.tokenNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
          {token.priority}
        </span>

        {isServing && (
          <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-sm">
            SERVING
          </span>
        )}
      </div>
    </div>
  );
};

const CurrentServiceCard: React.FC<{ token: Token; isLoading?: boolean }> =
({ token }) => (
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white shadow-2xl w-full p-7">
    <div className="relative z-10 space-y-4">
      <h3 className="text-4xl font-black">{token.tokenNumber}</h3>
      <p className="text-lg font-semibold">{token.student?.name}</p>
      <p className="text-sm">{token.purpose}</p>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30">
          Priority: {token.priority}
        </span>
      </div>
    </div>
  </div>
);

/* ============================================================
   MAIN STAFF DASHBOARD COMPONENT
============================================================ */

const StaffDashboard: React.FC = () => {
  const { currentUser, offices, tokens, callNextToken, completeToken } = useAppContext();

  const staffOffices = useMemo(
    () =>
      offices.filter(
        (o) =>
          currentUser?.assignedOfficeIds?.includes(o.id) ||
          currentUser?.role === "Admin"
      ),
    [offices, currentUser]
  );

  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(
    staffOffices[0]?.id || null
  );

  const officeTokens = useMemo(
    () => tokens.filter((t) => t.officeId === selectedOfficeId),
    [tokens, selectedOfficeId]
  );

  const waitingTokens = officeTokens.filter((t) => t.status === TokenStatus.WAITING);
  const inProgressToken = officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS);
  const completedCount = officeTokens.filter((t) => t.status === TokenStatus.COMPLETED).length;

  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState("");

  const handleCallNext = async () => {
    if (calling) return;
    setCalling(true);
    setCallError("");

    try {
      await callNextToken(selectedOfficeId!);
    } catch (err: any) {
      setCallError(err.message || "Failed to call next student");
    }

    setCalling(false);
  };

  /* ============================================================
     RETURN — MOBILE + DESKTOP VIEW
  ============================================================ */

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* --------------------------------------------------------
         📱 MOBILE VIEW (ONLY MOBILE)
      -------------------------------------------------------- */}
      <div className="block md:hidden relative pb-24">

        {/* MOBILE STATS (unchanged) */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-md mx-auto flex justify-between px-3 gap-3">
            <StatCard title="Students Waiting" value={waitingTokens.length} color="from-yellow-50 to-yellow-100" />
            <StatCard title="Completed Today" value={completedCount} color="from-green-50 to-green-100" />
          </div>
        </div>

        {/* WAITING LIST — FULL SCREEN WIDTH */}
        <div className="px-3 space-y-3">
          {waitingTokens.length > 0 ? (
            waitingTokens.map((token, index) => (
              <TokenCard key={token.id} token={token} position={index + 1} />
            ))
          ) : (
            <p className="text-center text-neutral-500 pt-4">
              No students are currently waiting.
            </p>
          )}
        </div>

        {/* FLOATING CALL NEXT BUTTON */}
        <button
          onClick={handleCallNext}
          disabled={calling || waitingTokens.length === 0}
          className="
            fixed bottom-4 left-1/2 -translate-x-1/2 
            w-[90%] max-w-md 
            bg-secondary text-primary-dark font-bold 
            py-3 rounded-2xl shadow-xl
            disabled:bg-neutral-300
          "
        >
          {calling ? "Calling..." : "Call Next Student"}
        </button>

      </div>

      {/* --------------------------------------------------------
         💻 DESKTOP VIEW — EXACT SAME AS BEFORE
      -------------------------------------------------------- */}
      <div className="hidden md:block h-full overflow-hidden">

        {/* HEADER (unchanged) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-2 px-6 pt-0">
          {staffOffices.length > 1 && (
            <select
              value={selectedOfficeId || ""}
              onChange={(e) => setSelectedOfficeId(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg"
            >
              {staffOffices.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* STAT CARDS */}
        <div className="w-full flex justify-center mb-8">
          <div className="w-full max-w-3xl mx-auto flex justify-between px-3 gap-3 md:gap-8">
            <StatCard title="Students Waiting" value={waitingTokens.length} color="from-yellow-50 to-yellow-100" />
            <StatCard title="Currently Serving" value={inProgressToken ? 1 : 0} color="from-blue-50 to-blue-100" mobile={false} />
            <StatCard title="Completed Today" value={completedCount} color="from-green-50 to-green-100" />
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 pb-6 h-full overflow-hidden">

          {/* WAITING LIST CONTAINER */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4">Waiting List</h3>

            <div className="space-y-3 overflow-y-auto pr-2">
              {waitingTokens.length > 0 ? (
                waitingTokens.map((token, index) => (
                  <TokenCard key={token.id} token={token} position={index + 1} />
                ))
              ) : (
                <p className="text-center text-neutral-500 pt-10">
                  No students are currently waiting.
                </p>
              )}
            </div>
          </div>

          {/* CURRENT SERVING */}
          <div className="bg-white p-6 rounded-2xl shadow-xl h-full flex flex-col">
            {!inProgressToken ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-neutral-600 mb-4">No one is currently being served.</p>
                <button className="w-full bg-secondary text-primary-dark py-3 rounded-lg">
                  Call Next Student
                </button>
              </div>
            ) : (
              <CurrentServiceCard token={inProgressToken} />
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default StaffDashboard;
