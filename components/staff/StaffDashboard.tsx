import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { Token, TokenStatus, Priority, Role } from "../../types";

/* ============================================================
   REUSABLE COMPONENTS
============================================================ */

const StatCard: React.FC<{ title: string; value: number | string; color: string; mobile?: boolean }> =
({ title, value, color, mobile = true }) => (
  <div
    className={`
      flex flex-col items-center justify-center
      rounded-2xl
      bg-gradient-to-br ${color}
      flex-1
      h-20 md:h-24
      min-w-[110px] md:min-w-[180px]
      border border-gray-100 shadow-sm
      ${mobile ? "flex" : "hidden md:flex"}
    `}
  >
    <p className="text-[9px] md:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
      {title}
    </p>
    <p className="text-2xl md:text-3xl font-extrabold text-[#0A0F1C] mt-1">
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

const CurrentServiceCard: React.FC<{ token: Token }> =
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
   MAIN STAFF DASHBOARD
============================================================ */

const StaffDashboard: React.FC = () => {
  const { currentUser, offices, tokens, callNextToken, completeToken, setupOffice } = useAppContext();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingCabin, setOnboardingCabin] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    // If user is a STAFF and has no offices assigned, show onboarding
    if (currentUser?.role === Role.STAFF && (!currentUser.assignedOfficeIds || currentUser.assignedOfficeIds.length === 0)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [currentUser]);

  const handleSetupOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName || !onboardingCabin) {
      setSetupError("Both fields are required");
      return;
    }
    setIsSettingUp(true);
    setSetupError("");
    const res = await setupOffice(onboardingName, onboardingCabin);
    setIsSettingUp(false);
    if (!res.success) {
      setSetupError(res.message);
    } else {
      setShowOnboarding(false);
    }
  };

  const staffOffices = useMemo(
    () =>
      offices.filter(
        (o) =>
          currentUser?.assignedOfficeIds?.includes(o.id) ||
          currentUser?.role === Role.ADMIN
      ),
    [offices, currentUser]
  );

  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOfficeId && staffOffices.length > 0 && currentUser?.role !== Role.ADMIN) {
      setSelectedOfficeId(staffOffices[0].id);
    }
  }, [staffOffices, selectedOfficeId, currentUser]);

  const officeTokens = useMemo(
    () => tokens.filter((t) => t.officeId === selectedOfficeId),
    [tokens, selectedOfficeId]
  );

  const waitingTokens = officeTokens
    .filter((t) => t.status === TokenStatus.WAITING)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const inProgressToken = officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS);
  const completedCount = officeTokens.filter((t) => t.status === TokenStatus.COMPLETED).length;

  /* BUTTON STATES */
  const [buttonState, setButtonState] = useState<"idle" | "calling" | "arrived">("idle");
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);

  /* ----------------------------------------------------
        BUTTON LOGIC  
     ---------------------------------------------------- */

  const handleCallNext = async () => {
    if (buttonState === "calling") return;

    // If someone is being served → COMPLETE THEM
    if (inProgressToken) {
      setButtonState("calling");
      await completeToken(inProgressToken.id);
      setTimeout(() => setButtonState("idle"), 400);
      return;
    }

    // If no one waiting → do nothing
    if (!waitingTokens.length) return;

    const next = waitingTokens[0];
    setLastCalledId(next.id);

    setButtonState("calling");

    try {
      await callNextToken(selectedOfficeId!);
    } catch (e) {
      console.error(e);
    }
  };

  /* ----------------------------------------------------
        DETECT ARRIVAL AFTER QR SCAN
     ---------------------------------------------------- */
  useEffect(() => {
    if (!inProgressToken) return;

    if (inProgressToken.id === lastCalledId) {
      setButtonState("arrived");

      const timer = setTimeout(() => {
        setButtonState("idle");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [inProgressToken, lastCalledId]);

  /* ============================================================
         RETURN (MOBILE + DESKTOP)
  ============================================================ */

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">

      {/* --------------------------------------------------------
         🚀 STAFF ONBOARDING MODAL
      -------------------------------------------------------- */}
      {showOnboarding && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 sm:p-10 max-w-lg w-full animate-fade-in relative overflow-hidden">
            
            {/* Decorative background gradients */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-4xl text-white drop-shadow-md">🏫</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configure Your Office</h2>
              <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed max-w-xs mx-auto">
                Welcome! Let's set up your consulting cabin so students can join your queue.
              </p>
            </div>
            
            <form onSubmit={handleSetupOffice} className="relative z-10 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Office / Display Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors">🏢</span>
                  </div>
                  <input 
                    type="text" 
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                    placeholder="e.g. Prof. Jenkins Consulting"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cabin Number (Prefix)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 group-focus-within:text-indigo-500 transition-colors">🚪</span>
                  </div>
                  <input 
                    type="text" 
                    value={onboardingCabin}
                    onChange={(e) => setOnboardingCabin(e.target.value)}
                    placeholder="e.g. C304"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal shadow-sm uppercase"
                  />
                </div>
              </div>

              {setupError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2 animate-fade-in">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-sm text-red-600 font-semibold">{setupError}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSettingUp || !onboardingName.trim() || !onboardingCabin.trim()}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 transform active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  {isSettingUp ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup ✨"
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------
         📱 MOBILE VIEW
      -------------------------------------------------------- */}
      <div className="block md:hidden relative pb-24">

        {/* MOBILE STATS & SELECTOR */}
        <div className="bg-[#F6F7FB] pt-4 pb-4 px-4 shadow-sm">
          {(staffOffices.length > 1 || currentUser?.role === Role.ADMIN) && (
            <div className="mb-4">
              <select
                value={selectedOfficeId || ""}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-neutral-300 rounded-lg bg-white"
              >
                <option value="" disabled>Select Office...</option>
                {staffOffices.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
          {selectedOfficeId && (
            <div className="w-full flex justify-center">
              <div className="w-full max-w-md flex justify-between gap-4">
                <StatCard title="Students Waiting" value={waitingTokens.length} color="from-yellow-50 to-yellow-100" />
                <StatCard title="Completed Today" value={completedCount} color="from-green-50 to-green-100" />
              </div>
            </div>
          )}
        </div>

        {/* WAITING LIST */}
        <div className="px-4 py-6 space-y-4">
          {!selectedOfficeId ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
              <p className="text-neutral-500 font-medium">Please select an office above to view its queue.</p>
            </div>
          ) : waitingTokens.length > 0 ? (
            waitingTokens.map((token, index) => (
              <TokenCard key={token.id} token={token} position={index + 1} />
            ))
          ) : (
            <p className="text-center text-neutral-500 pt-4">No students are currently waiting.</p>
          )}
        </div>

        {/* FLOATING BUTTON */}
        <button
          onClick={handleCallNext}
          disabled={buttonState === "calling"}
          className="
            fixed bottom-24 left-1/2 -translate-x-1/2
            w-[90%] max-w-md
            bg-secondary text-primary-dark font-bold
            py-3 rounded-2xl shadow-xl
            transition-all duration-300
            disabled:bg-neutral-300
          "
        >
          {selectedOfficeId && buttonState === "idle" && (inProgressToken ? "Complete" : "Call Next Student")}
          {selectedOfficeId && buttonState === "calling" && "Calling..."}
          {selectedOfficeId && buttonState === "arrived" && "Arrived"}
          {!selectedOfficeId && "Select Office"}
        </button>
      </div>

      {/* --------------------------------------------------------
         💻 DESKTOP VIEW (keep layout exactly same)
      -------------------------------------------------------- */}
      <div className="hidden md:block h-full overflow-hidden">

        {/* HEADER REMOVED */}

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

          {/* WAITING LIST */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Waiting List</h3>
              
              {(staffOffices.length > 1 || currentUser?.role === Role.ADMIN) && (
                <select
                  value={selectedOfficeId || ""}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white shadow-sm font-medium text-neutral-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" disabled>Select Office View...</option>
                  {staffOffices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto pr-2">
              {!selectedOfficeId ? (
                <p className="text-center text-neutral-500 pt-10 font-medium">Please select an office to view the queue.</p>
              ) : waitingTokens.length > 0 ? (
                waitingTokens.map((token, index) => (
                  <TokenCard key={token.id} token={token} position={index + 1} />
                ))
              ) : (
                <p className="text-center text-neutral-500 pt-10">No students are currently waiting.</p>
              )}
            </div>
          </div>

          {/* CURRENT SERVING */}
          <div className="bg-white p-6 rounded-2xl shadow-xl h-full flex flex-col">
            {!inProgressToken ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-neutral-600 mb-4">No one is currently being served.</p>

                {/* SAME BUTTON POSITION AS YOUR CURRENT UI */}
                <button
                  onClick={handleCallNext}
                  disabled={buttonState === "calling"}
                  className="w-full bg-secondary text-primary-dark py-3 rounded-lg font-bold disabled:bg-neutral-300 transition-all"
                >
                  {buttonState === "idle" && "Call Next Student"}
                  {buttonState === "calling" && "Calling..."}
                  {buttonState === "arrived" && "Arrived"}
                </button>
              </div>
            ) : (
              <>
                <CurrentServiceCard token={inProgressToken} />

                {/* BUTTON UNDER CURRENT-SERVING CARD */}
                <button
                  onClick={handleCallNext}
                  disabled={buttonState === "calling"}
                  className="w-full bg-secondary text-primary-dark py-3 rounded-lg font-bold mt-6 disabled:bg-neutral-300 transition-all"
                >
                  {buttonState === "idle" && "Complete"}
                  {buttonState === "calling" && "Calling..."}
                  {buttonState === "arrived" && "Arrived"}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
