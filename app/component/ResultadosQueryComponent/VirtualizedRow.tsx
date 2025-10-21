import React, { Dispatch, SetStateAction } from "react";
import { formatCellValue } from "./funcs";

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
                flex border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-150
                ${isSelected
                    ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-600 shadow-sm'
                    : isHovered
                        ? 'bg-gray-50 border-l-4 border-l-gray-400'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }
            `}
            title="Clique para editar • Clique direito para mais opções"
            role="row"
            aria-selected={isSelected}
        >
            {isSelectionMode && (
                <div 
                    className="px-4 py-3 text-center border-r border-gray-200 flex items-center justify-center bg-white sticky left-0 z-10"
                    style={{ flex: "0 0 48px", minWidth: "48px" }}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500"
                        aria-label={`Selecionar linha ${index + 1}`}
                    />
                </div>
            )}
            
            {visibleColumns.map((key: string, colIndex: number) => {
                const value = row[key];
                const columnInfo = headers.find((h) => h.name === key);
                
                // Usa columnStyles customizado ou calcula automaticamente
                const autoWidth = calculateColumnWidth(key, columnInfo?.type);
                const style = columnStyles[key] || { 
                    flex: `0 0 ${autoWidth}px`,
                    minWidth: `${autoWidth}px`,
                    maxWidth: `${autoWidth}px`
                };

                return (
                    <div
                        key={`${colIndex}-${key}`}
                        className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0 flex items-center overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
                        style={style}
                    >
                        <div 
                            className={`whitespace-nowrap ${isSelected ? "font-semibold text-blue-800" : ""}`}
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