import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Token } from "../../types";

declare const jsQR: any;

const ScannerModal: React.FC<{
  token: Token;
  studentId: string;
  onClose: () => void;
  onScanSuccess: (tokenId: string) => void;
}> = ({ token, onClose, onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const processing = useRef(false);

  const [cameraState, setCameraState] = useState<
    "idle" | "requesting" | "active" | "error"
  >("idle");
  const [error, setError] = useState("");

  /* ----------------- STOP CAMERA ----------------- */
  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /* ----------------- CLOSE MODAL ----------------- */
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  /* ----------------- SCAN LOOP ----------------- */
  const tick = useCallback(() => {
    if (processing.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx?.getImageData(0, 0, canvas.width, canvas.height);

      if (img) {
        const code = jsQR(img.data, img.width, img.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          try {
            const parsed = JSON.parse(code.data);

            if (
              parsed.type === "office-checkin" &&
              parsed.officeId === token.officeId
            ) {
              processing.current = true;
              onScanSuccess(token.id);
              stopCamera();
              onClose();
              return;
            }
          } catch {}
        }
      }
    }

    frameRef.current = requestAnimationFrame(tick);
  }, [token.id, token.officeId, onScanSuccess, onClose, stopCamera]);

  /* ----------------- ATTACH VIDEO STREAM ----------------- */
  useEffect(() => {
    if (cameraState !== "active") return;
    if (!streamRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    // Chrome/iOS FIX → slight delay before attaching stream
    setTimeout(() => {
      video.srcObject = streamRef.current!;
      video.onloadedmetadata = () => video.play().catch(() => {});
    }, 150);

    frameRef.current = requestAnimationFrame(tick);
  }, [cameraState, tick]);

  /* ----------------- ACTIVATE CAMERA ----------------- */
  const activateCamera = async () => {
    try {
      setCameraState("requesting");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraState("active");
      setError("");
    } catch (err: any) {
      console.error("MOBILE CAMERA ERROR:", err);
      setError("Unable to access your camera. Please allow permission.");
      setCameraState("error");
    }
  };

  /* ----------------- CLEANUP ON UNMOUNT ----------------- */
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  /* ----------------- PORTAL MOUNT CHECK ----------------- */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#0A0A0A] z-[9999] flex flex-col overscroll-none touch-none">
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(256px); opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-5 pt-8 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleClose}
          className="text-white p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-white font-semibold text-lg tracking-wide shadow-black drop-shadow-md">
          Scan QR Code
        </h2>
        <div className="w-10"></div> {/* spacer for centering */}
      </div>

      {/* Camera Area */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {cameraState === "active" ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Immersive Overlay with Cutout */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <mask id="cutout">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x="50%"
                      y="50%"
                      width="260"
                      height="260"
                      fill="black"
                      transform="translate(-130, -130)"
                      rx="24"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#cutout)" />
              </svg>

              {/* Scanning Box Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px]">
                {/* 4 Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-[#3B82F6] rounded-tl-3xl opacity-90" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-[#3B82F6] rounded-tr-3xl opacity-90" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-[#3B82F6] rounded-bl-3xl opacity-90" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-[#3B82F6] rounded-br-3xl opacity-90" />

                {/* Animated Laser Line */}
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-[#3B82F6] shadow-[0_0_12px_3px_rgba(59,130,246,0.8)] animate-scan-line rounded-full" />
              </div>
            </div>
          </>
        ) : (
          <div className="z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-white/80 mb-8 text-center px-8 font-medium text-lg leading-relaxed">
              Camera access is required<br/>to scan QR codes.
            </p>
            <button
              onClick={activateCamera}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-full flex items-center gap-3 shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              Enable Camera
            </button>
          </div>
        )}
      </div>

      {/* Footer Area */}
      <div className="bg-[#0A0A0A] relative z-10 text-center p-8 pb-12">
        <p className="text-white/60 font-medium tracking-wide">
          {cameraState === "active" ? "Align the QR code within the frame" : ""}
        </p>
        {error && (
          <p className="text-red-400 mt-3 font-medium bg-red-500/10 py-2 px-4 rounded-lg inline-block">
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ScannerModal;
