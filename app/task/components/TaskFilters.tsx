import { Search, Filter } from "lucide-react";
import { TaskPriority, TaskStatus } from "../types";

/**
 * Props do componente de filtros
 */
interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: TaskStatus | "";
  onStatusFilterChange: (status: TaskStatus | "") => void;
  priorityFilter: TaskPriority | "";
  onPriorityFilterChange: (priority: TaskPriority | "") => void;
}

/**
 * Componente de filtros para tarefas
 */
export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
      <div className="flex items-center mb-3 text-gray-600 text-sm font-medium">
        <Filter size={16} className="mr-2" />
        Filtros
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
          />
        </div>

        {/* Filtro Status */}
        <select
          value={statusFilter}
          onChange={(e) =>
            onStatusFilterChange(e.target.value as TaskStatus | "")
          }
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="atrasada">Atrasada</option>
          <option value="delegada">Delegada</option>
        </select>

        {/* Filtro Prioridade */}
        <select
          value={priorityFilter}
          onChange={(e) =>
            onPriorityFilterChange(e.target.value as TaskPriority | "")
          }
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todas as prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </div>
    </div>
  );
};
