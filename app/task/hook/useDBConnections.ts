import { useState, useCallback, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import { PaginatedResponse } from "@/app/task/components/Paginacao";

export interface FetchOption {
  value: string;
  label: string;
}

export interface PaginatedFetcherResult<T> {
  options: FetchOption[];
  hasMore: boolean;
  total: number;
  data?: PaginatedResponse<T>;
}

export function usePaginatedFetcher<T>(
  mapToOptions?: (item: T) => FetchOption,
  defaultLimit: number = 20
) {
  const { api, user } = useSession();
  const [loading, setLoading] = useState(false);

  const mapToOptionsRef = useRef(mapToOptions);
  mapToOptionsRef.current = mapToOptions;

  // Mapa de requisições idênticas em voo para evitar concorrência destrutiva
  const inFlightMap = useRef<Map<string, Promise<PaginatedFetcherResult<T>>>>(new Map());
  const activeCountRef = useRef(0);

  const fetchPaginated = useCallback(
    async (
      page: number,
      search: string = "",
      filtro: Record<string, unknown> = {},
      endpoint = "/conn/paginate",
    ): Promise<PaginatedFetcherResult<T>> => {
      const appliedFilter =
        Object.keys(filtro).length ? filtro : user ? { user_id: user.id } : {};

      const s = search?.trim();
      const cacheKey = `${endpoint}?p=${page}&s=${s || ""}&f=${JSON.stringify(appliedFilter)}`;

      // Se já existe uma requisição idêntica em andamento, compartilha a mesma Promise
      const existing = inFlightMap.current.get(cacheKey);
      if (existing) {
        return existing;
      }

      const fetchPromise = (async () => {
        activeCountRef.current += 1;
        setLoading(true);

        try {
          const limit = defaultLimit || 20;
          const params: Record<string, string | number> = {
            page,
            limit,
            filtro: JSON.stringify(appliedFilter),
          };

          if (s) params.search = s;

          const response = await api.get<PaginatedResponse<T>>(endpoint, {
            params,
            timeout: 10000,
          });
          const data = response.data;
          const items = Array.isArray(data?.items) ? data.items : [];
          const effectiveLimit = data?.limit || limit;
          const total = typeof data?.total === "number" ? data.total : items.length;

          return {
            options: mapToOptionsRef.current ? items.map(mapToOptionsRef.current) : [],
            hasMore: items.length >= effectiveLimit && page * effectiveLimit < total,
            total,
            data,
          };
        } catch (err: unknown) {
          if (
            err &&
            typeof err === "object" &&
            (("name" in err && (err as { name?: string }).name === "CanceledError") ||
              ("code" in err && (err as { code?: string }).code === "ERR_CANCELED"))
          ) {
            console.log("⚠️ Requisição cancelada");
          } else {
            console.error("Erro ao buscar dados paginados:", err);
          }
          return { options: [], hasMore: false, total: 0 };
        } finally {
          inFlightMap.current.delete(cacheKey);
          activeCountRef.current = Math.max(0, activeCountRef.current - 1);
          if (activeCountRef.current === 0) {
            setLoading(false);
          }
        }
      })();

      inFlightMap.current.set(cacheKey, fetchPromise);
      return fetchPromise;
    },
    [api, user?.id, defaultLimit]
  );

  return { fetchPaginated, loading };
}
