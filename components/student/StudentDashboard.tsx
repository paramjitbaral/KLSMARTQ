
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Token, TokenStatus, Priority, User } from '../../types';
import { QrCodeIcon, TicketIcon, CheckCircleIcon } from '../common/Icons';

declare const jsQR: any;

const ScannerModal: React.FC<{
    token: Token;
    studentId: string;
    onClose: () => void;
    onScanSuccess: (tokenId: string) => void;
}> = ({ token, studentId, onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const isProcessingRef = useRef(false);
    const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
    const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'prompt' | 'denied'>('checking');
    const [error, setError] = useState('');
    const [scanFeedback, setScanFeedback] = useState('');

    useEffect(() => {
        const checkCameraPermission = async () => {
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    setPermissionState(permissionStatus.state);
                    permissionStatus.onchange = () => {
                        setPermissionState(permissionStatus.state);
                    };
                } catch (err) {
                    console.warn("Could not query camera permissions. Proceeding with default behavior.", err);
                    setPermissionState('prompt');
                }
            } else {
                 console.warn("Permissions API not supported. Proceeding with default behavior.");
                 setPermissionState('prompt');
            }
        };
        checkCameraPermission();
    }, []);

    const stopCamera = useCallback(() => {
        console.log("🛑 Stopping camera...");
        
        // Stop animation frame
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        
        // Stop all video tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                console.log("⏹️ Stopping track:", track.kind);
                track.stop();
            });
            streamRef.current = null;
        }
        
        // Clear video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.pause();
        }
        
        isProcessingRef.current = false;
        console.log("✅ Camera stopped completely");
    }, []);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);
    
    const tick = useCallback(() => {
        if (isProcessingRef.current) return; // Skip if already processing a scan
        
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code) {
                    try {
                        const parsedData = JSON.parse(code.data);
                        if (parsedData.type === 'office-checkin' && parsedData.officeId === token.officeId) {
                            isProcessingRef.current = true; // Prevent further scanning
                            setScanFeedback('✅ QR code matched! Processing your check-in...');
                            onScanSuccess(token.id);
                            setTimeout(() => {
                                stopCamera();
                                onClose();
                            }, 1500);
                            return;
                        } else {
                           setScanFeedback('❌ Invalid QR code for this office. Please try again.');
                           setTimeout(() => setScanFeedback(''), 2000);
                        }
                    } catch (e) {
                         setScanFeedback('❌ Could not read QR code. Please try again.');
                         setTimeout(() => setScanFeedback(''), 2000);
                    }
                }
            }
        }
        if (streamRef.current) {
            animationFrameId.current = requestAnimationFrame(tick);
        }
    }, [token.id, token.officeId, onScanSuccess, onClose, stopCamera]);

    useEffect(() => {
        if (cameraState === 'active') {
            animationFrameId.current = requestAnimationFrame(tick);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [cameraState, tick]);

    // Once state is active and we have a stream, attach it to the video element
    useEffect(() => {
        if (cameraState !== 'active') return;
        if (!streamRef.current) return;
        if (!videoRef.current) return;

        console.log("📺 Attaching stream to video element (effect)");
        const videoEl = videoRef.current;
        videoEl.srcObject = streamRef.current;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = true;

        // Try to play, but don't block if it fails
        videoEl.play().catch(err => {
            console.warn("Play warning (non-critical):", err);
        });
    }, [cameraState]);

    // Cleanup on unmount - CRITICAL for preventing "Device in use" error
    useEffect(() => {
        return () => {
            console.log("🧹 Cleaning up scanner modal on unmount");
            stopCamera();
        };
    }, [stopCamera]);

    const activateCamera = async () => {
        // Prevent multiple simultaneous requests
        if (streamRef.current) {
            console.warn("⚠️ Camera already active");
            return;
        }
        
        if (cameraState === 'requesting') {
            console.warn("⚠️ Camera request already in progress");
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Your browser does not support camera access. Please try a different browser.');
            setCameraState('error');
            return;
        }

        setCameraState('requesting');
        setError('');
        
        try {
            console.log("📹 Requesting camera access...");
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }
            });
            
            console.log("✅ Camera stream acquired, stream active tracks:", stream.getVideoTracks().length);
            streamRef.current = stream;

            // Immediately set active so the video element renders; attach stream in effect
            setCameraState('active');
        } catch (err) {
            console.error("❌ Error accessing camera:", err);
            stopCamera();
            
            if (err instanceof Error) {
                 if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera permission was denied. Please allow camera access in your browser settings to continue.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError('No camera found on this device. Please use a device with a camera.');
                } else if (err.message.includes('Device in use')) {
                    setError('Camera is already in use by another application. Please close other apps using the camera and try again.');
                } else if (err.message.includes('timeout')) {
                    setError('Camera request timed out. Please try again.');
                } else {
                    setError(`Error: ${err.message}`);
                }
            } else {
                setError('An unknown error occurred while accessing the camera.');
            }
            setCameraState('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="scanner-title">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative text-center" onClick={(e) => e.stopPropagation()}>
                <h2 id="scanner-title" className="text-2xl font-bold text-neutral-800 mb-2">🔍 Scan Office QR Code</h2>
                <p className="text-neutral-600 mb-4">Point your camera at the QR code posted outside the office to confirm your arrival and move to processing status.</p>

                <div className="relative w-full aspect-square bg-neutral-800 rounded-lg overflow-hidden flex justify-center items-center">
                    {cameraState === 'active' ? (
                        <>
                            <video 
                                ref={videoRef} 
                                className="w-full h-full object-cover" 
                                autoPlay
                                playsInline
                                muted
                                aria-label="Camera feed for QR code scanning" 
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute inset-0 border-8 border-white/30 rounded-lg animate-pulse"></div>
                            {scanFeedback && (
                                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-2 rounded-md text-sm" role="status">
                                    {scanFeedback}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-4 text-white flex flex-col items-center justify-center gap-3">
                            {cameraState === 'requesting' && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <p role="status" className="text-sm">Requesting camera access...</p>
                                </div>
                            )}
                            {(cameraState === 'idle' || cameraState === 'error') && permissionState !== 'denied' && (
                                <>
                                    <button onClick={activateCamera} disabled={cameraState === 'requesting'} className="bg-primary px-6 py-3 rounded-lg text-white font-semibold hover:bg-primary-light disabled:bg-neutral-500 transition-colors">
                                        📷 Activate Camera
                                    </button>
                                    {cameraState === 'error' && <p className="text-xs text-yellow-300">Try again</p>}
                                </>
                            )}
                            {error && <p className="text-red-300 text-sm" role="alert">{error}</p>}
                            {permissionState === 'denied' && (
                                <p className="text-red-300 text-sm" role="alert">Camera access is denied. You need to enable it in your browser settings to use this feature.</p>
                            )}
                        </div>
                    )}
                </div>

                <button onClick={handleClose} className="mt-6 w-full bg-neutral-200 text-neutral-800 font-bold py-3 px-6 rounded-lg hover:bg-neutral-300 transition-all">
                    Cancel
                </button>
            </div>
        </div>
    );
};


const ActiveTokenCard: React.FC<{ token: Token; onCheckIn: (token: Token) => void }> = ({ token, onCheckIn }) => {
    const { offices, tokens: allTokens } = useAppContext();
    const office = offices.find(o => o.id === token.officeId);
    
    const yourPosition = useMemo(() => {
        const sortedWaitingList = allTokens
            .filter(t => t.officeId === token.officeId && t.status === TokenStatus.WAITING)
            .sort((a, b) => {
                if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
                if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT) return 1;
                if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL) return -1;
                if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL) return 1;
                return a.createdAt.getTime() - b.createdAt.getTime();
            });
        return sortedWaitingList.findIndex(t => t.id === token.id) + 1;
    }, [allTokens, token]);


    const getStatusInfo = () => {
        switch (token.status) {
            case TokenStatus.WAITING:
                return {
                    text: 'Waiting in Queue',
                    color: 'bg-yellow-100 text-yellow-800',
                    positionText: yourPosition > 0 ? `You are number ${yourPosition} in the queue.` : 'Waiting for your turn.'
                };
            case TokenStatus.IN_PROGRESS:
                return { text: 'In Progress', color: 'bg-blue-100 text-blue-800', positionText: 'You are currently being served.' };
            default:
                return { text: token.status, color: 'bg-gray-100 text-gray-800', positionText: '' };
        }
    };
    
    const { text, color, positionText } = getStatusInfo();

    return (
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-neutral-500">{office?.name || 'Unknown Office'}</p>
                    <p className="text-3xl font-bold text-primary-dark my-1">{token.tokenNumber}</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>
                </div>
                {!token.isCheckedIn && token.status === TokenStatus.WAITING && (
                    <button onClick={() => onCheckIn(token)} className="flex items-center space-x-2 bg-primary-dark text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-colors">
                        <QrCodeIcon className="w-5 h-5" />
                        <span>Check In</span>
                    </button>
                )}
                 {token.isCheckedIn && (
                    <div className="flex items-center space-x-2 text-green-600 font-semibold">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Checked In</span>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-neutral-700 font-medium">Purpose: {token.purpose}</p>
                <p className="text-sm text-neutral-600 mt-2">{positionText}</p>
            </div>
        </div>
    );
};

const StudentDashboard: React.FC = () => {
    const { currentUser, tokens, scanOfficeQr, notifications, clearNotification } = useAppContext();
    const [tokenToCheckIn, setTokenToCheckIn] = useState<Token | null>(null);
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

    const activeTokens = useMemo(() => {
        return tokens
            .filter(t => t.studentId === currentUser?.id && (t.status === TokenStatus.WAITING || t.status === TokenStatus.IN_PROGRESS))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [currentUser, tokens]);
    
    const userNotifications = useMemo(() =>
        notifications.filter(n => n.userId === currentUser?.id),
    [notifications, currentUser]);

    const handleCheckInSuccess = async (tokenId: string) => {
        if (!currentUser) return;
        const token = tokens.find(t => t.id === tokenId);
        if (!token) return;
        
        try {
            await scanOfficeQr(currentUser.id, token.officeId);
        } catch (err: any) {
            console.error("Error during QR scan:", err);
            alert(err.message || "Error processing QR scan. Please try again.");
        }
        setTokenToCheckIn(null);
    };

    // Auto-dismiss from UI after 5 seconds, then auto-delete from DB after 2 minutes total
    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];
        
        userNotifications.forEach(notification => {
            if (!dismissedNotifications.has(notification.id)) {
                // Dismiss from UI after 5 seconds
                const dismissTimer = setTimeout(() => {
                    clearNotification(notification.id);
                    setDismissedNotifications(prev => new Set([...prev, notification.id]));
                }, 5000);
                timers.push(dismissTimer);
                
                // Auto-delete from database after 2 minutes (120 seconds)
                const deleteTimer = setTimeout(async () => {
                    try {
                        await clearNotification(notification.id);
                        console.log("✅ Notification auto-deleted from database after 2 minutes");
                    } catch (err) {
                        console.error("Error auto-deleting notification:", err);
                    }
                }, 120000);
                timers.push(deleteTimer);
            }
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [userNotifications, dismissedNotifications, clearNotification]);

    return (
        <div>
            {userNotifications.map(notification => (
                <div key={notification.id} className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm relative animate-in slide-in-from-top" role="alert">
                    <p className="font-bold">Heads up!</p>
                    <p>{notification.message}</p>
                    <button onClick={() => {
                        clearNotification(notification.id);
                        setDismissedNotifications(prev => new Set([...prev, notification.id]));
                    }} className="absolute top-2 right-2 p-1 text-lg leading-none hover:text-green-900" aria-label="Dismiss notification">&times;</button>
                </div>
            ))}
            <h1 className="text-3xl font-bold text-neutral-800 mb-6">My Dashboard</h1>

            {activeTokens.length > 0 ? (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-neutral-700">My Active Tokens</h2>
                    {activeTokens.map(token => (
                        <ActiveTokenCard key={token.id} token={token} onCheckIn={setTokenToCheckIn} />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-white p-10 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-2xl font-semibold text-neutral-700 mb-2">No Active Tokens</h2>
                    <p className="text-neutral-600 mb-6">You don't have any waiting or in-progress tokens right now.</p>
                    <Link to="/book-token" className="inline-flex items-center justify-center bg-primary-dark text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-light transition-transform duration-200 hover:scale-105">
                        <TicketIcon className="w-5 h-5 mr-2" />
                        Book a New Token
                    </Link>
                </div>
            )}
            
            {tokenToCheckIn && (
                <ScannerModal
                    token={tokenToCheckIn}
                    studentId={currentUser?.id || ''}
                    onClose={() => setTokenToCheckIn(null)}
                    onScanSuccess={handleCheckInSuccess}
                />
            )}
        </div>
    );
};

export default StudentDashboard;