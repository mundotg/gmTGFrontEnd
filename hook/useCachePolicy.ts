"use client";

import { useCallback, useEffect, useState } from "react";
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

/* =====================
   HOOK
===================== */
export function useCachePolicy(ativo: boolean) {
  const [utilizadores, setUtilizadores] = useState<EstadoCacheUtilizador[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** user_id em curso, para desativar só a linha que está a ser alterada. */
  const [emCurso, setEmCurso] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!ativo) return;

    setLoading(true);
    setErro(null);
    try {
      const { data } = await api.get<EstadoCacheUtilizador[]>("/system/cache/users");
      setUtilizadores(data);
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível carregar o estado do cache."));
    } finally {
      setLoading(false);
    }
  }, [ativo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
  };
}
