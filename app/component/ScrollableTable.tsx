"use client";
import { useEffect, useRef, useCallback } from "react";

interface ScrollableTableProps {
    columns: string[];
    headers: { name: string; type: string }[];
    queryResults: any[];
    totalFromDb: number;
    onLoadMore: () => void;
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

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || isLoadingRef.current) return;

        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;

        if (nearBottom && queryResults.length < totalFromDb) {
            isLoadingRef.current = true;
            onLoadMore();
            // desbloqueia após 500ms para evitar chamadas múltiplas
            setTimeout(() => {
                isLoadingRef.current = false;
            }, 500);
        }
    }, [onLoadMore, queryResults.length, totalFromDb]);

    // ADICIONAR listener de scroll
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <div
            ref={scrollRef}
            className="overflow-auto rounded-md border border-gray-200 max-h-96"
        >
            <table className="min-w-full text-sm table-fixed">
                <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                        {columns.map((key, index) => {
                            const columnInfo = headers.find((h) => h.name === key);
                            return (
                                <th
                                    key={key + index + "header"}
                                    className="text-center align-middle px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                                    style={{ width: `${100 / columns.length}%` }}
                                >
                                    <div
                                        className="truncate"
                                        title={`${key} (${columnInfo?.type || "unknown"})`}
                                    >
                                        {key}
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
                    {queryResults.map((row, rowIndex) => (
                        <tr
                            key={rowIndex + "linhas"}
                            onClick={() => handleRowClick(row, rowIndex)}
                            className="border-t hover:bg-gray-50 transition-colors cursor-pointer h-12"
                        >
                            {columns.map((key, colIndex) => {
                                const value = row[key];
                                const columnInfo = headers.find((h) => h.name === key);

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
                                                    className={`px-2 py-1 rounded text-xs font-medium inline-block ${value
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {value ? "Sim" : "Não"}
                                                </span>
                                            ) : columnInfo?.type?.toLowerCase().includes("date") && value ? (
                                                <span className="text-blue-700" title={String(value)}>
                                                    {new Date(value).toLocaleDateString("pt-BR")}
                                                </span>
                                            ) : typeof value === "number" ? (
                                                <span className="font-mono" title={String(value)}>
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
    );
}
