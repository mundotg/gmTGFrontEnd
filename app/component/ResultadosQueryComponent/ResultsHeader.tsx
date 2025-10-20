"use client";

import React, { RefObject, useCallback, useEffect, useRef, useMemo } from "react";
import { 
  Trash2, 
  X, 
  MoreVertical,
  AlertTriangle, 
  Loader2, 
  File,
  FileSpreadsheet
} from "lucide-react";
import { QueryResultType } from "@/types";
import { ConfirmDeleteModalType } from "./types";
import { FormatoRelatorio, useRelatorioAvancado } from "@/app/services/useRelatorio";
import { RelatorioPayload } from "@/hook/useRelatorio";
import { BUTTON_STYLES, MOBILE_MENU_STYLES } from "@/constant";
import { FORMATS, ReportButton } from "@/app/services/ReportButton";

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
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ============================================================
// 🔹 CONSTANTES
// ============================================================

const FORMATOS_DISPONIVEIS: FormatoOption[] = [
  {
    value: "pdf",
    label: "PDF",
    icon: <File className="w-4 h-4" />,
    description: "Relatório em PDF"
  },
  {
    value: "excel",
    label: "Excel",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    description: "Planilha Excel"
  }
];

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
  // ============================================================
  // 🔸 HOOKS E ESTADO
  // ============================================================

  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const reportDropdownRef = useRef<HTMLDivElement>(null);
  // const [showExportOptions, setShowExportOptions] = useState(false);
  // const [showReportDropdown, setShowReportDropdown] = useState(false);

  const {
    gerarRelatorio,
    // cancelarGeracao,
    isLoading: isLoadingRelatorio,
    // error: errorRelatorio,
    // success: successRelatorio,
    progress: exportProgress,
    tempoEstimado,
    // dadosRelatorio,
    // reset: resetRelatorio,
  } = useRelatorioAvancado<QueryResultType>();

  // ============================================================
  // 🔸 MEMOIZED VALUES
  // ============================================================

  const previewInfo = useMemo<PreviewInfo | null>(() => {
    if (!queryResults.preview?.length || !columns?.length) return null;

    const columnsText = `${columns.length} coluna${columns.length !== 1 ? "s" : ""}`;
    const sizeInKB = (JSON.stringify(queryResults.preview).length / 1024).toFixed(1);
    const sizeText = `${sizeInKB} KB`;

    return { columns: columnsText, size: sizeText };
  }, [queryResults.preview, columns]);

  const hasResults = queryResults?.preview?.length > 0;

  // ============================================================
  // 🔸 CALLBACKS
  // ============================================================

  const handleGerarRelatorio = useCallback(async (formato: FormatoRelatorio) => {
    if (!columns?.length) {
      console.error("Nenhuma coluna disponível para gerar relatório");
      return;
    }

    // Clone para evitar mutação
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
    // setShowReportDropdown(false);
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

      if (exportDropdownRef.current && !exportDropdownRef.current.contains(target)) {
        // setShowExportOptions(false);
      }

      if (reportDropdownRef.current && !reportDropdownRef.current.contains(target)) {
        // setShowReportDropdown(false);
      }

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
        ${isMobile ? MOBILE_MENU_STYLES.button : BUTTON_STYLES.base}
        ${isSelectionMode && !isMobile ? BUTTON_STYLES.selection : ""}
        ${!isSelectionMode && !isMobile ? `${BUTTON_STYLES.primary} border` : ""}
      `}
      disabled={isDeleting}
      aria-label={isSelectionMode ? "Desativar modo de seleção" : "Ativar modo de seleção"}
    >
      <input
        type="checkbox"
        checked={isSelectionMode}
        onChange={() => {}}
        className="w-4 h-4 text-purple-600 rounded border-gray-300 pointer-events-none"
        aria-hidden="true"
      />
      {isMobile ? "Modo Seleção" : "Seleção"}
    </button>
  );

  const SelectionCounter = ({ inline = false }: { inline?: boolean }) => {
    if (!isSelectionMode || selectedCount === 0) return null;

    const text = `${selectedCount} selecionado${selectedCount !== 1 ? "s" : ""}`;

    if (inline) {
      return (
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
          {text}
        </span>
      );
    }

    return (
      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
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
          className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.primary}`}
          disabled={isDeleting}
          aria-label={isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
        >
          {isAllSelected ? "Desmarcar" : "Selecionar"} Todos
        </button>

        {selectedCount > 0 && (
          <>
            <button
              onClick={clearSelection}
              className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.primary}`}
              disabled={isDeleting}
              aria-label="Limpar seleção"
            >
              Limpar
            </button>

            <button
              onClick={handleDeleteSelection}
              disabled={isDeleting}
              className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.danger} ${BUTTON_STYLES.disabled}`}
              aria-label={`Eliminar ${selectedCount} item${selectedCount !== 1 ? "s" : ""} selecionado${selectedCount !== 1 ? "s" : ""}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Eliminar ({selectedCount})
            </button>
          </>
        )}
      </>
    );
  };


  const DesktopActions = () => (
    <div className="hidden sm:flex items-center gap-3">
      <SelectionToggle />
      <SelectionActions />

      <button
        onClick={handleDeleteAll}
        disabled={isDeleting || !hasResults}
        className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.danger} ${BUTTON_STYLES.disabled}`}
        aria-label="Eliminar todos os resultados"
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
        Eliminar Todos
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
        className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.close} ${BUTTON_STYLES.disabled}`}
        aria-label="Fechar resultados"
      >
        <X className="w-4 h-4" aria-hidden="true" />
        Fechar
      </button>
    </div>
  );

  const MobileSelectionInfo = () => {
    if (!isSelectionMode || selectedCount === 0) return null;

    return (
      <div className="px-4 py-2 text-xs text-gray-500 border-t border-b border-gray-100">
        {selectedCount} item{selectedCount !== 1 ? "s" : ""} selecionado
        {selectedCount !== 1 ? "s" : ""}
      </div>
    );
  };

  const MobileReportOptions = () => {
    if (!hasResults) return null;

    return (
      <>
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-t border-b border-gray-100">
          Gerar Relatório
        </div>
        {FORMATOS_DISPONIVEIS.map((formato) => (
          <button
            key={formato.value}
            onClick={() => {
              handleGerarRelatorio(formato.value);
              setShowMobileMenu(false);
            }}
            disabled={isLoadingRelatorio}
            className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.disabled}`}
            role="menuitem"
          >
            <div className="text-green-600">
              {formato.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{formato.label}</div>
              <div className="text-xs text-gray-500">{formato.description}</div>
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
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-all"
        aria-label="Abrir menu de opções"
        aria-expanded={showMobileMenu}
      >
        <MoreVertical className="w-5 h-5" aria-hidden="true" />
      </button>

      {showMobileMenu && (
        <div
          className="absolute right-4 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-[80vh] overflow-y-auto"
          role="menu"
        >
          <div className="py-2">
            {/* Modo Seleção */}
            <button
              onClick={() => {
                toggleSelectionMode();
                setShowMobileMenu(false);
              }}
              className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.disabled}`}
              disabled={isDeleting}
              role="menuitem"
            >
              <input
                type="checkbox"
                checked={isSelectionMode}
                onChange={() => {}}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 pointer-events-none"
                aria-hidden="true"
              />
              Modo Seleção
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
                  className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.disabled}`}
                  disabled={isDeleting}
                  role="menuitem"
                >
                  {isAllSelected ? "🗑️ Desmarcar" : "✓ Selecionar"} Todos
                </button>

                {selectedCount > 0 && (
                  <>
                    <button
                      onClick={() => {
                        clearSelection();
                        setShowMobileMenu(false);
                      }}
                      className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.disabled}`}
                      disabled={isDeleting}
                      role="menuitem"
                    >
                      🗑️ Limpar Seleção
                    </button>

                    <button
                      onClick={() => {
                        handleDeleteSelection();
                        setShowMobileMenu(false);
                      }}
                      disabled={isDeleting}
                      className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.danger} ${MOBILE_MENU_STYLES.disabled}`}
                      role="menuitem"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Eliminar ({selectedCount})
                    </button>
                  </>
                )}
              </>
            )}

            {/* Eliminar Todos */}
            <button
              onClick={() => {
                handleDeleteAll();
                setShowMobileMenu(false);
              }}
              disabled={isDeleting || !hasResults}
              className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.danger} ${MOBILE_MENU_STYLES.disabled} ${MOBILE_MENU_STYLES.divider}`}
              role="menuitem"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Eliminar Todos
            </button>

            {/* Opções de Relatório */}
            <MobileReportOptions />

            {/* Fechar */}
            <button
              onClick={() => {
                handleClose();
                setShowMobileMenu(false);
              }}
              disabled={isDeleting}
              className={`${MOBILE_MENU_STYLES.button} ${MOBILE_MENU_STYLES.disabled} ${MOBILE_MENU_STYLES.divider}`}
              role="menuitem"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const ProgressBar = () => {
    if (!isLoadingRelatorio && !isDeleting) return null;

    const progress = isLoadingRelatorio ? exportProgress : deleteProgress;
    const label = isLoadingRelatorio ? "Gerando relatório..." : "Eliminando registros...";
    const colorClass = isLoadingRelatorio ? "bg-green-500" : "bg-red-500";

    return (
      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            {isDeleting && <AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />}
            {isLoadingRelatorio && <Loader2 className="w-4 h-4 animate-spin text-green-600" aria-hidden="true" />}
            {label}
          </span>
          <span className="font-medium" aria-label={`Progresso: ${progress} por cento`}>
            {progress}%
          </span>
        </div>
        <div 
          className="w-full bg-gray-200 rounded-full h-2 overflow-hidden" 
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
          <div className="text-xs text-gray-500 mt-1 text-right">
            Tempo estimado: {tempoEstimado}s
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // 🔸 RENDER
  // ============================================================

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            Resultados da Consulta
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-medium text-blue-600">
                {queryResults.preview?.length.toLocaleString("pt-BR") || 0}
              </span>
              de
              <span className="font-medium">
                {queryResults.totalResults?.toLocaleString("pt-BR") || "..."}
              </span>
              registros
            </span>

            {previewInfo && (
              <span className="hidden sm:inline text-gray-500">
                {previewInfo.columns} • {previewInfo.size}
              </span>
            )}

            <SelectionCounter inline />
          </div>
        </div>

        <DesktopActions />
        <MobileMenu />
      </div>

      {previewInfo && (
        <div className="sm:hidden mt-2 text-sm text-gray-500">
          {previewInfo.columns} • {previewInfo.size}
          <SelectionCounter inline />
        </div>
      )}

      <ProgressBar />
    </div>
  );
};

export default ResultsHeader;