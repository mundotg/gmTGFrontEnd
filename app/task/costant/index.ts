import { Ban, CheckCircle, Clock, Eye, Lock, PlayCircle } from "lucide-react";
import { TaskPriority, TaskRepeat, TaskStatus } from "../types";

// Constants
export const PRIORITY_OPTIONS:{value: TaskPriority, label:string}[] = [
  { value: "baixa", label: "🟢 Baixa" },
  { value: "media", label: "🟡 Média" },
  { value: "alta", label: "🟠 Alta" },
  { value: "urgente", label: "🔴 Urgente" },
] as const;

export const STATUS_OPTIONS: {value: TaskStatus , label: string , icon: React.ElementType }[] = [
  { value: "pendente", label: "⏳ Pendente", icon: Clock },
  { value: "em_andamento", label: "🔄 Em Andamento", icon: PlayCircle },
  { value: "em_revisao", label: "👀 Em Revisão", icon: Eye },
  { value: "concluida", label: "✅ Concluída", icon: CheckCircle },
  { value: "bloqueada", label: "🚫 Bloqueada", icon: Lock },
  { value: "cancelada", label: "❌ Cancelada", icon: Ban },
] as const;

export const REPEAT_OPTIONS:{value: TaskRepeat, label: string}[] = [
  { value: "nenhum", label: "🚫 Nenhum" },
  { value: "diario", label: "📅 Diário" },
  { value: "semanal", label: "📆 Semanal" },
  { value: "mensal", label: "🗓️ Mensal" },
] as const;


export const DEFAULT_TASK_DURATION = 7 * 24 * 60 * 60 * 1000;