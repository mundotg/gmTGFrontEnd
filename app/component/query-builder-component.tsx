// "use client"
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Play,
  ChevronDown,
} from "lucide-react";
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

const QueryBuilder: React.FC<QueryBuilderProps> = ({
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
}) => {
  // ---------------- STATES ----------------
  const [conditions, setConditions] = usePersistedState<CondicaoFiltro[]>(
    "query_conditions",
    []
  );
  const [orderBy, setOrderBy] = usePersistedState<MultiOrderByOption>(
    "query_orderby", columns.length && columns[0].colunas.length
    ? [{
      column: `${columns[0].table_name}.${columns[0].colunas[0].nome}`,
      direction: "ASC",
    },] : []
  );
  const [advancedConditions, setAdvancedConditions] =
    usePersistedState<Record<string, AdvancedJoinOption>>("query_joins", {});
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
    () => conditions.filter((c) =>
      c.column && (c.value?.toString().trim() || c.operator === "IS NULL" || c.operator === "IS NOT NULL")
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

  const {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();

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

        const table = columns.find(col => col.table_name === condition.table_name_fil);
        const columnExists = table?.colunas.some(col => col.nome === condition.column);
        return columnExists;
      });

      if (validConditions.length !== prevConditions.length) {
        const removedCount = prevConditions.length - validConditions.length;

        if (removedCount > 0) {
          addNotification(
            'info',
            'Condições Atualizadas',
            `${removedCount} condição(ões) inválida(s) foram removidas devido a mudanças nas tabelas.`
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

        const table = columns.find(col => col.table_name === tableName);
        const columnExists = table?.colunas.some(col => col.nome === columnName);

        return columnExists;
      });

      if (validorder.length !== prevOrder.length) {
        const removedCount = prevOrder.length - validorder.length;
        console.log(`Removidas ${removedCount} condições inválidas`);

        if (removedCount > 0) {
          addNotification(
            'info',
            'Condições Atualizadas',
            `${removedCount} condição(ões) inválida(s) foram removidas devido a mudanças nas tabelas.`
          );
        }
        return validorder;
      }
      return prevOrder;
    });


  }, [columns, table_list, setConditions, hydrated, addNotification, setOrderBy]);


  // Validar joins quando as tabelas mudam
  useEffect(() => {
    if (!hydrated || !table_list.length) return;

    //  🔹 Validar condições avançadas (JOINs)
    // 🔹 Validar condições avançadas (JOINs)
    setAdvancedConditions(prevCond => {
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
          `Os seguintes JOINs foram removidos por ficarem sem condições ON: ${removedJoins.join(", ")}.`
        );
      }

      return changed ? newCond : prevCond;
    });

  }, [table_list, setAdvancedConditions, hydrated, addNotification]);

  // ---------------- HANDLERS ----------------
  const addCondition = useCallback(() => {
    if (lengthCondition >= maxConditions) {
      addNotification('warning', 'Limite Atingido',
        `Máximo de ${maxConditions} condições permitidas.`);
      return;
    }

    // Verificar se há colunas disponíveis
    if (!columns.length || !columns[0]?.colunas?.length) {
      addNotification('error', 'Sem Colunas',
        'Não há colunas disponíveis para adicionar condição.');
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

    setConditions(prev => [...prev, newCondition]);

    addNotification('success', 'Condição Adicionada',
      'Nova condição de filtro adicionada.');
  }, [columns, lengthCondition, maxConditions, setConditions, addNotification]);

  const updateCondition = useCallback(
    (index: number, field: keyof CondicaoFiltro, value: string) => {
      setConditions((prevConditions) =>
        prevConditions.map((condition, i) => {
          if (i !== index) return condition;

          let updatedCondition: CondicaoFiltro = {
            ...condition,
            [field]: value,
          };

          // Quando muda a tabela ou a coluna, atualiza metadados
          if (field === "table_name_fil" || field === "column") {
            const targetTableName =
              field === "table_name_fil" ? value : condition.table_name_fil;
            const targetColumnName =
              field === "column" ? value : condition.column;

            const table = columns.find((t) => t.table_name === targetTableName);
            const columnMeta = table?.colunas.find((c) => c.nome === targetColumnName);

            if (columnMeta) {
              updatedCondition = {
                ...updatedCondition,
                column_type: columnMeta.tipo,
                length: columnMeta.length || 10,
                is_nullable: columnMeta.is_nullable,
              };
            } else {
              // Coluna não encontrada - manter valores anteriores
              console.warn(`Coluna ${targetColumnName} não encontrada na tabela ${targetTableName}`);
            }
          }

          // Se mudar operador para IS NULL ou IS NOT NULL → força value = "null"
          if (field === "operator" && (value === "IS NULL" || value === "IS NOT NULL")) {
            updatedCondition.value = "null";
          }

          // Se mudar de operador NULL para outro → limpa o valor
          if (
            condition.operator &&
            (condition.operator === "IS NULL" || condition.operator === "IS NOT NULL") &&
            field === "operator" &&
            !(value === "IS NULL" || value === "IS NOT NULL")
          ) {
            updatedCondition.value = "";
          }

          return updatedCondition;
        })
      );
    },
    [columns, setConditions]
  );

  const removeCondition = useCallback(
    (index: number) => {
      setConditions(prevConditions => {
        const updated = prevConditions.filter((_, i) => i !== index);
        // Remover operador lógico da primeira condição
        if (updated.length > 0 && updated[0].logicalOperator) {
          updated[0] = { ...updated[0], logicalOperator: undefined };
        }
        return updated;
      });
      addNotification('info', 'Condição Removida', 'Condição de filtro removida.');
    },
    [setConditions, addNotification]
  );

  const onBaseTableChange = useCallback((newBaseTable: string) => {
    // Verificar se a nova tabela base é diferente da atual
    if (newBaseTable === table_list[0]) {
      addNotification('info', 'Tabela Base Inalterada',
        `"${newBaseTable}" já é a tabela base atual.`);
      return;
    }
    if (!table_list.includes(newBaseTable)) {
      addNotification('error', 'Tabela Não Encontrada',
        `A tabela "${newBaseTable}" não existe na lista de tabelas disponíveis.`);
      return;
    }
    const newTableOrder = [
      newBaseTable,
      ...table_list.filter(table => table !== newBaseTable)
    ];
    setTable_list(newTableOrder);
    addNotification('success', 'Tabela Base Alterada',
      `Tabela base alterada para "${newBaseTable}". A ordem das tabelas foi reorganizada.`);

  }, [table_list, setTable_list, addNotification]);

  const clearAllConditions = useCallback(() => {
    setConditions([]);
    addNotification('info', 'Condições Limpas', 'Todas as condições de filtro foram removidas.');
  }, [setConditions, addNotification]);

  const clearCache = useCallback(() => {
    setConditions([]);
    setAdvancedConditions({});
    setSelect([]);
    setDistinctList({ useDistinct: false, distinct_columns: [] });
    removerCacheLocalStorage?.();

    addNotification('success', 'Cache Limpo', 'Todas as configurações foram resetadas.');
  }, [setConditions,
    setSelect,
    setAdvancedConditions,
    setDistinctList,
    removerCacheLocalStorage,
    addNotification]);

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
          <p className="text-gray-500">Configure as tabelas e colunas para começar a construir consultas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${className}`} aria-label="Query Builder">
      {/* HEADER */}
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

      {/* NOTIFICAÇÕES */}
      {notifications.length > 0 && (
        <div className="border-b">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                Notificações ({notifications.length})
              </h4>
              {notifications.length > 1 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
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

      {/* MODAL */}
      {showTableModal && (
        <TableSelectModal
          allTables={[...new Set(columns.flatMap((s: MetadataTableResponse) => s.colunas.map((c) => `${s.table_name}.${c.nome}`)))]}
          initialAliases={aliasTables}
          selected={select}
          onClose={() => setShowTableModal(false)}
          onSave={(items, useDistinct, cols, aliases) => {
            setSelect(items || []);
            setDistinctList({ useDistinct: !!useDistinct, distinct_columns: cols || [] });
            setAliasTables(aliases || {});

            addNotification('success', 'Colunas Atualizadas',
              `${items?.length || 0} coluna(s) selecionada(s) para a consulta.`);
          }}
        />
      )}

      {/* SQL PREVIEW */}
      {showPreview && (
        <div className="bg-gray-50 border-b p-3 sm:p-4">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span>-- SQL Preview</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlPreview);
                  addNotification('success', 'SQL Copiado', 'Consulta SQL copiada para a área de transferência.');
                }}
                className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Copiar
              </button>
            </div>
            <pre className="whitespace-pre-wrap">{sqlPreview || "Nenhuma condição válida"}</pre>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Condições de filtro */}
        {lengthCondition === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhuma condição adicionada</h4>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto px-4">
              Clique em &quot;Adicionar&quot; para criar condições de filtro e refinar seus resultados de consulta.
            </p>
            <button
              onClick={addCondition}
              disabled={!columns.length || !columns[0]?.colunas?.length}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto font-medium transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Adicionar Primeira Condição
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

        {/* Opções Avançadas - Responsivo */}
        <div className="space-y-3 sm:space-y-4">
          {/* Botão para mostrar/ocultar opções avançadas em mobile */}
          {isMobile && (
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border"
            >
              <span>Opções Avançadas</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Conteúdo das opções avançadas */}
          <div className={`${isMobile && !showAdvancedOptions ? 'hidden' : 'block'} space-y-3 sm:space-y-4`}>
            {/* JOIN Options - apenas se houver múltiplas tabelas */}
            {columns.length > 1 && (
              <div className="border p-3 sm:p-4 rounded-lg bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                  Configurar junções entre tabelas:
                </div>
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

            {/* ORDER BY Options - sempre disponível */}
            <div className="border p-3 sm:p-4 rounded-lg bg-gray-50">
              <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                Ordenação dos resultados:
              </div>
              <div className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm overflow-x-auto">
                <OrderByOptions
                  columns={columns}
                  orderBy={orderBy}
                  setOrderBy={setOrderBy}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTE */}
      <div className="border-t p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          {lengthCondition > 0 && (
            <div className="text-xs sm:text-sm text-gray-600">
              {validConditionsCount} de {lengthCondition} condição(ões) válida(s)
            </div>
          )}
          {table_list.length > 0 && (
            <div className="text-xs sm:text-sm text-gray-500">
              Tabela base: <strong>{table_list[0]}</strong>
            </div>
          )}
        </div>

        <button
          onClick={executeQuery}
          disabled={isExecuting}
          aria-disabled={isExecuting}
          className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base transition-colors min-w-[140px]"
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
              {validConditionsCount > 0 && (
                <span className="bg-green-700 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
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