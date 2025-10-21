"use client";
import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import HeaderControls from "./ResultadosQueryComponent/HeaderControls";
import { VirtualizedHeader } from "./ResultadosQueryComponent/VirtualizedHeader";
import { VirtualizedRow } from "./ResultadosQueryComponent/VirtualizedRow";

interface ScrollableTableProps {
    columns: string[];
    headers: { name: string; type: string; redirectUrl?: string }[];
    queryResults: Record<string, unknown>[];
    totalFromDb: number;
    onLoadMore: () => void;
    handleRowClick: (row: Record<string, unknown>, index: number) => void;
    selectedItems?: Set<number>;
    isSelectionMode?: boolean;
    selectAll?: () => void;
}

export default function ScrollableTable({
    columns,
    headers,
    queryResults,
    totalFromDb,
    onLoadMore,
    handleRowClick,
    selectedItems,
    isSelectionMode = false,
    selectAll
}: ScrollableTableProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false);
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    const [scrollTop, setScrollTop] = useState(0);
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">("asc");
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [showColumnManager, setShowColumnManager] = useState(false);

    const ROW_HEIGHT = 60;
    const OVERSCAN = 10;

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(prev => prev !== mobile ? mobile : prev);
        };
        
        checkMobile();
        const resizeHandler = () => requestAnimationFrame(checkMobile);
        window.addEventListener('resize', resizeHandler);
        return () => window.removeEventListener('resize', resizeHandler);
    }, []);

    const visibleColumns = useMemo(() =>
        columns.filter(col => !hiddenColumns.has(col)),
        [columns, hiddenColumns]
    );

    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const processedResults = useMemo(() => {
        if (!debouncedSearch.trim() && !sortColumn) {
            return queryResults;
        }

        let rows = queryResults;

        if (debouncedSearch.trim()) {
            const term = debouncedSearch.toLowerCase();
            rows = rows.filter(row => {
                for (let i = 0; i < visibleColumns.length; i++) {
                    const column = visibleColumns[i];
                    const value = row[column];
                    if (value != null && String(value).toLowerCase().includes(term)) {
                        return true;
                    }
                }
                return false;
            });
        }

        if (sortColumn && sortDirection !== "none") {
            rows = rows.slice().sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
                }

                const strA = String(aVal);
                const strB = String(bVal);
                
                if (sortDirection === "asc") {
                    return strA.localeCompare(strB, 'pt-BR', { numeric: true });
                } else {
                    return strB.localeCompare(strA, 'pt-BR', { numeric: true });
                }
            });
        }

        return rows;
    }, [queryResults, debouncedSearch, sortColumn, sortDirection, visibleColumns]);

    const { visibleRows, totalHeight } = useMemo(() => {
        const containerHeight = isMobile ? 400 : 500;
        const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
        
        const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
        const endIndex = Math.min(processedResults.length, startIndex + visibleCount);
        
        const visibleRows = [];
        for (let i = startIndex; i < endIndex; i++) {
            visibleRows.push({
                index: i,
                position: i * ROW_HEIGHT
            });
        }

        return {
            visibleRows,
            totalHeight: processedResults.length * ROW_HEIGHT
        };
    }, [processedResults, scrollTop, isMobile]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop);

        if (scrollTimerRef.current) {
            clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = setTimeout(() => {
            const el = scrollRef.current;
            if (!el || isLoadingRef.current || debouncedSearch.length > 0) return;

            const { scrollTop, clientHeight, scrollHeight } = el;
            const nearBottom = scrollTop + clientHeight >= scrollHeight - 100;

            if (nearBottom && queryResults.length < totalFromDb) {
                isLoadingRef.current = true;
                onLoadMore();
                setTimeout(() => {
                    isLoadingRef.current = false;
                }, 300);
            }
        }, 50);
    }, [onLoadMore, queryResults.length, totalFromDb, debouncedSearch.length]);

    const toggleSort = useCallback((col: string) => {
        if (sortColumn === col) {
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortDirection("none");
                setSortColumn(null);
            } else {
                setSortDirection("asc");
                setSortColumn(col);
            }
        } else {
            setSortColumn(col);
            setSortDirection("asc");
        }
    }, [sortColumn, sortDirection]);

    const toggleColumnVisibility = useCallback((column: string) => {
        setHiddenColumns(prev => {
            const newHidden = new Set(prev);
            if (newHidden.has(column)) {
                newHidden.delete(column);
            } else {
                newHidden.add(column);
            }
            return newHidden;
        });
    }, []);

    // Cálculo automático de largura para colunas
    const calculateColumnWidth = useCallback((columnName: string, type?: string) => {
        const nameWidth = columnName.length * 8;
        const typeWidth = type ? type.length * 6 : 0;
        const padding = 32;
        const iconSpace = 40;
        
        const calculatedWidth = Math.max(nameWidth + typeWidth + padding + iconSpace, 120);
        return Math.min(calculatedWidth, 400);
    }, []);

    const columnStyles = useMemo(() => {
        const styles: Record<string, React.CSSProperties> = {};
        headers.forEach(header => {
            const autoWidth = calculateColumnWidth(header.name, header.type);
            
            switch (header.type) {
                case "number":
                    styles[header.name] = { 
                        flex: `0 0 ${Math.max(autoWidth, 80)}px`,
                        minWidth: `${Math.max(autoWidth, 80)}px`,
                        maxWidth: `${Math.max(autoWidth, 80)}px`,
                        textAlign: "right" as const 
                    };
                    break;
                case "date":
                    styles[header.name] = { 
                        flex: `0 0 ${Math.max(autoWidth, 120)}px`,
                        minWidth: `${Math.max(autoWidth, 120)}px`,
                        maxWidth: `${Math.max(autoWidth, 120)}px`
                    };
                    break;
                case "id":
                    styles[header.name] = { 
                        flex: `0 0 ${Math.max(autoWidth, 100)}px`,
                        minWidth: `${Math.max(autoWidth, 100)}px`,
                        maxWidth: `${Math.max(autoWidth, 100)}px`
                    };
                    break;
                default:
                    styles[header.name] = { 
                        flex: `0 0 ${autoWidth}px`,
                        minWidth: `${autoWidth}px`,
                        maxWidth: `${autoWidth}px`
                    };
            }
        });
        return styles;
    }, [headers, calculateColumnWidth]);

    const rowData = useMemo(() => ({
        rows: processedResults,
        visibleColumns,
        headers,
        isSelectionMode,
        selectedItems,
        handleRowClickWrapper: handleRowClick,
        hoveredRow,
        setHoveredRow,
        getRowId: (row: Record<string, unknown>) => 
            row.id as string || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        columnStyles
    }), [
        processedResults,
        visibleColumns,
        headers,
        isSelectionMode,
        selectedItems,
        handleRowClick,
        hoveredRow,
        columnStyles
    ]);

    useEffect(() => {
        return () => {
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col space-y-4">
            <HeaderControls
                search={search}
                setSearch={setSearch}
                showColumnManager={showColumnManager}
                setShowColumnManager={setShowColumnManager}
                columns={columns}
                hiddenColumns={hiddenColumns}
                headers={headers}
                toggleColumnVisibility={toggleColumnVisibility}
            />

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="overflow-auto rounded-lg border-2 border-blue-200 bg-white shadow-lg"
                style={{ 
                    maxHeight: isMobile ? '70vh' : '600px',
                    position: 'relative'
                }}
            >
                <VirtualizedHeader
                    visibleColumns={visibleColumns}
                    headers={headers}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    toggleSort={toggleSort}
                    isSelectionMode={isSelectionMode}
                    selectAll={selectAll}
                    isMobile={isMobile}
                    columnStyles={columnStyles}
                />

                {processedResults.length === 0 ? (
                    <EmptyState search={search} />
                ) : (
                    <div
                        ref={containerRef}
                        style={{
                            height: totalHeight,
                            position: 'relative'
                        }}
                    >
                        {visibleRows.map(({ index, position }) => (
                            <VirtualizedRow
                                key={index}
                                index={index}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: ROW_HEIGHT,
                                    transform: `translateY(${position}px)`
                                }}
                                data={rowData}
                            />
                        ))}
                    </div>
                )}
            </div>

            <LoadingIndicator
                isLoading={isLoadingRef.current}
                hasSearch={debouncedSearch.length > 0}
                currentCount={queryResults.length}
                totalCount={totalFromDb}
            />
        </div>
    );
}

const EmptyState = ({ search }: { search: string }) => (
    <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">🔍</div>
        <div className="text-lg font-medium mb-2">
            {search ? 'Nenhum resultado encontrado' : 'Nenhum registro disponível'}
        </div>
        {search && <p className="text-sm">Tente ajustar os critérios de busca</p>}
    </div>
);

const LoadingIndicator = ({
    isLoading,
    hasSearch,
    currentCount,
    totalCount
}: {
    isLoading: boolean;
    hasSearch: boolean;
    currentCount: number;
    totalCount: number;
}) => {
    if (!isLoading || hasSearch || currentCount >= totalCount) return null;

    return (
        <div className="flex justify-center py-3 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center space-x-3 text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Carregando mais registros...</span>
            </div>
        </div>
    );
};