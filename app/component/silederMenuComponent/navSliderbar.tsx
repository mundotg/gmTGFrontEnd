"use client";

import Link from "next/link";
import { useMemo } from "react";

export type SidebarItem = {
    id: string;
    label: string;
    href: string;
    icon: any;
    badge?: string;
    requiresConnection?: boolean;
};

type Props = {
    items: SidebarItem[];
    activeTab: string;
    collapsed?: boolean;
    hasActiveConnection?: boolean;
    onItemClick?: () => void;
    t: (key: string) => string;
    user?: any;
};

export default function SidebarNav({
    items,
    activeTab,
    collapsed = false,
    hasActiveConnection = true,
    onItemClick,
    t,
    user,
}: Props) {
    // 🔥 Filtrar itens (ocultar em vez de desabilitar)
    const visibleItems = useMemo(() => {
        return items.filter(
            (item) =>
                !item.requiresConnection || hasActiveConnection
        );
    }, [items, hasActiveConnection]);

    return (
        <nav className="mt-6 pb-6 px-2 flex-1 min-h-0">
            <div
                className="
          space-y-1 h-full overflow-y-auto pr-1
          scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-gray-300
        "
            >
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <div key={item.id} className="relative group">
                            <Link
                                href={item.href}
                                onClick={onItemClick}
                                className={`
                  w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200
                  ${collapsed ? "justify-center" : "justify-between"}

                  ${isActive
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md scale-[1.03]"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }
                `}
                            >
                                <div className={`flex items-center ${collapsed ? "" : "space-x-3"}`}>
                                    <Icon
                                        className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : ""
                                            }`}
                                    />

                                    {!collapsed && (
                                        <span
                                            className={`font-medium truncate ${isActive ? "text-white" : ""
                                                }`}
                                        >
                                            {t(item.label)}
                                        </span>
                                    )}
                                </div>

                                {/* Badge */}
                                {item.badge && !collapsed && (
                                    <span
                                        className={`
                      px-2 py-1 text-xs rounded-full font-medium flex-shrink-0
                      ${isActive
                                                ? "bg-white/20 text-white"
                                                : item.badge === "active"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-gray-100 text-gray-600"
                                            }
                    `}
                                    >
                                        {item.id !== "connections"
                                            ? user?.info_extra?.[item.badge] || "0"
                                            : user?.info_extra?.name_db
                                                ? "ativo"
                                                : "inativo"}
                                    </span>
                                )}
                            </Link>

                            {/* Tooltip */}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover:block">
                                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                                        {t(item.label)}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}