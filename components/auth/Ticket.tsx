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

    return `
      translate3d(200vw, 0px, 0px)
      rotateX(55deg)
      rotateZ(-40deg)
    `;
  };

  return (
    <div
      className="
        absolute top-1/2 left-1/2
        w-44 h-28 md:w-60 md:h-36
        rounded-xl flex flex-col justify-between p-4
        transition-all duration-[1000ms] ease-out
        shadow-[0_10px_40px_rgba(0,0,0,0.4)]
        border border-white/10
      "
      style={{
        transform: getTransform(),
        marginLeft: "-7rem",
        marginTop: "-3.5rem",
        opacity: phase === 2 ? (index % 2 === 0 ? 1 : 0) : 0.85,
        transitionDelay: `${index * 80}ms`,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div className="flex justify-between items-center opacity-80">
        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-[10px] font-bold text-white">
          {String.fromCharCode(65 + (id % 26))}{id}
        </div>
        <div className="text-[10px] font-mono text-emerald-400">Verified</div>
      </div>

      <div className="space-y-1">
        <div className="h-1 w-1/2 bg-white/30 rounded-full"></div>
        <div className="h-1 w-3/4 bg-white/10 rounded-full"></div>
      </div>

      <div className="flex justify-between items-end">
        <div className="text-xs font-bold text-white">Student ID</div>
        <div className="w-4 h-4 bg-white/10 rounded-sm"></div>
      </div>
    </div>
  );
};

export default Ticket;
