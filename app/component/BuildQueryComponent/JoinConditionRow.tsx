import { X } from "lucide-react";
import { JoinSelect } from "./JoinSelect";
import { JoinConditionRowProps, LogicalOperators } from "./types";
import React from "react";
import DynamicInputByType from "../DynamicInputByType";

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
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-gray-200 rounded w-auto">
      {/* Operador lógico */}
      {condIndex > 0 && (
        <select
          value={condition.logicalOperator || "AND"}
          onChange={(e) => updateCondition(tableName, condition.id, { 
            logicalOperator: e.target.value as LogicalOperators
          })}
          className="text-xs border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 font-medium"
        >
          {["AND" , "OR"].map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      )}

      {/* Coluna esquerda */}
      <JoinSelect
        className="text-xs"
        buttonClassName="min-w-[120px] text-xs border px-2 py-1"
        value={condition.leftColumn}
        onChange={(value) => updateCondition(tableName, condition.id, { leftColumn: value })}
        options={allColumnOptions.filter(opt => opt.value !== condition.rightColumn)}
        placeholder="Coluna esquerda"
      />

      {/* Operador */}
      <select
        value={condition.operator}
        onChange={(e) => updateCondition(tableName, condition.id, { operator: e.target.value })}
        className="text-xs border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 w-auto"
      >
        {operators.map(op => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>

      {/* Valor/Coluna direita */}
      {!["IS NULL", "IS NOT NULL"].includes(condition.operator) && (
        <div className="relative w-auto flex flex-row">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={condition.useValue}
              onChange={(e) => updateCondition(tableName, condition.id, { useValue: e.target.checked })}
              className="text-blue-600 w-10"
            />
            <span className="text-xs text-gray-600">Valor</span>
          </div>

          {condition.useValue ? (
            <DynamicInputByType
              type={condition.valueColumnType || "text"}
              enum_values={condition.enumValores}
              operator={condition.operator}
              value={condition.rightValue || ""}
              onChange={(value) => updateCondition(tableName, condition.id, { rightValue: value })}
              placeholder="Valor literal"
              // className="text-xs border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 min-w-[100px]"
            />
          ) : (
            <JoinSelect
              className="text-xs"
              buttonClassName="min-w-[120px] text-xs border px-2 py-1"
              value={condition.rightColumn}
              onChange={(value) => updateCondition(tableName, condition.id, { rightColumn: value })}
              options={allColumnOptions.filter(opt => opt.value !== condition.leftColumn)}
              placeholder="Coluna direita"
            />
          )}
        </div>
      )}

      {/* Remover condição */}
      {conditions.length > 1 && (
        <button
          type="button"
          onClick={() => removeCondition(tableName, condition.id)}
          className="p-1 text-red-400 hover:text-red-600 rounded"
          title="Remover condição"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default React.memo(JoinConditionRow)