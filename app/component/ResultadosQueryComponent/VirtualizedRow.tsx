"use client";
import React, { Dispatch, SetStateAction } from "react";
import { formatCellValue } from "./funcs";
import { Check } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface RowDataType {
  rows: Record<string, unknown>[];
  visibleColumns: string[];
  headers: {
    name: string;
    type: string;
  }[];
  isSelectionMode: boolean;
  selectedItems: Set<number> | undefined;
  handleRowClickWrapper: (row: Record<string, string>, filteredIndex: number) => void;
  hoveredRow: number | null;
  setHoveredRow: Dispatch<SetStateAction<number | null>>;
  getRowId: (row: Record<string, unknown>) => string;
  columnStyles: Record<string, React.CSSProperties>;
}

interface VirtualizedRowProps {
  index: number;
  style: React.CSSProperties;
  data: RowDataType;
}

const VirtualizedRowR = ({
  index,
  style,
  data
}: VirtualizedRowProps) => {
  const { t } = useI18n();

  const {
    rows,
    visibleColumns,
    headers,
    isSelectionMode,
    selectedItems,
    handleRowClickWrapper,
    hoveredRow,
    setHoveredRow,
    columnStyles,
  } = data;

  const row = rows[index];

  // Função para calcular a largura baseada no conteúdo
  const calculateColumnWidth = (columnName: string, type?: string) => {
    const nameWidth = columnName.length * 8;
    const typeWidth = type ? type.length * 6 : 0;
    const padding = 32;
    const iconSpace = 40;
    
    const calculatedWidth = Math.max(nameWidth + typeWidth + padding + iconSpace, 120);
    return Math.min(calculatedWidth, 400);
  };

  const isSelected = isSelectionMode && selectedItems ? selectedItems.has(index) : false;
  const isHovered = hoveredRow === index;

  return (
    <div
      style={style}
      onClick={() => handleRowClickWrapper(row as Record<string, string>, index)}
      onMouseEnter={() => setHoveredRow(index)}
      onMouseLeave={() => setHoveredRow(null)}
      className={`
        flex border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-150 group outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/50
        ${isSelected
          ? "bg-blue-50 border-t border-b border-blue-200 z-10 relative"
          : isHovered
            ? "bg-gray-50/80"
            : "bg-white hover:bg-gray-50/80"
        }
      `}
      title={t("table.rowTooltip") || "Clique para detalhes"}
      role="row"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClickWrapper(row as Record<string, string>, index);
        }
      }}
    >
      {/* Coluna de Seleção */}
      {isSelectionMode && (
        <div 
          className={`
            px-4 py-3 text-center border-r flex items-center justify-center sticky left-0 z-10 transition-colors duration-150
            ${isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 group-hover:bg-gray-50/80"}
          `}
          style={{ flex: "0 0 48px", minWidth: "48px" }}
        >
          <div
            className={`
              w-5 h-5 rounded flex items-center justify-center transition-all border
              ${isSelected
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-300 text-transparent group-hover:border-blue-400"
              }
            `}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`${t("actions.selectRow") || "Selecionar linha"} ${index + 1}`}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </div>
      )}
      
      {/* Colunas de Dados */}
      {visibleColumns.map((key: string, colIndex: number) => {
        const value = row[key];
        const columnInfo = headers.find((h) => h.name === key);
        
        // Usa columnStyles customizado ou calcula automaticamente
        const autoWidth = calculateColumnWidth(key, columnInfo?.type);
        const colStyle = columnStyles[key] || { 
          flex: `0 0 ${autoWidth}px`,
          minWidth: `${autoWidth}px`,
          maxWidth: `${autoWidth}px`
        };

        return (
          <div
            key={`${colIndex}-${key}`}
            className="px-4 py-3 text-sm text-gray-700 border-r border-gray-100 last:border-r-0 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300"
            style={colStyle}
          >
            <div 
              className={`whitespace-nowrap ${isSelected ? "font-bold text-gray-900" : "font-medium"}`}
              title={String(value ?? "")}
            >
              {formatCellValue(value, columnInfo)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const VirtualizedRow = React.memo(VirtualizedRowR);