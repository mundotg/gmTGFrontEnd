"use client";

import React, { useState } from "react";
import {
  Database,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Server,
  Cpu,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Sliders,
  Activity,
  HardDrive,
  UserCircle2,
  Globe,
  Filter,
} from "lucide-react";
import {
  CacheItemResumo,
  CacheItemDetalhe,
  useCacheManager,
} from "@/hook/useCacheManager";
import { useCachePolicy, EstadoCacheUtilizador } from "@/hook/useCachePolicy";

/* =====================================================================
   HELPERS & UI BÁSICA
===================================================================== */
function formatarBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatarTTL(segundos?: number | null): { texto: string; classe: string } {
  if (segundos === null || segundos === undefined || segundos < 0) {
    return { texto: "Sem expiração", classe: "bg-gray-100 text-gray-600" };
  }
  if (segundos < 60) {
    return { texto: `${segundos}s`, classe: "bg-amber-100 text-amber-700 font-medium" };
  }
  if (segundos < 3600) {
    const mins = Math.floor(segundos / 60);
    const restos = segundos % 60;
    return { texto: `${mins}m ${restos}s`, classe: "bg-blue-100 text-blue-700" };
  }
  const horas = (segundos / 3600).toFixed(1);
  return { texto: `${horas}h`, classe: "bg-emerald-100 text-emerald-700" };
}

const Switch = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? "bg-blue-600" : "bg-gray-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`${
        checked ? "translate-x-5" : "translate-x-1"
      } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs`}
    />
  </button>
);

/** Badge com o dono da entrada de cache (ou "Global" quando não pertence a ninguém). */
const DonoBadge = ({
  item,
  onFiltrar,
}: {
  item: Pick<CacheItemResumo, "user_id" | "user_nome" | "user_email">;
  onFiltrar?: (userId: number) => void;
}) => {
  if (item.user_id === null || item.user_id === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
        <Globe size={10} /> Global
      </span>
    );
  }

  const nome = item.user_nome || `Utilizador #${item.user_id}`;
  return (
    <button
      type="button"
      onClick={() => onFiltrar?.(item.user_id as number)}
      title={`${nome}${item.user_email ? ` (${item.user_email})` : ""} — clique para ver só as caches deste utilizador`}
      className="inline-flex items-center gap-1 max-w-[160px] px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200/60 hover:bg-sky-100 transition-colors cursor-pointer"
    >
      <UserCircle2 size={11} className="shrink-0" />
      <span className="truncate">{nome}</span>
    </button>
  );
};

/* =====================================================================
   PAINEL UNIFICADO DE GESTÃO DE CACHE
===================================================================== */
export const CacheGestaoPanel: React.FC = () => {
  // Aba ativa do painel: "explorador" | "utilizadores"
  const [subAba, setSubAba] = useState<"explorador" | "utilizadores">("explorador");

  // Hook de gestão de chaves em tempo real
  const {
    items,
    stats,
    total,
    totalPages,
    loading: carregandoChaves,
    erro: erroChaves,
    emOperacao,
    filtros,
    carregarChaves,
    atualizarPesquisa,
    mudarTipo,
    mudarPagina,
    mudarUserId,
    obterDetalhe,
    editarChave,
    eliminarChave,
    eliminarLote,
    limparTodoCache,
  } = useCacheManager(true);

  // Hook de políticas por utilizador
  const {
    utilizadores,
    loading: carregandoUsers,
    erro: erroUsers,
    emCurso: userEmCurso,
    carregar: carregarUsers,
    alterarDadosLocais,
    limparCache: limparCacheUser,
  } = useCachePolicy(true);

  // Estados locais
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [itemDetalhe, setItemDetalhe] = useState<CacheItemDetalhe | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [itemEdicao, setItemEdicao] = useState<{
    key: string;
    valueStr: string;
    ttl: string;
  } | null>(null);
  const [confirmarLimpezaGeral, setConfirmarLimpezaGeral] = useState(false);
  const [confirmarEliminacaoChave, setConfirmarEliminacaoChave] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [sucessoFeedback, setSucessoFeedback] = useState<string | null>(null);
  const [limpouUser, setLimpouUser] = useState<number | null>(null);

  const mostrarSucesso = (msg: string) => {
    setSucessoFeedback(msg);
    setTimeout(() => setSucessoFeedback(null), 3500);
  };

  // Pesquisa
  const aoPesquisar = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarPesquisa(termoPesquisa);
  };

  // Seleção de chaves
  const alternarSelecionado = (key: string) => {
    setSelecionados((ant) =>
      ant.includes(key) ? ant.filter((k) => k !== key) : [...ant, key]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === items.length) {
      setSelecionados([]);
    } else {
      setSelecionados(items.map((i) => i.key));
    }
  };

  // Detalhe de chave
  const abrirDetalhe = async (key: string) => {
    setCarregandoDetalhe(true);
    const detalhe = await obterDetalhe(key);
    setCarregandoDetalhe(false);
    if (detalhe) setItemDetalhe(detalhe);
  };

  // Edição de chave
  const abrirEdicao = async (key: string) => {
    setCarregandoDetalhe(true);
    const detalhe = await obterDetalhe(key);
    setCarregandoDetalhe(false);
    if (detalhe) {
      setItemEdicao({
        key: detalhe.key,
        valueStr: detalhe.raw_str,
        ttl: detalhe.ttl !== null && detalhe.ttl !== undefined ? String(detalhe.ttl) : "",
      });
    }
  };

  const salvarEdicao = async () => {
    if (!itemEdicao) return;
    let valorFinal: any = itemEdicao.valueStr;
    try {
      valorFinal = JSON.parse(itemEdicao.valueStr);
    } catch {
      // Valor como string se não for JSON válido
    }

    const ttlFinal = itemEdicao.ttl.trim() !== "" ? Number(itemEdicao.ttl) : null;
    const ok = await editarChave(itemEdicao.key, valorFinal, ttlFinal);
    if (ok) {
      mostrarSucesso(`Chave '${itemEdicao.key}' atualizada com sucesso.`);
      setItemEdicao(null);
    }
  };

  // Eliminar
  const executarEliminacao = async (key: string) => {
    const ok = await eliminarChave(key);
    if (ok) {
      setSelecionados((ant) => ant.filter((k) => k !== key));
      setConfirmarEliminacaoChave(null);
      mostrarSucesso(`Chave '${key}' eliminada.`);
    }
  };

  const executarEliminacaoLote = async () => {
    if (selecionados.length === 0) return;
    const ok = await eliminarLote(selecionados);
    if (ok) {
      mostrarSucesso(`${selecionados.length} chaves eliminadas com sucesso.`);
      setSelecionados([]);
    }
  };

  const executarLimpezaTotal = async () => {
    const res = await limparTodoCache();
    if (res) {
      setConfirmarLimpezaGeral(false);
      setSelecionados([]);
      mostrarSucesso(res.mensagem || "Todo o cache foi limpo com sucesso.");
    }
  };

  // Limpeza de cache de utilizador
  const aoLimparUser = async (userId: number) => {
    if (await limparCacheUser(userId)) {
      setLimpouUser(userId);
      setTimeout(() => setLimpouUser((atual) => (atual === userId ? null : atual)), 3000);
      mostrarSucesso("Cache do utilizador invalidado (geração incrementada).");
    }
  };

  const copiarValor = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const semDadosLocaisCount = utilizadores.filter((u) => !u.usar_dados_locais).length;

  // Filtro por utilizador
  const utilizadorFiltrado: EstadoCacheUtilizador | undefined =
    filtros.userId !== null
      ? utilizadores.find((u) => u.user_id === filtros.userId)
      : undefined;

  const filtrarPorUtilizador = (userId: number | null) => {
    setSelecionados([]);
    mudarUserId(userId);
  };

  const explorarCachesDe = (userId: number) => {
    filtrarPorUtilizador(userId);
    setSubAba("explorador");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* ── TOPO DO PAINEL COM ABAS E AÇÕES ── */}
      <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
            <Database size={18} className="text-blue-600" /> Painel de Gestão de Cache &amp; Dados Locais
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Gerencie o ciclo de vida, expiração e integridade dos dados em cache no Redis e na Memória RAM.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (subAba === "explorador") carregarChaves();
              else carregarUsers();
            }}
            disabled={carregandoChaves || carregandoUsers}
            title="Recarregar dados"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={carregandoChaves || carregandoUsers ? "animate-spin" : ""}
            />
            Atualizar
          </button>

          <button
            onClick={() => setConfirmarLimpezaGeral(true)}
            disabled={carregandoChaves}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <Trash2 size={13} />
            Limpar Todo o Cache
          </button>
        </div>
      </div>

      {/* ── CARDS DE ESTATÍSTICAS DO CACHE ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Total de Chaves</span>
              <Layers size={14} className="text-blue-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.total_keys}</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Redis (L2)</span>
              <Server
                size={14}
                className={stats.redis_connected ? "text-emerald-500" : "text-red-500"}
              />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-gray-900">{stats.redis_keys}</span>
              <span className="text-[10px] text-gray-400">
                {stats.redis_connected ? stats.used_memory_human : "Offline"}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Memória RAM (L1)</span>
              <Cpu size={14} className="text-indigo-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.memory_keys}</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Taxa de Acerto</span>
              <Activity size={14} className="text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600 mt-1">{stats.hit_rate}%</p>
          </div>
        </div>
      )}

      {/* ── SUB-ABAS DE NAVEGAÇÃO INTERNA DO PAINEL ── */}
      <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 pt-2">
        <button
          onClick={() => setSubAba("explorador")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subAba === "explorador"
              ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Database size={14} />
          Explorador de Chaves
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700 font-bold">
            {total}
          </span>
        </button>

        <button
          onClick={() => setSubAba("utilizadores")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subAba === "utilizadores"
              ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={14} />
          Políticas por Utilizador
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700 font-bold">
            {utilizadores.length}
          </span>
        </button>
      </div>

      {/* ── NOTIFICAÇÕES & FEEDBACK ── */}
      {(erroChaves || erroUsers) && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-red-600" />
          <span>{erroChaves || erroUsers}</span>
        </div>
      )}

      {sucessoFeedback && (
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{sucessoFeedback}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VISTA 1: EXPLORADOR DE CHAVES
      ══════════════════════════════════════════════════════════════════ */}
      {subAba === "explorador" && (
        <div className="flex flex-col flex-1">
          {/* Barra de pesquisa e filtro de camada */}
          <div className="p-3 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={aoPesquisar} className="relative flex-1 w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder="Pesquisar por nome de chave, padrão ou prefixo (ex: empresa, user:)..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
              />
              {termoPesquisa && (
                <button
                  type="button"
                  onClick={() => {
                    setTermoPesquisa("");
                    atualizarPesquisa("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <div className="relative">
                <Filter
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <select
                  id="cache-filtro-utilizador"
                  value={filtros.userId ?? ""}
                  onChange={(e) =>
                    filtrarPorUtilizador(e.target.value === "" ? null : Number(e.target.value))
                  }
                  disabled={carregandoUsers && utilizadores.length === 0}
                  title="Filtrar caches por utilizador"
                  className={`pl-7 pr-2 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all max-w-[200px] cursor-pointer ${
                    filtros.userId !== null
                      ? "bg-sky-50 border-sky-300 text-sky-800 font-semibold"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  <option value="">Todos os utilizadores</option>
                  {utilizadores.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.nome} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {selecionados.length > 0 && (
                <button
                  onClick={executarEliminacaoLote}
                  disabled={carregandoChaves}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Eliminar ({selecionados.length})
                </button>
              )}

              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => mudarTipo("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filtros.tipo === "all"
                      ? "bg-white text-gray-900 shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => mudarTipo("redis")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filtros.tipo === "redis"
                      ? "bg-white text-gray-900 shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Redis
                </button>
                <button
                  onClick={() => mudarTipo("memory")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filtros.tipo === "memory"
                      ? "bg-white text-gray-900 shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  RAM
                </button>
              </div>
            </div>
          </div>

          {/* Banner de filtro ativo por utilizador */}
          {filtros.userId !== null && (
            <div className="px-4 py-2 bg-sky-50 border-b border-sky-100 text-xs text-sky-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <UserCircle2 size={15} className="shrink-0 text-sky-600" />
                <span className="truncate">
                  A explorar as caches de{" "}
                  <strong>{utilizadorFiltrado?.nome ?? `Utilizador #${filtros.userId}`}</strong>
                  {utilizadorFiltrado?.email ? ` (${utilizadorFiltrado.email})` : ""} —{" "}
                  {total} {total === 1 ? "entrada" : "entradas"}
                  {utilizadorFiltrado ? ` · geração ${utilizadorFiltrado.geracao}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => aoLimparUser(filtros.userId as number)}
                  disabled={userEmCurso === filtros.userId}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 text-[11px] font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={11} /> Invalidar cache deste utilizador
                </button>
                <button
                  onClick={() => filtrarPorUtilizador(null)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border border-sky-200 bg-white text-sky-700 hover:bg-sky-100 text-[11px] font-medium transition-all cursor-pointer"
                >
                  <X size={11} /> Limpar filtro
                </button>
              </div>
            </div>
          )}

          {/* Tabela de chaves de cache */}
          <div className="overflow-x-auto min-h-[220px]">
            {carregandoChaves && items.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span>A carregar chaves de cache...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Nenhuma chave de cache encontrada{" "}
                {filtros.search ? `para "${filtros.search}"` : ""}
                {filtros.userId !== null
                  ? ` para ${utilizadorFiltrado?.nome ?? `o utilizador #${filtros.userId}`}`
                  : ""}
                .
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selecionados.length > 0 && selecionados.length === items.length}
                        onChange={selecionarTodos}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="py-2.5 px-3">Chave</th>
                    <th className="py-2.5 px-3 w-40">Utilizador</th>
                    <th className="py-2.5 px-3 w-28">Camada</th>
                    <th className="py-2.5 px-3 w-32">TTL</th>
                    <th className="py-2.5 px-3 w-24">Tamanho</th>
                    <th className="py-2.5 px-3">Prévia do Valor</th>
                    <th className="py-2.5 px-3 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item) => {
                    const ttlInfo = formatarTTL(item.ttl);
                    const selecionado = selecionados.includes(item.key);
                    const ocupado = emOperacao === item.key;

                    return (
                      <tr
                        key={item.key}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          selecionado ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => alternarSelecionado(item.key)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-gray-900 max-w-[280px] truncate">
                          <span title={item.key}>{item.key}</span>
                        </td>
                        <td className="py-2 px-3">
                          <DonoBadge item={item} onFiltrar={filtrarPorUtilizador} />
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.source === "redis"
                                ? "bg-red-50 text-red-700 border border-red-200/50"
                                : item.source === "memory"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                                : "bg-purple-50 text-purple-700 border border-purple-200/50"
                            }`}
                          >
                            {item.source === "both" ? "Redis + RAM" : item.source.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 ${ttlInfo.classe}`}
                          >
                            <Clock size={10} />
                            {ttlInfo.texto}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 font-mono text-[11px]">
                          {formatarBytes(item.size_bytes)}
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-500 text-[11px] max-w-[240px] truncate">
                          <span title={item.preview}>{item.preview || "—"}</span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => abrirDetalhe(item.key)}
                              title="Visualizar valor completo"
                              disabled={ocupado}
                              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => abrirEdicao(item.key)}
                              title="Editar valor e TTL"
                              disabled={ocupado}
                              className="p-1 rounded text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmarEliminacaoChave(item.key)}
                              title="Eliminar chave"
                              disabled={ocupado}
                              className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              {ocupado ? (
                                <Loader2 size={14} className="animate-spin text-red-500" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div>
                A mostrar <span className="font-semibold text-gray-800">{items.length}</span> de{" "}
                <span className="font-semibold text-gray-800">{total}</span> chaves
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => mudarPagina(filtros.page - 1)}
                  disabled={filtros.page <= 1 || carregandoChaves}
                  className="p-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 py-0.5 font-medium">
                  Página {filtros.page} de {totalPages}
                </span>
                <button
                  onClick={() => mudarPagina(filtros.page + 1)}
                  disabled={filtros.page >= totalPages || carregandoChaves}
                  className="p-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VISTA 2: POLÍTICAS POR UTILIZADOR
      ══════════════════════════════════════════════════════════════════ */}
      {subAba === "utilizadores" && (
        <div className="flex flex-col flex-1">
          {semDadosLocaisCount > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
              {semDadosLocaisCount}{" "}
              {semDadosLocaisCount === 1
                ? "utilizador está a ler sempre da origem"
                : "utilizadores estão a ler sempre da origem"}
              . Os pedidos deles ignoram o cache e consultam a base de dados em cada chamada.
            </div>
          )}

          {carregandoUsers && utilizadores.length === 0 ? (
            <div className="p-12 flex items-center justify-center text-gray-400 text-xs gap-2">
              <Loader2 size={16} className="animate-spin text-blue-500" /> A carregar utilizadores...
            </div>
          ) : utilizadores.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Nenhum utilizador encontrado no sistema.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {utilizadores.map((u) => {
                const ocupado = userEmCurso === u.user_id;

                return (
                  <div
                    key={u.user_id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                          {u.nome}
                        </p>
                        {!u.usar_dados_locais && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase shrink-0">
                            Sempre da origem
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-500">
                          Geração {u.geracao}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                      {limpouUser === u.user_id && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium animate-fadeIn">
                          <CheckCircle2 size={12} /> Cache do utilizador limpo.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-xs text-gray-600 hidden sm:inline">
                          Não consultar dados locais
                        </span>
                        <Switch
                          checked={!u.usar_dados_locais}
                          disabled={ocupado}
                          onChange={() => alterarDadosLocais(u.user_id, !u.usar_dados_locais)}
                        />
                      </label>

                      <button
                        onClick={() => explorarCachesDe(u.user_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 text-xs text-sky-700 hover:bg-sky-100 transition-all cursor-pointer"
                      >
                        <Search size={13} />
                        Explorar caches
                      </button>

                      <button
                        onClick={() => aoLimparUser(u.user_id)}
                        disabled={ocupado}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {ocupado ? (
                          <Loader2 size={13} className="animate-spin text-red-500" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Limpar cache
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DE DETALHE DE CHAVE ── */}
      {itemDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="min-w-0 pr-4">
                <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Database size={16} className="text-blue-600 shrink-0" />
                  <span className="truncate">{itemDetalhe.key}</span>
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 flex-wrap">
                  <span>Camada: {itemDetalhe.source.toUpperCase()}</span>
                  <span>•</span>
                  <span>Tipo: {itemDetalhe.tipo}</span>
                  <span>•</span>
                  <span>{formatarBytes(itemDetalhe.size_bytes)}</span>
                  {itemDetalhe.function && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{itemDetalhe.function}()</span>
                    </>
                  )}
                  <span>•</span>
                  <DonoBadge
                    item={itemDetalhe}
                    onFiltrar={(id) => {
                      setItemDetalhe(null);
                      explorarCachesDe(id);
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setItemDetalhe(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-slate-100">
              <pre className="font-mono text-xs whitespace-pre-wrap break-all select-all">
                {itemDetalhe.raw_str}
              </pre>
            </div>

            <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => copiarValor(itemDetalhe.raw_str)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-xs font-medium text-gray-700 transition-all shadow-xs cursor-pointer"
              >
                {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiado ? "Copiado!" : "Copiar Valor"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const chave = itemDetalhe.key;
                    setItemDetalhe(null);
                    abrirEdicao(chave);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} />
                  Editar
                </button>
                <button
                  onClick={() => setItemDetalhe(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDIÇÃO DE CHAVE ── */}
      {itemEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="min-w-0 pr-4">
                <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Edit3 size={16} className="text-amber-600 shrink-0" />
                  <span className="truncate">Editar Cache: {itemEdicao.key}</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Atualize o valor (JSON ou string) e o tempo de expiração em segundos.
                </p>
              </div>
              <button
                onClick={() => setItemEdicao(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tempo de Vida / TTL (em segundos):
                </label>
                <input
                  type="number"
                  value={itemEdicao.ttl}
                  onChange={(e) =>
                    setItemEdicao({ ...itemEdicao, ttl: e.target.value })
                  }
                  placeholder="Ex: 300 (deixe vazio para manter atual ou sem expiração)"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Valor do Cache (JSON ou Texto):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(itemEdicao.valueStr);
                        setItemEdicao({
                          ...itemEdicao,
                          valueStr: JSON.stringify(parsed, null, 2),
                        });
                      } catch {
                        // Mantém como está se não for JSON válido
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Formatar JSON
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={itemEdicao.valueStr}
                  onChange={(e) =>
                    setItemEdicao({ ...itemEdicao, valueStr: e.target.value })
                  }
                  className="w-full p-3 text-xs bg-slate-900 text-emerald-400 font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 border border-slate-700"
                />
              </div>
            </div>

            <div className="p-3 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemEdicao(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEdicao}
                disabled={carregandoChaves}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {carregandoChaves ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO: ELIMINAR CHAVE INDIVIDUAL ── */}
      {confirmarEliminacaoChave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Eliminar Chave de Cache?</h4>
                <p className="text-xs text-gray-600 mt-1 break-all">
                  Tem a certeza que deseja eliminar a chave{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 font-bold">
                    {confirmarEliminacaoChave}
                  </code>
                  ? O próximo pedido que consultar este dado terá de recorrer à base de dados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmarEliminacaoChave(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => executarEliminacao(confirmarEliminacaoChave)}
                disabled={carregandoChaves}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                {carregandoChaves ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Eliminar Chave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO: LIMPAR TODO O CACHE ── */}
      {confirmarLimpezaGeral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-red-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-red-900 text-sm">Limpar Todo o Cache do Sistema?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Isto irá esvaziar totalmente a camada Redis (L2) e a Memória RAM (L1).
                  Nenhum dado definitivo será perdido, mas as consultas poderão ser temporariamente mais lentas enquanto o cache é repovoado.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmarLimpezaGeral(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executarLimpezaTotal}
                disabled={carregandoChaves}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {carregandoChaves ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
