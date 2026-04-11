"use client";

import React, { memo, ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

/* =======================
   UTILS
======================= */
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* =======================
   STAT CARD
======================= */
type StatCardProps = {
  title: string;
  value?: number;
  icon: ReactNode;
  iconBg?: string;
};

export const StatCard = memo(function StatCard({
  title,
  value = 0,
  icon,
  iconBg = "bg-gray-100",
}: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-all">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">
          {value}
        </p>
      </div>
      <div className={cn("p-3 rounded-lg", iconBg)}>
        {icon}
      </div>
    </div>
  );
});

/* =======================
   FILTER BUTTON
======================= */
type FilterBtnProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

export const FilterBtn = memo(function FilterBtn({
  active,
  label,
  onClick,
}: FilterBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      {label}
    </button>
  );
});

/* =======================
   ACCESS DENIED
======================= */
export function AccessDenied({ t }: { t: (valor: string) => string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center px-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="text-amber-600" size={28} />
      </div>

      <p className="text-lg font-bold text-gray-900 mb-1">
        {t("projects.accessDenied") || "Acesso Restrito ao Módulo"}
      </p>

      <p className="text-sm text-gray-500 font-medium max-w-xs">
        {t("projects.accessDeniedDesc") ||
          "Contacte o administrador do MustaInf."}
      </p>
    </div>
  );
}

/* =======================
   SKELETON
======================= */
export function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      
      {/* HEADER */}
      <div className="flex justify-between">
        <div className="h-8 bg-gray-200 w-1/4 rounded-lg" />
        <div className="h-8 bg-gray-200 w-32 rounded-lg" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-gray-200 rounded-xl"
          />
        ))}
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}