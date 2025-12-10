import React, { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { TokenStatus, Priority } from "../../types";

import StatCard from "./StatCard";
import TokenCard from "./TokenCard";
import CurrentServiceCard from "./CurrentServiceCard";

const StaffDashboard: React.FC = () => {
  const { currentUser, offices, tokens, completeToken } = useAppContext();

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

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const officeTokens = useMemo(
    () => tokens.filter((t) => t.officeId === selectedOfficeId),
    [tokens, selectedOfficeId]
  );

  const waitingTokens = useMemo(
    () =>
      officeTokens
        .filter((t) => t.status === TokenStatus.WAITING)
        .sort((a, b) => {
          if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
          if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT) return 1;

          if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL) return -1;
          if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL) return 1;

          return a.createdAt.getTime() - b.createdAt.getTime();
        }),
    [officeTokens]
  );

  const inProgressToken = useMemo(
    () => officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS),
    [officeTokens]
  );

  const completedCount = useMemo(
    () => officeTokens.filter((t) => t.status === TokenStatus.COMPLETED).length,
    [officeTokens]
  );

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  // -----------------------------------------
  // NEW LOGIC → CALL NEXT = ONLY COMPLETE CURRENT
  // -----------------------------------------
  const handleCallNext = async () => {
    if (!inProgressToken) {
      setErrorMessage("No active student to complete.");
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");

      // Only complete the current token
      await completeToken(inProgressToken.id);

      // DO NOT set next token as IN_PROGRESS
      // Student will scan QR → then becomes IN_PROGRESS automatically

    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete current token.");
    } finally {
      setActionLoading(false);
    }
  };

  // -----------------------------------------
  // UI RETURN
  // -----------------------------------------
  if (staffOffices.length === 0) {
    return <p className="text-center text-neutral-600 mt-10">
      You are not assigned to any active offices.
    </p>;
  }

  if (!selectedOfficeId) {
    return <p className="text-center text-neutral-600 mt-10">Loading office...</p>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 px-6 pt-5">
        <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">
          {selectedOffice?.name}
        </h1>

        {staffOffices.length > 1 && (
          <select
            value={selectedOfficeId || ""}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:border-neutral-400 transition"
          >
            {staffOffices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
        <StatCard title="Students Waiting" value={waitingTokens.length} color="text-yellow-500" />
        <StatCard title="Being Served" value={inProgressToken ? 1 : 0} color="text-blue-500" />
        <StatCard title="Completed Today" value={completedCount} color="text-green-600" />
      </div>

      {/* LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 pb-6 flex-1 overflow-hidden">

        {/* WAITING LIST */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-3xl border border-neutral-200 p-6 flex flex-col overflow-hidden">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Waiting List</h3>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {waitingTokens.length > 0 ? (
              waitingTokens.map((token, index) => (
                <TokenCard
                  key={token.id}
                  token={token}
                  position={index + 1}
                  isServing={false}
                />
              ))
            ) : (
              <p className="text-center text-neutral-500 py-10">
                No students are currently waiting.
              </p>
            )}
          </div>
        </div>

        {/* CURRENT SERVING */}
        <div className="bg-white shadow-lg rounded-3xl border border-neutral-200 p-6 flex flex-col h-full">
          
          {!inProgressToken ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
              <p className="text-neutral-600 mb-3">
                No one is being served.
              </p>

              {waitingTokens.length > 0 && (
                <p className="text-blue-600 font-medium mb-4">
                  Waiting for student to scan the QR…
                </p>
              )}

              {errorMessage && (
                <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <CurrentServiceCard token={inProgressToken} isLoading={actionLoading} />

              <button
                onClick={handleCallNext}
                disabled={actionLoading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-indigo-700 transition disabled:bg-neutral-300"
              >
                {actionLoading ? "Completing..." : "Complete & Move to Next"}
              </button>

              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
