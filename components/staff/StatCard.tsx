import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_3px_20px_rgba(0,0,0,0.06)] border border-neutral-100">
      <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
      <p className={`text-4xl font-bold tracking-tight ${color || "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
};

export default StatCard;
