"use client";
import { Database, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface SidebarHeaderProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

export function SidebarHeader({ collapsed, toggleCollapse }: SidebarHeaderProps) {
  const { t } = useI18n();

  return (
    <div className={`p-6 border-b flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold">DB Manager</h1>
            <p className="text-sm text-gray-500">{t("sidebar.subtitle")}</p>
          </div>
        )}
      </div>
      {!collapsed && (
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-2 rounded-lg hover:bg-gray-100"
          title={t("sidebar.collapse")}
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
      )}
      {collapsed && (
        <div className="hidden md:flex justify-center pt-4 absolute top-4 right-2">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100"
            title={t("sidebar.expand")}
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}
