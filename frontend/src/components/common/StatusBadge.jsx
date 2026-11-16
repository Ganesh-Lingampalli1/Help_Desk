import React from "react";
import { STATUS_COLORS } from "../../utils/constants";

export const StatusBadge = ({ status, size = "sm" }) => {
  const config = STATUS_COLORS[status] || {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs transition-all ${
        config.bg
      } ${config.text} ${config.border} ${
        isSmall ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <span className="font-semibold tracking-tight">{status}</span>
    </span>
  );
};

export default StatusBadge;
