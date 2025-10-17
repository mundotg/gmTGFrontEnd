"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, CheckCircle, Eye, Pencil, Save, X } from "lucide-react";
import { useSessionTask } from "../contexts/UserContext";
import { Modal } from "./modalComponent";
import { Sprint } from "../types";
import { safeDateTime } from "../utils";
import { DEFAULT_TASK_DURATION } from "../costant";

interface ProjectOption {
  id: string;
  name: string;
}

interface SprintModalProps {
  isOpen: boolean;
  project?: { projectId: string; name: string };
  sprint?: Sprint;
  mode: "create" | "edit" | "view";
  onClose: () => void;
  onUpdated: () => void;
}

interface FormState {
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  projectId: string;
}

export const SprintModal: React.FC<SprintModalProps> = ({
  isOpen,
  project,
  sprint,
  mode,
  onClose,
  onUpdated,
}) => {
  const { api } = useSessionTask();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  
  // Datas padrão memorizadas
  const dataCurrentDefault = useMemo(() => {
    return new Date();
  }, [isOpen, mode]);

  const dataEndDefault = useMemo(() => {
    return new Date(dataCurrentDefault.getTime() + DEFAULT_TASK_DURATION)
  }, [dataCurrentDefault]);

  // Estado inicial do formulário
  const initialFormState: FormState = useMemo(() => ({
    name: "",
    goal: "",
    start_date: safeDateTime(dataCurrentDefault),
    end_date: safeDateTime(dataEndDefault),
    projectId: project?.projectId || "",
  }), [dataCurrentDefault, dataEndDefault, project?.projectId]);

  const [form, setForm] = useState<FormState>(initialFormState);
  const [originalForm, setOriginalForm] = useState<FormState>(initialFormState);

  const readOnly = mode === "view";

  // 🔹 Carrega projetos para modo edit/create
  useEffect(() => {
    const loadProjects = async () => {
      if (mode !== "view") {
        try {
          const { data } = await api.get("/projects");
          setProjects(data);
        } catch (err) {
          console.error("Erro ao carregar projetos:", err);
          setError("Erro ao carregar lista de projetos.");
        }
      }
    };

    if (isOpen) {
      loadProjects();
    }
  }, [api, mode, isOpen]);

  // 🔹 Popular dados da sprint e detectar alterações
  useEffect(() => {
    if (isOpen) {
      let newForm: FormState;

      if ((mode === "edit" || mode === "view") && sprint) {
        newForm = {
          name: sprint.name || "",
          goal: sprint.goal || "",
          start_date:  safeDateTime( sprint.start_date || dataCurrentDefault) ,
          end_date:  safeDateTime(sprint.end_date || dataEndDefault),
          projectId: sprint.project_id || project?.projectId || "",
        };
      } else {
        newForm = { ...initialFormState };
      }

      setForm(newForm);
      setOriginalForm(newForm);
      setHasChanges(false);
      setError(null);
    }
  }, [sprint, mode, project, isOpen, dataCurrentDefault, dataEndDefault, initialFormState]);

  // 🔹 Detectar alterações no formulário
  useEffect(() => {
    if (isOpen && mode !== "create") {
      const changesDetected = 
        form.name !== originalForm.name ||
        form.goal !== originalForm.goal ||
        form.start_date !== originalForm.start_date ||
        form.end_date !== originalForm.end_date ||
        form.projectId !== originalForm.projectId;
      
      setHasChanges(changesDetected);
    } else if (mode === "create") {
      // No modo create, considera que há alterações se algum campo obrigatório estiver preenchido
      const hasContent = form.name.trim() !== "" || form.goal.trim() !== "";
      setHasChanges(hasContent);
    }
  }, [form, originalForm, mode, isOpen]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (readOnly) return;
    
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  }, [readOnly]);

  const handleSubmit = async () => {
    if (readOnly) return;

    // Validações
    if (!form.name.trim()) {
      setError("O nome da sprint é obrigatório");
      return;
    }

    if (!form.end_date) {
      setError("A data de término é obrigatória");
      return;
    }

    if (!form.projectId) {
      setError("Selecione um projeto");
      return;
    }

    // Validar datas
    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    
    if (endDate <= startDate) {
      setError("A data de término deve ser posterior à data de início");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        goal: form.goal.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        project_id: form.projectId,
      };

      if (mode === "create") {
        await api.post(`/sprints/${form.projectId}`, payload);
      } else if (mode === "edit" && sprint) {
        await api.put(`/sprints/${sprint.id}`, payload);
      }

      onUpdated();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Erro ao salvar sprint:", err);
      setError(err.response?.data?.detail || "Erro ao salvar sprint");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (hasChanges && !isSubmitting) {
      const confirmClose = window.confirm(
        "Você tem alterações não salvas. Deseja realmente fechar?"
      );
      if (!confirmClose) return;
    }
    onClose();
  }, [hasChanges, isSubmitting, onClose]);

  const handleReset = () => {
    setForm(originalForm);
    setHasChanges(false);
    setError(null);
  };

  const title =
    mode === "create"
      ? "Criar Nova Sprint"
      : mode === "edit"
        ? "Editar Sprint"
        : "Visualizar Sprint";

  const icon =
    mode === "create" ? (
      <CheckCircle size={18} />
    ) : mode === "edit" ? (
      <Save size={18} />
    ) : (
      <Eye size={18} />
    );

  return (
    <Modal 
      isOpen={isOpen} 
      title={title} 
      onClose={handleClose} 
      size="md"

    >
      <div className="space-y-4">
        {/* Indicador de alterações */}
        {hasChanges && mode !== "create" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Você tem alterações não salvas
            </p>
          </div>
        )}

        {/* Seletor de projeto para edit/create */}
        {(mode === "edit" || mode === "create") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projeto *
            </label>
            <select
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              disabled={loading || (mode === "create" && !!project)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Selecione um projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              {project && !projects.find(p => p.id === project.projectId) && (
                <option key={project.projectId} value={project.projectId}>
                  {project.name}
                </option>
              )}
            </select>
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Sprint *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={readOnly || loading}
            placeholder="Ex: Sprint 1 - Desenvolvimento do MVP"
            className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 ${
              readOnly ? "bg-gray-100 cursor-not-allowed" : ""
            } ${loading ? "opacity-50" : ""}`}
          />
        </div>

        {/* Objetivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Objetivo
          </label>
          <textarea
            name="goal"
            value={form.goal}
            onChange={handleChange}
            disabled={readOnly || loading}
            placeholder="Descreva o objetivo principal desta sprint..."
            className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 ${
              readOnly ? "bg-gray-100 cursor-not-allowed" : ""
            } ${loading ? "opacity-50" : ""}`}
            rows={3}
          />
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={16} />
              Início
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              disabled={readOnly || loading}
              className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 ${
                readOnly ? "bg-gray-100 cursor-not-allowed" : ""
              } ${loading ? "opacity-50" : ""}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={16} />
              Fim *
            </label>
            <input
              type="datetime-local"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              disabled={readOnly || loading}
              className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 ${
                readOnly ? "bg-gray-100 cursor-not-allowed" : ""
              } ${loading ? "opacity-50" : ""}`}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="mt-6 flex justify-between items-center gap-3 border-t pt-4">
          <div className="flex gap-2">
            {hasChanges && mode === "edit" && (
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                <X size={16} />
                Descartar
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition disabled:opacity-50"
            >
              {hasChanges ? "Cancelar" : "Fechar"}
            </button>

            {!readOnly && (
              <button
                onClick={handleSubmit}
                disabled={loading || (mode === "edit" && !hasChanges)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    {icon}
                    {mode === "create" ? "Criar" : "Salvar"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};