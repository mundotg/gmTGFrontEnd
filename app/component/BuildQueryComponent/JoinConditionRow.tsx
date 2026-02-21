"use client";
import { X } from "lucide-react";
import { JoinSelect } from "./JoinSelect";
import { JoinConditionRowProps, LogicalOperators } from "./types";
import React from "react";
import DynamicInputByType from "../DynamicInputByType";
import OperationINAndNOTINInput from "../InInput";
import { useI18n } from "@/context/I18nContext"; // 🔹 Importado

// Componente para cada linha de condição
const JoinConditionRow: React.FC<JoinConditionRowProps> = ({
  condition,
  condIndex,
  tableName,
  conditions,
  operators,
  allColumnOptions,
  updateCondition,
  removeCondition,
}) => {
  const { t } = useI18n(); // 🔹 Instanciado

  function handleInValuesChange(val: string[]): void {
    const formattedValue = val.map(v => v.trim()).filter(v => v).join(", ");
    updateCondition(tableName, condition.id, { rightValue: formattedValue });
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl transition-all hover:bg-white hover:border-blue-200 hover:shadow-sm">
      
      {/* Operador Lógico (Apenas para índice > 0) */}
      {condIndex > 0 && (
        <select
          value={condition.logicalOperator || "AND"}
          onChange={(e) => updateCondition(tableName, condition.id, {
            logicalOperator: e.target.value as LogicalOperators
          })}
          className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
        >
          {["AND", "OR"].map(op => (
            <option key={op} value={op}>{op === "AND" ? t("condition.and") || "AND" : t("condition.or") || "OR"}</option>
          ))}
        </select>
      )}

      {/* Coluna esquerda */}
      <div className="flex-1 min-w-[150px]">
        <JoinSelect
          className="w-full text-sm"
          buttonClassName="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium shadow-sm transition-colors"
          value={condition.leftColumn}
          onChange={(value) => updateCondition(tableName, condition.id, { leftColumn: value })}
          options={allColumnOptions.filter(opt => opt.value !== condition.rightColumn)}
          placeholder={t("joins.leftColumn") || "Coluna esquerda"}
        />
      </div>

      {/* Operador de Comparação */}
      <div className="shrink-0 min-w-[100px]">
        <select
          value={condition.operator}
          onChange={(e) => updateCondition(tableName, condition.id, { operator: e.target.value })}
          className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
        >
          {operators.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </div>

      {/* Valor/Coluna direita */}
      {!["IS NULL", "IS NOT NULL"].includes(condition.operator) && (
        <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-colors">
          
          {/* Toggle Value vs Column */}
          <label className="flex items-center gap-1.5 pl-2 cursor-pointer border-r border-gray-100 pr-3">
            <input
              type="checkbox"
              checked={condition.useValue}
              onChange={(e) => updateCondition(tableName, condition.id, { useValue: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/50 transition-colors cursor-pointer"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 select-none">
              {t("condition.value") || "Valor"}
            </span>
          </label>

          {/* Renderização condicional do campo da direita */}
          <div className="flex-1">
            {condition.useValue ? (
              condition.operator === "IN" || condition.operator === "NOT IN" ? (
                <OperationINAndNOTINInput
                  type={condition.valueColumnType || "text"}
                  value={condition.rightValue?.split(",") || []}
                  onChange={handleInValuesChange}
                  placeholder={t("condition.typeValue") || "Digite um valor"}
                />
              ) : (
                <DynamicInputByType
                  type={condition.valueColumnType || "text"}
                  enum_values={condition.enumValores}
                  operator={condition.operator}
                  value={condition.rightValue || ""}
                  onChange={(value) => updateCondition(tableName, condition.id, { rightValue: value })}
                  placeholder={t("joins.literalValue") || "Valor literal"}
                />
              )
            ) : (
              <JoinSelect
                className="w-full text-sm"
                buttonClassName="w-full px-2 py-1.5 text-gray-900 font-medium focus:outline-none border-none bg-transparent"
                value={condition.rightColumn}
                onChange={(value) => updateCondition(tableName, condition.id, { rightColumn: value })}
                options={allColumnOptions.filter(opt => opt.value !== condition.leftColumn)}
                placeholder={t("joins.rightColumn") || "Coluna direita"}
              />
            )}
          </div>
        </div>
      )}

      {/* Remover condição */}
      {conditions.length > 1 && (
        <button
          type="button"
          onClick={() => removeCondition(tableName, condition.id)}
          className="p-2 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
          title={t("actions.removeCondition") || "Remover condição"}
          aria-label={t("actions.removeCondition") || "Remover condição"}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default React.memo(JoinConditionRow);