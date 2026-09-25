"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";

/* =====================
   TIPOS (espelham app/routes/system_routes.py)
===================== */
export interface Recurso {
  percent: number | null;
  usado: number | null;
  total: number | null;
  detalhe: string | null;
}

export interface EstadoServico {
  alcancavel: boolean;
  detalhe?: string | null;
  versao?: string | null;
  latencia_ms?: number | null;
  dialeto?: string | null;
}

export interface EstadoSistema {
  saudavel: boolean;
  ambiente: string;
  uptime_segundos: number;
  arrancou_em: string;
  commit: string;
  python: string;
  plataforma: string;
  codigo_desatualizado: boolean;
  cpu: Recurso;
  memoria: Recurso;
  disco: Recurso;
  base_dados: EstadoServico;
  redis: EstadoServico;
}

export interface DefinicaoSistema {
  key: string;
  titulo: string;
  descricao: string;
  criticidade: "low" | "medium" | "high";
  permissao: string;
  /** False = guardada, mas ainda sem nada que a consuma. */
  ativa: boolean;
  valor: boolean;
}

export interface LinhaLog {
  texto: string;
  nivel: string | null;
}

/** Intervalo do refresco automático das métricas. */
const INTERVALO_MS = 15000;

/* =====================
   FORMATADORES
===================== */
export function formatarUptime(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "—";

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);

  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}m`;
  if (minutos > 0) return `${minutos}m`;
  return `${Math.floor(segundos)}s`;
}

export function formatarBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return "—";

  const unidades = ["B", "KB", "MB", "GB", "TB"];
  let valor = bytes;
  let i = 0;
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i += 1;
  }
  return `${valor.toFixed(valor >= 10 || i === 0 ? 0 : 1)} ${unidades[i]}`;
}

/* =====================
   HOOK
===================== */
export function useSystemStatus() {
  const [estado, setEstado] = useState<EstadoSistema | null>(null);
  const [definicoes, setDefinicoes] = useState<DefinicaoSistema[]>([]);
  const [logs, setLogs] = useState<LinhaLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState<string | null>(null);

  // Evita escrever estado depois do componente desmontar — o refresco corre em
  // intervalo e a resposta pode chegar quando já se mudou de aba.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      // Em paralelo e tolerante: se o log falhar, as métricas continuam a
      // aparecer. Numa aba de monitorização, meia informação vale mais do que
      // um ecrã de erro.
      const [estadoRes, defsRes, logsRes] = await Promise.allSettled([
        api.get<EstadoSistema>("/system/status"),
        api.get<DefinicaoSistema[]>("/system/settings"),
        api.get<LinhaLog[]>("/system/logs/tail", { params: { limite: 12 } }),
      ]);

      if (!montado.current) return;

      if (estadoRes.status === "fulfilled") {
        setEstado(estadoRes.value.data);
        setErro(null);
      } else {
        setErro(extractApiError(estadoRes.reason, "Não foi possível ler o estado do sistema."));
      }

      if (defsRes.status === "fulfilled") setDefinicoes(defsRes.value.data);
      if (logsRes.status === "fulfilled") setLogs(logsRes.value.data);
    } finally {
      if (montado.current && !silencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(() => carregar(true), INTERVALO_MS);
    return () => clearInterval(id);
  }, [carregar]);

  const alterarDefinicao = useCallback(async (key: string, valor: boolean) => {
    setAGuardar(key);
    try {
      const { data } = await api.patch<DefinicaoSistema>(`/system/settings/${key}`, {
        valor,
      });
      setDefinicoes((anteriores) =>
        anteriores.map((d) => (d.key === key ? data : d))
      );
      return true;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível alterar a definição."));
      return false;
    } finally {
      if (montado.current) setAGuardar(null);
    }
  }, []);

  const limparTodoOCache = useCallback(async () => {
    try {
      const { data } = await api.post<{
        removidos_redis: number;
        removidos_memoria: number;
        mensagem: string;
      }>("/system/cache/clear-all");
      return data;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível limpar o cache."));
      return null;
    }
  }, []);

  const exportarLogs = useCallback(async () => {
    try {
      const resposta = await api.get("/logs/file/download", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([resposta.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `mustainf-logs-${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível exportar os logs."));
      return false;
    }
  }, []);

  return {
    estado,
    definicoes,
    logs,
    loading,
    erro,
    aGuardar,
    carregar,
    alterarDefinicao,
    limparTodoOCache,
    exportarLogs,
  };
}
