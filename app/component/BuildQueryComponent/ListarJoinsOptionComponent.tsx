"use client";

import React, { useState } from 'react';
import { GripVertical, Eye, EyeOff, Plus, X, ChevronUp, ChevronDown, Code, AlertTriangle } from 'lucide-react';
import { JoinTableItemProps } from './types';
import { JoinType } from '@/types';
import JoinConditionRow from './JoinConditionRow';
import { generateOnClause } from '@/util/Joins_select';
import { useI18n } from '@/context/I18nContext'; // 🔹 Importado

const JoinTableItem: React.FC<JoinTableItemProps> = ({
  tableName,
  index,
  selectedJoin,
  conditions,
  isExpanded,
  isDragging,
  isDragOver,
  joinTypes,
  operators,
  allColumnOptions,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleJoinTypeChange,
  toggleExpanded,
  moveTable,
  removeJoinTable,
  addCondition,
  updateCondition,
  removeCondition,
  joinOrderLength
}) => {
  const { t } = useI18n(); // 🔹 Instanciado
  const hasConditions = conditions && conditions.length > 0;
  const isValidJoin = hasConditions && conditions.some(c => c.leftColumn && c.rightColumn);
  const onClause = generateOnClause(conditions || []);

  const [showSQL, setShowSQL] = useState(false);

  return (
    <div
      key={`join-table-${tableName}-${index}`}
      draggable
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={`
        bg-white rounded-xl border transition-all duration-200 group
        ${isDragging ? 'opacity-50 shadow-2xl scale-[1.02] border-blue-500 bg-blue-50/50' : ''}
        ${isDragOver ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}
        ${!isValidJoin ? 'border-red-300 bg-red-50/10' : ''}
      `}
    >
      {/* Header do JOIN */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          
          {/* Drag handle e índice */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0" />
            <span className="font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
              {index + 1}º
            </span>
          </div>

          {/* Configuração do JOIN */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              
              {/* Tipo de JOIN */}
              <select
                value={selectedJoin?.typeJoin || "INNER JOIN"}
                onChange={(e) => handleJoinTypeChange(tableName, e.target.value as JoinType)}
                className="text-xs sm:text-sm font-bold border border-gray-200 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50 hover:bg-white text-gray-700
                           px-2 py-1.5 min-w-[110px] flex-shrink-0 cursor-pointer transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {joinTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Nome da tabela */}
              <span className="text-sm font-bold text-gray-900 flex-shrink-0 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                {tableName}
              </span>

              <span className="text-[10px] font-bold tracking-widest text-gray-400 flex-shrink-0 hidden sm:inline px-1">
                ON
              </span>

              {/* Visualização das condições (Read-only Badge) */}
              <div className={`
                text-xs font-mono px-3 py-1.5 rounded-lg border flex-1 min-w-0 flex items-center gap-2
                ${isValidJoin
                  ? 'bg-gray-50 border-gray-200 text-gray-600'
                  : 'bg-red-50 border-red-200 text-red-700 font-medium'
                }
              `}>
                {!isValidJoin && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
                <div className="truncate" title={onClause || t("joins.noConditionConfigured") || "Nenhuma condição configurada"}>
                  {onClause || t("joins.configureConditionsWarning") || "Configure as condições deste Join"}
                </div>
              </div>
            </div>
          </div>

          {/* Controles do Lado Direito */}
          <div className="flex items-center gap-1 flex-shrink-0">
            
            {/* Botão expandir/recolher */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(tableName);
              }}
              className={`
                p-2 rounded-lg transition-colors border
                ${isExpanded
                  ? 'text-blue-700 bg-blue-50 border-blue-200 shadow-sm'
                  : 'text-gray-500 bg-white border-transparent hover:bg-gray-100 hover:text-gray-700'}
              `}
              title={isExpanded ? (t("actions.collapseConditions") || "Recolher condições") : (t("actions.expandConditions") || "Expandir condições")}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            {/* Controles de movimento e remoção */}
            <div className="hidden group-hover:flex items-center gap-1 transition-opacity">
              {index > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveTable(index, 'up');
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t("actions.moveUp") || "Mover para cima"}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}

              {index < joinOrderLength - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveTable(index, 'down');
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t("actions.moveDown") || "Mover para baixo"}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeJoinTable(tableName);
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={t("actions.removeJoin") || "Remover JOIN"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Condições expandidas */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 sm:p-5 bg-gray-50/50 rounded-b-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {t("joins.joinConditions") || "Condições do JOIN"}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSQL(prev => !prev);
                  }}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 shadow-sm font-bold text-xs
                    ${showSQL
                      ? 'text-gray-900 bg-gray-200 border-gray-300'
                      : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  title={showSQL ? (t("actions.hideSql") || "Ocultar SQL") : (t("actions.showSql") || "Ver SQL")}
                >
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {showSQL ? (t("actions.hideSql") || "Ocultar SQL") : (t("actions.showSql") || "Ver SQL")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addCondition(tableName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold 
                             text-blue-700 bg-white border border-gray-200 rounded-lg shadow-sm
                             hover:bg-blue-50 hover:border-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  title={t("actions.addJoinCondition") || "Adicionar nova condição ao JOIN"}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("actions.addCondition") || "Adicionar Condição"}
                </button>
              </div>
            </div>

            {/* Lista de condições */}
            {hasConditions ? (
              <div className="space-y-3 sm:ml-[5%] lg:ml-[10%]">
                {conditions.map((condition, condIndex) => (
                  <JoinConditionRow
                    key={`${condition.id}-${condIndex}`}
                    condition={condition}
                    condIndex={condIndex}
                    tableName={tableName}
                    conditions={conditions}
                    operators={operators}
                    allColumnOptions={allColumnOptions}
                    updateCondition={updateCondition}
                    removeCondition={removeCondition}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-sm font-medium">{t("joins.noConditionConfigured") || "Nenhuma condição configurada"}</p>
              </div>
            )}

            {/* Preview do SQL gerado */}
            {isValidJoin && showSQL && (
              <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  {t("joins.generatedSql") || "SQL gerado:"}
                </div>
                <code className="text-sm font-mono text-blue-300 break-words leading-relaxed">
                  <span className="text-purple-400">{selectedJoin?.typeJoin}</span> {tableName} <span className="text-purple-400">ON</span> {onClause}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(JoinTableItem);