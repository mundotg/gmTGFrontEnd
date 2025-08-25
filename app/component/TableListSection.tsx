// components/TableListSection.tsx
import React from "react";
import { Check, Database } from "lucide-react";

interface TableListSectionProps {
  filteredTables: string[];
  localSelection: string[];
  toggleTable: (table: string) => void;
  useDistinct: boolean;
  distinctColumns: string[];
  handleDistinctAdd: (e: React.ChangeEvent<HTMLInputElement>, table: string) => void;
  searchTerm: string;
}

export const TableListSection: React.FC<TableListSectionProps> = ({
  filteredTables,
  localSelection,
  toggleTable,
  useDistinct,
  distinctColumns,
  handleDistinctAdd,
  searchTerm,
}) => {
  if (filteredTables.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="text-center py-12 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">Nenhuma tabela encontrada</p>
          <p className="text-sm">
            {searchTerm ? "Tente ajustar o termo de pesquisa" : "Nenhuma tabela disponível"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6" aria-label="Lista_de_Tabelas">
      <div className="space-y-1">
        {filteredTables.map((table, index) => {
          const isSelected = localSelection.includes(table);
          return (
            <div
              key={`${table}-${index}+lis`}
              className={`p-3 rounded-lg border transition-all ${
                isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 border-transparent"
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTable(table)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span
                  className={`text-sm lg:text-base transition-colors ${
                    isSelected ? "text-blue-800 font-medium" : "text-gray-700"
                  }`}
                >
                  {table}
                </span>
              </label>

              {useDistinct && (
                <label className="flex items-center gap-1 text-xs text-gray-600 mt-2 pl-7">
                  <input
                    type="checkbox"
                    checked={distinctColumns.includes(table)}
                    onChange={(e) => handleDistinctAdd(e, table)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  DISTINCT
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
