"use client";
import React from "react";
import { Search, Info } from "lucide-react";

interface EmptyStateProps {
  isDarkMode: boolean;
  searchTerm: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredAndSortedTables: any[];
  setSearchTerm: (value: string) => void;
  setFilterSchema: (value: string) => void;
}

const EmptyStateSection: React.FC<EmptyStateProps> = ({
  isDarkMode,
  searchTerm,
  filteredAndSortedTables,
  setSearchTerm,
  setFilterSchema,
}) => {
  const isEmpty = filteredAndSortedTables.length === 0;
  const hasData = filteredAndSortedTables.length > 0;

  return (
    <>
      {/* Estado Vazio */}
      {isEmpty && (
        <div
          className={`mt-12 text-center py-16 rounded-2xl border ${
            isDarkMode
              ? "bg-gray-800/30 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <Search
              className={`w-10 h-10 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {searchTerm
              ? "Nenhuma tabela encontrada"
              : "Nenhuma tabela disponível"}
          </h3>
          <p
            className={`text-sm mb-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {searchTerm
              ? `Não encontramos tabelas correspondentes a "${searchTerm}"`
              : "Não há tabelas disponíveis no banco de dados"}
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterSchema("all");
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium"
            >
              Limpar busca
            </button>
          )}
        </div>
      )}

      {/* Footer com Informações Adicionais */}
      {hasData && (
        <div
          className={`mt-8 p-6 rounded-xl border ${
            isDarkMode
              ? "bg-gray-800/30 border-gray-700"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Dicas para Desenvolvedores</h4>
              <ul
                className={`space-y-1 text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-700"
                }`}
              >
                <li>
                  • Clique em uma tabela para expandir e visualizar todas as
                  colunas e metadados
                </li>
                <li>
                  • Use os filtros para encontrar tabelas por schema ou ordenar
                  por número de registros
                </li>
                <li>
                  • Copie nomes de tabelas rapidamente clicando no ícone de
                  cópia
                </li>
                <li>
                  • Alterne entre visualização em lista ou grade conforme sua
                  preferência
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmptyStateSection;
