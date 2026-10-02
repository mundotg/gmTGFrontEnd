"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/context/axioCuston";

/* =====================
   TIPOS (espelham app/schemas/users_schemas.py)
===================== */
export interface RbacPermission {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  /** Pode ser concedida por um cargo da empresa (só acessos da empresa). */
  company_scope?: boolean;
}

export interface RbacRole {
  id: number;
  name: string;
  description?: string | null;
  empresa_id?: number | null;
  permissions: RbacPermission[];
  /** Função criada pelo seed: não pode ser renomeada nem removida. */
  is_system: boolean;
  /** Função de super admin: nem as permissões podem ser alteradas. */
  is_locked: boolean;
  is_active: boolean;
  users_count: number;
}

export interface RbacMember {
  id: number;
  nome: string;
  apelido?: string | null;
  email: string;
  is_active: boolean;
  role_id?: number | null;
  role_name?: string | null;
  is_superadmin: boolean;
}

export interface RbacCapabilities {
  user_id: number;
  is_superadmin: boolean;
  can_read: boolean;
  can_manage_roles: boolean;
  can_manage_members: boolean;
}

/**
 * Extrai a mensagem que o FastAPI devolve em `detail`, caindo para algo
 * legível quando o erro é de rede ou vem sem corpo.
 */
export const extractApiError = (err: unknown, fallback: string): string => {
  const anyErr = err as {
    response?: { status?: number; data?: { detail?: unknown } };
    message?: string;
  };

  const detail = anyErr?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  // Erros de validação do Pydantic chegam como lista de objetos.
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (typeof d === "string" ? d : (d as { msg?: string })?.msg))
      .filter(Boolean);
    if (msgs.length) return msgs.join(" · ");
  }

  if (anyErr?.response?.status === 403) {
    return "Não tem permissão para esta ação.";
  }

  return anyErr?.message || fallback;
};

/* =====================
   HOOK
===================== */
export function useRbac(empresaId?: number | null) {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [permissions, setPermissions] = useState<RbacPermission[]>([]);
  const [members, setMembers] = useState<RbacMember[]>([]);
  const [capabilities, setCapabilities] = useState<RbacCapabilities | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      // As capacidades vêm primeiro: definem o que sequer vale a pena pedir.
      const caps = await api.get<RbacCapabilities>("/users/rbac/me");
      setCapabilities(caps.data);

      if (!caps.data.can_read) {
        setRoles([]);
        setPermissions([]);
        setMembers([]);
        return;
      }

      const rolesUrl = empresaId ? `/empresas/${empresaId}/roles` : "/users/roles";
      const [rolesRes, permsRes, membersRes] = await Promise.all([
        api.get<RbacRole[]>(rolesUrl),
        api.get<RbacPermission[]>("/users/permissions"),
        api.get<RbacMember[]>("/users/members"),
      ]);

      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setLoadError(extractApiError(err, "Não foi possível carregar os acessos."));
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Substitui na lista a role devolvida pelo servidor (fonte da verdade). */
  const upsertRole = useCallback((role: RbacRole) => {
    setRoles((prev) => {
      const existe = prev.some((r) => r.id === role.id);
      return existe
        ? prev.map((r) => (r.id === role.id ? role : r))
        : [...prev, role].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const createRole = useCallback(
    async (name: string, description?: string, permissionIds: number[] = []) => {
      const url = empresaId ? `/empresas/${empresaId}/roles` : "/users/roles";
      const payload: Record<string, unknown> = {
        name,
        description: description || null,
        permission_ids: permissionIds,
      };
      if (empresaId) {
        payload.empresa_id = empresaId;
      }
      const { data } = await api.post<RbacRole>(url, payload);
      upsertRole(data);
      return data;
    },
    [empresaId, upsertRole]
  );

  const deleteRole = useCallback(
    async (roleId: number, reassignTo?: number) => {
      const url = empresaId ? `/empresas/${empresaId}/roles/${roleId}` : `/users/roles/${roleId}`;
      await api.delete(url, {
        params: reassignTo ? { reassign_to_id: reassignTo } : undefined,
      });
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      // Os membros transferidos mudaram de função no servidor.
      if (reassignTo) {
        const { data } = await api.get<RbacMember[]>("/users/members");
        setMembers(data);
      }
    },
    [empresaId]
  );

  /** Guarda de uma vez todas as permissões marcadas na matriz. */
  const setRolePermissions = useCallback(
    async (roleId: number, permissionIds: number[]) => {
      const url = empresaId
        ? `/empresas/${empresaId}/roles/${roleId}/permissions`
        : `/users/roles/${roleId}/permissions`;
      const { data } = await api.put<RbacRole>(url, { permission_ids: permissionIds });
      upsertRole(data);
      return data;
    },
    [empresaId, upsertRole]
  );

  /** Concede/retira uma permissão isolada (usado quando não há modo rascunho). */
  const toggleRolePermission = useCallback(
    async (roleId: number, permissionId: number, grant: boolean) => {
      const url = `/users/roles/${roleId}/permissions/${permissionId}`;
      const { data } = grant
        ? await api.post<RbacRole>(url)
        : await api.delete<RbacRole>(url);
      upsertRole(data);
      return data;
    },
    [upsertRole]
  );

  const setMemberRole = useCallback(
    async (userId: number, roleId: number | null) => {
      const { data } = await api.patch<RbacMember>(
        `/users/members/${userId}/role`,
        { role_id: roleId }
      );
      setMembers((prev) => prev.map((m) => (m.id === userId ? data : m)));
      // A contagem de membros por função mudou.
      const rolesRes = await api.get<RbacRole[]>("/users/roles");
      setRoles(rolesRes.data);
      return data;
    },
    []
  );

  const setMemberStatus = useCallback(
    async (userId: number, isActive: boolean) => {
      const { data } = await api.patch<RbacMember>(
        `/users/members/${userId}/status`,
        { is_active: isActive }
      );
      setMembers((prev) => prev.map((m) => (m.id === userId ? data : m)));
      return data;
    },
    []
  );

  return {
    roles,
    permissions,
    members,
    capabilities,
    loading,
    loadError,
    reload: load,
    createRole,
    deleteRole,
    setRolePermissions,
    toggleRolePermission,
    setMemberRole,
    setMemberStatus,
  };
}
