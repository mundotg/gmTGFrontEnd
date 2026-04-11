import React from "react";
import { ChevronRight } from "lucide-react";

/* =======================
   TIPOS
======================= */

export type SettingsTab =
  | "usuario"
  | "empresa"
  | "projetos"
  | "equipe"
  | "integracoes"
  | "sistema";

export interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  permission: string;
  description: string;
}

/* =======================
   SKELETON
======================= */

export const Skeleton = () => (
  <div
    role="status"
    aria-label="Carregando configurações"
    className="animate-pulse space-y-6"
  >
    <div className="h-8 bg-gray-200 rounded-lg w-1/3" />

    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 bg-gray-100 rounded-xl border border-gray-200"
        />
      ))}
    </div>
  </div>
);

/* =======================
   SETTING CARD
======================= */

interface SettingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: boolean;
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const SettingCard = ({
  icon: Icon,
  title,
  description,
  action = false,
  badge,
  onClick,
  disabled = false,
}: SettingCardProps) => {
  const isClickable = action && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      aria-label={title}
      className={`
        group w-full text-left bg-white border rounded-xl p-5 transition-all
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-black hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div
            className="
              w-12 h-12 rounded-lg border flex items-center justify-center
              group-hover:bg-gray-50 transition-colors
            "
          >
            <Icon size={20} className="text-gray-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {title}
              </h3>

              {badge && (
                <span className="px-2 py-0.5 text-xs border rounded-full text-gray-700">
                  {badge}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {action && (
          <ChevronRight
            size={18}
            className="
              text-gray-400 flex-shrink-0 mt-1
              group-hover:text-black transition-colors
            "
          />
        )}
      </div>
    </button>
  );
};

/* =======================
   SYSTEM SETTING TYPE
======================= */

export type SystemSetting = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  permission?: string;
};

/* =======================
   SEARCH HELPERS
======================= */

export const matchesSearch = (tab: TabConfig, query: string) => {
  if (!query) return true;

  const q = query.trim().toLowerCase();

  return (
    tab.label.toLowerCase().includes(q) ||
    tab.description.toLowerCase().includes(q)
  );
};
