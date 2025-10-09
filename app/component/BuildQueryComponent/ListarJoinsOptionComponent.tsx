import React, { useState } from 'react';
import { GripVertical, Eye, EyeOff, Plus, X, ChevronUp, ChevronDown, Code } from 'lucide-react';
import { JoinTableItemProps } from './types';
import { JoinType } from '@/types';
import JoinConditionRow from './JoinConditionRow';
import { generateOnClause } from '@/util/Joins_select';

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
  const hasConditions = conditions && conditions.length > 0;
  const isValidJoin = hasConditions && conditions.some(c => c.leftColumn && c.rightColumn);
  const onClause = generateOnClause(conditions || []);

  // 🔥 Novo estado para controlar visualização do SQL preview
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
        bg-white rounded-lg border transition-all duration-200 group
        ${isDragging ? 'opacity-60 shadow-xl scale-[1.02] border-blue-400 bg-blue-50' : ''}
        ${isDragOver ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
        ${!isValidJoin ? 'border-orange-200 bg-orange-50/30' : ''}
      `}
    >
      {/* Header do JOIN */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Drag handle e índice */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move flex-shrink-0" />
            <span className="font-medium bg-gray-100 px-2 py-1 rounded text-xs">
              {index + 1}°
            </span>
          </div>

          {/* Configuração do JOIN */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {/* Tipo de JOIN */}
              <select
                value={selectedJoin?.typeJoin || "INNER JOIN"}
                onChange={(e) => handleJoinTypeChange(tableName, e.target.value as JoinType)}
                className="text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm 
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white
                         min-w-[100px] flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {joinTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Nome da tabela */}
              <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">
                {tableName}
              </span>

              <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 hidden sm:inline">
                ON
              </span>

              {/* Visualização das condições */}
              <div className={`
                text-xs font-mono px-2 py-1 rounded border flex-1 min-w-0
                ${isValidJoin
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : hasConditions
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }
              `}>
                <div className="truncate" title={onClause || "Nenhuma condição configurada"}>
                  {onClause || "⚠️ Configure as condições"}
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Botão mostrar/ocultar SQL preview */}



            {/* Botão expandir/recolher */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(tableName);
              }}
              className={`
                p-1.5 rounded-md transition-colors
                ${isExpanded
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
              `}
              title={isExpanded ? "Recolher condições" : "Expandir condições"}
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
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Mover para cima"
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
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Mover para baixo"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // if (window.confirm(`Remover JOIN com a tabela ${tableName}?`)) {
                    removeJoinTable(tableName);
                  // }
                }}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Remover JOIN"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Condições expandidas */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-3 sm:p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Condições do JOIN
                </h4>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSQL(prev => !prev);
                }}
                className={`
    flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all duration-200
    ${showSQL
                    ? 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                    : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }
  `}
                title={showSQL ? "Ocultar SQL preview" : "Visualizar SQL preview"}
              >
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">
                  {showSQL ? "Ocultar SQL" : "Ver SQL"}
                </span>
              </button>


              <button
                type="button"
                onClick={() => addCondition(tableName)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                         text-green-700 bg-green-50 border border-green-200 rounded-md
                         hover:bg-green-100 hover:border-green-300 transition-colors"
                title="Adicionar nova condição ao JOIN"
              >
                <Plus className="h-3 w-3" />
                Adicionar Condição
              </button>
            </div>

            {/* Lista de condições */}
            {hasConditions ? (
              <div className="space-y-2 ml-[10%]">
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
              <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-sm">Nenhuma condição configurada</p>
              </div>
            )}

            {/* Preview do SQL gerado */}
            {isValidJoin && showSQL && (
              <div className="mt-3 p-2 bg-white border border-gray-200 rounded-md">
                <div className="text-xs text-gray-500 mb-1">SQL gerado:</div>
                <code className="text-xs font-mono text-gray-700">
                  {selectedJoin?.typeJoin} {tableName} ON {onClause}
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
