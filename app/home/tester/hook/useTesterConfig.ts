"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/context/axioCuston";
import { EnvVars, SavedRequest } from "../types";

/**
 * Configuração do tester persistida **por utilizador** na base de dados
 * (`/pentest/settings`): variáveis de ambiente + coleção de requests guardados.
 *
 * O localStorage continua a servir de fallback offline, mas a BD é a fonte da
 * verdade e viaja entre máquinas/sessões.
 */
export function useTesterConfig() {
  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/pentest/settings");
      setEnvVars(data.env_vars ?? {});
      setSavedRequests(data.saved_requests ?? []);
      setUpdatedAt(data.updated_at ?? null);
      loadedRef.current = true;
    } catch (err) {
      const anyErr = err as {
        response?: { status?: number; data?: { detail?: string } };
        message?: string;
      };
      setError(
        anyErr?.response?.status === 401
          ? "Inicie sessão para guardar a configuração."
          : anyErr?.response?.data?.detail || anyErr?.message || "Falha ao carregar a configuração."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (partial: { env_vars?: EnvVars; saved_requests?: SavedRequest[] }) => {
      setSaving(true);
      setError(null);
      try {
        const { data } = await api.put("/pentest/settings", partial);
        setUpdatedAt(data.updated_at ?? null);
        return true;
      } catch (err) {
        const anyErr = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        setError(anyErr?.response?.data?.detail || anyErr?.message || "Falha ao guardar.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const saveEnv = useCallback(
    async (next: EnvVars) => {
      setEnvVars(next);
      return persist({ env_vars: next });
    },
    [persist]
  );

  const saveRequest = useCallback(
    async (req: Omit<SavedRequest, "id" | "createdAt">) => {
      const novo: SavedRequest = {
        ...req,
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        createdAt: new Date().toISOString(),
      };
      const next = [novo, ...savedRequests];
      setSavedRequests(next);
      await persist({ saved_requests: next });
      return novo;
    },
    [savedRequests, persist]
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      const next = savedRequests.filter((r) => r.id !== id);
      setSavedRequests(next);
      await persist({ saved_requests: next });
    },
    [savedRequests, persist]
  );

  return {
    envVars,
    savedRequests,
    updatedAt,
    loading,
    saving,
    error,
    reload: load,
    setEnvVars,
    saveEnv,
    saveRequest,
    deleteRequest,
  };
}
