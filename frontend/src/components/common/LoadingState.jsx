import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingState = ({ message = "Loading...", rows = 5 }) => {
  return (
    <div className="card-white p-8">
      <div className="flex flex-col items-center justify-center py-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">{message}</p>
      </div>

      {/* Subtle skeleton rows */}
      <div className="space-y-3 mt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
