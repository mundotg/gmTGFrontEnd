import { useMemo, useState } from "react";
import { Archive, ArrowDownToLine, CheckSquare, Square } from "lucide-react";
import { DragItem } from "./folders";
import { FileRow } from "./file_row";
import { FileItem, Pagination } from ".";

export function FileList({
    files,
    pagination,
    onPageChange,
    search,
    onSearchChange,
    onDownload,
    onDelete,
    onPermissions,
    selectedIds = [],
    onToggleSelect,
    onSelectAll,
    onClearSelection,
    onBulkParallelDownload,
    onBulkZipDownload,
    downloadingProgressById = {},
    loading,
    onDragStart,
    onDragEnd,
    dragItem,
}: {
    files: FileItem[];
    pagination: Pagination;
    onPageChange: (page: number) => void;
    search: string;
    onSearchChange: (s: string) => void;
    onDownload: (file: FileItem) => void;
    onDelete: (filename: string) => void;
    onPermissions?: (file: FileItem) => void;
    selectedIds?: string[];
    onToggleSelect?: (id: string) => void;
    onSelectAll?: (ids: string[]) => void;
    onClearSelection?: () => void;
    onBulkParallelDownload?: (selectedFiles: FileItem[]) => void;
    onBulkZipDownload?: (selectedFiles: FileItem[]) => void;
    downloadingProgressById?: Record<string, number>;
    loading: boolean;
    onDragStart?: (item: DragItem) => void;
    onDragEnd?: () => void;
    dragItem?: DragItem | null;
}) {
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const filtered = useMemo(() => {
        return files
            .filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) =>
                sortOrder === "asc"
                    ? a.filename.localeCompare(b.filename)
                    : b.filename.localeCompare(a.filename)
            );
    }, [files, search, sortOrder]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const allFilteredSelected =
        filtered.length > 0 && filtered.every((f) => selectedSet.has(f.id));
    const selectedFiles = useMemo(
        () => files.filter((f) => selectedSet.has(f.id)),
        [files, selectedSet]
    );

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* HEADER */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 flex-1">
                    {onSelectAll && filtered.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (allFilteredSelected) {
                                    onClearSelection?.();
                                } else {
                                    onSelectAll(filtered.map((f) => f.id));
                                }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                            title={
                                allFilteredSelected
                                    ? "Desmarcar todos"
                                    : "Selecionar todos desta página"
                            }
                        >
                            {allFilteredSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    )}

                    <h2 className="font-semibold text-gray-800 text-base">
                        Ficheiros{" "}
                        <span className="ml-1.5 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {pagination?.total ?? 0}
                        </span>
                    </h2>
                </div>

                {/* SEARCH */}
                <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Filtrar ficheiros…"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                </div>

                {/* SORT */}
                <button
                    type="button"
                    onClick={() => setSortOrder((s) => (s === "asc" ? "desc" : "asc"))}
                    className="text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1.5 border border-gray-200 rounded-lg transition self-start sm:self-auto"
                >
                    Nome {sortOrder === "asc" ? "↑" : "↓"}
                </button>
            </div>

            {/* BARRA DE AÇÃO EM LOTE (MEGA Paralelo + Compressão ZIP) */}
            {selectedFiles.length > 0 && (
                <div className="px-5 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 animate-slide-in">
                    <span className="text-xs font-semibold text-indigo-900">
                        {selectedFiles.length} ficheiro{selectedFiles.length === 1 ? "" : "s"}{" "}
                        selecionado{selectedFiles.length === 1 ? "" : "s"}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                        {onBulkParallelDownload && (
                            <button
                                type="button"
                                onClick={() => onBulkParallelDownload(selectedFiles)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                            >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                Baixar em Paralelo (MEGA)
                            </button>
                        )}

                        {onBulkZipDownload && (
                            <button
                                type="button"
                                onClick={() => onBulkZipDownload(selectedFiles)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition shadow-sm"
                            >
                                <Archive className="w-3.5 h-3.5" />
                                Comprimir & Baixar (.ZIP)
                            </button>
                        )}

                        {onClearSelection && (
                            <button
                                type="button"
                                onClick={onClearSelection}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
                            >
                                Limpar seleção
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* LOADING */}
            {loading ? (
                <div className="p-8 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                    <p className="text-4xl mb-2">🗂️</p>
                    <p className="text-sm font-medium">
                        {search ? "Nenhum ficheiro corresponde à pesquisa" : "Sem ficheiros"}
                    </p>
                </div>
            ) : (
                <>
                    {/* LIST */}
                    <ul className="divide-y divide-gray-50">
                        {filtered.map((f) => {
                            const prog = downloadingProgressById[f.id] ?? downloadingProgressById[f.filename];
                            const isDl = prog !== undefined && prog >= 0 && prog < 100;
                            return (
                                <FileRow
                                    key={f.id}
                                    file={f}
                                    isDownloading={isDl}
                                    downloadProgress={prog ?? 0}
                                    onDownload={() => onDownload(f)}
                                    onDelete={() => onDelete(f.filename)}
                                    onPermissions={
                                        onPermissions ? () => onPermissions(f) : undefined
                                    }
                                    selected={selectedSet.has(f.id)}
                                    onToggleSelect={
                                        onToggleSelect ? () => onToggleSelect(f.id) : undefined
                                    }
                                    disabled={false}
                                    onDragStart={
                                        onDragStart
                                            ? () =>
                                                  onDragStart({
                                                      kind: "file",
                                                      id: f.id,
                                                      name: f.filename,
                                                  })
                                            : undefined
                                    }
                                    onDragEnd={onDragEnd}
                                    isDragging={dragItem?.kind === "file" && dragItem.id === f.id}
                                />
                            );
                        })}
                    </ul>

                    {/* PAGINATION */}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>
                            Página {pagination?.page} de {Math.max(1, pagination?.pages || 1)}
                        </span>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={pagination?.page <= 1}
                                onClick={() => onPageChange(pagination.page - 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                ← Anterior
                            </button>

                            <button
                                type="button"
                                disabled={pagination?.page >= pagination?.pages}
                                onClick={() => onPageChange(pagination.page + 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                Próxima →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
