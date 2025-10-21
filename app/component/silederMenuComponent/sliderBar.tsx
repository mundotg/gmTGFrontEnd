// "use client";
// import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import { usePathname } from "next/navigation";
// import { useSession } from "@/context/SessionContext";
// import { 
//   Menu, 
//   X, 
//   BarChart3, 
//   Database, 
//   TableProperties, 
//   Search, 
//   History, 
//   TrendingUp, 
//   Settings 
// } from "lucide-react";
// import { SidebarHeader } from "./SidebarHeader";
// import { SidebarItem } from "./SidebarItem";
// import { SidebarFooter } from "./SidebarFooter";

// import type { LucideIcon } from "lucide-react";
// import { useResizeHandler, useSidebarState } from "@/hook/useSidebarState";

// // 🔑 Constantes para consistência
// const COLLAPSED_WIDTH = 80;
// const MIN_SIDEBAR_WIDTH = 200;
// const MAX_SIDEBAR_WIDTH = 450;

// interface SidebarItem {
//   id: string;
//   label: string;
//   icon: LucideIcon;
//   badge?: string;
//   href: string;
// }

// interface SidebarProps {
//   children: React.ReactNode;
// }

// const sidebarItems: SidebarItem[] = [
//   { id: "overview", label: "sidebar.overview", icon: BarChart3, href: "/home" },
//   { id: "connections", label: "sidebar.connections", icon: Database, badge: "active", href: "/home/conexao" },
//   { id: "tables", label: "sidebar.tables", icon: TableProperties, badge: "num_table", href: "/home/tabelas" },
//   { id: "query", label: "sidebar.query", icon: Search, badge: "num_consultas", href: "/home/consultas" },
//   { id: "history", label: "sidebar.history", icon: History, badge: "registros_analizados", href: "/home/historico" },
//   { id: "analysis", label: "sidebar.analysis", icon: TrendingUp, href: "/home/analizar" },
//   { id: "settings", label: "sidebar.settings", icon: Settings, href: "/home/configuracao" },
// ];

// export default function Sidebar({ children }: SidebarProps) {
//   const { logout, user } = useSession();
//   const pathname = usePathname();

//   const {
//     collapsed,
//     setCollapsed,
//     width,
//     setWidth,
//     lastExpandedWidth,
//     setLastExpandedWidth,
//     mobileOpen,
//     setMobileOpen
//   } = useSidebarState();

//   const { handleResizeStart } = useResizeHandler(setWidth);
//   const sidebarRef = useRef<HTMLDivElement>(null);

//   // 📌 Usar estado para rastrear se é mobile
//   const [isDesktop, setIsDesktop] = useState(false);

//   useEffect(() => {
//     const checkWidth = () => setIsDesktop(window.innerWidth >= 768);
//     checkWidth();
//     window.addEventListener("resize", checkWidth);
//     return () => window.removeEventListener("resize", checkWidth);
//   }, []);

//   const activeTab = useMemo(
//     () => sidebarItems.find((item) => item.href === pathname)?.id || "overview",
//     [pathname]
//   );

//   const handleLogout = useCallback(async () => {
//     try {
//       await logout();
//       window.location.href = "/auth/login";
//     } catch (error) {
//       console.error("Erro ao fazer logout:", error);
//     }
//   }, [logout]);

//   const toggleCollapse = useCallback(() => {
//     if (collapsed) {
//       setWidth(lastExpandedWidth);
//       setCollapsed(false);
//     } else {
//       setLastExpandedWidth(width);
//       setWidth(COLLAPSED_WIDTH);
//       setCollapsed(true);
//     }
//   }, [collapsed, lastExpandedWidth, width, setCollapsed, setWidth, setLastExpandedWidth]);

//   const handleMobileMenuToggle = useCallback(() => {
//     setMobileOpen(prev => !prev);
//   }, [setMobileOpen]);

//   const handleItemClick = useCallback(() => {
//     if (mobileOpen) setMobileOpen(false);
//   }, [mobileOpen, setMobileOpen]);

//   // 📌 marginLeft agora depende do estado `isDesktop`
//   const mainStyles = useMemo(() => ({
//     marginLeft: isDesktop ? (collapsed ? COLLAPSED_WIDTH : width) : 0,
//   }), [isDesktop, collapsed, width]);

//   return (
//     <div className="flex h-screen relative">
//       {/* Overlay para mobile */}
//       {mobileOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 md:hidden"
//           onClick={() => setMobileOpen(false)}
//           aria-hidden="true"
//         />
//       )}

//       {/* Botão menu mobile */}
//       <button
//         onClick={handleMobileMenuToggle}
//         className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md md:hidden"
//         aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
//         type="button"
//       >
//         {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//       </button>

//       {/* Sidebar */}
//       <aside
//         ref={sidebarRef}
//         className={`
//           bg-white shadow-xl border-r h-full z-40 transition-all duration-300 ease-in-out
//           fixed md:relative
//           ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
//         `}
//         style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
//         role="navigation"
//       >
//         <SidebarHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />

//         <nav className="mt-6 px-3">
//           {sidebarItems.map((item) => (
//             <SidebarItem
//               key={item.id}
//               {...item}
//               isActive={activeTab === item.id}
//               collapsed={collapsed}
//               user={user}
//               onClick={handleItemClick}
//             />
//           ))}
//         </nav>

//         <SidebarFooter collapsed={collapsed} user={user} onLogout={handleLogout} />

//         {/* Handle de resize */}
//         {!collapsed && (
//           <div
//             onMouseDown={handleResizeStart}
//             className="hidden md:block absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-200 group"
//           >
//             <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-8 bg-gray-300 rounded-l-md opacity-0 group-hover:opacity-100 flex items-center justify-center">
//               <div className="w-0.5 h-4 bg-gray-500 rounded" />
//             </div>
//           </div>
//         )}
//       </aside>

//       {/* Conteúdo principal */}
//       <main
//         className="flex-1 py-2 bg-gray-50 overflow-auto transition-all duration-300 ease-in-out"
//         style={mainStyles}
//       >
//         {children}
//       </main>
//     </div>
//   );
// }
