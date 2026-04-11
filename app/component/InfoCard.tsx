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
    gray: "text-gray-600 bg-gray-50 border-gray-200",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
  };

  // Verifica se é um texto longo (como uma string de versão de banco de dados) para não quebrar o layout,
  // substituindo a verificação hardcoded (label === "Versão") que atrapalharia a tradução.
  const isLongText = typeof count === "string" && count.length > 10;

  return (
    <div
      className={clsx(
        "flex items-center rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",
        compact ? "px-3 py-2.5 gap-3" : "px-4 py-4 gap-4"
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-center rounded-lg border shrink-0",
          compact ? "w-9 h-9 p-1.5" : "w-12 h-12 p-2.5",
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      
      <div className="flex flex-col min-w-0 overflow-hidden">
        <span 
          className={clsx(
            "font-bold text-gray-900",
            isLongText ? "text-xs leading-tight break-words whitespace-normal line-clamp-2" : "tabular-nums truncate",
            compact && !isLongText ? "text-base" : "",
            !compact && !isLongText ? "text-xl" : ""
          )}
          title={String(countDisplay)}
        >
          {countDisplay}
        </span>
        <span className={clsx(
          "text-gray-500 truncate font-medium",
          compact ? "text-xs mt-0.5" : "text-sm mt-1"
        )}>
          {label}
        </span>
      </div>
    </div>
  );
};