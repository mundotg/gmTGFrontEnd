"use client";
import { MultiOrderByOption, MetadataTableResponse } from "@/types";
import React, { useState } from "react";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";
import { Plus, X, GripVertical, ChevronUp, ChevronDown, ArrowDownUp, Info } from "lucide-react";
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const clearAllOrderBy = () => {
    setOrderBy([]);
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
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
      moveOrderByColumn(dragIndex, dropIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="p-2 sm:p-3 space-y-2.5"  aria-label= "Ordenar por (ORDER BY)">
      {/* Header com título, contador e ações rápidas */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <label className="text-xs sm:text-sm font-bold text-gray-900">
            {t("orderBy.title") || "Ordenar por (ORDER BY)"}
          </label>
          {orderBy.length > 0 && (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
              {orderBy.length} {orderBy.length === 1 ? (t("orderBy.columnSingular") || "coluna") : (t("orderBy.columnPlural") || "colunas")}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {orderBy.length > 1 && (
            <button
              type="button"
              onClick={clearAllOrderBy}
              className="text-[11px] font-semibold text-gray-500 hover:text-red-600 px-1.5 py-1 rounded transition-colors hover:bg-red-50"
              title={t("actions.clearAll") || "Limpar todas as ordenações"}
            >
              {t("actions.clearAll") || "Limpar tudo"}
            </button>
          )}

          <button
            type="button"
            onClick={addOrderByColumn}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            title={t("orderBy.addColumn") || "Adicionar coluna para ordenação"}
          >
            <Plus className="h-3 w-3" />
            <span>{t("orderBy.addColumn") || "Adicionar coluna"}</span>
          </button>
        </div>
      </div>

      {/* Lista de colunas de ordenação ou estado vazio com recuo à direita */}
      {orderBy.length === 0 ? (
        <div className="ml-3 sm:ml-6 md:ml-8 border-l-2 border-dashed border-gray-300 pl-2.5 sm:pl-3.5">
          <div className="text-center py-4 bg-gray-50/70 rounded-lg border border-gray-200">
            <p className="text-gray-500 font-medium text-xs">
              {t("orderBy.noColumns") || "Nenhuma coluna de ordenação definida"}
            </p>
            <button
              type="button"
              onClick={addOrderByColumn}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("orderBy.clickToAdd") || "Clique aqui para adicionar"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Lista compacta com recuo à direita e altura para exatamente 2 linhas antes do scroll */
        <div className="ml-3 sm:ml-6 md:ml-8 border-l-2 border-blue-400/60 pl-2 sm:pl-3.5 space-y-1.5 max-h-[105px] sm:max-h-[114px] overflow-y-auto pr-1 sm:pr-1.5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {orderBy.map((item, index) => {
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-lg border transition-all group
                  ${isDragging ? "opacity-50 border-blue-500 bg-blue-50/40 shadow-md scale-[1.01]" : ""}
                  ${isDragOver ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-200 shadow-xs" : "border-gray-200 hover:border-blue-300 hover:shadow-2xs"}
                `}
              >
                {/* Indicador de ordem e handle para arrastar */}
                <div
                  className="flex items-center gap-1 text-xs text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
                  title={t("actions.dragToReorder") || "Arrastar para reordenar"}
                >
                  <GripVertical className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px] border border-gray-200 shadow-2xs">
                    {index + 1}º
                  </span>
                </div>

                {/* Seletor de coluna */}
                <div className="flex-1 min-w-0">
                  <JoinSelect
                    className="w-full text-xs"
                    buttonClassName="w-full bg-gray-50/70 hover:bg-white border border-gray-200 px-2 py-1 sm:py-1.5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium transition-colors text-xs truncate shadow-2xs"
                    value={item.column}
                    onChange={(value) => updateOrderByColumn(index, value)}
                    options={columnOptions}
                    placeholder={t("orderBy.selectColumnPlaceholder") || "Selecione uma coluna"}
                  />
                </div>

                {/* Direção ASC / DESC */}
                <div className="w-20 sm:w-24 shrink-0">
                  <select
                    value={item.direction}
                    onChange={(e) => updateOrderByDirection(index, e.target.value as "ASC" | "DESC")}
                    className="w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs font-bold text-gray-700 bg-gray-50/70 border border-gray-200 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:bg-white transition-colors"
                    title={t("orderBy.direction") || "Direção da ordenação"}
                  >
                    <option value="ASC">↑ ASC</option>
                    <option value="DESC">↓ DESC</option>
                  </select>
                </div>

                {/* Botões de ação (sempre visíveis no mobile, hover no desktop) */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {/* Mover para cima */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveOrderByColumn(index, index - 1)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      title={t("actions.moveUp") || "Mover para cima"}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Mover para baixo */}
                  {index < orderBy.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveOrderByColumn(index, index + 1)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      title={t("actions.moveDown") || "Mover para baixo"}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Remover */}
                  <button
                    type="button"
                    onClick={() => removeOrderByColumn(index)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    title={t("actions.removeColumn") || "Remover coluna"}
                    aria-label={t("actions.removeColumn") || "Remover coluna"}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Informação compacta sobre a prioridade de ordenação com recuo à direita */}
      {orderBy.length > 1 && (
        <div className="ml-3 sm:ml-6 md:ml-8 p-2 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-blue-700 leading-tight">
            {t("orderBy.priorityDesc") || "Ordenado pela 1ª coluna, depois pela 2ª (em empate), e assim por diante."}
          </p>
        </div>
      )}
    </div>
  );
}