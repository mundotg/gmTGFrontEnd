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
  ChevronDown,
  ChevronRight,
  Copy,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Mail,
  UserCheck2,
  CheckSquare,
  Square,
  HelpCircle,
  Pencil,
  Phone,
  Building2,
  Briefcase,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  BadgeCheck,
  Calendar,
} from "lucide-react";

import api from "@/context/axioCuston";
import {
  extractApiError,
  RbacPermission,
  RbacRole,
  RbacMember,
  MemberUpdateFullPayload,
  MemberCreateGlobalPayload,
  useRbac,
} from "@/hook/useRbac";
import {
  fetchEmpresasPaginadas,
  EmpresaItem,
} from "@/app/services/empresaService";

/* =====================
   HELPERS
===================== */
const idsDe = (permissoes: RbacPermission[]) => permissoes.map((p) => p.id);

const mesmoConjunto = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
};

const getIniciais = (nome: string) => {
  if (!nome) return "U";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const avatarCores = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-indigo-600",
];

const getAvatarCor = (texto: string) => {
  let hash = 0;
  for (let i = 0; i < (texto || "").length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % avatarCores.length;
  return avatarCores[idx];
};

const gerarSenhaAleatoria = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Musta#${pass}!`;
};

type ViewMode = "split" | "roles" | "members";
type PermissionFilter = "all" | "granted" | "revoked";
type MemberStatusFilter = "all" | "active" | "inactive";



/* =====================
   COMPONENT PRINCIPAL
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
    updateMemberFull,
    createMemberGlobal,
    deleteMemberGlobal,
  } = useRbac();

  const podeGerirFuncoes = !!capabilities?.can_manage_roles;
  const podeGerirMembros = !!capabilities?.can_manage_members;

  /* =====================
       ESTADOS
  ===================== */
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Rascunho de permissões da role selecionada
  const [rascunho, setRascunho] = useState<number[]>([]);
  const [loadingSave, setLoadingSave] = useState(false);

  // Criação de nova role
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [criandoRole, setCriandoRole] = useState(false);

  // Pesquisas & Filtros
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionFilter, setPermissionFilter] = useState<PermissionFilter>("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Membros: Filtros e estados
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<MemberStatusFilter>("all");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [membroEmCurso, setMembroEmCurso] = useState<number | null>(null);

  // Remoção de role
  const [roleParaApagar, setRoleParaApagar] = useState<RbacRole | null>(null);
  const [destinoMembros, setDestinoMembros] = useState<string>("");
  const [aApagar, setAApagar] = useState(false);

  // Cópia de permissões entre roles
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sourceRoleId, setSourceRoleId] = useState<string>("");

  // Organizações / Empresas
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([]);

  // ----------------------------------------------------
  // GESTÃO COMPLETA DE MEMBRO / PERFIL GLOBAL (MODAIS)
  // ----------------------------------------------------
  // 1. Edição completa
  const [memberParaEditar, setMemberParaEditar] = useState<RbacMember | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    apelido: "",
    email: "",
    telefone: "",
    role_id: "" as string | number,
    empresa_id: "" as string | number,
    cargo: "",
    is_active: true,
    senha: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [salvandoMembro, setSalvandoMembro] = useState(false);

  // 2. Criação completa de utilizador
  const [showCreateMemberModal, setShowCreateMemberModal] = useState(false);
  const [createMemberForm, setCreateMemberForm] = useState({
    nome: "",
    apelido: "",
    email: "",
    telefone: "",
    role_id: "" as string | number,
    empresa_id: "" as string | number,
    cargo: "",
    is_active: true,
    senha: "",
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [criandoMembro, setCriandoMembro] = useState(false);

  // 3. Exclusão de utilizador
  const [memberParaExcluir, setMemberParaExcluir] = useState<RbacMember | null>(null);
  const [excluindoMembro, setExcluindoMembro] = useState(false);

  // Notificações
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  /* Carrega catálogo de empresas para associação (paginado + cache) */
  const carregarEmpresas = async () => {
    try {
      const res = await fetchEmpresasPaginadas({ page: 1, pageSize: 100, status: "todas" });
      if (res && Array.isArray(res.items)) {
        setEmpresas(res.items);
      }
    } catch (err) {
      console.warn("Falha ao carregar empresas para associação:", err);
    }
  };

  useEffect(() => {
    carregarEmpresas();
  }, []);

  /* Seleciona a primeira função assim que a lista chega */
  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId(null);
      return;
    }
    if (selectedRoleId === null || !roles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  /* Atualiza rascunho de permissões ao trocar de função */
  useEffect(() => {
    if (selectedRole) {
      setRascunho(idsDe(selectedRole.permissions));
    } else {
      setRascunho([]);
    }
  }, [selectedRole]);

  /* Auto-limpa notificação após 4 segundos */
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Se a role é editável
  const editavel = useMemo(() => {
    if (!selectedRole || !podeGerirFuncoes) return false;
    return !selectedRole.is_locked;
  }, [selectedRole, podeGerirFuncoes]);

  // Verifica se há alterações não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole) return false;
    return !mesmoConjunto(rascunho, idsDe(selectedRole.permissions));
  }, [selectedRole, rascunho]);

  // Agrupamento de permissões por categoria
  const permissionsGrouped = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase();
    const groups: Record<string, RbacPermission[]> = {};

    permissions.forEach((p) => {
      // Filtro de texto
      if (
        term &&
        !p.name.toLowerCase().includes(term) &&
        !(p.description || "").toLowerCase().includes(term)
      ) {
        return;
      }

      // Filtro de status (concedidas / revogadas)
      const isGranted = rascunho.includes(p.id);
      if (permissionFilter === "granted" && !isGranted) return;
      if (permissionFilter === "revoked" && isGranted) return;

      const cat = p.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    return groups;
  }, [permissions, permissionSearch, permissionFilter, rascunho]);

  // Filtro de Funções (Roles)
  const filteredRoles = useMemo(() => {
    const term = roleSearch.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description || "").toLowerCase().includes(term)
    );
  }, [roles, roleSearch]);

  // Filtro de Membros
  const filteredMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    return members.filter((m) => {
      // Busca textual
      if (term) {
        const matchNome = (m.nome || "").toLowerCase().includes(term);
        const matchEmail = (m.email || "").toLowerCase().includes(term);
        const matchApelido = (m.apelido || "").toLowerCase().includes(term);
        const matchTelefone = (m.telefone || "").toLowerCase().includes(term);
        const matchCargo = (m.cargo_nome || "").toLowerCase().includes(term);
        if (!matchNome && !matchEmail && !matchApelido && !matchTelefone && !matchCargo) return false;
      }

      // Filtro de status
      if (memberStatusFilter === "active" && !m.is_active) return false;
      if (memberStatusFilter === "inactive" && m.is_active) return false;

      // Filtro de função
      if (memberRoleFilter !== "all") {
        if (memberRoleFilter === "none") {
          if (m.role_id !== null && m.role_id !== undefined) return false;
        } else {
          if (String(m.role_id) !== memberRoleFilter) return false;
        }
      }

      return true;
    });
  }, [members, memberSearch, memberStatusFilter, memberRoleFilter]);

  // Destinos possíveis para migração de membros ao apagar função
  const destinosPossiveis = useMemo(() => {
    if (!roleParaApagar) return [];
    return roles.filter(
      (r) =>
        r.id !== roleParaApagar.id &&
        r.is_active &&
        (!roleParaApagar.empresa_id ||
          r.empresa_id === null ||
          r.empresa_id === roleParaApagar.empresa_id)
    );
  }, [roles, roleParaApagar]);

  // Contadores para KPIs
  const totalMembros = members.length;
  const membrosAtivos = members.filter((m) => m.is_active).length;
  const totalRoles = roles.length;
  const totalPermissoesCatalogo = permissions.length;

  /* =====================
       AÇÕES: PERMISSÕES
  ===================== */
  const togglePermission = (id: number) => {
    if (!editavel) return;
    setRascunho((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleCategory = (categoryPermissions: RbacPermission[]) => {
    if (!editavel) return;
    const catIds = idsDe(categoryPermissions);
    const todasMarcadas = catIds.every((id) => rascunho.includes(id));

    if (todasMarcadas) {
      setRascunho((prev) => prev.filter((id) => !catIds.includes(id)));
    } else {
      setRascunho((prev) => Array.from(new Set([...prev, ...catIds])));
    }
  };

  const selecionarTodas = () => {
    if (!editavel) return;
    setRascunho(idsDe(permissions));
  };

  const limparTodas = () => {
    if (!editavel) return;
    setRascunho([]);
  };

  const descartar = () => {
    if (selectedRole) {
      setRascunho(idsDe(selectedRole.permissions));
      setNotification({ type: "success", msg: "Alterações descartadas." });
    }
  };

  const savePermissions = async () => {
    if (!selectedRole || !editavel) return;
    setLoadingSave(true);
    try {
      await setRolePermissions(selectedRole.id, rascunho);
      setNotification({
        type: "success",
        msg: `Permissões da função "${selectedRole.name}" salvas com sucesso!`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao salvar permissões."),
      });
    } finally {
      setLoadingSave(false);
    }
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedCategories(new Set(Object.keys(permissionsGrouped)));
  };

  const expandAll = () => {
    setCollapsedCategories(new Set());
  };

  /* =====================
       AÇÕES: FUNÇÕES (ROLES)
  ===================== */
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setCriandoRole(true);
    try {
      const created = await createRole(newRoleName.trim(), newRoleDesc.trim());
      setIsCreatingRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setSelectedRoleId(created.id);
      setNotification({
        type: "success",
        msg: `Função "${created.name}" criada com sucesso!`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao criar função."),
      });
    } finally {
      setCriandoRole(false);
    }
  };

  const abrirRemocao = (role: RbacRole) => {
    setRoleParaApagar(role);
    setDestinoMembros("");
  };

  const confirmarRemocao = async () => {
    if (!roleParaApagar) return;
    if (roleParaApagar.users_count > 0 && !destinoMembros) {
      setNotification({
        type: "error",
        msg: "Selecione uma função de destino para os membros existentes.",
      });
      return;
    }

    setAApagar(true);
    try {
      const reassignId = destinoMembros ? Number(destinoMembros) : undefined;
      await deleteRole(roleParaApagar.id, reassignId);
      setNotification({
        type: "success",
        msg: `Função "${roleParaApagar.name}" removida com sucesso!`,
      });
      setRoleParaApagar(null);
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao remover função."),
      });
    } finally {
      setAApagar(false);
    }
  };

  const handleCopyPermissions = () => {
    if (!sourceRoleId || !editavel) return;
    const sourceRole = roles.find((r) => String(r.id) === sourceRoleId);
    if (!sourceRole) return;

    setRascunho(idsDe(sourceRole.permissions));
    setShowCopyModal(false);
    setNotification({
      type: "success",
      msg: `Permissões copiadas da função "${sourceRole.name}" para o rascunho!`,
    });
  };

  /* =====================
       AÇÕES: MEMBROS / GESTÃO COMPLETA
  ===================== */
  const handleMemberRole = async (userId: number, roleIdStr: string) => {
    setMembroEmCurso(userId);
    try {
      const roleId = roleIdStr === "" ? null : Number(roleIdStr);
      await setMemberRole(userId, roleId);
      setNotification({
        type: "success",
        msg: "Função do membro atualizada com sucesso!",
      });
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao atribuir função."),
      });
    } finally {
      setMembroEmCurso(null);
    }
  };

  const handleMemberStatus = async (userId: number, novoStatus: boolean) => {
    setMembroEmCurso(userId);
    try {
      await setMemberStatus(userId, novoStatus);
      setNotification({
        type: "success",
        msg: `Membro ${novoStatus ? "reativado" : "desativado"} com sucesso!`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao atualizar status do membro."),
      });
    } finally {
      setMembroEmCurso(null);
    }
  };

  // Abre modal de edição completa do utilizador
  const abrirEdicaoMembro = (m: RbacMember) => {
    carregarEmpresas();
    setMemberParaEditar(m);
    setEditForm({
      nome: m.nome || "",
      apelido: m.apelido || "",
      email: m.email || "",
      telefone: m.telefone || "",
      role_id: m.role_id !== null && m.role_id !== undefined ? String(m.role_id) : "",
      empresa_id: m.empresa_id !== null && m.empresa_id !== undefined ? String(m.empresa_id) : "",
      cargo: m.cargo_nome || "",
      is_active: m.is_active,
      senha: "",
    });
    setShowEditPassword(false);
  };

  const handleSalvarEdicaoMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberParaEditar) return;
    if (!editForm.nome.trim()) {
      setNotification({ type: "error", msg: "O nome do utilizador é obrigatório." });
      return;
    }
    if (!editForm.email.trim()) {
      setNotification({ type: "error", msg: "O e-mail do utilizador é obrigatório." });
      return;
    }

    setSalvandoMembro(true);
    try {
      const payload: MemberUpdateFullPayload = {
        nome: editForm.nome.trim(),
        apelido: editForm.apelido.trim() || null,
        email: editForm.email.trim().toLowerCase(),
        telefone: editForm.telefone.trim() || null,
        role_id: editForm.role_id !== "" ? Number(editForm.role_id) : 0,
        empresa_id: editForm.empresa_id !== "" ? Number(editForm.empresa_id) : 0,
        cargo: editForm.cargo.trim() || null,
        is_active: editForm.is_active,
      };
      if (editForm.senha.trim()) {
        payload.senha = editForm.senha.trim();
      }

      await updateMemberFull(memberParaEditar.id, payload);
      setMemberParaEditar(null);
      setNotification({
        type: "success",
        msg: `Perfil de ${editForm.nome} atualizado com sucesso!`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao atualizar dados do utilizador."),
      });
    } finally {
      setSalvandoMembro(false);
    }
  };

  // Abre modal de criação de novo utilizador
  const abrirCriacaoMembro = () => {
    carregarEmpresas();
    setCreateMemberForm({
      nome: "",
      apelido: "",
      email: "",
      telefone: "",
      role_id: roles.length > 0 ? String(roles[0].id) : "",
      empresa_id: "",
      cargo: "",
      is_active: true,
      senha: gerarSenhaAleatoria(),
    });
    setShowCreatePassword(true);
    setShowCreateMemberModal(true);
  };

  const handleCriarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createMemberForm.nome.trim()) {
      setNotification({ type: "error", msg: "O nome é obrigatório." });
      return;
    }
    if (!createMemberForm.email.trim()) {
      setNotification({ type: "error", msg: "O e-mail é obrigatório." });
      return;
    }

    setCriandoMembro(true);
    try {
      const payload: MemberCreateGlobalPayload = {
        nome: createMemberForm.nome.trim(),
        apelido: createMemberForm.apelido.trim() || null,
        email: createMemberForm.email.trim().toLowerCase(),
        telefone: createMemberForm.telefone.trim() || null,
        role_id: createMemberForm.role_id !== "" ? Number(createMemberForm.role_id) : null,
        empresa_id: createMemberForm.empresa_id !== "" ? Number(createMemberForm.empresa_id) : null,
        cargo: createMemberForm.cargo.trim() || null,
        is_active: createMemberForm.is_active,
        senha: createMemberForm.senha.trim() || null,
      };

      await createMemberGlobal(payload);
      setShowCreateMemberModal(false);
      setNotification({
        type: "success",
        msg: `Utilizador ${payload.nome} criado com sucesso!`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao criar novo utilizador."),
      });
    } finally {
      setCriandoMembro(false);
    }
  };

  // Confirmação de exclusão de utilizador
  const abrirExclusaoMembro = (m: RbacMember) => {
    setMemberParaExcluir(m);
  };

  const handleExcluirMembro = async () => {
    if (!memberParaExcluir) return;
    setExcluindoMembro(true);
    try {
      await deleteMemberGlobal(memberParaExcluir.id);
      setNotification({
        type: "success",
        msg: `Utilizador "${memberParaExcluir.nome}" removido do sistema!`,
      });
      setMemberParaExcluir(null);
    } catch (err) {
      setNotification({
        type: "error",
        msg: extractApiError(err, "Falha ao remover utilizador."),
      });
    } finally {
      setExcluindoMembro(false);
    }
  };

  /* =====================
       RENDERIZAÇÃO
  ===================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-slate-600 text-sm font-semibold tracking-wide">
          A carregar governança, perfis e permissões...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 bg-red-50/70 border border-red-200 rounded-2xl text-red-800 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
        <div className="space-y-2">
          <p className="font-bold text-sm">Erro ao carregar dados de acesso:</p>
          <p className="text-xs text-red-700">{loadError}</p>
          <button
            onClick={reload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw size={13} /> Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOAST FLUTUANTE DE NOTIFICAÇÃO */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 border ${
            notification.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-red-600 text-white border-red-500"
          }`}
        >
          {notification.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.msg}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-80 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* =========================================================
          CABEÇALHO COM TÍTULO, SUBTÍTULO E CONTROLES DE VISTA
      ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Controlo de Acesso & Perfis (RBAC)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Administração centralizada de utilizadores, perfis corporativos, funções e privilégios granulares.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Modo de Visualização */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "split"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Combinada
            </button>
            <button
              onClick={() => setViewMode("roles")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "roles"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Funções
            </button>
            <button
              onClick={() => setViewMode("members")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "members"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Membros ({members.length})
            </button>
          </div>

          {/* Botão Novo Membro */}
          {podeGerirMembros && (
            <button
              onClick={abrirCriacaoMembro}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <UserPlus size={14} /> Novo Membro
            </button>
          )}

          {/* Botão Recarregar */}
          <button
            onClick={reload}
            title="Atualizar dados"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* =========================================================
          CARDS DE RESUMO (KPIS)
      ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Membros */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Utilizadores
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalMembros}</span>
            <span className="text-[11px] text-slate-400">registados</span>
          </div>
        </div>

        {/* KPI 2: Membros Ativos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contas Ativas
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{membrosAtivos}</span>
            <span className="text-[11px] text-slate-400">
              ({totalMembros > 0 ? Math.round((membrosAtivos / totalMembros) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* KPI 3: Funções Definidas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Funções Ativas
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Shield size={14} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{totalRoles}</span>
            <span className="text-[11px] text-slate-400">perfis RBAC</span>
          </div>
        </div>

        {/* KPI 4: Catálogo de Permissões */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Privilégios
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Layers size={14} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{totalPermissoesCatalogo}</span>
            <span className="text-[11px] text-slate-400">ações auditadas</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          1. MODO: DIRETÓRIO DE MEMBROS (VISTA EXPANDIDA)
      ========================================================= */}
      {viewMode === "members" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
          {/* BARRA DE PESQUISA E FILTROS DE MEMBROS */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Pesquisar por nome, apelido, email ou cargo..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Status */}
              <select
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                value={memberStatusFilter}
                onChange={(e) => setMemberStatusFilter(e.target.value as MemberStatusFilter)}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Apenas Ativos</option>
                <option value="inactive">Apenas Inativos</option>
              </select>

              {/* Filtro Função */}
              <select
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
              >
                <option value="all">Todas as Funções</option>
                <option value="none">Sem Função Atribuída</option>
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>

              {podeGerirMembros && (
                <button
                  onClick={abrirCriacaoMembro}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Plus size={14} /> Adicionar
                </button>
              )}
            </div>
          </div>

          {/* LISTA / GRID DE MEMBROS */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <UserX className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">Nenhum membro encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">Tente ajustar a pesquisa ou os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMembers.map((m) => {
                const euProprio = capabilities?.user_id === m.id;
                const ocupado = membroEmCurso === m.id;

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border transition-all ${
                      m.is_active
                        ? "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs"
                        : "bg-slate-50/70 border-slate-200/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarCor(
                            m.nome
                          )} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                        >
                          {getIniciais(m.nome)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            {m.nome} {m.apelido ? m.apelido : ""}
                            {m.is_superadmin && (
                              <span title="Super Admin" className="shrink-0 flex items-center">
                                <Crown size={12} className="text-amber-500" />
                              </span>
                            )}
                            {euProprio && (
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded font-normal">
                                você
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {m.email}
                          </p>
                          {m.telefone && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Phone size={9} /> {m.telefone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações do Membro */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full mr-1 ${
                            m.is_active ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          title={m.is_active ? "Ativo" : "Inativo"}
                        />

                        {/* Botão de Edição Completa */}
                        {podeGerirMembros && (
                          <button
                            onClick={() => abrirEdicaoMembro(m)}
                            title="Editar informação completa e perfil"
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                        )}

                        {/* Ativar / Desativar */}
                        {podeGerirMembros && !euProprio && (
                          <button
                            onClick={() => handleMemberStatus(m.id, !m.is_active)}
                            disabled={ocupado}
                            title={m.is_active ? "Desativar conta" : "Reativar conta"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                          >
                            {m.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        )}

                        {/* Excluir Membro */}
                        {podeGerirMembros && !euProprio && !m.is_superadmin && (
                          <button
                            onClick={() => abrirExclusaoMembro(m)}
                            title="Remover utilizador"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detalhes de Cargo / Empresa */}
                    {(m.cargo_nome || m.empresa_id) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        {m.cargo_nome && (
                          <span className="flex items-center gap-1 truncate font-medium">
                            <Briefcase size={11} className="text-slate-400" /> {m.cargo_nome}
                          </span>
                        )}
                        {m.empresa_id && (
                          <span className="flex items-center gap-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 truncate">
                            <Building2 size={10} /> Emp #{m.empresa_id}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Atribuição de Função Rápida */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Função:
                      </span>
                      <select
                        className="text-xs border border-slate-200 rounded-lg bg-slate-50 py-1 px-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 cursor-pointer disabled:opacity-60 max-w-[190px]"
                        value={m.role_id ?? ""}
                        disabled={!podeGerirMembros || euProprio || ocupado}
                        onChange={(e) => handleMemberRole(m.id, e.target.value)}
                      >
                        <option value="">— Sem Função —</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          2. MODO: SPLIT OU APENAS ROLES/PERMISSÕES
      ========================================================= */}
      {viewMode !== "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA: LISTA DE FUNÇÕES & (SE SPLIT) MEMBROS RÁPIDOS */}
          <div className={`${viewMode === "roles" ? "lg:col-span-4" : "lg:col-span-4"} space-y-6`}>
            
            {/* CARD DE FUNÇÕES */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Shield size={16} className="text-indigo-600" />
                    Funções ({roles.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Selecione para editar privilégios</p>
                </div>
                {podeGerirFuncoes && (
                  <button
                    onClick={() => setIsCreatingRole(true)}
                    className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-2xs"
                    title="Adicionar nova função"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Form de Criação de Função */}
              {isCreatingRole && (
                <form
                  onSubmit={handleCreateRole}
                  className="p-3.5 bg-indigo-50/40 border-b border-indigo-100 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950">Nova Função RBAC</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingRole(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nome da função (ex: Auditor, Suporte)..."
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    autoFocus
                    required
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Descrição opcional..."
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingRole(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={criandoRole || !newRoleName.trim()}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                    >
                      {criandoRole && <Loader2 size={12} className="animate-spin" />}
                      Salvar
                    </button>
                  </div>
                </form>
              )}

              {/* Busca de Funções */}
              <div className="p-2.5 border-b border-slate-100">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar funções..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-400 font-medium"
                  />
                </div>
              </div>

              {/* Lista de Funções */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {filteredRoles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nenhuma função encontrada.
                  </div>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = selectedRoleId === role.id;

                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`group p-3 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "bg-indigo-50/80 border-l-4 border-l-indigo-600"
                            : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold capitalize truncate ${
                                isSelected ? "text-indigo-950 font-extrabold" : "text-slate-800"
                              }`}
                            >
                              {role.name}
                            </span>
                            {role.is_locked && (
                              <span title="Super Admin" className="shrink-0 flex items-center">
                                <Crown size={12} className="text-amber-500" />
                              </span>
                            )}
                            {role.is_system && !role.is_locked && (
                              <span title="Função de Sistema" className="shrink-0 flex items-center">
                                <Lock size={11} className="text-slate-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {role.description ? (
                              role.description
                            ) : (
                              <span>Sem descrição</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold"
                            title={`${role.users_count} membro(s)`}
                          >
                            {role.users_count} 👤
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600"
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
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all p-1 rounded-md ml-1"
                              title="Remover função"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SE MODO SPLIT: CARD COMPACTO DE MEMBROS */}
            {viewMode === "split" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users size={15} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-xs">
                      Membros ({members.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {podeGerirMembros && (
                      <button
                        onClick={abrirCriacaoMembro}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 hover:underline"
                        title="Adicionar novo membro"
                      >
                        <Plus size={12} /> Novo
                      </button>
                    )}
                    <button
                      onClick={() => setViewMode("members")}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      Ver todos →
                    </button>
                  </div>
                </div>

                <div className="max-h-[380px] overflow-y-auto p-2 space-y-2.5">
                  {members.map((u) => {
                    const euProprio = capabilities?.user_id === u.id;
                    const ocupado = membroEmCurso === u.id;

                    return (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors shadow-2xs space-y-2"
                      >
                        {/* Linha 1: Avatar, Nome, Status e Botão Editar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarCor(
                                u.nome
                              )} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}
                            >
                              {getIniciais(u.nome)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                                {u.nome}
                                {u.is_superadmin && (
                                  <span title="Super Admin" className="shrink-0 flex items-center">
                                    <Crown size={10} className="text-amber-500" />
                                  </span>
                                )}
                                {euProprio && (
                                  <span className="text-[9px] text-indigo-600 font-normal">
                                    (você)
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.is_active ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              title={u.is_active ? "Ativo" : "Inativo"}
                            />
                            {podeGerirMembros && (
                              <button
                                onClick={() => abrirEdicaoMembro(u)}
                                title="Editar informação e perfil completo"
                                className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Linha 2: Dropdown de Função */}
                        <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">Função:</span>
                          <select
                            className="text-[11px] border border-slate-200 rounded-lg bg-slate-50 py-1 px-1.5 focus:bg-white text-slate-800 max-w-[150px] font-medium"
                            value={u.role_id ?? ""}
                            disabled={!podeGerirMembros || euProprio || ocupado}
                            onChange={(e) => handleMemberRole(u.id, e.target.value)}
                          >
                            <option value="">— Sem função —</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: MATRIZ DE PERMISSÕES DA ROLE SELECIONADA */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs min-h-[580px] flex flex-col relative overflow-hidden">
              
              {/* TOOLBAR DA MATRIZ */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm capitalize">
                      {selectedRole ? `Permissões: ${selectedRole.name}` : "Selecione uma Função"}
                    </h3>
                    {selectedRole?.is_locked && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 font-bold border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown size={10} /> SUPER ADMIN (BLOQUEADA)
                      </span>
                    )}
                    {selectedRole?.is_system && !selectedRole.is_locked && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock size={10} /> SISTEMA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedRole
                      ? `${rascunho.length} de ${permissions.length} permissões concedidas`
                      : "Clique em uma função à esquerda para configurar privilégios"}
                  </p>
                </div>

                {/* AÇÕES DA MATRIZ */}
                {selectedRole && editavel && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCopyModal(true)}
                      className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                      title="Copiar permissões de outro perfil"
                    >
                      <Copy size={13} /> Copiar de...
                    </button>
                    <button
                      type="button"
                      onClick={selecionarTodas}
                      className="px-2.5 py-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold transition-colors"
                    >
                      Marcar Todas
                    </button>
                    <button
                      type="button"
                      onClick={limparTodas}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                      Limpar Todas
                    </button>
                  </div>
                )}
              </div>

              {/* FILTROS DA MATRIZ DE PERMISSÕES */}
              {selectedRole && (
                <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome ou chave de permissão..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => setPermissionFilter("all")}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          permissionFilter === "all"
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        onClick={() => setPermissionFilter("granted")}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          permissionFilter === "granted"
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Concedidas ({rascunho.length})
                      </button>
                      <button
                        onClick={() => setPermissionFilter("revoked")}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          permissionFilter === "revoked"
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Revogadas
                      </button>
                    </div>

                    <button
                      onClick={collapsedCategories.size > 0 ? expandAll : collapseAll}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
                    >
                      {collapsedCategories.size > 0 ? "Expandir tudo" : "Recolher tudo"}
                    </button>
                  </div>
                </div>
              )}

              {/* LISTA DE CATEGORIAS E PERMISSÕES */}
              <div className="p-4 flex-1 overflow-y-auto max-h-[580px] space-y-4">
                {!selectedRole ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                    <Shield className="w-12 h-12 mb-2 stroke-1 opacity-40 text-indigo-400" />
                    <p className="text-sm font-semibold text-slate-700">Selecione uma função</p>
                    <p className="text-xs text-slate-400">
                      Escolha uma função na lista lateral para gerir os seus privilégios de acesso.
                    </p>
                  </div>
                ) : Object.keys(permissionsGrouped).length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-xs font-semibold">Nenhuma permissão corresponde aos filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-16">
                    {selectedRole.is_locked && (
                      <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-3 rounded-xl flex items-start gap-2 text-xs">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                        <div>
                          <strong>Função Protegida:</strong> Os privilégios de superadministrador são imutáveis para garantir a integridade da plataforma.
                        </div>
                      </div>
                    )}

                    {Object.entries(permissionsGrouped).map(([category, perms]) => {
                      const isCollapsed = collapsedCategories.has(category);
                      const ids = idsDe(perms);
                      const concedidasNaCategoria = perms.filter((p) => rascunho.includes(p.id)).length;
                      const isCategoryFullySelected = ids.every((id) => rascunho.includes(id));

                      return (
                        <div
                          key={category}
                          className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs transition-all"
                        >
                          {/* Cabeçalho da Categoria */}
                          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                            <button
                              type="button"
                              onClick={() => toggleCategoryCollapse(category)}
                              className="flex items-center gap-2 text-left font-bold text-slate-800 text-xs uppercase tracking-wider hover:text-indigo-600 transition-colors"
                            >
                              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              <span>{category}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold normal-case">
                                {concedidasNaCategoria} / {perms.length} ativas
                              </span>
                            </button>

                            {editavel && (
                              <button
                                type="button"
                                onClick={() => toggleCategory(perms)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                              >
                                {isCategoryFullySelected ? "Desmarcar bloco" : "Marcar bloco"}
                              </button>
                            )}
                          </div>

                          {/* Grade de Permissões da Categoria */}
                          {!isCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3">
                              {perms.map((p) => {
                                const isSelected = rascunho.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`relative flex items-start p-2.5 rounded-xl border transition-all duration-150 select-none ${
                                      isSelected
                                        ? "bg-indigo-50/70 border-indigo-200 shadow-2xs"
                                        : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                                    } ${
                                      editavel
                                        ? "cursor-pointer"
                                        : "cursor-not-allowed opacity-75"
                                    }`}
                                  >
                                    <div className="flex items-center h-5 mt-0.5">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                        checked={isSelected}
                                        onChange={() => togglePermission(p.id)}
                                        disabled={!editavel}
                                      />
                                    </div>
                                    <div className="ml-2.5 min-w-0">
                                      <span
                                        className={`font-semibold block truncate text-xs ${
                                          isSelected ? "text-indigo-950 font-bold" : "text-slate-800"
                                        }`}
                                      >
                                        {p.name}
                                      </span>
                                      {p.description && (
                                        <span className="text-slate-500 text-[11px] block line-clamp-2 mt-0.5">
                                          {p.description}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BARRA FLUTUANTE DE SALVAR / DESCARTAR ALTERAÇÕES */}
              {selectedRole && editavel && (
                <div
                  className={`absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-3 items-center justify-between transition-all duration-300 transform z-20 ${
                    hasUnsavedChanges
                      ? "translate-y-0 opacity-100"
                      : "translate-y-12 opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="bg-amber-500 text-slate-950 rounded-lg p-1.5 animate-pulse shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Alterações de permissão pendentes</p>
                      <p className="text-slate-400 text-[11px]">
                        As alterações entram em vigor imediatamente após salvar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={descartar}
                      disabled={loadingSave}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium transition-colors disabled:opacity-50"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={savePermissions}
                      disabled={loadingSave}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg text-xs font-bold shadow-sm disabled:opacity-70 flex items-center gap-1.5 transition-all"
                    >
                      {loadingSave ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      Guardar Alterações
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: EDIÇÃO COMPLETA DO UTILIZADOR / PERFIL GLOBAL
      ========================================================= */}
      {memberParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarCor(
                    memberParaEditar.nome
                  )} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
                >
                  {getIniciais(memberParaEditar.nome)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                    Editar Perfil: {memberParaEditar.nome}
                    {memberParaEditar.is_superadmin && (
                      <span title="Super Admin">
                        <Crown size={13} className="text-amber-500" />
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID #{memberParaEditar.id} · Gestão administrativa de dados e acessos globais
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMemberParaEditar(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário de Edição */}
            <form onSubmit={handleSalvarEdicaoMembro} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Nome e Apelido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Próprio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nome}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="Primeiro nome..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apelido / Sobrenome
                  </label>
                  <input
                    type="text"
                    value={editForm.apelido}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, apelido: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="Sobrenome..."
                  />
                </div>
              </div>

              {/* Email e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Login <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    value={editForm.telefone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, telefone: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>

              {/* Função Global (Role) e Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Função Global (Perfil RBAC)
                  </label>
                  <select
                    value={editForm.role_id}
                    disabled={memberParaEditar.id === capabilities?.user_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, role_id: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium disabled:opacity-60"
                  >
                    <option value="">— Sem Função —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name} {r.is_locked ? "(Super Admin)" : ""}
                      </option>
                    ))}
                  </select>
                  {memberParaEditar.id === capabilities?.user_id && (
                    <span className="text-[10px] text-amber-600 block mt-1">
                      Você não pode alterar sua própria função global.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organização / Empresa
                  </label>
                  <select
                    value={String(editForm.empresa_id || "")}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, empresa_id: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  >
                    <option value="">— Nenhuma (Global / Plataforma) —</option>
                    {memberParaEditar?.empresa_id &&
                      !empresas.some((e) => String(e.id) === String(memberParaEditar.empresa_id)) && (
                        <option value={String(memberParaEditar.empresa_id)}>
                          {memberParaEditar.empresa_nome || `Empresa #${memberParaEditar.empresa_id}`}
                        </option>
                      )}
                    {empresas.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.nome || emp.company || `Empresa #${emp.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cargo / Título Profissional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Título Profissional
                </label>
                <input
                  type="text"
                  value={editForm.cargo}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cargo: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  placeholder="Ex: Engenheiro de Dados, Consultor, Diretor..."
                />
              </div>

              {/* Status da Conta */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Status da Conta</span>
                  <span className="text-[11px] text-slate-400 block">
                    {editForm.is_active ? "Conta ativa e com acesso ao sistema" : "Conta suspensa/desativada"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={memberParaEditar.id === capabilities?.user_id}
                  onClick={() => setEditForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    editForm.is_active ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      editForm.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Redefinição de Senha */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Key size={13} className="text-indigo-600" /> Redefinir Senha do Utilizador
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, senha: gerarSenhaAleatoria() }))
                    }
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline"
                  >
                    Gerar Senha Forte
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.senha}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, senha: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-mono pr-9"
                    placeholder="Deixe em branco para manter a senha atual..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Preencha apenas caso deseje substituir a senha de acesso deste utilizador.
                </p>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMemberParaEditar(null)}
                  disabled={salvandoMembro}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoMembro}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {salvandoMembro ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CRIAR NOVO MEMBRO / UTILIZADOR GLOBAL
      ========================================================= */}
      {showCreateMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Novo Utilizador no Sistema
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastrar nova conta com função e privilégios globais
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateMemberModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCriarMembro} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Próprio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createMemberForm.nome}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="Primeiro nome..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apelido / Sobrenome
                  </label>
                  <input
                    type="text"
                    value={createMemberForm.apelido}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, apelido: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="Sobrenome..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Login <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createMemberForm.email}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="exemplo@organizacao.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={createMemberForm.telefone}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, telefone: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                    placeholder="+351 9xx xxx xxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Função Global (Perfil RBAC)
                  </label>
                  <select
                    value={createMemberForm.role_id}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, role_id: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  >
                    <option value="">— Sem Função —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organização / Empresa
                  </label>
                  <select
                    value={String(createMemberForm.empresa_id || "")}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, empresa_id: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  >
                    <option value="">— Nenhuma (Global) —</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.nome || emp.company || `Empresa #${emp.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Posição
                </label>
                <input
                  type="text"
                  value={createMemberForm.cargo}
                  onChange={(e) =>
                    setCreateMemberForm((prev) => ({ ...prev, cargo: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  placeholder="Ex: Administrador, Analista, Gestor..."
                />
              </div>

              {/* Senha Inicial */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Key size={13} className="text-emerald-600" /> Senha Inicial de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateMemberForm((prev) => ({ ...prev, senha: gerarSenhaAleatoria() }))
                    }
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                  >
                    Gerar Outra Senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={createMemberForm.senha}
                    onChange={(e) =>
                      setCreateMemberForm((prev) => ({ ...prev, senha: e.target.value }))
                    }
                    className="w-full text-xs p-2.5 bg-white border border-emerald-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-mono pr-9"
                    placeholder="Mínimo 6 caracteres..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  O utilizador poderá alterar esta senha assim que efetuar o primeiro acesso.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateMemberModal(false)}
                  disabled={criandoMembro}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criandoMembro}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {criandoMembro ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <UserPlus size={13} />
                  )}
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: REMOVER UTILIZADOR / MEMBRO
      ========================================================= */}
      {memberParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Remover Utilizador &quot;{memberParaExcluir.nome}&quot;?
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Esta ação é irreversível. A conta associada a <strong>{memberParaExcluir.email}</strong> será eliminada do sistema.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setMemberParaExcluir(null)}
                disabled={excluindoMembro}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirMembro}
                disabled={excluindoMembro}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 shadow-xs"
              >
                {excluindoMembro && <Loader2 size={13} className="animate-spin" />}
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: REMOVER FUNÇÃO (COM TRANSFERÊNCIA DE MEMBROS)
      ========================================================= */}
      {roleParaApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Remover a função “{roleParaApagar.name}”?
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Esta ação é irreversível e excluirá a função do catálogo da organização.
                </p>
              </div>
            </div>

            {roleParaApagar.users_count > 0 && (
              <div className="mb-4 space-y-2 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                <p className="text-xs text-slate-800">
                  <strong>{roleParaApagar.users_count} membro(s)</strong> possuem esta função. Selecione para qual função ativa eles devem ser migrados:
                </p>

                {destinosPossiveis.length === 0 ? (
                  <div className="flex items-start gap-2 text-xs text-amber-800 font-medium">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <p>
                      Não existe outra função disponível para receber estes membros. Crie ou ative outra função antes de remover esta.
                    </p>
                  </div>
                ) : (
                  <select
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    value={destinoMembros}
                    onChange={(e) => setDestinoMembros(e.target.value)}
                  >
                    <option value="">-- Selecione a nova função de destino --</option>
                    {destinosPossiveis.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRoleParaApagar(null)}
                disabled={aApagar}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                disabled={
                  aApagar ||
                  (roleParaApagar.users_count > 0 && !destinoMembros)
                }
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 shadow-xs"
              >
                {aApagar && <Loader2 size={13} className="animate-spin" />}
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: COPIAR PERMISSÕES DE OUTRA FUNÇÃO
      ========================================================= */}
      {showCopyModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Copy size={16} className="text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Copiar Permissões para &quot;{selectedRole.name}&quot;
                </h4>
              </div>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Escolha uma função existente como modelo. As permissões dela serão clonadas para o rascunho da função atual.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Função de Origem
              </label>
              <select
                value={sourceRoleId}
                onChange={(e) => setSourceRoleId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Selecione uma função --</option>
                {roles
                  .filter((r) => r.id !== selectedRole.id)
                  .map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name} ({r.permissions.length} permissões)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopyPermissions}
                disabled={!sourceRoleId}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                Copiar para Rascunho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
