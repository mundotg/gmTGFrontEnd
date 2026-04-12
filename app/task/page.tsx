"use client";
import React, { useState, useCallback } from "react";
import ProjectModal from "./components/ProjectModal";
import { TaskModal } from "./components/TaskModal";
import { Project, ProjectFormData, Sprint, Task, TaskCreate, TypeShowToste, UsuarioTaskCreate } from "./types";
import ProjectList from "./paginas/ProjectList";
import TaskList from "./paginas/Tasklist";

import { SessionMenu } from "./components/SessionMenu";
import { PaginatedResponse } from "./components/Paginacao";
import usePersistedState from "@/hook/localStoreUse";
import { ArrowLeft, Briefcase } from "lucide-react";
import { convertProject } from "./utils";
import { Toast } from "./components/ToastComponent";
import { DEFAULT_TASK_DURATION } from "./costant";
import { useSession } from "@/context/SessionContext";


const App: React.FC = () => {
  const { api, user, logout } = useSession();

  const [projects, setProjects] = usePersistedState<PaginatedResponse<Project>>(
    "paginacaoprojectos",
    { items: [], limit: 10, page: 1, pages: 0, total: 0 }
  );
  const [sprintList, setSprintList] = usePersistedState<Record<string, PaginatedResponse<Sprint>>>(
    "paginacaoprojectoSprint",
    {}
  );
  const [selectedProjectId, setSelectedProjectId] = usePersistedState<string | null>("projectIdTask", null)
  const [selectedSprintId, setSelectedSprintId] = usePersistedState<string | null | undefined>("SprintIdTask", null)
  const [isProjectModalOpen, setProjectModalOpen] = usePersistedState("isProjectModalOpen", false);
  const [isTaskModalOpen, setTaskModalOpen] = usePersistedState("isTaskModalOpen", false);
  const [editingProject, setEditingProject] = usePersistedState<ProjectFormData | null>("editingProject", null);
  const [editingTask, setEditingTask, clearEditTask] = usePersistedState<Task | null>("editingTask", null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProject, setSelectedProject] = usePersistedState<Project | null | undefined>("selectedProject_", null)


  const [selectedSprint, setSelectedSprint] = usePersistedState<Sprint | null | undefined>("selectedSprint_", null)


  // Função auxiliar para mostrar toast
  const showToast = useCallback((message: string, type: TypeShowToste = "info") => {
    setToast({ message, type });
  }, [setToast]);

  // Validações
  const validateProjectForm = useCallback((f: Partial<Project>) =>
    !f.name?.trim() ? "O nome do projeto é obrigatório." : null, []);

  const validateTaskForm = useCallback((f: Partial<Task>) =>
    !f.title?.trim() ? "O título da tarefa é obrigatório." : null, []);
  // CRUD DE PROJETOS
  const handleAddProject = useCallback(
    async (f: Partial<Project>) => {
      const err = validateProjectForm(f);
      if (err) return setFormError(err);

      setActionLoading(true);
      try {
        const res = await api.post("/projects", f);

        setProjects((prev) => ({
          ...prev,
          items: [...prev.items, res.data],
          total: prev.total + 1,
        }));

        setProjectModalOpen(false);
        setFormError(null);
        showToast("Projeto criado com sucesso!", "success");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Erro ao criar projeto:", error);
        const errorMsg = error.response?.data?.detail || "Não foi possível criar o projeto.";
        setFormError(errorMsg);
        showToast(errorMsg, "error");
      } finally {
        setActionLoading(false);
      }
    },
    [setProjectModalOpen, setProjects, showToast, validateProjectForm]
  );

  const handleEditProject = useCallback(
    async (f: Partial<Project>) => {
      if (!editingProject) return;

      const err = validateProjectForm(f);
      if (err) return setFormError(err);

      setActionLoading(true);
      try {
        const res = await api.put(`/projects/${editingProject.id}`, f);

        setProjects((prev) => ({
          ...prev,
          items: prev.items.map((p) => (p.id === editingProject.id ? res.data : p)),
        }));

        setEditingProject(null);
        setProjectModalOpen(false);
        setFormError(null);
        showToast("Projeto atualizado com sucesso!", "success");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Erro ao atualizar projeto:", error);
        const errorMsg = error.response?.data?.detail || "Não foi possível atualizar o projeto.";
        setFormError(errorMsg);
        showToast(errorMsg, "error");

        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [editingProject, setProjectModalOpen, setProjects, showToast, validateProjectForm]
  );

  const handleDeleteProject = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) return;

      setActionLoading(true);
      try {
        await api.delete(`/projects/${id}`);

        setProjects((prev) => ({
          ...prev,
          items: prev.items.filter((p) => p.id !== id),
          total: prev.total - 1,
        }));

        if (selectedProjectId === id) setSelectedProjectId(null);
        setFormError(null);
        showToast("Projeto excluído com sucesso!", "success");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Erro ao deletar projeto:", error);
        const errorMsg = error.response?.data?.detail || "Não foi possível deletar o projeto.";
        showToast(errorMsg, "error");
        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [selectedProjectId, setSelectedProjectId]
  );

  // CRUD DE TAREFAS
  const handleAddTask = useCallback(
    async (f: Partial<TaskCreate>) => {
      const err = validateTaskForm(f);
      if (err) return setFormError(err);
      const projectId = f.projectId || selectedProject?.id || selectedProjectId
      if (!projectId) {
        return setFormError("Nenhum projeto selecionado.");
      }

      const newTask: TaskCreate = {
        id: crypto.randomUUID(),
        title: f.title!.trim(),
        description: f.description?.trim(),
        status: "pendente",
        projectId: f.projectId,
        priority: f.priority ?? "media",
        assignedToId: f.assignedToId ?? user?.id ?? "desconhecido",
        createdById: user?.id ?? "desconhecido",
        startDate: f.startDate,
        endDate: f.endDate
          ? f.endDate
          : new Date(Date.now() + DEFAULT_TASK_DURATION),
        estimatedHours: f.estimatedHours ?? 0,
        tags: f.tags ?? [],
        isValidated: false,
        delegatedToId: f.delegatedToId,
        schedule: f.schedule,
        sprintId: f.sprintId,

      };

      setActionLoading(true);
      try {
        const res = await api.post(`/task/${projectId}/tasks`, newTask);

        setProjects((prev) => ({
          ...prev,
          items: prev.items.map((p) =>
            p.id === projectId
              ? { ...p, tasks: [...(p.tasks ?? []), res.data] }
              : p
          ),
        }));

        setTaskModalOpen(false);
        setFormError(null);
        showToast("Tarefa criada com sucesso!", "success");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Erro ao criar tarefa:", error);
        const errorMsg = error.response?.data?.detail || "Não foi possível criar a tarefa.";
        setFormError(errorMsg);
        showToast(errorMsg, "error");
      } finally {
        setActionLoading(false);
      }
    },
    [user?.id, selectedProject?.id]
  );

  const handleDeleteTask = useCallback(
    async (projectId: string, taskId: string) => {
      if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

      setActionLoading(true);
      try {
        await api.delete(`/task/${projectId}/tasks/${taskId}`);

        setProjects((prev) => ({
          ...prev,
          items: prev.items.map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks ?? []).filter((t) => t.id !== taskId) }
              : p
          ),
        }));

        setFormError(null);
        showToast("Tarefa excluída com sucesso!", "success");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Erro ao excluir tarefa:", error);
        const errorMsg = error.response?.data?.detail || "Não foi possível excluir a tarefa.";
        showToast(errorMsg, "error");
      } finally {
        setActionLoading(false);
      }
    },
    [api]
  );

  const handleEditTask = useCallback(
    async (f: Partial<TaskCreate>) => {
      if (!editingTask) return;
      const projectId = f.projectId || selectedProject?.id || selectedProjectId
      if (!projectId) {
        return setFormError("Nenhum projeto selecionado.");
      }
      const updatedTask: TaskCreate = {
        id: crypto.randomUUID(),
        title: f.title || "",
        description: f.description,
        status: f.status,
        projectId: f.projectId || projectId,
        priority: f.priority,
        assignedToId: f.assignedToId || user?.id || "",
        createdById: f.createdById || user?.id,
        startDate: f.startDate,
        endDate: f.endDate || "",
        estimatedHours: f.estimatedHours || 0,
        tags: f.tags,
        isValidated: f.isValidated,
        completedAt: f.completedAt,
        delegatedToId: f.delegatedToId,
        schedule: f.schedule,
        sprintId: f.sprintId

      };


      setActionLoading(true);
      try {
        const res = await api.put(
          `/task/${editingTask.project_id}/tasks/${editingTask.id}`,
          updatedTask
        );

        setProjects((prev) => ({
          ...prev,
          items: prev.items.map((p) =>
            p.id === editingTask.project_id
              ? {
                ...p,
                tasks: (p.tasks ?? []).map((t) =>
                  t.id === editingTask.id ? res.data : t
                ),
              }
              : p
          ),
        }));

        setTaskModalOpen(false);
        setEditingTask(null);
        setFormError(null);
        showToast("Tarefa atualizada com sucesso!", "success");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Erro ao atualizar tarefa:", error);
        const errorMsg = error.response?.data?.detail || "Não foi possível atualizar a tarefa.";
        setFormError(errorMsg);
        showToast(errorMsg, "error");
      } finally {
        setActionLoading(false);
      }
    },
    [editingTask]
  );





  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen ">
      {/* Toast de feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header fixo */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <Briefcase className="text-indigo-600 w-6 h-6 sm:w-7 sm:h-7" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Gerenciador de Projetos
              </h1>
            </div>

            <SessionMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      {/* Breadcrumb para navegação */}
      {selectedProject && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <button
              onClick={() => { setSelectedProjectId(null); setSelectedProject(null); setSelectedSprint(null); setSelectedSprintId(null) }}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="font-medium">Voltar para Projetos</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="container mx-auto p-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-auto ">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl ">
          <div className=" ">
            {!selectedProject ? (
              <ProjectList

                showToast={showToast}
                projects={projects}
                sprintList={sprintList}
                setSprintList={setSprintList}
                setProjects={setProjects}
                onSelectProject={(project, spring) => {
                  setSelectedSprint(spring)
                  setSelectedProject(project)
                }}
                onOpenAddProject={() => {
                  setEditingProject(null);
                  setFormError(null);
                  setProjectModalOpen(true);
                }}
                onEditProject={(id) => {
                  const p = projects.items.find((p) => p.id === id);
                  if (p) {
                    setEditingProject(convertProject(p) as ProjectFormData);
                    setFormError(null);
                    setProjectModalOpen(true);
                  }
                }}
                onDeleteProject={handleDeleteProject}
              />
            ) : (
              <TaskList
                showToast={showToast}
                project={selectedProject}
                sprint={selectedSprint}
                onBack={() => { setSelectedProjectId(null); setSelectedProject(null); setSelectedSprint(null); setSelectedSprintId(null) }}
                onOpenAddTask={(project_id, sprint_id) => {
                  // console.log(project_id," on", sprint_id)
                  setSelectedProjectId(project_id)
                  setSelectedSprintId(sprint_id)
                  clearEditTask()
                  setEditingTask(null);
                  setFormError(null);
                  setTaskModalOpen(true);

                }}
                onEditTask={(task) => {
                  clearEditTask()
                  setEditingTask(task);
                  setFormError(null);
                  setTaskModalOpen(true);

                }}
                onDeleteTask={(taskId) =>
                  selectedProject.id && handleDeleteTask(selectedProject.id, taskId)
                }
                onToggleTask={() => { }}
                onDelegateTask={() => { }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modais */}
      {isProjectModalOpen && <ProjectModal
        isOpen={isProjectModalOpen}
        editingProject={editingProject}
        formError={formError}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
          setFormError(null);
        }}
        onSubmit={editingProject ? handleEditProject : handleAddProject}
      // isLoading={actionLoading}
      />}

      {isTaskModalOpen && <TaskModal
        isOpen={isTaskModalOpen}
        isLoading={actionLoading}
        projectId={selectedProjectId!}
        sprintid={editingTask ? null : selectedSprintId}
        editingTask={editingTask ?? undefined}
        formError={formError ?? undefined}
        defaultAssignedTo={user?.nome ?? "Desconhecido"}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
          setFormError(null);
        }}
        onSubmit={editingTask ? handleEditTask : handleAddTask}
      // isLoading={actionLoading}
      />}
    </div>
  );
};

export default App;