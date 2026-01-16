"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  CheckSquare,
  Plus,
  Filter,
  LayoutGrid,
  Target,
  AlertCircle,
  X,
  Search,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Menu,
} from "lucide-react";

import { PaginatedResponse } from "../components/Paginacao";
import { useSessionTask } from "../contexts/UserContext";
import {
  GroupByOption,
  Project,
  Sprint,
  TarefasPayload,
  Task,
  TaskPriority,
  TaskStats,
  TaskStatus,
  TypeShowToste,
} from "../types";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../costant";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatCard,
  TaskGroup,
} from "./TaskGroupProps";
import DelegateTaskModal from "../components/DelegarTaskModal";
import { safeDateTime2 } from "../utils";
import { FORMATS, ReportButton } from "@/app/services/ReportButton";
import { FormatoRelatorio, useRelatorioAvancado } from "@/app/services/useRelatorio";
import { RelatorioPayload } from "@/hook/useRelatorio";

/* ------------------------------------

* Tipagem do componente principal
* ------------------------------------ */
interface TaskListProps {
  project: Project;
  sprint?: Sprint | null;
  onBack: () => void;
  showToast: (message: string, type: TypeShowToste) => void;
  onOpenAddTask: (project_id: string, sprint_id?: string) => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDelegateTask: (taskId: string, user: string) => void;
}

/* ------------------------------------

* Componente principal: TaskList
* ------------------------------------ */
function TaskList({
  project,
  sprint,
  onBack,
  onOpenAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onDelegateTask,
}: TaskListProps) {
  const { api } = useSessionTask();

  /* -----------------------------
  
  * Estados principais
  * ----------------------------- */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    inReview: 0,
    blocked: 0,
    cancelled: 0,
    progress_percent: 0,
    total_estimated_hours: 0,
    priorityCounts: {
      baixa: 0,
      media: 0,
      alta: 0,
      urgente: 0,
      critica: 0,
    },
  });

  const [paginate, setPaginate] = useState({ page: 1, limit: 100, total: 0 });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [sprintFilter, setSprintFilter] = useState<string>("");
  const [groupBy, setGroupBy] = useState<GroupByOption>("sprint");

  const [sprintsList, setSprintsList] = useState<Sprint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  /* -----------------------------
  
  * Modal de delegação
  * ----------------------------- */
  const [showDelegateModal, setShowDelegateModal] = useState<boolean>(false);
  const [taskToDelegate, setTaskToDelegate] = useState<Task | null>(null);
  const [delegateLoading, setDelegateLoading] = useState<boolean>(false);
  // const [showReportDropdown, setShowReportDropdown] = useState(false);

  const {
    gerarRelatorio,
    // cancelarGeracao,
    isLoading: isLoadingRelatorio,
    // error: errorRelatorio,
    // success: successRelatorio,
    // progress: exportProgress,
    // tempoEstimado,
    // dadosRelatorio,
    // reset: resetRelatorio,
  } = useRelatorioAvancado<TarefasPayload>();

  /* -----------------------------
  * Buscar Sprints do projeto
  * ----------------------------- */
  const fetchSprints = useCallback(async () => {

    if (sprint) return;
    try {
      const params = new URLSearchParams({
        tipo: "sprint",
        page: "1",
        limit: "100",
        filtro: JSON.stringify({ project_id: project.id }),
      });

      const { data } = await api.get<PaginatedResponse<Sprint>>(
        `/geral/paginate?${params}`,
      );
      setSprintsList(data.items);
    } catch (err) {
      console.error("Erro ao buscar sprints:", err);
    }
  }, [api, project.id]);

  // Buscar tarefas do projeto 
  const fetchTasks = useCallback(async () => {
    if (!project.id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tipo: "task", page: String(paginate.page), limit: String(paginate.limit), });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any 
      const filtro: Record<string, any> = { project_id: project.id, };
      if (statusFilter) filtro.status = statusFilter;
      if (priorityFilter) filtro.priority = priorityFilter;
      if (sprint) { filtro.sprint_id = sprint.id }
      else if (sprintFilter) {
        if (sprintFilter === "backlog") { filtro.sprint_id = null; }
        else { filtro.sprint_id = sprintFilter; }
      }
      if (searchTerm) {
        params.append("search", searchTerm);

      }
      params.append("filtro", JSON.stringify(filtro));
      const { data } = await api.get<PaginatedResponse<Task>>("/geral/paginate?" + params);
      setTasks(data.items); setPaginate((prev) => ({ ...prev, total: data.total }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
      setError("Não foi possível carregar as tarefas. Tente novamente.");
    }
    finally { setLoading(false); }
  }, [project.id, paginate.page, paginate.limit, searchTerm, statusFilter, priorityFilter, sprintFilter]);

  /* -----------------------------
  * Buscar estatísticas
  * ----------------------------- */
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get<TaskStats>("/stats/task", {
        params: { project_id: project.id, sprint_id: sprint?.id },
      });
      setStats(data);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  }, [project.id, sprint]);


  const handleGerarRelatorio = useCallback(async (formato: FormatoRelatorio) => {
    project.sprints = [];

    const taskDados: TarefasPayload = {
      stats: stats,
      project: project,
      sprint: sprint,
      tasks: tasks
    }

    const payload: RelatorioPayload<TarefasPayload> = {
      tipo: "tarefas",
      body: taskDados,
      filtros: {
        tabelas: [],
        totalColunas: 0,
      },
      parametros: {
        formato: formato,
        incluirDetalhes: true,
      },
    };

    await gerarRelatorio(payload);
    // setShowReportDropdown(false);
  }, [stats, project, tasks]);

  /* -----------------------------
  * Atualizar lista e stats
  * ----------------------------- */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchStats()]);
    setRefreshing(false);
  }, [refreshing]);

  /* -----------------------------
  
  * Delegar tarefa
  * ----------------------------- */
  const handleDelegateTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setTaskToDelegate(task);
        setShowDelegateModal(true);
      }
    },
    [tasks],
  );

  const handleConfirmDelegate = useCallback(
    async (userId: string) => {
      if (!taskToDelegate?.id) return;
      setDelegateLoading(true);
      try {
        await api.put(`/ tasks / delegar / ${taskToDelegate.id} `, null, {
          params: { assigned_to: userId },
        });
        onDelegateTask(taskToDelegate.id, userId);
        setShowDelegateModal(false);
        setTaskToDelegate(null);
      } catch (error) {
        console.error("Erro ao delegar tarefa:", error);
      } finally {
        setDelegateLoading(false);
      }
    },
    [api, taskToDelegate, onDelegateTask],


  );

  /* -----------------------------
  
  * Inicialização
  * ----------------------------- */
  useEffect(() => {
    fetchSprints();
    fetchTasks();
    fetchStats();
  }, []);



  // Agrupar tarefas 
  const groupedTasks = useMemo(() => {
    if (groupBy === "none")
      return { "📋 Todas as Tarefas": tasks };
    return tasks.reduce((groups, task) => {
      let key: string; switch (groupBy) {
        case "status":
          const statusLabels: Record<TaskStatus, string> = {
            pendente: "⏳ Pendente", em_andamento: "🚀 Em Andamento",
            cancelada: "❌ Cancelada", em_revisao: "👀 Em Revisão",
            concluida: "✅ Concluída", bloqueada: "🚫 Bloqueada",
          };
          key = statusLabels[task.status!] || "❓ Sem Status";
          break;
        case "priority":
          const priorityLabels: Record<TaskPriority, string> = {
            baixa: "🟢 Prioridade Baixa", media: "🟡 Prioridade Média",
            alta: "🟠 Prioridade Alta", urgente: "🔴 Prioridade Urgente",
            critica: "⚫ Prioridade Crítica"
          };
          key = priorityLabels[task.priority || "media"] || "⚪ Sem Prioridade";
          break;
        case "assignee":
          key = task.assigned_to_id ? `👤 Responsável: ${task.assigned_to_id} ` : "👥 Não Atribuído";
          break;
        case "sprint":
          const sprintIn = sprint || sprintsList.find((s) => s.id === task.sprint_id);
          key = sprintIn ? `🏃 Sprint: ${sprintIn.name}` : "📦 Backlog (Sem Sprint)";
          break;
        default: key = "📁 Outras";
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(task); return groups;
    },
      {} as Record<string, Task[]>);
  },
    [tasks, groupBy, sprintsList]);
  // Calcular progresso por grupo 
  const getGroupProgress = useCallback((groupTasks: Task[]) => {
    const total = groupTasks.length;
    const completed = groupTasks.filter(t => t.status === "concluida").length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, []);

  /* -----------------------------
  
  * Filtros
  * ----------------------------- */
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("");
    setPriorityFilter("");
    setSprintFilter("");
  }, []);

  const hasActiveFilters = useMemo(
    () => !!searchTerm || !!statusFilter || !!priorityFilter || !!sprintFilter,
    [searchTerm, statusFilter, priorityFilter, sprintFilter],
  );

  const handleValidateTask = useCallback(async (taskId: string, aprovado: boolean, comentario?: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !project.id) return;
      const { data } = await api.put(`/tasks/validar/${taskId}`, null, { params: { aprovado, comentario: comentario || "", }, });
      console.log("✅ Tarefa validada:", data); // Atualiza lista após validação buscarTasksPorProjeto(); 
    } catch (error) {
      console.error("❌ Erro ao validar tarefa:", error);
    }
  }, [tasks, project.id, api]);

  /* -----------------------------
  
  * Renderização principal
  * ----------------------------- */
  return (<div className="flex flex-col h-full p-3 sm:p-4 bg-gray-50">
    {/* 🔹 Cabeçalho permanece igual */}
    <header className="flex-shrink-0 mb-3 sm:mb-6">
      <div className="container flex h-12 justify-between items-center mx-auto px-4 sm:px-6 lg:px-8">
        {/* Esquerda: Navegação e Infos */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Botão Voltar */}
          <button onClick={onBack} className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Voltar para projetos" aria-label="Voltar" >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          {/* Informações do Projeto / Sprint */}
          <div className="flex flex-col min-w-0"> <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate"> project_name: {project.name} </h2>
          </div> {sprint && (<div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate"> sprint_name:{sprint.name} </h3>
          </div>)}
          </div>
        </div>
        {/* Direita: Ações */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Toggle */}
          <button onClick={() => setShowMobileMenu((prev) => !prev)}
            className="sm:hidden p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all" title="Menu" aria-label="Abrir menu" >
            <Menu size={18} /> </button>
          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={handleRefresh} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all" >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span>Atualizar</span>
            </button>
            <button onClick={() => onOpenAddTask(project.id!, sprint?.id)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all text-sm" >
              <Plus size={16} /> <span>Nova Tarefa</span> </button>
            <ReportButton
              onGenerate={handleGerarRelatorio}
              formats={FORMATS}
              hasResults={true}
              isLoading={isLoadingRelatorio}
            /></div>
        </div>
      </div>
      {/* Menu Mobile */}
      {showMobileMenu && (
        <div className="sm:hidden mt-3 flex flex-col gap-2 px-4"> <button onClick={() => { onOpenAddTask(project.id!, sprint?.id); setShowMobileMenu(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm" >
          <Plus size={16} /> Nova Tarefa </button> <button onClick={() => {
            fetchTasks(); setShowMobileMenu(false);
          }}
            disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm" >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
          </button> <ReportButton
            onGenerate={handleGerarRelatorio}
            formats={FORMATS}
            hasResults={true}
            
            isLoading={isLoadingRelatorio}
          /></div>)} {/* Estatísticas */} <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 mt-4"> {/* Cartões de Estatísticas */}
        <StatCard label="Total de Tarefas" value={stats.total} icon={<Target size={16} className="sm:w-[18px] sm:h-[18px]" />} color="blue" description="Todas as tarefas do projeto" />
        <StatCard label="Concluídas" value={stats.completed} icon={<CheckSquare size={16} className="sm:w-[18px] sm:h-[18px]" />}
          color="green" description={`${stats.progress_percent}% do total`} />
        <StatCard label="Em Andamento" value={stats.in_progress} icon={<Clock size={16} className="sm:w-[18px] sm:h-[18px]" />}
          color="orange" description="Tarefas ativas" /> <StatCard label="Pendentes" value={stats.pending} icon={<AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />} color="yellow" description="Aguardando início" />
        <StatCard label="Em Revisão" value={stats.inReview} icon={<BarChart3 size={16} className="sm:w-[18px] sm:h-[18px]" />} color="purple" description="Aguardando aprovação" />
        <StatCard label="Horas Estimadas" value={stats.total_estimated_hours} icon={<TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />} color="indigo" description="Total de horas planejadas" isHours={true} />
      </div>
      {/* Barra de Controles */}
      <div className="bg-white rounded-lg sm:rounded-xl border shadow-sm p-3 sm:p-4 mb-3 sm:mb-4"> <div className="flex flex-col gap-3 sm:gap-4">
        {/* Linha 1: Busca e Controles */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
          </div>
          {/* Agrupamento e Filtros */}
          <div className="flex gap-2">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border min-w-0 sm:min-w-[160px]">
              <LayoutGrid size={14} className="text-gray-600 flex-shrink-0" />
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-medium text-gray-700 min-w-0" >
                <option value="sprint">Por Sprint</option> <option value="status">Por Status</option> <option value="priority">Por Prioridade</option>
                <option value="assignee">Por Responsável</option> <option value="none">Lista Simples</option>
              </select> </div>
            {/* Botão Filtros */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${showFilters || hasActiveFilters ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`} >
              <Filter size={14} /> <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (<span className="bg-white text-indigo-600 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold"> ! </span>)}
            </button> </div>
        </div>
        {/* Filtros Avançados */}
        {showFilters && (<div className="pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Filtros Avançados</span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (<button onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors" > <X size={12} />
                <span className="hidden sm:inline">Limpar filtros</span> </button>)}
              <span className="text-xs text-gray-500"> {tasks.length} de {paginate.total} </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div> <label className="text-xs font-medium text-gray-600 mb-1.5 block">📊 Status</label>
              <select value={statusFilter}
                //eslint-disable-next-line @typescript-eslint/no-explicit-any 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm" >
                <option value="">Todos os status</option> {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}> {s.label} </option>))}
              </select> </div> <div> <label className="text-xs font-medium text-gray-600 mb-1.5 block">⚡ Prioridade</label>
              <select value={priorityFilter}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any 
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm" >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}> {p.label} </option>))}
              </select> </div> {!sprint && <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">🏃 Sprint</label>
                <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm" >
                  <option value="">Todas as sprints</option>
                  {sprintsList.map((sprint) => (<option key={sprint.id} value={sprint.id}> 🏃 {sprint.name} {sprint.is_active ? " (Ativa)" : ""} </option>))}
                </select>
              </div>}
          </div>
        </div>)}
        {/* Barra de progresso */}
        <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1"> <div className="flex justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Progresso Geral</span>
              <span className="text-xs sm:text-sm font-bold text-indigo-600"> {stats.progress_percent}% </span>
            </div> <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.progress_percent}%` }} />
              </div> </div>
            <div className="text-xs text-gray-500 sm:text-right flex sm:flex-col justify-between sm:justify-end gap-1">
              <div>Atualizado {safeDateTime2(lastUpdated)}</div>
              <div>{stats.completed} de {stats.total} concluídas</div>
            </div> </div>
        </div> </div>
      </div>
    </header >

    {/* 🔹 Conteúdo */}

    <div className="flex-1 overflow-y-auto min-h-0">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onCreateTask={() => onOpenAddTask(project.id!, sprint?.id)}
        />
      ) : (
        <div className="flex justify-between align-middle text-center space-y-3 sm:space-y-4 pb-4 w-full h-full">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
            const groupProgress = getGroupProgress(groupTasks);
            const isBacklog = groupName.includes("Backlog");
            const isSprint = groupName.includes("Sprint");
            return (<TaskGroup key={groupName} groupName={groupName} groupTasks={groupTasks}
              groupProgress={groupProgress} isBacklog={isBacklog} isSprint={isSprint} onToggleTask={onToggleTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onDelegateTask={handleDelegateTask}
              onValidateTask={handleValidateTask} />);
          })} </div>
      )}
    </div>

    {/* 🔹 Modal de delegação */}
    <DelegateTaskModal
      isOpen={showDelegateModal}
      onClose={() => {
        setShowDelegateModal(false);
        setTaskToDelegate(null);
      }}
      onDelegate={handleConfirmDelegate}
      taskTitle={taskToDelegate?.title || ""}
      currentAssignee={taskToDelegate?.assigned_to_id}
      loading={delegateLoading}
    /> </div>
  );
}

export default React.memo(TaskList);
