// ===================== SOUND ENGINE (GLOBAL, LIGHTWEIGHT) =====================

let globalAudioContext: AudioContext | null = null;

const ensureAudioReady = () => {
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  if (!globalAudioContext) globalAudioContext = new AudioContextClass();
  if (globalAudioContext.state === "suspended") globalAudioContext.resume();
};

import { useEffect } from "react";

export const useAudioUnlock = () => {
  useEffect(() => {
    const unlock = () => {
      ensureAudioReady();
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);
};

export const playSfx = (type: "click" | "whoosh") => {
  try {
    ensureAudioReady();
    const ctx = globalAudioContext;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.4);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {}
};
