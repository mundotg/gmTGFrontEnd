"use client";
import React, { JSX, memo, useMemo } from "react";
import { AlertCircle, Target } from "lucide-react";
import { Task } from "../types";
import TaskCard from "../components/TaskCard";

// -----------------------------
// Tipos auxiliares
// -----------------------------
type ColorKey =
  | "blue"
  | "green"
  | "orange"
  | "yellow"
  | "red"
  | "purple"
  | "indigo";

interface TaskGroupProps {
  groupName: string;
  groupTasks: Task[];
  groupProgress: number;
  isBacklog?: boolean;
  isSprint?: boolean;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDelegateTask: (id: string) => void;
  onValidateTask: (id: string, isvalidar: boolean, comentario:string) => void
}

// -----------------------------
// Componente: Grupo de Tarefas
// -----------------------------
export const TaskGroup = memo(
  ({
    groupName,
    groupTasks,
    groupProgress,
    isBacklog,
    isSprint,
    onToggleTask,
    onEditTask,
    onDeleteTask,
    onValidateTask,
    onDelegateTask,
  }: TaskGroupProps): JSX.Element => {

    console.log(groupTasks)
    const styles = useMemo(() => {
      if (isBacklog)
        return {
          borderColor: "border-orange-200",
          bgGradient: "from-orange-50 to-orange-100",
          barColor: "bg-orange-500",
        };
      if (isSprint)
        return {
          borderColor: "border-indigo-200",
          bgGradient: "from-indigo-50 to-indigo-100",
          barColor: "bg-indigo-500",
        };
      return {
        borderColor: "border-gray-200",
        bgGradient: "from-gray-50 to-gray-100",
        barColor: "bg-gray-400",
      };
    }, [isBacklog, isSprint]);

    const completedTasks = useMemo(
      () => groupTasks.filter((t) => t.status === "concluida").length,
      [groupTasks]
    );

    return (
      <div
        className={`flex w-screen align-middle text-center justify-center overflow-y-auto bg-white rounded-xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${styles.borderColor}`}
      >
        {/* Cabeçalho */}
        <div className={`px-4  py-4 bg-gradient-to-r ${styles.bgGradient}`}>
          <div className="justify-between mb-3">
            <div className=" items-center gap-3">
              <h3 className="text-lg font-bold text-gray-800">{groupName}</h3>
              <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 border shadow-sm">
                {groupTasks.length} tarefa{groupTasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-gray-600">
                {groupProgress}%
              </div>
              <div className="text-xs text-gray-500">concluído</div>
            </div>
          </div>

          {groupTasks.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${styles.barColor}`}
                  style={{ width: `${groupProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 font-medium min-w-[60px]">
                {completedTasks}/{groupTasks.length}
              </div>
            </div>
          )}
        </div>

        {/* Corpo */}
        <div className="p-4">
          {groupTasks.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm italic bg-gray-50 rounded-lg">
              Nenhuma tarefa neste grupo
            </p>
          ) : (
            <div className="space-y-3 w-full">
              {groupTasks.map((task) => (
                <TaskCard
                // onGenerateReport={()=>{}}
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task.id!)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id!)}
                  onDelegate={() => onDelegateTask(task.id!)}
                  onValidateTask={onValidateTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
TaskGroup.displayName = "TaskGroup";

// -----------------------------
// Cores globais
// -----------------------------
const colorClasses: Record<ColorKey, string> = {
  blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
  green: "from-green-50 to-green-100 border-green-200 text-green-700",
  orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
  yellow: "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700",
  red: "from-red-50 to-red-100 border-red-200 text-red-700",
  purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
  indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700",
};

// -----------------------------
// Componente: Cartão de Estatística
// -----------------------------
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: ColorKey;
  description?: string;
  isHours?: boolean;
}

export const StatCard = memo(
  ({
    label,
    value,
    icon,
    color,
    description,
    isHours = false,
  }: StatCardProps): JSX.Element => (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl px-4 py-1 border shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{label}</span>
        </div>
      </div>
      <p className="text-2xl font-bold mb-1">
        {isHours ? `${value}h` : value}
      </p>
      {description && (
        <p className="text-xs text-gray-600 opacity-80">{description}</p>
      )}
    </div>
  )
);
StatCard.displayName = "StatCard";

// -----------------------------
// Estados de carregamento, erro e vazio
// -----------------------------
export const LoadingState = memo((): JSX.Element => (
  <div className="flex items-center justify-center py-16">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Carregando tarefas...</p>
      <p className="text-gray-400 text-sm mt-1">
        Isso pode levar alguns instantes
      </p>
    </div>
  </div>
));
LoadingState.displayName = "LoadingState";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState = memo(
  ({ error, onRetry }: ErrorStateProps): JSX.Element => (
    <div className="text-center py-16 bg-white rounded-xl border">
      <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
      <p className="text-red-600 font-medium text-lg mb-2">
        Erro ao carregar tarefas
      </p>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
      <button
        onClick={onRetry}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  )
);
ErrorState.displayName = "ErrorState";

interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreateTask: () => void;
}

export const EmptyState = memo(
  ({
    hasActiveFilters,
    onClearFilters,
    onCreateTask,
  }: EmptyStateProps): JSX.Element => (
    <div className="text-center py-16 bg-white rounded-xl border">
      <Target size={64} className="text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg font-medium mb-2">
        {hasActiveFilters
          ? "Nenhuma tarefa encontrada"
          : "Nenhuma tarefa criada"}
      </p>
      <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
        {hasActiveFilters
          ? "Tente ajustar os filtros ou limpar a busca para ver mais resultados."
          : "Comece criando a primeira tarefa do projeto."}
      </p>
      <div className="flex gap-3 justify-center">
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        )}
        <button
          onClick={onCreateTask}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Criar Primeira Tarefa
        </button>
      </div>
    </div>
  )
);
EmptyState.displayName = "EmptyState";
