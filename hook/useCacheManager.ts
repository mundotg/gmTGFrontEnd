"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";

/* =====================================================================
   TIPOS
===================================================================== */
export interface CacheItemResumo {
  key: string;
  source: "redis" | "memory" | "both";
  tipo: string;
  ttl?: number | null;
  size_bytes: number;
  preview: string;
  updated_at?: string | null;
  user_id?: number | null;
  user_nome?: string | null;
  user_email?: string | null;
}

export interface CacheItemDetalhe {
  key: string;
  source: string;
  tipo: string;
  ttl?: number | null;
  size_bytes: number;
  value: any;
  raw_str: string;
  timestamp?: number | null;
  function?: string | null;
  user_id?: number | null;
  user_nome?: string | null;
  user_email?: string | null;
}

export interface CacheStats {
  redis_connected: boolean;
  redis_keys: number;
  memory_keys: number;
  total_keys: number;
  used_memory_human?: string;
  hit_rate: number;
  cache_enabled: boolean;
  prefix: string;
}

export interface CacheListResponse {
  items: CacheItemResumo[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  stats: CacheStats;
}

export interface FiltrosCache {
  search: string;
  tipo: "all" | "redis" | "memory";
  /** null = todos os utilizadores */
  userId: number | null;
  page: number;
  limit: number;
}

/* =====================================================================
   HOOK
===================================================================== */
export function useCacheManager(ativo: boolean = true) {
  const [items, setItems] = useState<CacheItemResumo[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [emOperacao, setEmOperacao] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<FiltrosCache>({
    search: "",
    tipo: "all",
    userId: null,
    page: 1,
    limit: 15,
  });

  const carregarChaves = useCallback(
    async (novosFiltros?: Partial<FiltrosCache>) => {
      if (!ativo) return;

      const f = { ...filtros, ...novosFiltros };
      setLoading(true);
      setErro(null);

      try {
        const params = new URLSearchParams();
        if (f.search.trim()) params.append("search", f.search.trim());
        if (f.tipo !== "all") params.append("tipo", f.tipo);
        if (f.userId !== null && f.userId !== undefined) {
          params.append("user_id", String(f.userId));
        }
        params.append("page", String(f.page));
        params.append("limit", String(f.limit));

        const { data } = await api.get<CacheListResponse>(
          `/system/cache/keys?${params.toString()}`
        );

        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setStats(data.stats);
      } catch (err) {
        setErro(extractApiError(err, "Não foi possível carregar as chaves de cache."));
      } finally {
        setLoading(false);
      }
    },
    [ativo, filtros]
  );

  useEffect(() => {
    carregarChaves();
  }, [filtros.page, filtros.tipo, filtros.userId]);

  const atualizarPesquisa = (search: string) => {
    setFiltros((ant) => ({ ...ant, search, page: 1 }));
    carregarChaves({ search, page: 1 });
  };

  const mudarTipo = (tipo: "all" | "redis" | "memory") => {
    setFiltros((ant) => ({ ...ant, tipo, page: 1 }));
  };

  const mudarPagina = (page: number) => {
    setFiltros((ant) => ({ ...ant, page }));
  };

  const mudarUserId = (userId: number | null) => {
    setFiltros((ant) => ({ ...ant, userId, page: 1 }));
  };

  const obterDetalhe = useCallback(async (key: string): Promise<CacheItemDetalhe | null> => {
    setErro(null);
    try {
      const encodedKey = encodeURIComponent(key);
      const { data } = await api.get<CacheItemDetalhe>(`/system/cache/keys/${encodedKey}`);
      return data;
    } catch (err) {
      setErro(extractApiError(err, `Não foi possível carregar os dados da chave '${key}'.`));
      return null;
    }
  }, []);

  const editarChave = useCallback(
    async (key: string, value: any, ttl?: number | null): Promise<boolean> => {
      setEmOperacao(key);
      setErro(null);
      try {
        const encodedKey = encodeURIComponent(key);
        await api.put(`/system/cache/keys/${encodedKey}`, {
          value,
          ttl: ttl !== undefined && ttl !== null && !isNaN(Number(ttl)) ? Number(ttl) : null,
        });

        // Atualiza a lista após editar
        await carregarChaves();
        return true;
      } catch (err) {
        setErro(extractApiError(err, `Falha ao editar a chave '${key}'.`));
        return false;
      } finally {
        setEmOperacao(null);
      }
    },
    [carregarChaves]
  );

  const eliminarChave = useCallback(
    async (key: string): Promise<boolean> => {
      setEmOperacao(key);
      setErro(null);
      try {
        const encodedKey = encodeURIComponent(key);
        await api.delete(`/system/cache/keys/${encodedKey}`);

        // Otimização visual imediata
        setItems((ant) => ant.filter((item) => item.key !== key));
        setTotal((ant) => Math.max(0, ant - 1));

        // Recarrega estatísticas em segundo plano
        carregarChaves();
        return true;
      } catch (err) {
        setErro(extractApiError(err, `Falha ao eliminar a chave '${key}'.`));
        return false;
      } finally {
        setEmOperacao(null);
      }
    },
    [carregarChaves]
  );

  const eliminarLote = useCallback(
    async (keys: string[]): Promise<boolean> => {
      if (keys.length === 0) return true;
      setLoading(true);
      setErro(null);
      try {
        await api.post("/system/cache/keys/delete-bulk", { keys });
        setItems((ant) => ant.filter((item) => !keys.includes(item.key)));
        setTotal((ant) => Math.max(0, ant - keys.length));
        await carregarChaves();
        return true;
      } catch (err) {
        setErro(extractApiError(err, "Falha ao eliminar as chaves selecionadas."));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [carregarChaves]
  );

  const limparTodoCache = useCallback(async (): Promise<{
    removidos_redis: number;
    removidos_memoria: number;
    mensagem: string;
  } | null> => {
    setLoading(true);
    setErro(null);
    try {
      const { data } = await api.post<{
        removidos_redis: number;
        removidos_memoria: number;
        mensagem: string;
      }>("/system/cache/clear-all");
      setItems([]);
      setTotal(0);
      await carregarChaves();
      return data;
    } catch (err) {
      setErro(extractApiError(err, "Falha ao limpar todo o cache."));
      return null;
    } finally {
      setLoading(false);
    }
  }, [carregarChaves]);

  return {
    items,
    stats,
    total,
    totalPages,
    loading,
    erro,
    emOperacao,
    filtros,
    carregarChaves,
    atualizarPesquisa,
    mudarTipo,
    mudarPagina,
    mudarUserId,
    obterDetalhe,
    editarChave,
    eliminarChave,
    eliminarLote,
    limparTodoCache,
  };
}
