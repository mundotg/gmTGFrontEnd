"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Edit,
  Plus,
  Trash2,
  Play,
  PauseCircle,
  Clock,
  Target,
  Loader2,
} from "lucide-react";
import { Project, Sprint, TypeShowToste } from "../types";
import { PaginacaoGenerica, PaginatedResponse } from "../components/Paginacao";
import { useSessionTask } from "../contexts/UserContext";
import { SprintModal } from "../components/CreateSprintModal";
import { safeDateTime } from "../utils";
import { SpringCard } from "../components/SpringCard";

interface ProjectListProps {
  projects: PaginatedResponse<Project>;
  setProjects: React.Dispatch<React.SetStateAction<PaginatedResponse<Project>>>;
  sprintList: Record<string, PaginatedResponse<Sprint>>;
  setSprintList: React.Dispatch<React.SetStateAction<Record<string, PaginatedResponse<Sprint>>>>;
  onSelectProject: (project: Project, sprint?: Sprint | null) => void;
  onOpenAddProject: () => void;
  showToast: (message: string, type: TypeShowToste) => void;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  showToast,
  setSprintList,
  sprintList,
  setProjects,
  onSelectProject,
  onOpenAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const { api } = useSessionTask();
  const [openSprintModal, setOpenSprintModal] = useState<{ project: { projectId: string, name: string }, sprint?: Sprint } | null>(null);


  const buscarProjectos = useCallback(
    async (limit: number, page: number, tipo: "user" | "project" | "task" | "sprint", search?: string) => {
      try {
        const params = new URLSearchParams({
          tipo,
          page: String(page),
          limit: String(limit),
        });
        if (search) params.append("search", search);

        const { data } = await api.get<PaginatedResponse<Project>>("/geral/paginate?" + params);
        setProjects({ ...data, search });
      } catch (err) {
        console.error("Erro ao buscar projetos:", err);
      }
    },
    [setProjects, api]
  );

  // ...
  const handleDeleteSprint = useCallback(
    async (sprintId: string) => {
      try {
        await api.delete(`/sprints/${sprintId}`);
        setSprintList((prev) => {
          const updated = { ...prev };
          for (const [projId, sprintPage] of Object.entries(updated)) {
            updated[projId] = {
              ...sprintPage,
              items: sprintPage.items.filter((s) => s.id !== sprintId),
              total: sprintPage.total - 1,
            };
          }
          return updated;
        });
      } catch (err) {
        console.error("Erro ao eliminar sprint:", err);
      }
    },
    [api, setSprintList]
  );

  const handleEditSprint = useCallback(
    (project: { projectId: string, name: string }, sprint: Sprint) => {
      setOpenSprintModal({ project, sprint });
    },
    []
  );


  const handleToggleSprint = useCallback(
    async ({ sprintId, activate, end_date }: { sprintId: string; activate: boolean; end_date?: Date | string }) => {
      try {
        if (activate && end_date) {
          const endDate = new Date(end_date);
          const today = new Date();
          endDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          if (endDate < today) {
            alert("Não é possível ativar uma sprint cuja data final já passou.");
            return;
          }
        }

        const { data } = await api.patch(`/sprints/toggle/${sprintId}/status`, null, {
          params: { activate },
        });

        setSprintList((prev) => {
          const updated = { ...prev };
          for (const [projId, sprintPage] of Object.entries(updated)) {
            updated[projId] = {
              ...sprintPage,
              items: sprintPage.items.map((s) => (s.id === sprintId ? data : s)),
            };
          }
          return updated;
        });
      } catch (err) {
        console.error("Erro ao alternar sprint:", err);
        // alert("Erro ao alternar sprint. Tente novamente.");
      }
    },
    [api, setSprintList]
  );



  const buscarSprintsPorProjeto = useCallback(
    async (
      limit: number,
      page: number,
      tipo: "user" | "project" | "task" | "sprint",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtro: Record<string, any>,
      search?: string
    ) => {
      try {
        const params = new URLSearchParams({
          tipo,
          page: String(page),
          limit: String(limit),
        });

        if (search) params.append("search", search);
        params.append("filtro", JSON.stringify(filtro));

        const { data } = await api.get<PaginatedResponse<Sprint>>("/geral/paginate?" + params);

        // console.log(filtro, ": ", data)
        setSprintList((prev) => ({
          ...prev,
          [filtro.project_id]: data,
        }));
      } catch (err) {
        console.error("Erro ao buscar sprints:", err);
      }
    },
    [api, setSprintList]
  );

  useEffect(() => {
    buscarProjectos(projects.limit, projects.page, "project", projects.search);
  }, []);

  const handleActionWithLoading = useCallback(
    async (id: string, action: () => Promise<void>) => {
      if (loadingActions[id]) return;
      setLoadingActions((prev) => ({ ...prev, [id]: true }));
      try {
        await action();
      } finally {
        setLoadingActions((prev) => ({ ...prev, [id]: false }));
      }
    },
    [loadingActions]
  );

  // useEffect(() => {
  //   const desativarSprints = async () => {
  //     for (const { items } of Object.values(sprintList)) {
  //       for (const sprint of items) {
  //         if (sprint.is_active && new Date(safeDateTime(sprint.end_date)) < new Date()) {
  //           try{
  //             await handleToggleSprint({sprintId:sprint.id!,activate:false,end_date:sprint.end_date});
  //             showToast( "sprint desativada "+sprint.name, "success")
  //             await new Promise((res) => setTimeout(res, 300)); // 300ms de intervalo
  //           }catch{
  //             showToast("sprint não foi desativada "+sprint.name, "error")
  //           }
            
  //         }
  //       }
  //     }
  //   };

  //   desativarSprints();
  // }, [sprintList]);
  return (
    <section aria-label="Lista de Projetos" className="space-y-4 sm:space-y-6 overflow-clip p-2">
      {/* Cabeçalho */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Meus Projetos
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            {projects.items.length} projeto{projects.items.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <button
          onClick={onOpenAddProject}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow-sm text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span className="font-medium">Novo Projeto</span>
        </button>
      </header>

      {/* Lista de projetos */}
      <PaginacaoGenerica<Project>
        apiUrl="/paginate/"
        api={api}
        fetchFunc={buscarProjectos}
        tipo="project"
        searchPlaceholder="pesquisar projecto por nome"
        setLista={setProjects}
        Lista={projects}
        onSelect={(proj) => proj.id && onSelectProject(proj)}
        onEdit={(proj) =>
          proj.id && handleActionWithLoading(proj.id, () => Promise.resolve(onEditProject(proj.id || "")))
        }
        onDelete={(proj) =>
          proj.id && handleActionWithLoading(proj.id, () => Promise.resolve(onDeleteProject(proj.id || "")))
        }
        renderItem={(project) => {
          const totalTasks = project.tasks?.length ?? 0;
          const completedTasks = project.tasks?.filter((t) => t.status === "concluida").length ?? 0;
          const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
          const isLoading = !!loadingActions[project.id || ""];
          const sprintData = sprintList[project.id || ""] ?? {
            items: [],
            page: 1,
            limit: 5,
            pages: 0,
            total: 0,
          };


          return (
            <article
              key={project.id}
              aria-label={"pro_" + project.name}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              <div className="p-4 sm:p-5 lg:p-6">
                {/* Cabeçalho do Projeto */}
                <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => onSelectProject(project)}
                  // disabled={isLoading}
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </button>

                  {/* Ações */}
                  <div className="flex space-x-1 sm:ml-4 self-end sm:self-start">
                    <button
                      onClick={() => onEditProject(project.id!)}
                      disabled={isLoading}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors disabled:opacity-50"
                      title="Editar projeto"
                      aria-label="Editar projeto"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Edit size={18} />}
                    </button>
                    <button
                      onClick={() => onDeleteProject(project.id!)}
                      disabled={isLoading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors disabled:opacity-50"
                      title="Excluir projeto"
                      aria-label="Excluir projeto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </header>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={16} className="text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-900">Tarefas</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-indigo-700">
                      {completedTasks}/{totalTasks}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-xs font-medium text-green-900">Progresso</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-700">
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Sprints */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-600" />
                      <span>Sprints Ativas</span>
                    </h4>
                    <button
                      onClick={() => setOpenSprintModal({ project: { projectId: project.id!, name: project.name } })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-semibold hover:bg-indigo-100 transition"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">Nova Sprint</span>
                    </button>
                  </div>


                 <SpringCard buscarSprintsPorProjeto={buscarSprintsPorProjeto} handleActionWithLoading={handleActionWithLoading} 
                 handleDeleteSprint={handleDeleteSprint} handleEditSprint={handleEditSprint} handleToggleSprint={handleToggleSprint}
                 loadingActions={loadingActions} onSelectProject={onSelectProject} project={project} sprintData={sprintData}  />

                </div>

                {/* Rodapé */}
                <footer className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    <span>
                      Criado em{" "}
                      <span className="font-medium text-gray-700">
                        {project.created_at
                          ? safeDateTime(project.created_at)
                          : "N/D"}
                      </span>
                    </span>
                  </div>
                </footer>
              </div>
            </article>
          );
        }}
      />

      {/* Modal de criar sprint */}
      {openSprintModal &&
        <SprintModal
          isOpen={!!openSprintModal}
          project={openSprintModal?.project}
          sprint={openSprintModal?.sprint}
          mode={openSprintModal?.sprint ? "edit" : "create"}// ou "edit" / "view"
          onClose={() => setOpenSprintModal(null)}
          onUpdated={() => buscarProjectos(projects.limit, projects.page, "project")}
        />}
    </section>
  );
};

export default React.memo(ProjectList)