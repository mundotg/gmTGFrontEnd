"use client";
import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./modalComponent";
import { ProjectFormData, Usuario, DBConnection, ProjectType } from "../types";
import { useSessionTask } from "../contexts/UserContext";
import { safeDateTime2 } from "../utils";
import { PaginatedResponse } from "./Paginacao";
import { JoinSelect } from "./select_Component";
import usePersistedState from "@/hook/localStoreUse";

/* ------------------------------
   Tipos
------------------------------ */
interface ProjectModalProps {
  isOpen: boolean;
  editingProject?: ProjectFormData | null;
  formError?: string | null;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
}

interface ProjectFormState {
  name: string;
  description: string;
  dueDate: string;
  createdAt: string;
  teamMembers: string[];
  typeProject: string;
  connectionId: string;
}

/* ------------------------------
   Componente principal
------------------------------ */
const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  editingProject,
  formError,
  onClose,
  onSubmit,
}) => {
  const { user, api } = useSessionTask();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Estado para armazenar os dados carregados
  const [loading, setLoading] = useState(false);

  const [formState, setFormState, clearKey] = usePersistedState<ProjectFormState>(
    "project_form_state",
    {
      name: "",
      description: "",
      dueDate: "",
      createdAt: safeDateTime2(new Date()),
      teamMembers: [],
      typeProject: "",
      connectionId: "",
    }
  );

  // 🕒 Datas pré-formatadas
  const defaultDueDate = useMemo(
    () => safeDateTime2(editingProject?.due_date),
    [editingProject?.due_date]
  );

  const defaultCreatedAt = useMemo(
    () => safeDateTime2(editingProject?.created_at || new Date()),
    [editingProject?.created_at]
  );

  // Função para buscar tipos de projeto com paginação
  const fetch_type_project = useCallback(async (page: number, search: string) => {
    try {
      const params = new URLSearchParams({
        tipo: "type_project",
        page: String(page),
        limit: "20",
      });
      if (search) {
        params.append("search", search);
      }

      const { data } = await api.get<PaginatedResponse<ProjectType>>("/geral/paginate?" + params);

      return {
        options: data.items.map((type_project) => ({
          value: JSON.stringify(type_project),
          label: `🏃 ${type_project.name} ${type_project.description || ""}`
        })),
        hasMore: data.items.length === 20,
        total: data.total
      };
    } catch (err) {
      console.error("Erro ao buscar tipos de projeto:", err);
      return { options: [], hasMore: false, total: 0 };
    }
  }, [api]);

  const fetchDBConnection = useCallback(async (page: number, search: string) => {
    try {
      const params = new URLSearchParams({
        tipo: "DBConnection",
        page: String(page),
        limit: "20",
      });

      if (search) {
        params.append("search", search);
      }

      const { data } = await api.get<PaginatedResponse<DBConnection>>("/geral/paginate?" + params);

      return {
        options: data.items.map((dbConnection) => ({
          value: JSON.stringify({id:dbConnection.id,name:dbConnection.name,type:dbConnection.type} as DBConnection),
          label: `🔌 ${dbConnection.name} (${dbConnection.type})`
        })),
        hasMore: data.items.length === 20,
        total: data.total
      };
    } catch (err) {
      console.error("Erro ao buscar conexões:", err);
      return { options: [], hasMore: false, total: 0 };
    }
  }, [api]);

  /* ------------------------------
     🔄 Inicialização / Reset
  ------------------------------ */
  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();

      if (editingProject) {
        clearKey()
        setFormState({
          name: editingProject.name || "",
          description: editingProject.description || "",
          dueDate: defaultDueDate,
          createdAt: defaultCreatedAt,
          teamMembers: editingProject.team || [],
          typeProject: editingProject.type_project?.id || "",
          connectionId: editingProject.id_conexao_db?.toString() || "",
        });
      }
    }
  }, [isOpen, editingProject, defaultDueDate, defaultCreatedAt, setFormState]);

  const updateForm = useCallback(
    (changes: Partial<ProjectFormState>) =>
      setFormState((prev) => ({ ...prev, ...changes })),
    [setFormState]
  );

  const clearForm = useCallback(
    () =>{
      clearKey();
      setFormState({
        name: "",
        description: "",
        dueDate: "",
        createdAt: "",
        teamMembers: [],
        typeProject: "",
        connectionId: "",
      })},
    [setFormState]
  );

  /* ------------------------------
     👥 Buscar usuários com paginação
  ------------------------------ */
  const fetchUsers = useCallback(
    async (page: number, search: string) => {
      try {
        const params = new URLSearchParams({
          tipo: "user",
          page: String(page),
          limit: "20",
          ...(search && { search }),
        });

        const { data } = await api.get<PaginatedResponse<Usuario>>(
          `/geral/paginate?${params}`
        );

        return {
          options: data.items.map((u) => ({
            value: u.id || "",
            label: `${u.nome} (${u.email})`,
          })),
          hasMore: data.items.length === 20,
          total: data.total,
        };
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        return { options: [], hasMore: false, total: 0 };
      }
    },
    [api]
  );

  /* ------------------------------
     🧠 Handlers de campo
  ------------------------------ */
  const handleChange = useCallback(
    (field: keyof ProjectFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        updateForm({ [field]: e.target.value }),
    [updateForm]
  );

  const toggleTeamMember = useCallback(
    (userId: string) => {
      updateForm({
        teamMembers: formState.teamMembers.includes(userId)
          ? formState.teamMembers.filter((id) => id !== userId)
          : [...formState.teamMembers, userId],
      });
    },
    [formState.teamMembers, updateForm]
  );

  /* ------------------------------
     📨 Submissão
  ------------------------------ */
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true)

      try {
        if (!formState.name.trim()) {
        alert("O nome do projeto é obrigatório.");
        return;
      }

      // Preparar dados no formato do schema
      const project: ProjectFormData = {
        id: editingProject?.id,
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        ownerId: user?.id ?? "unknown",
        team: formState.teamMembers,
        created_at: new Date(formState.createdAt || new Date()).toISOString(),
        due_date: formState.dueDate
          ? new Date(formState.dueDate).toISOString()
          : undefined,
        tasks: editingProject?.tasks || [],
        sprint: editingProject?.sprint,
        type_project: formState.typeProject ? JSON.parse(formState.typeProject): undefined,
        id_conexao_db: formState.connectionId ? (parseInt(formState.connectionId) as unknown as DBConnection)?.id: undefined,
        connection: formState.connectionId ? JSON.parse(formState.connectionId) as DBConnection : undefined
      };

      
      onSubmit(project);
      
      if (!editingProject && !formError) clearForm();
      } catch (error) {
        console.error(error)
      }finally{
        setLoading(false)
      }
    },
    [formState, editingProject, user?.id, clearForm, onSubmit]
  );

  /* ------------------------------
     🎨 UI
  ------------------------------ */
  return (
    <Modal
      isOpen={isOpen}
      title={editingProject ? "Editar Projeto" : "Novo Projeto"}
      onClose={()=>{clearForm();onClose()}}
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Projeto *
            </label>
            <input
              ref={nameInputRef}
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange("name")}
              placeholder="Ex: Sistema de Vendas"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange("description")}
              placeholder="Descreva o objetivo e escopo do projeto..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Tipo de Projeto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Projeto
            </label>

            <JoinSelect
              value={formState.typeProject}
              disabled={false}
              onChange={(val) => {
                updateForm({ typeProject: val });
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              fetchOptions={fetch_type_project}
            />
          </div>

          {/* Conexão de Banco de Dados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conexão de Banco de Dados
            </label>

            <JoinSelect
              value={formState.connectionId}
              disabled={false}
              onChange={(val) => {
                updateForm({ connectionId: val });
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              fetchOptions={fetchDBConnection}
            />
          </div>

          {/* Equipe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipe
            </label>
            <JoinSelect
              value=""
              onChange={toggleTeamMember}
              fetchOptions={fetchUsers}
              placeholder="Selecione os membros da equipe..."
              searchable
              className="w-full mb-3"
              buttonClassName="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoWidth={false}
              debounceMs={400}
              // pageSize={20}
            />

            {formState.teamMembers.length > 0 && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membros selecionados ({formState.teamMembers.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {formState.teamMembers.map((id) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      <span className="truncate max-w-[140px]">{id}</span>
                      <button
                        type="button"
                        onClick={() => toggleTeamMember(id)}
                        className="text-blue-500 hover:text-blue-700 font-bold text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Criador + Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Criado por
              </label>
              <input
                type="text"
                value={user?.nome ?? "Desconhecido"}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Criação
              </label>
              <input
                type="datetime-local"
                value={formState.createdAt || defaultCreatedAt}
                onChange={handleChange("createdAt")}
                className={`w-full border border-gray-300 rounded-lg px-4 py-3 ${
                  editingProject
                    ? "focus:ring-2 focus:ring-indigo-500"
                    : "bg-gray-100"
                }`}
                readOnly={!editingProject}
              />
            </div>
          </div>

          {/* Data de Entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Entrega
            </label>
            <input
              type="datetime-local"
              value={formState.dueDate}
              onChange={handleChange("dueDate")}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Erros */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              {formError}
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={()=>{clearForm();onClose()}}
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
      )}
    </Modal>
  );
};

export default ProjectModal;