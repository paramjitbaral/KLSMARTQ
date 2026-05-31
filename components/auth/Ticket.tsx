import React from "react";

export interface TicketProps {
  id: number;
  initialPos: { x: number; y: number; z: number; rX: number; rY: number; rZ: number };
  phase: number;
  index: number;
  total: number;
}

const Ticket = ({ id, initialPos, phase, index, total }: TicketProps) => {
  const getTransform = () => {
    if (phase === 0) {
      return `
        translate3d(${initialPos.x}px, ${initialPos.y}px, ${initialPos.z}px)
        rotateX(${initialPos.rX}deg)
        rotateY(${initialPos.rY}deg)
        rotateZ(${initialPos.rZ}deg)
      `;
    }

    if (phase === 1) {
      const yOffset = (index - total / 2) * 6;
      const zOffset = (index - total / 2) * -60;

      return `
        translate3d(0px, ${yOffset}px, ${zOffset}px)
        rotateX(55deg)
        rotateZ(-40deg)
      `;
    }

    // Phase 2: Flow (Completed)
    if (index === total - 1) {
      // The hero card stays and straightens out
      return `
        translate3d(0px, 0px, 150px)
        rotateX(0deg)
        rotateZ(0deg)
        scale(1.2)
      `;
    }

    // The other cards fly away
    return `
      translate3d(200vw, 0px, 0px)
      rotateX(55deg)
      rotateZ(-40deg)
    `;
  };

  const isHiddenInPhase0 = phase === 0 && index < total - 5;
  const isHiddenInPhase2 = phase === 2 && index !== total - 1;
  const finalOpacity = isHiddenInPhase0 || isHiddenInPhase2 ? 0 : 1;

  return (
    <div
      className={`
        absolute top-1/2 left-1/2
        w-64 h-40 md:w-72 md:h-44
        rounded-2xl flex flex-col justify-between p-6
        transition-all duration-[1300ms] ease-out
        bg-slate-800 border border-slate-700/80
        ${index === total - 1 ? "shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]" : "shadow-sm"}
      `}
      style={{
        transform: getTransform(),
        marginLeft: "-9rem",
        marginTop: "-3rem",
        opacity: finalOpacity,
        transitionDelay: `${index * 80}ms`,
         transitionDuration:
            window.innerWidth < 768
            ? (phase === 1 ? "450ms" : "900ms") // 📱 Mobile fast
            : (phase === 1 ? "700ms" : "1500ms"), // 💻 Desktop cinematic
      }}
    >
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-600">
            {String.fromCharCode(65 + (id % 26))}
          </div>
          <div className="h-1.5 w-8 bg-slate-700 rounded-full"></div>
        </div>
        <div className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          Verified
        </div>
      </div>

      {/* Middle abstract barcode / chip */}
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
           <div className="h-full w-1/3 bg-emerald-500"></div>
           <div className="h-full w-1/4 bg-emerald-400 mx-1"></div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mb-1">Student ID</div>
          <div className="text-sm font-mono font-bold text-slate-200">
            {String.fromCharCode(65 + (id % 26))}{id} • {1000 + id * 13}
          </div>
        </div>
        <div className="w-7 h-7 rounded-md bg-slate-700 border border-slate-600 flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-500 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
