"use client";
import React, { useMemo, useCallback } from "react";
import { MetadataTableResponse, QueryResultType, SelectedRow } from "@/types";
import { useCsvExporter } from "../services/relatorio";
import ScrollableTable from "./ScrollableTable";
import api from "@/context/axioCuston";

interface ResultTableProps {
  query: string;
  queryResults: QueryResultType;
  columnsInfo?: MetadataTableResponse[];
  setQueryResults: (value: any) => void;
  setSelectedRow?: (row: SelectedRow) => void;
  selectedRow?: SelectedRow | null;
}

export default function ResultTable({
  queryResults,
  setQueryResults,
  columnsInfo = [],
  setSelectedRow,
}: ResultTableProps) {


  const columns = useMemo(() => Object.keys(queryResults.preview[0] || {}), [queryResults]);
  const headers = useMemo(() => {
    return columns.map((col) => {
      // Remove prefixos da tabela, se houver (ex: "schema.table.column" → "column")
      const colParts = col.split(".");
      const columnName = colParts.length > 1 ? colParts.slice(1).join(".") : colParts[0];

      // Procura a informação da coluna no metadata
      const tipo =
        columnsInfo
          .find((info) =>
            info.colunas.some((c) => c.nome === columnName)
          )
          ?.colunas.find((c) => c.nome === columnName)?.tipo || "unknown";

      return {
        name: col,
        type: tipo,
      };
    });
  }, [columns, columnsInfo]);

  const {
    previewInfo,
    handleExport,
    exportProgress,
    isExporting,
    showExportOptions,
    setShowExportOptions,
  } = useCsvExporter(queryResults.preview, columns, headers);




  const handleRowClick = useCallback((row: Record<string, any>, index: number) => {
    if (!setSelectedRow || !row || typeof index !== "number") return;

    const tabelasAssociadas = new Set<string>();

    // Extrai o nome da tabela de cada chave no formato "tabela.campo"
    Object.keys(row).forEach((campo) => {
      const [tableName] = campo.split(".");
      if (tableName && tableName.trim() !== "") {
        tabelasAssociadas.add(tableName.trim());
      }
    });

    const tabelas = Array.from(tabelasAssociadas);

    setSelectedRow({
      row,
      nameColumns: columns,
      index,
      tableName: tabelas
    });
  }, [setSelectedRow, columns]);

  const carregarMaisLinhas = async () => {
  const offset = queryResults.preview.length;
  const limit = 100;
  const query = queryResults.query;
  const params = queryResults.params;

  try {
    const { data } = await api.post<QueryResultType>('/api/query-scroll', {
      query,
      params,
      offset,
      limit,
    });

    if (data.success) {
      setQueryResults((prev: QueryResultType) => ({
        ...prev,
        preview: [...prev.preview, ...data.preview],
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar mais linhas:', error);
  }
};



  return (
    <div className="bg-white rounded-xl shadow-md border p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800">
            Resultados ({queryResults.preview.length.toLocaleString('pt-BR')} registros)
          </h3>
          {previewInfo && (
            <p className="text-sm text-gray-600 mt-1">
              {previewInfo.columns} colunas • Tamanho estimado do CSV: {previewInfo.size}
            </p>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Botão de exportação com dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isExporting}
              className={`${isExporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
                } text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-all flex items-center gap-2`}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {exportProgress}%
                </>
              ) : (
                <>
                  📊 Exportar CSV
                  <span className={`transform transition-transform ${showExportOptions ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </>
              )}
            </button>

            {showExportOptions && !isExporting && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-3">
                  <h4 className="font-medium text-gray-800 mb-2">Opções de Exportação</h4>

                  <button
                    onClick={() => handleExport('basic')}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm border-b"
                  >
                    <div className="font-medium">📄 Básico</div>
                    <div className="text-gray-600 text-xs">CSV padrão, vírgula como separador</div>
                  </button>

                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm border-b"
                  >
                    <div className="font-medium">📊 Excel</div>
                    <div className="text-gray-600 text-xs">Otimizado para Excel brasileiro</div>
                  </button>

                  <button
                    onClick={() => handleExport('advanced')}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                  >
                    <div className="font-medium">⚡ Avançado</div>
                    <div className="text-gray-600 text-xs">Nomes amigáveis, formatação inteligente</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setQueryResults(null)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-1.5 px-4 rounded-lg transition-all"
          >
            Fechar ✕
          </button>
        </div>
      </div>

      {/* Barra de progresso durante exportação */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Exportando dados...</span>
            <span>{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <ScrollableTable
        columns={columns}
        headers={headers}
        queryResults={queryResults.preview}
        totalFromDb={100} // Total real da base de dados
        onLoadMore={carregarMaisLinhas} // Função que busca mais registros
        handleRowClick={handleRowClick}
      />


      {/* Click outside to close dropdown */}
      {showExportOptions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowExportOptions(false)}
        ></div>
      )}

      {/* Estilos customizados para scrollbar */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 2px;
        }
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}