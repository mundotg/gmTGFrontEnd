"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Play, ChevronDown, Shield } from "lucide-react";
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
import { GenericSelectModal } from "./BuildQueryComponent/TableSelectModal";
import usePersistedState from "@/hook/localStoreUse";
import { useGenerateSQL } from "./BuildQueryComponent/useGenerateSQL";
import { useExecuteQuery } from "./BuildQueryComponent/onExecuteQuery";
import HeaderBuild from "./BuildQueryComponent/headerQueryBuild";
import NotificationSystem, { useNotifications } from "./NotificationComponent";
import { sanitizeAdvancedConditions } from "@/util/query_build_util/validateColumnExistence";
import { useI18n } from "@/context/I18nContext"; // 🔹 Importado
import { useSession } from "@/context/SessionContext";

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  columns = [],
  onExecuteQuery,
  setAliasTables,
  aliasTables,
  title, // O default agora será tratado via i18n
  isExecuting = false,
  maxConditions = 25,
  showLogicalOperators = true,
  className = "",
  table_list,
  setTable_list,
  select,
  setSelect,
  removerCacheLocalStorage,
}) => {
  const { t } = useI18n(); // 🔹 Instanciado
  const { user } = useSession()

  // ---------------- STATES ----------------
  const [conditions, setConditions] = usePersistedState<CondicaoFiltro[]>(
    "query_conditions",
    []
  );
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
  const [distinctList, setDistinctList] = usePersistedState<DistinctList>(
    "query_distinct",
    { useDistinct: false, distinct_columns: [] }
  );

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

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !table_list.length) return;

    // 🔹 Validar condições simples
    setConditions((prevConditions) => {
      if (!prevConditions.length) return prevConditions;

      const validConditions = prevConditions.filter((condition) => {
        const tableExists = table_list.includes(condition.table_name_fil);
        if (!tableExists) return false;

        const table = columns.find((col) => col.table_name === condition.table_name_fil);
        const columnExists = table?.colunas.some((col) => col.nome === condition.column);
        return columnExists;
      });

      if (validConditions.length !== prevConditions.length) {
        const removedCount = prevConditions.length - validConditions.length;

        if (removedCount > 0) {
          addNotification(
            "info",
            t("builder.conditionsUpdated") || "Condições Atualizadas",
            (t("builder.invalidConditionsRemoved") || "{{count}} condição(ões) inválida(s) removida(s).").replace("{{count}}", String(removedCount))
          );
        }
        return validConditions;
      }
      return prevConditions;
    });

    // 🔹 Validar ORDER BY
    setOrderBy((prevOrder) => {
      if (!prevOrder.length) return prevOrder;

      const validorder = prevOrder.filter((order) => {
        const [tableName, columnName] = order.column.split(".");

        const tableExists = table_list.includes(tableName);
        if (!tableExists) return false;

        const table = columns.find((col) => col.table_name === tableName);
        const columnExists = table?.colunas.some((col) => col.nome === columnName);

        return columnExists;
      });

      if (validorder.length !== prevOrder.length) {
        const removedCount = prevOrder.length - validorder.length;
        if (removedCount > 0) {
          addNotification(
            "info",
            t("builder.conditionsUpdated") || "Condições Atualizadas",
            (t("builder.invalidOrderRemoved") || "{{count}} ordenação(ões) inválida(s) removida(s).").replace("{{count}}", String(removedCount))
          );
        }
        return validorder;
      }
      return prevOrder;
    });
  }, [columns, table_list, setConditions, hydrated, addNotification, setOrderBy, t]);

  // Validar joins quando as tabelas mudam
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
          t("builder.joinsRemoved") || "JOINs Removidos",
          `${t("builder.joinsRemovedDesc") || "Os seguintes JOINs foram removidos:"} ${removedJoins.join(", ")}.`
        );
      }

      return changed ? newCond : prevCond;
    });
  }, [table_list, setAdvancedConditions, hydrated, addNotification, columns, t]);

  // ---------------- HANDLERS ----------------
  const addCondition = useCallback(() => {
    if (lengthCondition >= maxConditions) {
      addNotification("warning", t("builder.limitReached") || "Limite Atingido", t("builder.limitMessage") || `Máximo de ${maxConditions} condições permitidas.`);
      return;
    }

    if (!columns.length || !columns[0]?.colunas?.length) {
      addNotification("error", t("builder.noColumns") || "Sem Colunas", t("builder.noColumnsMessage") || "Não há colunas disponíveis para adicionar condição.");
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

    addNotification("success", t("builder.conditionAdded") || "Condição Adicionada", t("builder.conditionAddedMessage") || "Nova condição de filtro adicionada.");
  }, [columns, lengthCondition, maxConditions, setConditions, addNotification, t]);

  const updateCondition = useCallback(
    (index: number, field: keyof CondicaoFiltro, value: string) => {
      setConditions((prevConditions) =>
        prevConditions.map((condition, i) => {
          if (i !== index) return condition;

          let updatedCondition: CondicaoFiltro = {
            ...condition,
            [field]: value,
          };

          if (field === "table_name_fil" || field === "column") {
            const targetTableName = field === "table_name_fil" ? value : condition.table_name_fil;
            const targetColumnName = field === "column" ? value : condition.column;

            const table = columns.find((t) => t.table_name === targetTableName);
            const columnMeta = table?.colunas.find((c) => c.nome === targetColumnName);

            if (columnMeta) {
              updatedCondition = {
                ...updatedCondition,
                column_type: columnMeta.tipo,
                length: columnMeta.length || 10,
                is_nullable: columnMeta.is_nullable,
              };
            }
          }

          if (field === "operator" && (value === "IS NULL" || value === "IS NOT NULL")) {
            updatedCondition.value = "null";
          }

          if (
            condition.operator &&
            (condition.operator === "IS NULL" || condition.operator === "IS NOT NULL") &&
            field === "operator" &&
            !(value === "IS NULL" || value === "IS NOT NULL")
          ) {
            updatedCondition.value = "";
          }

          if (field === "value" && (condition.operator === "Contém" || condition.operator === "Não Contém")) {

            const hasPrefix = value.startsWith("%");
            const hasSuffix = value.length > 1 && value.endsWith("%");

            let clean = value;

            // 🔥 remove só se existir prefixo
            if (hasPrefix) {
              clean = clean.slice(1);
            }

            // 🔥 remove só se existir sufixo
            if (hasSuffix) {
              clean = clean.slice(0, -1);
            }

            updatedCondition = {
              ...updatedCondition,
              value: clean,
              pattern: {
                prefix: hasPrefix ? "%" : "",
                suffix: hasSuffix ? "%" : "",
              }
            };

          }


          if (field === "operator" && (value === "Contém" || value === "Não Contém")) {
            updatedCondition = {
              ...updatedCondition,
              value: "", // continua limpo
              pattern: {
                prefix: "%",
                suffix: "%",
              },
            };
          }

          return updatedCondition;
        })
      );
    },
    [columns, setConditions]
  );

  const removeCondition = useCallback(
    (index: number) => {
      setConditions((prevConditions) => {
        const updated = prevConditions.filter((_, i) => i !== index);
        if (updated.length > 0 && updated[0].logicalOperator) {
          updated[0] = { ...updated[0], logicalOperator: undefined };
        }
        return updated;
      });
      addNotification("info", t("builder.conditionRemoved") || "Condição Removida", t("builder.conditionRemovedMessage") || "Condição de filtro removida.");
    },
    [setConditions, addNotification, t]
  );

  const onBaseTableChange = useCallback(
    (newBaseTable: string) => {
      if (newBaseTable === table_list[0]) {
        addNotification("info", t("builder.tableUnchanged") || "Tabela Base Inalterada", `"${newBaseTable}" já é a tabela base atual.`);
        return;
      }
      if (!table_list.includes(newBaseTable)) {
        addNotification("error", t("builder.tableNotFound") || "Tabela Não Encontrada", `A tabela "${newBaseTable}" não existe na lista.`);
        return;
      }
      const newTableOrder = [newBaseTable, ...table_list.filter((table) => table !== newBaseTable)];
      setTable_list(newTableOrder);
      addNotification("success", t("builder.tableChanged") || "Tabela Base Alterada", `Tabela base alterada para "${newBaseTable}".`);
    },
    [table_list, setTable_list, addNotification, t]
  );

  const clearAllConditions = useCallback(() => {
    setConditions([]);
    addNotification("info", t("builder.conditionsCleared") || "Condições Limpas", t("builder.conditionsClearedMessage") || "Todas as condições foram removidas.");
  }, [setConditions, addNotification, t]);

  const clearCache = useCallback(() => {
    setConditions([]);
    setAdvancedConditions({});
    setSelect([]);
    setDistinctList({ useDistinct: false, distinct_columns: [] });
    removerCacheLocalStorage?.();
    addNotification("success", t("builder.cacheCleared") || "Cache Limpo", t("builder.cacheClearedMessage") || "Todas as configurações resetadas.");
  }, [setConditions, setSelect, setAdvancedConditions, setDistinctList, removerCacheLocalStorage, addNotification, t]);

  // ---------------- RENDER ----------------
  if (!hydrated) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-600 font-medium">{t("common.loading") || "Carregando..."}</span>
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
        <div className="text-center py-10 text-gray-500">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-gray-900 mb-1">{t("builder.noColumnsAvailable") || "Nenhuma coluna disponível"}</h4>
          <p className="text-sm font-medium text-gray-500">{t("builder.noColumnsHint") || "Configure as tabelas e colunas para começar."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`} aria-label="Query Builder">
      {/* HEADER */}
      <HeaderBuild
        title={title || t("builder.title") || "Construtor de Consultas"}
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

      {/* NOTIFICAÇÕES */}
      {notifications.length > 0 && (
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-700">
                {t("builder.notifications") || "Notificações"} ({notifications.length})
              </h4>
              {notifications.length > 1 && (
                <button onClick={clearAllNotifications} className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors">
                  {t("actions.clearAll") || "Limpar todas"}
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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

      {/* MODAL DE TABELAS */}
      {showTableModal && (
        <GenericSelectModal
          title="Atribuir Permissões"
          useDistinct={distinctList.useDistinct}
          itemLabelSingular="permissão"
          db_type_on={user?.info_extra?.type}
          itemLabelPlural="permissões"
          icon={<Shield className="w-5 h-5 text-blue-600" />}
          tableSelected={table_list}
          items={[...new Set(columns.flatMap((s: MetadataTableResponse) => s.colunas.map((c) => `${s.table_name}.${c.nome}`)))]}
          selectedItems={select}
          initialAliases={aliasTables}
          onClose={() => setShowTableModal(false)}
          enableAliases={true} // Não precisamos de aliases para permissões
          enableDistinct={true} // Não precisamos de distinct para permissões
          onSave={(items, useDistinct, cols, aliases) => {
            setSelect(items || []);
            setDistinctList({ useDistinct: !!useDistinct, distinct_columns: cols || [] });
            setAliasTables(aliases || {});
            addNotification("success", t("builder.columnsUpdated") || "Colunas Atualizadas", `${items?.length || 0} coluna(s) selecionada(s).`);
          }}
        />
      )}

      {/* SQL PREVIEW */}
      {showPreview && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="bg-gray-900 text-blue-300 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto shadow-inner border border-gray-800">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="font-bold tracking-wider uppercase text-[10px]">-- SQL Preview</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlPreview);
                  addNotification("success", t("builder.sqlCopied") || "SQL Copiado", t("builder.sqlCopiedMessage") || "Consulta SQL copiada.");
                }}
                className="px-3 py-1 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-colors border border-gray-700"
              >
                {t("actions.copy") || "Copiar"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">{sqlPreview || t("builder.noValidCondition") || "-- Nenhuma condição válida"}</pre>
          </div>
        </div>
      )}

      {/* CONTENT (CONDIÇÕES) */}
      <div className="p-4 lg:p-6 space-y-6">
        {lengthCondition === 0 ? (
          <div className="text-center py-10 sm:py-14 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">{t("builder.noConditionAdded") || "Nenhuma condição adicionada"}</h4>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto font-medium">
              {t("builder.noConditionHint") || "Clique em 'Adicionar' para criar condições de filtro e refinar seus resultados."}
            </p>
            <button
              onClick={addCondition}
              disabled={!columns.length || !columns[0]?.colunas?.length}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("builder.addFirstCondition") || "Adicionar Primeira Condição"}
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-64 sm:max-h-80 lg:max-h-[400px] overflow-y-auto pr-2">
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

        {/* OPÇÕES AVANÇADAS (JOIN E ORDER BY) */}
        <div className="space-y-4 pt-2">
          {isMobile && (
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <span>{t("builder.advancedOptions") || "Opções Avançadas"}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? "rotate-180" : ""}`} />
            </button>
          )}

          <div className={`${isMobile && !showAdvancedOptions ? "hidden" : "block"} space-y-4`}>

            {columns.length > 1 && (
              <div className="border border-gray-200 p-4 sm:p-5 rounded-xl bg-gray-50 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  {t("builder.configureJoins") || "Configurar junções (JOINs)"}
                </div>
                <div className="bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
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

            <div className="border border-gray-200 p-4 sm:p-5 rounded-xl bg-gray-50 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                {t("builder.configureOrderBy") || "Ordenação dos resultados"}
              </div>
              <div className="bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
                <OrderByOptions columns={columns} orderBy={orderBy} setOrderBy={setOrderBy} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - EXECUTE */}
      <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          {lengthCondition > 0 && (
            <div className="text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              <span className="font-bold text-gray-900">{validConditionsCount}</span> {t("common.of") || "de"} {lengthCondition} {t("builder.validConditions") || "condição(ões) válida(s)"}
            </div>
          )}
          {table_list.length > 0 && (
            <div className="text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              {t("builder.baseTable") || "Tabela base"}: <strong className="text-blue-600 ml-1">{table_list[0]}</strong>
            </div>
          )}
        </div>

        {/* Botão padronizado (Blue em vez de Green) */}
        <button
          onClick={executeQuery}
          disabled={isExecuting}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/50"
        >
          {isExecuting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("builder.executing") || "Executando..."}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t("builder.executeQuery") || "Executar Consulta"}
              {validConditionsCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-md ml-1 font-mono">
                  {validConditionsCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(QueryBuilder);