import React from "react";
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp, Flame } from "lucide-react";
import { PRIORITY_COLORS } from "../../utils/constants";

export const PriorityBadge = ({ priority, size = "sm" }) => {
  const config = PRIORITY_COLORS[priority] || {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  const isSmall = size === "sm";

  const renderIcon = () => {
    switch (priority) {
      case "Critical":
        return <Flame className="w-3.5 h-3.5 text-rose-600 animate-bounce" />;
      case "High":
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />;
      case "Medium":
        return <ArrowUp className="w-3.5 h-3.5 text-blue-600" />;
      case "Low":
      default:
        return <ArrowDown className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs ${
        config.bg
      } ${config.text} ${config.border} ${
        isSmall ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      {renderIcon()}
      <span className="tracking-tight">{priority}</span>
    </span>
  );
};

export default PriorityBadge;
