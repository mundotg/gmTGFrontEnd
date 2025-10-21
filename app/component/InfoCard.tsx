"use client";

import React, { useMemo } from "react";
import clsx from "clsx";

type InfoCardProps = {
  icon: React.ReactNode;
  label: string;
  count?: number | string | null;
  color: "red" | "green" | "blue" | "yellow" | "purple" | "gray" | "orange" | "indigo";
  compact?: boolean;
};

export const InfoCard: React.FC<InfoCardProps> = ({ 
  icon, 
  label, 
  count, 
  color, 
  compact = true 
}) => {
  const countDisplay = useMemo(() => {
    if (count === null || count === undefined) return "—";
    return count;
  }, [count]);

  const colorClasses: Record<InfoCardProps["color"], string> = {
    red: "text-red-600 bg-red-50 border-red-100",
    green: "text-green-600 bg-green-50 border-green-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    gray: "text-gray-600 bg-gray-50 border-gray-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
  };

  return (
    <div
      className={clsx(
        "flex items-center rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow",
        compact ? "px-3 py-2 gap-2.5" : "px-4 py-3 gap-3"
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-center rounded-lg border shrink-0",
          compact ? "p-1.5" : "p-2.5",
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0 overflow-hidden">
        <span 
          className={clsx(
            "font-bold text-gray-900",
            label === "Versão" ? "text-xs leading-tight break-words" : "tabular-nums",
            compact ? "text-base leading-tight" : "text-lg"
          )}
          title={String(countDisplay)}
        >
          {countDisplay}
        </span>
        <span className={clsx(
          "text-gray-500 truncate font-medium",
          compact ? "text-xs leading-tight" : "text-sm"
        )}>
          {label}
        </span>
      </div>
    </div>
  );
};