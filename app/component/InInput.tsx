import React, { useState } from "react";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import DynamicInputByType from "./DynamicInputByType";
import { tipo_db_Options } from "@/types";

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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {filledInputsCount} valor{filledInputsCount !== 1 ? 'es' : ''}
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          {isCollapsed ? 'Expandir' : 'Ocultar'}
        </button>
      </div>

      {/* Inputs - mostrados apenas se não estiver colapsado */}
      {!isCollapsed && (
        <div className="space-y-2">
          {inputs.map((val, i) => (
            <div key={i} className="flex items-center gap-2 w-full">
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
                  className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  onClick={() => removeInput(i)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            onClick={addInput}
          >
            <Plus size={12} /> Adicionar valor
          </button>
        </div>
      )}

      {/* Preview quando colapsado */}
      {isCollapsed && filledInputsCount > 0 && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
          <span className="font-medium">Valores: </span>
          {inputs
            .filter(val => val !== "")
            .slice(0, 3)
            .join(", ")}
          {filledInputsCount > 3 && ` ... e mais ${filledInputsCount - 3}`}
        </div>
      )}
    </div>
  );
};

export default OperationINAndNOTINInput;