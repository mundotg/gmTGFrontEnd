"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";

/* =====================
   TIPOS (espelham app/schemas/connetion_schema.py)
===================== */
export type ConnectionAccessLevel = "read" | "write" | "manage";

export interface ConnectionShare {
  id: number;
  connection_id: number;
  user_id: number;
  user_nome?: string | null;
  user_email?: string | null;
  access_level: ConnectionAccessLevel;
  granted_by_id?: number | null;
  granted_by_nome?: string | null;
  created_at?: string | null;
}

export interface ConnectionAccess {
  connection_id: number;
  connection_name?: string | null;
  owner_id?: number | null;
  owner_nome?: string | null;
  is_owner: boolean;
  access_level?: ConnectionAccessLevel | null;
  can_read: boolean;
  can_write: boolean;
  can_share: boolean;
  can_delete: boolean;
  shares: ConnectionShare[];
}

export interface ShareableUser {
  id: number;
  nome: string;
  apelido?: string | null;
  email: string;
}

export const ACCESS_LEVEL_LABELS: Record<ConnectionAccessLevel, string> = {
  read: "Leitura",
  write: "Escrita",
  manage: "Gestão",
};

export const ACCESS_LEVEL_HELP: Record<ConnectionAccessLevel, string> = {
  read: "Ver a conexão e consultar dados.",
  write: "O anterior, mais alterar dados (inserir, atualizar, apagar).",
  manage: "O anterior, mais partilhar a conexão com outras pessoas.",
};

/* =====================
   HOOK
===================== */
export function useConnectionShares(connectionId: number | null) {
  const [access, setAccess] = useState<ConnectionAccess | null>(null);
  const [candidatos, setCandidatos] = useState<ShareableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (connectionId === null) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<ConnectionAccess>(
        `/conn/connections/${connectionId}/access`
      );
      setAccess(data);

      if (data.can_share) {
        const users = await api.get<ShareableUser[]>(
          `/conn/connections/${connectionId}/shareable-users`
        );
        setCandidatos(users.data);
      } else {
        setCandidatos([]);
      }
    } catch (err) {
      setError(extractApiError(err, "Não foi possível carregar os acessos."));
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    if (connectionId !== null) load();
  }, [connectionId, load]);

  const share = useCallback(
    async (userId: number, level: ConnectionAccessLevel) => {
      if (connectionId === null) return;
      await api.post(`/conn/connections/${connectionId}/shares`, {
        user_id: userId,
        access_level: level,
      });
      // Recarrega: a lista de candidatos e a de acessos mudaram as duas.
      await load();
    },
    [connectionId, load]
  );

  const updateLevel = useCallback(
    async (userId: number, level: ConnectionAccessLevel) => {
      if (connectionId === null) return;
      const { data } = await api.patch<ConnectionShare>(
        `/conn/connections/${connectionId}/shares/${userId}`,
        { access_level: level }
      );
      setAccess((prev) =>
        prev
          ? {
              ...prev,
              shares: prev.shares.map((s) => (s.user_id === userId ? data : s)),
            }
          : prev
      );
    },
    [connectionId]
  );

  const revoke = useCallback(
    async (userId: number) => {
      if (connectionId === null) return;
      await api.delete(`/conn/connections/${connectionId}/shares/${userId}`);
      await load();
    },
    [connectionId, load]
  );

  return {
    access,
    candidatos,
    loading,
    error,
    reload: load,
    share,
    updateLevel,
    revoke,
  };
}
