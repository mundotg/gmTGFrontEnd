// components/OrderByOptions.tsx
import { OrderByOption } from "@/types";
import React from "react";

export function OrderByOptions({
  columns,
  orderBy,
  setOrderBy,
  orderDirection,
}: {
  columns: { table_name: string; colunas: { nome: string }[] }[];
  orderBy: string;
  setOrderBy: (value:OrderByOption) => void;
  orderDirection: "ASC" | "DESC";
}) {
  return (
    <div className="border p-4 rounded-lg bg-gray-50">
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        Ordenar por
      </label>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Dropdown de colunas */}
        <div className="w-full sm:flex-1">
          <select
            value={orderBy}
            onChange={(e) => setOrderBy({column:e.target.value,direction:orderDirection})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">Selecione uma coluna</option>
            {columns.flatMap((tabela) =>
              tabela.colunas.map((col, idx) => (
                <option
                  key={`${tabela.table_name}-${col.nome}-${idx}`}
                  value={`${tabela.table_name}.${col.nome}`}
                >
                  {tabela.table_name}.{col.nome}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Direção ASC / DESC */}
        <div className="w-full sm:w-40">
          <select
            value={orderDirection}
            onChange={(e) => setOrderBy({column: orderBy, direction: e.target.value as "ASC" | "DESC"})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="ASC">Crescente (ASC)</option>
            <option value="DESC">Decrescente (DESC)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
