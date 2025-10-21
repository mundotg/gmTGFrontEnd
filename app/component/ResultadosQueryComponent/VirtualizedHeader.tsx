import { MoreHorizontal, SortAsc, SortDesc, ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";

interface PropsVirtualizedHeader {
  visibleColumns: string[];
  headers: {
    name: string;
    type: string;
    redirectUrl?: string;
  }[];
  sortColumn: string | null;
  sortDirection: "none" | "asc" | "desc";
  toggleSort: (col: string) => void;
  isSelectionMode: boolean;
  selectAll: (() => void) | undefined;
  isMobile: boolean;
  columnStyles: Record<string, React.CSSProperties>;
}

const VirtualizedHeaderR = ({
  visibleColumns,
  headers,
  sortColumn,
  sortDirection,
  toggleSort,
  isSelectionMode,
  selectAll,
  columnStyles,
}: PropsVirtualizedHeader) => {
  // Função para calcular a largura baseada no conteúdo
  const calculateColumnWidth = (columnName: string, type?: string) => {
    // Largura base: 8px por caractere + padding + ícones
    const nameWidth = columnName.length * 8;
    const typeWidth = type ? type.length * 6 : 0;
    const padding = 32; // px-4 = 16px cada lado
    const iconSpace = 40; // espaço para ícones
    
    const calculatedWidth = Math.max(nameWidth + typeWidth + padding + iconSpace, 120);
    return Math.min(calculatedWidth, 400); // máximo de 400px
  };

  return (
    <div className="flex sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 z-10 border-b-2 border-blue-200 shadow-md">
      {isSelectionMode && (
        <div 
          className="w-12 px-4 py-4 text-center border-r border-blue-200 flex items-center justify-center bg-blue-50 sticky left-0 z-20 shadow-sm"
          style={{ flex: "0 0 48px", minWidth: "48px" }}
        >
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 bg-white rounded border-blue-300 cursor-pointer focus:ring-2 focus:ring-blue-400 shadow-sm"
            onChange={selectAll}
            title="Selecionar todos"
          />
        </div>
      )}

      {visibleColumns.map((key: string) => {
        const columnInfo = headers.find(h => h.name === key);
        const isSorted = sortColumn === key;
        
        // Usa columnStyles customizado ou calcula automaticamente
        const autoWidth = calculateColumnWidth(key, columnInfo?.type);
        const style = columnStyles[key] || { 
          flex: `0 0 ${autoWidth}px`,
          minWidth: `${autoWidth}px`,
          maxWidth: `${autoWidth}px`
        };

        return (
          <div
            key={key + "-header"}
            style={style}
            className="px-4 py-3 border-r border-blue-100 last:border-r-0 cursor-pointer select-none hover:bg-blue-200 transition-all group overflow-x-auto shadow-sm [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-track]:bg-blue-100 hover:[&::-webkit-scrollbar-thumb]:bg-blue-400"
            onClick={() => toggleSort(key)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && toggleSort(key)
            }
            tabIndex={0}
            role="button"
            aria-label={`Ordenar por ${key}`}
            title={`Clique para ordenar por ${key}`}
          >
            <div className="flex items-start justify-between gap-3 w-full h-full whitespace-nowrap relative">
              <div className="min-w-0 flex-1 flex flex-col gap-1 pr-20">
                <div className="font-bold text-sm flex items-center gap-2">
                  <span className="text-blue-900">{key}</span>
                </div>
                
                {columnInfo?.type && (
                  <div className="text-xs text-blue-700 font-medium bg-white bg-opacity-60 px-2 py-0.5 rounded whitespace-nowrap shadow-sm">
                    {columnInfo.type}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-2 absolute right-0 top-0 bg-gradient-to-l from-blue-50 via-blue-50 to-transparent pl-4 h-full">
                {columnInfo?.redirectUrl && (
                  <Link
                    href={columnInfo.redirectUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0 hover:scale-110 transform drop-shadow-sm"
                    title={`Ir para detalhes de ${key}`}
                    aria-label={`Ir para detalhes de ${key}`}
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                  </Link>
                )}

                <div className="flex items-center">
                  {isSorted ? (
                    sortDirection === "asc" ? (
                      <div className="bg-blue-200 rounded p-1 shadow-sm">
                        <SortAsc 
                          className="w-5 h-5 text-blue-700" 
                          strokeWidth={2.5}
                          aria-label="Ordenação ascendente"
                        />
                      </div>
                    ) : (
                      <div className="bg-blue-200 rounded p-1 shadow-sm">
                        <SortDesc 
                          className="w-5 h-5 text-blue-700" 
                          strokeWidth={2.5}
                          aria-label="Ordenação descendente"
                        />
                      </div>
                    )
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 group-hover:bg-blue-200 rounded p-1 shadow-sm">
                      <MoreHorizontal 
                        className="w-5 h-5 text-blue-600" 
                        strokeWidth={2}
                        aria-label="Ordenar coluna"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const VirtualizedHeader = React.memo(VirtualizedHeaderR);