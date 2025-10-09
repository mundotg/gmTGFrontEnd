import { useState, useMemo } from "react";
import { GroupByOption, Project, Task } from "../types";
import { ArrowLeft, CheckSquare, Plus } from "lucide-react";
import { TaskFilters } from "../components/TaskFilters";
import { TaskCard } from "../components/TaskCard";

/**
 * Lista de tarefas agrupadas
 */
export const TaskList: React.FC<{
  project: Project;
  onBack: () => void;
  onOpenAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDelegateTask: (taskId: string, user: string) => void;
}> = ({
  project,
  onBack,
  onOpenAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onDelegateTask,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<Task["status"] | "">("");
    const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "">("");
    const [groupBy, setGroupBy] = useState<GroupByOption>("status");

    const filteredTasks = useMemo(
      () =>
        (project.tasks || []).filter((task) => {
          const matchesSearch =
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = !statusFilter || task.status === statusFilter;
          const matchesPriority =
            !priorityFilter || task.priority === priorityFilter;

          return matchesSearch && matchesStatus && matchesPriority;
        }),
      [project.tasks, searchTerm, statusFilter, priorityFilter]
    );


    const groupedTasks = useMemo(() => {
      if (groupBy === "none") return { "Todas as Tarefas": filteredTasks };

      return filteredTasks.reduce((groups, task) => {
        let key: string;
        switch (groupBy) {
          case "status":
            key = task.status.replace("_", " ").toUpperCase();
            break;
          case "priority":
            key = task.priority.toUpperCase();
            break;
          case "assignee":
            key = task.assignedTo || "Não atribuído";
            break;
          default:
            key = "Outras";
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
        return groups;
      }, {} as Record<string, Task[]>);
    }, [filteredTasks, groupBy]);

    const handleDelegateTask = (taskId: string) => {
      const user = window.prompt("Delegar tarefa para quem?");
      if (user?.trim()) {
        onDelegateTask(taskId, user.trim());
      }
    };

    return (
      <div>
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onOpenAddTask}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Tarefa</span>
          </button>
        </div>

        {/* Filtros */}
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />

        {/* Agrupamento */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <label
              htmlFor="groupBy"
              className="text-sm font-medium text-gray-700"
            >
              Agrupar por:
            </label>
            <select
              id="groupBy"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="status">Status</option>
              <option value="priority">Prioridade</option>
              <option value="assignee">Responsável</option>
              <option value="none">Sem agrupamento</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredTasks.length} de {(project.tasks || []).length} tarefas
          </div>
        </div>

        {/* Lista */}
        {filteredTasks?.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {project.tasks?.length === 0
                ? "Nenhuma tarefa criada ainda"
                : "Nenhuma tarefa corresponde aos filtros"}
            </p>
            <button
              onClick={onOpenAddTask}
              className="bg-indigo-600 text-white rounded-lg px-6 py-3 hover:bg-indigo-700 transition-colors"
            >
              Criar Primeira Tarefa
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTasks).map(([groupName, tasks]) => (
              <div key={groupName}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  {groupName}
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {tasks.length}
                  </span>
                </h3>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleTask(task.id)}
                      onEdit={() => onEditTask(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                      onDelegate={() => handleDelegateTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
