"use client";
import React from "react";
import { Filter, Plus, Trash2, Database, Eraser } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

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
  const { t } = useI18n();
  const validConditionsCount = conditions.filter((c) => c.value.trim()).length;

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-5">
      <div className="space-y-4">
        {/* Título e info */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl border border-blue-200 shadow-sm shrink-0">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {title}
            </h3>
            <p className="text-sm font-medium text-gray-500">
              {lengthCondition}{" "}
              {lengthCondition === 1 ? (t("builder.condition") || "condição") : (t("builder.conditions") || "condições")}
              {lengthCondition > 0 &&
                ` • ${validConditionsCount} ${t("builder.valid") || "válidas"}`}
            </p>
          </div>
        </div>

        {/* Botões principais */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Ações Principais (Esquerda) */}
          <div className="flex flex-1 gap-2">
            {/* Selecionar Tabelas */}
            <button
              onClick={() => setShowTableModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all text-sm font-bold shadow-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            >
              <Database className="w-4 h-4" />
              <span className="hidden xs:inline">{t("builder.tables") || "Tabelas"}</span>
              <span className="xs:hidden">{t("builder.select") || "Select"}</span>
              {select.length > 0 && (
                <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-bold ml-1">
                  {select.length}
                </span>
              )}
            </button>

            {/* Adicionar Condição */}
            <button
              onClick={addCondition}
              disabled={lengthCondition >= maxConditions}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-colors focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">{t("actions.add") || "Adicionar"}</span>
              <span className="xs:hidden">{t("actions.addShort") || "Add"}</span>
            </button>
          </div>

          {/* Ações Secundárias (Direita) */}
          <div className="flex gap-2 justify-end">
            {/* Preview SQL */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors border shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none ${
                showPreview 
                  ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {showPreview ? (t("actions.hide") || "Ocultar") : "SQL Preview"}
            </button>

            {/* Limpar Condições */}
            {lengthCondition > 0 && (
              <button
                onClick={clearAllConditions}
                className="p-2 text-red-600 bg-white border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none flex items-center justify-center"
                title={t("builder.clearConditions") || "Limpar todas as condições"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Limpar Cache */}
            <button
              onClick={LimparCacheLocalStorage}
              className="p-2 text-orange-600 bg-white border border-gray-300 hover:border-orange-300 hover:bg-orange-50 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-orange-500/50 focus:outline-none flex items-center justify-center"
              title={t("builder.clearCache") || "Limpar tudo e cache"}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBuild;