"use client";
import { MoreHorizontal, SortAsc, SortDesc, ExternalLink, Check } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useI18n } from "@/context/I18nContext";

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
  const { t } = useI18n();

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
    <div className="flex sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
      
      {/* Coluna de Checkbox (Modo Seleção) */}
      {isSelectionMode && (
        <div 
          className="w-12 px-4 py-4 text-center border-r border-gray-200 flex items-center justify-center bg-gray-50 sticky left-0 z-20"
          style={{ flex: "0 0 48px", minWidth: "48px" }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center transition-all border cursor-pointer bg-white border-gray-300 hover:border-blue-400 group"
            onClick={selectAll}
            title={t("actions.selectAll") || "Selecionar todos"}
            role="checkbox"
            aria-checked="false"
            tabIndex={0}
          >
             {/* Note: Como o estado real 'allSelected' não vem nas props, o ícone é gerenciado apenas pelo hover/onClick ou seria necessário adicionar a prop isAllSelected */}
             <Check className="w-3.5 h-3.5 text-transparent group-hover:text-gray-300 transition-colors" strokeWidth={3} />
          </div>
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
            className={`
              px-4 py-3 border-r border-gray-200 last:border-r-0 cursor-pointer select-none 
              transition-colors group relative overflow-x-auto
              [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100
              ${isSorted ? "bg-blue-50/50 hover:bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}
            `}
            onClick={() => toggleSort(key)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && toggleSort(key)
            }
            tabIndex={0}
            role="button"
            aria-label={`${t("table.sortBy") || "Ordenar por"} ${key}`}
            title={`${t("table.clickToSort") || "Clique para ordenar por"} ${key}`}
          >
            <div className="flex items-start justify-between gap-3 w-full h-full whitespace-nowrap">
              <div className="min-w-0 flex-1 flex flex-col gap-1 pr-14">
                <div className="font-bold text-sm text-gray-900 truncate">
                  {key}
                </div>
                
                {columnInfo?.type && (
                  <div className="w-fit">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md shadow-sm">
                      {columnInfo.type}
                    </span>
                  </div>
                )}
              </div>

              {/* Ícones da Direita (Fixo à direita com gradiente de fade p/ evitar corte no texto) */}
              <div className="flex-shrink-0 flex items-center gap-1.5 absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-l from-gray-50 via-gray-50 to-transparent pl-4 h-full group-hover:from-gray-100 group-hover:via-gray-100">
                {columnInfo?.redirectUrl && (
                  <Link
                    href={columnInfo.redirectUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors shadow-sm"
                    title={`${t("actions.goToDetails") || "Ir para detalhes de"} ${key}`}
                    aria-label={`${t("actions.goToDetails") || "Ir para detalhes de"} ${key}`}
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                  </Link>
                )}

                <div className="flex items-center">
                  {isSorted ? (
                    sortDirection === "asc" ? (
                      <div className="bg-blue-100 border border-blue-200 rounded-md p-1.5 shadow-sm text-blue-700">
                        <SortAsc 
                          className="w-4 h-4" 
                          strokeWidth={2.5}
                          aria-label={t("table.sortAsc") || "Ordenação ascendente"}
                        />
                      </div>
                    ) : (
                      <div className="bg-blue-100 border border-blue-200 rounded-md p-1.5 shadow-sm text-blue-700">
                        <SortDesc 
                          className="w-4 h-4" 
                          strokeWidth={2.5}
                          aria-label={t("table.sortDesc") || "Ordenação descendente"}
                        />
                      </div>
                    )
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-md p-1.5 shadow-sm text-gray-500">
                      <MoreHorizontal 
                        className="w-4 h-4" 
                        strokeWidth={2.5}
                        aria-label={t("table.sortColumn") || "Ordenar coluna"}
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