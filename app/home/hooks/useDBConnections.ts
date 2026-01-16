// hooks/usePaginatedFetcher.ts
import { useState, useCallback } from "react";
import { useSession } from "@/context/SessionContext";
import { PaginatedResponse } from "@/app/task/components/Paginacao";

// Tipos genéricos
export interface FetchOption {
    value: string;
    label: string;
}

export function usePaginatedFetcher<T>(mapToOptions?: (item: T) => FetchOption) {
    const { api, user } = useSession();
    const [loading, setLoading] = useState(false);

    const fetchPaginated = useCallback(
        async (
            page: number,
            search: string = "",
            filtro: Record<string, unknown> = {},
            endpoint = "/geral/geral/paginate",
            tipo = "DBConnection"
        ) => {
            // evita novas requisições enquanto carrega
            if (loading) {
                return { options: [], hasMore: false, total: 0 };
            }
            setLoading(true);

            try {
                // monta os filtros
                const appliedFilter = Object.keys(filtro).length
                    ? filtro
                    : user
                        ? { user_id: user.id }
                        : {};

                const params = new URLSearchParams({
                    tipo,
                    page: String(page),
                    limit: "10",
                    filtro: JSON.stringify(appliedFilter),
                });

                if (search?.trim()) {
                    params.append("search", search.trim());
                }

                const response = await api.get<PaginatedResponse<T>>(endpoint, {
                    params
                });

                const data = response.data;

                return {
                    options: mapToOptions ? data.items.map(mapToOptions) : [],
                    hasMore: data.items.length >= data.limit,
                    total: data.total,
                    data,
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
                    console.log("⚠️ Requisição cancelada (AbortController)");
                } else {
                    console.error("Erro ao buscar dados:", err);
                }

                return { options: [], hasMore: false, total: 0 };
            } finally {
                setLoading(false);
            }
        },
        [user, mapToOptions, loading]
    );

    return {
        fetchPaginated,
        loading,
    };
}
