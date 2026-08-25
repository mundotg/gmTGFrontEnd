"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/context/axioCuston";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/").replace(
  /\/+$/,
  ""
);

/** Converte http(s):// → ws(s):// para o WebSocket. */
function wsUrl(path: string): string {
  const base = BACKEND.replace(/^http/, "ws");
  return `${base}${path}`;
}

export type JobResult = { filename: string; size_mb: number };

export interface BackupJob {
  id: string;
  kind: "backup" | "restore";
  connection_id: number;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  logs: string[];
  result: JobResult | null;
  error: string | null;
  updated_at?: string;
}

/**
 * Segue um job de backup/restore por WebSocket, com o estado persistido em
 * Redis no servidor. Se a ligação cair e voltar, recupera o estado atual —
 * não se perde progresso.
 */
export function useBackupJob() {
  const [job, setJob] = useState<BackupJob | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const isRunning = job?.status === "queued" || job?.status === "running";

  const closeWs = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  /** Liga a WebSocket a um job existente. */
  const follow = useCallback(
    (jobId: string) => {
      closeWs();
      setError(null);

      const ws = new WebSocket(wsUrl(`/database/ws/jobs/${jobId}`));
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.event === "update" && data.job) {
            setJob(data.job as BackupJob);
          } else if (data.event === "error") {
            setError(data.message || "Erro no job.");
          } else if (data.event === "final") {
            // O servidor fecha a seguir; nada a fazer.
          }
        } catch {
          //
        }
      };
      ws.onerror = () => setError("Falha na ligação WebSocket ao job.");
      ws.onclose = () => setConnected(false);
    },
    [closeWs]
  );

  /** Inicia um backup e passa a segui-lo. */
  const startBackup = useCallback(
    async (connectionId: number, compress = true) => {
      setError(null);
      setJob(null);
      try {
        const { data } = await api.post("/database/jobs/backup", {
          connection_id: Number(connectionId),
          compress,
        });
        follow(data.job_id);
        return data.job_id as string;
      } catch (err) {
        const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(anyErr?.response?.data?.detail || anyErr?.message || "Falha ao iniciar o backup.");
        return null;
      }
    },
    [follow]
  );

  /**
   * Faz upload do ficheiro e inicia o restore, seguindo o job.
   * `onProgress` (0–100) reporta o progresso do UPLOAD (o restore vem no job).
   */
  const startRestore = useCallback(
    async (connectionId: number, file: File) => {
      setError(null);
      setJob(null);
      try {
        // 1) Upload
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(
          `${BACKEND}/database/restore/${connectionId}/upload`,
          { method: "POST", body: fd, credentials: "include" }
        );
        if (!up.ok) {
          let detail = `Falha no upload (${up.status}).`;
          try {
            const d = await up.json();
            detail = d?.detail || detail;
          } catch {
            //
          }
          throw new Error(detail);
        }
        const { filepath } = await up.json();

        // 2) Iniciar o job de restore
        const { data } = await api.post("/database/jobs/restore", {
          connection_id: Number(connectionId),
          filepath,
        });
        follow(data.job_id);
        return data.job_id as string;
      } catch (err) {
        const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(anyErr?.response?.data?.detail || anyErr?.message || "Falha ao iniciar o restauro.");
        return null;
      }
    },
    [follow]
  );

  /** URL de download do backup concluído. */
  const downloadUrl = useCallback((filename: string) => {
    return `${BACKEND}/database/backups/${encodeURIComponent(filename)}/download`;
  }, []);

  const reset = useCallback(() => {
    closeWs();
    setJob(null);
    setError(null);
  }, [closeWs]);

  useEffect(() => () => closeWs(), [closeWs]);

  return {
    job,
    connected,
    error,
    isRunning,
    startBackup,
    startRestore,
    downloadUrl,
    reset,
  };
}
