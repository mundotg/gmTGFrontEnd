"use client";
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
import { useI18n } from "@/context/I18nContext"; // 🔹 Importado

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
  const { t } = useI18n(); // 🔹 Instanciado

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
      return t("condition.placeholderIn") || "valor1, valor2, valor3...";
    if (operator === "Contém" || operator === "Não Contém")
      return t("condition.placeholderContains") || "texto para buscar...";
    if (operator === "Entre" || operator === "Não Entre")
      return t("condition.placeholderBetween") || "ex: 10 e 20";
    if (operator === "Antes de" || operator === "Depois de") 
      return "YYYY-MM-DD";
    if (column_type.includes("date")) 
      return "YYYY-MM-DD";
    if (column_type.includes("int") || column_type.includes("decimal"))
      return t("condition.placeholderNumber") || "Número";
    return t("condition.placeholderValue") || "Valor";
  }, [condition, t]);

  /** Determina o tipo de input baseado no tipo da coluna e operador */
  const getInputType = useCallback(
    (type: tipo_db_Options, operator: OperatorType): tipo_db_Options => {
      if (["Contém", "Não Contém"].includes(operator)) {
        return "text";
      }
      return type;
    },
    []
  );

  /** Handlers para atualizar valores */
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
    <div key={`condition-${index}-${condition.table_name_fil}-${condition.column}`} className="group relative">
      
      {/* Operador lógico */}
      {index > 0 && showLogicalOperator && (
        <div className="flex justify-center mb-2 -mt-1 relative z-10">
          <select
            value={condition.logicalOperator || "AND"}
            onChange={(e) => updateCondition(index, 'logicalOperator', e.target.value)}
            className="px-3 py-1 text-xs font-bold text-gray-700 border border-gray-300 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-gray-50 cursor-pointer appearance-none text-center"
          >
            <option value="AND">{t("condition.and") || "E (AND)"}</option>
            <option value="OR">{t("condition.or") || "OU (OR)"}</option>
          </select>
        </div>
      )}

      {/* Linha de condição */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 lg:p-5 bg-white border border-gray-200 rounded-xl transition-all shadow-sm group-hover:border-blue-300 group-hover:shadow-md">
        
        {/* Tabela */}
        <div className="min-w-[140px] flex-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
            {t("condition.table") || "Tabela"}
          </label>
          <select
            value={condition.table_name_fil}
            onChange={(e) => updateCondition(index, 'table_name_fil', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none cursor-pointer hover:bg-gray-100"
          >
            {columns.map((col, i) => (
              <option key={`${col.table_name}-${i}`} value={col.table_name}>
                {col.table_name}
              </option>
            ))}
          </select>
        </div>

        {/* Coluna */}
        <div className="min-w-[170px] flex-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
            {t("condition.column") || "Coluna"}
          </label>
          <JoinSelect
            className="w-full bg-gray-50 border border-gray-200 rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/50 transition-colors"
            buttonClassName="px-3 py-2 text-sm font-medium text-gray-900 w-full text-left"
            value={condition.column}
            onChange={(val) => updateCondition(index, 'column', val)}
            options={selectedTable?.colunas?.map((col) => ({
              value: col.nome,
              label: col.nome
            })) || []}
            placeholder={t("condition.selectColumn") || "Selecione a coluna"}
          />
        </div>

        {/* Operador */}
        <div className="w-full sm:w-44 shrink-0">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
            {t("condition.operator") || "Operador"}
          </label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none cursor-pointer hover:bg-gray-100"
          >
            {getOperatorsForType(condition.column_type, condition.is_nullable).map((op, i) => (
              <option key={`${op.value}-${i}`} value={op.value}>
                {op.label} {op.icon ? `(${op.icon})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Valor */}
        {condition.operator === "IS NULL" || condition.operator === "IS NOT NULL" ? (
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
              {t("condition.value") || "Valor"}
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 text-sm font-medium text-gray-500 rounded-lg cursor-not-allowed">
               {condition.operator === "IS NULL" ? (t("condition.isNull") || "Nulo") : (t("condition.isNotNull") || "Não nulo")}
            </div>
          </div>
        ) : condition.operator === "Entre" || condition.operator === "Não Entre" ? (
          <div className="flex gap-2 flex-1 min-w-[160px]">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 truncate">
                {t("condition.initialValue") || "Valor Inicial"}
              </label>
              <DynamicInputByType
                type={getInputType(condition.column_type, condition.operator)}
                value={rangeValues.value1}
                onChange={handleRangeValue1Change}
                placeholder={t("condition.initialValue") || "Valor inicial"}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 truncate">
                {t("condition.finalValue") || "Valor Final"}
              </label>
              <DynamicInputByType
                type={getInputType(condition.column_type, condition.operator)}
                value={rangeValues.value2}
                onChange={handleRangeValue2Change}
                placeholder={t("condition.finalValue") || "Valor final"}
              />
            </div>
          </div>
        ) : condition.operator === "IN" || condition.operator === "NOT IN" ? (
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
               {t("condition.valuesList") || "Lista de Valores"}
            </label>
            <OperationINAndNOTINInput
              type={condition.column_type}
              value={inValues}
              onChange={handleInValuesChange}
              placeholder={t("condition.typeValue") || "Digite um valor e dê Enter"}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
              {t("condition.value") || "Valor"}
            </label>
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
        <div className="flex items-end pb-0.5">
          <button
            onClick={() => removeCondition(index)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title={t("actions.removeCondition") || "Remover condição"}
            aria-label={t("actions.removeCondition") || "Remover condição"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(FiltroCondicaoItem);