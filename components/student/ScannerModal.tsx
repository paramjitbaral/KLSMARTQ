import React, { useState, useRef, useEffect, useCallback } from "react";
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
      const ctx = canvas.getContext("2d");
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
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      setCameraState("active");
      setError("");
    } catch (err: any) {
      setError("Camera error. Please allow permission and try again.");
      setCameraState("error");
    }
  };

  /* ----------------- CLEANUP ON UNMOUNT ----------------- */
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Scan QR Code</h2>
        <p className="text-neutral-600 text-center mb-4">
          Point your phone camera at the office QR code.
        </p>

        <div className="relative w-full aspect-square bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center">
          {cameraState === "active" ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          ) : (
            <button
              onClick={activateCamera}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg"
            >
              Activate Camera
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-center mt-3">{error}</p>}

        <button
          onClick={handleClose}
          className="w-full mt-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ScannerModal;
