"use client";

import Link from "next/link";
import { ElementType, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SidebarItem = {
    id: string;
    label: string;
    title?: string;
    group?: string;
    href: string;
    icon: ElementType;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
};

// Rótulos de reserva dos grupos (usados quando não há tradução).
const GROUP_FALLBACK: Record<string, string> = {
    "sidebar.groupMore": "Mais",
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
    // Oculta itens que exigem conexão quando não há nenhuma ativa.
    const visibleItems = useMemo(
        () => items.filter((item) => !item.requiresConnection || hasActiveConnection),
        [items, hasActiveConnection]
    );

    // Itens de topo (sem grupo) — sempre visíveis, planos.
    const topLevel = useMemo(
        () => visibleItems.filter((i) => !i.group),
        [visibleItems]
    );

    // Itens com grupo → submenus recolhíveis (preservando a ordem de aparição).
    const groups = useMemo(() => {
        const order: string[] = [];
        const map = new Map<string, SidebarItem[]>();
        for (const item of visibleItems) {
            if (!item.group) continue;
            if (!map.has(item.group)) {
                map.set(item.group, []);
                order.push(item.group);
            }
            map.get(item.group)!.push(item);
        }
        return order.map((g) => ({ key: g, items: map.get(g)! }));
    }, [visibleItems]);

    // Estado aberto/fechado por grupo (persistido). Todos abertos por omissão.
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    useEffect(() => {
        try {
            const saved = localStorage.getItem("sidebar-open-groups");
            if (saved) setOpenGroups(JSON.parse(saved));
        } catch {
            //
        }
    }, []);
    const toggleGroup = (key: string) => {
        setOpenGroups((prev) => {
            const next = { ...prev, [key]: prev[key] === false ? true : false };
            try {
                localStorage.setItem("sidebar-open-groups", JSON.stringify(next));
            } catch {
                //
            }
            return next;
        });
    };
    const isGroupOpen = (key: string) => openGroups[key] !== false;

    // Texto do item: tradução se existir, senão o `title` de reserva.
    const itemText = (item: SidebarItem) => {
        const tr = t(item.label);
        return tr && tr !== item.label ? tr : item.title ?? item.label;
    };
    const groupText = (key: string) => {
        const tr = t(key);
        return tr && tr !== key ? tr : GROUP_FALLBACK[key] ?? "Outros";
    };

    const renderItem = (item: SidebarItem) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
            <div key={item.id} className="relative group">
                <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={`
            w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
            ${collapsed ? "justify-center" : "justify-between"}
            ${isActive
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md scale-[1.02]"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }
          `}
                >
                    <div className={`flex items-center ${collapsed ? "" : "space-x-3"}`}>
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                        {!collapsed && (
                            <span className={`font-medium truncate ${isActive ? "text-white" : ""}`}>
                                {itemText(item)}
                            </span>
                        )}
                    </div>

                    {item.badge && !collapsed && (
                        <span
                            className={`
                px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0
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

                {/* Tooltip (modo recolhido) */}
                {collapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover:block">
                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                            {itemText(item)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <nav className="mt-4 pb-6 px-2 flex-1 min-h-0">
            <div className="space-y-1 h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-gray-300">
                {/* Gestão de BD — sempre visível */}
                {topLevel.map(renderItem)}

                {/* Submenus (rotas que não são de gestão de BD) */}
                {groups.map((grp) => {
                    // Modo recolhido: separador + ícones (sem cabeçalho de texto).
                    if (collapsed) {
                        return (
                            <div key={grp.key}>
                                <div className="h-px bg-gray-100 my-1.5" />
                                <div className="space-y-1">{grp.items.map(renderItem)}</div>
                            </div>
                        );
                    }

                    // Modo expandido: cabeçalho recolhível do submenu.
                    const open = isGroupOpen(grp.key);
                    return (
                        <div key={grp.key} className="pt-2 mt-1 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => toggleGroup(grp.key)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600"
                            >
                                <span>{groupText(grp.key)}</span>
                                <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
                                />
                            </button>

                            {open && <div className="space-y-1 mt-0.5">{grp.items.map(renderItem)}</div>}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
