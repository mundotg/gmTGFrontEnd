"use client";
import React from "react";
import { Filter, Plus, Trash2, Database, MemoryStick } from "lucide-react";

interface HeaderProps {
  title: string;
  lengthCondition: number;
  maxConditions: number;
  conditions: { value: string }[];
  select: string[];
  showPreview: boolean;
  setShowPreview: (value: boolean) => void;
  setShowTableModal: (value: boolean) => void;
  addCondition: () => void;
  clearAllConditions: () => void;
  LimparCacheLocalStorage: () => void;
}

const HeaderBuild: React.FC<HeaderProps> = ({
  title,
  lengthCondition,
  maxConditions,
  conditions,
  select,
  showPreview,
  setShowPreview,
  setShowTableModal,
  addCondition,
  clearAllConditions,
  LimparCacheLocalStorage,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 lg:p-6 border-b">
      <div className="space-y-3 sm:space-y-4">
        {/* Título e info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {lengthCondition}{" "}
              {lengthCondition === 1 ? "condição" : "condições"}
              {lengthCondition > 0 &&
                ` • ${
                  conditions.filter((c) => c.value.trim()).length
                } válidas`}
            </p>
          </div>
        </div>

        {/* Botões principais */}
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          {/* Linha 1 */}
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

          {/* Linha 2 */}
          <div className="flex gap-2 xs:gap-2">
            {/* Preview SQL */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 xs:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[36px] sm:min-h-[40px]"
            >
              {showPreview ? "Ocultar" : "Preview sql"}
            </button>

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
  );
};

export default HeaderBuild;
