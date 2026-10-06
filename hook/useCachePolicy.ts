"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";

/* =====================
   TIPOS (espelham app/routes/cache_admin_routes.py)
===================== */
export interface EstadoCacheUtilizador {
  user_id: number;
  nome: string;
  email: string;
  /** False = ignora metadados em cache e lê sempre da origem. */
  usar_dados_locais: boolean;
  /** Versão do cache. Sobe a cada limpeza. */
  geracao: number;
}

export interface UtilizadoresCachePaginados {
  items: EstadoCacheUtilizador[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  /** No sistema todo, não só na página atual. */
  total_sem_dados_locais: number;
}

/**
 * Pesquisa paginada de utilizadores no servidor.
 * Usada pela lista de políticas e pelo seletor de utilizador do explorador.
 */
export async function pesquisarUtilizadoresCache(
  search: string,
  page = 1,
  limit = 10
): Promise<UtilizadoresCachePaginados> {
  const params = new URLSearchParams();
  if (search.trim()) params.append("search", search.trim());
  params.append("page", String(page));
  params.append("limit", String(limit));
  const { data } = await api.get<UtilizadoresCachePaginados>(
    `/system/cache/users?${params.toString()}`
  );
  return data;
}

const ATRASO_PESQUISA_MS = 350;

/* =====================
   HOOK
===================== */
export function useCachePolicy(ativo: boolean, limit = 10) {
  const [utilizadores, setUtilizadores] = useState<EstadoCacheUtilizador[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** user_id em curso, para desativar só a linha que está a ser alterada. */
  const [emCurso, setEmCurso] = useState<number | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [pesquisaAtiva, setPesquisaAtiva] = useState("");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalSemDadosLocais, setTotalSemDadosLocais] = useState(0);

  // Descarta respostas antigas quando o utilizador escreve depressa.
  const pedidoAtual = useRef(0);

  const carregar = useCallback(async () => {
    if (!ativo) return;

    const id = ++pedidoAtual.current;
    setLoading(true);
    setErro(null);
    try {
      const data = await pesquisarUtilizadoresCache(pesquisaAtiva, pagina, limit);
      if (id !== pedidoAtual.current) return;
      setUtilizadores(data.items);
      setTotal(data.total);
      setTotalPaginas(data.total_pages);
      setTotalSemDadosLocais(data.total_sem_dados_locais ?? 0);
    } catch (err) {
      if (id !== pedidoAtual.current) return;
      setErro(extractApiError(err, "Não foi possível carregar o estado do cache."));
    } finally {
      if (id === pedidoAtual.current) setLoading(false);
    }
  }, [ativo, pesquisaAtiva, pagina, limit]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Debounce: só pesquisa no servidor quando o utilizador para de escrever.
  useEffect(() => {
    const t = setTimeout(() => {
      setPesquisaAtiva(pesquisa);
      setPagina(1);
    }, ATRASO_PESQUISA_MS);
    return () => clearTimeout(t);
  }, [pesquisa]);

  const mudarPagina = (p: number) => setPagina(Math.min(Math.max(1, p), totalPaginas));

  /** Substitui uma linha sem recarregar a lista toda. */
  const aplicar = (estado: EstadoCacheUtilizador) =>
    setUtilizadores((anteriores) =>
      anteriores.map((u) => (u.user_id === estado.user_id ? estado : u))
    );

  const alterarDadosLocais = useCallback(
    async (userId: number, usarDadosLocais: boolean) => {
      setEmCurso(userId);
      setErro(null);
      try {
        const { data } = await api.patch<EstadoCacheUtilizador>(
          `/system/cache/users/${userId}`,
          { usar_dados_locais: usarDadosLocais }
        );
        aplicar(data);
        // O contador global muda com o interruptor.
        setTotalSemDadosLocais((n) => Math.max(0, n + (usarDadosLocais ? -1 : 1)));
        return true;
      } catch (err) {
        setErro(extractApiError(err, "Não foi possível alterar a definição."));
        return false;
      } finally {
        setEmCurso(null);
      }
    },
    []
  );

  const limparCache = useCallback(async (userId: number) => {
    setEmCurso(userId);
    setErro(null);
    try {
      const { data } = await api.post<{ user_id: number; geracao: number }>(
        `/system/cache/users/${userId}/clear`
      );
      // A geração é o sinal visível de que a limpeza aconteceu.
      setUtilizadores((anteriores) =>
        anteriores.map((u) =>
          u.user_id === data.user_id ? { ...u, geracao: data.geracao } : u
        )
      );
      return true;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível limpar o cache."));
      return false;
    } finally {
      setEmCurso(null);
    }
  }, []);

  return {
    utilizadores,
    loading,
    erro,
    emCurso,
    carregar,
    alterarDadosLocais,
    limparCache,
    // paginação & pesquisa
    pesquisa,
    setPesquisa,
    pagina,
    mudarPagina,
    total,
    totalPaginas,
    totalSemDadosLocais,
  };
}
