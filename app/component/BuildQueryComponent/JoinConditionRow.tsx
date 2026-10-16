"use client";
import { X } from "lucide-react";
import { JoinSelect } from "./JoinSelect";
import { JoinConditionRowProps, LogicalOperators } from "./types";
import React from "react";
import DynamicInputByType from "../DynamicInputByType";
import OperationINAndNOTINInput from "../InInput";
import { useI18n } from "@/context/I18nContext"; // 🔹 Importado
import LikeInputGroup from "./selectTableModalComponent/renderLikeInput";
import { JoinCondition } from "@/types";

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

  const handleContainOperatorsChange = (valueContain: string): Partial<JoinCondition> => {

    const hasPrefix = valueContain.startsWith("%");
    const hasSuffix = valueContain.length > 1 && valueContain.endsWith("%");

    let clean = valueContain;

    // 🔥 remove só se existir prefixo
    if (hasPrefix) {
      clean = clean.slice(1);
    }

    // 🔥 remove só se existir sufixo
    if (hasSuffix) {
      clean = clean.slice(0, -1);
    }

    return {
      rightValue: clean,
      pattern: {
        prefix: hasPrefix ? "%" : "",
        suffix: hasSuffix ? "%" : "",
      }
    };

  }



  const isUnaryOperator = ["IS NULL", "IS NOT NULL"].includes(condition.operator);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-white border border-gray-200 rounded-lg transition-all hover:border-blue-300 hover:shadow-xs shadow-2xs"
    aria-label= "Linha de condição">

      {/* BLOCO 1: Operador lógico, Coluna esquerda, Operador de comparação e Botão Remover no mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
        {/* Operador Lógico (Apenas para índice > 0) */}
        {condIndex > 0 && (
          <select
            value={condition.logicalOperator || "AND"}
            onChange={(e) => updateCondition(tableName, condition.id, {
              logicalOperator: e.target.value as LogicalOperators
            })}
            className="shrink-0 px-2 py-1.5 text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
          >
            {["AND", "OR"].map(op => (
              <option key={op} value={op}>{op === "AND" ? t("condition.and") || "AND" : t("condition.or") || "OR"}</option>
            ))}
          </select>
        )}

        {/* Coluna esquerda */}
        <div className="flex-1 min-w-0">
          <JoinSelect
            className="w-full text-xs"
            buttonClassName="w-full bg-gray-50/70 hover:bg-white border border-gray-200 px-2.5 py-1.5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium shadow-2xs transition-colors text-xs truncate"
            value={condition.leftColumn}
            onChange={(value) => updateCondition(tableName, condition.id, { leftColumn: value })}
            options={allColumnOptions.filter(opt => opt.value !== condition.rightColumn)}
            placeholder={t("joins.leftColumn") || "Coluna esquerda"}
            autoWidth={false}
          />
        </div>

        {/* Operador de Comparação */}
        <div className="w-20 sm:w-24 shrink-0">
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(tableName, condition.id, { operator: e.target.value })}
            className="w-full px-2 py-1.5 text-xs font-bold text-gray-700 bg-gray-50/70 border border-gray-200 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-white transition-colors"
          >
            {operators.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        {/* Botão de remover (no mobile posicionado na linha superior à direita) */}
        {conditions.length > 1 && (
          <button
            type="button"
            onClick={() => removeCondition(tableName, condition.id)}
            className="sm:hidden p-1.5 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title={t("actions.removeCondition") || "Remover condição"}
            aria-label={t("actions.removeCondition") || "Remover condição"}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* BLOCO 2: Valor / Coluna Direita (oculto para IS NULL / IS NOT NULL) */}
      {!isUnaryOperator && (
        <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 bg-gray-50/70 border border-gray-200 rounded-md p-0.5 shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:bg-white transition-all">
          {/* Toggle Valor vs Coluna */}
          <label className="flex items-center gap-1 pl-2 pr-2 border-r border-gray-200 cursor-pointer shrink-0 py-1 hover:text-blue-600 transition-colors">
            <input
              type="checkbox"
              checked={condition.useValue}
              onChange={(e) => updateCondition(tableName, condition.id, { useValue: e.target.checked })}
              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500/50 transition-colors cursor-pointer"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 select-none">
              {t("condition.value") || "Valor"}
            </span>
          </label>

          {/* Renderização condicional do campo da direita */}
          <div className="flex-1 min-w-0">
            {condition.useValue ? (
              condition.operator === "IN" || condition.operator === "NOT IN" ? (
                <OperationINAndNOTINInput
                  type={condition.valueColumnType || "text"}
                  value={condition.rightValue?.split(",") || []}
                  onChange={handleInValuesChange}
                  placeholder={t("condition.typeValue") || "Digite um valor"}
                />
              ) : ["Contém", "Não Contém", "LIKE", "NOT LIKE"].includes(condition.operator) ? (
                <LikeInputGroup
                  value={condition.rightValue || ""}
                  condition={condition}
                  typeInput={condition.valueColumnType || "text"}
                  placeholder={t("joins.literalValue") || "Valor literal"}
                  onChange={(value) => updateCondition(tableName, condition.id, handleContainOperatorsChange(value))}
                  t={t}
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
                className="w-full text-xs"
                buttonClassName="w-full px-2 py-1 text-gray-900 font-medium focus:outline-none border-none bg-transparent text-xs truncate"
                value={condition.rightColumn}
                onChange={(value) => updateCondition(tableName, condition.id, { rightColumn: value })}
                options={allColumnOptions.filter(opt => opt.value !== condition.leftColumn)}
                placeholder={t("joins.rightColumn") || "Coluna direita"}
                autoWidth={false}
              />
            )}
          </div>
        </div>
      )}

      {/* Botão de remover (no desktop posicionado no final da linha) */}
      {conditions.length > 1 && (
        <button
          type="button"
          onClick={() => removeCondition(tableName, condition.id)}
          className="hidden sm:flex p-1.5 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
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