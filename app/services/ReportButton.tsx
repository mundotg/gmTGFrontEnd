"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Loader2, ChevronDown, FileSpreadsheet, FileCode } from "lucide-react";
import { FormatoRelatorio } from "./useRelatorio";

export interface ReportFormat {
  value: FormatoRelatorio;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

export const FORMATS: ReportFormat[] = [
  {
    value: "pdf",
    label: "Relatório PDF",
    description: "Gera um relatório completo em PDF.",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    value: "excel",
    label: "Exportar CSV",
    description: "Ideal para análise em planilhas.",
    icon: <FileSpreadsheet className="w-4 h-4" />,
  },
  {
    value: "json",
    label: "Exportar JSON",
    description: "Para uso em integrações de API.",
    icon: <FileCode className="w-4 h-4" />,
  },
];

export interface ReportButtonProps {
  /** Função disparada ao selecionar um formato */
  onGenerate: (format: FormatoRelatorio) => Promise<void> | void;

  /** Lista de formatos disponíveis (ex: PDF, CSV, Excel...) */
  formats: ReportFormat[];

  /** Indica se há resultados disponíveis para gerar o relatório */
  hasResults?: boolean;

  /** Estado de carregamento do relatório */
  isLoading?: boolean;

  /** Classe CSS adicional para o botão principal */
  className?: string;

  /** Texto do botão principal */
  buttonLabel?: string;

  /** Texto durante o carregamento */
  loadingLabel?: string;
}

/**
 * 🔹 Componente reutilizável de botão de geração de relatórios
 */
export const ReportButton: React.FC<ReportButtonProps> = ({
  onGenerate,
  formats,
  hasResults = true,
  isLoading = false,
  className = "",
  buttonLabel = "Gerar Relatório",
  loadingLabel = "Gerando...",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  if (!hasResults) return null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botão principal */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isLoading}
        className={`flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 
          hover:from-green-600 hover:to-green-700 text-white font-medium text-sm 
          py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 
          focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        title="Gerar Relatório"
        aria-label="Abrir menu de relatórios"
        aria-expanded={showDropdown}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileText className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline font-semibold">
          {isLoading ? loadingLabel : buttonLabel}
        </span>
        {!isLoading && <ChevronDown className="w-4 h-4" aria-hidden="true" />}
      </button>

      {/* Dropdown de formatos */}
      {showDropdown && !isLoading && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 
          rounded-lg shadow-xl z-30 animate-fadeIn"
          role="menu"
        >
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              Escolha o formato
            </div>
            {formats.map((formato) => (
              <button
                key={formato.value}
                onClick={async () => {
                  setShowDropdown(false);
                  await onGenerate(formato.value );
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 
                flex items-start gap-3 transition-colors"
                role="menuitem"
              >
                <div className="mt-0.5 text-green-600">{formato.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{formato.label}</div>
                  <div className="text-xs text-gray-500">{formato.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
