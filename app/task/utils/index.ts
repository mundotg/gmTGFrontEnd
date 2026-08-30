
export function safeDate(value?: string | Date | null) {
  return value ? new Date(value).toISOString() : "";
}

// utils.ts
export function safeDateView(value?: string | Date | null): string {
  if (!value) return "";
  try {
    const date =
      typeof value === "string"
        ? new Date(value)
        : value instanceof Date
        ? value
        : new Date();

    if (isNaN(date.getTime())) return "";

    // Retorna apenas YYYY-MM-DD
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}


export function safeDateTime(value?: string | Date | null): string {
  if (!value) return "";
  try {
    const date =
      typeof value === "string"
        ? new Date(value)
        : value instanceof Date
        ? value
        : new Date();

    if (isNaN(date.getTime())) return "";

    // Retorna no formato "YYYY-MM-DDTHH:MM" (para <input type="datetime-local">)
    const iso = date.toISOString();
    return iso.slice(0, 16);
  } catch {
    return "";
  }
}

// utils.ts
export function safeDateTime2(value?: string | Date | null): string {

  if (!value) return "";
  try {
    const date =
      typeof value === "string"
        ? new Date(value)
        : value instanceof Date
        ? value
        : new Date();

    if (isNaN(date.getTime())) return "";

    // Retorna no formato compatível com <input type="datetime-local">
    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}


import { Project, ProjectFormData, Task } from "../types";

/**
 * Converte entre Project <-> ProjectFormData
 * Detecta automaticamente a direção com base nas chaves presentes.
 */
export function convertProject(
  data: Project | ProjectFormData
): Project | ProjectFormData {
  // ----------------------------
  // 🔹 Caso: Project → ProjectFormData
  // ----------------------------
  if ("owner_id" in data) {
    const project = data as Project;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.owner_id,
      team: project.team || [],
      tasks: project.tasks || [],
      sprint: project.sprints?.[0] ?? undefined, // pega a primeira sprint se existir
      created_at: project.created_at
        ? new Date(project.created_at).toISOString()
        : undefined,
      due_date: project.due_date
        ? new Date(project.due_date).toISOString()
        : undefined,
    } satisfies ProjectFormData;
  }

  // ----------------------------
  // 🔹 Caso: ProjectFormData → Project
  // ----------------------------
  else {
    const form = data as ProjectFormData;

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      owner_id: form.ownerId || "unknown",
      team: form.team || [],
      tasks: form.tasks || [],
      sprints: form.sprint ? [form.sprint] : [],
      created_at: form.created_at
        ? new Date(form.created_at).toISOString()
        : new Date().toISOString(),
      due_date: form.due_date
        ? new Date(form.due_date).toISOString()
        : undefined,
    } satisfies Project;
  }
}


/* ============================================================
 * 🔹 ESTADO DERIVADO DE UM PROJETO
 * ==========================================================*/

/** Resumo das tarefas de um projeto. O backend não o calcula. */
export interface ResumoProjeto {
  total: number;
  concluidas: number;
  emCurso: number;
  emRevisao: number;
  pendentes: number;
  /** 0–100. Zero tarefas conta como 0%, não como 100%. */
  progresso: number;
}

export type EstadoProjeto = "ativo" | "arquivado" | "atrasado";

/**
 * Conta as tarefas por estado e devolve o progresso.
 *
 * Vive aqui, e não dentro de um ecrã, porque a lista de projetos do quadro e a
 * aba de configurações precisam do mesmo número — e duas cópias divergem.
 */
export function resumirTarefas(tarefas: Task[] = []): ResumoProjeto {
  const total = tarefas.length;
  const conta = (estado: string) =>
    tarefas.filter((t) => (t.status ?? "").toLowerCase() === estado).length;

  const concluidas = conta("concluida");

  return {
    total,
    concluidas,
    emCurso: conta("em_andamento"),
    emRevisao: conta("em_revisao"),
    pendentes: conta("pendente"),
    // Um projeto sem tarefas está a 0%: mostrar 100% seria dizer que está
    // pronto quando ainda nem começou.
    progresso: total === 0 ? 0 : Math.round((concluidas / total) * 100),
  };
}

/** Estado visível de um projeto, a partir dos dados que já vêm da API. */
export function estadoDoProjeto(projeto: Project): EstadoProjeto {
  if ((projeto as Project & { is_active?: boolean }).is_active === false) {
    return "arquivado";
  }

  if (projeto.due_date) {
    const prazo = new Date(projeto.due_date);
    // Só está atrasado se ainda houver trabalho por fazer — um projeto
    // terminado depois do prazo já não precisa de alarme.
    if (prazo.getTime() < Date.now() && resumirTarefas(projeto.tasks).progresso < 100) {
      return "atrasado";
    }
  }

  return "ativo";
}
