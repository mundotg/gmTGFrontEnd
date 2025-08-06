// components/JoinOptions.tsx
import { JoinOption, JoinType, MetadataTableResponse } from "@/types";
import React from "react";

const joinTypes: JoinType[] = ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"];

interface JoinOptionsProps {
  joinConfig: Record<string, JoinOption>;
  setJoinConfig: (value: Record<string, JoinOption>) => void;
  columns: MetadataTableResponse[];
}

export function JoinOptions({ joinConfig, setJoinConfig, columns }: JoinOptionsProps) {
  const baseTable = columns[0].table_name; // Ex: "alembic_version"

  return (
    <div className="border p-2 lg:p-4 rounded-lg bg-gray-50 space-y-3">
      {columns.slice(1).map((table, index) => {
        const tableName = table.table_name;
        const baseCols = columns.find(c => c.table_name === baseTable)?.colunas || [];

        const selectedJoin = joinConfig[tableName];

        const handleJoinTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const updated = {
            ...joinConfig,
            [tableName]: {
              ...(selectedJoin || {
                table: tableName,
                on: `${baseTable}.id = ${tableName}.${baseTable}_id`,
              }),
              type: e.target.value as JoinType,
            },
          };
          setJoinConfig(updated);
        };

        const handleOnChange = (left: string, right: string) => {
          const updated = {
            ...joinConfig,
            [tableName]: {
              ...(selectedJoin || { table: tableName, type: "INNER JOIN" }),
              on: `${baseTable}.${left} = ${tableName}.${right}`,
            },
          };
          setJoinConfig(updated);
        };

        return (
          <div key={index+table.table_name} className="flex flex-wrap items-center gap-2">
            {/* JOIN TYPE */}
            <select
              value={selectedJoin?.type || "INNER JOIN"}
              onChange={handleJoinTypeChange}
              className="text-xs lg:text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {joinTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* TABLE NAME */}
            <span className="text-xs lg:text-sm font-medium text-gray-700">{tableName} ON</span>

            {/* BASE TABLE COLUMN */}
            <select
              className="text-xs border rounded"
              onChange={e =>
                handleOnChange(e.target.value, selectedJoin?.on?.split(" = ")[1]?.split(".")[1] || table.colunas[0].nome)
              }
              value={selectedJoin?.on?.split(" = ")[0]?.split(".")[1] || baseCols[0].nome}
            >
              {columns
                .filter((_table) => _table.table_name !== tableName)
                .flatMap((_table) =>
                  _table.colunas.map((col, j) => (
                    <option key={_table.table_name+col.nome + j+"base"} value={col.nome}>
                      {_table.table_name}.{col.nome}
                    </option>
                  ))
                )}
            </select>

            <span className="text-gray-500">=</span>

            {/* JOINED TABLE COLUMN */}
            <select
              className="text-xs border rounded"
              onChange={e =>
                handleOnChange(selectedJoin?.on?.split(" = ")[0]?.split(".")[1] || baseCols[0].nome, e.target.value)
              }
              value={selectedJoin?.on?.split(" = ")[1]?.split(".")[1] || table.colunas[0].nome}
            >
              {table.colunas.map((col, i) => (
                <option key={col.nome + i+"joined"+tableName} value={col.nome}>
                  {tableName}.{col.nome}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
