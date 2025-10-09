// "use client";
// import Link from "next/link";
// import { useI18n } from "@/context/I18nContext";
// import { LucideIcon } from "lucide-react";
// import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// interface SidebarItemProps {
//     id: string;
//     href: string;
//     label: string;
//     icon: LucideIcon;
//     badge?: string;
//     isActive: boolean;
//     collapsed: boolean;
//     user: any;
//     onClick: () => void;
// }

// // Constantes para os estilos
// const ITEM_STYLES = {
//     BASE: "w-full flex items-center px-4 py-3 mb-1 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:text-gray-900",
//     ACTIVE: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105",
//     INACTIVE: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md",
//     BADGE_BASE: "px-2 py-1 text-xs rounded-full font-medium transition-colors duration-200",
//     BADGE_ACTIVE: "bg-white/20 text-white",
//     BADGE_SUCCESS: "bg-green-100 text-green-600",
//     BADGE_DEFAULT: "bg-gray-100 text-gray-600",
//     TOOLTIP: "absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-[9999] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
// } as const satisfies Record<string, string>;

// // Hook personalizado para gerenciar o tooltip
// const useTooltip = (collapsed: boolean, delay: number = 500) => {
//     const [showTooltip, setShowTooltip] = useState(false);
//     const [hovered, setHovered] = useState(false);
//     const timeoutRef = useRef<NodeJS.Timeout | null>(null);

//     const handleMouseEnter = useCallback(() => {
//         setHovered(true);
//         if (collapsed) {
//             timeoutRef.current = setTimeout(() => {
//                 setShowTooltip(true);
//             }, delay);
//         }
//     }, [collapsed, delay]);

//     const handleMouseLeave = useCallback(() => {
//         setHovered(false);
//         setShowTooltip(false);
//         if (timeoutRef.current) {
//             clearTimeout(timeoutRef.current);
//         }
//     }, []);

//     // Cleanup do timeout
//     useEffect(() => {
//         return () => {
//             if (timeoutRef.current) {
//                 clearTimeout(timeoutRef.current);
//             }
//         };
//     }, []);

//     return {
//         showTooltip,
//         hovered,
//         handleMouseEnter,
//         handleMouseLeave
//     };
// };

// // Hook para gerenciar o badge
// const useBadgeContent = (id: string, badge: string | undefined, user: any) => {
//     return useMemo(() => {
//         if (!badge) return null;

//         if (id === "connections") {
//             return user?.InfPlus?.name_db ? "ativo" : "inativo";
//         }

//         return user?.InfPlus?.[badge as keyof typeof user.InfPlus] || "0";
//     }, [id, badge, user]);
// };

// // Hook para determinar o tipo do badge
// const useBadgeType = (id: string, badge: string | undefined, user: any) => {
//     return useMemo(() => {
//         if (!badge) return null;

//         if (id === "connections") {
//             return user?.InfPlus?.name_db ? "success" : "default";
//         }

//         if (badge === "active") {
//             return "success";
//         }

//         return "default";
//     }, [id, badge, user]);
// };

// export function SidebarItem({
//     id,
//     href,
//     label,
//     icon: Icon,
//     badge,
//     isActive,
//     collapsed,
//     user,
//     onClick,
// }: SidebarItemProps) {
//     const { t } = useI18n();
//     const { showTooltip, hovered, handleMouseEnter, handleMouseLeave } = useTooltip(collapsed);
//     const badgeContent = useBadgeContent(id, badge, user);
//     const badgeType = useBadgeType(id, badge, user);

//     // Estilos computados
//     const linkClassName = useMemo(() => {
//         const justifyClass = collapsed ? "justify-center" : "justify-between";
//         const stateClass = isActive ? ITEM_STYLES.ACTIVE : ITEM_STYLES.INACTIVE;
//         return `${ITEM_STYLES.BASE} ${justifyClass} ${stateClass}`;
//     }, [collapsed, isActive]);

//     const badgeClassName = useMemo(() => {
//         if (!badge) return "";

//         let typeClass: string = ITEM_STYLES.BADGE_DEFAULT;
//         if (isActive) {
//             typeClass = ITEM_STYLES.BADGE_ACTIVE;
//         } else if (badgeType === "success") {
//             typeClass = ITEM_STYLES.BADGE_SUCCESS;
//         }

//         return `${ITEM_STYLES.BADGE_BASE} ${typeClass}`;
//     }, [badge, isActive, badgeType]);

//     // Texto traduzido memoizado
//     const translatedLabel = useMemo(() => t(label), [t, label]);

//     // Handler otimizado
//     const handleClick = useCallback((e: React.MouseEvent) => {
//         onClick();
//         // Permitir que o Link handle a navegação
//     }, [onClick]);

//     const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
//         if (e.key === "Enter" || e.key === " ") {
//             e.preventDefault();
//             onClick();
//         }
//     }, [onClick]);

//     return (
//         <div className="relative group">
//             <Link
//                 href={href}
//                 onClick={handleClick}
//                 onMouseEnter={handleMouseEnter}
//                 onMouseLeave={handleMouseLeave}
//                 onKeyDown={handleKeyDown}
//                 className={linkClassName}
//                 aria-current={isActive ? "page" : undefined}
//                 aria-label={collapsed ? translatedLabel : undefined}
//                 role="menuitem"
//                 tabIndex={0}
//             >
//                 <div className={`flex items-center ${collapsed ? "" : "space-x-3"}`}>
//                     <Icon
//                         className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : ""}`}
//                         aria-hidden="true"
//                     />
//                     {!collapsed && (
//                         <span className={`font-medium truncate ${isActive ? "text-white" : ""}`}>
//                             {translatedLabel}
//                         </span>
//                     )}
//                 </div>

//                 {badgeContent && !collapsed && (
//                     <span
//                         className={badgeClassName}
//                         aria-label={`${translatedLabel}: ${badgeContent}`}
//                         role="status"
//                     >
//                         {badgeContent}
//                     </span>
//                 )}
//             </Link>

//             {/* Tooltip para modo collapsed */}
//             {collapsed && showTooltip && (
//                 <div
//                     className={`
//       absolute left-full ml-2 top-1/2 -translate-y-1/2 
//       bg-gray-900 text-white px-3 py-2 rounded-lg text-sm 
//       whitespace-nowrap z-[9999] shadow-lg
//       transition-opacity duration-200
//     `}
//                     role="tooltip"
//                     aria-live="polite"
//                 >
//                     <span>{translatedLabel}</span>
//                     {badgeContent && (
//                         <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">
//                             {badgeContent}
//                         </span>
//                     )}
//                     {/* Seta do tooltip */}
//                     <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
//                 </div>
//             )}


//             {/* Indicador visual de foco para usuários de teclado */}
//             <div
//                 className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200 ${hovered && !isActive ? "opacity-100" : "opacity-0"
//                     } bg-gradient-to-r from-blue-100 to-purple-100`}
//                 aria-hidden="true"
//             />
//         </div>
//     );
// }