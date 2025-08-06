import React, { useEffect, useRef, useState } from 'react';
import { Search, Plus, X, Trash2, Filter, Play, Database, TriangleDashed, MemoryStick } from 'lucide-react';
import FiltroCondicaoItem from './FiltroCondicaoItem';
import { operators } from '@/constant';
import { CondicaoFiltro, DistinctList, JoinOption, MetadataTableResponse, OrderByOption, QueryPayload } from '@/types';
import { JoinOptions } from './JoinOptions';
import { OrderByOptions } from './OrderByOptions';
import { TableSelectModal } from './TableSelectModal';

interface QueryBuilderProps {
  columns: MetadataTableResponse[];
  table_list: string[];
  onExecuteQuery: (conditions: QueryPayload) => Promise<void>;
  title?: string;
  isExecuting?: boolean;
  maxConditions?: number;
  showLogicalOperators?: boolean;
  className?: string;
  select: string[];
  setSelect: (select: string[]) => void;
}

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
  setSelect
}) => {
  const [conditions, setConditions] = useState<CondicaoFiltro[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [orderBy, setOrderBy] = useState<OrderByOption>({ column: "", direction: "ASC" });
  const [joinConfig, setJoinConfig] = useState<Record<string, JoinOption>>({});
  const [showTableModal, setShowTableModal] = useState(false);
  const [distinctList, setDistinctList] = useState<DistinctList>({ useDistinct: false, distinct_columns: [] });
  const isMounted = useRef(false);

  const addCondition = () => {
    if (conditions.length >= maxConditions) return;

    const newCondition: CondicaoFiltro = {
      table_name_fil: columns[0].table_name,
      column: columns[0]?.colunas[0]?.nome || '',
      operator: '=',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
      column_type: columns[0]?.colunas[0]?.tipo
    };

    setConditions([...conditions, newCondition]);
  };

  useEffect(() => {
    const cachedConditions = localStorage.getItem("query_conditions");
    const cachedSelect = localStorage.getItem("query_select");
    const cachedDistinct = localStorage.getItem("query_distinct");
    const cachedJoins = localStorage.getItem("query_joins");

    console.log("Cached Conditions:", cachedConditions);
    // console.log("Cached Select:", cachedSelect);
    // console.log("Cached Distinct:", cachedDistinct);
    console.log("Cached Joins:", cachedJoins);

    if (cachedConditions) setConditions(JSON.parse(cachedConditions) as CondicaoFiltro[]);
    if (cachedSelect) setSelect(JSON.parse(cachedSelect) as string[]);
    if (cachedDistinct) setDistinctList(JSON.parse(cachedDistinct) as DistinctList);
    if (cachedJoins) setJoinConfig(JSON.parse(cachedJoins) as Record<string, JoinOption>);
    isMounted.current = true;
  }, []);


  useEffect(() => {
    if (isMounted.current && conditions.length > 0) {
      localStorage.setItem("query_conditions", JSON.stringify(conditions));
    }
  }, [conditions]);

  useEffect(() => {
    if (isMounted.current && joinConfig) {
      // console.log("Saving joinConfig to localStorage:", joinConfig);
      localStorage.setItem("query_joins", JSON.stringify(joinConfig));
    }
  }, [joinConfig]);

  useEffect(() => {
    if (isMounted.current && select.length > 0) {
      localStorage.setItem("query_select", JSON.stringify(select));
    }
  }, [select]);

  useEffect(() => {
    if (isMounted.current && distinctList) {
      localStorage.setItem("query_distinct", JSON.stringify(distinctList));
    }
  }, [distinctList]);

  const updateCondition = (index: number, field: keyof CondicaoFiltro, value: string) => {
    let updatedConditions = []
    if (!["value", "operator"].includes(field))
      updatedConditions = conditions.map((condition, i) => {
        const col = getcolumn(field === "table_name_fil" ? value : condition.table_name_fil)
        const tipoc = field === "table_name_fil" ? col?.colunas[0] : col?.colunas.find(s => s.nome === value)
        return i === index ? { ...condition, [field]: value, column_type: tipoc?.tipo || "varchar" } : condition
      }
      );
    else
      updatedConditions = conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      );
    setConditions(updatedConditions);
  };

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index);
    // Remove logical operator from first condition if it exists
    if (updatedConditions.length > 0 && updatedConditions[0].logicalOperator) {
      updatedConditions[0].logicalOperator = undefined;
    }
    setConditions(updatedConditions);
  };

  const clearAllConditions = () => {
    setConditions([]);
  };

  const executeQuery = async () => {
    // if (conditions.length === 0) return;

    const validConditions = conditions.filter(c => c.column && c.value.trim());
    // if (validConditions.length === 0) return;

    const bodyRequest: QueryPayload = {
      baseTable: table_list[0],
      joins: Object.values(joinConfig), // CORRIGIDO
      select: select, // coloque colunas aqui se tiver
      distinct: distinctList,
      limit: 10,
      orderBy: orderBy,
      where: validConditions,
      table_list: table_list // Adiciona a lista de tabelas
    };

    try {
      await onExecuteQuery(bodyRequest); // CORRIGIDO
    } catch (error) {
      console.error('Erro ao executar consulta:', error);
    }
  };

  const generateSQLPreview = (): string => {
    if (!table_list || table_list.length === 0) return "";

    // 1. Todas as colunas com nome qualificado (ex: users.id)
    const allColumns: string[] = columns.flatMap((table) =>
      table.colunas.map((col) => `${table.table_name}.${col.nome}`)
    );

    const isAllSelected = select.length && allColumns.length;

    // 2. Construção da cláusula SELECT
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

    // 3. Início da query
    let query = `SELECT ${selectClause}\nFROM ${table_list[0]}`;

    // 4. JOINs
    const joins = Object.values(joinConfig);
    joins.forEach((join) => {
      if (join.type && join.table && join.on) {
        query += `\n${join.type} ${join.table} ON ${join.on}`;
      }
    });

    // 5. WHERE
    const validConditions = conditions.filter(
      (c) => c.column && c.value.toString().trim()
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
        } else if (isNaN(Number(value))) {
          formattedValue = `'${value}'`;
        } else {
          formattedValue = value.toString();
        }

        const logic = index > 0 && logicalOperator ? `${logicalOperator} ` : "";
        return `${logic}${table_name_fil}.${column} ${operator} ${formattedValue}`;
      });

      query += `\nWHERE ${whereClauses.join(" ")}`;
    }

    // 6. ORDER BY
    if (orderBy?.column) {
      query += `\nORDER BY ${orderBy.column} ${orderBy.direction}`;
    }

    return query + ";";
  };


  // Versão alternativa mais robusta com validação
  const handleTableSelectionWithValidation = (selectedItems: string[], useDistinct?: boolean, columnsToPass?: string[]) => {
    try {
      if (!selectedItems) {
        setSelect([])
        setDistinctList({ useDistinct: false, distinct_columns: [] }); // Limpa a lista de distinct

      } else {
        setSelect(selectedItems); // Remove duplicatas

        setDistinctList({ useDistinct: useDistinct || false, distinct_columns: columnsToPass || [] }); // Atualiza a lista de distinct
      }

    } catch (error) {
      console.error('Erro ao processar seleção de tabelas:', error);
      // Fallback para seleção vazia em caso de erro
      setSelect([]);
    }
  };



  const getcolumn = (table_name: string) => {
    return columns.find(t => t.table_name === table_name);

  };


  if (columns.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma coluna disponível para consulta</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${className}`}>
      {/* Header */}
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-600">
                {conditions.length} {conditions.length === 1 ? 'condição' : 'condições'}
                {conditions.length > 0 && ` • ${conditions.filter(c => c.value.trim()).length} válidas`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de abrir modal de tabelas */}
            {/* Botão de abrir modal de tabelas - Melhorado */}
            <button
              onClick={() => {
                clearAllConditions();
                setSelect([]);
                setJoinConfig({});
                setDistinctList({ useDistinct: false, distinct_columns: [] });
                localStorage.removeItem("query_conditions");
                localStorage.removeItem("query_select");
                localStorage.removeItem("query_distinct");
                localStorage.removeItem("query_joins");
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Limpar tudo e cache"
            >
              <MemoryStick className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowTableModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center gap-2 min-w-fit"
              >
                <Database className="w-4 h-4" />
                Selecionar Tabelas
                {select.length > 0 && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                    {select.length}
                  </span>
                )}
              </button>

            </div>

            {showTableModal && (
              <TableSelectModal
                allTables={[...new Set(columns.flatMap((s: MetadataTableResponse) => s.colunas.map(c => `${s.table_name}.${c.nome}`)))]}// Remove duplicatas e passa apenas nomes das tabelas
                selected={select} // Remove duplicatas dos selecionados
                onClose={() => setShowTableModal(false)}
                onSave={handleTableSelectionWithValidation}
              />
            )}

            {/* Mostrar Preview SQL */}
            {conditions.length > 0 && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showPreview ? 'Ocultar' : 'Preview SQL'}
              </button>
            )}

            {/* Adicionar Condição */}
            <button
              onClick={addCondition}
              disabled={conditions.length >= maxConditions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>

            {/* Limpar Condições */}
            {conditions.length > 0 && (
              <button
                onClick={clearAllConditions}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Limpar todas as condições"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>


      {/* SQL Preview */}
      {showPreview && conditions.length > 0 && (
        <div className="bg-gray-50 border-b p-4">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="text-gray-400 mb-1">-- SQL Preview</div>
            {generateSQLPreview() || 'Nenhuma condição válida'}
          </div>
        </div>
      )}
      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Condições de filtro */}
        {conditions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma condição adicionada</h4>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Clique em "Adicionar" para criar condições de filtro e refinar seus resultados de consulta.
            </p>
            <button
              onClick={addCondition}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeira Condição
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-60 md:max-h-[400px] overflow-y-auto pr-3 sm:pr-2">
            {conditions.map((condition, index) => (
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

        {/* Verificação de múltiplas tabelas - Responsivo */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {columns.length > 1 && (
            <div className="flex-1 border p-3 lg:p-4 rounded-lg bg-gray-50">
              <div className="text-xs lg:text-sm text-gray-500 mb-2">A consulta envolverá múltiplas junções entre as tabelas selecionadas. Exemplo:</div>
              <div className="bg-white p-2 border rounded text-xs lg:text-sm font-mono text-gray-700 overflow-x-auto">
                SELECT ... FROM {table_list[0]}  <span className="block lg:inline">&nbsp;&nbsp;
                  <JoinOptions joinConfig={joinConfig} setJoinConfig={setJoinConfig} columns={columns} />
                  <OrderByOptions columns={columns} orderBy={orderBy.column} setOrderBy={setOrderBy} orderDirection={orderBy.direction} />
                </span>

              </div>
            </div>
          )}
        </div>

      </div>

      {/* Execute Button */}
      {conditions.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-sm text-gray-600">
              {conditions.filter(c => c.value.trim()).length} de {conditions.length} condições válidas
            </div>

            <button
              onClick={executeQuery}
              // disabled={false && isExecuting || conditions.filter(c => c.value.trim()).length === 0}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              {isExecuting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Executar Consulta
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export default QueryBuilder;