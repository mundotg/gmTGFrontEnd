// app/component/QueryBuilder-aux.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Play, ChevronDown } from "lucide-react";
import FiltroCondicaoItem from "./FiltroCondicaoItem";
import {
  AdvancedJoinOption,
  CondicaoFiltro,
  DistinctList,
  MetadataTableResponse,
  MultiOrderByOption,
  QueryBuilderProps,
} from "@/types";
import { JoinOptions } from "./JoinOptions";
import { OrderByOptions } from "./OrderByOptions";
import { TableSelectModal } from "./BuildQueryComponent/TableSelectModal";
import usePersistedState from "@/hook/localStoreUse";
import { useGenerateSQL } from "./BuildQueryComponent/useGenerateSQL";
import { useExecuteQuery } from "./BuildQueryComponent/onExecuteQuery";
import HeaderBuild from "./BuildQueryComponent/headerQueryBuild";
import NotificationSystem, { useNotifications } from "./NotificationComponent";
import { sanitizeAdvancedConditions } from "@/util/query_build_util/validateColumnExistence";

// =======================
// ✅ NOVO: tipos do “payload escolhido”
// =======================
export type SelectedColumnItem = {
  table: string;
  column: string;
  full: string;    // "table.column"
  alias?: string;  // alias da tabela (se houver)
};

export type QueryBuilderSelectionPayload = {
  sql: string;
  baseTable: string | null;
  tables: string[];

  // seleção
  selected: SelectedColumnItem[];
  rawSelect: string[];
  aliasTables: Record<string, string>;
  distinct: DistinctList;

  // filtros e opções
  conditions: CondicaoFiltro[];
  advancedConditions: Record<string, AdvancedJoinOption>;
  orderBy: MultiOrderByOption;
};

type Props = QueryBuilderProps & {
  // ✅ NOVO: callback para devolver o que o user escolheu
  onSelectionChange?: (payload: QueryBuilderSelectionPayload) => void;
};

// helpers
// const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

function parseFullColumn(full: string) {
  const raw = String(full ?? "").trim();
  const idx = raw.indexOf(".");
  if (idx <= 0) return { table: "", column: "", full: raw };
  return { table: raw.slice(0, idx).trim(), column: raw.slice(idx + 1).trim(), full: raw };
}

function columnExists(columns: MetadataTableResponse[], full: string) {
  const { table, column } = parseFullColumn(full);
  if (!table || !column) return false;
  const t = columns.find((x) => x.table_name === table);
  return !!t?.colunas?.some((c) => c.nome === column);
}

const QueryBuilderAux: React.FC<Props> = ({
  columns = [],
  onExecuteQuery,
  setAliasTables,
  aliasTables,
  title = "Construtor de Consultas",
  isExecuting = false,
  maxConditions = 25,
  showLogicalOperators = true,
  className = "",
  table_list,
  setTable_list,
  select,
  setSelect,
  removerCacheLocalStorage,

  // ✅ NOVO
  onSelectionChange,
}) => {
  // ---------------- STATES ----------------
  const [conditions, setConditions] = usePersistedState<CondicaoFiltro[]>("query_conditions", []);
  const [orderBy, setOrderBy] = usePersistedState<MultiOrderByOption>(
    "query_orderby",
    columns.length && columns[0].colunas.length
      ? [
          {
            column: `${columns[0].table_name}.${columns[0].colunas[0].nome}`,
            direction: "ASC",
          },
        ]
      : []
  );

  const [advancedConditions, setAdvancedConditions] = usePersistedState<Record<string, AdvancedJoinOption>>(
    "query_joins",
    {}
  );

  const [distinctList, setDistinctList] = usePersistedState<DistinctList>("query_distinct", {
    useDistinct: false,
    distinct_columns: [],
  });

  const [hydrated, setHydrated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ---------------- DERIVED ----------------
  const lengthCondition = conditions.length;

  const validConditionsCount = useMemo(
    () =>
      conditions.filter(
        (c) =>
          c.column &&
          (c.value?.toString().trim() || c.operator === "IS NULL" || c.operator === "IS NOT NULL")
      ).length,
    [conditions]
  );

  const sqlPreview = useGenerateSQL({
    columns,
    select,
    distinctList,
    table_list,
    advancedConditions,
    conditions,
    orderBy,
  });

  const { notifications, addNotification, removeNotification, clearAllNotifications } = useNotifications();

  const { executeQuery } = useExecuteQuery({
    conditions,
    distinctList,
    onExecuteQuery,
    orderBy,
    aliasTables,
    table_list,
    select,
    setSelect,
    columns,
    advancedConditions,
    setAdvancedConditions,
  });

  // =======================
  // ✅ NOVO: seleção normalizada + callback para devolver tudo
  // =======================
  const selectedNormalized: SelectedColumnItem[] = useMemo(() => {
    return (select ?? [])
      .map((full) => {
        const p = parseFullColumn(full);
        const alias = aliasTables?.[p.table] || undefined;
        return { ...p, alias };
      })
      .filter((x) => x.table && x.column);
  }, [select, aliasTables]);

  useEffect(() => {
    if (!onSelectionChange) return;

    onSelectionChange({
      sql: sqlPreview,
      baseTable: table_list?.[0] ?? null,
      tables: table_list ?? [],
      selected: selectedNormalized,
      rawSelect: select ?? [],
      aliasTables: aliasTables ?? {},
      distinct: distinctList,
      conditions,
      advancedConditions,
      orderBy,
    });
  }, [
    onSelectionChange,
    sqlPreview,
    table_list,
    selectedNormalized,
    select,
    aliasTables,
    distinctList,
    conditions,
    advancedConditions,
    orderBy,
  ]);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => setHydrated(true), []);

  // ✅ evita “ficar com select inválido” quando muda tabelas/colunas
  useEffect(() => {
    if (!hydrated) return;
    if (!columns.length) return;

    const nextSelect = (select ?? []).filter((s) => columnExists(columns, s));
    if (nextSelect.length !== (select ?? []).length) {
      setSelect(nextSelect);
      addNotification(
        "info",
        "Seleção Atualizada",
        "Algumas colunas foram removidas porque não existem mais na estrutura atual."
      );
    }

    const nextDistinct = (distinctList?.distinct_columns ?? []).filter((s) => columnExists(columns, s));
    if (nextDistinct.length !== (distinctList?.distinct_columns ?? []).length) {
      setDistinctList({ ...distinctList, distinct_columns: nextDistinct });
      addNotification(
        "info",
        "Distinct Atualizado",
        "Algumas colunas DISTINCT foram removidas porque não existem mais na estrutura atual."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, table_list, hydrated]);

  // validar joins quando as tabelas mudam
  useEffect(() => {
    if (!hydrated || !table_list.length) return;

    setAdvancedConditions((prevCond) => {
      const { newCond, removedJoins, changed } = sanitizeAdvancedConditions(
        prevCond,
        columns,
        table_list[0],
        table_list
      );

      if (removedJoins.length > 0) {
        addNotification(
          "info",
          "JOINs Removidos",
          `JOINs removidos por ficarem sem condições ON: ${removedJoins.join(", ")}.`
        );
      }

      return changed ? newCond : prevCond;
    });
  }, [table_list, setAdvancedConditions, hydrated, addNotification, columns]);

  // ---------------- HANDLERS ----------------
  const addCondition = useCallback(() => {
    if (lengthCondition >= maxConditions) {
      addNotification("warning", "Limite Atingido", `Máximo de ${maxConditions} condições.`);
      return;
    }

    if (!columns.length || !columns[0]?.colunas?.length) {
      addNotification("error", "Sem Colunas", "Não há colunas disponíveis para condição.");
      return;
    }

    const table = columns[0];
    const col = table.colunas[0];

    const newCondition: CondicaoFiltro = {
      table_name_fil: table.table_name,
      column: col.nome,
      operator: "=",
      value: "",
      logicalOperator: lengthCondition > 0 ? "AND" : undefined,
      column_type: col.tipo,
      length: col.length || 10,
      is_nullable: col.is_nullable,
    };

    setConditions((prev) => [...prev, newCondition]);
    addNotification("success", "Condição Adicionada", "Nova condição adicionada.");
  }, [columns, lengthCondition, maxConditions, setConditions, addNotification]);

  const updateCondition = useCallback(
    (index: number, field: keyof CondicaoFiltro, value: string) => {
      setConditions((prev) =>
        prev.map((condition, i) => {
          if (i !== index) return condition;

          let updated: CondicaoFiltro = { ...condition, [field]: value };

          if (field === "table_name_fil" || field === "column") {
            const tableName = field === "table_name_fil" ? value : condition.table_name_fil;
            const columnName = field === "column" ? value : condition.column;

            const table = columns.find((t) => t.table_name === tableName);
            const colMeta = table?.colunas.find((c) => c.nome === columnName);

            if (colMeta) {
              updated = {
                ...updated,
                column_type: colMeta.tipo,
                length: colMeta.length || 10,
                is_nullable: colMeta.is_nullable,
              };
            }
          }

          if (field === "operator" && (value === "IS NULL" || value === "IS NOT NULL")) {
            updated.value = "null";
          }

          if (
            condition.operator &&
            (condition.operator === "IS NULL" || condition.operator === "IS NOT NULL") &&
            field === "operator" &&
            !(value === "IS NULL" || value === "IS NOT NULL")
          ) {
            updated.value = "";
          }

          return updated;
        })
      );
    },
    [columns, setConditions]
  );

  const removeCondition = useCallback(
    (index: number) => {
      setConditions((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        if (updated.length > 0 && updated[0].logicalOperator) {
          updated[0] = { ...updated[0], logicalOperator: undefined };
        }
        return updated;
      });
      addNotification("info", "Condição Removida", "Condição removida.");
    },
    [setConditions, addNotification]
  );

  const onBaseTableChange = useCallback(
    (newBaseTable: string) => {
      if (newBaseTable === table_list[0]) return;

      if (!table_list.includes(newBaseTable)) {
        addNotification("error", "Tabela Não Encontrada", `A tabela "${newBaseTable}" não existe.`);
        return;
      }

      setTable_list([newBaseTable, ...table_list.filter((t) => t !== newBaseTable)]);
      addNotification("success", "Tabela Base Alterada", `Tabela base: "${newBaseTable}"`);
    },
    [table_list, setTable_list, addNotification]
  );

  const clearAllConditions = useCallback(() => {
    setConditions([]);
    addNotification("info", "Condições Limpas", "Condições removidas.");
  }, [setConditions, addNotification]);

  const clearCache = useCallback(() => {
    setConditions([]);
    setAdvancedConditions({});
    setSelect([]);
    setDistinctList({ useDistinct: false, distinct_columns: [] });
    removerCacheLocalStorage?.();
    addNotification("success", "Cache Limpo", "Tudo foi resetado.");
  }, [setConditions, setSelect, setAdvancedConditions, setDistinctList, removerCacheLocalStorage, addNotification]);

  // ---------------- RENDER ----------------
  if (!hydrated) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-4 sm:p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-4 sm:p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhuma coluna disponível</h4>
          <p className="text-gray-500">Configure tabelas/colunas para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${className}`}>
      <HeaderBuild
        title={title}
        lengthCondition={conditions.length}
        maxConditions={maxConditions}
        conditions={conditions}
        select={select}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        setShowTableModal={setShowTableModal}
        addCondition={addCondition}
        clearAllConditions={clearAllConditions}
        LimparCacheLocalStorage={clearCache}
      />

      {notifications.length > 0 && (
        <div className="border-b">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Notificações ({notifications.length})</h4>
              {notifications.length > 1 && (
                <button onClick={clearAllNotifications} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Limpar todas
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <NotificationSystem
                notifications={notifications}
                onRemove={removeNotification}
                onClearAll={clearAllNotifications}
                position="inline"
                showHeader={false}
                maxHeight="max-h-48"
              />
            </div>
          </div>
        </div>
      )}

      {showTableModal && (
        <TableSelectModal
          allTables={[
            ...new Set(columns.flatMap((s) => s.colunas.map((c) => `${s.table_name}.${c.nome}`))),
          ]}
          initialAliases={aliasTables}
          selected={select}
          onClose={() => setShowTableModal(false)}
          onSave={(items, useDistinct, cols, aliases) => {
            setSelect(items || []);
            setDistinctList({ useDistinct: !!useDistinct, distinct_columns: cols || [] });
            setAliasTables(aliases || {});
            addNotification("success", "Colunas Atualizadas", `${items?.length || 0} colunas selecionadas.`);
          }}
        />
      )}

      {showPreview && (
        <div className="bg-gray-50 border-b p-3 sm:p-4">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap">{sqlPreview || "Nenhuma condição válida"}</pre>
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {lengthCondition === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <button
              onClick={addCondition}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar Condição
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 lg:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
            {conditions.map((condition, index) => (
              <FiltroCondicaoItem
                key={`condition-${index}-${condition.table_name_fil}-${condition.column}`}
                index={index}
                condition={condition}
                columns={columns}
                showLogicalOperator={showLogicalOperators && index > 0}
                updateCondition={updateCondition}
                removeCondition={removeCondition}
              />
            ))}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {isMobile && (
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 border"
            >
              <span>Opções Avançadas</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? "rotate-180" : ""}`} />
            </button>
          )}

          <div className={`${isMobile && !showAdvancedOptions ? "hidden" : "block"} space-y-3 sm:space-y-4`}>
            {columns.length > 1 && (
              <div className="border p-3 sm:p-4 rounded-lg bg-gray-50">
                <div className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm overflow-x-auto">
                  <JoinOptions
                    advancedConditions={advancedConditions}
                    setAdvancedConditions={setAdvancedConditions}
                    columns={columns}
                    addNotification={addNotification}
                    table_list={table_list}
                    onBaseTableChange={onBaseTableChange}
                  />
                </div>
              </div>
            )}

            <div className="border p-3 sm:p-4 rounded-lg bg-gray-50">
              <div className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm overflow-x-auto">
                <OrderByOptions columns={columns} orderBy={orderBy} setOrderBy={setOrderBy} />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Debug simples do que o user escolheu */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-xs text-gray-600 mb-2">
            Colunas selecionadas: <strong>{(select ?? []).length}</strong>
          </div>
          <div className="text-xs font-mono bg-white border rounded p-2 max-h-32 overflow-auto">
            {(select ?? []).map((s) => (
              <div key={s} className="truncate">{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-gray-600">
          {validConditionsCount} de {lengthCondition} condição(ões) válida(s)
        </div>

        <button
          onClick={executeQuery}
          disabled={isExecuting}
          className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          {isExecuting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Executar Consulta
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(QueryBuilderAux);