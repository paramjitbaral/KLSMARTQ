import React, { useState, useEffect } from "react";
import Ticket from "./Ticket";


const HolographicDeck = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [tickets, setTickets] = useState<any[]>([]);

  /* ---------------------------------------------------------
        INIT 9 CARDS (cinematic layout, reduced lag)
  ---------------------------------------------------------- */
  const generateRandomPos = () => ({
    x: (Math.random() - 0.5) * window.innerWidth * 0.5,
    y: (Math.random() - 0.5) * window.innerHeight * 0.5,
    z: (Math.random() - 0.5) * 500,
    rX: (Math.random() - 0.5) * 60,
    rY: (Math.random() - 0.5) * 60,
    rZ: (Math.random() - 0.5) * 180,
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 768; // mobile breakpoint
    const count = isMobile ? 6 : 9; // 6 cards on mobile, 9 on desktop

    const arr = Array.from({ length: count }).map((_, i) => ({
      id: i,
      initialPos: generateRandomPos(),
    }));

    setTickets(arr);
  }, []);

  // Reshuffle tickets every time we enter phase 0
  useEffect(() => {
    if (phase === 0) {
      setTickets((prev) => prev.map((ticket) => ({
        ...ticket,
        initialPos: generateRandomPos()
      })));
    }
  }, [phase]);


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
      setPhase((prev) => (prev + 1) % 3);
    }, 5500); // Slow cinematic cycle

    return () => clearInterval(interval);
  }, []);

  /* ---------------------------------------------------------
        MANUAL NAVIGATION
  ---------------------------------------------------------- */
  const handleNext = () => {
    if (phase < 2) setPhase(phase + 1);
    else onComplete(); // Only manual click closes
  };

  /* ---------------------------------------------------------
        RENDER UI
  ---------------------------------------------------------- */
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col text-white select-none bg-slate-950 bg-gradient-to-br from-slate-900 to-slate-950">

      {/* BACKGROUND IMAGE BLENDED INTO DARK THEME */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
        <img 
          src="/tech-flow-bg.png" 
          alt="Abstract Tech Flow Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-[0.35]" 
        />
      </div>

      {/* 3D SCENE */}
      <div
        className="flex-1 relative flex items-center justify-center z-10"
        style={{
          perspective: "1400px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* LASER LINE REMOVED */}

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

      {/* ATMOSPHERIC OVERLAYS FOR BLENDING */}
      <div className="absolute inset-0 pointer-events-none z-[15] bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      <div className="absolute inset-0 pointer-events-none z-[15] bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.8)_100%)]" />

      {/* TEXT + BUTTON */}
      <div className="relative z-20 w-full p-8 md:p-12 flex flex-col gap-6 pb-16 md:pb-12 items-center md:items-start">
        <div className="text-center md:text-left">
          {/* Removed kicker text */}

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
            bg-emerald-500 text-slate-950 font-bold rounded-xl
            overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
          "
        >
          <span className="relative z-10">{content[phase].button}</span>

          {/* hover sweep */}
          <div className="
            absolute inset-0 bg-white/20 
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
                ${phase === i ? "w-10 bg-emerald-500" : "w-3 bg-slate-700"}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HolographicDeck;
