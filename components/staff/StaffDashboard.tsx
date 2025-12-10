import React, { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { TokenStatus, Priority } from "../../types";

import StatCard from "./StatCard";
import TokenCard from "./TokenCard";
import CurrentServiceCard from "./CurrentServiceCard";

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

  const [callError, setCallError] = useState("");
  const [calling, setCalling] = useState(false);
  const previousInProgressRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!selectedOfficeId && staffOffices.length > 0) {
      setSelectedOfficeId(staffOffices[0].id);
    }
  }, [staffOffices, selectedOfficeId]);

  const officeTokens = useMemo(
    () => tokens.filter((t) => t.officeId === selectedOfficeId),
    [tokens, selectedOfficeId]
  );

  const waitingTokens = useMemo(
    () =>
      officeTokens
        .filter((t) => t.status === TokenStatus.WAITING)
        .sort((a, b) => {
          if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT)
            return -1;
          if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT)
            return 1;

          if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL)
            return -1;
          if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL)
            return 1;

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

  React.useEffect(() => {
    if (calling && inProgressToken?.id !== previousInProgressRef.current) {
      setCalling(false);
    }
  }, [inProgressToken, calling]);

  const handleCallNext = async () => {
    if (!selectedOfficeId || calling) return;

    setCallError("");
    setCalling(true);

    const current = inProgressToken;
    previousInProgressRef.current = current?.id || null;

    try {
      await callNextToken(selectedOfficeId);
    } catch (err: any) {
      setCallError(err.message || "Failed to call next student");
      setCalling(false);
    }
  };

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  if (staffOffices.length === 0) {
    return (
      <p className="text-center text-neutral-600 mt-10">
        You are not assigned to any active offices.
      </p>
    );
  }

  if (!selectedOfficeId) {
    return (
      <p className="text-center text-neutral-600 mt-10">Loading office...</p>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 px-6 pt-5">
        <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">
          {selectedOffice?.name || "Loading..."}
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
        <StatCard title="Currently Serving" value={inProgressToken ? 1 : 0} color="text-blue-500" />
        <StatCard title="Completed Today" value={completedCount} color="text-green-600" />
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 pb-6 flex-1 overflow-hidden">

        {/* WAITING LIST */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-3xl border border-neutral-200 p-6 flex flex-col overflow-hidden">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">
            Waiting List
          </h3>

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

        {/* CURRENT SERVING PANEL */}
        <div className="bg-white shadow-lg rounded-3xl border border-neutral-200 p-6 flex flex-col h-full">
          {!inProgressToken ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
              <p className="text-neutral-600 mb-4">No one is currently being served.</p>

              {callError && (
                <p className="text-red-500 text-sm mb-4">{callError}</p>
              )}

              <button
                onClick={handleCallNext}
                disabled={waitingTokens.length === 0 || calling}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-indigo-700 transition disabled:bg-neutral-300"
              >
                {calling ? "Calling..." : "Call Next Student"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <CurrentServiceCard token={inProgressToken} isLoading={calling} />

              {waitingTokens.length === 0 ? (
                <button
                  onClick={async () => {
                    setCalling(true);
                    await completeToken(inProgressToken.id);
                    setCalling(false);
                  }}
                  className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-green-700 transition"
                >
                  {calling ? "Completing..." : "Mark Completed"}
                </button>
              ) : (
                <button
                  onClick={handleCallNext}
                  disabled={calling}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-indigo-700 transition disabled:bg-neutral-300"
                >
                  {calling ? "Calling..." : "Call Next Student"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
