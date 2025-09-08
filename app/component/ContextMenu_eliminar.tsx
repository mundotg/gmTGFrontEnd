"use client";
import { Folder, Trash2, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface ContextMenuAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  separator?: boolean;
}

export const actions = [
  { key: "edit_user", label: "Editar Usuário", icon: <User className="w-4 h-4" /> },
  { key: "sep1", label: "", separator: true }, // Separador simples
  { key: "edit_project", label: "Editar Projeto", icon: <Folder className="w-4 h-4" /> },
  { key: "sep2", label: "Ações Perigosas", separator: true }, // Separador com label
  { key: "delete_user", label: "Eliminar Usuário", icon: <Trash2 className="w-4 h-4" />, className: "text-red-600 hover:bg-red-50" },
  { key: "delete_project", label: "Eliminar Projeto", icon: <Trash2 className="w-4 h-4" />, className: "text-red-600 hover:bg-red-50", disabled: true },
];


export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (key: string) => void;
  actions: ContextMenuAction[];
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onAction,
  actions,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [isVisible, setIsVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Filtrar ações válidas (não separadores vazios)
  const validActions = actions.filter(action => !action.separator || action.label);

  useEffect(() => {
    if (!validActions.length) return;

    const adjustPosition = () => {
      if (!menuRef.current) return;

      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let adjustedX = x;
      let adjustedY = y;

      // Ajustar posição horizontal
      if (x + rect.width > viewportWidth - 16) {
        adjustedX = Math.max(16, viewportWidth - rect.width - 16);
      }

      // Ajustar posição vertical
      if (y + rect.height > viewportHeight - 16) {
        adjustedY = Math.max(16, y - rect.height);
        // Se ainda não couber, posicionar acima
        if (adjustedY < 16) {
          adjustedY = Math.max(16, viewportHeight - rect.height - 16);
        }
      }

      // Adicionar scroll offset
      adjustedX += scrollX;
      adjustedY += scrollY;

      setPosition({ x: adjustedX, y: adjustedY });
    };

    // Pequeno delay para garantir que o menu foi renderizado
    const timer = setTimeout(() => {
      adjustPosition();
      setIsVisible(true);
    }, 10);

    // Reajustar em mudanças de viewport
    const handleResize = () => {
      adjustPosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [x, y, validActions.length]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const enabledActions = validActions.filter(action => !action.disabled && !action.separator);
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= enabledActions.length ? 0 : nextIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? enabledActions.length - 1 : nextIndex;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < enabledActions.length) {
            const action = enabledActions[focusedIndex];
            if (!action.disabled) {
              onAction(action.key);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, onAction, onClose, validActions]);

  // Auto-focus no primeiro item
  useEffect(() => {
    if (isVisible) {
      const firstEnabledIndex = validActions.findIndex(action => !action.disabled && !action.separator);
      if (firstEnabledIndex !== -1) {
        setFocusedIndex(firstEnabledIndex);
      }
    }
  }, [isVisible, validActions]);

  const handleAction = (actionKey: string, disabled?: boolean) => {
    if (!disabled) {
      onAction(actionKey);
    }
  };

  if (!validActions.length) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-30" 
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className={`
          fixed bg-white border border-gray-200 rounded-lg shadow-xl z-40 
          min-w-[200px] max-w-[280px] py-1 
          transition-all duration-150 ease-out
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          sm:min-w-[220px]
        `}
        style={{ 
          left: position.x, 
          top: position.y,
          transformOrigin: 'top left'
        }}
        role="menu"
        aria-orientation="vertical"
      >
        {validActions.map((action, index) => {
          if (action.separator) {
            return (
              <div key={`separator-${index}`} className="my-1">
                <div className="h-px bg-gray-200 mx-2" />
                {action.label && (
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {action.label}
                  </div>
                )}
              </div>
            );
          }

          const isDisabled = action.disabled;
          const isFocused = focusedIndex === validActions.filter(a => !a.separator).indexOf(action);
          
          return (
            <button
              key={action.key}
              onClick={() => handleAction(action.key, isDisabled)}
              disabled={isDisabled}
              className={`
                w-full text-left px-4 py-2.5 text-sm flex items-center gap-3
                transition-colors duration-150 ease-out
                ${isDisabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : `
                    cursor-pointer
                    ${isFocused ? 'bg-gray-100' : 'hover:bg-gray-50'}
                    ${action.className || 'text-gray-700'}
                  `
                }
                focus:outline-none focus:bg-gray-100
                active:bg-gray-200
              `}
              role="menuitem"
              tabIndex={-1}
              onMouseEnter={() => {
                if (!isDisabled) {
                  const enabledIndex = validActions.filter(a => !a.separator && !a.disabled).indexOf(action);
                  setFocusedIndex(enabledIndex);
                }
              }}
            >
              <span className={`flex-shrink-0 ${isDisabled ? 'opacity-50' : ''}`}>
                {action.icon}
              </span>
              <span className="flex-1 truncate">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}