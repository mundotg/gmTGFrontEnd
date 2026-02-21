"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Loader2, ChevronDown, FileSpreadsheet, FileCode } from "lucide-react";
import { FormatoRelatorio } from "./useRelatorio";
import { useI18n } from "@/context/I18nContext";

export interface ReportFormat {
  value: FormatoRelatorio;
  labelKey: string; // Mudou para key de tradução
  descriptionKey: string; // Mudou para key de tradução
  icon?: React.ReactNode;
}

// O FORMATS agora usa chaves em vez de strings hardcoded
export const FORMATS: ReportFormat[] = [
  {
    value: "pdf",
    labelKey: "reports.formatPdf",
    descriptionKey: "reports.descPdf",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    value: "excel",
    labelKey: "reports.formatCsv",
    descriptionKey: "reports.descCsv",
    icon: <FileSpreadsheet className="w-4 h-4" />,
  },
  {
    value: "json",
    labelKey: "reports.formatJson",
    descriptionKey: "reports.descJson",
    icon: <FileCode className="w-4 h-4" />,
  },
];

export interface ReportButtonProps {
  onGenerate: (format: FormatoRelatorio) => Promise<void> | void;
  formats: ReportFormat[];
  hasResults?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  onGenerate,
  formats,
  hasResults = true,
  isLoading = false,
  className = "",
}) => {
  const { t } = useI18n();
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
      {/* Botão principal - Padrão Secundário Limpo */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isLoading}
        className={`flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 
          text-gray-700 font-medium text-sm py-2 px-4 rounded-lg shadow-sm transition-all duration-200 
          focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        title={t("reports.generateReport") || "Gerar Relatório"}
        aria-label="Abrir menu de relatórios"
        aria-expanded={showDropdown}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
        ) : (
          <FileText className="w-4 h-4 text-gray-500" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {isLoading ? (t("reports.generating1") || "Gerando...") : (t("reports.generateReport") || "Gerar Relatório")}
        </span>
        {!isLoading && <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />}
      </button>

      {/* Dropdown de formatos */}
      {showDropdown && !isLoading && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 
          rounded-xl shadow-lg z-30 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
        >
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              {t("reports.chooseFormat") || "Escolha o formato"}
            </div>
            {formats.map((formato) => (
              <button
                key={formato.value}
                onClick={async () => {
                  setShowDropdown(false);
                  await onGenerate(formato.value);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                role="menuitem"
              >
                <div className="mt-0.5 text-blue-600 p-1.5 bg-blue-50 rounded-md">
                  {formato.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">
                    {t(formato.labelKey) || formato.labelKey}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {t(formato.descriptionKey) || formato.descriptionKey}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};