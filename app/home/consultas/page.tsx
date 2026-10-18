"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Table,
  FilePlus2,
  Shield,
  ShieldAlert,
  Database,
  Hash,
  FileText,
  Trash2,
  History,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Sparkles,
  X,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

import api from "@/context/axioCuston";
import { LabeledSelect2 } from "@/app/component/improved-labeled-select";
import QueryBuilder from "@/app/component/query-builder-component";
import ResultTable from "@/app/component/ResultadosQueryComponent";
import RowDetailsModal from "@/app/component/MetadataModal";
import { isSystemTable } from "../tabelas/componentTabela/util";

import {
  CampoDetalhado,
  defaultNameCachesValue,
  MetadataTableResponse,
  QueryPayload,
  SelectedRow,
} from "@/types";

import { InfoCard } from "@/app/component/InfoCard";
import { LabeledSelect } from "@/app/component/LabeledSelect";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import { parseErrorMessage } from "@/util/func";
import { useDatabaseMetadata } from "@/hook/useDatabaseMetadata";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { ErrorScreen, LoadingScreen } from "@/app/component/Loading_and_error-component";
import { useQuerySSE } from "@/hook/useQuerySSE";
import QueryStatusIndicator from "@/app/component/ResultadosQueryComponent/QueryStatusIndicator ";
import { useFormSelectConsulta } from "@/hook/useFormSelectConsultas";
import { useHandleRowClick } from "./utils/funcs";
import SelectTablesModal from "@/app/component/ResultadosQueryComponent/SelectTablesToFetchModal";
import QueryHistoryDrawer from "./components/QueryHistoryDrawer";
import QueryHistoryPanel from "@/app/component/BuildQueryComponent/QueryHistoryPanel";
import { convertAdvancedJoinOptionPayloadToOption } from "@/util/query_build_util/convertAdvancedJoinOptionToPayload";
import { saveAppState } from "@/hook/localStoreUse";

const ConsultaPage = () => {
  const { user } = useSession();
  const { t } = useI18n();
  const { metadata, loading: loadingMetadata, error: errorFetch } = useDatabaseMetadata();
  const {
    executeQuery,
    cancelQuery,
    executingQuery,
    queryResults,
    setQueryResults,
    error: errorQuery,
    progress,
    sseState,
    hasError,
  } = useQuerySSE();

  const {
    selectedTables,
    aliasTables,
    columnsInfo,
    selectColumns,
    queryLimit,
    selectedRow,
    modalOpenEdit,
    loadingFields,
    isEditingRow,
    error,
    setSelectedTables,
    setAliasTables,
    setColumnsInfo,
    setSelectColumns,
    setQueryLimit,
    setSelectedRow,
    setModalOpenEdit,
    setLoadingFields,
    setIsEditingRow,
    setError,
    removerCacheLocalStorage,
  } = useFormSelectConsulta(errorFetch || errorQuery);

  const [mounted, setMounted] = useState(false);

  // Estados de Interface e Adaptabilidade Multi-Ecrã
  const [showStats, setShowStats] = useState(true);
  const [showTableSelector, setShowTableSelector] = useState(true);
  const [showColumnsSection, setShowColumnsSection] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [historySignal, setHistorySignal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hideSystemTables, setHideSystemTables] = useState(false);

  // Detecta ecrãs menores para fechar estatísticas por defeito e poupar espaço
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setShowStats(false);
    }
  }, []);

  // Atalhos de teclado (Ctrl+H abre/fecha histórico, Esc fecha histórico)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isHistoryOpen) {
        setIsHistoryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistoryOpen]);

  // Mensagens de erro sincronizadas
  useEffect(() => {
    if (errorFetch) {
      setError(errorFetch);
    } else if (errorQuery) {
      setError(errorQuery);
    } else {
      setError(null);
    }
  }, [errorFetch, errorQuery, setError, hasError]);

  // Toast feedback helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Seleção e carregamento de metadados das tabelas
  const handleSelectTables = useCallback(
    async (newTable: string) => {
      const normalized = newTable.trim().toLowerCase();

      if (normalized.length === 0) {
        setSelectColumns([]);
        setSelectedTables([]);
        setColumnsInfo([]);
        setAliasTables({});
        return;
      }

      setError(null);

      try {
        if (!selectedTables.includes(newTable)) {
          setSelectedTables((prev) => [...prev, newTable]);

          const rs = await api.get<MetadataTableResponse>(
            `/consu/metadata_fieds/${encodeURIComponent(newTable)}`,
            { withCredentials: true, timeout: 45000 }
          );

          setColumnsInfo((prev) => [...prev, rs.data]);
        } else {
          const remainingTables = selectedTables.filter(
            (t) => t.toLowerCase() !== normalized
          );
          setSelectedTables(remainingTables);

          const filteredColumns = columnsInfo.filter((ci) =>
            remainingTables.some(
              (t) => t.toLowerCase() === ci.table_name.toLowerCase()
            )
          );
          setColumnsInfo(filteredColumns);

          setSelectColumns((prev) =>
            prev.filter((s) => {
              const [table] = s.split(".");
              return remainingTables.some(
                (t) => t.toLowerCase() === table.toLowerCase()
              );
            })
          );
        }
      } catch (err) {
        const errorMsg = parseErrorMessage(err);
        setError(errorMsg);
        console.error("❌ Erro ao buscar metadados da tabela:", errorMsg);
      }
    },
    [columnsInfo, setAliasTables, setColumnsInfo, setError, setSelectColumns, setSelectedTables, selectedTables]
  );

  // Re-execução direta a partir do Drawer de Histórico
  const handleRerunFromHistory = useCallback(
    async (payload: QueryPayload) => {
      try {
        const parsedLimit = parseInt(queryLimit, 10);
        const effectiveLimit = payload.limit !== undefined 
          ? (payload.limit > 0 ? payload.limit : undefined)
          : (parsedLimit > 0 ? parsedLimit : undefined);

        const query = {
          ...payload,
          limit: effectiveLimit,
        };

        showToast(t("query.rerunningHistory") || "A re-executar consulta do histórico...");
        await executeQuery(query);

        // Notifica o sinal de histórico para atualizar contagens
        setTimeout(() => setHistorySignal((s) => s + 1), 1200);
        showToast(t("query.executedSuccess") || "Consulta executada com sucesso!");
      } catch (err) {
        console.error("Erro ao re-executar consulta do histórico:", err);
      }
    },
    [executeQuery, queryLimit, showToast, t]
  );

  // Carregar e construir todo o formulário da consulta salva
  const handleLoadFromHistory = useCallback(
    async (payload: QueryPayload) => {
      try {
        showToast(t("query.loadingHistoryForm") || "A carregar e construir formulário da consulta...");
        setLoadingFields(true);

        // 1. Extrair todas as tabelas envolvidas na consulta
        const tablesSet = new Set<string>();
        if (payload.baseTable) tablesSet.add(payload.baseTable);
        if (Array.isArray(payload.table_list)) {
          payload.table_list.forEach((t) => t && tablesSet.add(t));
        }
        if (payload.joins) {
          Object.keys(payload.joins).forEach((t) => t && tablesSet.add(t));
        }
        if (Array.isArray(payload.where)) {
          payload.where.forEach((w) => {
            if (w.table_name_fil) tablesSet.add(w.table_name_fil);
          });
        }
        if (Array.isArray(payload.select)) {
          payload.select.forEach((s) => {
            const tbl = s.split(".")[0];
            if (tbl) tablesSet.add(tbl);
          });
        }

        const allTables = Array.from(tablesSet);

        // 2. Buscar metadados das tabelas que ainda não estão em columnsInfo
        const existingColumnsMap = new Map(
          columnsInfo.map((ci) => [ci.table_name.toLowerCase(), ci])
        );

        const tablesToFetch = allTables.filter(
          (tbl) => !existingColumnsMap.has(tbl.toLowerCase())
        );

        let newFetchedColumns: MetadataTableResponse[] = [];
        if (tablesToFetch.length > 0) {
          const fetchPromises = tablesToFetch.map(async (tbl) => {
            try {
              const rs = await api.get<MetadataTableResponse>(
                `/consu/metadata_fieds/${encodeURIComponent(tbl)}`,
                { withCredentials: true, timeout: 45000 }
              );
              return rs.data;
            } catch (err) {
              console.error(`Erro ao buscar metadados para ${tbl}:`, err);
              return null;
            }
          });
          const results = await Promise.all(fetchPromises);
          newFetchedColumns = results.filter(
            (r): r is MetadataTableResponse => r !== null
          );
        }

        const mergedColumnsInfo = [
          ...columnsInfo.filter((ci) =>
            allTables.some((t) => t.toLowerCase() === ci.table_name.toLowerCase())
          ),
          ...newFetchedColumns,
        ];

        // 3. Atualizar estados da consulta
        setSelectedTables(allTables);
        setColumnsInfo(mergedColumnsInfo);

        if (payload.select && payload.select.length > 0) {
          setSelectColumns(payload.select);
        } else {
          setSelectColumns([]);
        }

        if (payload.aliaisTables) {
          setAliasTables(payload.aliaisTables);
        } else {
          setAliasTables({});
        }

        if (payload.limit !== undefined && payload.limit !== null && payload.limit > 0) {
          setQueryLimit(String(payload.limit));
        } else {
          setQueryLimit("0");
        }

        // 4. Reconstruir Joins
        const convertedJoins = payload.joins
          ? convertAdvancedJoinOptionPayloadToOption(payload.joins)
          : {};

        const conditions = payload.where || [];
        const orderBy = payload.orderBy || [];
        const distinct = payload.distinct || { useDistinct: false, distinct_columns: [] };

        // 5. Persistir no IndexedDB (AppDB) e localStorage
        await Promise.all([
          saveAppState("query_conditions", conditions),
          saveAppState("query_joins", convertedJoins),
          saveAppState("query_orderby", orderBy),
          saveAppState("query_distinct", distinct),
          saveAppState("consulta_selectedTables", allTables),
          saveAppState("consulta_columnsInfo", mergedColumnsInfo),
          saveAppState("consulta_selectColumns", payload.select || []),
        ]);

        localStorage.setItem("query_conditions", JSON.stringify(conditions));
        localStorage.setItem("query_joins", JSON.stringify(convertedJoins));
        localStorage.setItem("query_orderby", JSON.stringify(orderBy));
        localStorage.setItem("query_distinct", JSON.stringify(distinct));
        localStorage.setItem("consulta_selectedTables", JSON.stringify(allTables));
        localStorage.setItem("consulta_columnsInfo", JSON.stringify(mergedColumnsInfo));
        localStorage.setItem("consulta_selectColumns", JSON.stringify(payload.select || []));

        // Notificar componentes para re-hidratação imediata
        window.dispatchEvent(new Event("storage"));

        // 6. Configurar visualização: abrir construtor e fechar modais/drawers
        setShowColumnsSection(true);
        setShowTableSelector(false);
        setIsFocusMode(false);
        setIsHistoryOpen(false);

        showToast(t("query.loadedHistorySuccess") || "Consulta carregada e formulário construído com sucesso!");
      } catch (err) {
        const errorMsg = parseErrorMessage(err);
        setError(errorMsg);
        console.error("Erro ao carregar consulta no construtor:", err);
      } finally {
        setLoadingFields(false);
      }
    },
    [
      columnsInfo,
      setColumnsInfo,
      setSelectedTables,
      setSelectColumns,
      setAliasTables,
      setQueryLimit,
      setError,
      showToast,
      setLoadingFields,
      t,
    ]
  );

  // Guardar consulta encriptada no backend e abrir análise de dados com a chave
  const [openingDataScience, setOpeningDataScience] = useState(false);

  const handleOpenDataScience = useCallback(async () => {
    const activePayload = queryResults?.QueryPayload;
    const estrutura_das_tabelas_completa = queryResults?.tabela_coluna;
    if (!activePayload) {
      showToast(t("query.noActiveQuery") || "Nenhuma consulta ativa encontrada para análise.");
      return;
    }

    setOpeningDataScience(true);
    try {
      showToast(t("query.preparingDataScience") || "A guardar consulta e a preparar sessão encriptada...");
      const res = await api.post(
        "/datascience/store-query",
        {
          query: activePayload,
          estructura_das_tabelas_completa: estrutura_das_tabelas_completa,
          estrutura_das_tabelas_completa,
          tabela_coluna: estrutura_das_tabelas_completa,
        },
        { withCredentials: true }
      );
      const key = res.data?.key;
      if (!key) {
        throw new Error(t("query.keyNotReturned") || "Chave não retornada pelo servidor.");
      }
      window.open(`/datascience?key=${encodeURIComponent(key)}`, "_blank");
    } catch (err) {
      console.error("Erro ao preparar sessão de Data Science:", err);
      showToast(t("query.dataScienceError") || "Erro ao preparar análise de dados.");
    } finally {
      setOpeningDataScience(false);
    }
  }, [queryResults, showToast, t]);

  // Escolher tabela sugerida no histórico
  const handlePickTableFromHistory = useCallback(
    async (tableName: string) => {
      if (!selectedTables.includes(tableName)) {
        await handleSelectTables(tableName);
        showToast(t("query.tableAdded", { tableName }) || `Tabela '${tableName}' adicionada.`);
      }
      setIsHistoryOpen(false);
    },
    [handleSelectTables, selectedTables, showToast, t]
  );

  const table_names = useMemo(() => {
    return (
      metadata?.table_names.map((tItem) => ({
        value: tItem.name,
        label: `${tItem.name} (${tItem.rowcount} ${t("common.records") || "registros"})`,
      })) || []
    );
  }, [metadata, t]);

  const openRowModal = useCallback(
    (row: SelectedRow) => {
      setSelectedRow(row);
      setModalOpenEdit(true);
    },
    [setSelectedRow, setModalOpenEdit]
  );

  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedRowsForEdit, setSelectedRowsForEdit] = useState<{
    rows_primary_keys: Record<string, { primaryKey: string; valor: any }>[];
    indices: number[];
  } | null>(null);

  const {
    handleDelete,
    handleRowClick,
    handleRowUpdate,
    handleBulkUpdate,
    handleUpdateSelected,
    incompleteTablesToSelect,
    modalFetchOpen,
    setModalFetchOpen,
    responseModal,
    setResponseModal,
    handleConfirmFetchModal,
    optionModalTable,
    setOptionModalTable,
  } = useHandleRowClick({
    queryResults,
    columnsInfo,
    selectedRow,
    isEditingRow,
    openRowModal,
    setLoadingFields,
    setQueryResults,
    setError,
    setSelectedRow,
    setIsEditingRow,
    t,
  });

  const handleOpenBulkEdit = useCallback(() => {
    if (!queryResults || !queryResults.preview?.length) {
      showToast(t("query.noRecordsToEdit") || "Nenhum registro encontrado para editar.");
      return;
    }

    // Identificar tabelas associadas à consulta
    const tabelasSet = new Set<string>();
    if (queryResults.QueryPayload?.baseTable) {
      tabelasSet.add(queryResults.QueryPayload.baseTable);
    }
    if (Array.isArray(queryResults.QueryPayload?.table_list)) {
      queryResults.QueryPayload.table_list.forEach((t) => t && tabelasSet.add(t));
    }
    if (queryResults.QueryPayload?.joins) {
      Object.keys(queryResults.QueryPayload.joins).forEach((t) => t && tabelasSet.add(t));
    }
    if (tabelasSet.size === 0 && queryResults.columns) {
      queryResults.columns.forEach((c) => {
        const parts = String(c).split(".");
        if (parts.length >= 2) {
          tabelasSet.add(parts.slice(0, -1).join("."));
        }
      });
    }

    const tabelas = Array.from(tabelasSet);
    const cols = queryResults.columns?.length
      ? queryResults.columns
      : Object.keys(queryResults.preview[0] || {});

    // No modo "Editar Todos", a modal abre sem dados pré-preenchidos.
    // O usuário escolhe a coluna que deseja editar e preenche o novo valor.
    const emptyRow: Record<string, unknown> = {};
    cols.forEach((col) => {
      emptyRow[col] = "";
    });

    setSelectedRow({
      row: emptyRow,
      nameColumns: cols,
      index: -1,
      orderBy: queryResults.QueryPayload?.orderBy,
      tableName: tabelas,
    });

    setSelectedRowsForEdit(null);
    setIsBulkEditMode(true);
    setModalOpenEdit(true);
  }, [queryResults, setSelectedRow, setModalOpenEdit, showToast, t]);

  const handleOpenSelectedEdit = useCallback(
    (payload: {
      rows_primary_keys: Record<string, { primaryKey: string; valor: any }>[];
      indices: number[];
    }) => {
      if (!queryResults || !payload.rows_primary_keys.length) {
        showToast(t("query.noRecordsSelected") || "Nenhum registro selecionado para editar.");
        return;
      }

      // Identificar tabelas associadas à consulta
      const tabelasSet = new Set<string>();
      if (queryResults.QueryPayload?.baseTable) {
        tabelasSet.add(queryResults.QueryPayload.baseTable);
      }
      if (Array.isArray(queryResults.QueryPayload?.table_list)) {
        queryResults.QueryPayload.table_list.forEach((t) => t && tabelasSet.add(t));
      }
      if (queryResults.QueryPayload?.joins) {
        Object.keys(queryResults.QueryPayload.joins).forEach((t) => t && tabelasSet.add(t));
      }
      if (tabelasSet.size === 0 && queryResults.columns) {
        queryResults.columns.forEach((c) => {
          const parts = String(c).split(".");
          if (parts.length >= 2) {
            tabelasSet.add(parts.slice(0, -1).join("."));
          }
        });
      }

      const tabelas = Array.from(tabelasSet);
      const cols = queryResults.columns?.length
        ? queryResults.columns
        : Object.keys(queryResults.preview[0] || {});

      // No modo de edição de selecionados, a modal abre sem dados pré-preenchidos.
      // O usuário escolhe a coluna que deseja editar e preenche o novo valor.
      const emptyRow: Record<string, unknown> = {};
      cols.forEach((col) => {
        emptyRow[col] = "";
      });

      setSelectedRow({
        row: emptyRow,
        nameColumns: cols,
        index: -1,
        orderBy: queryResults.QueryPayload?.orderBy,
        tableName: tabelas,
      });

      setSelectedRowsForEdit(payload);
      setIsBulkEditMode(true);
      setModalOpenEdit(true);
    },
    [queryResults, setSelectedRow, setModalOpenEdit, showToast, t]
  );

  // ----------------- Telas de Loading e Erro -----------------
  if (loadingMetadata || !mounted) {
    return (
      <LoadingScreen
        message={t("query.loadingMetadata") || "Carregando metadados do banco de dados..."}
      />
    );
  }

  if (error && !metadata) {
    return (
      <ErrorScreen
        message={error || errorFetch || t("common.unknownError") || "Erro desconhecido"}
      />
    );
  }

  return (
    <div className="relative bg-gray-50/70 min-h-screen pb-16">
      
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-gray-200 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">

            {/* Linha 1: Título, Conexão e Ações de Espaço */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    {t("query.title") || "Consulta de Dados"}
                  </h1>
                  {metadata?.connection_name && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {metadata.connection_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {user?.info_extra?.name_db && (
                    <span>{t("common.database") || "Banco:"} <strong className="text-gray-700">{user.info_extra.name_db}</strong></span>
                  )}
                  {user?.info_extra?.type && (
                    <>
                      <span>•</span>
                      <span className="uppercase font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                        {user.info_extra.type}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Botões de Controlo do Header */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Botão para alternar visualização das estatísticas */}
                <button
                  type="button"
                  onClick={() => setShowStats((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 shadow-2xs transition-colors"
                  title={t("query.toggleStatsTitle") || "Ocultar ou exibir as estatísticas do banco"}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{t("query.toggleStats") || "Estatísticas"}</span>
                  {showStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Botão de Histórico (com badge) */}
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 shadow-2xs transition-colors ${
                    isHistoryOpen
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                  title={t("query.toggleHistoryTitle") || "Abrir ou ocultar histórico de consultas (Ctrl + H)"}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{t("query.toggleHistory") || "Histórico"}</span>
                  {historyCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                        isHistoryOpen ? "bg-white text-blue-700" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {historyCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Grid de Stats (Colapsável para economizar espaço) */}
            {showStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1 animate-in fade-in duration-200">
                <InfoCard icon={<Table className="w-4 h-4" />} label={t("stats.tables") || "Tabelas"} count={metadata?.table_count} color="blue" />
                <InfoCard icon={<Database className="w-4 h-4" />} label={t("stats.views") || "Views"} count={metadata?.view_count} color="green" />
                <InfoCard icon={<FilePlus2 className="w-4 h-4" />} label={t("stats.procedures") || "Procedures"} count={metadata?.procedure_count} color="purple" />
                <InfoCard icon={<FileText className="w-4 h-4" />} label={t("stats.functions") || "Functions"} count={metadata?.function_count} color="orange" />
                <InfoCard icon={<Shield className="w-4 h-4" />} label={t("stats.triggers") || "Triggers"} count={metadata?.trigger_count} color="red" />
                <InfoCard icon={<Hash className="w-4 h-4" />} label={t("stats.indexes") || "Indexes"} count={metadata?.index_count} color="gray" />
              </div>
            ) : (
              /* Resumo compacto de 1 linha quando recolhido */
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span><strong>{metadata?.table_count ?? 0}</strong> {t("stats.tables") || "Tabelas"}</span>
                <span>•</span>
                <span><strong>{metadata?.view_count ?? 0}</strong> {t("stats.views") || "Views"}</span>
                <span>•</span>
                <span><strong>{metadata?.procedure_count ?? 0}</strong> {t("stats.procedures") || "Procedures"}</span>
                <span>•</span>
                <span><strong>{metadata?.index_count ?? 0}</strong> {t("stats.indexes") || "Índices"}</span>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* BARRA DE AÇÕES RÁPIDAS (STICKY / CONTROLES DE ESPAÇO) */}
      <div className="bg-white/80 backdrop-blur-xs border-b border-gray-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          
          {/* Lado Esquerdo: Controles de Seção e Foco */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Toggle de Seleção de Tabelas */}
            <button
              type="button"
              onClick={() => setShowTableSelector((v) => !v)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                showTableSelector
                  ? "bg-gray-100 border-gray-200 text-gray-800"
                  : "bg-white border-dashed border-gray-300 text-gray-500 hover:text-gray-800"
              }`}
              title={t("query.toggleTableSelectorTitle") || "Recolher ou exibir o seletor de tabelas para ganhar espaço"}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showTableSelector ? (t("query.hideSelector") || "Ocultar Seletor") : (t("query.showSelector") || "Mostrar Seletor")}</span>
            </button>

            {/* Toggle de Colunas */}
            {selectedTables.length > 0 && (
              <button
                type="button"
                onClick={() => setShowColumnsSection((v) => !v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                  showColumnsSection
                    ? "bg-gray-100 border-gray-200 text-gray-800"
                    : "bg-white border-dashed border-gray-300 text-gray-500 hover:text-gray-800"
                }`}
                title={t("query.toggleColumnsTitle") || "Recolher ou exibir a visualização de colunas"}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showColumnsSection ? (t("query.hideColumns") || "Ocultar Colunas") : (t("query.showColumns") || "Mostrar Colunas")}</span>
              </button>
            )}

            {/* Modo Foco (Resultados em Ecrã Cheio) */}
            {queryResults && (queryResults.preview?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => setIsFocusMode((v) => !v)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md border flex items-center gap-1.5 transition-colors ${
                  isFocusMode
                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
                title={t("query.focusModeTitle") || "Modo Foco: maximiza a tabela de resultados e esconde os filtros"}
              >
                {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFocusMode ? (t("query.exitFocusMode") || "Sair do Modo Foco") : (t("query.focusMode") || "Modo Foco")}</span>
              </button>
            )}
          </div>

          {/* Lado Direito: Ações rápidas de Limpeza e Exportação */}
          <div className="flex items-center gap-2">
            {selectedTables.length > 0 && (
              <button
                type="button"
                onClick={removerCacheLocalStorage}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                title={t("query.clearAllTitle") || "Limpar todas as tabelas e condições selecionadas"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("common.clear") || "Limpar"}</span>
              </button>
            )}

            {/* Atalho Ciência de Dados */}
            {queryResults && (queryResults.preview?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={handleOpenDataScience}
                disabled={openingDataScience}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                title={t("query.dataScienceTitle") || "Guardar consulta encriptada e abrir análise estatística em nova aba"}
              >
                {openingDataScience ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("common.preparing") || "A preparar..."}</span>
                  </>
                ) : (
                  <span>📊 {t("query.dataScience") || "Data Science"}</span>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Display de Erros */}
        {(error || hasError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-sm font-bold">{t("common.error") || "Erro"}:</span>
              <span className="text-sm font-medium">
                {error || errorQuery || t("common.unknownError") || "Erro desconhecido"}
              </span>
            </div>
          </div>
        )}

        {/* Seção de Seleção de Tabelas (Ocultável no Modo Foco ou via Toggle) */}
        {!isFocusMode && showTableSelector && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {t("query.selectTables") || "Selecionar Tabelas"}
                </h2>
                {selectedTables.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {t("query.tablesSelectedCount", { count: selectedTables.length }) || `${selectedTables.length} selecionada(s)`}
                  </span>
                )}
              </div>

              {selectedTables.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTableSelector(false)}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  title={t("query.collapseSelectorTitle") || "Recolher caixa de seleção para poupar espaço"}
                >
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("common.collapse") || "Recolher"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {metadata && (
                <LabeledSelect
                  label={t("common.tables") || "Tabelas"}
                  value={selectedTables}
                  onChange={handleSelectTables}
                  options={table_names}
                  maxSelections={16}
                  showSystemFilterRadio={true}
                  hideSystemTables={hideSystemTables}
                  onHideSystemTablesChange={setHideSystemTables}
                />
              )}

              <LabeledSelect2
                label={t("query.recordLimit") || "Limite de Registros"}
                value={queryLimit}
                onChange={setQueryLimit}
                maxCustomNumber={50000}
                options={[
                  ...["1", "10", "50", "100", "500", "1000", "5000"].map((v) => ({
                    value: v,
                    label: `${v} ${t("common.records") || "registros"}`,
                  })),
                  { value: "0", label: `♾️ ${t("query.unlimited") || "Sem limite (Todos os registros)"}` },
                ]}
              />
            </div>

            {/* Chips interativos das tabelas selecionadas com remoção rápida */}
            {selectedTables.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500 mr-1">{t("query.activeTables") || "Tabelas ativas:"}</span>
                {selectedTables.map((tbl) => (
                  <span
                    key={tbl}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg shadow-2xs"
                  >
                    <span>{tbl}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectTables(tbl)}
                      className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 hover:text-red-600 transition-colors"
                      title={t("query.removeTable", { tbl }) || `Remover ${tbl}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resumo quando o seletor está colapsado e existem tabelas selecionadas */}
        {!isFocusMode && !showTableSelector && selectedTables.length > 0 && (
          <div className="bg-white rounded-xl shadow-2xs border border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{t("common.tables") || "Tabelas"}:</span>
              {selectedTables.map((tbl) => (
                <span
                  key={tbl}
                  className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded-md whitespace-nowrap border border-gray-200"
                >
                  {tbl}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTableSelector(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap"
            >
              <span>{t("query.editSelection") || "Editar seleção"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Painel de Histórico & Sugestões - sempre disponível independentemente de ter tabelas selecionadas */}
        {!isFocusMode && (
          <QueryHistoryPanel
            reloadSignal={historySignal}
            onRerun={handleRerunFromHistory}
            onLoad={handleLoadFromHistory}
            onPickTable={handlePickTableFromHistory}
            defaultOpen={selectedTables.length === 0}
          />
        )}

        {/* Table Columns Display */}
        {!isFocusMode && showColumnsSection && selectedTables.length > 0 && (
          <TableColumnsDisplay
            names_caches_value={defaultNameCachesValue}
            tableNames={selectedTables.join(", ")}
            columns={columnsInfo}
            setColumns={setColumnsInfo}
            isLoading={loadingFields}
            setIsLoading={setLoadingFields}
            error={error}
            theme="light"
            tabelaExistenteNaDB={metadata?.table_names.map((t) => t.name) || []}
            showSearch
            showFilter
            showSort
            showExport
            itemsPerPage={8}
            select={selectColumns}
            setSelect={setSelectColumns}
          />
        )}

        {/* Query Builder (Ocultável no Modo Foco) */}
        {!isFocusMode &&
          selectedTables.length > 0 &&
          columnsInfo.length > 0 &&
          columnsInfo?.[0].colunas.length > 0 && (
            <QueryBuilder
              columns={columnsInfo}
              table_list={selectedTables}
              setTable_list={setSelectedTables}
              onExecuteQuery={(query) => {
                const parsedLimit = parseInt(queryLimit, 10);
                query.limit = parsedLimit > 0 ? parsedLimit : undefined;

                return executeQuery(query).then(() => {
                  const tabelaCountColuna: Record<string, CampoDetalhado[]> = {};

                  query.table_list?.forEach((t) => {
                    tabelaCountColuna[t] =
                      columnsInfo.find(
                        (inf) => inf.schema_name + "." + inf.table_name === t
                      )?.colunas || [];
                  });

                  setQueryResults((prev) => {
                    if (!prev) {
                      return {
                        success: false,
                        query: "",
                        params: {},
                        totalResults: null,
                        duration_ms: 0,
                        columns: [],
                        preview: [],
                        tabela_coluna: tabelaCountColuna,
                      };
                    }
                    return {
                      ...prev,
                      tabela_coluna: tabelaCountColuna,
                    };
                  });

                  // Notifica o histórico para recarregar com a nova consulta
                  setTimeout(() => setHistorySignal((s) => s + 1), 1200);
                });
              }}
              removerCacheLocalStorage={removerCacheLocalStorage}
              title={`${t("query.titleConsulta") || "Consulta"}: ${selectedTables.join(", ")}`}
              isExecuting={executingQuery}
              maxConditions={25}
              showLogicalOperators
              setSelect={setSelectColumns}
              select={selectColumns}
              setAliasTables={setAliasTables}
              aliasTables={aliasTables}
            />
          )}

        {/* Indicador de Status SSE */}
        <QueryStatusIndicator
          sseState={sseState}
          progress={progress}
          onCancel={cancelQuery}
          executingQuery={executingQuery}
        />

        {/* Tabela de Resultados (Com suporte total ao Modo Foco e Responsivo) */}
        {queryResults && (
          <div className="space-y-3">
            {isFocusMode && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs text-amber-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-amber-700" />
                  {t("query.focusModeActiveNotice") || "Modo Foco Ativo: filtros superiores ocultados para maximizar a área da tabela de resultados."}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFocusMode(false)}
                  className="font-bold underline hover:text-amber-950"
                >
                  {t("query.restorePanels") || "Restaurar painéis"}
                </button>
              </div>
            )}

            <ResultTable
              queryResults={queryResults}
              setQueryResults={setQueryResults}
              columnsInfo={columnsInfo}
              setSelectedRow={handleRowClick}
              selectedRow={selectedRow}
              setModalFetchOpen={setModalFetchOpen}
              modalFetchOpen={modalFetchOpen}
              responseModal={responseModal}
              setResponseModal={setResponseModal}
              optionModalTable={optionModalTable}
              setOptionModalTable={setOptionModalTable}
              onOpenBulkEdit={handleOpenBulkEdit}
              onOpenSelectedEdit={handleOpenSelectedEdit}
            />
          </div>
        )}

        {/* Row Details Modal */}
        {modalOpenEdit && (
          <RowDetailsModal
            isOpen={modalOpenEdit}
            onClose={() => {
              setModalOpenEdit(false);
              setIsBulkEditMode(false);
              setSelectedRowsForEdit(null);
            }}
            row={selectedRow}
            informacaosOftables={queryResults?.tabela_coluna}
            onSave={handleRowUpdate}
            onSaveBulk={async (updatedRow) => {
              if (selectedRowsForEdit && selectedRowsForEdit.rows_primary_keys.length > 0) {
                await handleUpdateSelected(updatedRow, selectedRowsForEdit);
                showToast(
                  t("query.selectedRecordsUpdated", { count: selectedRowsForEdit.indices.length }) ||
                  `${selectedRowsForEdit.indices.length} registros selecionados foram atualizados com sucesso!`
                );
              } else {
                await handleBulkUpdate(updatedRow);
                showToast(t("query.allRecordsUpdated") || "Todos os registros foram atualizados com sucesso!");
              }
              setModalOpenEdit(false);
              setIsBulkEditMode(false);
              setSelectedRowsForEdit(null);
            }}
            isBulkEdit={isBulkEditMode}
            isSelectionBulk={!!selectedRowsForEdit}
            totalRows={
              selectedRowsForEdit
                ? selectedRowsForEdit.indices.length
                : (queryResults?.totalResults || queryResults?.preview?.length)
            }
            onDelete={handleDelete}
            setModalFetchOpen={setModalFetchOpen}
            modalFetchOpen={modalFetchOpen}
            responseModal={responseModal}
            setResponseModal={setResponseModal}
            optionModalTable={optionModalTable}
            setOptionModalTable={setOptionModalTable}
          />
        )}

        {/* Modal de Escolha de Tabelas para Fetch */}
        <SelectTablesModal
          isOpen={modalFetchOpen}
          tables={incompleteTablesToSelect}
          isLoading={loadingFields}
          onClose={() => setModalFetchOpen(false)}
          onConfirm={(confirm) => {
            handleConfirmFetchModal(confirm, optionModalTable);
          }}
          variant="primary"
          title={t("query.incompleteDataTitle") || "Dados Incompletos"}
          message={t("query.incompleteDataMsg") || "Quais tabelas você deseja buscar os dados completos?"}
          confirmText={t("query.fetchSelected") || "Buscar Selecionadas"}
          cancelText={t("query.ignoreAndOpen") || "Ignorar e Abrir"}
        />

      </main>

      {/* DRAWER LATERAL DE HISTÓRICO DE CONSULTAS (Deslizante & Ocultável para Dar Espaço) */}
      <QueryHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reloadSignal={historySignal}
        onRerun={handleRerunFromHistory}
        onLoad={handleLoadFromHistory}
        onPickTable={handlePickTableFromHistory}
        onHistoryCountChange={setHistoryCount}
      />

      {/* BOTÃO FLUTUANTE DE HISTÓRICO (Acesso Rápido em Qualquer Posição do Scroll) */}
      {!isHistoryOpen && (
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="fixed bottom-6 right-6 z-30 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group focus:ring-4 focus:ring-blue-500/30"
          title={t("query.openHistoryTitle") || "Abrir Histórico de Consultas (Ctrl + H)"}
        >
          <History className="w-5 h-5 group-hover:rotate-[-20deg] transition-transform" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs">
              {historyCount}
            </span>
          )}
        </button>
      )}

    </div>
  );
};

export default ConsultaPage;