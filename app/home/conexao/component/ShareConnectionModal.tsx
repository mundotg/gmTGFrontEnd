"use client";

import { useCallback, useMemo, useState } from "react";
import {
  X,
  Users,
  Loader2,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  UserPlus,
  Plus,
  Key,
  Check,
  Building2,
  Building,
  Table,
  Columns,
  Sliders,
  Filter,
  Ban,
  CheckCircle2,
  FileSpreadsheet,
  Edit3,
} from "lucide-react";

import api from "@/context/axioCuston";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";
import {
  ACCESS_LEVEL_HELP,
  ACCESS_LEVEL_LABELS,
  AdvancedRulesInput,
  ConnectionAccessLevel,
  ConnectionRole,
  ConnectionShare,
  useConnectionShares,
} from "@/hook/useConnectionShares";
import { extractApiError } from "@/hook/useRbac";

const NIVEIS: ConnectionAccessLevel[] = ["read", "write", "manage"];

const QUERY_TYPES = [
  { id: "SELECT", label: "SELECT", desc: "Consultas e leitura de dados" },
  { id: "INSERT", label: "INSERT", desc: "Inserir novos registos" },
  { id: "UPDATE", label: "UPDATE", desc: "Atualizar registos existentes" },
  { id: "DELETE", label: "DELETE", desc: "Eliminar registos" },
  { id: "DDL", label: "DDL", desc: "Estrutura (CREATE, ALTER, DROP, TRUNCATE)" },
  { id: "EXPORT", label: "EXPORT", desc: "Exportação de dados e relatórios" },
];

interface Props {
  connectionId: number;
  connectionName: string;
  onClose: () => void;
}

interface TableStructure {
  id?: number;
  table_name: string;
}

export const ShareConnectionModal = ({
  connectionId,
  connectionName,
  onClose,
}: Props) => {
  const [activeTab, setActiveTab] = useState<"shares" | "empresas" | "roles">("shares");

  const {
    access,
    roles,
    empresas,
    availablePermissions,
    candidatos,
    shareableEmpresas,
    loading,
    loadingTab,
    error,
    share,
    updateShare,
    revoke,
    addEmpresa,
    updateEmpresa,
    removeEmpresa,
    createConnectionRole,
    updateConnectionRole,
    deleteConnectionRole,
  } = useConnectionShares(connectionId, activeTab);

  /* --- Notificações --- */
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [sucessoAcao, setSucessoAcao] = useState<string | null>(null);

  /* --- Partilha de Membro --- */
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<ConnectionAccessLevel>("read");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [aGuardar, setAGuardar] = useState(false);
  const [emCurso, setEmCurso] = useState<number | null>(null);

  /* --- Partilha de Empresa --- */
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [empresaLevel, setEmpresaLevel] = useState<ConnectionAccessLevel>("read");
  const [empresaRoleId, setEmpresaRoleId] = useState<string>("");
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);
  const [empresaEmCurso, setEmpresaEmCurso] = useState<number | null>(null);

  /* --- Introspeção de Tabelas da Conexão --- */
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  /* --- Modal de Configuração Avançada de Regras (Roles ou Membro Específico) --- */
  const [modalRegrasAberto, setModalRegrasAberto] = useState(false);
  const [tipoConfigAlvo, setTipoConfigAlvo] = useState<"role_nova" | "role_edicao" | "share_custom">("role_nova");
  const [alvoRole, setAlvoRole] = useState<ConnectionRole | null>(null);
  const [alvoShare, setAlvoShare] = useState<ConnectionShare | null>(null);

  // Estados do formulário de regras
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formPermissoes, setFormPermissoes] = useState<number[]>([]);
  const [formQueryTypes, setFormQueryTypes] = useState<string[]>([]);
  const [formAllowedTables, setFormAllowedTables] = useState<string[]>([]);
  const [formBlockedTables, setFormBlockedTables] = useState<string[]>([]);
  const [formBlockedColumns, setFormBlockedColumns] = useState<Record<string, string[]>>({});
  const [formMaxRows, setFormMaxRows] = useState<string>("");
  const [salvandoRegras, setSalvandoRegras] = useState(false);

  // Inputs temporários no modal de regras
  const [inputTableAllowed, setInputTableAllowed] = useState("");
  const [inputTableBlocked, setInputTableBlocked] = useState("");
  const [selectedTableForColumn, setSelectedTableForColumn] = useState("");
  const [inputColumnBlocked, setInputColumnBlocked] = useState("");

  const podeGerir = !!access?.can_share;

  const candidatosOrdenados = useMemo(
    () => [...candidatos].sort((a, b) => a.nome.localeCompare(b.nome)),
    [candidatos]
  );

  const empresasDisponiveis = useMemo(() => {
    const associadasIds = new Set(empresas.map((e) => e.empresa_id));
    return shareableEmpresas.filter((e) => !associadasIds.has(e.id));
  }, [shareableEmpresas, empresas]);

  const notificar = (msg: string, tipo: "ok" | "err" = "ok") => {
    if (tipo === "ok") {
      setSucessoAcao(msg);
      setErroAcao(null);
      setTimeout(() => setSucessoAcao(null), 3500);
    } else {
      setErroAcao(msg);
      setSucessoAcao(null);
      setTimeout(() => setErroAcao(null), 5000);
    }
  };

  // Carrega lista de tabelas para auxílio visual no modal de regras
  const carregarTabelas = useCallback(async () => {
    if (availableTables.length > 0 || loadingTables) return;
    setLoadingTables(true);
    try {
      const res = await api.get<{ success?: boolean; data?: TableStructure[] }>(
        `/consu/all/structures/${connectionId}`
      );
      const raw = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const nomes = (raw as TableStructure[])
        .map((t) => t.table_name)
        .filter((n) => typeof n === "string" && n.trim().length > 0);
      setAvailableTables(Array.from(new Set(nomes)).sort());
    } catch {
      // Ignora erro se introspeção não estiver disponível para esta conexão
    } finally {
      setLoadingTables(false);
    }
  }, [connectionId, availableTables.length, loadingTables]);

  /* --- Introspeção de Colunas da Tabela Selecionada (/consu/field/{conn_id}/{table_name}) --- */
  interface DBFieldItem {
    name: string;
    type?: string;
  }

  const [columnsCache, setColumnsCache] = useState<Record<string, string[]>>({});
  const [loadingColumns, setLoadingColumns] = useState(false);

  const carregarColunasDaTabela = useCallback(
    async (tableName: string) => {
      const tbl = tableName.trim().toLowerCase();
      if (!tbl || !connectionId) return;
      if (columnsCache[tbl]) return; // Já em cache local

      setLoadingColumns(true);
      try {
        const res = await api.get<{ success?: boolean; data?: DBFieldItem[] }>(
          `/consu/field/${connectionId}/${encodeURIComponent(tbl)}`
        );
        const raw = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        const colNames = (raw as DBFieldItem[])
          .map((f) => f.name)
          .filter((n) => typeof n === "string" && n.trim().length > 0);
        setColumnsCache((prev) => ({
          ...prev,
          [tbl]: Array.from(new Set(colNames)).sort(),
        }));
      } catch {
        // Ignora erro se introspeção de campos falhar
      } finally {
        setLoadingColumns(false);
      }
    },
    [connectionId, columnsCache]
  );

  const selecionarTabelaParaColuna = (tbl: string) => {
    const t = tbl.trim().toLowerCase();
    setSelectedTableForColumn(t);
    if (t) {
      carregarColunasDaTabela(t);
    }
  };

  /* ========================================================
     AÇÕES DE PARTILHA COM MEMBROS
  ======================================================== */
  const handleShare = async () => {
    if (!selectedUser || aGuardar) return;

    setAGuardar(true);
    setErroAcao(null);
    try {
      const roleIdNum = selectedRoleId ? Number(selectedRoleId) : null;
      await share(Number(selectedUser), selectedLevel, roleIdNum);
      setSelectedUser("");
      setSelectedLevel("read");
      setSelectedRoleId("");
      notificar("Acesso concedido com sucesso!");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível conceder o acesso."), "err");
    } finally {
      setAGuardar(false);
    }
  };

  const handleUpdateShare = async (
    userId: number,
    nivel: ConnectionAccessLevel,
    roleId?: number | null
  ) => {
    setEmCurso(userId);
    setErroAcao(null);
    try {
      await updateShare(userId, nivel, roleId);
      notificar("Acesso atualizado!");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível alterar a partilha."), "err");
    } finally {
      setEmCurso(null);
    }
  };

  const handleRevoke = async (userId: number, nome?: string | null) => {
    if (!window.confirm(`Retirar o acesso de ${nome || "este utilizador"}?`)) {
      return;
    }

    setEmCurso(userId);
    setErroAcao(null);
    try {
      await revoke(userId);
      notificar("Acesso revogado com sucesso.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível retirar o acesso."), "err");
    } finally {
      setEmCurso(null);
    }
  };

  /* ========================================================
     AÇÕES DE ACESSO POR EMPRESA
  ======================================================== */
  const handleAddEmpresa = async () => {
    if (!selectedEmpresaId || guardandoEmpresa) return;

    setGuardandoEmpresa(true);
    setErroAcao(null);
    try {
      const roleIdNum = empresaRoleId ? Number(empresaRoleId) : null;
      await addEmpresa(Number(selectedEmpresaId), empresaLevel, roleIdNum);
      setSelectedEmpresaId("");
      setEmpresaLevel("read");
      setEmpresaRoleId("");
      notificar("Empresa associada à conexão com sucesso!");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível associar a empresa."), "err");
    } finally {
      setGuardandoEmpresa(false);
    }
  };

  const handleUpdateEmpresa = async (
    empresaId: number,
    nivel: ConnectionAccessLevel,
    roleId?: number | null
  ) => {
    setEmpresaEmCurso(empresaId);
    setErroAcao(null);
    try {
      await updateEmpresa(empresaId, nivel, roleId);
      notificar("Acesso da empresa atualizado!");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível atualizar o acesso da empresa."), "err");
    } finally {
      setEmpresaEmCurso(null);
    }
  };

  const handleRemoveEmpresa = async (empresaId: number, nome?: string | null) => {
    if (!window.confirm(`Revogar o acesso da empresa "${nome || "esta empresa"}" a esta conexão?`)) {
      return;
    }

    setEmpresaEmCurso(empresaId);
    setErroAcao(null);
    try {
      await removeEmpresa(empresaId);
      notificar("Acesso da empresa removido com sucesso.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível remover a empresa."), "err");
    } finally {
      setEmpresaEmCurso(null);
    }
  };

  /* ========================================================
     CONFIGURAÇÃO DE REGRAS AVANÇADAS (ROLES & SHARES)
  ======================================================== */
  const abrirNovaRole = () => {
    setTipoConfigAlvo("role_nova");
    setAlvoRole(null);
    setAlvoShare(null);
    setFormNome("");
    setFormDescricao("");
    setFormPermissoes([]);
    setFormQueryTypes([]);
    setFormAllowedTables([]);
    setFormBlockedTables([]);
    setFormBlockedColumns({});
    setFormMaxRows("");
    setSelectedTableForColumn("");
    setInputColumnBlocked("");
    carregarTabelas();
    setModalRegrasAberto(true);
  };

  const abrirEditarRole = (role: ConnectionRole) => {
    setTipoConfigAlvo("role_edicao");
    setAlvoRole(role);
    setAlvoShare(null);
    setFormNome(role.name);
    setFormDescricao(role.description || "");
    setFormPermissoes(role.permissions.map((p) => p.id));
    setFormQueryTypes(role.allowed_query_types || []);
    setFormAllowedTables(role.allowed_tables || []);
    setFormBlockedTables(role.blocked_tables || []);
    setFormBlockedColumns(role.blocked_columns || {});
    setFormMaxRows(role.max_rows ? String(role.max_rows) : "");
    const firstTable = Object.keys(role.blocked_columns || {})[0] || "";
    setSelectedTableForColumn(firstTable);
    if (firstTable) {
      carregarColunasDaTabela(firstTable);
    }
    setInputColumnBlocked("");
    carregarTabelas();
    setModalRegrasAberto(true);
  };

  const abrirCustomizarShare = (s: ConnectionShare) => {
    setTipoConfigAlvo("share_custom");
    setAlvoRole(null);
    setAlvoShare(s);
    setFormNome(`Regras específicas para ${s.user_nome || "Membro"}`);
    setFormDescricao("Sobrepõem as regras da função para este utilizador.");
    setFormPermissoes([]);
    setFormQueryTypes(s.allowed_query_types || []);
    setFormAllowedTables(s.allowed_tables || []);
    setFormBlockedTables(s.blocked_tables || []);
    setFormBlockedColumns(s.blocked_columns || {});
    setFormMaxRows(s.max_rows ? String(s.max_rows) : "");
    const firstTable = Object.keys(s.blocked_columns || {})[0] || "";
    setSelectedTableForColumn(firstTable);
    if (firstTable) {
      carregarColunasDaTabela(firstTable);
    }
    setInputColumnBlocked("");
    carregarTabelas();
    setModalRegrasAberto(true);
  };

  const handleSalvarRegras = async () => {
    setSalvandoRegras(true);
    setErroAcao(null);

    const rulesPayload: AdvancedRulesInput = {
      allowed_query_types: formQueryTypes.length > 0 ? formQueryTypes : undefined,
      allowed_tables: formAllowedTables.length > 0 ? formAllowedTables : undefined,
      blocked_tables: formBlockedTables.length > 0 ? formBlockedTables : undefined,
      allowed_columns: undefined,
      blocked_columns: Object.keys(formBlockedColumns).length > 0 ? formBlockedColumns : undefined,
      max_rows: formMaxRows ? parseInt(formMaxRows, 10) : null,
    };

    try {
      if (tipoConfigAlvo === "role_nova") {
        if (!formNome.trim()) {
          notificar("Por favor, preencha o nome da função.", "err");
          setSalvandoRegras(false);
          return;
        }
        await createConnectionRole(formNome.trim(), formDescricao.trim() || undefined, formPermissoes, rulesPayload);
        notificar(`Função "${formNome}" criada com sucesso!`);
      } else if (tipoConfigAlvo === "role_edicao" && alvoRole) {
        await updateConnectionRole(
          alvoRole.id,
          formNome.trim() || undefined,
          formDescricao.trim() || undefined,
          formPermissoes,
          rulesPayload
        );
        notificar(`Função "${formNome}" atualizada com sucesso!`);
      } else if (tipoConfigAlvo === "share_custom" && alvoShare) {
        await updateShare(alvoShare.user_id, alvoShare.access_level, alvoShare.role_id, rulesPayload);
        notificar("Regras personalizadas do utilizador atualizadas com sucesso!");
      }

      setModalRegrasAberto(false);
    } catch (err) {
      notificar(extractApiError(err, "Erro ao gravar as regras."), "err");
    } finally {
      setSalvandoRegras(false);
    }
  };

  const handleExcluirRole = async (role: ConnectionRole) => {
    if (!window.confirm(`Tem a certeza que deseja remover a função "${role.name}"?`)) {
      return;
    }
    try {
      await deleteConnectionRole(role.id);
      notificar(`Função "${role.name}" removida com sucesso.`);
    } catch (err) {
      notificar(extractApiError(err, "Erro ao remover função."), "err");
    }
  };

  /* ========================================================
     HELPERS VISUAIS PARA TABELAS E COLUNAS
  ======================================================== */
  const toggleQueryType = (typeId: string) => {
    setFormQueryTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const addAllowedTable = (tbl: string) => {
    const t = tbl.trim().toLowerCase();
    if (!t) return;
    if (!formAllowedTables.includes(t)) {
      setFormAllowedTables((prev) => [...prev, t]);
    }
    // Remove do blocked se tiver
    setFormBlockedTables((prev) => prev.filter((x) => x !== t));
    setInputTableAllowed("");
  };

  const removeAllowedTable = (tbl: string) => {
    setFormAllowedTables((prev) => prev.filter((t) => t !== tbl));
  };

  const addBlockedTable = (tbl: string) => {
    const t = tbl.trim().toLowerCase();
    if (!t) return;
    if (!formBlockedTables.includes(t)) {
      setFormBlockedTables((prev) => [...prev, t]);
    }
    // Remove do allowed se tiver
    setFormAllowedTables((prev) => prev.filter((x) => x !== t));
    setInputTableBlocked("");
  };

  const removeBlockedTable = (tbl: string) => {
    setFormBlockedTables((prev) => prev.filter((t) => t !== tbl));
  };

  const addBlockedColumnDirect = (table: string, col: string) => {
    const tbl = table.trim().toLowerCase();
    const c = col.trim().toLowerCase();
    if (!tbl || !c) return;

    setFormBlockedColumns((prev) => {
      const existing = prev[tbl] || [];
      if (existing.includes(c)) return prev;
      return { ...prev, [tbl]: [...existing, c] };
    });
  };

  const addBlockedColumn = () => {
    const tbl = selectedTableForColumn.trim().toLowerCase();
    const col = inputColumnBlocked.trim().toLowerCase();
    if (!tbl || !col) return;
    addBlockedColumnDirect(tbl, col);
    setInputColumnBlocked("");
  };

  const removeBlockedColumn = (tbl: string, col: string) => {
    setFormBlockedColumns((prev) => {
      const existing = prev[tbl] || [];
      const updated = existing.filter((c) => c !== col);
      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[tbl];
        return copy;
      }
      return { ...prev, [tbl]: updated };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/50">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck size={22} className="text-indigo-600" />
              Acesso a Conexões & Regras de Segurança
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Conexão: <span className="font-semibold text-slate-700">{connectionName}</span>
              {access?.owner_nome && (
                <>
                  {" · "}
                  <span className="text-slate-400">Dono: {access.owner_nome}</span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-5 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("shares")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "shares"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {loadingTab && activeTab === "shares" ? (
              <Loader2 size={15} className="animate-spin text-indigo-600" />
            ) : (
              <Users size={15} />
            )}
            <span>Membros (Utilizadores)</span>
            <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              {access?.shares?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("empresas")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "empresas"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {loadingTab && activeTab === "empresas" ? (
              <Loader2 size={15} className="animate-spin text-indigo-600" />
            ) : (
              <Building2 size={15} />
            )}
            <span>Acesso por Empresa</span>
            <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              {empresas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "roles"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {loadingTab && activeTab === "roles" ? (
              <Loader2 size={15} className="animate-spin text-indigo-600" />
            ) : (
              <Sliders size={15} />
            )}
            <span>Funções e Regras Avançadas</span>
            <span className="ml-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">
              {roles.length}
            </span>
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-sm">A carregar detalhes de acesso e segurança…</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {sucessoAcao && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
              <Check size={15} className="text-emerald-600" />
              <span>{sucessoAcao}</span>
            </div>
          )}

          {erroAcao && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <p>{erroAcao}</p>
            </div>
          )}

          {!loading && !error && access && !podeGerir && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                Tem nível de acesso{" "}
                <strong>
                  {access.access_level ? ACCESS_LEVEL_LABELS[access.access_level] : "leitura"}
                </strong>{" "}
                nesta conexão. Apenas o proprietário ou gestores autorizados podem configurar regras e conceder acessos.
              </p>
            </div>
          )}

          {/* ========================================================
              TAB 1: MEMBROS E PARTILHAS INDIVIDUAIS
          ======================================================== */}
          {!loading && activeTab === "shares" && (
            <div className="space-y-5">
              {podeGerir && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <UserPlus size={15} className="text-indigo-600" />
                    Conceder Acesso a Membro
                  </h3>

                  {candidatosOrdenados.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Todos os colegas disponíveis da organização já possuem acesso a esta conexão.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Utilizador
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-left font-normal"
                            options={candidatosOrdenados.map((u) => ({
                              value: String(u.id),
                              label: `${u.nome} ${u.apelido ?? ""} · ${u.email}`,
                            }))}
                            value={selectedUser}
                            onChange={(val) => setSelectedUser(val)}
                            placeholder="Buscar membro por nome ou email…"
                            searchable={true}
                            autoWidth={false}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nível de Permissão
                          </label>
                          <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value as ConnectionAccessLevel)}
                          >
                            {NIVEIS.map((n) => (
                              <option key={n} value={n}>
                                {ACCESS_LEVEL_LABELS[n]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Função de Conexão (Opcional)
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-left font-normal"
                            options={[
                              { value: "", label: "Nenhuma (Herda permissões base)" },
                              ...roles.map((r) => ({ value: String(r.id), label: r.name })),
                            ]}
                            value={selectedRoleId}
                            onChange={(val) => setSelectedRoleId(val)}
                            placeholder="Nenhuma (Herda permissões base)"
                            searchable={roles.length > 4}
                            autoWidth={false}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          {ACCESS_LEVEL_HELP[selectedLevel]}
                        </span>
                        <button
                          onClick={handleShare}
                          disabled={!selectedUser || aGuardar}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {aGuardar && <Loader2 size={13} className="animate-spin" />}
                          Adicionar Acesso
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE MEMBROS COM ACESSO */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Membros com Acesso Atribuído ({access?.shares?.length || 0})
                </h4>

                {(!access?.shares || access.shares.length === 0) && (
                  <p className="text-xs text-slate-400 py-3 italic">
                    Nenhum membro tem partilha individual nesta conexão.
                  </p>
                )}

                <div className="grid gap-2">
                  {access?.shares?.map((s) => {
                    const ocupado = emCurso === s.user_id;
                    const temRegrasCustom =
                      (s.allowed_query_types && s.allowed_query_types.length > 0) ||
                      (s.allowed_tables && s.allowed_tables.length > 0) ||
                      (s.blocked_tables && s.blocked_tables.length > 0) ||
                      (s.blocked_columns && Object.keys(s.blocked_columns).length > 0) ||
                      s.max_rows;

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">
                              {s.user_nome || `Utilizador #${s.user_id}`}
                            </span>
                            <span className="text-[11px] text-slate-400">{s.user_email}</span>
                            {temRegrasCustom && (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                                <Filter size={10} /> Regras Avançadas
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>Nível: <strong>{ACCESS_LEVEL_LABELS[s.access_level]}</strong></span>
                            {s.role_name && (
                              <>
                                <span>·</span>
                                <span className="text-purple-600 font-medium">Função: {s.role_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {podeGerir ? (
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Seletor de Nível */}
                            <select
                              value={s.access_level}
                              disabled={ocupado}
                              onChange={(e) =>
                                handleUpdateShare(
                                  s.user_id,
                                  e.target.value as ConnectionAccessLevel,
                                  s.role_id
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              {NIVEIS.map((n) => (
                                <option key={n} value={n}>
                                  {ACCESS_LEVEL_LABELS[n]}
                                </option>
                              ))}
                            </select>

                            {/* Seletor de Role */}
                            <select
                              value={s.role_id || ""}
                              disabled={ocupado}
                              onChange={(e) =>
                                handleUpdateShare(
                                  s.user_id,
                                  s.access_level,
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none max-w-[130px]"
                            >
                              <option value="">Sem função</option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>

                            {/* Botão de Regras Personalizadas */}
                            <button
                              onClick={() => abrirCustomizarShare(s)}
                              title="Configurar regras de tabelas, campos e queries para este membro"
                              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <Sliders size={13} />
                              <span className="hidden sm:inline">Regras</span>
                            </button>

                            {/* Botão de Revogar */}
                            <button
                              onClick={() => handleRevoke(s.user_id, s.user_nome)}
                              disabled={ocupado}
                              title="Revogar acesso"
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              {ocupado ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {ACCESS_LEVEL_LABELS[s.access_level]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: ACESSO POR EMPRESA
          ======================================================== */}
          {!loading && activeTab === "empresas" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-100 p-4 rounded-xl text-blue-900 text-xs">
                <Building2 size={18} className="mt-0.5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold">Acesso Corporativo / Multi-Empresa</p>
                  <p className="text-blue-700 mt-0.5">
                    Permite conceder acesso à conexão para todos os membros que pertençam a uma empresa específica.
                    Se um membro tiver um acesso individual direto (aba Membros), esse acesso terá prioridade sobre o da empresa.
                  </p>
                </div>
              </div>

              {podeGerir && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Building size={15} className="text-blue-600" />
                    Associar Nova Empresa
                  </h3>

                  {empresasDisponiveis.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Todas as empresas registadas já possuem associação com esta conexão.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Empresa
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-left font-normal"
                            options={empresasDisponiveis.map((emp) => ({
                              value: String(emp.id),
                              label: `${emp.nome}${emp.nif ? ` · NIF: ${emp.nif}` : ""}`,
                            }))}
                            value={selectedEmpresaId}
                            onChange={(val) => setSelectedEmpresaId(val)}
                            placeholder="Buscar empresa por nome ou NIF…"
                            searchable={true}
                            autoWidth={false}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nível Padrão
                          </label>
                          <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            value={empresaLevel}
                            onChange={(e) => setEmpresaLevel(e.target.value as ConnectionAccessLevel)}
                          >
                            {NIVEIS.map((n) => (
                              <option key={n} value={n}>
                                {ACCESS_LEVEL_LABELS[n]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Função Padrão (Opcional)
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-left font-normal"
                            options={[
                              { value: "", label: "Nenhuma (Herda permissões base)" },
                              ...roles.map((r) => ({ value: String(r.id), label: r.name })),
                            ]}
                            value={empresaRoleId}
                            onChange={(val) => setEmpresaRoleId(val)}
                            placeholder="Nenhuma (Herda permissões base)"
                            searchable={roles.length > 4}
                            autoWidth={false}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={handleAddEmpresa}
                          disabled={!selectedEmpresaId || guardandoEmpresa}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                          {guardandoEmpresa && <Loader2 size={13} className="animate-spin" />}
                          Associar Empresa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE EMPRESAS COM ACESSO */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Empresas com Acesso Concedido ({empresas.length})
                </h4>

                {empresas.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 italic">
                    Nenhuma empresa associada diretamente a esta conexão.
                  </p>
                )}

                <div className="grid gap-2">
                  {empresas.map((emp) => {
                    const ocupado = empresaEmCurso === emp.empresa_id;

                    return (
                      <div
                        key={emp.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-600" />
                            <span className="font-bold text-slate-800 text-xs">
                              {emp.empresa_nome || `Empresa #${emp.empresa_id}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>Nível: <strong>{ACCESS_LEVEL_LABELS[emp.access_level]}</strong></span>
                            {emp.role_name && (
                              <>
                                <span>·</span>
                                <span className="text-purple-600 font-medium">Função: {emp.role_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {podeGerir ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={emp.access_level}
                              disabled={ocupado}
                              onChange={(e) =>
                                handleUpdateEmpresa(
                                  emp.empresa_id,
                                  e.target.value as ConnectionAccessLevel,
                                  emp.role_id
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {NIVEIS.map((n) => (
                                <option key={n} value={n}>
                                  {ACCESS_LEVEL_LABELS[n]}
                                </option>
                              ))}
                            </select>

                            <select
                              value={emp.role_id || ""}
                              disabled={ocupado}
                              onChange={(e) =>
                                handleUpdateEmpresa(
                                  emp.empresa_id,
                                  emp.access_level,
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none max-w-[140px]"
                            >
                              <option value="">Sem função</option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleRemoveEmpresa(emp.empresa_id, emp.empresa_nome)}
                              disabled={ocupado}
                              title="Remover acesso da empresa"
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              {ocupado ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {ACCESS_LEVEL_LABELS[emp.access_level]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: FUNÇÕES E REGRAS AVANÇADAS (ROLES RBAC)
          ======================================================== */}
          {!loading && activeTab === "roles" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 border border-purple-100 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders size={16} className="text-purple-600" />
                    Funções e Regras de Segurança da Conexão
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure restrições precisas por tabela, coluna, tipos de consulta autorizados (SELECT, INSERT, etc.) e limites de registros.
                  </p>
                </div>

                {podeGerir && (
                  <button
                    onClick={abrirNovaRole}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0"
                  >
                    <Plus size={14} /> Nova Função & Regras
                  </button>
                )}
              </div>

              {/* LISTA DE FUNÇÕES */}
              <div className="grid gap-3">
                {roles.map((role) => {
                  const hasAllowedTables = role.allowed_tables && role.allowed_tables.length > 0;
                  const hasBlockedTables = role.blocked_tables && role.blocked_tables.length > 0;
                  const hasBlockedCols = role.blocked_columns && Object.keys(role.blocked_columns).length > 0;
                  const hasQueryTypes = role.allowed_query_types && role.allowed_query_types.length > 0;

                  return (
                    <div
                      key={role.id}
                      className="p-4 rounded-xl border border-slate-100 bg-white shadow-2xs hover:border-purple-200 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{role.name}</span>
                            {role.is_default ? (
                              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                Padrão
                              </span>
                            ) : (
                              <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                Personalizada
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {role.permissions.length} permissões base
                            </span>
                            {role.max_rows && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                Max {role.max_rows} linhas
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                          )}
                        </div>

                        {podeGerir && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => abrirEditarRole(role)}
                              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-slate-700 transition-colors"
                            >
                              <Edit3 size={13} className="text-purple-600" /> Editar Regras
                            </button>

                            {!role.is_default && (
                              <button
                                onClick={() => handleExcluirRole(role)}
                                title="Remover função"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BADGES DE REGRAS AVANÇADAS CONFIGURADAS */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-50 text-[10px]">
                        {hasQueryTypes ? (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                            <span>Queries:</span>
                            <span>{role.allowed_query_types?.join(", ")}</span>
                          </div>
                        ) : (
                          <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            Todas as operações permitidas
                          </div>
                        )}

                        {hasAllowedTables && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                            <Table size={11} />
                            <span>Tabelas autorizadas: {role.allowed_tables?.join(", ")}</span>
                          </div>
                        )}

                        {hasBlockedTables && (
                          <div className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-semibold">
                            <Ban size={11} />
                            <span>Tabelas bloqueadas: {role.blocked_tables?.join(", ")}</span>
                          </div>
                        )}

                        {hasBlockedCols && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                            <Columns size={11} />
                            <span>Campos restritos: {Object.keys(role.blocked_columns || {}).length} tabela(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <span className="text-xs text-slate-400">
            {activeTab === "shares"
              ? "Acessos individuais por membro"
              : activeTab === "empresas"
              ? "Acessos corporativos associados"
              : "Regras de granularidade e RBAC"}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* ========================================================
          MODAL: EDITOR DE REGRAS AVANÇADAS & PERMISSÕES
      ======================================================== */}
      {modalRegrasAberto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-purple-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {tipoConfigAlvo === "role_nova"
                    ? "Nova Função & Regras Avançadas"
                    : tipoConfigAlvo === "role_edicao"
                    ? `Editar Regras: ${alvoRole?.name}`
                    : `Regras de Acesso: ${alvoShare?.user_nome || "Membro"}`}
                </h4>
              </div>
              <button
                onClick={() => setModalRegrasAberto(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              {/* Identificação da Role (se for role) */}
              {tipoConfigAlvo !== "share_custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Nome da Função *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Auditor Financeiro, Operador BI"
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Apenas consultas e relatórios contábeis"
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* 1. TIPOS DE CONSULTA PERMITIDOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Tipos de Consulta Autorizados
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Se nenhum for selecionado, segue o nível padrão (leitura/escrita).
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUERY_TYPES.map((qt) => {
                    const ativo = formQueryTypes.includes(qt.id);
                    return (
                      <button
                        key={qt.id}
                        type="button"
                        onClick={() => toggleQueryType(qt.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          ativo
                            ? "bg-purple-50/70 border-purple-300 text-purple-900 shadow-2xs"
                            : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{qt.label}</span>
                          {ativo && <Check size={13} className="text-purple-600 font-bold" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{qt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. REGRAS DE TABELAS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Table size={14} className="text-indigo-600" />
                    Controlo de Tabelas da Conexão
                  </span>
                  {loadingTables && (
                    <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin text-indigo-600" />
                      A buscar tabelas da conexão...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tabelas Permitidas (Whitelist) */}
                  <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Tabelas Permitidas (Whitelist)</span>
                      <span className="text-[10px] text-slate-400">Apenas estas</span>
                    </div>

                    {/* Seleção rápida com JoinSelect das tabelas carregadas de /consu/all/structures/{id} */}
                    {availableTables.length > 0 && (
                      <JoinSelect
                        className="w-full"
                        buttonClassName="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-left font-normal"
                        options={availableTables
                          .filter((t) => !formAllowedTables.includes(t.toLowerCase()))
                          .map((t) => ({ value: t, label: t }))}
                        value=""
                        onChange={(val) => {
                          if (val) addAllowedTable(val);
                        }}
                        placeholder={`+ Buscar e selecionar tabela (${availableTables.length} disponíveis)...`}
                        searchable={true}
                        autoWidth={false}
                      />
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ou digite o nome da tabela…"
                        value={inputTableAllowed}
                        onChange={(e) => setInputTableAllowed(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAllowedTable(inputTableAllowed);
                          }
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => addAllowedTable(inputTableAllowed)}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>

                    {availableTables.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-400">Sugeridas:</span>
                        {availableTables
                          .filter((t) => !formAllowedTables.includes(t.toLowerCase()))
                          .slice(0, 6)
                          .map((tbl) => (
                            <button
                              key={tbl}
                              type="button"
                              onClick={() => addAllowedTable(tbl)}
                              className="bg-white border border-slate-200 px-1.5 py-0.5 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              +{tbl}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 pt-1 min-h-[32px]">
                      {formAllowedTables.map((tbl) => (
                        <span
                          key={tbl}
                          className="inline-flex items-center gap-1 rounded bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-800"
                        >
                          {tbl}
                          <button
                            type="button"
                            onClick={() => removeAllowedTable(tbl)}
                            className="text-indigo-400 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tabelas Bloqueadas (Blacklist) */}
                  <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Tabelas Bloqueadas (Blacklist)</span>
                      <span className="text-[10px] text-slate-400">Nunca acessíveis</span>
                    </div>

                    {/* Seleção rápida com JoinSelect das tabelas carregadas de /consu/all/structures/{id} */}
                    {availableTables.length > 0 && (
                      <JoinSelect
                        className="w-full"
                        buttonClassName="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-left font-normal"
                        options={availableTables
                          .filter((t) => !formBlockedTables.includes(t.toLowerCase()))
                          .map((t) => ({ value: t, label: t }))}
                        value=""
                        onChange={(val) => {
                          if (val) addBlockedTable(val);
                        }}
                        placeholder={`+ Buscar e selecionar tabela (${availableTables.length} disponíveis)...`}
                        searchable={true}
                        autoWidth={false}
                      />
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ou digite o nome da tabela…"
                        value={inputTableBlocked}
                        onChange={(e) => setInputTableBlocked(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addBlockedTable(inputTableBlocked);
                          }
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => addBlockedTable(inputTableBlocked)}
                        className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        Add
                      </button>
                    </div>

                    {availableTables.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-400">Sugeridas:</span>
                        {availableTables
                          .filter((t) => !formBlockedTables.includes(t.toLowerCase()))
                          .slice(0, 6)
                          .map((tbl) => (
                            <button
                              key={tbl}
                              type="button"
                              onClick={() => addBlockedTable(tbl)}
                              className="bg-white border border-slate-200 px-1.5 py-0.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              +{tbl}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 pt-1 min-h-[32px]">
                      {formBlockedTables.map((tbl) => (
                        <span
                          key={tbl}
                          className="inline-flex items-center gap-1 rounded bg-red-100/70 border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-800"
                        >
                          {tbl}
                          <button
                            type="button"
                            onClick={() => removeBlockedTable(tbl)}
                            className="text-red-400 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. REGRAS DE COLUNAS / CAMPOS BLOQUEADOS (utiliza /consu/field/{conn_id}/{table_name}) */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Columns size={14} className="text-amber-600" />
                    Campos e Colunas Restritos (por tabela)
                  </span>
                  {loadingColumns && (
                    <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                      <Loader2 size={12} className="animate-spin" />
                      A buscar colunas da tabela...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Bloqueie campos sensíveis (ex: senhas, hashes, dados salariais, CPF) para que nunca sejam exibidos em consultas.
                </p>

                <div className="space-y-2.5 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Seletor de Tabela */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        1. Tabela Alvo
                      </label>
                      {availableTables.length > 0 ? (
                        <JoinSelect
                          className="w-full"
                          buttonClassName="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-left font-medium"
                          options={availableTables.map((t) => ({ value: t, label: t }))}
                          value={selectedTableForColumn}
                          onChange={(val) => selecionarTabelaParaColuna(val)}
                          placeholder="-- Buscar e selecionar tabela --"
                          searchable={true}
                          autoWidth={false}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Nome da tabela (ex: usuarios)"
                          value={selectedTableForColumn}
                          onChange={(e) => selecionarTabelaParaColuna(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      )}
                    </div>

                    {/* Seletor de Colunas (obtidas de /consu/field/{conn_id}/{table_name}) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        2. Coluna a Bloquear
                      </label>
                      {selectedTableForColumn && columnsCache[selectedTableForColumn.toLowerCase()]?.length ? (
                        <JoinSelect
                          className="w-full"
                          buttonClassName="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-left font-normal"
                          options={columnsCache[selectedTableForColumn.toLowerCase()]
                            .filter(
                              (c) =>
                                !(formBlockedColumns[selectedTableForColumn.toLowerCase()] || []).includes(
                                  c.toLowerCase()
                                )
                            )
                            .map((c) => ({ value: c, label: c }))}
                          value=""
                          onChange={(val) => {
                            if (val) addBlockedColumnDirect(selectedTableForColumn, val);
                          }}
                          placeholder={`+ Buscar coluna (${columnsCache[selectedTableForColumn.toLowerCase()].length} encontradas)...`}
                          searchable={true}
                          autoWidth={false}
                        />
                      ) : (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder={
                              selectedTableForColumn
                                ? loadingColumns
                                  ? "A carregar colunas da base..."
                                  : "Campo (ex: senha)"
                                : "Primeiro selecione a tabela"
                            }
                            disabled={!selectedTableForColumn || loadingColumns}
                            value={inputColumnBlocked}
                            onChange={(e) => setInputColumnBlocked(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addBlockedColumn();
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            disabled={!selectedTableForColumn || !inputColumnBlocked.trim()}
                            onClick={addBlockedColumn}
                            className="px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                          >
                            Bloquear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sugestões rápidas de colunas carregadas de /consu/field/... */}
                  {selectedTableForColumn && columnsCache[selectedTableForColumn.toLowerCase()]?.length ? (
                    <div className="pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-400 font-medium">
                          Colunas de <span className="font-semibold text-slate-700">{selectedTableForColumn}</span>:
                        </span>
                        {columnsCache[selectedTableForColumn.toLowerCase()]
                          .filter(
                            (c) =>
                              !(formBlockedColumns[selectedTableForColumn.toLowerCase()] || []).includes(
                                c.toLowerCase()
                              )
                          )
                          .slice(0, 10)
                          .map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => addBlockedColumnDirect(selectedTableForColumn, col)}
                              className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 font-mono transition-colors"
                            >
                              +{col}
                            </button>
                          ))}
                      </div>

                      {/* Fallback de inserção manual */}
                      <div className="flex gap-1.5 pt-2">
                        <input
                          type="text"
                          placeholder="Ou digite o nome de outro campo…"
                          value={inputColumnBlocked}
                          onChange={(e) => setInputColumnBlocked(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addBlockedColumn();
                            }
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          disabled={!inputColumnBlocked.trim()}
                          onClick={addBlockedColumn}
                          className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-semibold hover:bg-amber-700 disabled:opacity-50"
                        >
                          Bloquear
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Exibição dos campos bloqueados por tabela */}
                <div className="space-y-1.5 pt-1">
                  {Object.entries(formBlockedColumns).map(([tbl, cols]) => (
                    <div
                      key={tbl}
                      className="flex items-center gap-2 p-2 bg-amber-50/40 border border-amber-200/60 rounded-lg text-xs"
                    >
                      <span className="font-bold text-amber-900">{tbl}:</span>
                      <div className="flex flex-wrap gap-1">
                        {cols.map((col) => (
                          <span
                            key={col}
                            className="inline-flex items-center gap-1 rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900"
                          >
                            {col}
                            <button
                              type="button"
                              onClick={() => removeBlockedColumn(tbl, col)}
                              className="text-amber-500 hover:text-amber-900 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. LIMITE MÁXIMO DE LINHAS */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-indigo-600" />
                    Limite Máximo de Linhas por Consulta
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Impede extrações massivas ao limitar o número de linhas que as queries deste perfil podem retornar.
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 500 ou 1000 (vazio = sem limite extra)"
                    value={formMaxRows}
                    onChange={(e) => setFormMaxRows(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 5. PERMISSÕES DE SISTEMA (se for role) */}
              {tipoConfigAlvo !== "share_custom" && availablePermissions.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Key size={14} className="text-purple-600" />
                    Permissões de Sistema Associadas
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                    {availablePermissions.map((p) => {
                      const marcado = formPermissoes.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-slate-700 hover:bg-slate-100 p-1 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormPermissoes((prev) => [...prev, p.id]);
                              } else {
                                setFormPermissoes((prev) => prev.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-mono text-[11px] font-semibold text-slate-900">
                            {p.name}
                          </span>
                          {p.description && (
                            <span className="text-[10px] text-slate-400 truncate">
                              · {p.description}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setModalRegrasAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarRegras}
                disabled={salvandoRegras}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {salvandoRegras && <Loader2 size={13} className="animate-spin" />}
                Gravar Regras de Segurança
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareConnectionModal;
