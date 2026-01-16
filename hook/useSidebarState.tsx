//hook/useSidebarState.tsx

import { useCallback, useEffect, useRef, useState } from "react";

// Constantes
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 450;
const DEFAULT_EXPANDED_WIDTH = 280;
const STORAGE_KEYS = {
  COLLAPSED: "sidebar-collapsed",
  WIDTH: "sidebar-width"
} as const;
// Hook personalizado para gerenciar o estado da sidebar
export const useSidebarState = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(DEFAULT_EXPANDED_WIDTH);
  const [lastExpandedWidth, setLastExpandedWidth] = useState(DEFAULT_EXPANDED_WIDTH);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Carregar estado do localStorage apenas no cliente
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedCollapsed = localStorage.getItem(STORAGE_KEYS.COLLAPSED);
    const savedWidth = localStorage.getItem(STORAGE_KEYS.WIDTH);

    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedWidth !== null) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= MIN_SIDEBAR_WIDTH && parsedWidth <= MAX_SIDEBAR_WIDTH) {
        setWidth(parsedWidth);
        setLastExpandedWidth(parsedWidth);
      }
    }
  }, []);

  // Salvar estado no localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.COLLAPSED, JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.WIDTH, width.toString());
  }, [width]);

  return {
    collapsed,
    setCollapsed,
    width,
    setWidth,
    lastExpandedWidth,
    setLastExpandedWidth,
    mobileOpen,
    setMobileOpen
  };
};



// Hook para resize da sidebar
export const useResizeHandler = (
  setWidth: (width: number) => void
) => {
  const isResizing = useRef(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      const newWidth = Math.min(
        Math.max(e.clientX, MIN_SIDEBAR_WIDTH), 
        MAX_SIDEBAR_WIDTH
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      
      isResizing.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [setWidth]);

  return { handleResizeStart };
};
