"use client";
import React from "react";
import { Modal } from "./modalComponent";
import { Task, TaskModalProps, TaskPriority } from "../types";

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  editingTask,
  formError,
  defaultAssignedTo,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      title={editingTask ? "Editar Tarefa" : "Nova Tarefa"}
      onClose={onClose}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          const startDate = new Date(formData.get("startDate") as string);
          const endDate = new Date(formData.get("endDate") as string);
          const repeatUntil = formData.get("repeatUntil")
            ? new Date(formData.get("repeatUntil") as string)
            : undefined;

          // 🔹 Validações
          if (endDate < startDate) {
            alert("A data final não pode ser anterior à data inicial.");
            return;
          }

          if (repeatUntil && repeatUntil < endDate) {
            alert("A data de repetição deve ser maior ou igual à data final.");
            return;
          }

          const data: Task = {
            id: editingTask?.id ?? "",
            title: formData.get("title") as string,
            description: (formData.get("description") as string) || "",
            priority: (formData.get("priority") as TaskPriority) || "media",
            assignedTo:
              (formData.get("assignedTo") as string) || defaultAssignedTo || "",
            delegatedTo: (formData.get("delegatedTo") as string) || undefined,
            startDate,
            endDate,
            estimatedHours: formData.get("estimatedHours")
              ? parseFloat(formData.get("estimatedHours") as string)
              : undefined,
            tags: formData.get("tags")
              ? (formData.get("tags") as string)
                  .split(",")
                  .map((t) => t.trim())
              : [],
            status: editingTask?.status ?? "pendente",
            createdBy: "",
            schedule: {
              repeat:
                (formData.get("repeat") as
                  | "nenhum"
                  | "diario"
                  | "semanal"
                  | "mensal") || "nenhum",
              until: repeatUntil,
            },
          };

          onSubmit(data);
        }}
        className="space-y-6"
      >
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título da Tarefa *
          </label>
          <input
            type="text"
            name="title"
            defaultValue={editingTask?.title || ""}
            placeholder="Ex: Implementar sistema de login"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            name="description"
            defaultValue={editingTask?.description || ""}
            placeholder="Detalhe os requisitos e especificações da tarefa..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Prioridade + Responsável */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridade *
            </label>
            <select
              name="priority"
              defaultValue={editingTask?.priority || "media"}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="baixa">🟢 Baixa</option>
              <option value="media">🟡 Média</option>
              <option value="alta">🔴 Alta</option>
              <option value="critica">🟣 Crítica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável
            </label>
            <input
              type="text"
              name="assignedTo"
              defaultValue={
                editingTask?.assignedTo || defaultAssignedTo || ""
              }
              placeholder="Nome do responsável"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Delegar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delegar para
          </label>
          <input
            type="text"
            name="delegatedTo"
            defaultValue={editingTask?.delegatedTo || ""}
            placeholder="Nome da pessoa delegada"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data/Hora de Início *
            </label>
            <input
              type="datetime-local"
              name="startDate"
              defaultValue={
                editingTask
                  ? new Date(
                      editingTask.startDate.getTime() -
                        editingTask.startDate.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : new Date(
                      Date.now() - new Date().getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data/Hora Final *
            </label>
            <input
              type="datetime-local"
              name="endDate"
              defaultValue={
                editingTask
                  ? new Date(
                      editingTask.endDate.getTime() -
                        editingTask.endDate.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : new Date(
                      Date.now() +
                        7 * 24 * 60 * 60 * 1000 -
                        new Date().getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Estimativa + Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimativa (horas)
            </label>
            <input
              type="number"
              name="estimatedHours"
              defaultValue={editingTask?.estimatedHours || ""}
              placeholder="Ex: 8"
              min="0.5"
              step="0.5"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              name="tags"
              defaultValue={editingTask?.tags?.join(", ") || ""}
              placeholder="frontend, urgente, bug"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repetição da Tarefa
          </label>
          <select
            name="repeat"
            defaultValue={editingTask?.schedule?.repeat || "nenhum"}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="nenhum">Nenhum</option>
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>

          <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">
            Repetir até
          </label>
          <input
            type="date"
            name="repeatUntil"
            defaultValue={
              editingTask?.schedule?.until
                ? new Date(
                    editingTask.schedule.until.getTime() -
                      editingTask.schedule.until.getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .slice(0, 10)
                : ""
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Erros */}
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{formError}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            {editingTask ? "Atualizar Tarefa" : "Criar Tarefa"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
