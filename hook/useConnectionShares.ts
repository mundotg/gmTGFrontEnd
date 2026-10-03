"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";

/* =====================
   TIPOS (espelham app/schemas/connetion_schema.py)
===================== */
export type ConnectionAccessLevel = "read" | "write" | "manage";

export type ShareTab = "shares" | "empresas" | "roles";

export interface ConnectionRolePermission {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
}

export interface EffectiveConnectionRules {
  allowed_tables?: string[];
  blocked_tables?: string[];
  allowed_columns?: Record<string, string[]>;
  blocked_columns?: Record<string, string[]>;
  allowed_query_types?: string[];
  max_rows?: number | null;
}

export interface AdvancedRulesInput {
  allowed_tables?: string[];
  blocked_tables?: string[];
  allowed_columns?: Record<string, string[]>;
  blocked_columns?: Record<string, string[]>;
  allowed_query_types?: string[];
  max_rows?: number | null;
}

export interface ConnectionRole {
  id: number;
  connection_id: number;
  name: string;
  description?: string | null;
  is_default: boolean;
  created_at?: string | null;
  permissions: ConnectionRolePermission[];
  allowed_tables?: string[];
  blocked_tables?: string[];
  allowed_columns?: Record<string, string[]>;
  blocked_columns?: Record<string, string[]>;
  allowed_query_types?: string[];
  max_rows?: number | null;
}

export interface ConnectionShare {
  id: number;
  connection_id: number;
  user_id: number;
  user_nome?: string | null;
  user_email?: string | null;
  access_level: ConnectionAccessLevel;
  role_id?: number | null;
  role_name?: string | null;
  granted_by_id?: number | null;
  granted_by_nome?: string | null;
  created_at?: string | null;
  allowed_tables?: string[];
  blocked_tables?: string[];
  allowed_columns?: Record<string, string[]>;
  blocked_columns?: Record<string, string[]>;
  allowed_query_types?: string[];
  max_rows?: number | null;
}

export interface ConnectionEmpresa {
  id: number;
  connection_id: number;
  empresa_id: number;
  empresa_nome?: string | null;
  access_level: ConnectionAccessLevel;
  role_id?: number | null;
  role_name?: string | null;
  created_at?: string | null;
}

export interface ShareableEmpresa {
  id: number;
  nome: string;
  nif?: string | null;
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
  roles?: ConnectionRole[];
  empresas?: ConnectionEmpresa[];
  effective_rules?: EffectiveConnectionRules;
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
  manage: "O anterior, mais partilhar a conexão com outras pessoas e empresas.",
};

/* =====================
   HOOK
===================== */
export function useConnectionShares(
  connectionId: number | null,
  activeTab: ShareTab = "shares"
) {
  const [access, setAccess] = useState<ConnectionAccess | null>(null);
  const [roles, setRoles] = useState<ConnectionRole[]>([]);
  const [empresas, setEmpresas] = useState<ConnectionEmpresa[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<ConnectionRolePermission[]>([]);
  const [candidatos, setCandidatos] = useState<ShareableUser[]>([]);
  const [shareableEmpresas, setShareableEmpresas] = useState<ShareableEmpresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache local das abas já carregadas para esta conexão
  const loadedTabsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const currentConnIdRef = useRef<number | null>(connectionId);

  // Reinicia quando a conexão muda
  useEffect(() => {
    if (connectionId !== currentConnIdRef.current) {
      currentConnIdRef.current = connectionId;
      loadedTabsRef.current.clear();
      inFlightRef.current.clear();
      setAccess(null);
      setRoles([]);
      setEmpresas([]);
      setCandidatos([]);
      setShareableEmpresas([]);
      setAvailablePermissions([]);
      setError(null);
    }
  }, [connectionId]);

  // Carrega acesso base (informações principais e contagens das abas)
  const loadBaseAccess = useCallback(async (): Promise<ConnectionAccess | null> => {
    if (connectionId === null) return null;
    if (inFlightRef.current.has("access")) return null;

    inFlightRef.current.add("access");
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<ConnectionAccess>(`/conn/connections/${connectionId}/access`);
      setAccess(res.data);
      if (res.data.roles && res.data.roles.length > 0) {
        setRoles(res.data.roles);
      }
      if (res.data.empresas && res.data.empresas.length > 0) {
        setEmpresas(res.data.empresas);
      }
      loadedTabsRef.current.add("base_access");
      return res.data;
    } catch (err) {
      setError(extractApiError(err, "Não foi possível carregar os acessos da conexão."));
      return null;
    } finally {
      inFlightRef.current.delete("access");
      setLoading(false);
    }
  }, [connectionId]);

  // Carrega apenas os dados da aba solicitada
  const loadTabData = useCallback(
    async (tab: ShareTab, force = false, canShareOverride?: boolean) => {
      if (connectionId === null) return;
      if (!force && loadedTabsRef.current.has(tab)) return;
      if (inFlightRef.current.has(tab)) return;

      inFlightRef.current.add(tab);
      setLoadingTab(true);

      try {
        if (tab === "shares") {
          const canShare = canShareOverride ?? access?.can_share;
          if (canShare) {
            const res = await api.get<ShareableUser[]>(
              `/conn/connections/${connectionId}/shareable-users`
            );
            setCandidatos(res.data || []);
          } else {
            setCandidatos([]);
          }
          loadedTabsRef.current.add("shares");
        } else if (tab === "empresas") {
          const canShare = canShareOverride ?? access?.can_share;
          const reqs: Promise<unknown>[] = [
            api
              .get<ConnectionEmpresa[]>(`/conn/connections/${connectionId}/empresas`)
              .then((res) => setEmpresas(res.data || []))
              .catch(() => {}),
          ];
          if (canShare) {
            reqs.push(
              api
                .get<ShareableEmpresa[]>(`/conn/connections/${connectionId}/shareable-empresas`)
                .then((res) => setShareableEmpresas(res.data || []))
                .catch(() => setShareableEmpresas([]))
            );
          }
          await Promise.all(reqs);
          loadedTabsRef.current.add("empresas");
        } else if (tab === "roles") {
          const [rolesRes, permsRes] = await Promise.all([
            api
              .get<ConnectionRole[]>(`/conn/connections/${connectionId}/roles`)
              .catch(() => ({ data: [] as ConnectionRole[] })),
            api
              .get<ConnectionRolePermission[]>("/conn/permissions/available")
              .catch(() => ({ data: [] as ConnectionRolePermission[] })),
          ]);
          setRoles(rolesRes.data || []);
          setAvailablePermissions(permsRes.data || []);
          loadedTabsRef.current.add("roles");
        }
      } catch {
        // Ignora silenciosamente para não quebrar a navegação entre abas
      } finally {
        inFlightRef.current.delete(tab);
        setLoadingTab(false);
      }
    },
    [connectionId, access?.can_share]
  );

  // Executa busca sob demanda conforme a aba ativa
  useEffect(() => {
    let active = true;
    if (connectionId === null) return;

    const run = async () => {
      let currentAccess = access;
      if (!currentAccess && !loadedTabsRef.current.has("base_access")) {
        currentAccess = await loadBaseAccess();
      }
      if (active && currentAccess) {
        await loadTabData(activeTab, false, currentAccess.can_share);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [connectionId, activeTab, access, loadBaseAccess, loadTabData]);

  const reloadAll = useCallback(async () => {
    loadedTabsRef.current.clear();
    const newAccess = await loadBaseAccess();
    if (newAccess) {
      await loadTabData(activeTab, true, newAccess.can_share);
    }
  }, [loadBaseAccess, loadTabData, activeTab]);

  /* --- Gestão de Membros --- */
  const share = useCallback(
    async (
      userId: number,
      level: ConnectionAccessLevel,
      roleId?: number | null,
      rules?: AdvancedRulesInput
    ) => {
      if (connectionId === null) return;
      await api.post(`/conn/connections/${connectionId}/shares`, {
        user_id: userId,
        access_level: level,
        role_id: roleId || null,
        ...(rules || {}),
      });
      loadedTabsRef.current.delete("shares");
      loadedTabsRef.current.delete("base_access");
      const newAccess = await loadBaseAccess();
      await loadTabData("shares", true, newAccess?.can_share);
    },
    [connectionId, loadBaseAccess, loadTabData]
  );

  const updateShare = useCallback(
    async (
      userId: number,
      level: ConnectionAccessLevel,
      roleId?: number | null,
      rules?: AdvancedRulesInput
    ) => {
      if (connectionId === null) return;
      const { data } = await api.patch<ConnectionShare>(
        `/conn/connections/${connectionId}/shares/${userId}`,
        {
          access_level: level,
          role_id: roleId,
          ...(rules || {}),
        }
      );
      setAccess((prev) =>
        prev
          ? {
              ...prev,
              shares: prev.shares.map((s) => (s.user_id === userId ? data : s)),
            }
          : prev
      );
      return data;
    },
    [connectionId]
  );

  const revoke = useCallback(
    async (userId: number) => {
      if (connectionId === null) return;
      await api.delete(`/conn/connections/${connectionId}/shares/${userId}`);
      loadedTabsRef.current.delete("shares");
      loadedTabsRef.current.delete("base_access");
      const newAccess = await loadBaseAccess();
      await loadTabData("shares", true, newAccess?.can_share);
    },
    [connectionId, loadBaseAccess, loadTabData]
  );

  /* --- Gestão de Empresas --- */
  const addEmpresa = useCallback(
    async (empresaId: number, level: ConnectionAccessLevel, roleId?: number | null) => {
      if (connectionId === null) return;
      await api.post(`/conn/connections/${connectionId}/empresas/${empresaId}`, {
        empresa_id: empresaId,
        access_level: level,
        role_id: roleId || null,
      });
      loadedTabsRef.current.delete("empresas");
      await loadTabData("empresas", true);
    },
    [connectionId, loadTabData]
  );

  const updateEmpresa = useCallback(
    async (empresaId: number, level: ConnectionAccessLevel, roleId?: number | null) => {
      if (connectionId === null) return;
      const { data } = await api.patch<ConnectionEmpresa>(
        `/conn/connections/${connectionId}/empresas/${empresaId}`,
        { access_level: level, role_id: roleId }
      );
      setEmpresas((prev) => prev.map((e) => (e.empresa_id === empresaId ? data : e)));
      loadedTabsRef.current.delete("empresas");
      await loadTabData("empresas", true);
      return data;
    },
    [connectionId, loadTabData]
  );

  const removeEmpresa = useCallback(
    async (empresaId: number) => {
      if (connectionId === null) return;
      await api.delete(`/conn/connections/${connectionId}/empresas/${empresaId}`);
      loadedTabsRef.current.delete("empresas");
      await loadTabData("empresas", true);
    },
    [connectionId, loadTabData]
  );

  /* --- Gestão de Funções / Roles --- */
  const createConnectionRole = useCallback(
    async (
      name: string,
      description?: string,
      permissionIds: number[] = [],
      rules?: AdvancedRulesInput
    ) => {
      if (connectionId === null) return;
      const { data } = await api.post<ConnectionRole>(
        `/conn/connections/${connectionId}/roles`,
        {
          name,
          description: description || null,
          permission_ids: permissionIds,
          ...(rules || {}),
        }
      );
      setRoles((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      loadedTabsRef.current.delete("roles");
      return data;
    },
    [connectionId]
  );

  const updateConnectionRole = useCallback(
    async (
      roleId: number,
      name?: string,
      description?: string,
      permissionIds?: number[],
      rules?: AdvancedRulesInput
    ) => {
      if (connectionId === null) return;
      const { data } = await api.patch<ConnectionRole>(
        `/conn/connections/${connectionId}/roles/${roleId}`,
        {
          name,
          description,
          permission_ids: permissionIds,
          ...(rules || {}),
        }
      );
      setRoles((prev) => prev.map((r) => (r.id === roleId ? data : r)));
      loadedTabsRef.current.delete("roles");
      return data;
    },
    [connectionId]
  );

  const deleteConnectionRole = useCallback(
    async (roleId: number) => {
      if (connectionId === null) return;
      await api.delete(`/conn/connections/${connectionId}/roles/${roleId}`);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      loadedTabsRef.current.delete("roles");
      await loadTabData("roles", true);
    },
    [connectionId, loadTabData]
  );

  return {
    access,
    roles,
    empresas,
    availablePermissions,
    candidatos,
    shareableEmpresas,
    loading,
    loadingTab,
    error,
    reload: reloadAll,
    share,
    updateLevel: updateShare,
    updateShare,
    revoke,
    addEmpresa,
    updateEmpresa,
    removeEmpresa,
    createConnectionRole,
    updateConnectionRole,
    deleteConnectionRole,
  };
}
