"use client";

import { useMemo, useState, useEffect, memo } from "react";
import { FileRow } from "./file_row";
import { FileItem } from ".";
import Pagination from "@/app/component/pagination-component";
import { Search, CloudOff, Loader2, X } from "lucide-react"; // Certifique-se de ter o lucide-react instalado

type Props = {
    files: FileItem[];
    search: string;
    setSearch: (v: string) => void;
    isLoading: boolean;
    downloadingFile: { name: string; progress: number } | null;
    uploadProgress: number | null;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onDownload: (filename: string) => void;
    onDelete: (filename: string) => void;
};

export const FileList = memo(function FileList({
    files = [],
    page,
    totalPages,
    onPageChange,
    search,
    setSearch,
    isLoading,
    downloadingFile,
    uploadProgress,
    onDownload,
    onDelete,
}: Props) {

    console.log(files);
    // ⏱️ Estado local para o input (feedback visual imediato sem travar o React)
    const [localSearch, setLocalSearch] = useState(search);

    // ⏱️ DEBOUNCE: Só atualiza o estado global (e faz o filtro) 300ms após o utilizador parar de digitar
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== search) {
                setSearch(localSearch);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch, search]);

    // Sincroniza caso a prop 'search' seja limpa pelo componente pai
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    // 🔍 Filtro otimizado
    const filteredFiles = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return files;

        return files.filter((f) =>
            f.filename.toLowerCase().includes(query) ||
            f.mime_type?.toLowerCase().includes(query) ||
            f.size_bytes?.toString().includes(query)
        );
    }, [files, search]);

    const showPagination = !search && totalPages > 1;
    const isEmpty = files.length === 0;
    const noResults = !isEmpty && filteredFiles.length === 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        Ficheiros Armazenados
                        <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                            {search ? filteredFiles.length : files.length}
                        </span>
                    </h2>
                </div>

                {!isEmpty && (
                    <div className="relative group w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar ficheiros..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {/* Botão para limpar a pesquisa rapidamente */}
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                aria-label="Limpar pesquisa"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col relative" aria-live="polite">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white/80 z-10">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                        <p className="text-sm font-medium">A carregar ficheiros...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <CloudOff className="text-gray-300" size={32} />
                        </div>
                        <p className="font-medium text-gray-600">A tua cloud está vazia</p>
                        <p className="text-sm text-gray-400 mt-1">Arrasta ou seleciona um ficheiro para começar</p>
                    </div>
                ) : noResults ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <Search className="text-gray-200 mb-4" size={40} />
                        <p className="text-sm text-gray-500">
                            Nenhum ficheiro corresponde a <strong className="text-gray-700">"{search}"</strong>
                        </p>
                        <button
                            onClick={() => setLocalSearch("")}
                            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
                        >
                            Limpar filtro
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-between">
                        <ul className="divide-y divide-gray-50">
                            {filteredFiles.map((file) => (
                                <FileRow
                                    key={file.id || file.filename}
                                    file={file}
                                    isDownloading={downloadingFile?.name === file.filename}
                                    downloadProgress={downloadingFile?.name === file.filename ? downloadingFile.progress : 0}
                                    onDownload={() => onDownload(file.filename)}
                                    onDelete={() => onDelete(file.filename)}
                                    disabled={downloadingFile !== null || uploadProgress !== null}
                                />
                            ))}
                        </ul>

                        {/* PAGINAÇÃO */}
                        {showPagination && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={onPageChange}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});