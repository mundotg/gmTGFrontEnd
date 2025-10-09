import { X } from "lucide-react";
import {
  MetadataTableResponse,
  CondicaoFiltro,
  tipo_db_Options,
  OperatorType,
  CampoDetalhado,
} from "@/types";
import { getOperatorsForType } from "../services";
import DynamicInputByType from "./DynamicInputByType";
import React, { useMemo, useCallback } from "react";
import OperationINAndNOTINInput from "./InInput";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";

interface FiltroCondicaoItemProps {
  index: number;
  condition: CondicaoFiltro;
  columns: MetadataTableResponse[];
  showLogicalOperator?: boolean;
  updateCondition: (
    index: number,
    campo: keyof CondicaoFiltro,
    valor: string
  ) => void;
  removeCondition: (index: number) => void;
}

function FiltroCondicaoItem({
  index,
  condition,
  columns,
  showLogicalOperator = true,
  updateCondition,
  removeCondition,
}: FiltroCondicaoItemProps) {
  const selectedTable = useMemo(
    () => columns.find((c) => c.table_name === condition.table_name_fil),
    [columns, condition.table_name_fil]
  );

  const colunaDetalhe = useMemo<CampoDetalhado | undefined>(
    () => selectedTable?.colunas.find((c) => c.nome === condition.column),
    [selectedTable, condition.column]
  );

  const value = condition.value ?? "";

  /** Retorna o placeholder conforme operador e tipo da coluna */
  const getPlaceholder = useCallback((): string => {
    const { operator, column_type } = condition;
    if (operator === "IN" || operator === "NOT IN")
      return "valor1, valor2, valor3...";
    if (operator === "Contém" || operator === "Não Contém")
      return "texto para buscar...";
    if (operator === "Entre" || operator === "Não Entre")
      return "Digite o intervalo (ex: 10 e 20)";
    if (operator === "Antes de" || operator === "Depois de") return "YYYY-MM-DD";
    if (column_type.includes("date")) return "YYYY-MM-DD";
    if (column_type.includes("int") || column_type.includes("decimal"))
      return "Número";
    return "Valor";
  }, [condition]);

  /** Determina o tipo de input baseado no tipo da coluna e operador */
  const getInputType = useCallback(
    (type: tipo_db_Options, operator: OperatorType): tipo_db_Options => {
      // Para operadores de texto, sempre usar text mesmo em campos de data
      if (["Contém", "Não Contém"].includes(operator)) {
        return "text";
      }
      return type;
    },
    []
  );

  /** Handlers para atualizar valores - corrigidos */
  const handleSingleValueChange = useCallback((newValue: string) => {
    updateCondition(index, "value", newValue);
  }, [index, updateCondition]);

  const handleRangeValue1Change = useCallback((newValue: string) => {
    const currentParts = value ? value.split("*/-1") : ["", ""];
    const newValueCombined = [newValue, currentParts[1] || ""].join("*/-1");
    updateCondition(index, "value", newValueCombined);
  }, [index, value, updateCondition]);

  const handleRangeValue2Change = useCallback((newValue: string) => {
    const currentParts = value ? value.split("*/-1") : ["", ""];
    const newValueCombined = [currentParts[0] || "", newValue].join("*/-1");
    updateCondition(index, "value", newValueCombined);
  }, [index, value, updateCondition]);

  const handleInValuesChange = useCallback((newValues: string[]) => {
    const joinedValues = newValues.join(",");
    updateCondition(index, "value", joinedValues);
  }, [index, updateCondition]);

  // Extrair valores para operadores "Entre"
  const rangeValues = useMemo(() => {
    const parts = value ? value.split("*/-1") : ["", ""];
    return {
      value1: parts[0] || "",
      value2: parts[1] || ""
    };
  }, [value]);

  // Extrair valores para operadores "IN"
  const inValues = useMemo(() => {
    return value ? value.split(",").filter(v => v.trim()) : [];
  }, [value]);

  return (
    <div key={`condition-${index}-${condition.table_name_fil}-${condition.column}`} className="group">
      {/* Operador lógico */}
      {index > 0 && showLogicalOperator && (
        <div className="flex justify-center mb-2">
          <select
            value={condition.logicalOperator || "AND"}
            onChange={(e) => updateCondition(index, 'logicalOperator', e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="AND">E (AND)</option>
            <option value="OR">OU (OR)</option>
          </select>
        </div>
      )}

      {/* Linha de condição */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group-hover:shadow-sm overflow-x-auto sm:overflow-visible">
        
        {/* Tabela */}
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Tabela</label>
          <select
            value={condition.table_name_fil}
            onChange={(e) => updateCondition(index, 'table_name_fil', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {columns.map((col, i) => (
              <option key={`${col.table_name}-${i}`} value={col.table_name}>
                {col.table_name}
              </option>
            ))}
          </select>
        </div>

        {/* Coluna */}
        <div className="min-w-[170px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Coluna</label>
          <JoinSelect
            className="w-full p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            buttonClassName="min-w-[120px] border"
            value={condition.column}
            onChange={(value) => updateCondition(index, 'column', value)}
            options={selectedTable?.colunas?.map((col) => ({
              value: col.nome,
              label: `${col.nome}`
            })) || []}
            placeholder="Selecione a coluna"
          />
        </div>

        {/* Operador */}
        <div className="w-full sm:w-36">
          <label className="block text-xs font-medium text-gray-700 mb-1">Operador</label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            className="w-full min-w-[8rem] p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {getOperatorsForType(condition.column_type, condition.is_nullable).map((op, i) => (
              <option key={`${op.value}-${i}`} value={op.value}>
                {op.label} ({op.icon})
              </option>
            ))}
          </select>
        </div>

        {/* Valor - Lógica corrigida */}
        {condition.operator === "IS NULL" || condition.operator === "IS NOT NULL" ? (
          // Operadores NULL - valor fixo
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
            <DynamicInputByType
              type="text"
              value={condition.operator === "IS NULL" ? "Nulo" : "Não nulo"}
              onChange={() => {}} // Não permite mudança
              placeholder=""
              disabled={true}
            />
          </div>
        ) : condition.operator === "Entre" || condition.operator === "Não Entre" ? (
          // Operadores de intervalo - dois valores
          <div className="flex gap-2">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Inicial</label>
              <DynamicInputByType
                type={getInputType(condition.column_type, condition.operator)}
                value={rangeValues.value1}
                onChange={handleRangeValue1Change}
                placeholder="Valor inicial"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Final</label>
              <DynamicInputByType
                type={getInputType(condition.column_type, condition.operator)}
                value={rangeValues.value2}
                onChange={handleRangeValue2Change}
                placeholder="Valor final"
              />
            </div>
          </div>
        ) : condition.operator === "IN" || condition.operator === "NOT IN" ? (
          // Operadores IN - múltiplos valores
          <div className="flex-1 min-w-[140px]">
            <OperationINAndNOTINInput
              type={condition.column_type}
              value={inValues}
              onChange={handleInValuesChange}
              placeholder="Digite um valor"
            />
          </div>
        ) : (
          // Operadores padrão - valor único
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
            <DynamicInputByType
              enum_values={colunaDetalhe?.enum_valores_encontrados}
              type={getInputType(condition.column_type, condition.operator)}
              value={value}
              onChange={handleSingleValueChange}
              placeholder={getPlaceholder()}
            />
          </div>
        )}

        {/* Botão Remover */}
        <div className="flex items-end">
          <button
            onClick={() => removeCondition(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:text-red-700"
            title="Remover condição"
            aria-label="Remover condição"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(FiltroCondicaoItem);