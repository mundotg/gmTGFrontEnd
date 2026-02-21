"use client";
import { MultiOrderByOption, MetadataTableResponse } from "@/types";
import React from "react";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";
import { Plus, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface OrderByOptionsProps {
  columns: MetadataTableResponse[];
  orderBy: MultiOrderByOption;
  setOrderBy: (value: MultiOrderByOption) => void;
}

export function OrderByOptions({
  columns,
  orderBy,
  setOrderBy,
}: OrderByOptionsProps) {
  const { t } = useI18n();

  const columnOptions = columns.flatMap((tabela) =>
    tabela.colunas.map((col) => ({
      value: `${tabela.table_name}.${col.nome}`,
      label: `${tabela.table_name}.${col.nome}`
    }))
  );

  const addOrderByColumn = () => {
    const newOrderBy = [...orderBy, { column: "", direction: "ASC" as const }];
    setOrderBy(newOrderBy);
  };

  const removeOrderByColumn = (index: number) => {
    const newOrderBy = orderBy.filter((_, i) => i !== index);
    setOrderBy(newOrderBy);
  };

  const updateOrderByColumn = (index: number, column: string) => {
    const newOrderBy = [...orderBy];
    newOrderBy[index] = { ...newOrderBy[index], column };
    setOrderBy(newOrderBy);
  };

  const updateOrderByDirection = (index: number, direction: "ASC" | "DESC") => {
    const newOrderBy = [...orderBy];
    newOrderBy[index] = { ...newOrderBy[index], direction };
    setOrderBy(newOrderBy);
  };

  const moveOrderByColumn = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderBy.length) return;
    
    const newOrderBy = [...orderBy];
    const [movedItem] = newOrderBy.splice(fromIndex, 1);
    newOrderBy.splice(toIndex, 0, movedItem);
    setOrderBy(newOrderBy);
  };

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex !== dropIndex) {
      moveOrderByColumn(dragIndex, dropIndex);
    }
  };

  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <label className="block text-sm font-bold text-gray-900">
          {t("orderBy.title") || "Ordenar por"}
        </label>
        
        <button
          type="button"
          onClick={addOrderByColumn}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <Plus className="h-4 w-4" />
          {t("orderBy.addColumn") || "Adicionar coluna"}
        </button>
      </div>

      {orderBy.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="space-y-2">
            <p className="text-gray-500 font-medium text-sm">
              {t("orderBy.noColumns") || "Nenhuma coluna de ordenação definida"}
            </p>
            <button
              type="button"
              onClick={addOrderByColumn}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t("orderBy.clickToAdd") || "Clique aqui para adicionar uma coluna"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orderBy.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 
                         hover:border-blue-300 hover:shadow-sm transition-all cursor-move group"
            >
              
              {/* Indicador de ordem e handle para arrastar */}
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="sr-only">{t("actions.dragToReorder") || "Arrastar para reordenar"}</span>
                <span className="font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
                  {index + 1}º
                </span>
              </div>

              {/* Seletor de coluna */}
              <div className="flex-1 min-w-[200px]">
                <JoinSelect
                  className="w-full text-sm"
                  buttonClassName="w-full bg-gray-50 hover:bg-white border border-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium transition-colors"
                  value={item.column}
                  onChange={(value) => updateOrderByColumn(index, value)}
                  options={columnOptions}
                  placeholder={t("orderBy.selectColumnPlaceholder") || "Selecione uma coluna"}
                />
              </div>

              {/* Direção ASC / DESC */}
              <div className="w-28 shrink-0">
                <select
                  value={item.direction}
                  onChange={(e) => updateOrderByDirection(index, e.target.value as "ASC" | "DESC")}
                  className="w-full px-3 py-2 text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-white transition-colors"
                >
                  <option value="ASC">↑ ASC</option>
                  <option value="DESC">↓ DESC</option>
                </select>
              </div>

              {/* Botões de ação */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                
                {/* Mover para cima */}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveOrderByColumn(index, index - 1)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title={t("actions.moveUp") || "Mover para cima"}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                )}

                {/* Mover para baixo */}
                {index < orderBy.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveOrderByColumn(index, index + 1)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title={t("actions.moveDown") || "Mover para baixo"}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}

                {/* Remover */}
                <button
                  type="button"
                  onClick={() => removeOrderByColumn(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  title={t("actions.removeColumn") || "Remover coluna"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informação sobre a ordem */}
      {orderBy.length > 1 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 mb-1">
            {t("orderBy.priorityOrder") || "Ordem de prioridade:"}
          </p>
          <p className="text-sm font-medium text-blue-700 leading-relaxed">
            {t("orderBy.priorityDesc") || "Os registros serão ordenados primeiro pela 1ª coluna, depois pela 2ª coluna (em caso de empate), e assim por diante."}
          </p>
        </div>
      )}
    </div>
  );
}