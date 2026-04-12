
import { Dbtype, Role, Usuario } from "@/types";

/* ============================================================

* 🔹 ENUMS & TYPES GLOBAIS
* ============================================================ */

export type GroupByOption = "status" | "priority" | "assignee" | "sprint" | "none";
export type ToastType = "success" | "error" | "info";
export type UserRoleEnum = "admin" | "user" | "manager" | "membro" | "gerente";
export type TypeShowToste = "success" | "error" | "info";

/* ============================================================

* 🔹 TASK (TAREFAS)
* ============================================================ */

export type TaskPriority = "baixa" | "media" | "alta" | "critica" | "urgente";
export type TaskStatus =
  | "pendente"
  | "em_andamento"
  | "concluida"
  | "cancelada"
  | "em_revisao"
  | "bloqueada";
export type TaskRepeat = "nenhum" | "diario" | "semanal" | "mensal";

export interface TaskSchedule {
  repeat: TaskRepeat;
  until?: string | Date;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  start_date?: string | Date;
  end_date: string | Date;
  estimated_hours?: string | number;
  tags?: string[];
  status?: TaskStatus;
  completed_at?: string | Date;
  is_validated?: boolean;
  comentario_is_validated?: string;
  schedule?: TaskSchedule;

  delegated_to_id?: string;
  assigned_to_id?: string;
  created_by_id: string;
  project_id?: string;
  sprint_id?: string;

  sprint?: Partial<Sprint>;
  project?: Partial<Project>;
  assigned_user?: Partial<Usuario>;
  delegated_user?: Partial<Usuario>;
  creator_user?: Partial<Usuario>;
}

export interface TaskCreate {
  id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string | Date;
  endDate: string | Date;
  estimatedHours?: string | number;
  tags?: string[];
  status?: TaskStatus;
  completedAt?: string | Date;
  isValidated?: boolean;
  schedule?: TaskSchedule;
  assignedToId: string;
  delegatedToId?: string;
  createdById?: string;
  projectId?: string;
  sprintId?: string;
}

/** Estatísticas globais de tarefas */
export interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  inReview: number;
  blocked: number;
  cancelled: number;
  progress_percent: number;
  total_estimated_hours: number;
  priorityCounts: Record<TaskPriority, number>;
  project_id?: string | null;
  sprint_id?: string | null;
  updated_at?: string;
}

/** Props do modal de tarefa */
export interface TaskModalProps {
  isOpen: boolean;
  editingTask?: Task;
  formError?: string;
  defaultAssignedTo?: string;
  onClose: () => void;
  onSubmit: (task: TaskCreate) => void;
}

/* ============================================================

* 🔹 SPRINTS
* ============================================================ */
export interface Sprint {
  id?: string;
  name: string;
  start_date?: string | Date;
  end_date: string | Date;
  goal?: string;
  is_active?: boolean;
  project_id: string;
  cancelled?: boolean;
  motivo_cancelamento?: string;
}

/* ============================================================

* 🔹 PROJETOS
* ============================================================ */

export interface DBConnection {
  id: number;
  name: string;
  type: Dbtype;
}

export interface ProjectType {
  id: string;
  name: string;
  description?: string;
}

export interface ProjectFormData {
  id?: string;
  name: string;
  description?: string;
  ownerId?: string;
  type_project?: ProjectType;
  connection?: DBConnection;
  id_conexao_db?: number;
  team?: string[];
  tasks?: Task[];
  sprint?: Sprint;
  created_at?: string;
  due_date?: string;
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  owner_id: string;
  owner?: Partial<Usuario>;
  team?: string[];
  tasks?: Task[];
  type_project?: ProjectType;
  connection?: Partial<DBConnection>;
  team_members?: Partial<Usuario>[];
  sprints?: Sprint[];
  created_at?: string | Date;
  due_date?: string | Date;
}

/* ============================================================

* 🔹 USUÁRIOS
* ============================================================ */


export interface RoleResponse extends Role {
  id: string;
}



/* --- Requisições de Usuário --- */
export interface UsuarioCreateRequest {
  nome: string;
  email: string;
  senha: string;
  role?: UserRoleEnum;
}

export interface UsuarioUpdateRequest {
  nome?: string;
  email?: string;
  senha?: string;
  role?: UserRoleEnum;
  updated_at?: string | Date;
}

export interface UsuarioLoginRequest {
  email: string;
  senha: string;
}

/* --- Respostas --- */
export interface UsuarioResponse {
  id: string;
  nome: string;
  email: string;
  role: RoleResponse;
  created_at: string | Date;
  updated_at: string | Date;
  projects_participating?: string[];
  created_projects?: string[];
  assigned_tasks?: string[];
  delegated_tasks?: string[];
  created_tasks?: string[];
}

export interface LoginResponse extends UsuarioResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: Date | string;
  last_login: string | Date;
}

export interface UsuarioTaskCreate {
  nome: string;
  email: string;
  senha: string;
  avatarUrl?: string;
  role_id?: string;
  role?: Role;
}

export interface TarefasPayload {
  stats: TaskStats;
  project?: Project;
  sprint?: Sprint | null;
  tasks?: Task[];
}
