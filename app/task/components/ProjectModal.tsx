"use client";
import React, { useMemo } from "react";
import { Modal } from "./modalComponent";
import { useSession } from "@/context/SessionContext";
import { Project } from "../types";

interface ProjectModalProps {
  isOpen: boolean;
  editingProject: Project | null;
  formError: string | null;
  onClose: () => void;
  onSubmit: (data: Project) => void;
}

const normalizeDateInput = (date?: Date): string => {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  editingProject,
  formError,
  onClose,
  onSubmit,
}) => {
  const { user } = useSession();

  const defaultDueDate = useMemo(
    () => normalizeDateInput(editingProject?.due_date),
    [editingProject?.due_date]
  );

  const defaultCreatedAt = useMemo(
    () => normalizeDateInput(editingProject?.created_at || new Date()),
    [editingProject?.created_at]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const project: Project = {
      id: editingProject?.id || Math.random().toString(36).substr(2, 9),
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string)?.trim() || "",
      team: formData.get("team")
        ? (formData.get("team") as string)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      due_date: formData.get("dueDate")
        ? new Date(formData.get("dueDate") as string)
        : undefined,
      owner: (formData.get("owner") as string) || user?.nome || "Desconhecido",
      created_at: formData.get("created_at")
        ? new Date(formData.get("created_at") as string)
        : new Date(),
      tasks: editingProject?.tasks || [],
    };

    onSubmit(project);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={editingProject ? "Editar Projeto" : "Novo Projeto"}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Projeto *
          </label>
          <input
            type="text"
            name="name"
            defaultValue={editingProject?.name || ""}
            placeholder="Ex: Sistema de Vendas"
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
            defaultValue={editingProject?.description || ""}
            placeholder="Descreva o objetivo e escopo do projeto..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Equipe + Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipe (separados por vírgula)
            </label>
            <input
              type="text"
              name="team"
              defaultValue={editingProject?.team.join(", ") || ""}
              placeholder="João, Maria, Pedro"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Entrega
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              defaultValue={defaultDueDate}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Owner + Created At */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criado por
            </label>
            <input
              type="text"
              name="owner"
              defaultValue={editingProject?.owner || user?.nome || ""}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Criação
            </label>
            <input
              type="datetime-local"
              name="created_at"
              defaultValue={defaultCreatedAt}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100"
              readOnly
            />
          </div>
        </div>

        {/* Erros */}
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{formError}</p>
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
            {editingProject ? "Atualizar Projeto" : "Criar Projeto"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
