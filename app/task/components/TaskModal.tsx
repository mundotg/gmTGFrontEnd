import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  User,
  Layers,
  X,
  Tag,
  TrendingUp,
  Repeat,
} from "lucide-react";
import { TaskCreate, TaskModalProps, TaskPriority, TaskRepeat, TaskStatus } from "../types";
import { useSessionTask } from "../contexts/UserContext";
import { useTaskModalData, useDateUtils } from "../hook/useTaskModal";
import { SelectComp } from "./select_Component";
import {
  DEFAULT_TASK_DURATION,
  PRIORITY_OPTIONS,
  REPEAT_OPTIONS,
  STATUS_OPTIONS,
} from "../costant";
import usePersistedState from "@/hook/localStoreUse";

interface TaskModalPropsExtended extends TaskModalProps {
  isLoading?: boolean;
  projectId: string;
  sprintid?: string | null;
}

// 🔥 NOVA INTERFACE para substituir o uso de 'any'
interface FormChanges {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
  estimatedHours?: number | string;
  tags?: string;
  status?: TaskStatus;
  isValidated?: boolean;
  assignedToId?: string;
  delegatedToId?: string;
  sprintId?: string;
  repeat?: TaskRepeat;
  repeat_until?: string | Date;
}

export const TaskModal: React.FC<TaskModalPropsExtended> = ({
  projectId,
  sprintid,
  isOpen,
  editingTask,
  formError,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const { user } = useSessionTask();
  const { formatDateTimeLocal } = useDateUtils();
  const { fetchSprints, fetchUsers } = useTaskModalData(projectId, editingTask);

  // Estados principais - COM TIPO CORRETO
  const [formChanges, setFormChanges, clearKey] = usePersistedState<FormChanges>("task-data-form", {});
  const [localError, setLocalError] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(!!editingTask);
  const [showSchedule, setShowSchedule] = useState(false);

  const [selectedSprint, setSelectedSprint] = useState(editingTask?.sprint_id || sprintid || "");
  const [selectedDelegatedTo, setSelectedDelegatedTo] = useState(editingTask?.delegated_to_id || "");
  const [selectedAssignedTo, setSelectedAssignedTo] = useState(editingTask?.assigned_to_id || user?.id || "");
  const dataCurrentDefaul = useMemo(() => new Date(), [isOpen, projectId, sprintid])
  const dataEndDefaul = useMemo(() => new Date(dataCurrentDefaul.getTime() + DEFAULT_TASK_DURATION), [dataCurrentDefaul])


  // 📋 Handler genérico para inputs - SEM 'any'
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      let newValue: string | number | null = value;

      if (type === "number") newValue = value ? parseInt(value) : null;
      else if (type === "datetime-local") newValue = value || null;
      else if (value === "") newValue = null;

      setFormChanges((prev) => (prev[name as keyof FormChanges] === newValue ? prev : { ...prev, [name]: newValue }));
    },
    [setFormChanges]
  );

  // ⚙️ Validação local - MANTIDO (já está correto)
  const validateForm = useCallback(( formChanges: TaskCreate) => {
    const title = formChanges.title ?? editingTask?.title;
    if (!title?.trim()) {
      setLocalError("O título da tarefa é obrigatório");
      return false;
    }

    const start = formChanges.startDate ?? editingTask?.start_date;
    const end = formChanges.endDate ?? editingTask?.end_date ?? formChanges.endDate ?? editingTask?.end_date;
    if (!start) {
      setLocalError("A data de é obrigatório");
      return false;
    }

    if (end && new Date(start) > new Date(end)) {
      setLocalError("A data de início não pode ser posterior à data de término");
      return false;
    }

    if (formChanges.estimatedHours !== undefined && Number(formChanges.estimatedHours) < 0) {
      {
        setLocalError("As horas estimadas devem ser um valor positivo");
        return false;
      }
    }

    // Validar assigned_to_id
    const assignedTo = formChanges.assignedToId ?? selectedAssignedTo;
    if (!assignedTo) {
      setLocalError("É necessário atribuir a tarefa a um usuário");
      return false;
    }

    setLocalError(null);
    return true;
  }, [editingTask, selectedAssignedTo]);

  // 📨 Submit corrigido - MANTIDO (já está correto)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      

      // Preparar dados para o backend
      const taskData: TaskCreate = {
        // Campos para criação
        ...(!editingTask && {
          projectId: projectId,
          createdById: user?.id, // Campo obrigatório do backend
        }),

        // Campos para edição
        ...(editingTask && {
          id: editingTask.id,
        }),

        // Campos do formulário (usando aliases do backend)
        title: formChanges.title || editingTask?.title?.trim() || "",
        description: (formChanges.description?.trim() || editingTask?.description)?.trim(),
        priority: formChanges.priority || editingTask?.priority || "media",

        // Datas (usando aliases)
        startDate: formChanges.startDate || editingTask?.start_date || dataCurrentDefaul,
        endDate: formChanges.endDate || editingTask?.end_date || dataEndDefaul,
        sprintId: formChanges.sprintId || selectedSprint || sprintid || undefined,
        // Campos numéricos
        estimatedHours: formChanges.estimatedHours || editingTask?.estimated_hours,
        createdById : editingTask?.created_by_id || user?.id,
        // Arrays
        tags: formChanges.tags
          ? formChanges.tags?.split(",").map((t: string) => t.trim()).filter(Boolean)
          : editingTask?.tags || [],

        // Status e validação
        status: formChanges.status || editingTask?.status || "pendente",
        isValidated: formChanges.isValidated || editingTask?.is_validated,

        // Relacionamentos (usando aliases)
        assignedToId: formChanges.assignedToId || selectedAssignedTo || editingTask?.assigned_to_id || editingTask?.assigned_to_id || "",
        delegatedToId: formChanges.delegatedToId || selectedDelegatedTo || editingTask?.delegated_to_id || editingTask?.delegated_to_id,

      };

      if (!validateForm(taskData)) return;

      // Tratamento do schedule
      if (showSchedule) {
        const repeat = formChanges.repeat ?? editingTask?.schedule?.repeat;
        const until = formChanges.repeat_until ?? editingTask?.schedule?.until;

        if (repeat && repeat !== "nenhum") {
          taskData.schedule = {
            repeat,
            ...(until && { until })
          };
        }
      }

      // console.log("Dados enviados para o backend:", taskData);

      try {
        await onSubmit(taskData);
        if (!localError) {
          setFormChanges({});
          clearKey()
        }
      } catch (error) {
        setLocalError("Erro ao salvar a tarefa. Tente novamente.");
        console.error("Erro no submit:", error);
      }
    },
    [formChanges, editingTask, projectId, user, selectedAssignedTo, selectedDelegatedTo, selectedSprint, showSchedule, validateForm, onSubmit, setFormChanges]
  );

  // 🔒 ESC para fechar - MANTIDO (já está correto)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);
  // 🔄 Resetar formulário ao abrir modal - DEPENDÊNCIAS CORRETAS
  const handleClose = useCallback(() => {
    clearKey()
    setFormChanges({})
    localStorage.removeItem("task-data-form");
    editingTask = undefined
    onClose()
  }, [setFormChanges, editingTask])

  useEffect(() => {
    if (isOpen) {

      setFormChanges({});
      setSelectedSprint(editingTask?.sprint_id || sprintid || "");
      setSelectedDelegatedTo(editingTask?.delegated_to_id || "");
      setSelectedAssignedTo(editingTask?.assigned_to_id || user?.id || "");
      setLocalError(null);
      setShowAdvancedFields(!!editingTask);
      setShowSchedule(!!editingTask?.schedule?.repeat && editingTask.schedule.repeat !== "nenhum");
    }
  }, [isOpen, editingTask, user, setFormChanges, sprintid]); // ✅ CORRIGIDO: incluir setFormChanges e sprintid

  // 🧩 Mudanças não salvas - MANTIDO (já está correto)
  const hasUnsavedChanges = useMemo(
    () => Object.keys(formChanges).length > 0,
    [formChanges]
  );

  if (!isOpen) {
    return null;
  }

  // 🔥 RESTANTE DO JSX PERMANECE IGUAL (já está bem estruturado)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {(localError || formError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {localError || formError}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formChanges.title || editingTask?.title || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              autoFocus={!editingTask}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              name="description"
              value={formChanges.description || editingTask?.description || ""}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-md p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <TrendingUp size={16} /> Prioridade
            </label>
            <select
              name="priority"
              value={formChanges.priority || editingTask?.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Atribuído a (Obrigatório) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <User size={16} /> criado por a*
            </label>
            <SelectComp
              value={selectedAssignedTo}
              disabled={!editingTask}
              onChange={(val) => {
                setSelectedAssignedTo(val);
                setFormChanges((prev) => ({ ...prev, assignedToId: val }));
              }}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              fetchOptions={fetchUsers}
            />
          </div>

          {/* Delegado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <User size={16} /> Delegado para
            </label>
            <SelectComp
              value={selectedDelegatedTo}
              onChange={(val) => {
                setSelectedDelegatedTo(val);
                setFormChanges((prev) => ({ ...prev, delegatedToId: val }));
              }}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              fetchOptions={fetchUsers}
            />
          </div>

          {/* Sprint */}
          {!sprintid && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Layers size={16} /> Sprint
            </label>
            <SelectComp


              onChange={(val) => {
                setSelectedSprint(val);
                setFormChanges((prev) => ({ ...prev, sprintId: val }));
              }}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              fetchOptions={fetchSprints}
              value={selectedSprint}
              disabled={!!sprintid}
            />
          </div>}

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={16} /> Início
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formChanges.startDate || (formatDateTimeLocal(editingTask?.start_date || dataCurrentDefaul))}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock size={16} /> Término *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formChanges.endDate || formatDateTimeLocal(editingTask?.end_date || dataEndDefaul)}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Toggle avançado */}
          <button
            type="button"
            onClick={() => setShowAdvancedFields((prev) => !prev)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvancedFields ? (
              <>
                <ChevronUp size={16} /> Ocultar campos avançados
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Mostrar campos avançados
              </>
            )}
          </button>

          {showAdvancedFields && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formChanges.status || editingTask?.status || "pendente"}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {/* <s.icon /> */}{s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repetição */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Repeat size={16} className="text-indigo-600" />
                    Repetição da Tarefa
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {showSchedule ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                {showSchedule && (
                  <div className="space-y-3">
                    <select
                      name="repeat"
                      // defaultValue={editingTask?.schedule?.repeat || "nenhum"}
                      value={formChanges.repeat || editingTask?.schedule?.repeat || "nenhum"}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoading}
                    >
                      {REPEAT_OPTIONS.map((r, i) => (
                        <option key={r.value + i} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Repetir até
                      </label>
                      <input
                        type="datetime-local"
                        name="repeat_until"
                        value={formatDateTimeLocal(formChanges.repeat_until) || (editingTask?.schedule?.until ? formatDateTimeLocal(editingTask.schedule.until)
                          : "")}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Estimativa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Clock size={16} /> Horas Estimadas
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={(formChanges.estimatedHours) || editingTask?.estimated_hours || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Tag size={16} /> Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formChanges.tags || (Array.isArray(editingTask?.tags) ? editingTask.tags.join(", ") : editingTask?.tags || "")}
                  onChange={handleChange}
                  placeholder="frontend, backend, urgente"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe as tags com vírgulas
                </p>
              </div>
            </div>
          )}
        </form>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <span className="text-xs text-gray-500">
            {hasUnsavedChanges && "Alterações não salvas"}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Tarefa"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};