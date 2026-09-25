"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  FolderKanban,
  Users,
  Database,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronRight,
  Search,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import ProjectModal from "@/app/task/components/ProjectModal";
import { Project, ProjectFormData } from "@/app/task/types";
import {
  EstadoProjeto,
  convertProject,
  estadoDoProjeto,
  resumirTarefas,
  safeDateView,
} from "@/app/task/utils";
import { useProjetos } from "@/hook/useProjetos";

/* =====================
   APARÊNCIA POR ESTADO
===================== */
const TEMA_ESTADO: Record<EstadoProjeto, { rotulo: string; classe: string }> = {
  ativo: { rotulo: "Ativo", classe: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  atrasado: { rotulo: "Atrasado", classe: "bg-red-50 text-red-700 border-red-100" },
  arquivado: { rotulo: "Arquivado", classe: "bg-slate-100 text-slate-600 border-slate-200" },
};

type Filtro = "todos" | "ativos" | "arquivados";

/* =====================
   COMPONENTE
===================== */
export const ProjetosTab = () => {
  const { user } = useSession();
  const router = useRouter();
  const permissions = user?.permissions || [];

  const can = (p: string) => permissions.includes(p) || permissions.includes("admin:*");
  const podeCriar = can("project:create");
  const podeEditar = can("project:update");
  const podeApagar = can("project:delete");

  const {
    projetos,
    totais,
    loading,
    erro,
    aGuardar,
    carregar,
    criar,
    atualizar,
    arquivar,
    remover,
  } = useProjetos();

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Project | null>(null);
  const [procura, setProcura] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("ativos");

  const visiveis = useMemo(() => {
    const termo = procura.trim().toLowerCase();

    return projetos.filter((p) => {
      const arquivado = p.is_active === false;
      if (filtro === "ativos" && arquivado) return false;
      if (filtro === "arquivados" && !arquivado) return false;

      if (!termo) return true;
      return (
        p.name.toLowerCase().includes(termo) ||
        (p.description ?? "").toLowerCase().includes(termo) ||
        (p.connection?.name ?? "").toLowerCase().includes(termo)
      );
    });
  }, [projetos, procura, filtro]);

  const guardar = async (dados: ProjectFormData) => {
    const resultado = emEdicao?.id
      ? await atualizar(emEdicao.id, dados)
      : await criar(dados);

    if (resultado) {
      setModalAberto(false);
      setEmEdicao(null);
    }
  };

  const abrirEdicao = (projeto: Project) => {
    setEmEdicao(projeto);
    setModalAberto(true);
  };

  const eliminar = async (projeto: Project) => {
    const resumo = resumirTarefas(projeto.tasks);
    const aviso =
      resumo.total > 0
        ? `“${projeto.name}” tem ${resumo.total} tarefa(s). Eliminar remove-as também.\n\n`
        : "";
    if (!confirm(`${aviso}Eliminar “${projeto.name}” definitivamente?`)) return;
    if (projeto.id) await remover(projeto.id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* CABEÇALHO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Projetos</h2>
            <p className="text-gray-500 text-sm">
              Gerencie o ecossistema de dados e equipes da sua organização.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregar}
              disabled={loading}
              title="Atualizar"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            {podeCriar && (
              <button
                onClick={() => {
                  setEmEdicao(null);
                  setModalAberto(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-sm active:scale-95"
              >
                <Plus size={18} />
                Novo Projeto
              </button>
            )}
          </div>
        </div>

        {/* Números somados dos projetos reais, não valores de exemplo. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Resumo rotulo="Projetos" valor={totais.projetos} detalhe={`${totais.ativos} ativos`} />
          <Resumo
            rotulo="Tarefas"
            valor={totais.tarefas}
            detalhe={`${totais.concluidas} concluídas`}
          />
          <Resumo
            rotulo="Progresso global"
            valor={`${totais.progresso}%`}
            detalhe={totais.tarefas === 0 ? "sem tarefas" : "de todas as tarefas"}
          />
          <Resumo
            rotulo="A precisar de atenção"
            valor={totais.atrasados + totais.semConexao}
            detalhe={`${totais.atrasados} atrasados · ${totais.semConexao} sem conexão`}
            alerta={totais.atrasados + totais.semConexao > 0}
          />
        </div>

        {/* Procura e filtro */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={procura}
              onChange={(e) => setProcura(e.target.value)}
              placeholder="Procurar por nome, descrição ou conexão…"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            {(["ativos", "arquivados", "todos"] as Filtro[]).map((opcao) => (
              <button
                key={opcao}
                onClick={() => setFiltro(opcao)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filtro === opcao
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* LISTA */}
      {loading && projetos.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : visiveis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiveis.map((projeto) => (
            <CartaoProjeto
              key={projeto.id}
              projeto={projeto}
              podeEditar={podeEditar}
              podeApagar={podeApagar}
              ocupado={aGuardar}
              onAbrir={() => router.push(`/task?project=${projeto.id}`)}
              onEditar={() => abrirEdicao(projeto)}
              onArquivar={() => arquivar(projeto, projeto.is_active !== false)}
              onEliminar={() => eliminar(projeto)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
          <FolderKanban size={64} strokeWidth={1} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">
            {projetos.length === 0
              ? "Nenhum projeto encontrado"
              : "Nenhum projeto corresponde ao filtro"}
          </p>
          <p className="text-sm">
            {projetos.length === 0
              ? "Comece criando seu primeiro workspace de dados."
              : "Experimente limpar a procura ou mudar o filtro."}
          </p>
          {projetos.length === 0 && podeCriar && (
            <button
              onClick={() => {
                setEmEdicao(null);
                setModalAberto(true);
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
            >
              <Plus size={16} /> Criar projeto
            </button>
          )}
        </div>
      )}

      {/* O modal de projeto já existe no quadro e traz seletor de conexão,
          tipo de projeto, equipa e prazo — mais completo do que o que eu tinha
          escrito aqui. Reutiliza-se em vez de manter duas versões. */}
      <ProjectModal
        isOpen={modalAberto}
        editingProject={
          emEdicao ? (convertProject(emEdicao) as ProjectFormData) : null
        }
        formError={erro}
        onClose={() => {
          setModalAberto(false);
          setEmEdicao(null);
        }}
        onSubmit={guardar}
      />
    </div>
  );
};

/* =====================
   SUB-COMPONENTES
===================== */
const Resumo = ({
  rotulo,
  valor,
  detalhe,
  alerta,
}: {
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  alerta?: boolean;
}) => (
  <div
    className={`rounded-xl border p-3 ${
      alerta ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
      {rotulo}
    </p>
    <p
      className={`text-xl font-bold mt-0.5 ${
        alerta ? "text-amber-700" : "text-gray-900"
      }`}
    >
      {valor}
    </p>
    {detalhe && <p className="text-[11px] text-gray-400 mt-0.5">{detalhe}</p>}
  </div>
);

const CartaoProjeto = ({
  projeto,
  podeEditar,
  podeApagar,
  ocupado,
  onAbrir,
  onEditar,
  onArquivar,
  onEliminar,
}: {
  projeto: Project;
  podeEditar: boolean;
  podeApagar: boolean;
  ocupado: boolean;
  onAbrir: () => void;
  onEditar: () => void;
  onArquivar: () => void;
  onEliminar: () => void;
}) => {
  const resumo = resumirTarefas(projeto.tasks);
  const estado = estadoDoProjeto(projeto);
  const tema = TEMA_ESTADO[estado];
  const arquivado = projeto.is_active === false;
  const prazo = safeDateView(projeto.due_date);

  return (
    <div
      className={`group bg-white border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 ${
        arquivado ? "border-gray-200 opacity-75" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
            {projeto.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{projeto.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-1">
              {projeto.description || "Sem descrição"}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 ${tema.classe}`}
        >
          {tema.rotulo}
        </span>
      </div>

      {/* Progresso calculado das tarefas reais */}
      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          <span>Progresso</span>
          <span>
            {resumo.concluidas}/{resumo.total} · {resumo.progresso}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              estado === "atrasado" ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${resumo.progresso}%` }}
          />
        </div>
        {resumo.total > 0 && (
          <p className="text-[10px] text-gray-400">
            {resumo.emCurso} em curso · {resumo.emRevisao} em revisão ·{" "}
            {resumo.pendentes} pendentes
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-50 mb-3">
        <Stat
          icon={<FolderKanban size={14} />}
          label="Tarefas"
          value={resumo.total}
        />
        <Stat
          icon={<Users size={14} />}
          label="Equipa"
          value={projeto.team_members?.length ?? 0}
        />
        <Stat
          icon={<FolderKanban size={14} />}
          label="Sprints"
          value={projeto.sprints?.length ?? 0}
        />
      </div>

      {/* A conexão é o alvo do pipeline: mostra-se o nome, não uma contagem. */}
      <div className="flex items-center gap-1.5 text-xs mb-2 min-w-0">
        <Database size={13} className="text-gray-400 shrink-0" />
        {projeto.connection ? (
          <span className="text-gray-600 truncate">
            {projeto.connection.name}
            <span className="text-gray-400"> · {projeto.connection.type}</span>
          </span>
        ) : (
          <span className="text-amber-600">Sem conexão associada</span>
        )}
      </div>

      {prazo && (
        <div className="flex items-center gap-1.5 text-xs mb-3">
          <CalendarClock
            size={13}
            className={estado === "atrasado" ? "text-red-500" : "text-gray-400"}
          />
          <span className={estado === "atrasado" ? "text-red-600" : "text-gray-600"}>
            {estado === "atrasado" ? "Venceu em" : "Prazo"} {prazo}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center pt-1">
        <button
          onClick={onAbrir}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          Workspace <ChevronRight size={14} />
        </button>

        <div className="flex gap-1">
          {podeEditar && (
            <>
              <button
                onClick={onEditar}
                disabled={ocupado}
                title="Editar"
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={onArquivar}
                disabled={ocupado}
                title={arquivado ? "Reativar" : "Arquivar"}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {arquivado ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              </button>
            </>
          )}
          {podeApagar && (
            <button
              onClick={onEliminar}
              disabled={ocupado}
              title="Eliminar"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="text-center space-y-0.5">
    <div className="flex justify-center text-gray-400">{icon}</div>
    <div className="text-xs font-bold text-gray-900">{value}</div>
    <div className="text-[10px] text-gray-400 uppercase tracking-tight">{label}</div>
  </div>
);
