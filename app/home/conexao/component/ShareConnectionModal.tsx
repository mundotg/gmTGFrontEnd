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
import { useI18n } from "@/context/I18nContext";
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

// Estilos padronizados para alta visibilidade, contraste e responsividade em qualquer tema e resolução
const baseSelectClass =
  "w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:border-indigo-400";

const rowSelectClass =
  "min-w-[110px] rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:border-indigo-400";

const rowRoleSelectClass =
  "min-w-[120px] max-w-[160px] rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:border-indigo-400";

const joinSelectButtonClass =
  "w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400 focus:border-indigo-600 rounded-xl text-slate-900 dark:text-slate-100 text-left font-semibold shadow-xs transition-colors";

const joinSelectCompactClass =
  "w-full text-xs py-1.5 px-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400 focus:border-indigo-600 rounded-lg text-slate-900 dark:text-slate-100 text-left font-semibold shadow-xs transition-colors";

const optionClass =
  "bg-white text-slate-900 font-medium py-1 dark:bg-slate-800 dark:text-slate-100";

interface Props {
  connectionId: number;
  connectionName: string;
  onClose: () => void;
}

interface TableStructure {
  id?: number;
  table_name: string;
}

interface DBFieldItem {
  name: string;
  type?: string;
}

export const ShareConnectionModal = ({
  connectionId,
  connectionName,
  onClose,
}: Props) => {
  const { t } = useI18n();
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

  /* --- Helpers de Tradução dos Níveis --- */
  const getAccessLevelLabel = useCallback(
    (lvl: ConnectionAccessLevel) =>
      t(`shareConnection.accessLevel.${lvl}`) || ACCESS_LEVEL_LABELS[lvl] || lvl,
    [t]
  );

  const getAccessLevelHelp = useCallback(
    (lvl: ConnectionAccessLevel) => {
      const cap = lvl.charAt(0).toUpperCase() + lvl.slice(1);
      return t(`shareConnection.accessLevel.help${cap}`) || ACCESS_LEVEL_HELP[lvl] || "";
    },
    [t]
  );

  const queryTypesList = useMemo(
    () => [
      { id: "SELECT", label: "SELECT", desc: t("shareConnection.queryTypes.SELECT") },
      { id: "INSERT", label: "INSERT", desc: t("shareConnection.queryTypes.INSERT") },
      { id: "UPDATE", label: "UPDATE", desc: t("shareConnection.queryTypes.UPDATE") },
      { id: "DELETE", label: "DELETE", desc: t("shareConnection.queryTypes.DELETE") },
      { id: "DDL", label: "DDL", desc: t("shareConnection.queryTypes.DDL") },
      { id: "EXPORT", label: "EXPORT", desc: t("shareConnection.queryTypes.EXPORT") },
    ],
    [t]
  );

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
    const tNome = tbl.trim().toLowerCase();
    setSelectedTableForColumn(tNome);
    if (tNome) {
      carregarColunasDaTabela(tNome);
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
      notificar(t("shareConnection.notifications.grantedSuccess"));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.grantError")), "err");
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
      notificar(t("shareConnection.notifications.updatedSuccess"));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.updateError")), "err");
    } finally {
      setEmCurso(null);
    }
  };

  const handleRevoke = async (userId: number, nome?: string | null) => {
    const nomeExibicao = nome || t("shareConnection.members.userFallback", { id: userId });
    if (!window.confirm(t("shareConnection.members.confirmRevoke", { name: nomeExibicao }))) {
      return;
    }

    setEmCurso(userId);
    setErroAcao(null);
    try {
      await revoke(userId);
      notificar(t("shareConnection.notifications.revokedSuccess"));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.revokeError")), "err");
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
      notificar(t("shareConnection.notifications.companyAddedSuccess"));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.companyAddError")), "err");
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
      notificar(t("shareConnection.notifications.companyUpdatedSuccess"));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.companyUpdateError")), "err");
    } finally {
      setEmpresaEmCurso(null);
    }
  };

  const handleRemoveEmpresa = async (empresaId: number, nome?: string | null) => {
    const nomeExibicao = nome || t("shareConnection.companies.companyFallback", { id: empresaId });
    if (!window.confirm(t("shareConnection.companies.confirmRevoke", { name: nomeExibicao }))) {
      return;
    }

    setEmpresaEmCurso(empresaId);
    setErroAcao(null);
    try {
      await removeEmpresa(empresaId);
      notificar(t("shareConnection.notifications.companyRemovedSuccess"));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.companyRemoveError")), "err");
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
    setFormNome(
      t("shareConnection.rulesModal.customRulesTitle", {
        name: s.user_nome || t("shareConnection.members.userFallback", { id: s.user_id }),
      })
    );
    setFormDescricao(t("shareConnection.rulesModal.customRulesDesc"));
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
          notificar(t("shareConnection.notifications.fillRoleName"), "err");
          setSalvandoRegras(false);
          return;
        }
        await createConnectionRole(formNome.trim(), formDescricao.trim() || undefined, formPermissoes, rulesPayload);
        notificar(t("shareConnection.notifications.roleCreatedSuccess", { name: formNome }));
      } else if (tipoConfigAlvo === "role_edicao" && alvoRole) {
        await updateConnectionRole(
          alvoRole.id,
          formNome.trim() || undefined,
          formDescricao.trim() || undefined,
          formPermissoes,
          rulesPayload
        );
        notificar(t("shareConnection.notifications.roleUpdatedSuccess", { name: formNome }));
      } else if (tipoConfigAlvo === "share_custom" && alvoShare) {
        await updateShare(alvoShare.user_id, alvoShare.access_level, alvoShare.role_id, rulesPayload);
        notificar(t("shareConnection.notifications.customRulesUpdatedSuccess"));
      }

      setModalRegrasAberto(false);
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.saveRulesError")), "err");
    } finally {
      setSalvandoRegras(false);
    }
  };

  const handleExcluirRole = async (role: ConnectionRole) => {
    if (!window.confirm(t("shareConnection.roles.confirmDelete", { name: role.name }))) {
      return;
    }
    try {
      await deleteConnectionRole(role.id);
      notificar(t("shareConnection.notifications.roleDeletedSuccess", { name: role.name }));
    } catch (err) {
      notificar(extractApiError(err, t("shareConnection.notifications.deleteRoleError")), "err");
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
    const tNome = tbl.trim().toLowerCase();
    if (!tNome) return;
    if (!formAllowedTables.includes(tNome)) {
      setFormAllowedTables((prev) => [...prev, tNome]);
    }
    setFormBlockedTables((prev) => prev.filter((x) => x !== tNome));
    setInputTableAllowed("");
  };

  const removeAllowedTable = (tbl: string) => {
    setFormAllowedTables((prev) => prev.filter((t) => t !== tbl));
  };

  const addBlockedTable = (tbl: string) => {
    const tNome = tbl.trim().toLowerCase();
    if (!tNome) return;
    if (!formBlockedTables.includes(tNome)) {
      setFormBlockedTables((prev) => [...prev, tNome]);
    }
    setFormAllowedTables((prev) => prev.filter((x) => x !== tNome));
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
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck size={22} className="text-indigo-600 dark:text-indigo-400" />
              {t("shareConnection.title")}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {t("shareConnection.connection")}: <span className="font-semibold text-slate-700 dark:text-slate-200">{connectionName}</span>
              {access?.owner_nome && (
                <>
                  {" · "}
                  <span className="text-slate-400">{t("shareConnection.owner")}: {access.owner_nome}</span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label={t("shareConnection.close")}
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-5 pt-3 overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("shares")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "shares"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {loadingTab && activeTab === "shares" ? (
              <Loader2 size={15} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Users size={15} />
            )}
            <span>{t("shareConnection.tabs.shares")}</span>
            <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              {access?.shares?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("empresas")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "empresas"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {loadingTab && activeTab === "empresas" ? (
              <Loader2 size={15} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Building2 size={15} />
            )}
            <span>{t("shareConnection.tabs.companies")}</span>
            <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              {empresas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "roles"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {loadingTab && activeTab === "roles" ? (
              <Loader2 size={15} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Sliders size={15} />
            )}
            <span>{t("shareConnection.tabs.roles")}</span>
            <span className="ml-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
              {roles.length}
            </span>
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm">{t("shareConnection.loading")}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {sucessoAcao && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300">
              <Check size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{sucessoAcao}</span>
            </div>
          )}

          {erroAcao && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <p>{erroAcao}</p>
            </div>
          )}

          {!loading && !error && access && !podeGerir && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300">
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                {t("shareConnection.noAccessNotice", {
                  level: access.access_level
                    ? getAccessLevelLabel(access.access_level)
                    : getAccessLevelLabel("read"),
                })}
              </p>
            </div>
          )}

          {/* ========================================================
              TAB 1: MEMBROS E PARTILHAS INDIVIDUAIS
          ======================================================== */}
          {!loading && activeTab === "shares" && (
            <div className="space-y-5">
              {podeGerir && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 dark:bg-slate-800/40 dark:border-slate-700">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <UserPlus size={15} className="text-indigo-600 dark:text-indigo-400" />
                    {t("shareConnection.members.grantTitle")}
                  </h3>

                  {candidatosOrdenados.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("shareConnection.members.allHaveAccess")}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                            {t("shareConnection.members.userLabel")}
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName={joinSelectButtonClass}
                            options={candidatosOrdenados.map((u) => ({
                              value: String(u.id),
                              label: `${u.nome} ${u.apelido ?? ""} · ${u.email}`,
                            }))}
                            value={selectedUser}
                            onChange={(val) => setSelectedUser(val)}
                            placeholder={t("shareConnection.members.userPlaceholder")}
                            searchable={true}
                            autoWidth={false}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                            {t("shareConnection.members.levelLabel")}
                          </label>
                          <select
                            className={baseSelectClass}
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value as ConnectionAccessLevel)}
                          >
                            {NIVEIS.map((n) => (
                              <option key={n} value={n} className={optionClass}>
                                {getAccessLevelLabel(n)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                            {t("shareConnection.members.roleLabel")}
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName={joinSelectButtonClass}
                            options={[
                              { value: "", label: t("shareConnection.members.noRole") },
                              ...roles.map((r) => ({ value: String(r.id), label: r.name })),
                            ]}
                            value={selectedRoleId}
                            onChange={(val) => setSelectedRoleId(val)}
                            placeholder={t("shareConnection.members.noRole")}
                            searchable={roles.length > 4}
                            autoWidth={false}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <span className="text-[11px] text-slate-500 font-medium dark:text-slate-400">
                          {getAccessLevelHelp(selectedLevel)}
                        </span>
                        <button
                          onClick={handleShare}
                          disabled={!selectedUser || aGuardar}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-xs"
                        >
                          {aGuardar && <Loader2 size={13} className="animate-spin" />}
                          {t("shareConnection.members.btnAdd")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE MEMBROS COM ACESSO */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("shareConnection.members.listTitle", { count: access?.shares?.length || 0 })}
                </h4>

                {(!access?.shares || access.shares.length === 0) && (
                  <p className="text-xs text-slate-400 py-3 italic dark:text-slate-500">
                    {t("shareConnection.members.emptyList")}
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs dark:bg-slate-800/80 dark:border-slate-700 dark:hover:border-slate-600"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs dark:text-slate-100">
                              {s.user_nome || t("shareConnection.members.userFallback", { id: s.user_id })}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400">{s.user_email}</span>
                            {temRegrasCustom && (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                                <Filter size={10} /> {t("shareConnection.members.advancedRulesBadge")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <span>
                              {t("shareConnection.members.levelPrefix")}{" "}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {getAccessLevelLabel(s.access_level)}
                              </strong>
                            </span>
                            {s.role_name && (
                              <>
                                <span>·</span>
                                <span className="text-purple-600 font-semibold dark:text-purple-400">
                                  {t("shareConnection.members.rolePrefix")} {s.role_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {podeGerir ? (
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
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
                              className={rowSelectClass}
                            >
                              {NIVEIS.map((n) => (
                                <option key={n} value={n} className={optionClass}>
                                  {getAccessLevelLabel(n)}
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
                              className={rowRoleSelectClass}
                            >
                              <option value="" className={optionClass}>
                                {t("shareConnection.members.noRoleOption")}
                              </option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id} className={optionClass}>
                                  {r.name}
                                </option>
                              ))}
                            </select>

                            {/* Botão de Regras Personalizadas */}
                            <button
                              onClick={() => abrirCustomizarShare(s)}
                              title={t("shareConnection.members.rulesTitle")}
                              className="flex items-center gap-1 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-2xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Sliders size={13} />
                              <span className="hidden sm:inline">{t("shareConnection.members.rulesBtn")}</span>
                            </button>

                            {/* Botão de Revogar */}
                            <button
                              onClick={() => handleRevoke(s.user_id, s.user_nome)}
                              disabled={ocupado}
                              title={t("shareConnection.members.revokeTitle")}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                            >
                              {ocupado ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg dark:bg-slate-800 dark:text-slate-200">
                            {getAccessLevelLabel(s.access_level)}
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
              <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-200 p-4 rounded-xl text-blue-900 text-xs dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-200">
                <Building2 size={18} className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold">{t("shareConnection.companies.bannerTitle")}</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                    {t("shareConnection.companies.bannerDesc")}
                  </p>
                </div>
              </div>

              {podeGerir && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 dark:bg-slate-800/40 dark:border-slate-700">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Building size={15} className="text-blue-600 dark:text-blue-400" />
                    {t("shareConnection.companies.grantTitle")}
                  </h3>

                  {empresasDisponiveis.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("shareConnection.companies.allHaveAccess")}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                            {t("shareConnection.companies.companyLabel")}
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName={joinSelectButtonClass}
                            options={empresasDisponiveis.map((emp) => ({
                              value: String(emp.id),
                              label: `${emp.nome}${emp.nif ? ` · NIF: ${emp.nif}` : ""}`,
                            }))}
                            value={selectedEmpresaId}
                            onChange={(val) => setSelectedEmpresaId(val)}
                            placeholder={t("shareConnection.companies.companyPlaceholder")}
                            searchable={true}
                            autoWidth={false}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                            {t("shareConnection.companies.defaultLevelLabel")}
                          </label>
                          <select
                            className={baseSelectClass}
                            value={empresaLevel}
                            onChange={(e) => setEmpresaLevel(e.target.value as ConnectionAccessLevel)}
                          >
                            {NIVEIS.map((n) => (
                              <option key={n} value={n} className={optionClass}>
                                {getAccessLevelLabel(n)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                            {t("shareConnection.companies.defaultRoleLabel")}
                          </label>
                          <JoinSelect
                            className="w-full"
                            buttonClassName={joinSelectButtonClass}
                            options={[
                              { value: "", label: t("shareConnection.members.noRole") },
                              ...roles.map((r) => ({ value: String(r.id), label: r.name })),
                            ]}
                            value={empresaRoleId}
                            onChange={(val) => setEmpresaRoleId(val)}
                            placeholder={t("shareConnection.members.noRole")}
                            searchable={roles.length > 4}
                            autoWidth={false}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={handleAddEmpresa}
                          disabled={!selectedEmpresaId || guardandoEmpresa}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-xs"
                        >
                          {guardandoEmpresa && <Loader2 size={13} className="animate-spin" />}
                          {t("shareConnection.companies.btnAdd")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE EMPRESAS COM ACESSO */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("shareConnection.companies.listTitle", { count: empresas.length })}
                </h4>

                {empresas.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 italic dark:text-slate-500">
                    {t("shareConnection.companies.emptyList")}
                  </p>
                )}

                <div className="grid gap-2">
                  {empresas.map((emp) => {
                    const ocupado = empresaEmCurso === emp.empresa_id;

                    return (
                      <div
                        key={emp.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs dark:bg-slate-800/80 dark:border-slate-700 dark:hover:border-slate-600"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                            <span className="font-bold text-slate-900 text-xs dark:text-slate-100">
                              {emp.empresa_nome || t("shareConnection.companies.companyFallback", { id: emp.empresa_id })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <span>
                              {t("shareConnection.members.levelPrefix")}{" "}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {getAccessLevelLabel(emp.access_level)}
                              </strong>
                            </span>
                            {emp.role_name && (
                              <>
                                <span>·</span>
                                <span className="text-purple-600 font-semibold dark:text-purple-400">
                                  {t("shareConnection.members.rolePrefix")} {emp.role_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {podeGerir ? (
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
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
                              className={rowSelectClass}
                            >
                              {NIVEIS.map((n) => (
                                <option key={n} value={n} className={optionClass}>
                                  {getAccessLevelLabel(n)}
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
                              className={rowRoleSelectClass}
                            >
                              <option value="" className={optionClass}>
                                {t("shareConnection.members.noRoleOption")}
                              </option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id} className={optionClass}>
                                  {r.name}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleRemoveEmpresa(emp.empresa_id, emp.empresa_nome)}
                              disabled={ocupado}
                              title={t("shareConnection.companies.revokeTitle")}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                            >
                              {ocupado ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg dark:bg-slate-800 dark:text-slate-200">
                            {getAccessLevelLabel(emp.access_level)}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 border border-purple-200 p-4 rounded-xl dark:bg-purple-950/30 dark:border-purple-900/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders size={16} className="text-purple-600 dark:text-purple-400" />
                    {t("shareConnection.roles.headerTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("shareConnection.roles.headerDesc")}
                  </p>
                </div>

                {podeGerir && (
                  <button
                    onClick={abrirNovaRole}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0 dark:bg-purple-500 dark:hover:bg-purple-600"
                  >
                    <Plus size={14} /> {t("shareConnection.roles.btnNew")}
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
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-purple-300 transition-colors space-y-3 dark:bg-slate-800/80 dark:border-slate-700 dark:hover:border-purple-500"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm dark:text-slate-100">{role.name}</span>
                            {role.is_default ? (
                              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300">
                                {t("shareConnection.roles.defaultBadge")}
                              </span>
                            ) : (
                              <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300">
                                {t("shareConnection.roles.customBadge")}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 dark:text-slate-400">
                              {t("shareConnection.roles.permissionsCount", { count: role.permissions.length })}
                            </span>
                            {role.max_rows && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                                {t("shareConnection.roles.maxRowsBadge", { count: role.max_rows })}
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{role.description}</p>
                          )}
                        </div>

                        {podeGerir && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => abrirEditarRole(role)}
                              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 text-slate-700 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Edit3 size={13} className="text-purple-600 dark:text-purple-400" /> {t("shareConnection.roles.editRules")}
                            </button>

                            {!role.is_default && (
                              <button
                                onClick={() => handleExcluirRole(role)}
                                title={t("shareConnection.roles.deleteRoleTitle")}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-950/40 dark:hover:text-red-400"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BADGES DE REGRAS AVANÇADAS CONFIGURADAS */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px] dark:border-slate-700/60">
                        {hasQueryTypes ? (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                            <span>{t("shareConnection.roles.queriesBadge")}</span>
                            <span>{role.allowed_query_types?.join(", ")}</span>
                          </div>
                        ) : (
                          <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md dark:bg-slate-700 dark:text-slate-300">
                            {t("shareConnection.roles.allOpsAllowed")}
                          </div>
                        )}

                        {hasAllowedTables && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300">
                            <Table size={11} />
                            <span>{t("shareConnection.roles.allowedTablesBadge", { tables: role.allowed_tables?.join(", ") || "" })}</span>
                          </div>
                        )}

                        {hasBlockedTables && (
                          <div className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-semibold dark:bg-red-950/60 dark:border-red-800 dark:text-red-300">
                            <Ban size={11} />
                            <span>{t("shareConnection.roles.blockedTablesBadge", { tables: role.blocked_tables?.join(", ") || "" })}</span>
                          </div>
                        )}

                        {hasBlockedCols && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
                            <Columns size={11} />
                            <span>{t("shareConnection.roles.blockedColsBadge", { count: Object.keys(role.blocked_columns || {}).length })}</span>
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:bg-slate-800/40 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === "shares"
              ? t("shareConnection.footer.shares")
              : activeTab === "empresas"
              ? t("shareConnection.footer.companies")
              : t("shareConnection.footer.roles")}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs"
          >
            {t("shareConnection.done")}
          </button>
        </div>
      </div>

      {/* ========================================================
          MODAL: EDITOR DE REGRAS AVANÇADAS & PERMISSÕES
      ======================================================== */}
      {modalRegrasAberto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/70 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
                  {tipoConfigAlvo === "role_nova"
                    ? t("shareConnection.rulesModal.newTitle")
                    : tipoConfigAlvo === "role_edicao"
                    ? t("shareConnection.rulesModal.editTitle", { name: alvoRole?.name || "" })
                    : t("shareConnection.rulesModal.shareTitle", {
                        name:
                          alvoShare?.user_nome ||
                          t("shareConnection.members.userFallback", { id: alvoShare?.user_id ?? 0 }),
                      })}
                </h4>
              </div>
              <button
                onClick={() => setModalRegrasAberto(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              {/* Identificação da Role (se for role) */}
              {tipoConfigAlvo !== "share_custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 dark:text-slate-300">
                      {t("shareConnection.rulesModal.nameLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("shareConnection.rulesModal.namePlaceholder")}
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 dark:text-slate-300">
                      {t("shareConnection.rulesModal.descLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("shareConnection.rulesModal.descPlaceholder")}
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* 1. TIPOS DE CONSULTA PERMITIDOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    {t("shareConnection.rulesModal.queryTypesTitle")}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {t("shareConnection.rulesModal.queryTypesNote")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {queryTypesList.map((qt) => {
                    const ativo = formQueryTypes.includes(qt.id);
                    return (
                      <button
                        key={qt.id}
                        type="button"
                        onClick={() => toggleQueryType(qt.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          ativo
                            ? "bg-purple-50/70 border-purple-300 text-purple-900 shadow-2xs dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-200"
                            : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/60 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{qt.label}</span>
                          {ativo && <Check size={13} className="text-purple-600 font-bold dark:text-purple-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{qt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. REGRAS DE TABELAS */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Table size={14} className="text-indigo-600 dark:text-indigo-400" />
                    {t("shareConnection.rulesModal.tablesControlTitle")}
                  </span>
                  {loadingTables && (
                    <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                      {t("shareConnection.rulesModal.loadingTables")}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tabelas Permitidas (Whitelist) */}
                  <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200 min-w-0 dark:bg-slate-800/40 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {t("shareConnection.rulesModal.allowedTablesTitle")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t("shareConnection.rulesModal.onlyThese")}
                      </span>
                    </div>

                    {/* Seleção rápida com JoinSelect das tabelas */}
                    {availableTables.length > 0 && (
                      <JoinSelect
                        className="w-full"
                        buttonClassName={joinSelectCompactClass}
                        options={availableTables
                          .filter((tblNome) => !formAllowedTables.includes(tblNome.toLowerCase()))
                          .map((tblNome) => ({ value: tblNome, label: tblNome }))}
                        value=""
                        onChange={(val) => {
                          if (val) addAllowedTable(val);
                        }}
                        placeholder={t("shareConnection.rulesModal.selectAllowedTable", {
                          count: availableTables.length,
                        })}
                        searchable={true}
                        autoWidth={false}
                      />
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder={t("shareConnection.rulesModal.inputTableAllowedPlaceholder")}
                        value={inputTableAllowed}
                        onChange={(e) => setInputTableAllowed(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAllowedTable(inputTableAllowed);
                          }
                        }}
                        className="flex-1 min-w-0 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-600 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => addAllowedTable(inputTableAllowed)}
                        className="shrink-0 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-2xs"
                      >
                        {t("shareConnection.rulesModal.btnAdd")}
                      </button>
                    </div>

                    {availableTables.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-400">{t("shareConnection.rulesModal.suggested")}</span>
                        {availableTables
                          .filter((tblNome) => !formAllowedTables.includes(tblNome.toLowerCase()))
                          .slice(0, 6)
                          .map((tblNome) => (
                            <button
                              key={tblNome}
                              type="button"
                              onClick={() => addAllowedTable(tblNome)}
                              className="bg-white border border-slate-300 px-1.5 py-0.5 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-slate-700 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                            >
                              +{tblNome}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 pt-1 min-h-[32px]">
                      {formAllowedTables.map((tblNome) => (
                        <span
                          key={tblNome}
                          className="inline-flex items-center gap-1 rounded bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
                        >
                          {tblNome}
                          <button
                            type="button"
                            onClick={() => removeAllowedTable(tblNome)}
                            className="text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tabelas Bloqueadas (Blacklist) */}
                  <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200 min-w-0 dark:bg-slate-800/40 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {t("shareConnection.rulesModal.blockedTablesTitle")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t("shareConnection.rulesModal.neverAccessible")}
                      </span>
                    </div>

                    {/* Seleção rápida com JoinSelect das tabelas */}
                    {availableTables.length > 0 && (
                      <JoinSelect
                        className="w-full"
                        buttonClassName={joinSelectCompactClass}
                        options={availableTables
                          .filter((tblNome) => !formBlockedTables.includes(tblNome.toLowerCase()))
                          .map((tblNome) => ({ value: tblNome, label: tblNome }))}
                        value=""
                        onChange={(val) => {
                          if (val) addBlockedTable(val);
                        }}
                        placeholder={t("shareConnection.rulesModal.selectBlockedTable", {
                          count: availableTables.length,
                        })}
                        searchable={true}
                        autoWidth={false}
                      />
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder={t("shareConnection.rulesModal.inputTableBlockedPlaceholder")}
                        value={inputTableBlocked}
                        onChange={(e) => setInputTableBlocked(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addBlockedTable(inputTableBlocked);
                          }
                        }}
                        className="flex-1 min-w-0 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-red-600 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => addBlockedTable(inputTableBlocked)}
                        className="shrink-0 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-2xs"
                      >
                        {t("shareConnection.rulesModal.btnAdd")}
                      </button>
                    </div>

                    {availableTables.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-400">{t("shareConnection.rulesModal.suggested")}</span>
                        {availableTables
                          .filter((tblNome) => !formBlockedTables.includes(tblNome.toLowerCase()))
                          .slice(0, 6)
                          .map((tblNome) => (
                            <button
                              key={tblNome}
                              type="button"
                              onClick={() => addBlockedTable(tblNome)}
                              className="bg-white border border-slate-300 px-1.5 py-0.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors text-slate-700 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                            >
                              +{tblNome}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 pt-1 min-h-[32px]">
                      {formBlockedTables.map((tblNome) => (
                        <span
                          key={tblNome}
                          className="inline-flex items-center gap-1 rounded bg-red-100/70 border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-300"
                        >
                          {tblNome}
                          <button
                            type="button"
                            onClick={() => removeBlockedTable(tblNome)}
                            className="text-red-400 hover:text-red-800 dark:hover:text-red-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. REGRAS DE COLUNAS / CAMPOS BLOQUEADOS */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Columns size={14} className="text-amber-600 dark:text-amber-400" />
                    {t("shareConnection.rulesModal.columnsTitle")}
                  </span>
                  {loadingColumns && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                      <Loader2 size={12} className="animate-spin" />
                      {t("shareConnection.rulesModal.loadingColumns")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("shareConnection.rulesModal.columnsDesc")}
                </p>

                <div className="space-y-2.5 bg-slate-50/60 p-3 rounded-xl border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Seletor de Tabela */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                        {t("shareConnection.rulesModal.targetTableLabel")}
                      </label>
                      {availableTables.length > 0 ? (
                        <JoinSelect
                          className="w-full"
                          buttonClassName={joinSelectCompactClass}
                          options={availableTables.map((tblNome) => ({ value: tblNome, label: tblNome }))}
                          value={selectedTableForColumn}
                          onChange={(val) => selecionarTabelaParaColuna(val)}
                          placeholder={t("shareConnection.rulesModal.selectTargetTable")}
                          searchable={true}
                          autoWidth={false}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={t("shareConnection.rulesModal.inputTargetTablePlaceholder")}
                          value={selectedTableForColumn}
                          onChange={(e) => selecionarTabelaParaColuna(e.target.value)}
                          className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-600 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                        />
                      )}
                    </div>

                    {/* Seletor de Colunas */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                        {t("shareConnection.rulesModal.blockedColLabel")}
                      </label>
                      {selectedTableForColumn && columnsCache[selectedTableForColumn.toLowerCase()]?.length ? (
                        <JoinSelect
                          className="w-full"
                          buttonClassName={joinSelectCompactClass}
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
                          placeholder={t("shareConnection.rulesModal.selectBlockedCol", {
                            count: columnsCache[selectedTableForColumn.toLowerCase()].length,
                          })}
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
                                  ? t("shareConnection.rulesModal.colLoadingPlaceholder")
                                  : t("shareConnection.rulesModal.colFieldPlaceholder")
                                : t("shareConnection.rulesModal.selectFirstPlaceholder")
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
                            className="flex-1 min-w-0 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-600 text-slate-900 font-medium disabled:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:disabled:bg-slate-800/40"
                          />
                          <button
                            type="button"
                            disabled={!selectedTableForColumn || !inputColumnBlocked.trim()}
                            onClick={addBlockedColumn}
                            className="shrink-0 px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600 shadow-2xs"
                          >
                            {t("shareConnection.rulesModal.btnBlock")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sugestões rápidas de colunas */}
                  {selectedTableForColumn && columnsCache[selectedTableForColumn.toLowerCase()]?.length ? (
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        <span className="text-slate-400 font-medium">
                          {t("shareConnection.rulesModal.colsOf", { table: selectedTableForColumn })}
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
                              className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400 font-mono transition-colors font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                            >
                              +{col}
                            </button>
                          ))}
                      </div>

                      {/* Inserção manual */}
                      <div className="flex gap-1.5 pt-2">
                        <input
                          type="text"
                          placeholder={t("shareConnection.rulesModal.inputOtherColPlaceholder")}
                          value={inputColumnBlocked}
                          onChange={(e) => setInputColumnBlocked(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addBlockedColumn();
                            }
                          }}
                          className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1 text-[11px] outline-none focus:border-amber-600 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          disabled={!inputColumnBlocked.trim()}
                          onClick={addBlockedColumn}
                          className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-semibold hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600 shadow-2xs"
                        >
                          {t("shareConnection.rulesModal.btnBlock")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Exibição dos campos bloqueados por tabela */}
                <div className="space-y-1.5 pt-1">
                  {Object.entries(formBlockedColumns).map(([tblNome, cols]) => (
                    <div
                      key={tblNome}
                      className="flex items-center gap-2 p-2 bg-amber-50/40 border border-amber-200/60 rounded-lg text-xs dark:bg-amber-950/30 dark:border-amber-900/50"
                    >
                      <span className="font-bold text-amber-900 dark:text-amber-300">{tblNome}:</span>
                      <div className="flex flex-wrap gap-1">
                        {cols.map((col) => (
                          <span
                            key={col}
                            className="inline-flex items-center gap-1 rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-200"
                          >
                            {col}
                            <button
                              type="button"
                              onClick={() => removeBlockedColumn(tblNome, col)}
                              className="text-amber-500 hover:text-amber-900 font-bold dark:hover:text-amber-100"
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
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-indigo-600 dark:text-indigo-400" />
                    {t("shareConnection.rulesModal.maxRowsTitle")}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("shareConnection.rulesModal.maxRowsDesc")}
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder={t("shareConnection.rulesModal.maxRowsPlaceholder")}
                    value={formMaxRows}
                    onChange={(e) => setFormMaxRows(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-purple-600 text-slate-900 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* 5. PERMISSÕES DE SISTEMA (se for role) */}
              {tipoConfigAlvo !== "share_custom" && availablePermissions.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key size={14} className="text-purple-600 dark:text-purple-400" />
                    {t("shareConnection.rulesModal.systemPermsTitle")}
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-700">
                    {availablePermissions.map((p) => {
                      const marcado = formPermissoes.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-slate-700 hover:bg-slate-100 p-1 rounded cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
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
                          <span className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">
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
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalRegrasAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("shareConnection.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSalvarRegras}
                disabled={salvandoRegras}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600 shadow-xs"
              >
                {salvandoRegras && <Loader2 size={13} className="animate-spin" />}
                {t("shareConnection.rulesModal.btnSave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareConnectionModal;
