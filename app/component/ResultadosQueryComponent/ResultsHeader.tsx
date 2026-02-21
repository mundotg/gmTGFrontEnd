"use client";

import React, { RefObject, useCallback, useEffect, useMemo } from "react";
import { 
  Trash2, 
  X, 
  MoreVertical,
  AlertTriangle, 
  Loader2, 
  File,
  FileSpreadsheet,
  CheckSquare,
  Square
} from "lucide-react";
import { QueryResultType } from "@/types";
import { ConfirmDeleteModalType } from "./types";
import { FormatoRelatorio, useRelatorioAvancado } from "@/app/services/useRelatorio";
import { RelatorioPayload } from "@/hook/useRelatorio";
import { FORMATS, ReportButton } from "@/app/services/ReportButton";
import { useI18n } from "@/context/I18nContext";

// ============================================================
// 🔹 TIPOS E INTERFACES
// ============================================================

interface ResultsHeaderProps {
  queryResults: QueryResultType;
  isSelectionMode: boolean;
  isDeleting: boolean;
  deleteProgress: number;
  columns: string[];
  headers: { name: string; type: string }[];
  selectedCount: number;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  showMobileMenu: boolean;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  setQueryResults: (value: QueryResultType | null) => void;
  toggleSelectionMode: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  handleDeleteSelection: () => void;
  setConfirmDelete: (value: ConfirmDeleteModalType) => void;
  setShowMobileMenu: (value: boolean) => void;
}

interface PreviewInfo {
  columns: string;
  size: string;
}

interface FormatoOption {
  value: FormatoRelatorio;
  labelKey: string;
  icon: React.ReactNode;
  descriptionKey: string;
}

// ============================================================
// 🔹 CONSTANTES (Atualizadas para o Padrão Oficial)
// ============================================================

const FORMATOS_DISPONIVEIS: FormatoOption[] = [
  {
    value: "pdf",
    labelKey: "reports.formatPdf",
    icon: <File className="w-4 h-4" />,
    descriptionKey: "reports.descPdf"
  },
  {
    value: "excel",
    labelKey: "reports.formatExcel",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    descriptionKey: "reports.descExcel"
  }
];

const NEW_BUTTON_STYLES = {
  base: "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
  secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 focus:ring-blue-500/50",
  primary: "bg-blue-600 text-white border border-transparent hover:bg-blue-700 focus:ring-blue-500/50",
  danger: "bg-white border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500/50",
  activeSelection: "bg-blue-50 border border-blue-300 text-blue-700 focus:ring-blue-500/50",
};

const NEW_MOBILE_MENU_STYLES = {
  button: "w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 font-medium text-sm text-gray-700",
  danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed"
};

// ============================================================
// 🔹 COMPONENTE PRINCIPAL
// ============================================================

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  queryResults,
  isSelectionMode,
  isDeleting,
  deleteProgress,
  columns,
  selectedCount,
  isAllSelected,
  showMobileMenu,
  mobileMenuRef,
  setQueryResults,
  toggleSelectionMode,
  selectAll,
  clearSelection,
  handleDeleteSelection,
  setConfirmDelete,
  setShowMobileMenu,
}) => {
  const { t } = useI18n();

  // const exportDropdownRef = useRef<HTMLDivElement>(null);
  // const reportDropdownRef = useRef<HTMLDivElement>(null);

  const {
    gerarRelatorio,
    isLoading: isLoadingRelatorio,
    progress: exportProgress,
    tempoEstimado,
  } = useRelatorioAvancado<QueryResultType>();

  // ============================================================
  // 🔸 MEMOIZED VALUES
  // ============================================================

  const previewInfo = useMemo<PreviewInfo | null>(() => {
    if (!queryResults.preview?.length || !columns?.length) return null;

    const columnsText = `${columns.length} ${columns.length !== 1 ? (t("common.columns") || "colunas") : (t("common.column") || "coluna")}`;
    const sizeInKB = (JSON.stringify(queryResults.preview).length / 1024).toFixed(1);
    const sizeText = `${sizeInKB} KB`;

    return { columns: columnsText, size: sizeText };
  }, [queryResults.preview, columns, t]);

  const hasResults = queryResults?.preview?.length > 0;

  // ============================================================
  // 🔸 CALLBACKS
  // ============================================================

  const handleGerarRelatorio = useCallback(async (formato: FormatoRelatorio) => {
    if (!columns?.length) {
      console.error("Nenhuma coluna disponível para gerar relatório");
      return;
    }

    const resultsCopy = { ...queryResults };
    resultsCopy.totalResults = queryResults.preview?.length || 0;

    const payload: RelatorioPayload<QueryResultType> = {
      tipo: "query",
      body: resultsCopy,
      filtros: {
        tabelas: [],
        totalColunas: 0,
      },
      parametros: {
        formato: formato,
        incluirDetalhes: true,
      },
    };

    await gerarRelatorio(payload);
  }, [queryResults, columns, gerarRelatorio]);

  const handleDeleteAll = useCallback(() => {
    setConfirmDelete({
      isOpen: true,
      type: "all",
      total: queryResults.totalResults || 0,
      lista: [],
    });
  }, [queryResults.totalResults, setConfirmDelete]);

  const handleClose = useCallback(() => {
    setQueryResults(null);
  }, [setQueryResults]);

  // ============================================================
  // 🔸 EFFECTS
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowMobileMenu, mobileMenuRef]);

  // ============================================================
  // 🔸 SUB-COMPONENTES
  // ============================================================

  const SelectionToggle = ({ isMobile = false }: { isMobile?: boolean }) => (
    <button
      onClick={isMobile ? undefined : toggleSelectionMode}
      className={`
        ${isMobile ? NEW_MOBILE_MENU_STYLES.button : NEW_BUTTON_STYLES.base}
        ${isSelectionMode && !isMobile ? NEW_BUTTON_STYLES.activeSelection : ""}
        ${!isSelectionMode && !isMobile ? NEW_BUTTON_STYLES.secondary : ""}
      `}
      disabled={isDeleting}
      aria-label={isSelectionMode ? (t("actions.disableSelection") || "Desativar modo de seleção") : (t("actions.enableSelection") || "Ativar modo de seleção")}
    >
      {isSelectionMode ? (
        <CheckSquare className={`w-4 h-4 ${isMobile ? "text-blue-600" : ""}`} />
      ) : (
        <Square className={`w-4 h-4 ${isMobile ? "text-gray-400" : "text-gray-400"}`} />
      )}
      {isMobile ? (t("actions.selectionMode") || "Modo Seleção") : (t("actions.selection") || "Seleção")}
    </button>
  );

  const SelectionCounter = ({ inline = false }: { inline?: boolean }) => {
    if (!isSelectionMode || selectedCount === 0) return null;

    const text = `${selectedCount} ${selectedCount !== 1 ? (t("common.selectedPlural") || "selecionados") : (t("common.selectedSingle") || "selecionado")}`;

    if (inline) {
      return (
        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">
          {text}
        </span>
      );
    }

    return (
      <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm">
        {text}
      </span>
    );
  };

  const SelectionActions = () => {
    if (!isSelectionMode) return null;

    return (
      <>
        <SelectionCounter />

        <button
          onClick={selectAll}
          className={`${NEW_BUTTON_STYLES.base} ${NEW_BUTTON_STYLES.secondary}`}
          disabled={isDeleting}
          aria-label={isAllSelected ? (t("actions.deselectAll") || "Desmarcar todos") : (t("actions.selectAll") || "Selecionar todos")}
        >
          {isAllSelected ? (t("actions.deselect") || "Desmarcar") : (t("actions.select") || "Selecionar")} {t("common.all") || "Todos"}
        </button>

        {selectedCount > 0 && (
          <>
            <button
              onClick={clearSelection}
              className={`${NEW_BUTTON_STYLES.base} ${NEW_BUTTON_STYLES.secondary}`}
              disabled={isDeleting}
              aria-label={t("actions.clearSelection") || "Limpar seleção"}
            >
              {t("actions.clear") || "Limpar"}
            </button>

            <button
              onClick={handleDeleteSelection}
              disabled={isDeleting}
              className={`${NEW_BUTTON_STYLES.base} ${NEW_BUTTON_STYLES.danger}`}
              aria-label={`${t("actions.delete")} ${selectedCount} ${selectedCount !== 1 ? (t("common.items") || "itens") : (t("common.item") || "item")}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {t("actions.delete")} ({selectedCount})
            </button>
          </>
        )}
      </>
    );
  };


  const DesktopActions = () => (
    <div className="hidden sm:flex items-center gap-2">
      <SelectionToggle />
      <SelectionActions />

      {!isSelectionMode && (
        <>
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting || !hasResults}
            className={`${NEW_BUTTON_STYLES.base} ${NEW_BUTTON_STYLES.danger}`}
            aria-label={t("actions.deleteAll") || "Eliminar todos os resultados"}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            {t("actions.deleteAll") || "Eliminar Todos"}
          </button>

          <ReportButton
            onGenerate={handleGerarRelatorio}
            formats={FORMATS}
            hasResults={true}
            isLoading={false}
          />

          <button
            onClick={handleClose}
            disabled={isDeleting}
            className={`${NEW_BUTTON_STYLES.base} ${NEW_BUTTON_STYLES.secondary}`}
            aria-label={t("actions.closeResults") || "Fechar resultados"}
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t("actions.close") || "Fechar"}
          </button>
        </>
      )}
    </div>
  );

  const MobileSelectionInfo = () => {
    if (!isSelectionMode || selectedCount === 0) return null;

    return (
      <div className="px-4 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 border-b border-gray-100">
        {selectedCount} {selectedCount !== 1 ? (t("common.itemsSelected") || "itens selecionados") : (t("common.itemSelected") || "item selecionado")}
      </div>
    );
  };

  const MobileReportOptions = () => {
    if (!hasResults) return null;

    return (
      <>
        <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-t border-b border-gray-100 bg-gray-50">
          {t("reports.generateReport") || "Gerar Relatório"}
        </div>
        {FORMATOS_DISPONIVEIS.map((formato) => (
          <button
            key={formato.value}
            onClick={() => {
              handleGerarRelatorio(formato.value);
              setShowMobileMenu(false);
            }}
            disabled={isLoadingRelatorio}
            className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.disabled}`}
            role="menuitem"
          >
            <div className="text-blue-600 bg-blue-50 p-1.5 rounded-md">
              {formato.icon}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-bold text-gray-900 truncate">{t(formato.labelKey) || formato.labelKey}</div>
              <div className="text-xs text-gray-500 font-medium truncate">{t(formato.descriptionKey) || formato.descriptionKey}</div>
            </div>
          </button>
        ))}
      </>
    );
  };

  const MobileMenu = () => (
    <div className="sm:hidden" ref={mobileMenuRef}>
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
        aria-label={t("actions.openOptions") || "Abrir menu de opções"}
        aria-expanded={showMobileMenu}
      >
        <MoreVertical className="w-5 h-5" aria-hidden="true" />
      </button>

      {showMobileMenu && (
        <div
          className="absolute right-4 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
          role="menu"
        >
          <div className="py-2">
            {/* Modo Seleção */}
            <button
              onClick={() => {
                toggleSelectionMode();
                setShowMobileMenu(false);
              }}
              className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.disabled}`}
              disabled={isDeleting}
              role="menuitem"
            >
              {isSelectionMode ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              {t("actions.selectionMode") || "Modo Seleção"}
            </button>

            {/* Ações de Seleção */}
            {isSelectionMode && (
              <>
                <MobileSelectionInfo />

                <button
                  onClick={() => {
                    selectAll();
                    setShowMobileMenu(false);
                  }}
                  className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.disabled}`}
                  disabled={isDeleting}
                  role="menuitem"
                >
                  <CheckSquare className="w-4 h-4 text-gray-500" />
                  {isAllSelected ? (t("actions.deselectAll") || "Desmarcar Todos") : (t("actions.selectAll") || "Selecionar Todos")}
                </button>

                {selectedCount > 0 && (
                  <>
                    <button
                      onClick={() => {
                        clearSelection();
                        setShowMobileMenu(false);
                      }}
                      className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.disabled}`}
                      disabled={isDeleting}
                      role="menuitem"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                      {t("actions.clearSelection") || "Limpar Seleção"}
                    </button>

                    <button
                      onClick={() => {
                        handleDeleteSelection();
                        setShowMobileMenu(false);
                      }}
                      disabled={isDeleting}
                      className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.danger} ${NEW_MOBILE_MENU_STYLES.disabled}`}
                      role="menuitem"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      {t("actions.delete")} ({selectedCount})
                    </button>
                  </>
                )}
              </>
            )}

            {/* Ações Gerais (Apenas se não estiver no modo seleção) */}
            {!isSelectionMode && (
              <>
                <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-t border-b border-gray-100 bg-gray-50">
                  {t("actions.generalActions") || "Ações Gerais"}
                </div>
                <button
                  onClick={() => {
                    handleDeleteAll();
                    setShowMobileMenu(false);
                  }}
                  disabled={isDeleting || !hasResults}
                  className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.danger} ${NEW_MOBILE_MENU_STYLES.disabled}`}
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  {t("actions.deleteAll") || "Eliminar Todos"}
                </button>

                <MobileReportOptions />

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={() => {
                    handleClose();
                    setShowMobileMenu(false);
                  }}
                  disabled={isDeleting}
                  className={`${NEW_MOBILE_MENU_STYLES.button} ${NEW_MOBILE_MENU_STYLES.disabled}`}
                  role="menuitem"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  {t("actions.close") || "Fechar"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const ProgressBar = () => {
    if (!isLoadingRelatorio && !isDeleting) return null;

    const progress = isLoadingRelatorio ? exportProgress : deleteProgress;
    const label = isLoadingRelatorio ? (t("reports.generatingReport") || "Gerando relatório...") : (t("actions.deletingRecords") || "Eliminando registros...");
    const colorClass = isLoadingRelatorio ? "bg-green-500" : "bg-red-500";
    const bgClass = isLoadingRelatorio ? "bg-green-50" : "bg-red-50";
    const textClass = isLoadingRelatorio ? "text-green-700" : "text-red-700";
    const iconColorClass = isLoadingRelatorio ? "text-green-600" : "text-red-500";

    return (
      <div className={`px-4 sm:px-5 py-3 border-t border-gray-200 ${bgClass}`}>
        <div className={`flex justify-between text-sm font-bold mb-2 ${textClass}`}>
          <span className="flex items-center gap-2">
            {isDeleting && <AlertTriangle className={`w-4 h-4 ${iconColorClass}`} aria-hidden="true" />}
            {isLoadingRelatorio && <Loader2 className={`w-4 h-4 animate-spin ${iconColorClass}`} aria-hidden="true" />}
            {label}
          </span>
          <span aria-label={`Progresso: ${progress} por cento`}>
            {progress}%
          </span>
        </div>
        <div 
          className="w-full bg-white/50 rounded-full h-2 overflow-hidden border border-gray-200/50" 
          role="progressbar" 
          aria-valuenow={progress} 
          aria-valuemin={0} 
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {isLoadingRelatorio && tempoEstimado && (
          <div className={`text-xs font-medium mt-1.5 text-right opacity-80 ${textClass}`}>
            {t("reports.estimatedTime") || "Tempo estimado:"} {tempoEstimado}s
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // 🔸 RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-t-xl border-b border-gray-200">
      <div className="p-4 sm:p-5 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {t("results.title") || "Resultados da Consulta"}
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                {queryResults.preview?.length.toLocaleString("pt-BR") || 0}
              </span>
              {t("common.of") || "de"}
              <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
                {queryResults.totalResults?.toLocaleString("pt-BR") || "..."}
              </span>
              {t("common.records") || "registros"}
            </span>

            {previewInfo && (
              <span className="hidden sm:inline-flex items-center text-gray-400 before:content-['•'] before:mr-3 before:opacity-50">
                {previewInfo.columns} <span className="opacity-50 mx-1.5">•</span> {previewInfo.size}
              </span>
            )}

            <SelectionCounter inline />
          </div>
        </div>

        <DesktopActions />
        <MobileMenu />
      </div>

      {previewInfo && (
        <div className="sm:hidden px-4 pb-3 text-xs font-medium text-gray-500 flex items-center gap-2">
          <span className="bg-gray-100 px-2 py-1 rounded-md">{previewInfo.columns}</span>
          <span className="bg-gray-100 px-2 py-1 rounded-md">{previewInfo.size}</span>
          <SelectionCounter inline />
        </div>
      )}

      <ProgressBar />
    </div>
  );
};

export default ResultsHeader;