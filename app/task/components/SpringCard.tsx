"use client";
import React from "react";
import { Clock, Edit, Trash2, Loader2, PauseCircle, Play, Target, XCircle, AlertCircle } from "lucide-react";
import { Sprint, Project } from "../types";
import { safeDateTime } from "../utils";
import { PaginacaoGenerica, PaginatedResponse } from "./Paginacao";

// -----------------------------
// Tipagem dos Props
// -----------------------------
interface SpringCardProps {
  sprintData: PaginatedResponse<Sprint>;
  project: Project;
  loadingActions: Record<string, boolean>;
  buscarSprintsPorProjeto: (
    limit: number,
    page: number,
    tipo: "user" | "project" | "task" | "sprint",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtro: Record<string, any>,
    search?: string
  ) => Promise<void>;
  handleEditSprint: (project: { projectId: string; name: string }, sprint: Sprint) => void;
  handleDeleteSprint: (sprintId: string) =>  Promise<void>;
  handleToggleSprint: ({ sprintId, activate, end_date }: { sprintId: string; activate: boolean; end_date?: Date | string }) =>  Promise<void>;
  handleActionWithLoading: (id: string, action: () => Promise<void>) => void;
  onSelectProject: (project: Project, sprint: Sprint) => void;
}

// -----------------------------
// Componente
// -----------------------------
export const SpringCard = React.memo(function SpringCard({
  sprintData,
  project,
  loadingActions,
  buscarSprintsPorProjeto,
  handleEditSprint,
  handleDeleteSprint,
  handleToggleSprint,
  handleActionWithLoading,
  onSelectProject,
}: SpringCardProps) {
  return (
    <div className="space-y-2">
      {sprintData?.items?.map((sprint) => {
        const isCancelled = sprint.cancelled;
        const isActive = sprint.is_active && !isCancelled;
        
        return (
          <div
            key={sprint.id}
            className={`flex flex-col p-4 rounded-lg border transition-all ${
              isCancelled
                ? "border-red-300 bg-red-50 opacity-75"
                : isActive
                ? "border-green-300 bg-green-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {/* Header com nome e status */}
            <div
              className="flex items-start justify-between gap-3 mb-2 cursor-pointer"
              onClick={() => !isCancelled && onSelectProject(project, sprint)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {sprint.name}
                  </span>
                  
                  {isActive && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                      Ativa
                    </span>
                  )}
                  
                  {isCancelled && (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <XCircle size={12} />
                      Cancelada
                    </span>
                  )}
                </div>

                {/* Objetivo da sprint */}
                {sprint.goal && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-700 mb-2">
                    <Target size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{sprint.goal}</span>
                  </div>
                )}

                {/* Datas */}
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock size={12} className="flex-shrink-0" />
                  <span>
                    {sprint.start_date ? safeDateTime(sprint.start_date) : "N/D"} →{" "}
                    {sprint.end_date ? safeDateTime(sprint.end_date) : "N/D"}
                  </span>
                </div>

                {/* Motivo de cancelamento */}
                {isCancelled && sprint.motivo_cancelamento && (
                  <div className="flex items-start gap-1.5 mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Motivo: </span>
                      {sprint.motivo_cancelamento}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
              {/* Editar sprint */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleEditSprint({ projectId: project.id!, name: project.name }, sprint);
                }}
                disabled={isCancelled}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md focus:ring-2 focus:ring-indigo-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Editar sprint"
              >
                <Edit size={14} />
              </button>

              {/* Eliminar sprint */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleActionWithLoading(sprint.id!, () => handleDeleteSprint(sprint.id!));
                }}
                disabled={loadingActions[sprint.id!] || isActive}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md focus:ring-2 focus:ring-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={isActive ? "Não é possível eliminar sprint ativa" : "Eliminar sprint"}
              >
                {loadingActions[sprint.id!] ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>

              {/* Ativar/Desativar sprint */}
              {!isCancelled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionWithLoading(sprint.id!, () =>
                      handleToggleSprint({
                        sprintId: sprint.id!,
                        activate: !sprint.is_active,
                        end_date: sprint.end_date,
                      })
                    );
                  }}
                  disabled={loadingActions[sprint.id!]}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition ml-auto ${
                    isActive
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  } disabled:opacity-50`}
                >
                  {loadingActions[sprint.id!] ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isActive ? (
                    <>
                      <PauseCircle size={14} />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Ativar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <PaginacaoGenerica<Sprint>
        Lista={sprintData}
        apiUrl="/paginate/"
        searchPlaceholder="pesquisar sprint por nome"
        fetchFunc={(limit, page, tipo, search) =>
          buscarSprintsPorProjeto(limit, page, tipo, { project_id: project.id }, search)
        }
        tipo="sprint"
        renderItem={() => <div></div>}
      />
    </div>
  );
});