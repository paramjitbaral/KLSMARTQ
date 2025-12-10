import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;     // example: "from-blue-50 to-blue-100"
  mobile?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, mobile }) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        rounded-[32px] bg-gradient-to-br ${color}
        flex-1
        h-28 md:h-32
        min-w-[130px] md:min-w-[200px]
        ${mobile ? "flex" : "hidden md:flex"}
      `}
    >
      <p className="text-[10px] md:text-xs font-semibold tracking-wide text-gray-600 uppercase">
        {title}
      </p>

      <p className="text-3xl md:text-4xl font-extrabold text-[#0A0F1C] mt-1">
        {value}
      </p>
    </div>
  );
};

export default StatCard;
