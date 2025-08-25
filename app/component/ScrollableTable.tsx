"use client";
import {  useRef, useCallback, useState, useMemo } from "react";

interface ScrollableTableProps {
    columns: string[];
    headers: { name: string; type: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryResults: any[];
    totalFromDb: number;
    onLoadMore: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleRowClick: (row: any, index: number) => void;
}

export default function ScrollableTable({
    columns,
    headers,
    queryResults,
    totalFromDb,
    onLoadMore,
    handleRowClick,
}: ScrollableTableProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false);

    // 🔍 estado para busca e ordenação
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || isLoadingRef.current || search.length>0) return;

        const { scrollTop, clientHeight, scrollHeight } = el;
        const threshold = Math.max(10, clientHeight * 0.1);
        const nearBottom = scrollTop + clientHeight > scrollHeight - threshold;

        if (nearBottom && queryResults.length < totalFromDb) {
            isLoadingRef.current = true;
            onLoadMore();
            setTimeout(() => (isLoadingRef.current = false), 500);
        }
    }, [onLoadMore, queryResults.length, totalFromDb, search.length]);

    // 🔍 aplica busca + ordenação
    const processedResults = useMemo(() => {
        let rows = [...queryResults];
        if (search.trim()) {
            const term = search.toLowerCase();
            rows = rows.filter(row =>{
                let yes = false
                for(let i =0; i< columns.length; i++)
                {
                    const coluna = String(row[columns[i]])
                    if(coluna === term)
                        yes = true
                }
                return yes
            }
            );
        }

        if (sortColumn) {
            rows.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                if (aVal === bVal) return 0;
                return sortDirection === "asc"
                    ? String(aVal).localeCompare(String(bVal))
                    : String(bVal).localeCompare(String(aVal));
            });
        }

        return rows;
    }, [queryResults, search, sortColumn, sortDirection, columns]);

    const toggleSort = (col: string) => {
        if (sortColumn === col) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortColumn(col);
            setSortDirection("asc");
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            {/* 🔍 campo de busca */}
            <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border p-2 rounded-md text-sm"
            />

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="overflow-auto rounded-md border border-gray-200 h-[500px]"
            >
                <table className="min-w-full text-sm table-fixed">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            {columns.map((key, index) => {
                                const columnInfo = headers.find(h => h.name === key);
                                const isSorted = sortColumn === key;

                                return (
                                    <th
                                        key={key + index + "header"}
                                        onClick={() => toggleSort(key)}
                                        className="cursor-pointer text-center align-middle px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 select-none"
                                        style={{ width: `${100 / columns.length}%` }}
                                    >
                                        <div className="truncate flex items-center justify-center space-x-1">
                                            <span>{key}</span>
                                            {isSorted && (
                                                <span>
                                                    {sortDirection === "asc" ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </div>
                                        {columnInfo?.type && (
                                            <div className="text-xs text-gray-500 font-normal truncate">
                                                {columnInfo.type}
                                            </div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {processedResults.map((row, rowIndex) => (
                            <tr
                                key={rowIndex + "linhas"}
                                onClick={() => handleRowClick(row, rowIndex)}
                                className="border-t hover:bg-gray-50 transition-colors cursor-pointer h-12"
                            >
                                {columns.map((key, colIndex) => {
                                    const value = row[key];
                                    const columnInfo = headers.find(h => h.name === key);

                                    return (
                                        <td
                                            key={`${colIndex}-${key}`}
                                            className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0 align-middle"
                                            style={{ width: `${100 / columns.length}%` }}
                                        >
                                            <div className="overflow-x-auto max-w-full whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                                {value === null ? (
                                                    <span className="text-gray-400 italic">NULL</span>
                                                ) : value === undefined ? (
                                                    <span className="text-gray-400 italic">—</span>
                                                ) : typeof value === "boolean" ? (
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                                                            value
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {value ? "Sim" : "Não"}
                                                    </span>
                                                ) : columnInfo?.type?.toLowerCase().includes("date") &&
                                                  value ? (
                                                    <span
                                                        className="text-blue-700"
                                                        title={String(value)}
                                                    >
                                                        {new Date(value).toLocaleDateString("pt-BR")}
                                                    </span>
                                                ) : typeof value === "number" ? (
                                                    <span
                                                        className="font-mono"
                                                        title={String(value)}
                                                    >
                                                        {value.toLocaleString("pt-BR")}
                                                    </span>
                                                ) : (
                                                    <span className="block" title={String(value)}>
                                                        {String(value).length > 50
                                                            ? String(value).substring(0, 47) + "..."
                                                            : String(value)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
