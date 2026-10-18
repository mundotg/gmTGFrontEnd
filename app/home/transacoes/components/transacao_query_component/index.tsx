"use client";

import React, {
  useState,
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Code,
  Play,
  CheckCircle2,
  AlertCircle,
  Database,
  Table as TableIcon,
  Columns,
  Sparkles,
  Sliders,
  Trash2,
  ArrowRight,
  Copy,
  Check,
  Search,
  RefreshCw,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

import type { DBConnection, DBStructure } from "@/types/db-structure";
import type { Option } from "@/app/task/components/select_Component";
import type { ColumnMapping, TableMapping, QueryImpact } from "@/app/task/types/transfer-types";
import type { MetadataTableResponse, QueryPayload } from "@/types";
import QueryBuilderAux from "@/app/component/QueryBuilder-aux";
import ImpactPredictorCard from "@/app/component/ImpactPredictorCard";
import api from "@/context/axioCuston";

interface Step2TablesQueryProps {
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>; // { sourceTableId: targetTableId }
  setSelectedTables: Dispatch<SetStateAction<Record<string, string>>>;
  tableMappings?: Record<string, TableMapping>;
  setTableMappings?: Dispatch<SetStateAction<Record<string, TableMapping>>>;
  onSelectAll?: (all: Record<string, string>) => void;
  onClearSelection?: () => void;
  listTarget?: Option[] | Map<string, string>;
  onCloseQueryMode?: () => void;
}

interface PreviewColumnConfig {
  originalName: string;
  targetName: string;
  type: string;
  enabled: boolean;
}

export const Step2QueryTables: React.FC<Step2TablesQueryProps> = ({
  sourceConnection,
  targetConnection,
  selectedTables,
  setSelectedTables,
  tableMappings = {},
  setTableMappings,
  listTarget,
  onCloseQueryMode,
}) => {
  // --- Modos de Edição: SQL Livre ou Visual Builder ---
  const [activeTab, setActiveTab] = useState<"sql" | "builder">("sql");

  // --- Seleção de Tabela Base ---
  const [selectedSourceTable, setSelectedSourceTable] = useState<string>(() => {
    return sourceConnection?.structures?.[0]?.table_name || "";
  });

  // --- Query e Editor ---
  const [queryText, setQueryText] = useState<string>("");
  const isMongoSource = useMemo(() => {
    return (
      sourceConnection?.type?.toLowerCase() === "mongodb" ||
      sourceConnection?.type?.toLowerCase().includes("mongo")
    );
  }, [sourceConnection?.type]);

  // Se a query estiver vazia e mudar a tabela base, inicializa com template útil
  useEffect(() => {
    if (!queryText.trim() && selectedSourceTable) {
      if (isMongoSource) {
        setQueryText(`{\n  // Filtro MongoDB (ex: {"status": "ativo"})\n}`);
      } else {
        setQueryText(`SELECT *\nFROM "${selectedSourceTable}"\nWHERE 1=1;`);
      }
    }
  }, [selectedSourceTable, isMongoSource, queryText]);

  // --- Destino ---
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>("");
  const [customTargetTableName, setCustomTargetTableName] = useState<string>("");
  const [isCreatingNewTarget, setIsCreatingNewTarget] = useState<boolean>(false);

  // --- Preview & Teste ---
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<{
    columns: string[];
    rows: Record<string, any>[];
    total: number;
    error?: string;
  } | null>(null);
  const [previewDurationMs, setPreviewDurationMs] = useState<number | null>(null);
  const [columnConfigs, setColumnConfigs] = useState<PreviewColumnConfig[]>([]);

  // --- Dry-Run & Impact Predictor ---
  const [impactResult, setImpactResult] = useState<QueryImpact | null>(null);
  const [isImpactLoading, setIsImpactLoading] = useState<boolean>(false);

  // --- Status & Feedback ---
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // --- Query Builder Auxiliar States ---
  const [builderTableList, setBuilderTableList] = useState<string[]>([]);
  const [builderSelectColumns, setBuilderSelectColumns] = useState<string[]>([]);
  const [builderAliasTables, setBuilderAliasTables] = useState<Record<string, string>>({});
  const [builderLoading, setBuilderLoading] = useState(false);

  // Mapa de estruturas de origem e destino
  const sourceTableMap = useMemo(() => {
    const map = new Map<string, DBStructure>();
    for (const t of sourceConnection?.structures ?? []) {
      map.set(String(t.table_name), t);
    }
    return map;
  }, [sourceConnection?.structures]);

  const targetTableMap = useMemo(() => {
    const map = new Map<string, DBStructure>();
    for (const t of targetConnection?.structures ?? []) {
      map.set(String(t.id), t);
      map.set(String(t.table_name).toLowerCase(), t);
    }
    return map;
  }, [targetConnection?.structures]);

  // Opções de tabelas de destino
  const targetOptions: Option[] = useMemo(() => {
    if (targetConnection?.structures?.length) {
      return targetConnection.structures.map((t) => ({
        value: String(t.id),
        label: `${t.table_name} (id: ${t.id})`,
      }));
    }
    if (listTarget instanceof Map) {
      return Array.from(listTarget.entries()).map(([name, id]) => ({
        value: String(id),
        label: name,
      }));
    }
    if (Array.isArray(listTarget)) {
      return listTarget.map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
      );
    }
    return [];
  }, [targetConnection?.structures, listTarget]);

  // Auto-selecionar tabela de destino caso já exista com mesmo nome
  useEffect(() => {
    if (!selectedSourceTable) return;
    const match = targetTableMap.get(selectedSourceTable.toLowerCase());
    if (match) {
      setSelectedTargetTableId(String(match.id));
      setIsCreatingNewTarget(false);
    } else {
      setSelectedTargetTableId("");
      setIsCreatingNewTarget(true);
      setCustomTargetTableName(selectedSourceTable);
    }
  }, [selectedSourceTable, targetTableMap]);

  // Metadata para QueryBuilderAux
  const columnsInfo: MetadataTableResponse[] = useMemo(() => {
    return (sourceConnection?.structures ?? []).map((tabela) => ({
      message: "OK",
      executado_em: new Date().toISOString(),
      connection_id: sourceConnection?.id ?? 0,
      schema_name: tabela.schema_name ?? "",
      table_name: tabela.table_name,
      total_colunas: tabela.fields?.length ?? 0,
      colunas: (tabela.fields ?? []).map((field) => ({
        nome: field.name,
        tipo: field.type,
        is_nullable: field.is_nullable ?? false,
        is_primary_key: field.is_primary_key ?? false,
        is_foreign_key: field.is_foreign_key ?? false,
        is_auto_increment: field.is_auto_increment ?? false,
        referenced_table: field.referenced_table ?? null,
        field_references: field.referenced_field ?? null,
        is_unique: field.is_unique ?? false,
        default: field.default_value ?? null,
        comentario: field.comment ?? null,
        length: field.length ?? null,
        enum_valores_encontrados: field.enum_values ?? [],
        on_delete_action: field.fk_on_delete?.toString?.(),
        on_update_action: field.fk_on_update?.toString?.(),
      })),
    }));
  }, [sourceConnection?.structures, sourceConnection?.id]);

  // ============================================================
  //  Testar & Pré-visualizar Consulta
  // ============================================================
  const handleTestQuery = useCallback(async () => {
    const q = queryText.trim();
    if (!q) {
      setPreviewResult({
        columns: [],
        rows: [],
        total: 0,
        error: "Por favor, digite ou gere uma consulta SQL antes de testar.",
      });
      return;
    }

    if (!sourceConnection?.id) {
      setPreviewResult({
        columns: [],
        rows: [],
        total: 0,
        error: "Conexão de origem não especificada.",
      });
      return;
    }

    setIsPreviewLoading(true);
    setPreviewResult(null);
    setAppliedSuccess(null);
    const start = performance.now();

    // Avalia também o impacto em paralelo para dar feedback de performance
    api.post("/transfer/impact-query", {
      connection_id: sourceConnection.id,
      query: q,
      table_name: selectedSourceTable || undefined,
    }).then((resp) => {
      if (resp.data?.success && resp.data?.impact) {
        setImpactResult(resp.data.impact);
      }
    }).catch(() => {
      // silencioso
    });

    try {
      const res = await api.post("/transfer/preview-query", {
        connection_id: sourceConnection.id,
        query: q,
        table_name: selectedSourceTable || undefined,
        limit: 10,
      });

      const elapsed = Math.round(performance.now() - start);
      setPreviewDurationMs(elapsed);

      const data = res.data;
      if (data && data.success) {
        const cols: string[] = data.columns || [];
        const rows: Record<string, any>[] = data.rows || [];
        setPreviewResult({
          columns: cols,
          rows: rows,
          total: rows.length,
        });

        // Configura ou atualiza as colunas de mapeamento
        const targetStruct = selectedTargetTableId ? targetTableMap.get(selectedTargetTableId) : undefined;
        const targetFieldsByName = new Map(
          (targetStruct?.fields ?? []).map((f) => [f.name.toLowerCase(), f])
        );

        const configs: PreviewColumnConfig[] = cols.map((cName) => {
          const matchField = targetFieldsByName.get(cName.toLowerCase());
          return {
            originalName: cName,
            targetName: matchField ? matchField.name : cName,
            type: matchField ? matchField.type : "VARCHAR",
            enabled: true,
          };
        });

        setColumnConfigs(configs);
      } else {
        setPreviewResult({
          columns: [],
          rows: [],
          total: 0,
          error: data?.error || "Erro desconhecido ao executar pré-visualização.",
        });
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setPreviewDurationMs(elapsed);
      const msg = err?.response?.data?.detail || err?.message || String(err);
      setPreviewResult({
        columns: [],
        rows: [],
        total: 0,
        error: `Falha na execução: ${msg}`,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [queryText, sourceConnection?.id, selectedSourceTable, selectedTargetTableId, targetTableMap]);

  // Avaliação manual de impacto / Dry-Run
  const handleEvaluateImpact = useCallback(async () => {
    const q = queryText.trim();
    if (!q || !sourceConnection?.id) return;
    setIsImpactLoading(true);
    try {
      const res = await api.post("/transfer/impact-query", {
        connection_id: sourceConnection.id,
        query: q,
        table_name: selectedSourceTable || undefined,
      });
      if (res.data?.success && res.data?.impact) {
        setImpactResult(res.data.impact);
      }
    } catch (err: any) {
      console.warn("Falha ao avaliar impacto:", err);
    } finally {
      setIsImpactLoading(false);
    }
  }, [queryText, sourceConnection?.id, selectedSourceTable]);

  // ============================================================
  //  Aplicar Consulta à Transferência (Grava no TableMappings)
  // ============================================================
  const handleApplyToTransfer = useCallback(() => {
    const q = queryText.trim();
    if (!q) {
      alert("A consulta não pode estar vazia.");
      return;
    }

    const effectiveTargetName = isCreatingNewTarget
      ? customTargetTableName.trim() || selectedSourceTable || "query_table"
      : targetTableMap.get(selectedTargetTableId)?.table_name || selectedSourceTable;

    if (!effectiveTargetName) {
      alert("Por favor, selecione ou informe o nome da tabela de destino.");
      return;
    }

    const srcStruct = sourceTableMap.get(selectedSourceTable);
    const srcId = srcStruct ? String(srcStruct.id) : `query_${Date.now()}`;
    const tgtId = isCreatingNewTarget ? "0" : selectedTargetTableId || "0";

    // Cria as colunas mapeadas
    const colsMapped: ColumnMapping[] = columnConfigs.length
      ? columnConfigs.map((cfg, idx) => ({
          coluna_origen_name: cfg.originalName,
          coluna_distino_name: cfg.targetName,
          type_coluna_origem: cfg.type,
          type_coluna_destino: cfg.type,
          id_coluna_origem: idx + 1,
          id_coluna_destino: idx + 1,
          enabled: cfg.enabled,
        }))
      : (srcStruct?.fields ?? []).map((f) => ({
          coluna_origen_name: f.name,
          coluna_distino_name: f.name,
          type_coluna_origem: f.type,
          type_coluna_destino: f.type,
          id_coluna_origem: f.id,
          id_coluna_destino: 0,
          enabled: true,
        }));

    const newMapping: TableMapping = {
      tabela_name_origem: selectedSourceTable || `consulta_personalizada`,
      tabela_name_destino: effectiveTargetName,
      id_tabela_origen: srcStruct?.id ?? Math.floor(Math.random() * 900000 + 100000),
      id_tabela_destino: Number(tgtId) || 0,
      custom_query: q,
      colunas_relacionados_para_transacao: colsMapped,
    };

    // 1) Registra nas tabelas selecionadas
    setSelectedTables((prev) => ({
      ...prev,
      [srcId]: tgtId,
    }));

    // 2) Registra no tableMappings
    if (setTableMappings) {
      setTableMappings((prev) => ({
        ...prev,
        [srcId]: newMapping,
      }));
    }

    setAppliedSuccess(
      `Consulta aplicada com sucesso para "${effectiveTargetName}" (${colsMapped.filter((c) => c.enabled).length} colunas ativas)!`
    );
  }, [
    queryText,
    isCreatingNewTarget,
    customTargetTableName,
    selectedSourceTable,
    targetTableMap,
    selectedTargetTableId,
    sourceTableMap,
    columnConfigs,
    setSelectedTables,
    setTableMappings,
  ]);

  // Copiar consulta SQL
  const handleCopyQuery = useCallback(() => {
    if (!queryText) return;
    navigator.clipboard.writeText(queryText);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  }, [queryText]);

  // Inserir trecho no editor SQL
  const handleInsertSnippet = useCallback((snippet: string) => {
    setQueryText((prev) => `${prev.trim()}\n${snippet}`);
  }, []);

  // Lista de mapeamentos que já possuem consulta personalizada ativa
  const configuredQueryMappings = useMemo(() => {
    return Object.entries(tableMappings).filter(([_, m]) => Boolean(m.custom_query || m.where_clause));
  }, [tableMappings]);

  return (
    <div className="space-y-6">
      {/* Banner Superior com Troca de Modo */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-purple-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Transferência Avançada
              </span>
              <span className="text-xs text-purple-200/70 font-mono">
                {sourceConnection?.name} → {targetConnection?.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span>Transferência por Consulta Personalizada</span>
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
              Escreva queries SQL ou filtros MongoDB para filtrar registros, fazer joins entre tabelas e transferir
              apenas os dados desejados para o destino com validação ao vivo.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab("sql")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "sql"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Editor SQL</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("builder")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "builder"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Construtor Visual</span>
              </button>
            </div>

            {onCloseQueryMode && (
              <button
                type="button"
                onClick={onCloseQueryMode}
                className="px-3 py-2 text-xs font-semibold text-purple-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors border border-white/10"
              >
                Voltar à Lista Visual
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Consultas já configuradas para migração */}
      {configuredQueryMappings.length > 0 && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>{configuredQueryMappings.length} Consulta(s) Configurada(s) para Esta Transferência:</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {configuredQueryMappings.map(([tableId, m]) => (
              <div
                key={tableId}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-purple-100 shadow-2xs text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 truncate">{m.tabela_name_origem}</span>
                    <ArrowRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="font-mono font-bold text-purple-700 truncate">{m.tabela_name_destino}</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 truncate mt-0.5">
                    {m.custom_query ? m.custom_query.replace(/\s+/g, " ") : `WHERE: ${m.where_clause}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTables((prev) => {
                      const { [tableId]: _, ...rest } = prev;
                      return rest;
                    });
                    if (setTableMappings) {
                      setTableMappings((prev) => {
                        const { [tableId]: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Remover consulta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 1: EDITOR DE QUERY LIVRE
         ============================================================ */}
      {activeTab === "sql" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Barra de Ferramentas do Editor */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <TableIcon className="w-4 h-4 text-blue-600" />
                  <span>Tabela Base de Origem:</span>
                </label>
                <select
                  value={selectedSourceTable}
                  onChange={(e) => {
                    setSelectedSourceTable(e.target.value);
                    if (e.target.value) {
                      setQueryText(`SELECT *\nFROM "${e.target.value}"\nWHERE 1=1;`);
                    }
                  }}
                  className="text-xs font-mono font-semibold bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {(sourceConnection?.structures ?? []).map((t) => (
                    <option key={t.id} value={t.table_name}>
                      {t.table_name} ({t.fields?.length || 0} campos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões de Ações Rápidas do Editor */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyQuery}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
                  title="Copiar consulta"
                >
                  {copiedQuery ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuery ? "Copiado!" : "Copiar"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleInsertSnippet(
                      `-- Filtro de exemplo:\nWHERE data_criacao >= '2026-01-01'`
                    )
                  }
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-purple-700 transition-colors"
                >
                  + Filtro WHERE
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleInsertSnippet(
                      `-- Ordenação de exemplo:\nORDER BY id DESC\nLIMIT 500`
                    )
                  }
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-purple-700 transition-colors"
                >
                  + Limite / Ordem
                </button>
              </div>
            </div>

            {/* Sugestões de Campos da Tabela Selecionada (Pills clicáveis) */}
            {selectedSourceTable && (
              <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
                  Colunas:
                </span>
                {(sourceTableMap.get(selectedSourceTable)?.fields ?? []).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setQueryText((prev) => `${prev} "${f.name}"`);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-[11px] font-mono text-gray-700 transition-colors flex-shrink-0"
                    title={`Inserir campo ${f.name} (${f.type})`}
                  >
                    +{f.name}
                  </button>
                ))}
              </div>
            )}

            {/* Área do Editor */}
            <div className="relative">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Escreva sua consulta SQL aqui (ex: SELECT id, nome, email FROM usuarios WHERE ativo = 1)..."
                rows={9}
                className="w-full p-4 font-mono text-sm bg-gray-950 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y selection:bg-purple-800 selection:text-white"
                spellCheck={false}
              />
            </div>

            {/* Barra de Execução & Teste */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>
                  A query será testada diretamente na conexão <strong>{sourceConnection?.name}</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleEvaluateImpact}
                  disabled={isImpactLoading || !queryText.trim()}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                  title="Executa EXPLAIN no banco e analisa risco de Sequential Scan sem ler dados"
                >
                  {isImpactLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>Avaliar Impacto (Dry-Run)</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestQuery}
                  disabled={isPreviewLoading || !queryText.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executando Teste...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Testar e Pré-visualizar (10 linhas)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: CONSTRUTOR VISUAL (QUERYBUILDER)
         ============================================================ */}
      {activeTab === "builder" && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-purple-900">
              <Sliders className="w-4 h-4 text-purple-700 flex-shrink-0" />
              <span>
                Use os controles visuais abaixo para construir filtros e joins. Quando terminar, você pode testar e
                aplicar diretamente à migração!
              </span>
            </div>
          </div>

          <QueryBuilderAux
            columns={columnsInfo}
            table_list={builderTableList}
            setTable_list={setBuilderTableList}
            onExecuteQuery={async (payload: QueryPayload) => {
              setBuilderLoading(true);
              try {
                // Ao executar no builder, carrega a query no editor e roda o preview
                const generatedSql = payload.select?.length
                  ? `SELECT ${payload.select.join(", ")} FROM "${payload.baseTable || builderTableList[0]}"`
                  : `SELECT * FROM "${payload.baseTable || builderTableList[0]}"`;
                setQueryText(generatedSql);
                setActiveTab("sql");
                setTimeout(() => handleTestQuery(), 100);
              } finally {
                setBuilderLoading(false);
              }
            }}
            title={`Construtor: ${sourceConnection?.name}`}
            maxConditions={25}
            showLogicalOperators
            setSelect={setBuilderSelectColumns}
            select={builderSelectColumns}
            setAliasTables={setBuilderAliasTables}
            aliasTables={builderAliasTables}
            isExecuting={builderLoading}
          />
        </div>
      )}

      {/* ============================================================
          DIAGNÓSTICO DE IMPACTO / DRY-RUN PREDICTOR
         ============================================================ */}
      {(impactResult || isImpactLoading) && (
        <div className="pt-2">
          <ImpactPredictorCard
            impact={impactResult}
            loading={isImpactLoading}
            onClose={() => setImpactResult(null)}
          />
        </div>
      )}

      {/* ============================================================
          RESULTADOS DO TESTE / PRÉ-VISUALIZAÇÃO
         ============================================================ */}
      {previewResult && (
        <div className="space-y-4 pt-2">
          {previewResult.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-red-800">
                <strong className="block font-bold">Erro ao executar consulta na base de dados:</strong>
                <p className="mt-1 font-mono text-xs">{previewResult.error}</p>
                <p className="mt-2 text-xs text-red-600">
                  Verifique a sintaxe SQL, nomes de tabelas e colunas entre aspas se houver maiúsculas.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      Pré-visualização dos Dados ({previewResult.total} registros retornados)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Tempo de resposta: {previewDurationMs}ms • {previewResult.columns.length} colunas identificadas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {previewResult.columns.map((col) => (
                    <span
                      key={col}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabela de Preview */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0 border-b border-gray-200">
                    <tr>
                      {previewResult.columns.map((col) => (
                        <th key={col} className="px-3 py-2 font-bold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {previewResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50/70 transition-colors">
                        {previewResult.columns.map((col) => {
                          const val = row[col];
                          return (
                            <td key={col} className="px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                              {val === null || val === undefined ? (
                                <span className="text-gray-400 italic font-sans text-[10px]">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ============================================================
                  CONFIGURAÇÃO DA TABELA DE DESTINO E MAPEAMENTO DE COLUNAS
                 ============================================================ */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Configurar Destino no Banco: {targetConnection?.name}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opção A: Tabela Existente */}
                  <div
                    onClick={() => setIsCreatingNewTarget(false)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      !isCreatingNewTarget
                        ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-gray-800 mb-2">
                      <input
                        type="radio"
                        checked={!isCreatingNewTarget}
                        onChange={() => setIsCreatingNewTarget(false)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Inserir em Tabela Existente no Destino</span>
                    </div>

                    <select
                      value={selectedTargetTableId}
                      onChange={(e) => setSelectedTargetTableId(e.target.value)}
                      disabled={isCreatingNewTarget}
                      className="w-full text-xs font-mono bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      <option value="">-- Selecione a tabela de destino --</option>
                      {targetOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Opção B: Criar Nova Tabela */}
                  <div
                    onClick={() => setIsCreatingNewTarget(true)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isCreatingNewTarget
                        ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-gray-800 mb-2">
                      <input
                        type="radio"
                        checked={isCreatingNewTarget}
                        onChange={() => setIsCreatingNewTarget(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Criar Nova Tabela / Coleção no Destino</span>
                    </div>

                    <input
                      type="text"
                      value={customTargetTableName}
                      onChange={(e) => setCustomTargetTableName(e.target.value)}
                      disabled={!isCreatingNewTarget}
                      placeholder="Nome da nova tabela (ex: clientes_ativos)"
                      className="w-full text-xs font-mono bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Grade de Mapeamento de Colunas Detectadas */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Mapeamento dos Campos da Consulta → Destino</span>
                    <span className="text-gray-500">
                      {columnConfigs.filter((c) => c.enabled).length} de {columnConfigs.length} campos ativos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {columnConfigs.map((cfg, cIdx) => (
                      <div
                        key={cfg.originalName}
                        className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                          cfg.enabled ? "bg-white border-gray-200 shadow-2xs" : "bg-gray-50 border-gray-200 opacity-60"
                        }`}
                      >
                        <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setColumnConfigs((prev) =>
                                prev.map((item, idx) => (idx === cIdx ? { ...item, enabled: checked } : item))
                              );
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                          />
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-gray-900 truncate block">
                              {cfg.originalName}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              → {cfg.targetName} ({cfg.type})
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão de Aplicação */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {appliedSuccess && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{appliedSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyToTransfer}
                    className="ml-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Aplicar Consulta para Transferência</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step2QueryTables;