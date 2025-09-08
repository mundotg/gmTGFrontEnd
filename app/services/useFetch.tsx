import api from "@/context/axioCuston";
import { useState, useEffect, useCallback } from "react";

interface UseFetchOptions<T, B = any> {
  /** Dados iniciais opcionais para hidratação */
  initialData?: T;
  /** Executa automaticamente ao montar */
  autoFetch?: boolean;
  /** Método HTTP (GET, POST, PUT, DELETE, PATCH...) */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Payload da requisição (POST, PUT, PATCH) */
  body?: B;
  /** Configurações extras do axios */
  config?: Record<string, any>;
}
export function useFetch<T = unknown, B = any>(
  url: string,
  options?: UseFetchOptions<T, B>
) {
  const {
    initialData,
    autoFetch = true,
    method = "GET",
    body,
    config,
  } = options || {};

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (overrideOptions?: Partial<UseFetchOptions<T, B>>) => {
      if (!url) return;
      setLoading(true);
      setError(null);

      try {
        const finalMethod = overrideOptions?.method ?? method;
        const finalBody = overrideOptions?.body ?? body;
        const finalConfig = { ...(config || {}), ...(overrideOptions?.config || {}) };

        let res;
        switch (finalMethod) {
          case "POST":
            res = await api.post<T>(url, finalBody, finalConfig);
            break;
          case "PUT":
            res = await api.put<T>(url, finalBody, finalConfig);
            break;
          case "PATCH":
            res = await api.patch<T>(url, finalBody, finalConfig);
            break;
          case "DELETE":
            res = await api.delete<T>(url, finalConfig);
            break;
          default:
            res = await api.get<T>(url, finalConfig);
            break;
        }
        setData(res.data);
      } catch (err: any) {
        if (err.response) {
          setError(new Error(`Erro HTTP: ${err.response.status} - ${err.response.statusText}`));
        } else if (err.request) {
          setError(new Error("Sem resposta do servidor."));
        } else {
          setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        }
      } finally {
        setLoading(false);
      }
    },
    [url, method, JSON.stringify(body), JSON.stringify(config)]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { data, loading, error, refetch: fetchData };
}
