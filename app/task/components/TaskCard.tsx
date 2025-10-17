"use client";
import React, { useState, useCallback } from "react";
import {
  Calendar,
  CheckCircle,
  Circle,
  Edit,
  Flag,
  Timer,
  Trash2,
  User,
  Repeat,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { safeDateTime2 } from "../utils";
import { ValidationModal } from "./ValidationModal";

// -----------------------------
// Card de Tarefa Principal
// -----------------------------
interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDelegate: () => void;
  onValidateTask: (id: string, isValid: boolean, comment: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onDelegate,
  onValidateTask,
}) => {
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isApproval, setIsApproval] = useState(true);

  // Mapeamentos de estilo com useMemo
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "critica": return "bg-purple-100 text-purple-800 border-purple-300";
      case "alta": return "bg-red-100 text-red-800 border-red-300";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "baixa": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pendente": return "bg-gray-100 text-gray-700 border-gray-300";
      case "em_andamento": return "bg-blue-100 text-blue-800 border-blue-300";
      case "concluida": return "bg-green-100 text-green-800 border-green-300";
      case "cancelada": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };
  const isLate =
    new Date() > new Date(task.end_date) &&
    !["concluida", "cancelada"].includes(task.status ?? "");

  const canValidate =
    task.is_validated == null &&
    ["concluida", "bloqueada"].includes(task.status ?? "");

  const canDelegate =
    task.delegated_to_id == null &&
    task.is_validated == null &&
    ["pendente", "em_andamento", "em_revisao", "bloqueada"].includes(task.status ?? "");

  const handleValidationClick = useCallback((approval: boolean) => {
    setIsApproval(approval);
    setShowValidationModal(true);
  }, []);

  const handleConfirmValidation = useCallback(
    (comment: string) => {
      if (task.id) onValidateTask(task.id, isApproval, comment);
    },
    [task.id, isApproval, onValidateTask]
  );

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isLate
          ? "border-red-300 bg-gradient-to-br from-red-50 to-white"
          : "border-gray-200 bg-white hover:border-indigo-300"
          }`}
      >
        {/* Bandeira de Prioridade */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className={`absolute transform rotate-45 ${task.priority === "critica" ? "bg-purple-500" :
            task.priority === "alta" ? "bg-red-500" :
              task.priority === "media" ? "bg-yellow-500" :
                "bg-green-500"
            } text-white text-xs font-bold py-1 px-8 top-4 right-[-32px] shadow-md`}>
          </div>
        </div>

        <div className="p-5">
          {/* Cabeçalho */}
          <div className="flex items-start gap-3 mb-4">
            <button
              onClick={onToggle}
              className="mt-1 transition-transform hover:scale-110 active:scale-95"
            >
              {task.status === "concluida" ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <Circle
                  className="text-gray-400 hover:text-green-500 transition-colors"
                  size={28}
                />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h4
                className={`font-bold text-xl mb-1 break-words ${task.status === "concluida"
                  ? "line-through text-gray-500"
                  : "text-gray-900 group-hover:text-indigo-700 transition-colors"
                  }`}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="text-gray-600 text-sm leading-relaxed break-words">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Tags e Status */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 flex items-center gap-1 ${getPriorityColor(task.priority || "baixa")
                }`}
            >
              <Flag size={12} />
              {task.priority?.toUpperCase()}
            </span>

            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${getStatusColor(task.status || "pendente")
                }`}
            >
              {task.status?.replace("_", " ").toUpperCase()}
            </span>

            {task.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Info Principal */}
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-4 text-sm">
              {task.assigned_to_id && (
                <InfoBadge icon={<User size={14} />} text={task.assigned_to_id} />
              )}
              {task.delegated_to_id && (
                <InfoBadge
                  icon={<User size={14} />}
                  text={`→ ${task.delegated_to_id}`}
                  className="text-indigo-700 bg-indigo-50 border border-indigo-200"
                />
              )}
              {task.estimated_hours && (
                <InfoBadge
                  icon={<Timer size={14} />}
                  text={`${task.estimated_hours}h`}
                />
              )}
            </div>

            <InfoBadge
              icon={<Calendar size={14} className="text-gray-500" />}
              text={`${safeDateTime2(task.start_date || "")} → ${safeDateTime2(
                task.end_date || ""
              )}`}
              className="bg-gray-50"
            />

            {task.schedule?.repeat !== "nenhum" && (
              <InfoBadge
                icon={<Repeat size={14} />}
                text={`Repetição: ${task.schedule?.repeat}${task.schedule?.until
                  ? ` até ${new Date(
                    task.schedule.until
                  ).toLocaleDateString("pt-BR")}`
                  : ""
                  }`}
                className="text-purple-700 bg-purple-50 border border-purple-200"
              />
            )}
          </div>

          {isLate && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm font-semibold text-red-800">
                ⚠️ Atrasada há{" "}
                {Math.ceil(
                  (Date.now() - new Date(task.end_date!).getTime()) /
                  (1000 * 60 * 60 * 24)
                )}{" "}
                dias
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">

            {canValidate && <div>
              <ActionButton
                label="✅ Validar"
                color="green"
                onClick={() => handleValidationClick(true)}
              />
              <ActionButton
                label="❌ Reprovar"
                color="red"
                onClick={() => handleValidationClick(false)}
              />
            </div>}
            {canDelegate && <ActionButton
              label="👤 Delegar"
              color="indigo"
              onClick={onDelegate}
            />}
          </div>
        </div>
      </div>

      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onConfirm={handleConfirmValidation}
        isApproval={isApproval}
      />
    </>
  );
};

// -----------------------------
// Subcomponentes Reutilizáveis
// -----------------------------
const InfoBadge = ({
  icon,
  text,
  className = "text-gray-700 bg-gray-50",
}: {
  icon: React.ReactNode;
  text: string;
  className?: string;
}) => (
  <span
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${className}`}
  >
    {icon}
    {text}
  </span>
);

const ActionButton = ({
  label,
  color,
  onClick,
}: {
  label: string;
  color: "green" | "red" | "indigo";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all active:scale-95 hover:shadow-md text-white bg-${color}-600 hover:bg-${color}-700`}
  >
    {label}
  </button>
);

export default React.memo(TaskCard);
