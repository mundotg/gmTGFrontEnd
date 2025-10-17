import { Dbtype } from "@/types";

/**
 * Tipos globais
 */
export type GroupByOption = "status" | "priority" | "assignee" | "sprint" | "none";


export type TypeShowToste = "success" | "error" | "info";

export interface TaskModalProps {
  isOpen: boolean;
  editingTask?: Task;
  formError?: string;
  defaultAssignedTo?: string;
  onClose: () => void;
  onSubmit: (task: Taskcreate) => void;
}


// -----------------------------
// TASK SCHEDULE
// -----------------------------
export type TaskRepeat = "nenhum" | "diario" | "semanal" | "mensal";

export interface TaskSchedule {
  repeat: TaskRepeat;
  until?: string | Date;
}

// -----------------------------
// TASK
// -----------------------------
export type TaskPriority = "baixa" | "media" | "alta" | "critica" | "urgente";
export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "cancelada" | "em_revisao" | "bloqueada";
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
  schedule?: TaskSchedule;
  delegated_to_id?: string;
  assigned_to_id?: string;
  created_by_id: string;
  project_id?: string;
  sprint_id?: string;
}

export interface Taskcreate {
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

// Estatísticas de tarefas retornadas pela rota /stats/task
export interface TaskStats {
  total: number;                    // Total de tarefas
  completed: number;                // Tarefas concluídas
  in_progress: number;               // Tarefas em andamento
  pending: number;                  // Tarefas pendentes
  inReview: number;                 // Tarefas em revisão
  blocked: number;                  // Tarefas bloqueadas
  cancelled: number;                // Tarefas canceladas
  progress_percent: number;                 // Percentual concluído (0-100)
  total_estimated_hours: number;      // Total de horas planejadas
  priorityCounts: {                 // Contagem por prioridade
    baixa: number;
    media: number;
    alta: number;
    urgente: number;
    critica: number;
  };
  project_id?: string | null;       // (opcional) ID do projeto
  sprint_id?: string | null;        // (opcional) ID da sprint
  updated_at?: string;              // (opcional) Data de atualização
}




// -----------------------------
// SPRINT
// -----------------------------
export interface Sprint {
  id?: string;
  name: string;
  start_date?: string | Date;
  end_date: string | Date;
  goal?: string;
  is_active?: boolean;
  project_id: string;
  cancelled?: boolean;
  motivo_cancelamento?: string
}

export interface DBConnection {
  id: number
  name: string
  type: Dbtype
}


export interface ProjectType {
  id: string
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
  created_at?: string; // ISO string
  due_date?: string;   // ISO string
}

// -----------------------------
// PROJECT
// -----------------------------
export interface Project {
  id?: string;
  name: string;
  description?: string;
  owner_id: string;
  team?: string[];
  tasks?: Task[];
  type_project?: ProjectType;
  connection?: DBConnection
  sprints?: Sprint[];
  created_at?: string | Date;
  due_date?: string | Date;
}

// -----------------------------
// USUÁRIO (completo)
// -----------------------------
export type UserRoleEnum = "admin" | "user" | "manager" | "membro" | "gerente"
export interface Usuario {
  id?: string;
  user_id: string;
  nome: string;
  avatarUrl?: string
  email: string;
  role?: UserRoleEnum;
  created_at?: string | Date;
  updated_at?: string | Date;
  projects_participating?: string[];
  created_projects?: string[];
  assigned_tasks?: string[];
  delegated_tasks?: string[];
  created_tasks?: string[];
}

// -----------------------------
// REQUEST - Criação de Usuário
// -----------------------------
export interface UsuarioCreateRequest {
  nome: string;
  email: string;
  senha: string;
  role?: UserRoleEnum;
}

// -----------------------------
// REQUEST - Atualização de Usuário
// -----------------------------
export interface UsuarioUpdateRequest {
  nome?: string;
  email?: string;
  senha?: string;
  role?: UserRoleEnum;
  updated_at?: string | Date;
}

// -----------------------------
// REQUEST - Login
// -----------------------------
export interface UsuarioLoginRequest {
  email: string;
  senha: string;
}

export interface RoleResponse {
  id: string;
  nome: UserRoleEnum;
  descricao?: string | null;
}

// -----------------------------
// RESPONSE - Usuário Completo
// -----------------------------
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

// -----------------------------
// RESPONSE - Login
// -----------------------------
export interface LoginResponse extends UsuarioResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: Date | string
  last_login: string | Date;
}



export interface Role {
  nome: string;
  descricao?: string;
}


export interface UsuarioTaskCreate {
  nome: string;
  email: string;
  senha: string;
  avatarUrl?: string;
  role_id?: string;
  role?: Role;
}

