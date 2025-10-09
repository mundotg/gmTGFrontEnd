import { Clock, Edit, Plus, Search, Target, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Project } from "../types";

/**
 * Lista de projetos melhorada e otimizada
 */
export const ProjectList: React.FC<{
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onOpenAddProject: () => void;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleSprint: (projectId: string) => void;
}> = ({
  projects,
  onSelectProject,
  onOpenAddProject,
  onEditProject,
  onDeleteProject,
  onToggleSprint,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          Meus Projetos
        </h2>
        <button
          onClick={onOpenAddProject}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <Plus size={20} />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Nenhum projeto */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            {projects.length === 0
              ? "Nenhum projeto criado ainda"
              : "Nenhum projeto encontrado"}
          </p>
          <button
            onClick={onOpenAddProject}
            className="bg-indigo-600 text-white rounded-lg px-6 py-3 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Criar Primeiro Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const totalTasks = project.tasks?.length || 0;
            const completedTasks = project.tasks?.filter(
              (t) => t.status === "concluida"
            ).length || 0;
            const progress =
              totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const overdueTasks = project.tasks?.filter(
              (t) => new Date() > t.endDate && t.status !== "concluida"
            ).length || 0;

            return (
              <div
                key={project.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="p-6">
                  {/* Cabeçalho do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex-1"
                      onClick={() => project.id && onSelectProject(project.id)}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-indigo-600">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-gray-600 mb-3">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => project.id && onEditProject(project.id)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="Editar projeto"
                        title="Editar projeto"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => project.id && onDeleteProject(project.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label="Excluir projeto"
                        title="Excluir projeto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="space-y-4">
                    {/* Progresso */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progresso
                        </span>
                        <span className="text-sm text-gray-500">
                          {completedTasks}/{totalTasks} tarefas
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {project.team.length > 0 && (
                        <span className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          <Users size={14} className="mr-1" />
                          {project.team.length} membro
                          {project.team.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {overdueTasks > 0 && (
                        <span className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          <Clock size={14} className="mr-1" />
                          {overdueTasks} atrasada
                          {overdueTasks > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Rodapé */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        Criado em{" "}
                        {project.created_at?.toLocaleDateString("pt-BR")}
                      </div>

                      <button
                        onClick={() => project.id && onToggleSprint(project.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${
                          project.sprint?.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-400"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                        }`}
                      >
                        {project.sprint?.isActive
                          ? "Sprint Ativa"
                          : "Iniciar Sprint"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
