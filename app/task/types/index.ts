/**
 * Tipos globais
 */
export type TaskPriority = "baixa" | "media" | "alta" | "critica";
export type GroupByOption = "status" | "priority" | "assignee" | "none";

export type TaskStatus = 
  | "pendente"
  | "em_andamento"
  | "concluida"
  | "atrasada"
  | "validada"
  | "delegada";

// 🔹 Interface da Tarefa
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedTo: string;
  delegatedTo?: string; // 👤 Novo campo para delegar a tarefa
  startDate: Date;
  endDate: Date;
  estimatedHours?: number;
  project_id?: string;
  tags?: string[];
  status: TaskStatus;
  createdBy: string;
  completedAt?: Date; // quando foi concluída
  isValidated?: boolean; // caso precise de validação
  schedule?: {
    repeat: "nenhum" | "diario" | "semanal" | "mensal"; // recorrência
    until?: Date; // até quando repetir
  };
}

// 🔹 Interface do Sprint
export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  isActive: boolean;
}

export interface Project {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sprint?: any;
  id?: string;
  name: string;
  description?: string;
  team: string[];
  due_date?: Date;
  owner: string;
  created_at: Date; // ⚠️ snake_case
  tasks?: Task[];
}



export interface TaskModalProps {
  isOpen: boolean;
  editingTask?: Task;
  formError?: string;
  defaultAssignedTo?: string;
  onClose: () => void;
  onSubmit: (task: Task) => void;
}



