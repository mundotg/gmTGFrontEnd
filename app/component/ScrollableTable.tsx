"use client";
import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { Search, X, SortAsc, SortDesc, MoreHorizontal, Filter, Eye, EyeOff } from "lucide-react";

interface ScrollableTableProps {
    columns: string[];
    headers: { name: string; type: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryResults: any[];
    totalFromDb: number;
    onLoadMore: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleRowClick: (row: any, index: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onContextMenu?: (event: React.MouseEvent, row: any, index: number) => void;
    selectedItems?: Set<number>;
    isSelectionMode?: boolean;
}

export default function ScrollableTable({
    columns,
    headers,
    queryResults,
    totalFromDb,
    onLoadMore,
    handleRowClick,
    onContextMenu,
    selectedItems,
    isSelectionMode = false,
}: ScrollableTableProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false);
    const [isMobile, setIsMobile] = useState(false);

    // Estados para funcionalidades
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">("asc");
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [showColumnManager, setShowColumnManager] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Detectar mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            // Auto-switch to cards on mobile
            if (window.innerWidth < 640) {
                setViewMode('cards');
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Colunas visíveis
    const visibleColumns = useMemo(() => 
        columns.filter(col => !hiddenColumns.has(col)), 
        [columns, hiddenColumns]
    );

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || isLoadingRef.current || search.length > 0) return;

        const { scrollTop, clientHeight, scrollHeight } = el;
        const threshold = Math.max(10, clientHeight * 0.1);
        const nearBottom = scrollTop + clientHeight > scrollHeight - threshold;

        if (nearBottom && queryResults.length < totalFromDb) {
            isLoadingRef.current = true;
            onLoadMore();
            setTimeout(() => (isLoadingRef.current = false), 500);
        }
    }, [onLoadMore, queryResults.length, totalFromDb, search.length]);

    // Processamento de resultados melhorado
    const processedResults = useMemo(() => {
        let rows = [...queryResults];

        if (search.trim()) {
            const term = search.toLowerCase();
            rows = rows.filter(row => {
                return visibleColumns.some(column => {
                    const value = row[column];
                    if (value == null) return false;
                    const stringValue = String(value).toLowerCase();
                    return stringValue.includes(term);
                });
            });
        }

        if (sortColumn) {
            rows.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
                }

                const comparison = String(aVal).localeCompare(String(bVal), 'pt-BR', {
                    numeric: true,
                    sensitivity: 'base'
                });

                return sortDirection === "asc" ? comparison : -comparison;
            });
        }

        return rows;
    }, [queryResults, search, sortColumn, sortDirection, visibleColumns]);

    const toggleSort = (col: string) => {
        if (sortColumn === col) {
            setSortDirection(prev => prev === "asc" ? "desc" : "none");
            if (sortDirection === "none") setSortColumn(null);
        } else {
            setSortColumn(col);
            setSortDirection("asc");
        }
    };

    const toggleColumnVisibility = (column: string) => {
        const newHidden = new Set(hiddenColumns);
        if (newHidden.has(column)) {
            newHidden.delete(column);
        } else {
            // Não permitir ocultar todas as colunas
            if (newHidden.size < columns.length - 1) {
                newHidden.add(column);
            }
        }
        setHiddenColumns(newHidden);
    };

    const handleRowContextMenu = useCallback((
        event: React.MouseEvent,
        row: any,
        originalIndex: number
    ) => {
        if (onContextMenu) {
            const realIndex = queryResults.findIndex(r => 
                JSON.stringify(r) === JSON.stringify(row)
            );
            onContextMenu(event, row, realIndex >= 0 ? realIndex : originalIndex);
        }
    }, [onContextMenu, queryResults]);

    const handleRowClickWrapper = useCallback((row: any, filteredIndex: number) => {
        const originalIndex = queryResults.findIndex(originalRow =>
            JSON.stringify(originalRow) === JSON.stringify(row)
        );
        handleRowClick(row, originalIndex >= 0 ? originalIndex : filteredIndex);
    }, [handleRowClick, queryResults]);

    const formatCellValue = (value: any, columnInfo?: { name: string; type: string }) => {
        if (value === null) {
            return (
                <span className="text-gray-400 italic font-mono text-xs bg-gray-100 px-1 rounded">
                    NULL
                </span>
            );
        }
        
        if (value === undefined) {
            return <span className="text-gray-400 italic">—</span>;
        }
        
        if (typeof value === "boolean") {
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                    value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                    <span className="w-2 h-2 rounded-full mr-1 bg-current opacity-60"></span>
                    {value ? "Sim" : "Não"}
                </span>
            );
        }
        
        if (columnInfo?.type?.toLowerCase().includes("date") && value) {
            return (
                <span className="text-blue-700 font-medium" title={String(value)}>
                    {new Date(value).toLocaleString("pt-BR", {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </span>
            );
        }
        
        if (typeof value === "number") {
            return (
                <span className="font-mono text-right block" title={String(value)}>
                    {value.toLocaleString("pt-BR")}
                </span>
            );
        }
        
        const stringValue = String(value);
        return (
            <span className="block" title={stringValue}>
                {stringValue.length > 50 ? (
                    <>
                        {stringValue.substring(0, 47)}
                        <span className="text-gray-400">...</span>
                    </>
                ) : (
                    stringValue
                )}
            </span>
        );
    };

    const CardView = () => (
        <div className="space-y-4 p-4">
            {processedResults.map((row, rowIndex) => {
                const originalIndex = queryResults.findIndex(r => 
                    JSON.stringify(r) === JSON.stringify(row)
                );
                const isSelected = isSelectionMode && selectedItems?.has(originalIndex);
                
                return (
                    <div
                        key={rowIndex}
                        onClick={() => handleRowClickWrapper(row, rowIndex)}
                        onContextMenu={(e) => handleRowContextMenu(e, row, rowIndex)}
                        className={`
                            bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200
                            hover:shadow-md hover:border-gray-300
                            ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'}
                        `}
                    >
                        {isSelectionMode && (
                            <div className="mb-3">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {visibleColumns.map(column => {
                                const columnInfo = headers.find(h => h.name === column);
                                const value = row[column];
                                
                                return (
                                    <div key={column} className="space-y-1">
                                        <div className="text-sm font-medium text-gray-600 truncate">
                                            {column}
                                            {columnInfo?.type && (
                                                <span className="text-xs text-gray-400 ml-1">
                                                    ({columnInfo.type})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-900">
                                            {formatCellValue(value, columnInfo)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col space-y-4">
            {/* Header Controls */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {/* Top Row - Search and View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar em todas as colunas..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Limpar busca"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {/* View Mode Toggle */}
                        <div className="hidden sm:flex bg-white border border-gray-300 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                    viewMode === 'table' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Tabela
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                    viewMode === 'cards' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Cards
                            </button>
                        </div>

                        {/* Column Manager */}
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnManager(!showColumnManager)}
                                className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                title="Gerenciar colunas"
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Colunas</span>
                            </button>

                            {showColumnManager && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                                    <div className="p-3 border-b border-gray-200">
                                        <h4 className="font-medium text-gray-800">Gerenciar Colunas</h4>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Clique para mostrar/ocultar colunas
                                        </p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {columns.map(column => {
                                            const isVisible = !hiddenColumns.has(column);
                                            const columnInfo = headers.find(h => h.name === column);
                                            
                                            return (
                                                <button
                                                    key={column}
                                                    onClick={() => toggleColumnVisibility(column)}
                                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                >
                                                    {isVisible ? (
                                                        <Eye className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-medium truncate ${
                                                            isVisible ? 'text-gray-900' : 'text-gray-400'
                                                        }`}>
                                                            {column}
                                                        </div>
                                                        {columnInfo?.type && (
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {columnInfo.type}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-4">
                        <span>
                            {search ? (
                                <>
                                    <span className="font-medium text-blue-600">
                                        {processedResults.length}
                                    </span> 
                                    {' '}de{' '}
                                    <span className="font-medium">
                                        {queryResults.length}
                                    </span>
                                    {' '}(filtrados)
                                </>
                            ) : (
                                <>
                                    <span className="font-medium">
                                        {queryResults.length}
                                    </span>
                                    {' '}de{' '}
                                    <span className="font-medium">
                                        {totalFromDb.toLocaleString('pt-BR')}
                                    </span>
                                    {' '}registros
                                </>
                            )}
                        </span>
                        
                        {hiddenColumns.size > 0 && (
                            <span className="text-orange-600">
                                {hiddenColumns.size} coluna{hiddenColumns.size > 1 ? 's' : ''} oculta{hiddenColumns.size > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {sortColumn && (
                        <span className="text-blue-600 flex items-center gap-1">
                            Ordenado por: {sortColumn}
                            {sortDirection === 'asc' ? (
                                <SortAsc className="w-4 h-4" />
                            ) : (
                                <SortDesc className="w-4 h-4" />
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'cards' ? (
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-auto rounded-lg border border-gray-200 max-h-[600px]"
                >
                    {processedResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-4">🔍</div>
                            <div className="text-lg font-medium mb-2">
                                {search ? 'Nenhum resultado encontrado' : 'Nenhum registro disponível'}
                            </div>
                            {search && (
                                <p className="text-sm">
                                    Tente ajustar os critérios de busca
                                </p>
                            )}
                        </div>
                    ) : (
                        <CardView />
                    )}
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-auto rounded-lg border border-gray-200"
                    style={{ maxHeight: isMobile ? '70vh' : '600px' }}
                >
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                {isSelectionMode && (
                                    <th className="w-12 px-4 py-3 text-center border-r border-gray-200">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            onChange={() => {}}
                                        />
                                    </th>
                                )}
                                {visibleColumns.map((key, index) => {
                                    const columnInfo = headers.find(h => h.name === key);
                                    const isSorted = sortColumn === key;

                                    return (
                                        <th
                                            key={key + index + "header"}
                                            role="button"
                                            aria-sort={isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                                            onClick={() => toggleSort(key)}
                                            className="cursor-pointer text-left px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 select-none hover:bg-gray-200 transition-colors group"
                                            style={{ minWidth: isMobile ? '120px' : '150px' }}
                                            title={`Clique para ordenar por ${key}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold truncate">{key}</div>
                                                    {columnInfo?.type && (
                                                        <div className="text-xs text-gray-500 font-normal truncate mt-0.5">
                                                            {columnInfo.type}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 flex items-center">
                                                    {isSorted ? (
                                                        sortDirection === "asc" ? (
                                                            <SortAsc className="w-4 h-4 text-blue-600" />
                                                        ) : (
                                                            <SortDesc className="w-4 h-4 text-blue-600" />
                                                        )
                                                    ) : (
                                                        <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {processedResults.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={visibleColumns.length + (isSelectionMode ? 1 : 0)}
                                        className="text-center py-12 text-gray-500"
                                    >
                                        <div className="text-4xl mb-4">🔍</div>
                                        <div className="text-lg font-medium mb-2">
                                            {search ? 'Nenhum resultado encontrado' : 'Nenhum registro disponível'}
                                        </div>
                                        {search && (
                                            <p className="text-sm">
                                                Tente ajustar os critérios de busca
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                processedResults.map((row, rowIndex) => {
                                    const originalIndex = queryResults.findIndex(r => 
                                        JSON.stringify(r) === JSON.stringify(row)
                                    );
                                    const isSelected = isSelectionMode && selectedItems?.has(originalIndex);
                                    const isHovered = hoveredRow === rowIndex;

                                    return (
                                        <tr
                                            key={rowIndex + "linhas"}
                                            onClick={() => handleRowClickWrapper(row, rowIndex)}
                                            onContextMenu={(e) => handleRowContextMenu(e, row, rowIndex)}
                                            onMouseEnter={() => setHoveredRow(rowIndex)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                            className={`
                                                border-t cursor-pointer transition-all duration-150 group
                                                ${isSelected 
                                                    ? 'bg-blue-50 border-blue-200' 
                                                    : isHovered 
                                                        ? 'bg-gray-50' 
                                                        : 'hover:bg-gray-50'
                                                }
                                            `}
                                            title="Clique para editar • Clique direito para mais opções"
                                        >
                                            {isSelectionMode && (
                                                <td className="w-12 px-4 py-3 text-center border-r border-gray-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                    />
                                                </td>
                                            )}
                                            {visibleColumns.map((key, colIndex) => {
                                                const value = row[key];
                                                const columnInfo = headers.find(h => h.name === key);

                                                return (
                                                    <td
                                                        key={`${colIndex}-${key}`}
                                                        className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0 align-middle"
                                                        style={{ minWidth: isMobile ? '120px' : '150px' }}
                                                    >
                                                        <div className="max-w-full">
                                                            {formatCellValue(value, columnInfo)}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Loading Indicator */}
            {isLoadingRef.current && !search && queryResults.length < totalFromDb && (
                <div className="flex justify-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium">Carregando mais registros...</span>
                    </div>
                </div>
            )}

            {/* Click outside to close dropdowns */}
            {showColumnManager && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowColumnManager(false)}
                />
            )}
        </div>
    );
}