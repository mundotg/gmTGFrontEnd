"use client";
import React, { useState } from "react";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import DynamicInputByType from "./DynamicInputByType";
import { tipo_db_Options } from "@/types";
import { useI18n } from "@/context/I18nContext";

interface OperationINAndNOTINInputProps {
  type: tipo_db_Options;
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}

const OperationINAndNOTINInput: React.FC<OperationINAndNOTINInputProps> = ({ 
  type, 
  value, 
  onChange, 
  placeholder 
}) => {
  const { t } = useI18n();
  const [inputs, setInputs] = useState<string[]>(value.length ? value : [""]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (val: string, index: number) => {
    const newValues = [...inputs];
    newValues[index] = val;
    setInputs(newValues);
    onChange(newValues.filter((v) => v !== ""));
  };

  const addInput = () => {
    setInputs([...inputs, ""]);
  };

  const removeInput = (index: number) => {
    const newValues = inputs.filter((_, i) => i !== index);
    setInputs(newValues);
    onChange(newValues.filter((v) => v !== ""));
  };

  const filledInputsCount = inputs.filter(val => val !== "").length;

  return (
    <div className="w-full">
      {/* Header com contador e botão de colapso */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {filledInputsCount} {filledInputsCount !== 1 ? (t("common.valuesPlural") || "valores") : (t("common.valueSingle") || "valor")}
        </span>
        
        {inputs.length > 1 && (
          <button
            type="button"
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-md px-1.5 py-0.5"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronUp size={14} strokeWidth={2.5} />}
            {isCollapsed ? (t("actions.expand") || "Expandir") : (t("actions.collapse") || "Ocultar")}
          </button>
        )}
      </div>

      {/* Inputs - mostrados apenas se não estiver colapsado */}
      {!isCollapsed && (
        <div className="space-y-3">
          {inputs.map((val, i) => (
            <div key={i} className="flex items-center gap-2 w-full group">
              <div className="flex-1 min-w-0">
                <DynamicInputByType
                  type={type}
                  value={val}
                  onChange={(newVal) => handleChange(newVal, i)}
                  placeholder={placeholder}
                />
              </div>
              {inputs.length > 1 && (
                <button
                  type="button"
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  onClick={() => removeInput(i)}
                  title={t("actions.removeValue") || "Remover valor"}
                  aria-label={t("actions.removeValue") || "Remover valor"}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
            onClick={addInput}
          >
            <Plus size={14} strokeWidth={2.5} /> 
            {t("actions.addValue") || "Adicionar valor"}
          </button>
        </div>
      )}

      {/* Preview quando colapsado */}
      {isCollapsed && filledInputsCount > 0 && (
        <div className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-200 shadow-sm font-medium">
          <span className="font-bold text-gray-900 mr-1">{t("common.values") || "Valores"}:</span>
          <span className="text-gray-600 leading-relaxed">
            {inputs
              .filter(val => val !== "")
              .slice(0, 3)
              .map(val => `"${val}"`)
              .join(", ")}
            {filledInputsCount > 3 && ` ... ${t("common.andMore") || "e mais"} ${filledInputsCount - 3}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default OperationINAndNOTINInput;