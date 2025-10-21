import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useSessionTask } from "../contexts/UserContext";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  search?: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PaginacaoGenericaProps<T = any> {
  Lista: PaginatedResponse<T>;
  setLista?: React.Dispatch<React.SetStateAction<PaginatedResponse<T>>>;
  fetchFunc?: (limit: number, page: number, tipo: "user" | "project" | "task" | "sprint", search?: string) => Promise<void>;
  apiUrl: string;
  tipo: "user" | "project" | "task" | "sprint";
  token?: string;
  onSelect?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  renderItem?: (item: T, onDelete?: (item: T) => void, onEdit?: (item: T) => void, onSelect?: (item: T) => void) => React.ReactNode;
  searchPlaceholder?: string;
}

export const PaginacaoGenerica = <T,>({
  Lista,
  setLista,
  fetchFunc,
  apiUrl,
  tipo,
  token,
  onSelect,
  onEdit,
  onDelete,
  renderItem,
  searchPlaceholder = "Pesquisar...",
}: PaginacaoGenericaProps<T>) => {
  const data = useMemo(() => Lista, [Lista]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Lista.page || 1);
  const [limit] = useState(10);
  const [search, setSearch] = useState(Lista.search || "");
  const [searchInput, setSearchInput] = useState(Lista.search || "");
  const {api} = useSessionTask()
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tipo,
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append("search", search);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      let result;
      if (typeof fetchFunc === "function") {
        await fetchFunc(limit, page, tipo, search);
        return;
      } else if (typeof api.get === "function") {
        const response = await api.get(`${apiUrl}?${params}`);
        result = response.data;
      } else {
        const response = await api(`${apiUrl}?${params}`);
        if (response?.status == 500) throw new Error("Erro ao buscar dados");
        result = await response.data;
      }
      setLista?.(result || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [api, apiUrl, page, limit, tipo, search, token, setLista]);

  useEffect(() => {
    const delay = setTimeout(fetchData, 400);
    return () => clearTimeout(delay);
  }, [fetchData]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.pages) setPage(newPage);
  };
  const defaultRenderItem = (item: T) => (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex-1 overflow-x-auto">
          <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-all">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
        <div className="flex gap-2 justify-end sm:ml-4 flex-shrink-0">
          {onSelect && (
            <button
              onClick={() => onSelect(item)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Visualizar"
              aria-label="Visualizar"
            >
              <Eye size={18} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Editar"
              aria-label="Editar"
            >
              <Edit size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir"
              aria-label="Excluir"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const visiblePages = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
  const halfVisible = Math.floor(visiblePages / 2);
  const startPage = Math.max(1, Math.min(page - halfVisible, data.pages - visiblePages + 1));
  const endPage = Math.min(data.pages, startPage + visiblePages - 1);

 const tipoLabel = useMemo(
  () => ({
    user: "Usuários",
    project: "Projetos",
    task: "Tarefas",
    sprint: "Sprints",
  }[tipo]),
  [tipo]
);

  return (
    <div className="w-full overflow-clip max-w-6xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col h-full max-h-[calc(100vh-200px)] m-2">
      {/* Header Fixo */}
      <header className="mb-4 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          {tipoLabel}
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base"
            >
              Buscar
            </button>
            {search && (
              <button
                onClick={handleClearSearch}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Área de Conteúdo com Scroll */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-4">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg">
            <p className="font-medium text-sm sm:text-base">Erro ao carregar dados:</p>
            <p className="text-xs sm:text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {data.items.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-500 text-sm sm:text-base">
                  Nenhum resultado encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 pr-2">
                {data.items.map((item: T, i: number) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <div key={(item as any).id || i}>
                    {renderItem ? renderItem(item, onDelete, onEdit, onSelect) : defaultRenderItem(item)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Paginação Fixa no Rodapé */}
     
        <footer className="flex-shrink-0 border-t border-gray-200 pt-4 p-2 my-3">
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 select-none">
            <p className="text-xs sm:text-sm text-gray-600 text-center px-2">
              Página <b>{page}</b> de <b>{data.pages}</b> ({data.total} {data.total === 1 ? "registro" : "registros"})
            </p>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                title="Primeira página"
                aria-label="Primeira página"
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                title="Anterior"
                aria-label="Página anterior"
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              {Array.from(
                { length: endPage - startPage + 1 },
                (_, i) => startPage + i
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    p === page
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pages}
                title="Próxima"
                aria-label="Próxima página"
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <button
                onClick={() => handlePageChange(data.pages)}
                disabled={page === data.pages}
                title="Última página"
                aria-label="Última página"
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        </footer>
     
    </div>
  );
};