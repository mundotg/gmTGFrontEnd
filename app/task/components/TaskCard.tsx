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
  Clock,
  AlertCircle,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Activity,
  Target,
  Users,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { ActionButton, Badge, IconButton, InfoCard } from "./componentDoSelect/otherComponent";

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDelegate: () => void;
  onValidateTask: (id: string, isValid: boolean, comment: string) => void;
}

const ValidationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isApproval: boolean;
}> = ({ isOpen, onClose, onConfirm, isApproval }) => {
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900">
          {isApproval ? "Validar Tarefa" : "Reprovar Tarefa"}
        </h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Adicione um comentário (opcional)"
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={4}
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              onConfirm(comment);
              setComment("");
              onClose();
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${isApproval ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
          >
            Confirmar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityConfig = (priority: TaskPriority) => {
    const configs: Record<TaskPriority, { bg: string, border: string, text: string, badge: string, flag: string }> = {
      critica: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
        badge: "bg-purple-100 text-purple-800 border-purple-300",
        flag: "bg-purple-600"
      },
      alta: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        badge: "bg-red-100 text-red-800 border-red-300",
        flag: "bg-red-600"
      },
      media: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        flag: "bg-amber-500"
      },
      baixa: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        flag: "bg-emerald-500"
      },
      urgente: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        flag: "bg-emerald-500"
      }
    };
    return configs[priority];
  };

  const getStatusConfig = (status: TaskStatus) => {
    const configs = {
      pendente: { badge: "bg-slate-100 text-slate-700 border-slate-300", label: "Pendente" },
      em_andamento: { badge: "bg-blue-100 text-blue-800 border-blue-300", label: "Em Andamento" },
      em_revisao: { badge: "bg-indigo-100 text-indigo-800 border-indigo-300", label: "Em Revisão" },
      bloqueada: { badge: "bg-orange-100 text-orange-800 border-orange-300", label: "Bloqueada" },
      concluida: { badge: "bg-green-100 text-green-800 border-green-300", label: "Concluída" },
      cancelada: { badge: "bg-red-100 text-red-800 border-red-300", label: "Cancelada" },
    };
    return configs[status] || configs.pendente;
  };

  const priorityConfig = getPriorityConfig(task.priority || "baixa");
  const statusConfig = getStatusConfig(task.status || "pendente");

  const isLate = new Date() > new Date(task.end_date) && !["concluida", "cancelada"].includes(task.status ?? "");
  const daysRemaining = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysRemaining <= 3 && daysRemaining >= 0 && task.status !== "concluida";

  const canValidate = task.is_validated == null && ["concluida", "bloqueada"].includes(task.status ?? "");
  const canDelegate = task.delegated_to_id == null && task.is_validated == null &&
    ["pendente", "em_andamento", "em_revisao", "bloqueada"].includes(task.status ?? "");

  const handleValidationClick = useCallback((approval: boolean) => {
    setIsApproval(approval);
    setShowValidationModal(true);
  }, []);

  const handleConfirmValidation = useCallback((comment: string) => {
    if (task.id) onValidateTask(task.id, isApproval, comment);
  }, [task.id, isApproval, onValidateTask]);

  const progressPercentage = task.completed_at ? 100 : 0;

  return (
    <>
      <div className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl ${isLate ? "border-red-300 bg-gradient-to-br from-red-50 via-white to-red-50" :
          isUrgent ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50" :
            `${priorityConfig.border} bg-white hover:border-indigo-400`
        }`}>

        {/* Header com Prioridade */}
        <div className={`${priorityConfig.bg} px-6 py-4 border-b-2 ${priorityConfig.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <button
                onClick={onToggle}
                className="mt-0.5 transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
                title={task.status === "concluida" ? "Marcar como pendente" : "Marcar como concluída"}
              >
                {task.status === "concluida" ? (
                  <CheckCircle className="text-green-600" size={28} strokeWidth={2.5} />
                ) : (
                  <Circle className="text-gray-400 hover:text-green-600 transition-colors" size={28} strokeWidth={2} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={`font-bold text-lg break-words ${task.status === "concluida" ? "line-through text-gray-500" : "text-gray-900"
                    }`}>
                    {task.title}
                  </h3>
                  <Badge icon={<Flag size={12} />} text={task.priority || ""} colorClass={priorityConfig.badge} />
                </div>

                {task.project && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                    <Target size={14} />
                    <span className="font-medium">{task.project.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <IconButton icon={<Edit size={18} />} onClick={onEdit} color="text-indigo-600" bgHover="bg-indigo-50" title="Editar" />
              <IconButton icon={<Trash2 size={18} />} onClick={onDelete} color="text-red-600" bgHover="bg-red-50" title="Excluir" />
              <div className="relative">
                <IconButton
                  icon={<MoreVertical size={18} />}
                  onClick={() => setShowMenu(!showMenu)}
                  color="text-gray-600"
                  bgHover="bg-gray-100"
                  title="Mais opções"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Description */}
          {task.description && (
            <p className="text-gray-700 text-sm leading-relaxed mb-4 break-words">
              {task.description}
            </p>
          )}

          {/* Progress Bar */}
          {progressPercentage > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Progresso</span>
                <span className="text-xs font-bold text-gray-900">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressPercentage === 100 ? "bg-green-600" :
                      progressPercentage >= 75 ? "bg-blue-600" :
                        progressPercentage >= 50 ? "bg-indigo-600" :
                          progressPercentage >= 25 ? "bg-amber-500" : "bg-red-500"
                    }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Status and Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge text={statusConfig.label} colorClass={statusConfig.badge} icon={<Activity size={12} />} />

            {task.delegated_user?.cargo && (
              <Badge text={task.delegated_user?.cargo.descricao || ""} colorClass="bg-slate-100 text-slate-700 border-slate-300" />
            )}

            {task.tags?.map((tag, i) => (
              <Badge key={i} text={`#${tag}`} colorClass="bg-indigo-50 text-indigo-700 border-indigo-200" />
            ))}
          </div>

          {/* Team & Time Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <InfoCard
              icon={<User size={16} className="text-indigo-600" />}
              label="Responsável"
              value={task.assigned_user?.nome || "Não atribuído"}
            />

            {task.delegated_user && (
              <InfoCard
                icon={<User size={16} className="text-purple-600" />}
                label="Delegado para"
                value={task.delegated_user?.nome || ""}
                highlight
              />
            )}

            <InfoCard
              icon={<Calendar size={16} className="text-blue-600" />}
              label="Prazo"
              value={new Date(task.end_date).toLocaleDateString("pt-BR")}
              subValue={isLate ? `Atrasado ${Math.abs(daysRemaining)} dias` :
                isUrgent ? `${daysRemaining} dias restantes` :
                  `${daysRemaining} dias restantes`}
              alert={isLate || isUrgent}
            />

            {task.estimated_hours && (
              <InfoCard
                icon={<Timer size={16} className="text-amber-600" />}
                label="Estimativa"
                value={`${task.estimated_hours}h`}
                subValue={task.start_date ? `${task.start_date}h realizadas` : undefined}
              />
            )}
          </div>

          {/* Repeat Schedule */}
          {task.schedule?.repeat && task.schedule.repeat !== "nenhum" && (
            <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-purple-700" />
                <span className="text-sm font-semibold text-purple-900">
                  Repetição: {task.schedule.repeat}
                  {task.schedule.until && ` até ${new Date(task.schedule.until).toLocaleDateString("pt-BR")}`}
                </span>
              </div>
            </div>
          )}

          {/* Alert Box */}
          {isLate && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-600 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-red-900">Tarefa Atrasada</p>
                  <p className="text-xs text-red-800 mt-1">
                    Atrasada há {Math.abs(daysRemaining)} dias. Ação imediata necessária.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isUrgent && !isLate && (
            <div className="mb-4 p-4 bg-amber-100 border-l-4 border-amber-600 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Prazo Próximo</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Vence em {daysRemaining} dias. Priorize esta tarefa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Metrics */}
          {(task.comentario_is_validated || task.is_validated) && (
            <div className="flex gap-4 mb-4 text-sm text-gray-600">
              {task.comentario_is_validated && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={16} />
                  <span>{task.comentario_is_validated} comentários</span>
                </div>
              )}
              {task.comentario_is_validated && (
                <div className="flex items-center gap-1.5">
                  <Paperclip size={16} />
                  <span>{task.comentario_is_validated} anexos</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {(canValidate || canDelegate) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-100">
              {canValidate && (
                <>
                  <ActionButton
                    icon={<CheckCircle size={16} />}
                    label="Aprovar"
                    color="green"
                    onClick={() => handleValidationClick(true)}
                  />
                  <ActionButton
                    icon={<AlertCircle size={16} />}
                    label="Reprovar"
                    color="red"
                    onClick={() => handleValidationClick(false)}
                  />
                </>
              )}
              {canDelegate && (
                <ActionButton
                  icon={<Users size={16} />}
                  label="Delegar Tarefa"
                  color="indigo"
                  onClick={onDelegate}
                />
              )}
            </div>
          )}
        </div>

        {/* Corner Priority Flag */}
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[60px] border-l-[60px] border-l-transparent"
          style={{ borderTopColor: priorityConfig.flag.replace('bg-', '#') }}>
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
export default React.memo(TaskCard);