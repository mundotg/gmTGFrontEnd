"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Shield,
  Plus,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Loader2,
  Lock,
  AlertTriangle,
  RefreshCw,
  Info,
  Search,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  Building,
  UserPlus,
  Trash2,
  Mail,
  Phone,
  UserCheck,
  UserX,
  AlertCircle,
  Filter,
} from "lucide-react";

import api from "@/context/axioCuston";
import { useSession } from "@/context/SessionContext";
import {
  extractApiError,
  useRbac,
  type RbacRole,
  type RbacPermission,
} from "@/hook/useRbac";
import {
  fetchEmpresasPaginadas,
  clearEmpresaFrontendCache,
} from "@/app/services/empresaService";

/* =======================
   TIPOS
======================= */
interface EmpresaForm {
  company: string;
  companySize: string;
  nif: string;
  endereco: string;
  is_active: boolean;
}

interface EmpresaResposta {
  id: number;
  company?: string;
  nome?: string;
  companySize?: string | null;
  tamanho?: string | null;
  nif?: string | null;
  endereco?: string | null;
  is_active?: boolean;
  users_count?: number;
  criado_em?: string | null;
  can_manage?: boolean;
}

interface EmpresaPaginadaResposta {
  items: EmpresaResposta[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  is_admin: boolean;
}

interface EmpresaMember {
  id: number;
  nome: string;
  apelido?: string | null;
  email: string;
  telefone?: string | null;
  is_active: boolean;
  /** Tipo de utilizador: função global do sistema. */
  role_id?: number | null;
  role_name?: string | null;
  /** Cargo: função da empresa do membro. */
  empresa_role_id?: number | null;
  empresa_role_name?: string | null;
  cargo_id?: number | null;
  cargo_nome?: string | null;
  empresa_id?: number | null;
  is_superadmin: boolean;
  created_at?: string | null;
}

interface MemberPaginadoResposta {
  items: EmpresaMember[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  can_manage_members: boolean;
  // Ações da empresa (também concedidas por cargo)
  can_add_members?: boolean;
  can_remove_members?: boolean;
  can_change_cargo?: boolean;
}

type Aviso = { tipo: "success" | "error"; msg: string } | null;

const VAZIO: EmpresaForm = {
  company: "",
  companySize: "",
  nif: "",
  endereco: "",
  is_active: true,
};

const getNome = (e: EmpresaResposta) => e.company || e.nome || "";
const getTamanho = (e: EmpresaResposta) => e.companySize || e.tamanho || "";

/* =======================
   COMPONENTE PRINCIPAL
======================= */

export const EmpresaTab = () => {
  const { user } = useSession();

  /* ---- Lista paginada e filtros de empresas ---- */
  const [empresas, setEmpresas] = useState<EmpresaResposta[]>([]);
  const [totalEmpresas, setTotalEmpresas] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [buscaInput, setBuscaInput] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todas" | "ativas" | "inativas">("todas");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingLista, setLoadingLista] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  // Debounce na busca para evitar requisições a cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusca(buscaInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaInput]);

  /* ---- Empresa Selecionada & Formulário ---- */
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpresaForm>(VAZIO);
  const [original, setOriginal] = useState<EmpresaForm>(VAZIO);
  const [podeEditarEmpresa, setPodeEditarEmpresa] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  /* ---- Sub-abas da empresa selecionada ---- */
  const [abaAtiva, setAbaAtiva] = useState<"dados" | "membros" | "cargos">("dados");

  /* ---- Membros da empresa selecionada ---- */
  const [membros, setMembros] = useState<EmpresaMember[]>([]);
  const [totalMembros, setTotalMembros] = useState(0);
  const [totalPagesMembros, setTotalPagesMembros] = useState(1);
  const [pageMembro, setPageMembro] = useState(1);
  const [pageSizeMembro, setPageSizeMembro] = useState(6);
  const [buscaMembro, setBuscaMembro] = useState("");
  const [statusMembro, setStatusMembro] = useState<"todos" | "ativos" | "inativos">("todos");
  const [roleFiltroMembro, setRoleFiltroMembro] = useState<number | "todas">("todas");
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [erroMembros, setErroMembros] = useState<string | null>(null);
  const [canManageMembers, setCanManageMembers] = useState(false);
  // Cada ação da empresa tem a sua permissão (company:invite / remove_member /
  // assign_cargo), que um cargo pode dar sem a gestão geral de membros.
  const [canAddMembers, setCanAddMembers] = useState(false);
  const [canRemoveMembers, setCanRemoveMembers] = useState(false);
  const [canChangeCargo, setCanChangeCargo] = useState(false);


  /* ---- Cargos / permissões (RBAC real) ---- */
  const {
    roles,
    permissions,
    capabilities,
    loading: loadingRbac,
    loadError: erroRbac,
    reload: reloadRbac,
    createRole,
    setRolePermissions,
  } = useRbac(selectedId);

  const podeGerirCargos = !!capabilities?.can_manage_roles;

  // Este ecrã mostra só os cargos da empresa selecionada. Os globais do
  // sistema (admin, manager, developer, user) ficam de fora — e o backend
  // recusa alterá-los a partir de uma empresa, mesmo a um super admin.
  const cargosEmpresa = useMemo(
    () => roles.filter((r) => r.empresa_id != null && r.empresa_id === selectedId),
    [roles, selectedId]
  );
  // Tipos de utilizador = funções globais (admin, manager, developer, user).
  const tiposUtilizador = useMemo(() => roles.filter((r) => r.empresa_id == null), [roles]);
  // "+ Criar novo cargo…" no cartão de um membro: o cargo criado fica-lhe logo atribuído.
  const [cargoParaMembro, setCargoParaMembro] = useState<number | null>(null);

  /* ---- Modais / avisos ---- */
  const [cargoSelecionado, setCargoSelecionado] = useState<RbacRole | null>(null);
  const [criandoCargo, setCriandoCargo] = useState(false);
  const [criandoEmpresa, setCriandoEmpresa] = useState(false);
  const [adicionandoMembro, setAdicionandoMembro] = useState(false);
  const [membroParaRemover, setMembroParaRemover] = useState<EmpresaMember | null>(null);
  const [removendoMembro, setRemovendoMembro] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const notificar = useCallback((msg: string, tipo: "success" | "error" = "success") => {
    setAviso({ tipo, msg });
    setTimeout(() => setAviso(null), 4000);
  }, []);

  /** Uma linha da lista de cargos da empresa. */
  const renderCargo = (cargo: RbacRole) => {
    const editavel = podeGerirCargos && !cargo.is_locked;
    return (
      <div
        key={cargo.id}
        className="group flex min-w-0 flex-col gap-3 p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/20 transition-all sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors flex-shrink-0">
            {cargo.is_locked ? <Lock size={18} /> : <Shield size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 capitalize text-sm">{cargo.name}</p>
              {cargo.is_locked && <Tag texto="protegido" cor="amber" />}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {cargo.users_count} membro{cargo.users_count === 1 ? "" : "s"} nesta empresa ·{" "}
              {cargo.permissions.length} permissões
            </p>
            {cargo.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{cargo.description}</p>}
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 self-end sm:self-auto">
          <button
            onClick={() => setCargoSelecionado(cargo)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-purple-600 bg-white border border-gray-200 rounded-lg shadow-2xs hover:shadow-xs transition-all"
          >
            {editavel ? "Permissões" : "Ver"}
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  /* =======================
     CARREGAR LISTA DE EMPRESAS (PAGINADA + CACHE)
  ======================= */
  const carregarEmpresas = useCallback(async (forceRefresh = false) => {
    setLoadingLista(true);
    setErroLista(null);
    try {
      const data = await fetchEmpresasPaginadas({
        busca: busca.trim() || undefined,
        status: statusFiltro,
        page,
        pageSize,
        forceRefresh,
      });

      setEmpresas(data.items || []);
      setTotalEmpresas(data.total || 0);
      setTotalPages(Math.max(1, data.total_pages || 1));
      setIsAdmin(!!data.is_admin);

      if (data.items && data.items.length > 0) {
        setSelectedId((current) => {
          const existe = data.items.find((it) => it.id === current);
          return existe ? current : data.items[0].id;
        });
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setErroLista(extractApiError(err, "Não foi possível carregar as empresas."));
    } finally {
      setLoadingLista(false);
    }
  }, [busca, statusFiltro, page, pageSize]);

  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  // Empresa atualmente selecionada
  const selectedEmpresa = useMemo(
    () => empresas.find((e) => e.id === selectedId) || null,
    [empresas, selectedId]
  );
  const nomeEmpresaAtual = selectedEmpresa ? getNome(selectedEmpresa) : "esta empresa";

  // Sincroniza o formulário com a empresa selecionada
  useEffect(() => {
    if (selectedEmpresa) {
      const f: EmpresaForm = {
        company: getNome(selectedEmpresa),
        companySize: getTamanho(selectedEmpresa),
        nif: selectedEmpresa.nif ?? "",
        endereco: selectedEmpresa.endereco ?? "",
        is_active: selectedEmpresa.is_active !== false,
      };
      setForm(f);
      setOriginal(f);
      setPodeEditarEmpresa(!!selectedEmpresa.can_manage);
    } else {
      setForm(VAZIO);
      setOriginal(VAZIO);
      setPodeEditarEmpresa(false);
    }
  }, [selectedEmpresa]);

  const alterou = useMemo(
    () => (Object.keys(form) as (keyof EmpresaForm)[]).some((k) => form[k] !== original[k]),
    [form, original]
  );

  /* =======================
     CARREGAR MEMBROS DA EMPRESA SELECIONADA
  ======================= */
  const carregarMembros = useCallback(async () => {
    if (!selectedId) {
      setMembros([]);
      setTotalMembros(0);
      setTotalPagesMembros(1);
      return;
    }

    setLoadingMembros(true);
    setErroMembros(null);
    try {
      const { data } = await api.get<MemberPaginadoResposta>(`/empresas/${selectedId}/members`, {
        params: {
          busca: buscaMembro.trim() || undefined,
          status: statusMembro,
          role_id: roleFiltroMembro !== "todas" ? roleFiltroMembro : undefined,
          page: pageMembro,
          page_size: pageSizeMembro,
        },
      });

      setMembros(data.items || []);
      setTotalMembros(data.total || 0);
      setTotalPagesMembros(Math.max(1, data.total_pages || 1));
      setCanManageMembers(!!data.can_manage_members);
      setCanAddMembers(!!(data.can_add_members ?? data.can_manage_members));
      setCanRemoveMembers(!!(data.can_remove_members ?? data.can_manage_members));
      setCanChangeCargo(!!(data.can_change_cargo ?? data.can_manage_members));
    } catch (err) {
      setErroMembros(extractApiError(err, "Não foi possível carregar os membros."));
    } finally {
      setLoadingMembros(false);
    }
  }, [selectedId, buscaMembro, statusMembro, roleFiltroMembro, pageMembro, pageSizeMembro]);

  useEffect(() => {
    carregarMembros();
  }, [carregarMembros]);

  // Resetar paginação ao trocar de empresa
  useEffect(() => {
    setPageMembro(1);
    setBuscaMembro("");
    setStatusMembro("todos");
    setRoleFiltroMembro("todas");
  }, [selectedId]);

  /* =======================
     AÇÕES DE GESTÃO DA EMPRESA
  ======================= */
  const guardarEmpresa = async () => {
    if (!podeEditarEmpresa || !alterou || !selectedId) return;
    if (!form.company.trim()) {
      notificar("O nome da organização é obrigatório.", "error");
      return;
    }
    setSavingEmpresa(true);
    try {
      const { data } = await api.put<EmpresaResposta>(`/empresas/${selectedId}`, {
        company: form.company.trim(),
        companySize: form.companySize.trim() || null,
        nif: form.nif.trim() || null,
        endereco: form.endereco.trim() || null,
        is_active: form.is_active,
      });

      const f: EmpresaForm = {
        company: getNome(data),
        companySize: getTamanho(data),
        nif: data.nif ?? "",
        endereco: data.endereco ?? "",
        is_active: data.is_active !== false,
      };
      setForm(f);
      setOriginal(f);

      setEmpresas((prev) =>
        prev.map((e) => (e.id === selectedId ? { ...e, ...data } : e))
      );

      clearEmpresaFrontendCache();
      notificar("Dados da organização atualizados com sucesso.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível guardar a empresa."), "error");
    } finally {
      setSavingEmpresa(false);
    }
  };

  const setCampo = (campo: keyof EmpresaForm) => (v: string | boolean) =>
    setForm((prev) => ({ ...prev, [campo]: v }));

  /* =======================
     AÇÕES DE GESTÃO DE MEMBROS
  ======================= */
  const handleAdicionarMembro = async (dados: {
    user_id?: number;
    nome?: string;
    apelido?: string;
    email?: string;
    telefone?: string;
    cargo?: string;
    role_id?: number;
    empresa_role_id?: number;
    senha?: string;
  }) => {
    if (!selectedId) return;
    const { data } = await api.post<EmpresaMember>(
      `/empresas/${selectedId}/members`,
      dados
    );
    notificar(`Membro "${data.nome}" associado à organização com sucesso.`);
    setAdicionandoMembro(false);
    await carregarMembros();

    // Atualiza contador na empresa
    setEmpresas((prev) =>
      prev.map((e) =>
        e.id === selectedId
          ? { ...e, users_count: (e.users_count || 0) + 1 }
          : e
      )
    );
  };

  const handleRemoverMembro = async () => {
    if (!selectedId || !membroParaRemover) return;
    setRemovendoMembro(true);
    try {
      await api.delete(`/empresas/${selectedId}/members/${membroParaRemover.id}`);
      notificar(`Membro "${membroParaRemover.nome}" desvinculado com sucesso.`);
      setMembroParaRemover(null);
      await carregarMembros();

      setEmpresas((prev) =>
        prev.map((e) =>
          e.id === selectedId
            ? { ...e, users_count: Math.max(0, (e.users_count || 1) - 1) }
            : e
        )
      );
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível desvincular o membro."), "error");
    } finally {
      setRemovendoMembro(false);
    }
  };

  const handleAlterarRoleMembro = async (memberId: number, novaRoleId: number | null) => {
    if (!selectedId) return;
    try {
      const { data } = await api.patch<EmpresaMember>(
        `/empresas/${selectedId}/members/${memberId}/role`,
        { role_id: novaRoleId }
      );
      setMembros((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...data } : m)));
      notificar("Tipo de utilizador alterado com sucesso.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível alterar o tipo de utilizador."), "error");
    }
  };

  /** Cargo = função desta empresa (independente do tipo de utilizador). */
  const handleAlterarCargoMembro = async (memberId: number, novoCargoId: number | null) => {
    if (!selectedId) return;
    try {
      const { data } = await api.patch<EmpresaMember>(
        `/empresas/${selectedId}/members/${memberId}/cargo`,
        { role_id: novoCargoId }
      );
      setMembros((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...data } : m)));
      notificar("Cargo do membro alterado com sucesso.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível alterar o cargo."), "error");
    }
  };

  const handleAlterarStatusMembro = async (memberId: number, ativo: boolean) => {
    if (!selectedId) return;
    try {
      const { data } = await api.patch<EmpresaMember>(
        `/empresas/${selectedId}/members/${memberId}/status`,
        { is_active: ativo }
      );
      setMembros((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...data } : m)));
      notificar(ativo ? "Membro ativado com sucesso." : "Membro desativado.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível alterar o estado do membro."), "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-28">
      {/* AVISO FLUTUANTE */}
      {aviso && (
        <div
          className={`fixed top-6 right-6 z-[60] flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl animate-in slide-in-from-top-2 duration-200 ${
            aviso.tipo === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {aviso.tipo === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
          {aviso.msg}
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Gestão de Empresas
            </h2>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Shield size={13} /> Painel Administrador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                <Building size={13} /> Minha Organização
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isAdmin
              ? "Visualize, pesquise e faça a gestão de todas as organizações e seus membros."
              : "Gerencie as informações institucionais, membros e permissões da sua organização."}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCriandoEmpresa(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
          >
            <Plus size={16} /> Nova Empresa
          </button>
        )}
      </div>

      {/* BARRA DE FILTROS E PESQUISA DE EMPRESAS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Caixa de pesquisa com debounce */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              placeholder="Pesquisar organização por nome, NIF ou morada..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
            {buscaInput && (
              <button
                onClick={() => {
                  setBuscaInput("");
                  setBusca("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filtros de Status */}
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
            {(["todas", "ativas", "inativas"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFiltro(st);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFiltro === st
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Botão atualizar (limpa cache local e recarrega) */}
          <button
            onClick={() => {
              clearEmpresaFrontendCache();
              carregarEmpresas(true);
            }}
            title="Atualizar lista de empresas (limpar cache)"
            className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200/80 flex items-center justify-center flex-shrink-0"
          >
            <RefreshCw size={16} className={loadingLista ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>

        {/* Informação de contagem */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1 pt-1 border-t border-gray-100">
          <span>
            {totalEmpresas === 1
              ? "1 organização encontrada"
              : `${totalEmpresas} organizações encontradas`}
          </span>
          <div className="flex items-center gap-2">
            <span>Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRADE DE EMPRESAS (PAGINADA) */}
      {loadingLista ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <span className="text-sm font-medium">A carregar organizações…</span>
        </div>
      ) : erroLista ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-red-100 p-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 font-medium mb-3">{erroLista}</p>
          <button
            onClick={() => carregarEmpresas(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      ) : empresas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-800 mb-1">Nenhuma organização encontrada</h4>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
            Não foram encontradas empresas com os filtros selecionados. Tente alterar os termos de pesquisa.
          </p>
          {busca && (
            <button
              onClick={() => {
                setBuscaInput("");
                setBusca("");
                setStatusFiltro("todas");
                setPage(1);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empresas.map((emp) => {
              const isSelected = emp.id === selectedId;
              const nomeEmp = getNome(emp);
              const tamEmp = getTamanho(emp);
              const ativa = emp.is_active !== false;

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedId(emp.id)}
                  className={`group relative p-5 bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/10"
                      : "border-gray-200/80 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-600"
                          }`}
                        >
                          {nomeEmp.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-gray-900 truncate">
                            {nomeEmp}
                          </h4>
                          {emp.nif && (
                            <p className="text-xs text-gray-500 truncate font-mono">
                              NIF: {emp.nif}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ativa
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}
                      >
                        {ativa ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    {/* Endereço */}
                    {emp.endereco && (
                      <p className="text-xs text-gray-600 line-clamp-1 mb-3">
                        {emp.endereco}
                      </p>
                    )}
                  </div>

                  {/* Bottom Stats */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Users size={13} className="text-gray-400" />
                        <span className="font-semibold text-gray-700">{emp.users_count || 0}</span>
                      </span>
                      {tamEmp && (
                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                          {tamEmp}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <CheckCircle2 size={13} /> Selecionada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CONTROLO DE PAGINAÇÃO DE EMPRESAS */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-500">
                Página <span className="font-semibold text-gray-800">{page}</span> de{" "}
                <span className="font-semibold text-gray-800">{totalPages}</span> ({totalEmpresas} total)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (totalPages > 7) {
                    if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                      if (p === 2 || p === totalPages - 1) {
                        return <span key={p} className="px-1 text-xs text-gray-400">…</span>;
                      }
                      return null;
                    }
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        page === p
                          ? "bg-blue-600 text-white shadow-xs"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ÁREA DE CONFIGURAÇÃO DA EMPRESA SELECIONADA */}
      {selectedEmpresa && (
        <div className="pt-8 border-t border-gray-200/90 space-y-6 animate-in fade-in duration-200">
          {/* Header da Organização Selecionada com Nível de Permissão */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 break-words">
                  {getNome(selectedEmpresa)}
                </h3>
                {podeEditarEmpresa ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Shield size={13} className="text-emerald-600" /> Permissão: Gestão Total
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Lock size={13} className="text-amber-600" /> Permissão: Apenas Leitura
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Configure os dados institucionais, gerencie os membros ou altere a hierarquia de funções baseado nas suas permissões de acesso.
              </p>
            </div>

            {/* Sub-abas de Navegação — no telemóvel, 3 colunas iguais a toda a largura
                (em linha não cabiam: "Cargos e Acessos" saía do cartão a 360–390px). */}
            <div className="grid w-full grid-cols-3 items-center gap-1 rounded-xl bg-gray-100 p-1 lg:inline-flex lg:w-auto lg:shrink-0">
              <button
                onClick={() => setAbaAtiva("dados")}
                className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 ${
                  abaAtiva === "dados"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 size={15} className="hidden shrink-0 sm:block" />
                <span className="truncate">Identidade</span>
              </button>

              <button
                onClick={() => setAbaAtiva("membros")}
                className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 ${
                  abaAtiva === "membros"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users size={15} className="hidden shrink-0 sm:block" />
                <span className="truncate">Membros</span>
                <span className="shrink-0 px-1.5 py-0.2 sm:ml-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                  {totalMembros}
                </span>
              </button>

              <button
                onClick={() => setAbaAtiva("cargos")}
                className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 ${
                  abaAtiva === "cargos"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Briefcase size={15} className="hidden shrink-0 sm:block" />
                <span className="truncate sm:hidden">Cargos</span>
                <span className="hidden truncate sm:inline">Cargos e Acessos</span>
                <span className="shrink-0 px-1.5 py-0.2 sm:ml-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                  {cargosEmpresa.length}
                </span>
              </button>
            </div>
          </div>

          {/* SUB-ABA 1: IDENTIDADE & DADOS DA EMPRESA */}
          {abaAtiva === "dados" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Identidade Institucional</h3>
                    <p className="text-xs text-gray-500">
                      {podeEditarEmpresa
                        ? "Edite as informações cadastrais e regulatórias da organização."
                        : "Visualização restrita: o seu nível de acesso não permite modificar estes dados."}
                    </p>
                  </div>
                </div>

                {!podeEditarEmpresa && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                    <Lock size={13} /> Bloqueado para edição
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nome da Organização *"
                  value={form.company}
                  onChange={setCampo("company")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Nome oficial da empresa"
                />
                <Input
                  label="NIF / Documento de Registo"
                  value={form.nif}
                  onChange={setCampo("nif")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Ex.: 5000000000"
                />
                <Input
                  label="Dimensão da Empresa"
                  value={form.companySize}
                  onChange={setCampo("companySize")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Ex.: 11-50 colaboradores"
                />
                <Input
                  label="Endereço / Sede"
                  value={form.endereco}
                  onChange={setCampo("endereco")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Morada da sede"
                />
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setCampo("is_active")(e.target.checked)}
                      disabled={!podeEditarEmpresa}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800">
                        Organização Ativa na Plataforma
                      </span>
                      <p className="text-xs text-gray-500">
                        Quando desativada, utilizadores associados a esta organização não conseguem aceder às ferramentas corporativas.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* SUB-ABA 2: MEMBROS DA ORGANIZAÇÃO (PAGINADO E FILTRADO) */}
          {abaAtiva === "membros" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              {/* Header da Lista de Membros */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Membros da Equipa</h3>
                    <p className="text-xs text-gray-500">
                      {canManageMembers || canAddMembers || canRemoveMembers || canChangeCargo
                        ? "Gerencie os utilizadores associados a esta empresa, adicione membros e configure níveis de acesso."
                        : "Visualização de membros da organização (modo de leitura)."}
                    </p>
                  </div>
                </div>

                {canAddMembers ? (
                  <button
                    onClick={() => setAdicionandoMembro(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
                  >
                    <UserPlus size={15} /> Adicionar Membro
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex-shrink-0">
                    <Lock size={13} /> Sem permissão de gestão de membros
                  </span>
                )}
              </div>

              {/* Barra de Filtros e Busca de Membros */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-gray-50/70 p-3 rounded-xl border border-gray-200/80">
                {/* Campo de Busca */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaMembro}
                    onChange={(e) => {
                      setBuscaMembro(e.target.value);
                      setPageMembro(1);
                    }}
                    placeholder="Pesquisar por nome, apelido, email ou telefone..."
                    className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                  />
                  {buscaMembro && (
                    <button
                      onClick={() => {
                        setBuscaMembro("");
                        setPageMembro(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtro Status Membro */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                  {(["todos", "ativos", "inativos"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusMembro(st);
                        setPageMembro(1);
                      }}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                        statusMembro === st
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Filtro Role */}
                {roles.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={roleFiltroMembro}
                      onChange={(e) => {
                        setRoleFiltroMembro(
                          e.target.value === "todas" ? "todas" : Number(e.target.value)
                        );
                        setPageMembro(1);
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todas">Todos os tipos e cargos</option>
                      <optgroup label="Tipo de utilizador">
                        {tiposUtilizador.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </optgroup>
                      {cargosEmpresa.length > 0 && (
                        <optgroup label="Cargo">
                          {cargosEmpresa.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Atualizar membros */}
                <button
                  onClick={carregarMembros}
                  title="Atualizar lista de membros"
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-colors border border-gray-200 flex items-center justify-center flex-shrink-0"
                >
                  <RefreshCw size={14} className={loadingMembros ? "animate-spin text-blue-600" : ""} />
                </button>
              </div>

              {/* Lista de Membros */}
              {loadingMembros ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                  <span className="text-xs font-medium">A carregar membros da organização…</span>
                </div>
              ) : erroMembros ? (
                <div className="text-center py-8 p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-semibold mb-2">{erroMembros}</p>
                  <button
                    onClick={carregarMembros}
                    className="text-xs font-bold text-gray-700 underline hover:text-gray-900"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : membros.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl p-6">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h5 className="text-sm font-bold text-gray-800">Nenhum membro encontrado</h5>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Não existem colaboradores correspondentes aos critérios de pesquisa ou esta empresa ainda não possui membros associados.
                  </p>
                  {canAddMembers && (
                    <button
                      onClick={() => setAdicionandoMembro(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                    >
                      <UserPlus size={14} /> Adicionar Primeiro Membro
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {membros.map((membro) => {
                      const ativo = membro.is_active !== false;
                      const iniciais = (
                        (membro.nome ? membro.nome[0] : "") +
                        (membro.apelido ? membro.apelido[0] : "")
                      ).toUpperCase() || "U";

                      return (
                        <div
                          key={membro.id+membro.email}
                          className="flex min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200/90 hover:border-blue-200 hover:bg-blue-50/10 transition-all bg-white shadow-2xs"
                        >
                          {/* Dados do Membro */}
                          {/* Itens de grid têm min-width:auto — sem o min-w-0 da linha, o email
                              completo (mesmo com truncate) alargava o cartão para lá do ecrã. */}
                          <div className="flex min-w-0 flex-1 items-center gap-3.5">
                            <div className="relative flex-shrink-0">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                                {iniciais}
                              </div>
                              <span
                                title={ativo ? "Ativo" : "Inativo"}
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  ativo ? "bg-emerald-500" : "bg-gray-400"
                                }`}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm break-words">
                                  {membro.nome} {membro.apelido || ""}
                                </span>
                                {membro.is_superadmin && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Shield size={11} /> Super Admin
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    ativo
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-gray-100 text-gray-500 border border-gray-200"
                                  }`}
                                >
                                  {ativo ? "Ativo" : "Inativo"}
                                </span>
                              </div>

                              <div className="flex items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1 flex-wrap">
                                {/* min-w-0 + max-w-full: sem isto o `truncate` não atua e um
                                    email longo alargava o cartão (e a lista) para lá do ecrã. */}
                                <span className="flex min-w-0 max-w-full items-center gap-1" title={membro.email}>
                                  <Mail size={12} className="shrink-0 text-gray-400" />
                                  <span className="truncate">{membro.email}</span>
                                </span>
                                {membro.telefone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} className="text-gray-400" />
                                    <span>{membro.telefone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tipo de utilizador (função global) · Cargo (função desta empresa) · Ações */}
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end sm:gap-3">
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                              <label className="flex min-w-0 flex-col gap-1 sm:w-40">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                  Tipo de utilizador
                                </span>
                                {canManageMembers ? (
                                  <select
                                    value={membro.role_id ?? ""}
                                    onChange={(e) =>
                                      handleAlterarRoleMembro(membro.id, e.target.value ? Number(e.target.value) : null)
                                    }
                                    disabled={membro.is_superadmin && !isAdmin}
                                    className="w-full min-h-[36px] min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                                  >
                                    <option value="">Sem tipo</option>
                                    {tiposUtilizador.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="truncate px-2.5 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold capitalize">
                                    {membro.role_name || "Sem tipo"}
                                  </span>
                                )}
                              </label>

                              <label className="flex min-w-0 flex-col gap-1 sm:w-44">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Cargo</span>
                                {canChangeCargo ? (
                                  <select
                                    value={membro.empresa_role_id ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v === "__novo_cargo__") {
                                        setCargoParaMembro(membro.id);
                                        setCriandoCargo(true);
                                        return;
                                      }
                                      handleAlterarCargoMembro(membro.id, v ? Number(v) : null);
                                    }}
                                    // Sem cargos, só fica bloqueado para quem também não os pode criar.
                                    disabled={cargosEmpresa.length === 0 && !podeGerirCargos && !membro.empresa_role_id}
                                    title={
                                      cargosEmpresa.length === 0 && !podeGerirCargos
                                        ? "Esta empresa ainda não tem cargos. Peça a um administrador para os criar."
                                        : undefined
                                    }
                                    className="w-full min-h-[36px] min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                  >
                                    <option value="">{cargosEmpresa.length === 0 ? "Sem cargos criados" : "Sem cargo"}</option>
                                    {cargosEmpresa.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name}
                                      </option>
                                    ))}
                                    {podeGerirCargos && <option value="__novo_cargo__">+ Criar novo cargo…</option>}
                                  </select>
                                ) : (
                                  <span className="truncate px-2.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold capitalize">
                                    {membro.empresa_role_name || "Sem cargo"}
                                  </span>
                                )}
                              </label>
                            </div>

                            <div className="flex items-center gap-2 self-end">
                              {/* Alternar Status (Ativar / Desativar) */}
                              {canManageMembers && (
                                <button
                                  onClick={() => handleAlterarStatusMembro(membro.id, !ativo)}
                                  disabled={membro.is_superadmin && !isAdmin}
                                  title={ativo ? "Desativar colaborador" : "Ativar colaborador"}
                                  className={`shrink-0 p-2 rounded-lg border transition-colors ${
                                    ativo
                                      ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                      : "text-gray-600 bg-gray-100 border-gray-200 hover:bg-gray-200"
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {ativo ? <UserCheck size={15} /> : <UserX size={15} />}
                                </button>
                              )}

                              {/* Desvincular da empresa */}
                              {canRemoveMembers && (
                                <button
                                  onClick={() => setMembroParaRemover(membro)}
                                  disabled={String(membro.id) === String(user?.id) || (membro.is_superadmin && !isAdmin)}
                                  title="Desvincular da organização"
                                  className="shrink-0 p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CONTROLO DE PAGINAÇÃO DE MEMBROS */}
                  {totalPagesMembros > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Página <span className="font-semibold text-gray-800">{pageMembro}</span> de{" "}
                        <span className="font-semibold text-gray-800">{totalPagesMembros}</span> ({totalMembros} membros no total)
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPageMembro((p) => Math.max(1, p - 1))}
                          disabled={pageMembro <= 1}
                          className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Página anterior de membros"
                        >
                          <ChevronLeft size={15} />
                        </button>

                        {Array.from({ length: totalPagesMembros }, (_, i) => i + 1).map((p) => {
                          if (totalPagesMembros > 5) {
                            if (p !== 1 && p !== totalPagesMembros && Math.abs(p - pageMembro) > 1) {
                              if (p === 2 || p === totalPagesMembros - 1) {
                                return <span key={p} className="px-1 text-xs text-gray-400">…</span>;
                              }
                              return null;
                            }
                          }

                          return (
                            <button
                              key={p}
                              onClick={() => setPageMembro(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                pageMembro === p
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setPageMembro((p) => Math.min(totalPagesMembros, p + 1))}
                          disabled={pageMembro >= totalPagesMembros}
                          className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Próxima página de membros"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-ABA 3: CARGOS E ACESSOS (RBAC) */}
          {abaAtiva === "cargos" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Cargos e Níveis de Acesso</h3>
                    <p className="text-xs text-gray-500">
                      Aplica-se apenas a{" "}
                      <strong className="font-semibold text-gray-700">{nomeEmpresaAtual}</strong>.
                    </p>
                  </div>
                </div>

                {podeGerirCargos && (
                  <button
                    onClick={() => setCriandoCargo(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-xs"
                  >
                    <Plus size={14} /> Novo cargo nesta empresa
                  </button>
                )}
              </div>

              <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-950">
                <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="space-y-1.5">
                  <p>
                    <strong>
                      Aqui estão apenas os cargos de {nomeEmpresaAtual}.
                    </strong>{" "}
                    Os cargos e permissões que criar ou alterar valem só para esta empresa — as outras empresas e os
                    cargos globais do sistema não são afetados.
                  </p>
                </div>
              </div>

              {loadingRbac ? (
                <div className="flex flex-col items-center py-12 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-sm">A carregar cargos…</span>
                </div>
              ) : erroRbac ? (
                <div className="text-center py-10">
                  <p className="text-sm text-red-600 mb-3">{erroRbac}</p>
                  <button
                    onClick={reloadRbac}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
                  >
                    <RefreshCw size={14} /> Tentar novamente
                  </button>
                </div>
              ) : !capabilities?.can_read ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  Não tem permissão para ver os cargos desta organização.
                </p>
              ) : cargosEmpresa.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <Briefcase size={22} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">{nomeEmpresaAtual} ainda não tem cargos próprios.</p>
                  {podeGerirCargos && (
                    <button
                      onClick={() => setCriandoCargo(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:underline"
                    >
                      <Plus size={14} /> Criar o primeiro cargo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3">{cargosEmpresa.map((cargo) => renderCargo(cargo))}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL ADICIONAR MEMBRO À EMPRESA */}
      {adicionandoMembro && selectedEmpresa && (
        <AdicionarMembroModal
          empresaId={selectedEmpresa.id}
          empresaNome={getNome(selectedEmpresa)}
          tiposUtilizador={tiposUtilizador}
          cargosEmpresa={cargosEmpresa}
          membrosExistentes={membros}
          onClose={() => setAdicionandoMembro(false)}
          onAdd={handleAdicionarMembro}
          onError={(msg) => notificar(msg, "error")}
        />
      )}

      {/* MODAL CONFIRMAR REMOÇÃO DE MEMBRO */}
      {membroParaRemover && selectedEmpresa && (
        <RemoverMembroModal
          membro={membroParaRemover}
          empresaNome={getNome(selectedEmpresa)}
          loading={removendoMembro}
          onClose={() => setMembroParaRemover(null)}
          onConfirm={handleRemoverMembro}
        />
      )}

      {/* MODAL PERMISSÕES DE UM CARGO */}
      {cargoSelecionado && (
        <PermissoesModal
          role={cargoSelecionado}
          permissions={permissions}
          empresaNome={nomeEmpresaAtual}
          global={cargoSelecionado.empresa_id == null}
          editavel={
            cargoSelecionado.empresa_id != null &&
            cargoSelecionado.empresa_id === selectedId &&
            podeGerirCargos &&
            !cargoSelecionado.is_locked
          }
          onClose={() => setCargoSelecionado(null)}
          onSave={async (ids) => {
            const atualizado = await setRolePermissions(cargoSelecionado.id, ids);
            setCargoSelecionado(null);
            notificar(`Permissões de "${atualizado.name}" guardadas.`);
          }}
          onError={(msg) => notificar(msg, "error")}
        />
      )}

      {/* MODAL NOVO CARGO */}
      {criandoCargo && (
        <NovoCargoModal
          empresaNome={nomeEmpresaAtual}
          onClose={() => {
            setCriandoCargo(false);
            setCargoParaMembro(null);
          }}
          onCreate={async (nome, descricao) => {
            const novo = await createRole(nome, descricao);
            setCriandoCargo(false);
            if (cargoParaMembro != null) {
              const membroId = cargoParaMembro;
              setCargoParaMembro(null);
              await handleAlterarCargoMembro(membroId, novo.id);
            } else {
              notificar(`Cargo "${novo.name}" criado só para esta empresa.`);
            }
          }}
          onError={(msg) => notificar(msg, "error")}
        />
      )}

      {/* MODAL NOVA EMPRESA (ADMIN) */}
      {criandoEmpresa && (
        <NovaEmpresaModal
          onClose={() => setCriandoEmpresa(false)}
          onCreate={async (novaData) => {
            const { data } = await api.post<EmpresaResposta>("/empresas", novaData);
            clearEmpresaFrontendCache();
            setCriandoEmpresa(false);
            notificar(`Empresa "${getNome(data)}" criada com sucesso.`);
            await carregarEmpresas(true);
            setSelectedId(data.id);
          }}
          onError={(msg) => notificar(msg, "error")}
        />
      )}

      {/* BARRA FIXA DE AÇÕES QUANDO HÁ ALTERAÇÕES NA EMPRESA */}
      {podeEditarEmpresa && alterou && selectedId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/90 p-4 z-40 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
              <Info size={14} className="text-blue-500" /> Existem alterações não salvas nesta organização.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(original)}
                disabled={savingEmpresa}
                className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
              >
                Descartar
              </button>
              <button
                onClick={guardarEmpresa}
                disabled={savingEmpresa}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
              >
                {savingEmpresa ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =======================
   MODAL: ADICIONAR MEMBRO À ORGANIZAÇÃO
======================= */
interface CandidateUser {
  id: number;
  nome: string;
  apelido?: string | null;
  email: string;
  telefone?: string | null;
  is_active: boolean;
  empresa_id?: number | null;
  empresa_nome?: string | null;
  cargo_nome?: string | null;
  role_name?: string | null;
}

interface CandidateUserPaginadoResposta {
  items: CandidateUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function AdicionarMembroModal({
  empresaId,
  empresaNome,
  tiposUtilizador,
  cargosEmpresa,
  membrosExistentes = [],
  onClose,
  onAdd,
  onError,
}: {
  empresaId: number;
  empresaNome: string;
  /** Funções globais do sistema. */
  tiposUtilizador: RbacRole[];
  /** Funções desta empresa. */
  cargosEmpresa: RbacRole[];
  membrosExistentes?: EmpresaMember[];
  onClose: () => void;
  onAdd: (dados: {
    user_id?: number;
    nome?: string;
    apelido?: string;
    email?: string;
    telefone?: string;
    cargo?: string;
    role_id?: number;
    empresa_role_id?: number;
    senha?: string;
  }) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [tipoAdicao, setTipoAdicao] = useState<"existente" | "novo">("existente");

  // Estado para utilizador existente
  const [buscaCandidato, setBuscaCandidato] = useState("");
  const [candidatos, setCandidatos] = useState<CandidateUser[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<CandidateUser | null>(null);
  const [pageCandidato, setPageCandidato] = useState(1);
  const [pageSizeCandidato] = useState(5);
  const [totalCandidatos, setTotalCandidatos] = useState(0);
  const [totalPagesCandidatos, setTotalPagesCandidatos] = useState(1);

  // Set de IDs dos membros já vinculados para garantia e exclusão estrita
  const idsMembrosExistentes = useMemo(
    () => new Set(membrosExistentes.map((m) => m.id)),
    [membrosExistentes]
  );

  // Campos comuns
  const [roleId, setRoleId] = useState<number | undefined>(undefined);
  const [cargoId, setCargoId] = useState<number | undefined>(undefined);

  // Campos para novo utilizador
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  const [saving, setSaving] = useState(false);

  // Resetar página ao mudar a pesquisa
  const handleBuscaCandidatoChange = (valor: string) => {
    setBuscaCandidato(valor);
    setPageCandidato(1);
  };

  // Buscar utilizadores candidatos quando no modo "existente"
  useEffect(() => {
    if (tipoAdicao !== "existente") return;

    let cancelado = false;
    setLoadingCandidatos(true);

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<CandidateUserPaginadoResposta>(
          `/empresas/${empresaId}/candidate-users`,
          {
            params: {
              busca: buscaCandidato.trim() || undefined,
              page: pageCandidato,
              page_size: pageSizeCandidato,
            },
          }
        );
        if (!cancelado) {
          // Excluir estritamente quem já pertence a esta empresa
          const itensElegiveis = (data.items || []).filter(
            (c) => c.empresa_id !== empresaId && !idsMembrosExistentes.has(c.id)
          );
          setCandidatos(itensElegiveis);
          setTotalCandidatos(data.total || 0);
          setTotalPagesCandidatos(Math.max(1, data.total_pages || 1));
        }
      } catch {
        if (!cancelado) {
          setCandidatos([]);
          setTotalCandidatos(0);
          setTotalPagesCandidatos(1);
        }
      } finally {
        if (!cancelado) setLoadingCandidatos(false);
      }
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [tipoAdicao, buscaCandidato, pageCandidato, pageSizeCandidato, empresaId, idsMembrosExistentes]);

  const submeter = async () => {
    setSaving(true);
    try {
      if (tipoAdicao === "existente") {
        if (!usuarioSelecionado) {
          onError("Selecione um utilizador da lista para vincular.");
          setSaving(false);
          return;
        }

        await onAdd({
          user_id: usuarioSelecionado.id,
          role_id: roleId,
          empresa_role_id: cargoId,
        });
      } else {
        if (!nome.trim()) {
          onError("Indique o primeiro nome do membro.");
          setSaving(false);
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          onError("Indique um endereço de e-mail válido.");
          setSaving(false);
          return;
        }

        await onAdd({
          nome: nome.trim(),
          apelido: apelido.trim() || undefined,
          email: email.trim().toLowerCase(),
          telefone: telefone.trim() || undefined,
          role_id: roleId,
          empresa_role_id: cargoId,
          senha: senha.trim() || undefined,
        });
      }
    } catch (err) {
      onError(extractApiError(err, "Não foi possível adicionar o membro."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Adicionar Membro</h3>
              <p className="text-xs text-gray-500">
                Vincular colaborador a <span className="font-semibold text-blue-600">{empresaNome}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Alternador de Modo: Existente vs Novo */}
        <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 bg-gray-200/80 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setTipoAdicao("existente");
                setUsuarioSelecionado(null);
              }}
              className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-all sm:gap-2 ${
                tipoAdicao === "existente"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <UserCheck size={15} className="shrink-0" />
              <span className="truncate sm:hidden">Existente</span>
              <span className="hidden truncate sm:inline">Utilizador Existente</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoAdicao("novo")}
              className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-all sm:gap-2 ${
                tipoAdicao === "novo"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <UserPlus size={15} className="shrink-0" />
              <span className="truncate sm:hidden">Novo utilizador</span>
              <span className="hidden truncate sm:inline">Criar Novo Utilizador</span>
            </button>
          </div>
        </div>

        {/* Conteúdo do Formulário */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {tipoAdicao === "existente" ? (
            <div className="space-y-4">
              {/* Pesquisa de utilizador existente */}
              {!usuarioSelecionado ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={buscaCandidato}
                      onChange={(e) => handleBuscaCandidatoChange(e.target.value)}
                      placeholder="Pesquisar por nome ou e-mail na plataforma..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {/* Lista de Candidatos */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 min-h-[160px] bg-white">
                    {loadingCandidatos ? (
                      <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mb-1" />
                        <span className="text-xs">A buscar utilizadores…</span>
                      </div>
                    ) : candidatos.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-500 p-4">
                        Nenhum utilizador elegível encontrado. Tente pesquisar por outro nome ou utilize a aba "Criar Novo Utilizador".
                      </div>
                    ) : (
                      candidatos.map((cand) => {
                        const iniciais = (
                          (cand.nome ? cand.nome[0] : "") +
                          (cand.apelido ? cand.apelido[0] : "")
                        ).toUpperCase() || "U";

                        return (
                          <div
                            key={cand.id}
                            onClick={() => setUsuarioSelecionado(cand)}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-blue-50/50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {iniciais}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {cand.nome} {cand.apelido || ""}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">{cand.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {cand.empresa_nome ? (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                  {cand.empresa_nome}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-md border border-emerald-100">
                                  Sem empresa
                                </span>
                              )}
                              <span className="text-xs font-bold text-blue-600 group-hover:underline">Selecionar</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Controlo de Paginação dos Candidatos */}
                  {totalCandidatos > 0 && (
                    <div className="flex items-center justify-between pt-1 px-1 text-xs text-gray-500">
                      <span className="text-[11px]">
                        Página <strong className="text-gray-800">{pageCandidato}</strong> de{" "}
                        <strong className="text-gray-800">{totalPagesCandidatos}</strong> ({totalCandidatos} elegíveis)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPageCandidato((p) => Math.max(1, p - 1))}
                          disabled={pageCandidato <= 1 || loadingCandidatos}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={13} />
                          <span>Anterior</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageCandidato((p) => Math.min(totalPagesCandidatos, p + 1))}
                          disabled={pageCandidato >= totalPagesCandidatos || loadingCandidatos}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <span>Seguinte</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Card do Utilizador Selecionado */
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {(
                        (usuarioSelecionado.nome ? usuarioSelecionado.nome[0] : "") +
                        (usuarioSelecionado.apelido ? usuarioSelecionado.apelido[0] : "")
                      ).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-gray-900">
                        {usuarioSelecionado.nome} {usuarioSelecionado.apelido || ""}
                      </p>
                      <p className="text-[11px] text-gray-600 truncate">{usuarioSelecionado.email}</p>
                      {usuarioSelecionado.empresa_nome && (
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          Atualmente vinculado a: {usuarioSelecionado.empresa_nome}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUsuarioSelecionado(null)}
                    className="text-xs font-semibold text-blue-700 hover:underline px-2 py-1"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* Atribuição de Cargo e Função na Empresa */}
              {usuarioSelecionado && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                      Tipo de utilizador
                    </label>
                    <select
                      value={roleId ?? ""}
                      onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="">Sem tipo</option>
                      {tiposUtilizador.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.is_locked ? "(Super Admin)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                      Cargo nesta empresa
                    </label>
                    <select
                      value={cargoId ?? ""}
                      onChange={(e) => setCargoId(e.target.value ? Number(e.target.value) : undefined)}
                      disabled={cargosEmpresa.length === 0}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">{cargosEmpresa.length === 0 ? "Ainda não há cargos" : "Sem cargo"}</option>
                      {cargosEmpresa.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {cargosEmpresa.length === 0 && (
                      <p className="ml-1 text-[11px] text-gray-400">
                        Esta empresa ainda não tem cargos — crie-os na aba “Cargos e Acessos”.
                      </p>
                    )}
                  </div>
                </div>
                </div>
              )}
            </div>
          ) : (
            /* Modo 2: Criar Novo Utilizador */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Nome *"
                  value={nome}
                  onChange={setNome}
                  placeholder="Ex.: Carlos"
                />
                <Input
                  label="Apelido"
                  value={apelido}
                  onChange={setApelido}
                  placeholder="Ex.: Silva"
                />
              </div>

              <Input
                label="Endereço de E-mail *"
                value={email}
                onChange={setEmail}
                placeholder="carlos.silva@empresa.com"
              />

              <Input
                label="Telefone"
                value={telefone}
                onChange={setTelefone}
                placeholder="+244 9..."
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                    Tipo de utilizador
                  </label>
                  <select
                    value={roleId ?? ""}
                    onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="">Sem tipo</option>
                    {tiposUtilizador.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.is_locked ? "(Super Admin)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                    Cargo nesta empresa
                  </label>
                  <select
                    value={cargoId ?? ""}
                    onChange={(e) => setCargoId(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={cargosEmpresa.length === 0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{cargosEmpresa.length === 0 ? "Ainda não há cargos" : "Sem cargo"}</option>
                    {cargosEmpresa.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {cargosEmpresa.length === 0 && (
                    <p className="ml-1 text-[11px] text-gray-400">
                      Esta empresa ainda não tem cargos — crie-os na aba “Cargos e Acessos”.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Senha Temporária de Acesso (Opcional)"
                  value={senha}
                  onChange={setSenha}
                  placeholder="Padrão: Musta@123456"
                />
                <p className="text-[11px] text-gray-400 ml-1">
                  Se deixado em branco, a senha padrão será <strong>Musta@123456</strong> e poderá ser alterada no primeiro acesso.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submeter}
            disabled={saving || (tipoAdicao === "existente" && !usuarioSelecionado)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {tipoAdicao === "existente" ? "Vincular Utilizador" : "Criar e Vincular"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   MODAL: CONFIRMAR REMOÇÃO DE MEMBRO
======================= */
function RemoverMembroModal({
  membro,
  empresaNome,
  loading,
  onClose,
  onConfirm,
}: {
  membro: EmpresaMember;
  empresaNome: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Desvincular Membro</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tem certeza de que deseja desvincular <strong className="text-gray-800">{membro.nome} {membro.apelido || ""}</strong> ({membro.email}) da organização <strong className="text-gray-800">{empresaNome}</strong>?
          </p>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-left">
            <p className="text-[11px] text-amber-800 flex items-start gap-1.5">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              O utilizador não será excluído da base de dados, mas perderá o acesso aos recursos e dados desta empresa.
            </p>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50/50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-60"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Confirmar Desvinculação
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   MODAL: NOVA EMPRESA (ADMIN)
======================= */
function NovaEmpresaModal({
  onClose,
  onCreate,
  onError,
}: {
  onClose: () => void;
  onCreate: (data: { company: string; companySize?: string; nif?: string; endereco?: string }) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [nif, setNif] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);

  const submeter = async () => {
    if (!company.trim()) {
      onError("Indique o nome da organização.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        company: company.trim(),
        companySize: companySize.trim() || undefined,
        nif: nif.trim() || undefined,
        endereco: endereco.trim() || undefined,
      });
    } catch (err) {
      onError(extractApiError(err, "Não foi possível criar a organização."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nova Organização</h3>
              <p className="text-xs text-gray-500">Cadastre uma nova empresa na plataforma</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Input
            label="Nome da Organização *"
            value={company}
            onChange={setCompany}
            placeholder="Ex.: Acme Corp"
          />
          <Input
            label="NIF / Documento"
            value={nif}
            onChange={setNif}
            placeholder="Ex.: 5000000000"
          />
          <Input
            label="Dimensão"
            value={companySize}
            onChange={setCompanySize}
            placeholder="Ex.: 11-50 colaboradores"
          />
          <Input
            label="Morada / Sede"
            value={endereco}
            onChange={setEndereco}
            placeholder="Endereço da sede da organização"
          />
        </div>

        <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" onClick={onClose}>
            Cancelar
          </button>
          <button
            onClick={submeter}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Criar Organização
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   MODAL: PERMISSÕES DE UM CARGO
======================= */
function PermissoesModal({
  role,
  permissions,
  empresaNome,
  global,
  editavel,
  onClose,
  onSave,
  onError,
}: {
  role: RbacRole;
  permissions: RbacPermission[];
  empresaNome: string;
  /** Cargo do sistema, partilhado por todas as empresas. */
  global: boolean;
  editavel: boolean;
  onClose: () => void;
  onSave: (ids: number[]) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<Set<number>>(
    () => new Set(role.permissions.map((p) => p.id))
  );
  const [saving, setSaving] = useState(false);

  // Num cargo da empresa só aparecem (e só se podem dar) acessos da empresa;
  // os da plataforma vêm do tipo de utilizador. O backend recusa os outros.
  const visiveis = useMemo(
    () => (global ? permissions : permissions.filter((p) => p.company_scope)),
    [permissions, global]
  );

  const grupos = useMemo(() => {
    const m = new Map<string, RbacPermission[]>();
    for (const p of visiveis) {
      const cat = p.category || "Outras";
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(p);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visiveis]);

  const toggle = (id: number) => {
    if (!editavel) return;
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(draft));
    } catch (err) {
      onError(extractApiError(err, "Não foi possível guardar as permissões."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editavel ? "Definir Acessos" : "Permissões do Cargo"}
            </h3>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-purple-600 capitalize">{role.name}</span>
              {!editavel && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                  <Lock size={12} /> só leitura
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div
          className={`mx-6 mt-4 flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${
            global ? "border-amber-200 bg-amber-50 text-amber-900" : "border-purple-100 bg-purple-50 text-purple-900"
          }`}
        >
          {global ? <Lock size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            {global ? (
              <>
                <strong>Cargo global do sistema</strong>, partilhado por todas as empresas — não pode ser alterado a
                partir de {empresaNome}.
              </>
            ) : (
              <>
                As alterações aplicam-se <strong>apenas a {empresaNome}</strong>. Um cargo só pode dar as ações da
                empresa: editar a empresa, adicionar membros, remover membros e mudar o cargo dos membros. Os
                restantes acessos vêm do tipo de utilizador.
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {grupos.map(([grupo, items]) => (
            <div key={grupo}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-gray-100" /> {grupo}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((perm) => {
                  const isActive = draft.has(perm.id);
                  return (
                    <button
                      key={perm.id}
                      onClick={() => toggle(perm.id)}
                      disabled={!editavel}
                      title={perm.name}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isActive
                          ? "border-purple-200 bg-purple-50 text-purple-700 shadow-xs"
                          : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200"
                      } ${!editavel ? "cursor-default opacity-90" : ""}`}
                    >
                      <span className="text-sm font-medium truncate">
                        {perm.description || perm.name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                          isActive ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300"
                        }`}
                      >
                        {isActive && <Check size={12} strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" onClick={onClose}>
            {editavel ? "Cancelar" : "Fechar"}
          </button>
          {editavel && (
            <button
              onClick={guardar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-100 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Confirmar Acessos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   MODAL: NOVO CARGO
======================= */
function NovoCargoModal({
  empresaNome,
  onClose,
  onCreate,
  onError,
}: {
  empresaNome: string;
  onClose: () => void;
  onCreate: (nome: string, descricao?: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const submeter = async () => {
    if (!nome.trim()) {
      onError("Indique o nome do cargo.");
      return;
    }
    setSaving(true);
    try {
      await onCreate(nome.trim(), descricao.trim() || undefined);
    } catch (err) {
      onError(extractApiError(err, "Não foi possível criar o cargo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            Novo cargo
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Input label="Nome do cargo" value={nome} onChange={setNome} placeholder="Ex.: Analista" />
          <Input
            label="Descrição (opcional)"
            value={descricao}
            onChange={setDescricao}
            placeholder="O que este cargo faz"
          />
          <p className="flex gap-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2.5 text-sm text-purple-900">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              Será criado <strong>apenas em {empresaNome}</strong>. Começa sem permissões: depois, abra
              “Permissões” para as atribuir. O nome não pode ser igual ao de um cargo do sistema (admin, manager,
              developer, user).
            </span>
          </p>
        </div>
        <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" onClick={onClose}>
            Cancelar
          </button>
          <button
            onClick={submeter}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   SUB-COMPONENTES
======================= */
function Input({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={disabled || !onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
          disabled || !onChange
            ? "border-gray-200 bg-gray-50 text-gray-700 cursor-default"
            : "border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
    </div>
  );
}

function Tag({
  texto,
  cor,
}: {
  texto: string;
  cor: "blue" | "amber" | "purple" | "gray";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${styles[cor]}`}>
      {texto}
    </span>
  );
}
