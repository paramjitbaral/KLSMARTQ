import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Office, Token, TokenStatus, Priority } from '../../types';

const SkeletonLoader = () => (
    <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
    </div>
);

const StatCard: React.FC<{ title: string; value: number | string; color: string }> = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-200">
    <p className="text-sm font-medium text-neutral-500">{title}</p>
    <p className={`text-4xl font-bold ${color}`}>{value}</p>
  </div>
);

const TokenCard: React.FC<{ token: Token; position: number; isServing?: boolean }> = ({ token, position, isServing }) => {
    const priorityClasses = {
        [Priority.NORMAL]: 'border-l-gray-400',
        [Priority.URGENT]: 'border-l-red-500',
        [Priority.MEDICAL]: 'border-l-blue-500'
    };

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${priorityClasses[token.priority]} border-l-4 flex justify-between items-center ${isServing ? 'bg-green-50 ring-1 ring-green-200' : ''}`}>
            <div className="flex items-center space-x-4">
                <span className="text-xl font-bold text-primary-dark w-8 text-center">{position}</span>
                <div>
                    <p className="font-semibold text-neutral-900">{token.student?.name || 'Unknown Student'}</p>
                    <p className="text-sm text-neutral-600">{token.purpose}</p>
                    <p className="text-xs text-neutral-500 mt-1">Token: {token.tokenNumber}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">{token.priority}</span>
                {isServing && <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-sm">SERVING</span>}
            </div>
        </div>
    );
};

const CurrentServiceCard: React.FC<{ token: Token; isLoading?: boolean }> = ({ token, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-primary-dark to-primary-light text-white p-7 rounded-2xl shadow-2xl w-full">
                <div className="space-y-3">
                    <div className="h-4 bg-white/30 rounded animate-pulse w-24"></div>
                    <div className="h-10 bg-white/30 rounded animate-pulse"></div>
                    <div className="h-4 bg-white/30 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-white/20 rounded animate-pulse w-28"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white shadow-2xl w-full p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.1),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(255,255,255,0.06),transparent_28%)]"></div>
            <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-4xl font-black leading-tight drop-shadow-sm">{token.tokenNumber}</h3>
                        <p className="text-lg font-semibold leading-snug">{token.student?.name || 'Unknown Student'}</p>
                        <div className="text-sm text-white/80 leading-snug max-h-16 overflow-y-auto pr-1">
                            {token.purpose}
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-white/18 border border-white/25 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm shadow-inner whitespace-nowrap">
                        In Progress
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-white/85">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/12 border border-white/20 font-semibold shadow-sm">
                        Priority: {token.priority}
                    </span>
                    {token.calledAt && (
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/18 shadow-sm">
                            Started: {token.calledAt.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ===================================================================================
// STAFF DASHBOARD MAIN COMPONENT
// ===================================================================================

const StaffDashboard: React.FC = () => {
    const { currentUser, offices, tokens, callNextToken, completeToken } = useAppContext();

    const staffOffices = useMemo(
        () =>
            offices.filter(
                (o) =>
                    currentUser?.assignedOfficeIds?.includes(o.id) ||
                    currentUser?.role === 'Admin'
            ),
        [offices, currentUser]
    );

    const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(
        staffOffices[0]?.id || null
    );
    const [callError, setCallError] = useState('');
    const [calling, setCalling] = useState(false);
    const previousInProgressRef = React.useRef<string | null>(null);

    // Auto-select first office on load
    React.useEffect(() => {
        if (!selectedOfficeId && staffOffices.length > 0) {
            setSelectedOfficeId(staffOffices[0].id);
        }
    }, [staffOffices, selectedOfficeId]);

    // Calculate office tokens
    const officeTokens = useMemo(
        () => tokens.filter((t) => t.officeId === selectedOfficeId),
        [tokens, selectedOfficeId]
    );

    // FIXED WAITING LIST — ONLY WAITING STUDENTS
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

    // CURRENT SERVING TOKEN
    const inProgressToken = useMemo(
        () => officeTokens.find((t) => t.status === TokenStatus.IN_PROGRESS),
        [officeTokens]
    );

    const completedCount = useMemo(
        () => officeTokens.filter((t) => t.status === TokenStatus.COMPLETED).length,
        [officeTokens]
    );

    // Fix calling state when token actually changes
    React.useEffect(() => {
        if (calling && inProgressToken?.id !== previousInProgressRef.current) {
            setCalling(false);
        }
    }, [inProgressToken, calling]);

    const handleCallNext = async () => {
        if (!selectedOfficeId || calling) return;

        setCallError('');
        setCalling(true);

        const current = inProgressToken;
        previousInProgressRef.current = current?.id || null;

        try {
            await callNextToken(selectedOfficeId);
        } catch (err: any) {
            setCallError(err.message || 'Failed to call next student');
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
        return <p className="text-center text-neutral-600 mt-10">Loading office...</p>;
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0 mb-6 px-6 pt-2">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">
                    {selectedOffice?.name || 'Loading...'}
                </h1>

                {staffOffices.length > 1 && (
                    <select
                        value={selectedOfficeId || ''}
                        onChange={(e) => setSelectedOfficeId(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 shadow-sm"
                    >
                        {staffOffices.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
                <StatCard title="Students Waiting" value={waitingTokens.length} color="text-yellow-500" />
                <StatCard title="Currently Serving" value={inProgressToken ? 1 : 0} color="text-blue-500" />
                <StatCard title="Completed Today" value={completedCount} color="text-green-500" />
            </div>

            {/* MAIN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 pb-6 flex-1 overflow-hidden">

                {/* WAITING LIST */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl border border-neutral-100 flex flex-col overflow-hidden">
                    <h3 className="text-xl font-bold text-neutral-800 mb-4">Waiting List</h3>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
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
                            <p className="text-center text-neutral-500 pt-10">
                                No students are currently waiting.
                            </p>
                        )}
                    </div>
                </div>

                {/* CURRENT SERVING */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-neutral-100 flex flex-col h-full">

                    {!inProgressToken ? (
                        /* NO CURRENT STUDENT */
                        <div className="flex flex-col items-center justify-center h-full w-full">
                            <p className="text-neutral-600 mb-4 text-center">
                                No one is currently being served.
                            </p>

                            {callError && (
                                <p className="text-red-500 text-sm mb-4 text-center">{callError}</p>
                            )}

                            <button
                                onClick={handleCallNext}
                                disabled={waitingTokens.length === 0 || calling}
                                className="w-full bg-secondary text-primary-dark font-bold py-3 rounded-lg hover:bg-secondary-dark disabled:bg-neutral-300"
                            >
                                {calling ? 'Calling...' : 'Call Next Student'}
                            </button>
                        </div>
                    ) : (
                        /* SERVING SOMEONE */
                        <div className="flex flex-col items-stretch w-full gap-5">
                            <CurrentServiceCard token={inProgressToken} isLoading={calling} />

                            {/* IF NO ONE WAITING → SHOW COMPLETE BUTTON */}
                            {waitingTokens.length === 0 ? (
                                <button
                                    onClick={async () => {
                                        setCalling(true);
                                        await completeToken(inProgressToken.id);
                                        setCalling(false);
                                    }}
                                    className="w-full bg-secondary text-primary-dark font-bold py-3 rounded-lg"
                                >
                                    {calling ? 'Completing...' : 'Mark Completed'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleCallNext}
                                    disabled={calling}
                                    className="w-full bg-secondary text-primary-dark font-bold py-3 rounded-lg"
                                >
                                    {calling ? 'Calling...' : 'Call Next Student'}
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
