import React from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  subtitle,
  subtext,
  badge,
}) => {
  const colorMap = {
    blue: {
      bg: "bg-blue-50/80",
      text: "text-blue-600",
      border: "border-blue-100",
      bar: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-500/10",
    },
    amber: {
      bg: "bg-amber-50/80",
      text: "text-amber-600",
      border: "border-amber-100",
      bar: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/10",
    },
    emerald: {
      bg: "bg-emerald-50/80",
      text: "text-emerald-600",
      border: "border-emerald-100",
      bar: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/10",
    },
    rose: {
      bg: "bg-rose-50/80",
      text: "text-rose-600",
      border: "border-rose-100",
      bar: "from-rose-500 to-red-500",
      shadow: "shadow-rose-500/10",
    },
    purple: {
      bg: "bg-purple-50/80",
      text: "text-purple-600",
      border: "border-purple-100",
      bar: "from-purple-500 to-indigo-500",
      shadow: "shadow-purple-500/10",
    },
    slate: {
      bg: "bg-slate-100/80",
      text: "text-slate-700",
      border: "border-slate-200",
      bar: "from-slate-500 to-slate-700",
      shadow: "shadow-slate-500/10",
    },
  };

  const scheme = colorMap[color] || colorMap.blue;
  const descriptionText = subtitle || subtext;

  return (
    <div className="card-white-hover relative overflow-hidden p-5 flex flex-col justify-between">
      {/* Top subtle color highlight line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.bar}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badge && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                {badge}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value ?? 0}
          </div>
        </div>

        {Icon && (
          <div
            className={`p-2.5 rounded-xl border ${scheme.bg} ${scheme.text} ${scheme.border} shadow-sm ${scheme.shadow} transition-transform group-hover:scale-105`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(descriptionText || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {descriptionText && (
            <span className="truncate" title={descriptionText}>
              {descriptionText}
            </span>
          )}
          {trend && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 ml-auto whitespace-nowrap">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
