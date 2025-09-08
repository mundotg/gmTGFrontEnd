import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Trash2, Filter, Play, Database, MemoryStick, ChevronDown } from 'lucide-react';
import FiltroCondicaoItem from './FiltroCondicaoItem';
import { operators } from '@/constant';
import { CondicaoFiltro, DistinctList, JoinOption, MetadataTableResponse, OrderByOption, QueryBuilderProps, QueryPayload } from '@/types';
import { JoinOptions } from './JoinOptions';
import { OrderByOptions } from './OrderByOptions';
import { TableSelectModal } from './TableSelectModal';
import usePersistedState from '@/hook/localStoreUse';

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  columns = [],
  onExecuteQuery,
  title = "Construtor de Consultas",
  isExecuting = false,
  maxConditions = 25,
  showLogicalOperators = true,
  className = "",
  table_list,
  select,
  setSelect,
  removerCacheLocalStorage
}) => {
  const [conditions, setConditions] = usePersistedState<CondicaoFiltro[]>("query_conditions", []);
  const [conditionsForInput, setConditionsForInput] = usePersistedState<CondicaoFiltro[]>("query_conditions", []);
  const [lengthCondition, setLengthCondition] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [orderBy, setOrderBy] = useState<OrderByOption>({ column: "", direction: "ASC" });
  const [joinConfig, setJoinConfig] = usePersistedState<Record<string, JoinOption>>("query_joins", {});
  const [showTableModal, setShowTableModal] = useState(false);
  const [distinctList, setDistinctList] = usePersistedState<DistinctList>("query_distinct", { useDistinct: false, distinct_columns: [] });
  const [hydrated, setHydrated] = useState(false);
  
  // Estados para melhorar responsividade
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setLengthCondition(conditions.length);
  }, [conditions.length]);

  useEffect(() => {
    setHydrated(true);
    const cd = conditions.filter(c => table_list.includes(c.table_name_fil));
    setConditionsForInput(cd);
    setConditions(cd);
  }, [columns, table_list]);

  const addCondition = useCallback(() => {
    if (conditions.length >= maxConditions) return;

    const newCondition: CondicaoFiltro = {
      table_name_fil: columns[0].table_name,
      column: columns[0]?.colunas[0]?.nome || '',
      operator: '=',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
      column_type: columns[0]?.colunas[0]?.tipo,
      length: columns[0]?.colunas[0]?.length || 10,
      is_nullable: columns[0]?.colunas[0].is_nullable
    };

    setConditionsForInput([...conditions, newCondition]);
    setConditions([...conditions, newCondition]);
  }, [conditions, columns, maxConditions]);

  const getcolumn = useCallback((table_name: string) => {
    return columns.find(t => t.table_name === table_name);
  }, [columns]);

  const updateCondition = useCallback((index: number, field: keyof CondicaoFiltro, value: string) => {
    let updatedConditions = [];
    if (!["value", "value2", "operator"].includes(field)) {
      const valorIsNullAndNNotNull = value === "IS NULL" || value === "IS NOT NULL";
      updatedConditions = conditions.map((condition, i) => {
        const col = getcolumn(field === "table_name_fil" ? value : condition.table_name_fil);
        const tipoc = field === "table_name_fil" ? col?.colunas[0] : col?.colunas.find(s => s.nome === value);
        return i === index ? { ...condition, [field]: value, column_type: tipoc?.tipo || "varchar", length: tipoc?.length || 10, is_nullable: tipoc?.is_nullable } : condition;
      }) as CondicaoFiltro[];
      if (valorIsNullAndNNotNull) {
        updatedConditions[index].value = "null";
      }
    } else {
      updatedConditions = conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      );
    }
    setConditions(updatedConditions);
    if (!["value", "value2"].includes(field))
      setConditionsForInput(updatedConditions);
  }, [conditions, getcolumn, setConditions]);

  const removeCondition = useCallback((index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index);
    if (updatedConditions.length > 0 && updatedConditions[0].logicalOperator) {
      updatedConditions[0].logicalOperator = undefined;
    }
    setConditions(updatedConditions);
    setConditionsForInput(updatedConditions);
  }, [conditions, setConditions]);

  const clearAllConditions = useCallback(() => {
    setConditions([]);
    setConditionsForInput([]);
  }, [setConditions, setConditionsForInput]);

  useEffect(() => {
    console.log("Tabela existente na DB:", table_list);
    setJoinConfig(prev => {
      const updated: Record<string, JoinOption> = {};
      table_list.forEach(table => {
        console.log("Tabela existente na DB:", table);
        if (prev[table]) {
          updated[table] = prev[table];
        }
      });
      return updated;
    });
  }, [table_list, setJoinConfig]);

  const executeQuery = useCallback(async () => {
    const validConditions = conditions.filter(c => c.column && c.value.trim());
    const bodyRequest: QueryPayload = {
      baseTable: table_list[0],
      joins: Object.values(joinConfig),
      select: select,
      distinct: distinctList,
      limit: 10,
      orderBy: orderBy,
      where: validConditions,
      table_list: table_list
    };

    try {
      await onExecuteQuery(bodyRequest);
    } catch (error) {
      console.error('Erro ao executar consulta:', error);
    }
  }, [conditions, distinctList, joinConfig, onExecuteQuery, orderBy, select, table_list]);

  const generateSQLPreview = useCallback((): string => {
    if (!table_list || table_list.length === 0) return "";

    const allColumns: string[] = columns.flatMap((table) =>
      table.colunas.map((col) => `${table.table_name}.${col.nome}`)
    );

    const isAllSelected = select.length === allColumns.length;
    let selectClause = "*";
    const hasDistinct = distinctList.useDistinct && distinctList.distinct_columns.length > 0;

    if (select.length > 0) {
      if (hasDistinct) {
        if (isAllSelected) {
          selectClause = "DISTINCT *";
        } else {
          const distinctCols = select.map((s) =>
            distinctList.distinct_columns.includes(s) ? `DISTINCT ${s}` : s
          );
          selectClause = distinctCols.join(", ");
        }
      } else {
        selectClause = select.join(", ");
      }
    }

    let query = `SELECT ${selectClause}\nFROM ${table_list[0]}`;

    const joins = Object.values(joinConfig);
    joins.forEach((join) => {
      if (join.type && join.table && join.on) {
        query += `\n${join.type} ${join.table} ON ${join.on}`;
      }
    });

    const validConditions = conditions.filter(
      (c) => (c.column && c.value.toString().trim()) || c.operator === "IS NOT NULL" || c.operator === "IS NULL"
    );

    if (validConditions.length > 0) {
      const whereClauses = validConditions.map((cond, index) => {
        const { table_name_fil, column, operator, value, logicalOperator } = cond;

        let formattedValue: string;
        if (["IN", "NOT IN"].includes(operator)) {
          formattedValue = `(${value
            .toString()
            .split(",")
            .map((v) => `'${v.trim()}'`)
            .join(", ")})`;
        } else if (["LIKE", "NOT LIKE"].includes(operator)) {
          formattedValue = `'%${value}%'`;
        } else if (value == null || value === "")
          formattedValue = "NULL";
        else if (isNaN(Number(value))) {
          formattedValue = `'${value}'`;
        } else {
          formattedValue = value.toString();
        }

        const logic = index > 0 && logicalOperator ? `${logicalOperator} ` : "";
        return `${logic}${table_name_fil}.${column} ${operator} ${formattedValue}`;
      });

      query += `\nWHERE ${whereClauses.join(" ")}`;
    }

    if (orderBy?.column) {
      query += `\nORDER BY ${orderBy.column} ${orderBy.direction}`;
    }

    return query + ";";
  }, [columns, conditions, distinctList, joinConfig, orderBy, select, table_list]);

  const handleTableSelectionWithValidation = useCallback((selectedItems: string[], useDistinct?: boolean, columnsToPass?: string[]) => {
    try {
      if (!selectedItems) {
        setSelect([]);
        setDistinctList({ useDistinct: false, distinct_columns: [] });
      } else {
        setSelect(selectedItems);
        setDistinctList({ useDistinct: useDistinct || false, distinct_columns: columnsToPass || [] });
      }
    } catch (error) {
      console.error('Erro ao processar seleção de tabelas:', error);
      setSelect([]);
    }
  }, [setSelect, setDistinctList]);

  const LimparCacheLocalStorage = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    clearAllConditions();
    setSelect([]);
    setJoinConfig({});
    setDistinctList({ useDistinct: false, distinct_columns: [] });
    removerCacheLocalStorage?.();
  }, [clearAllConditions, setSelect, setJoinConfig, setDistinctList, removerCacheLocalStorage]);

  if (!hydrated) {
    return null;
  }

  if (columns.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-4 sm:p-6 ${className}`}>
        <div className="text-center py-8">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma coluna disponível para consulta</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${className}`} aria-label='Query Builder'>
      {/* Header Responsivo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 lg:p-6 border-b">
        <div className="space-y-3 sm:space-y-4">
          {/* Título e info - sempre visível */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {lengthCondition} {lengthCondition === 1 ? 'condição' : 'condições'}
                {lengthCondition > 0 && ` • ${conditions.filter(c => c.value.trim()).length} válidas`}
              </p>
            </div>
          </div>

          {/* Botões principais - layout responsivo */}
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            {/* Linha 1: Botões principais */}
            <div className="flex flex-1 gap-2">
              {/* Selecionar Tabelas */}
              <button
                onClick={() => setShowTableModal(true)}
                className="flex-1 xs:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-1 sm:gap-2 min-h-[36px] sm:min-h-[40px]"
              >
                <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Tabelas</span>
                <span className="xs:hidden">Select</span>
                {select.length > 0 && (
                  <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
                    {select.length}
                  </span>
                )}
              </button>

              {/* Adicionar Condição */}
              <button
                onClick={addCondition}
                disabled={lengthCondition >= maxConditions}
                className="flex-1 xs:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium transition-colors min-h-[36px] sm:min-h-[40px]"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Adicionar</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>

            {/* Linha 2: Botões secundários em mobile, mesma linha em desktop */}
            <div className="flex gap-2 xs:gap-2">
              {/* Preview SQL */}
              {lengthCondition > 0 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex-1 xs:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[36px] sm:min-h-[40px]"
                >
                  {showPreview ? 'Ocultar' : 'Preview'}
                </button>
              )}

              {/* Limpar Condições */}
              {lengthCondition > 0 && (
                <button
                  onClick={clearAllConditions}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center"
                  title="Limpar todas as condições"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Limpar Cache */}
              <button
                onClick={LimparCacheLocalStorage}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center"
                title="Limpar tudo e cache"
              >
                <MemoryStick className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Tabelas */}
      {showTableModal && (
        <TableSelectModal
          allTables={[...new Set(columns.flatMap((s: MetadataTableResponse) => s.colunas.map(c => `${s.table_name}.${c.nome}`)))]}
          selected={select}
          onClose={() => setShowTableModal(false)}
          onSave={handleTableSelectionWithValidation}
        />
      )}

      {/* SQL Preview */}
      {showPreview && lengthCondition > 0 && (
        <div className="bg-gray-50 border-b p-3 sm:p-4">
          <div className="bg-gray-900 text-green-400 p-2 sm:p-3 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto">
            <div className="text-gray-400 mb-1">-- SQL Preview</div>
            <div className="break-all sm:break-normal">
              {generateSQLPreview() || 'Nenhuma condição válida'}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
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
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto font-medium transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Adicionar Primeira Condição
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 lg:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
            {conditionsForInput.map((condition, index) => (
              <FiltroCondicaoItem
                key={`${index}-${condition.value}+"filter"`}
                index={index}
                condition={condition}
                columns={columns}
                operators={operators}
                showLogicalOperator={showLogicalOperators}
                updateCondition={updateCondition}
                removeCondition={removeCondition}
              />
            ))}
          </div>
        )}

        {/* Opções Avançadas - Responsivo */}
        {columns.length > 1 || (columns.length === 1 && !isMobile) ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Botão para mostrar/ocultar opções avançadas em mobile */}
            {isMobile && (
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>Opções Avançadas (JOINs e ORDER BY)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Conteúdo das opções avançadas */}
            <div className={`${isMobile && !showAdvancedOptions ? 'hidden' : 'block'} space-y-3 sm:space-y-4`}>
              {columns.length > 1 ? (
                <div className="border p-3 sm:p-4 rounded-lg bg-gray-50">
                  <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                    A consulta envolverá múltiplas junções entre as tabelas selecionadas:
                  </div>
                  <div className="bg-white p-2 sm:p-3 border rounded text-xs sm:text-sm font-mono text-gray-700 overflow-x-auto space-y-2">
                    <div className="text-gray-600">SELECT ... FROM {table_list[0]}</div>
                    <div className="space-y-1 sm:space-y-2">
                      <JoinOptions 
                        joinConfig={joinConfig} 
                        setJoinConfig={setJoinConfig} 
                        columns={columns} 
                      />
                      <OrderByOptions 
                        columns={columns} 
                        orderBy={orderBy.column} 
                        setOrderBy={setOrderBy} 
                        orderDirection={orderBy.direction} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 sm:p-4 border rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500 mb-2">Opções de ordenação:</div>
                  <div className="bg-white p-2 sm:p-3 border rounded text-xs sm:text-sm font-mono text-gray-700 overflow-x-auto">
                    <OrderByOptions 
                      columns={columns} 
                      orderBy={orderBy.column} 
                      setOrderBy={setOrderBy} 
                      orderDirection={orderBy.direction} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Execute Button - Responsivo */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {lengthCondition > 0 && (
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              {conditions.filter(c => c.value.trim()).length} de {lengthCondition} condições válidas
            </div>
          )}
          <button
            onClick={executeQuery}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors text-sm sm:text-base min-h-[44px]"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden xs:inline">Executando...</span>
                <span className="xs:hidden">Exec...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Executar Consulta</span>
                <span className="xs:hidden">Executar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueryBuilder;