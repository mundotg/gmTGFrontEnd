// components/OrderByOptions.tsx - Versão compatível com QueryBuilder
import { MultiOrderByOption, MetadataTableResponse } from "@/types";
import React from "react";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";
import { Plus, X, GripVertical } from "lucide-react";

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          Ordenar por
        </label>
        
        <button
          type="button"
          onClick={addOrderByColumn}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                   text-blue-700 bg-blue-50 border border-blue-200 rounded-md 
                   hover:bg-blue-100 hover:border-blue-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar coluna
        </button>
      </div>

      {orderBy.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Nenhuma coluna de ordenação definida</p>
          <button
            type="button"
            onClick={addOrderByColumn}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clique aqui para adicionar uma coluna
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {orderBy.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200 
                       hover:border-gray-300 transition-all cursor-move group"
            >
              {/* Indicador de ordem e handle para arrastar */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <GripVertical 
                  className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600" 
                />
                <span className="sr-only">Arrastar para reordenar</span>
                <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                  {index + 1}°
                </span>
              </div>

              {/* Seletor de coluna */}
              <div className="flex-1 min-w-0">
                <JoinSelect
                  className="w-full"
                  buttonClassName="border-gray-300 hover:border-gray-400 text-xs px-2 py-1"
                  value={item.column}
                  onChange={(value) => updateOrderByColumn(index, value)}
                  options={columnOptions}
                  placeholder="Selecione uma coluna"
                />
              </div>

              {/* Direção ASC / DESC */}
              <div className="w-24">
                <select
                  value={item.direction}
                  onChange={(e) => updateOrderByDirection(index, e.target.value as "ASC" | "DESC")}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 
                           focus:ring-blue-500 text-xs"
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
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Mover para cima"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}

                {/* Mover para baixo */}
                {index < orderBy.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveOrderByColumn(index, index + 1)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Mover para baixo"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Remover */}
                <button
                  type="button"
                  onClick={() => removeOrderByColumn(index)}
                  className="p-1 text-red-400 hover:text-red-600 rounded"
                  title="Remover coluna"
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
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <p className="font-medium mb-1">Ordem de prioridade:</p>
          <p>
            Os registros serão ordenados primeiro pela 1° coluna, depois pela 2° coluna 
            (em caso de empate), e assim por diante.
          </p>
        </div>
      )}
    </div>
  );
}