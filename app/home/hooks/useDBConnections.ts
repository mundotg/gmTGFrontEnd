import { useState, useCallback, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import { PaginatedResponse } from "@/app/task/components/Paginacao";

export interface FetchOption {
  value: string;
  label: string;
}

export function usePaginatedFetcher<T>(mapToOptions?: (item: T) => FetchOption) {
  const { api, user } = useSession();
  const [loading, setLoading] = useState(false);

  // trava de concorrência sem causar re-render e sem entrar no deps
  const inFlightRef = useRef(false);

  const fetchPaginated = useCallback(
    async (
      page: number,
      search: string = "",
      filtro: Record<string, unknown> = {},
      endpoint = "/conn/paginate",
    ) => {
      if (inFlightRef.current) {
        return { options: [], hasMore: false, total: 0 };
      }

      inFlightRef.current = true;
      setLoading(true);

      try {
        const appliedFilter =
          Object.keys(filtro).length ? filtro : user ? { user_id: user.id } : {};

        // deixa o axios serializar; evita URLSearchParams + double work
        const params: Record<string, string | number> = {
          page,
          limit: 10,
          filtro: JSON.stringify(appliedFilter),
        };

        const s = search?.trim();
        if (s) params.search = s;

        const response = await api.get<PaginatedResponse<T>>(endpoint, { params,timeout:10000 });
        const data = response.data;

        return {
          options: mapToOptions ? data.items.map(mapToOptions) : [],
          hasMore: data.items.length >= data.limit,
          total: data.total,
          data,
        };
        //
      } catch (err: { name?: string; code?: string; message?: string } | unknown ) {
        if (
          err &&
          typeof err === "object" &&
          (
            ("name" in err && (err as { name?: string }).name === "CanceledError") ||
            ("code" in err && (err as { code?: string }).code === "ERR_CANCELED")
          )
        ) {
          console.log("⚠️ Requisição cancelada");
        } else {
          console.error("Erro ao buscar dados:", err);
        }
        return { options: [], hasMore: false, total: 0 };
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [api, user, mapToOptions] // 👈 loading saiu daqui
  );

  return { fetchPaginated, loading };
}
