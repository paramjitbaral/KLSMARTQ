import React, { useState, useEffect } from "react";
import Ticket from "./Ticket";
import { playSfx, useAudioUnlock } from "./soundEngine";

const HolographicDeck = ({ onComplete }: { onComplete: () => void }) => {
  useAudioUnlock();

  const [phase, setPhase] = useState(0);
  const [tickets, setTickets] = useState<any[]>([]);

  /* ---------------------------------------------------------
        INIT 9 CARDS (cinematic layout, reduced lag)
  ---------------------------------------------------------- */
  useEffect(() => {
  const isMobile = window.innerWidth < 768; // mobile breakpoint
  const count = isMobile ? 6 : 9; // 6 cards on mobile, 9 on desktop

  const arr = Array.from({ length: count }).map((_, i) => ({
    id: i,
    initialPos: {
      x: (Math.random() - 0.5) * window.innerWidth * 0.45,
      y: (Math.random() - 0.5) * window.innerHeight * 0.45,
      z: (Math.random() - 0.5) * 500,
      rX: (Math.random() - 0.5) * 180,
      rY: (Math.random() - 0.5) * 180,
      rZ: (Math.random() - 0.5) * 180,
    },
  }));

  setTickets(arr);
}, []);


  /* ---------------------------------------------------------
        TEXT CONTENT
  ---------------------------------------------------------- */
  const content = [
    {
      kicker: "THE PROBLEM",
      title: "The Rush.",
      desc: "Crowds are unpredictable. Time is wasted in chaos.",
      button: "Systemise Queue",
      accent: "text-rose-400",
    },
    {
      kicker: "THE SOLUTION",
      title: "The Logic.",
      desc: "Smart booking arranges everyone before they arrive.",
      button: "Start Processing",
      accent: "text-blue-400",
    },
    {
      kicker: "THE RESULT",
      title: "The Speed.",
      desc: "Scan. Verify. Complete. Zero friction entry.",
      button: "Access Portal",
      accent: "text-emerald-400",
    },
  ];

  /* ---------------------------------------------------------
        AUTOPLAY (Desktop Only + Slow Cinematic Timing)
  ---------------------------------------------------------- */
  useEffect(() => {
    if (window.innerWidth < 1024) return; // Only desktops

    const interval = setInterval(() => {
      playSfx("click");
      setTimeout(() => playSfx("whoosh"), 120);

      setPhase((prev) => (prev + 1) % 3);
    }, 5500); // Slow cinematic cycle

    return () => clearInterval(interval);
  }, []);

  /* ---------------------------------------------------------
        MANUAL NAVIGATION
  ---------------------------------------------------------- */
  const handleNext = () => {
    playSfx("click");
    setTimeout(() => playSfx("whoosh"), 120);

    if (phase < 2) setPhase(phase + 1);
    else onComplete(); // Only manual click closes
  };

  /* ---------------------------------------------------------
        RENDER UI
  ---------------------------------------------------------- */
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col text-white select-none">

      {/* BACKGROUND WORD */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <h1
            className={`
            font-bold leading-none tracking-tight
            transition-all duration-[1600ms]
            text-[40vw] md:text-[20vw]
       `}
  style={{
    transform: phase === 1 ? "scale(0.88)" : "scale(1)",
  }}
>

          {phase === 0 ? "CHAOS" : phase === 1 ? "ORDER" : "FLOW"}
        </h1>
      </div>

      {/* 3D SCENE */}
      <div
        className="flex-1 relative flex items-center justify-center z-10"
        style={{
          perspective: "1400px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* LASER LINE */}
        <div
          className={`
            absolute top-0 left-1/2 w-1 bg-emerald-500/50
            shadow-[0_0_50px_3px_rgba(16,185,129,0.6)]
            transition-all duration-500 z-0
            ${phase === 2 ? "opacity-100 animate-pulse" : "opacity-0"}
          `}
          style={{
            transform: "translateX(-50%) rotate(-45deg)",
            height: "160vh",
            top: "-25vh",
          }}
        />

        {/* CARDS */}
        {tickets.map((t, i) => (
          <Ticket
            key={i}
            {...t}
            phase={phase}
            index={i}
            total={tickets.length}
          />
        ))}
      </div>

      {/* TEXT + BUTTON */}
      <div className="relative z-20 w-full p-8 md:p-12 flex flex-col gap-6 pb-16 md:pb-12 items-center md:items-start">
        <div className="text-center md:text-left">
          <div
            className={`
              text-xs font-mono tracking-[0.3em] mb-2
              transition-colors duration-500
              ${content[phase].accent}
            `}
          >
            0{phase + 1} // {content[phase].kicker}
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {content[phase].title}
          </h2>

          <p className="text-slate-400 text-sm md:text-base max-w-sm">
            {content[phase].desc}
          </p>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleNext}
          className="
            group relative w-full md:w-auto px-8 h-14
            bg-white text-slate-900 font-bold rounded-lg
            overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97]
          "
        >
          <span className="relative z-10">{content[phase].button}</span>

          {/* hover sweep */}
          <div className="
            absolute inset-0 bg-emerald-500/15 
            scale-x-0 group-hover:scale-x-100
            origin-left transition-transform duration-300
          " />
        </button>

        {/* PROGRESS BARS */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`
                h-1 rounded-full transition-all duration-700
                ${phase === i ? "w-10 bg-white" : "w-3 bg-white/20"}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HolographicDeck;
