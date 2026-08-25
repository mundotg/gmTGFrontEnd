"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Check,
  Users,
  Search,
  AlertTriangle,
  Loader2,
  Trash2,
  Lock,
  Save,
  X,
  RefreshCw,
  Crown,
  UserX,
  UserCheck,
} from "lucide-react";

import {
  extractApiError,
  RbacPermission,
  RbacRole,
  useRbac,
} from "@/hook/useRbac";

/* =====================
   HELPERS
===================== */
const idsDe = (permissoes: RbacPermission[]) => permissoes.map((p) => p.id);

const mesmoConjunto = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
};

/* =====================
   COMPONENT
===================== */
export const EquipeTab = () => {
  const {
    roles,
    permissions,
    members,
    capabilities,
    loading,
    loadError,
    reload,
    createRole,
    deleteRole,
    setRolePermissions,
    setMemberRole,
    setMemberStatus,
  } = useRbac();

  const podeGerirFuncoes = !!capabilities?.can_manage_roles;
  const podeGerirMembros = !!capabilities?.can_manage_members;

  /* =====================
       STATE
  ===================== */
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Rascunho: as permissões marcadas só vão para o servidor ao Guardar.
  const [rascunho, setRascunho] = useState<number[]>([]);

  const [loadingSave, setLoadingSave] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [criandoRole, setCriandoRole] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [membroEmCurso, setMembroEmCurso] = useState<number | null>(null);

  // Diálogo de remoção: função a apagar + destino dos membros que a têm.
  const [roleParaApagar, setRoleParaApagar] = useState<RbacRole | null>(null);
  const [destinoMembros, setDestinoMembros] = useState<string>("");
  const [aApagar, setAApagar] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  /* Seleciona a primeira função assim que a lista chega, e larga a seleção
     se a função escolhida deixar de existir. */
  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId(null);
      return;
    }
    if (selectedRoleId === null || !roles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  /* Sempre que muda a função selecionada (ou o servidor devolve uma versão
     nova dela), o rascunho volta a espelhar o estado real. */
  useEffect(() => {
    setRascunho(selectedRole ? idsDe(selectedRole.permissions) : []);
  }, [selectedRole]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole) return false;
    return !mesmoConjunto(rascunho, idsDe(selectedRole.permissions));
  }, [rascunho, selectedRole]);

  /* Avisa antes de fechar a aba com alterações por guardar. */
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [hasUnsavedChanges]);

  /* =====================
       HANDLERS
  ===================== */
  const showNotification = (
    msg: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const editavel = !!selectedRole && !selectedRole.is_locked && podeGerirFuncoes;

  const togglePermission = (permission: RbacPermission) => {
    if (!editavel) return;

    setRascunho((prev) =>
      prev.includes(permission.id)
        ? prev.filter((id) => id !== permission.id)
        : [...prev, permission.id]
    );
  };

  const toggleCategory = (categoryPermissions: RbacPermission[]) => {
    if (!editavel) return;

    const ids = idsDe(categoryPermissions);
    const todosMarcados = ids.every((id) => rascunho.includes(id));

    setRascunho((prev) =>
      todosMarcados
        ? prev.filter((id) => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids]))
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    setLoadingSave(true);
    try {
      await setRolePermissions(selectedRole.id, rascunho);
      showNotification("Permissões guardadas com sucesso.");
    } catch (err) {
      showNotification(
        extractApiError(err, "Não foi possível guardar as permissões."),
        "error"
      );
    } finally {
      setLoadingSave(false);
    }
  };

  const descartar = () => {
    setRascunho(selectedRole ? idsDe(selectedRole.permissions) : []);
  };

  const handleCreateRole = async () => {
    const nome = newRoleName.trim();
    if (!nome || criandoRole) return;

    setCriandoRole(true);
    try {
      const nova = await createRole(nome);
      setNewRoleName("");
      setIsCreatingRole(false);
      setSelectedRoleId(nova.id);
      showNotification(`Função "${nova.name}" criada.`);
    } catch (err) {
      showNotification(
        extractApiError(err, "Não foi possível criar a função."),
        "error"
      );
    } finally {
      setCriandoRole(false);
    }
  };

  /** Funções para onde os membros da função a apagar podem ser transferidos. */
  const destinosPossiveis = useMemo(
    () =>
      roleParaApagar
        ? roles.filter((r) => r.id !== roleParaApagar.id && r.is_active)
        : [],
    [roles, roleParaApagar]
  );

  const abrirRemocao = (role: RbacRole) => {
    setRoleParaApagar(role);
    setDestinoMembros("");
  };

  const confirmarRemocao = async () => {
    if (!roleParaApagar || aApagar) return;

    const precisaDestino = roleParaApagar.users_count > 0;
    if (precisaDestino && !destinoMembros) return;

    setAApagar(true);
    try {
      await deleteRole(
        roleParaApagar.id,
        precisaDestino ? Number(destinoMembros) : undefined
      );
      showNotification(
        precisaDestino
          ? `Função "${roleParaApagar.name}" removida e membros transferidos.`
          : `Função "${roleParaApagar.name}" removida.`
      );
      setRoleParaApagar(null);
    } catch (err) {
      showNotification(
        extractApiError(err, "Não foi possível remover a função."),
        "error"
      );
    } finally {
      setAApagar(false);
    }
  };

  const handleMemberRole = async (userId: number, valor: string) => {
    setMembroEmCurso(userId);
    try {
      const membro = await setMemberRole(userId, valor ? Number(valor) : null);
      showNotification(
        `Função de ${membro.nome} atualizada para "${membro.role_name ?? "sem função"}".`
      );
    } catch (err) {
      showNotification(
        extractApiError(err, "Não foi possível alterar a função."),
        "error"
      );
    } finally {
      setMembroEmCurso(null);
    }
  };

  const handleMemberStatus = async (userId: number, ativar: boolean) => {
    setMembroEmCurso(userId);
    try {
      const membro = await setMemberStatus(userId, ativar);
      showNotification(
        `${membro.nome} foi ${ativar ? "reativado" : "desativado"}.`
      );
    } catch (err) {
      showNotification(
        extractApiError(err, "Não foi possível alterar o estado da conta."),
        "error"
      );
    } finally {
      setMembroEmCurso(null);
    }
  };

  /* =====================
       COMPUTED
  ===================== */
  const permissionsGrouped = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();

    const filtered = termo
      ? permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(termo) ||
            p.category?.toLowerCase().includes(termo) ||
            p.description?.toLowerCase().includes(termo)
        )
      : permissions;

    return filtered.reduce((acc: Record<string, RbacPermission[]>, p) => {
      const key = p.category || "Outros";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
  }, [permissions, searchTerm]);

  /* =====================
       ESTADOS DE PÁGINA
  ===================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm font-medium">A carregar funções e permissões…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} />
        </div>
        <p className="text-lg font-bold text-slate-900">
          Não foi possível carregar os acessos
        </p>
        <p className="text-sm text-slate-500 mt-1">{loadError}</p>
        <button
          onClick={reload}
          className="mt-5 inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  if (capabilities && !capabilities.can_read) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Lock size={26} />
        </div>
        <p className="text-lg font-bold text-slate-900">Acesso restrito</p>
        <p className="text-sm text-slate-500 mt-1">
          Precisa da permissão <code className="text-xs">settings:team</code> para
          ver o controlo de acessos.
        </p>
      </div>
    );
  }

  /* =====================
       RENDER
  ===================== */
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* HEADER & NOTIFICATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Controlo de Acesso (RBAC)
          </h2>
          <p className="text-slate-500 text-sm">
            Gere funções, permissões granulares e atribuições de equipa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm animate-in slide-in-from-top-2 max-w-md
              ${
                notification.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {notification.type === "success" ? (
                <Check className="inline w-4 h-4 mr-2" />
              ) : (
                <AlertTriangle className="inline w-4 h-4 mr-2" />
              )}
              {notification.msg}
            </div>
          )}

          <button
            onClick={reload}
            title="Recarregar"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {!podeGerirFuncoes && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <Lock size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            Está em modo de consulta: pode ver as funções e permissões, mas
            alterá-las exige a permissão <code className="text-xs">role:manage</code>.
          </p>
        </div>
      )}

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ROLES & MEMBERS */}
        <div className="lg:col-span-4 space-y-6">
          {/* ROLES CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" /> Funções
              </h3>
              {podeGerirFuncoes && (
                <button
                  onClick={() => setIsCreatingRole(!isCreatingRole)}
                  className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
                  title={isCreatingRole ? "Cancelar" : "Nova função"}
                >
                  {isCreatingRole ? <X size={18} /> : <Plus size={18} />}
                </button>
              )}
            </div>

            {/* Create Role Input */}
            {isCreatingRole && podeGerirFuncoes && (
              <div className="p-3 bg-slate-50 border-b animate-in slide-in-from-top-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5"
                    placeholder="Nome, ex: gerente"
                    autoFocus
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateRole()}
                  />
                  <button
                    onClick={handleCreateRole}
                    disabled={criandoRole || !newRoleName.trim()}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {criandoRole && <Loader2 size={12} className="animate-spin" />}
                    Criar
                  </button>
                </div>
              </div>
            )}

            {/* Role List */}
            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {roles.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Ainda não existem funções.
                </p>
              )}

              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer border
                    ${
                      selectedRoleId === role.id
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                        : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {role.is_locked ? (
                      <Crown size={14} className="text-amber-500 flex-shrink-0" />
                    ) : role.is_system ? (
                      <Lock size={14} className="opacity-50 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-200 group-hover:bg-indigo-200 transition-colors flex-shrink-0" />
                    )}
                    <span className="capitalize truncate">{role.name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"
                      title={`${role.users_count} membro(s)`}
                    >
                      {role.users_count} 👤
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        selectedRoleId === role.id
                          ? "bg-white text-indigo-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                      title={`${role.permissions.length} permissão(ões)`}
                    >
                      {role.permissions.length}
                    </span>
                    {!role.is_system && podeGerirFuncoes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirRemocao(role);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                        title="Remover função"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MEMBERS CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" /> Membros
              </h3>
              <span className="text-xs text-slate-400">{members.length}</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {members.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhum membro encontrado.
                </p>
              )}

              {members.map((u) => {
                const euProprio = capabilities?.user_id === u.id;
                const ocupado = membroEmCurso === u.id;

                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-lg border bg-white transition-all ${
                      u.is_active
                        ? "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                        : "border-slate-100 bg-slate-50/60 opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5 truncate">
                          {u.nome}
                          {u.is_superadmin && (
                            <Crown
                              size={12}
                              className="text-amber-500 flex-shrink-0"
                              aria-label="Super admin"
                            />
                          )}
                          {euProprio && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              (você)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 ${
                            u.is_active ? "bg-emerald-400" : "bg-slate-300"
                          }`}
                          title={u.is_active ? "Ativo" : "Desativado"}
                        />
                        {podeGerirMembros && !euProprio && (
                          <button
                            onClick={() => handleMemberStatus(u.id, !u.is_active)}
                            disabled={ocupado}
                            title={u.is_active ? "Desativar conta" : "Reativar conta"}
                            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40"
                          >
                            {u.is_active ? (
                              <UserX size={14} />
                            ) : (
                              <UserCheck size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <select
                      className="w-full text-xs border border-slate-200 rounded bg-slate-50 py-1.5 px-2 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      value={u.role_id ?? ""}
                      disabled={!podeGerirMembros || euProprio || ocupado}
                      title={
                        euProprio
                          ? "Não pode alterar a sua própria função"
                          : undefined
                      }
                      onChange={(e) => handleMemberRole(u.id, e.target.value)}
                    >
                      <option value="">— sem função —</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PERMISSIONS MATRIX */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[600px] flex flex-col relative">
            {/* Permission Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white rounded-t-xl">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <h3 className="font-semibold text-slate-800 capitalize">
                  {selectedRole
                    ? `Permissões: ${selectedRole.name}`
                    : "Selecione uma função"}
                </h3>
                {selectedRole?.is_locked && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                    SUPER ADMIN · BLOQUEADA
                  </span>
                )}
                {selectedRole?.is_system && !selectedRole.is_locked && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                    SISTEMA
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Procurar permissão…"
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-full bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedRole}
                />
              </div>
            </div>

            {/* Permission Content */}
            <div className="flex-1 p-6 bg-slate-50/30">
              {!selectedRole ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Shield size={64} className="mb-4 stroke-1" />
                  <p className="text-lg font-medium">Nenhuma função selecionada</p>
                  <p className="text-sm">
                    Escolha uma função à esquerda para editar as permissões
                  </p>
                </div>
              ) : (
                <div className="space-y-8 pb-24">
                  {selectedRole.is_locked && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                      <Crown size={16} className="mt-0.5 flex-shrink-0" />
                      <p>
                        Esta é a função de super admin (tem{" "}
                        <code className="text-xs">admin:*</code>). Está bloqueada de
                        propósito: alterá-la podia deixar o sistema sem ninguém
                        capaz de gerir acessos.
                      </p>
                    </div>
                  )}

                  {Object.keys(permissionsGrouped).length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      Nenhuma permissão encontrada para &quot;{searchTerm}&quot;
                    </div>
                  )}

                  {Object.entries(permissionsGrouped).map(([category, perms]) => {
                    const isCategoryFullySelected = perms.every((p) =>
                      rascunho.includes(p.id)
                    );

                    return (
                      <div
                        key={category}
                        className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                            {category}
                          </h4>
                          <button
                            onClick={() => toggleCategory(perms)}
                            disabled={!editavel}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isCategoryFullySelected
                              ? "Desmarcar todos"
                              : "Selecionar todos"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {perms.map((p) => {
                            const isSelected = rascunho.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`
                                  relative flex items-start p-3 rounded-lg border transition-all duration-200
                                  ${
                                    isSelected
                                      ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                                  }
                                  ${
                                    editavel
                                      ? "cursor-pointer"
                                      : "cursor-not-allowed opacity-75"
                                  }
                                `}
                              >
                                <div className="flex items-center h-5">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                    checked={isSelected}
                                    onChange={() => togglePermission(p)}
                                    disabled={!editavel}
                                  />
                                </div>
                                <div className="ml-3 text-sm min-w-0">
                                  <span
                                    className={`font-medium block truncate ${
                                      isSelected
                                        ? "text-indigo-900"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {p.name}
                                  </span>
                                  {p.description && (
                                    <span className="text-slate-500 text-xs mt-0.5 block">
                                      {p.description}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating Action Footer */}
            {selectedRole && editavel && (
              <div
                className={`
                  absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between transition-all duration-300 transform
                  ${
                    hasUnsavedChanges
                      ? "translate-y-0 opacity-100"
                      : "translate-y-10 opacity-0 pointer-events-none"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 rounded-full p-1.5 animate-pulse">
                    <AlertTriangle size={16} className="text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Alterações por guardar</p>
                    <p className="text-slate-400 text-xs">
                      As permissões só se aplicam depois de guardar.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={descartar}
                    disabled={loadingSave}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={savePermissions}
                    disabled={loadingSave}
                    className="bg-white text-slate-900 px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 disabled:opacity-70 flex items-center gap-2 transition-all"
                  >
                    {loadingSave ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar alterações
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIÁLOGO: REMOVER FUNÇÃO */}
      {roleParaApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  Remover a função “{roleParaApagar.name}”?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            {roleParaApagar.users_count > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-slate-700">
                  <strong>{roleParaApagar.users_count} membro(s)</strong> têm esta
                  função. Escolha para onde devem ser transferidos:
                </p>

                {destinosPossiveis.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                    <p>
                      Não existe outra função ativa para receber estes membros.
                      Crie uma antes de remover esta.
                    </p>
                  </div>
                ) : (
                  <select
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={destinoMembros}
                    onChange={(e) => setDestinoMembros(e.target.value)}
                  >
                    <option value="">Escolher função de destino…</option>
                    {destinosPossiveis.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRoleParaApagar(null)}
                disabled={aApagar}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                disabled={
                  aApagar ||
                  (roleParaApagar.users_count > 0 && !destinoMembros)
                }
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aApagar && <Loader2 size={14} className="animate-spin" />}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
