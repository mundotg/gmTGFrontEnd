"use client";
import React, { useState, useEffect, useCallback } from "react";
import ProjectModal from "./components/ProjectModal";
import TaskModal from "./components/TaskModal";
import { Project, Task, TaskStatus } from "./types";
import { ProjectList } from "./paginas/ProjectList";
import { TaskList } from "./paginas/Tasklist";
import { useSession } from "@/context/SessionContext";

const TASK_CHECK_INTERVAL = 60_000;
const DEFAULT_TASK_DURATION = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SPRINT_DURATION = 14 * 24 * 60 * 60 * 1000;

const App: React.FC = () => {
    const { user, isLoading, isAuthenticated, api } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get("/projects");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: Project[] = res.data.map((p: any) => ({
                ...p,
                createdAt: new Date(p.created_at),
                dueDate: p.dueDate ? new Date(p.due_date) : undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tasks: p.tasks.map((t:any) => ({
                    ...t,
                    startDate: new Date(t.start_date),
                    endDate: new Date(t.end_date),
                    completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
                })),
            }));
            setProjects(data);
        } catch {
            setFormError("Não foi possível carregar os projetos.");
        }
    }, [isAuthenticated, api]);

    useEffect(() => { if (isAuthenticated && !isLoading) fetchProjects(); }, [isAuthenticated, isLoading, fetchProjects]);

    const validateProjectForm = (f: Partial<Project>) => !f.name?.trim() ? "O nome do projeto é obrigatório." : null;
    const validateTaskForm = (f: Partial<Task>) => !f.title?.trim() ? "O título da tarefa é obrigatório." : null;

    const handleAddProject = useCallback(async (f: Partial<Project>) => {
        const err = validateProjectForm(f); if (err) return setFormError(err);
        try {
            const res = await api.post("/projects", f);
            setProjects(prev => [...prev, res.data]);
            setProjectModalOpen(false);
            setFormError(null);
        }
        catch { setFormError("Não foi possível criar o projeto."); }
    }, [api]);

    const handleEditProject = useCallback(async (f: Partial<Project>) => {
        if (!editingProject) return;
        const err = validateProjectForm(f); if (err) return setFormError(err);
        try {
            const res = await api.put(`/projects/${editingProject.id}`, f);
            setProjects(prev => prev.map(p => p.id === editingProject.id ? res.data : p));
            setEditingProject(null);
            setProjectModalOpen(false);
            setFormError(null);
        }
        catch { setFormError("Não foi possível atualizar o projeto."); }
    }, [api, editingProject]);

    const handleDeleteProject = useCallback(async (id: string) => {
        if (!confirm("Tem certeza?")) return;
        try { await api.delete(`/projects/${id}`); setProjects(prev => prev.filter(p => p.id !== id)); if (selectedProjectId === id) setSelectedProjectId(null); }
        catch { setFormError("Não foi possível deletar o projeto."); }
    }, [api, selectedProjectId]);

    const validateTasks = useCallback((p: Project) => {
        const now = new Date();
        return {
            ...p,
            tasks: p.tasks?.map(t =>
                t.endDate && now > t.endDate && t.status !== "concluida"
                    ? { ...t, status: "atrasada" as TaskStatus }
                    : t
            )
        };
    }, []);


    useEffect(() => { const interval = setInterval(() => setProjects(prev => prev.map(validateTasks)), TASK_CHECK_INTERVAL); return () => clearInterval(interval); }, [validateTasks]);

    const handleAddTask = useCallback(async (f: Partial<Task>) => {
        const err = validateTaskForm(f);
        if (err) return setFormError(err);
        if (!newTaskProjectId) return setFormError("Nenhum projeto selecionado.");

        const newTask: Task = {
            id: crypto.randomUUID(),
            title: f.title!.trim(),
            description: f.description?.trim(),
            status: "pendente",
            project_id: newTaskProjectId,
            priority: f.priority ?? "media",
            assignedTo: f.assignedTo ?? (user?.nome || "Desconhecido"),
            createdBy: user?.nome || "Desconhecido",
            startDate: f.startDate ? new Date(f.startDate) : new Date(),
            endDate: f.endDate ? new Date(f.endDate) : new Date(Date.now() + DEFAULT_TASK_DURATION),
            estimatedHours: f.estimatedHours,
            tags: f.tags ?? [],
            isValidated: false,
            // Removido projectId pois não existe em Task
        };

        try {
            const res = await api.post(`/projects/${newTaskProjectId}/tasks`, newTask);
            setProjects(prev =>
                prev.map(p => (p.id === newTaskProjectId ? { ...p, tasks: [...(p.tasks ?? []), res.data] } : p))
            );
            setTaskModalOpen(false);
            setNewTaskProjectId(null);
            setFormError(null);
        } catch (error) {
            setFormError("Não foi possível criar a tarefa."+error);
        }
    }, [newTaskProjectId, user?.nome,api]);


    const handleEditTask = useCallback(async (f: Partial<Task>) => {
        if (!editingTask) return;
        const updatedTask = { ...editingTask, ...f };

        try {
            const res = await api.put(
                `/projects/${editingTask.project_id}/tasks/${editingTask.id}`,
                updatedTask
            );
            setProjects(prev =>
                prev.map(p => ({
                    ...p,
                    tasks: p.tasks ? p.tasks.map(t => (t.id === editingTask.id ? res.data : t)) : []
                }))
            );
            setTaskModalOpen(false);
            setEditingTask(null);
            setFormError(null);
        } catch (error) {
            setFormError("Não foi possível atualizar a tarefa." + error);
        }
    }, [editingTask,api]);


    const handleToggleTask = useCallback((projectId: string, taskId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            return {
                ...p,
                tasks: p.tasks ? p.tasks.map(t => {
                    if (t.id !== taskId) return t;
                    const newStatus = t.status === "concluida" ? "pendente" : "concluida";
                    return { ...t, status: newStatus, completedAt: newStatus === "concluida" ? new Date() : undefined };
                }) : []
            };
        }));
    }, []);


    const handleDeleteTask = useCallback(async (projectId: string, taskId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
        try {
            await api.delete(`/projects/${projectId}/tasks/${taskId}`);
            setProjects(prev =>
                prev.map(p => (p.id === projectId ? { ...p, tasks: (p.tasks ?? []).filter(t => t.id !== taskId) } : p))
            );
        } catch (error) {
            setFormError("Não foi possível excluir a tarefa." + error);
        }
    }, [api]);


    const handleDelegateTask = useCallback((projectId: string, taskId: string, newUser: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: (p.tasks ?? []).map(t => t.id === taskId ? { ...t, assignedTo: newUser } : t) } : p));
    }, []);

    const handleToggleSprint = useCallback((projectId: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, sprint: p.sprint?.isActive ? { ...p.sprint, isActive: false } : { id: crypto.randomUUID(), name: `Sprint ${new Date().toLocaleDateString("pt-BR")}`, isActive: true, startDate: new Date(), endDate: new Date(Date.now() + DEFAULT_SPRINT_DURATION), goal: "Sprint objetivo" } } : p));
    }, []);

    const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <header className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Gerenciador de Projetos</h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">Organize seus projetos, gerencie tarefas e acompanhe o progresso da equipe</p>
                </header>
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
                    {!selectedProject ? (
                        <ProjectList
                            projects={projects}
                            onSelectProject={setSelectedProjectId}
                            onOpenAddProject={() => { setEditingProject(null); setFormError(null); setProjectModalOpen(true); }}
                            onEditProject={id => { const p = projects.find(p => p.id === id); if (p) { setEditingProject(p); setFormError(null); setProjectModalOpen(true); } }}
                            onDeleteProject={handleDeleteProject}
                            onToggleSprint={handleToggleSprint}
                        />
                    ) : (
                        <TaskList
                            project={selectedProject}
                            onBack={() => setSelectedProjectId(null)}
                            onOpenAddTask={() => { setEditingTask(null); setFormError(null); setNewTaskProjectId(selectedProject.id ?? null); setTaskModalOpen(true); }}
                            onToggleTask={taskId => selectedProject.id ? handleToggleTask(selectedProject.id, taskId) : undefined}
                            onEditTask={taskId => { 
                                const t = selectedProject.tasks?.find(t => t.id === taskId); 
                                if (t) { setEditingTask(t); setFormError(null); setTaskModalOpen(true); } 
                            }}
                            onDeleteTask={taskId => {
                                if (selectedProject.id) {
                                    handleDeleteTask(selectedProject.id, taskId);
                                }
                            }}
                            onDelegateTask={(taskId, newUser) => {
                                if (selectedProject.id) {
                                    handleDelegateTask(selectedProject.id, taskId, newUser);
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            <ProjectModal
                isOpen={isProjectModalOpen}
                editingProject={editingProject}
                formError={formError}
                onClose={() => { setProjectModalOpen(false); setEditingProject(null); setFormError(null); }}
                onSubmit={editingProject ? handleEditProject : handleAddProject}
            />

            <TaskModal
                isOpen={isTaskModalOpen}
                editingTask={editingTask ?? undefined}
                formError={formError ?? undefined}
                defaultAssignedTo={user?.nome ?? "Desconhecido"}
                onClose={() => { setTaskModalOpen(false); setEditingTask(null); setFormError(null); }}
                onSubmit={editingTask ? handleEditTask : handleAddTask}
            />
        </div>
    );
};

export default App;
