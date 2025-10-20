import usePersistedState from "@/hook/localStoreUse";
import { useEffect, useReducer } from "react";
import { Project, ProjectFormData, Sprint, Task } from "../types";
import { PaginatedResponse } from "../components/Paginacao";
// Tipos para o reducer
export interface AppState {
  projects: PaginatedResponse<Project>;
  sprintList: Record<string, PaginatedResponse<Sprint>>;
  selectedProjectId: string | null;
  selectedSprintId: string | null | undefined;
  selectedProject: Project | null | undefined;
  selectedSprint: Sprint | null | undefined;
  isProjectModalOpen: boolean;
  isTaskModalOpen: boolean;
  editingProject: ProjectFormData | null;
  editingTask: Task | null;
  formError: string | null;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  actionLoading: boolean;
}

export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FORM_ERROR'; payload: string | null }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: "success" | "error" | "info" } }
  | { type: 'CLEAR_TOAST' }
  | { type: 'OPEN_PROJECT_MODAL' }
  | { type: 'CLOSE_PROJECT_MODAL' }
  | { type: 'OPEN_TASK_MODAL' }
  | { type: 'CLOSE_TASK_MODAL' }
  | { type: 'SET_EDITING_PROJECT'; payload: ProjectFormData | null }
  | { type: 'SET_EDITING_TASK'; payload: Task | null }
  | { type: 'CLEAR_EDITING_TASK' }
  | { type: 'SET_PROJECTS'; payload: PaginatedResponse<Project> }
  | { type: 'UPDATE_PROJECTS'; payload: (prev: PaginatedResponse<Project>) => PaginatedResponse<Project> }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_SPRINT_LIST'; payload: Record<string, PaginatedResponse<Sprint>> }
  | { type: 'UPDATE_SPRINT_LIST'; payload: (prev: Record<string, PaginatedResponse<Sprint>>) => Record<string, PaginatedResponse<Sprint>> }
  | { type: 'SET_SELECTED_PROJECT'; payload: { project: Project | null | undefined; sprint?: Sprint | null | undefined } }
  | { type: 'ADD_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } };

// Estado inicial
export const initialState: AppState = {
  projects: { items: [], limit: 10, page: 1, pages: 0, total: 0 },
  sprintList: {},
  selectedProjectId: null,
  selectedSprintId: null,
  selectedProject: null,
  selectedSprint: null,
  isProjectModalOpen: false,
  isTaskModalOpen: false,
  editingProject: null,
  editingTask: null,
  formError: null,
  toast: null,
  actionLoading: false,
};

// Reducer para gerenciar estado complexo
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, actionLoading: action.payload };
    
    case 'SET_FORM_ERROR':
      return { ...state, formError: action.payload };
    
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    
    case 'OPEN_PROJECT_MODAL':
      return { ...state, isProjectModalOpen: true };
    
    case 'CLOSE_PROJECT_MODAL':
      return { 
        ...state, 
        isProjectModalOpen: false, 
        editingProject: null,
        formError: null 
      };
    
    case 'OPEN_TASK_MODAL':
      return { ...state, isTaskModalOpen: true };
    
    case 'CLOSE_TASK_MODAL':
      return { 
        ...state, 
        isTaskModalOpen: false, 
        editingTask: null,
        formError: null 
      };
    
    case 'SET_EDITING_PROJECT':
      return { ...state, editingProject: action.payload };
    
    case 'SET_EDITING_TASK':
      return { ...state, editingTask: action.payload };
    
    case 'CLEAR_EDITING_TASK':
      return { ...state, editingTask: null };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    
    case 'UPDATE_PROJECTS':
      return { ...state, projects: action.payload(state.projects) };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: [...state.projects.items, action.payload],
          total: state.projects.total + 1,
        }
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.map(p => 
            p.id === action.payload.id ? action.payload : p
          ),
        }
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.filter(p => p.id !== action.payload),
          total: state.projects.total - 1,
        },
        selectedProjectId: state.selectedProjectId === action.payload ? null : state.selectedProjectId,
        selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject,
      };
    
    case 'SET_SPRINT_LIST':
      return { ...state, sprintList: action.payload };
    
    case 'UPDATE_SPRINT_LIST':
      return { ...state, sprintList: action.payload(state.sprintList) };
    
    case 'SET_SELECTED_PROJECT':
      return {
        ...state,
        selectedProject: action.payload.project,
        selectedSprint: action.payload.sprint || null,
        selectedProjectId: action.payload.project?.id || null,
        selectedSprintId: action.payload.sprint?.id || null,
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.map(p =>
            p.id === action.payload.projectId
              ? { ...p, tasks: [...(p.tasks ?? []), action.payload.task] }
              : p
          ),
        }
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.map(p =>
            p.id === action.payload.projectId
              ? {
                  ...p,
                  tasks: (p.tasks ?? []).map(t =>
                    t.id === action.payload.task.id ? action.payload.task : t
                  ),
                }
              : p
          ),
        }
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.map(p =>
            p.id === action.payload.projectId
              ? { 
                  ...p, 
                  tasks: (p.tasks ?? []).filter(t => t.id !== action.payload.taskId) 
                }
              : p
          ),
        }
      };
    
    default:
      return state;
  }
}

// Hook personalizado para estado persistente com reducer
export function usePersistedReducer(key: string, reducer: (state: AppState, action: AppAction) => AppState, initialState: AppState) {
  const [persistedState, setPersistedState] = usePersistedState(key, initialState);
  const [state, dispatch] = useReducer(reducer, persistedState);

  // Atualiza o localStorage quando o estado muda
  useEffect(() => {
    setPersistedState(state);
  }, [state, setPersistedState]);

  return [state, dispatch] as const;
}