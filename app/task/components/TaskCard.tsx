import { Calendar, CheckCircle, Circle, Edit, Flag, Timer, Trash2, User, Repeat } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types";

/**
 * Card de tarefa ajustado com delegação e schedule
 */
export const TaskCard: React.FC<{
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDelegate: () => void;
}> = ({ task, onToggle, onEdit, onDelete, onDelegate }) => {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "critica": return "bg-purple-100 text-purple-800 border-purple-200";
      case "alta": return "bg-red-100 text-red-800 border-red-200";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "baixa": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pendente": return "bg-gray-100 text-gray-800";
      case "em_andamento": return "bg-blue-100 text-blue-800";
      case "concluida": return "bg-green-100 text-green-800";
      case "atrasada": return "bg-red-100 text-red-800";
      case "delegada": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = new Date() > task.endDate && task.status !== "concluida";

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
        isOverdue ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {/* Toggle status */}
          <button onClick={onToggle} className="mt-1">
            {task.status === "concluida" ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <Circle className="text-gray-400 hover:text-green-500" size={24} />
            )}
          </button>

          {/* Título / descrição */}
          <div className="flex-1">
            <h4
              className={`font-semibold text-lg ${
                task.status === "concluida"
                  ? "line-through text-gray-500"
                  : "text-gray-900"
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-gray-600 text-sm mt-1">{task.description}</p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Status, prioridade e tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
            task.priority
          )}`}
        >
          <Flag size={12} className="inline mr-1" />
          {task.priority.toUpperCase()}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            task.status
          )}`}
        >
          {task.status.replace("_", " ").toUpperCase()}
        </span>
        {task.tags?.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Atribuição / datas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <User size={14} className="mr-1" />
            {task.assignedTo}
          </span>
          {task.delegatedTo && (
            <span className="flex items-center text-indigo-700">
              <User size={14} className="mr-1" />
              Delegada para: {task.delegatedTo}
            </span>
          )}
          {task.estimatedHours && (
            <span className="flex items-center">
              <Timer size={14} className="mr-1" />
              {task.estimatedHours}h
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Calendar size={14} className="mr-1" />
            {task.startDate.toLocaleDateString("pt-BR")} -{" "}
            {task.endDate.toLocaleDateString("pt-BR")}
          </span>
          <button
            onClick={onDelegate}
            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            Delegar
          </button>
        </div>
      </div>

      {/* Repetição (schedule) */}
      {task.schedule && task.schedule.repeat !== "nenhum" && (
        <div className="mt-2 flex items-center text-sm text-gray-700">
          <Repeat size={14} className="mr-1" />
          Repetição: {task.schedule.repeat}
          {task.schedule.until && (
            <span className="ml-2 text-gray-500">
              até {task.schedule.until.toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      )}

      {/* Aviso de atraso */}
      {isOverdue && (
        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
          ⚠️ Tarefa atrasada há{" "}
          {Math.ceil(
            (new Date().getTime() - task.endDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )}{" "}
          dias
        </div>
      )}
    </div>
  );
};
