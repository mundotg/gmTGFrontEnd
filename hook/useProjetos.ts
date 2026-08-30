"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";

/* =====================
   TIPOS (espelham app/schemas/project_schemas.py)
===================== */
export interface TarefaMini {
  id: string;
  title?: string | null;
  status?: string | null;
}

export interface UtilizadorMini {
  id: string;
  nome: string;
  email?: string | null;
}

export interface ConexaoMini {
  id: number;
  name: string;
  type: string;
}

export interface SprintMini {
  id?: string | null;
  name: string;
  end_date?: string | null;
}

export interface Projeto {
  id: string;
  name: string;
  description?: string | null;
  owner?: UtilizadorMini | null;
  team_members?: UtilizadorMini[];
  tasks?: TarefaMini[];
  sprints?: SprintMini[];
  connection?: ConexaoMini | null;
  id_conexao_db?: number | null;
  created_at?: string | null;
  due_date?: string | null;
  is_active?: boolean | null;
}

export interface ConexaoDisponivel {
  id: number;
  name: string;
  type: string;
}

/** Estado derivado das tarefas — o backend não o calcula. */
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

/** Status considerado concluído no vocabulário das tarefas deste projeto. */
const CONCLUIDA = "concluida";

export function resumirTarefas(tarefas: TarefaMini[] = []): ResumoProjeto {
  const total = tarefas.length;
  const conta = (estado: string) =>
    tarefas.filter((t) => (t.status ?? "").toLowerCase() === estado).length;

  const concluidas = conta(CONCLUIDA);

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

export function estadoDoProjeto(projeto: Projeto): EstadoProjeto {
  if (projeto.is_active === false) return "arquivado";

  if (projeto.due_date) {
    const prazo = new Date(projeto.due_date);
    const resumo = resumirTarefas(projeto.tasks);
    // Só está atrasado se ainda houver trabalho por fazer — um projeto
    // terminado depois do prazo já não precisa de alarme.
    if (prazo.getTime() < Date.now() && resumo.progresso < 100) return "atrasado";
  }

  return "ativo";
}

/* =====================
   HOOK
===================== */
export function useProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [conexoes, setConexoes] = useState<ConexaoDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      // As conexões são para o seletor do formulário; se falharem, a lista de
      // projetos continua a aparecer.
      const [projetosRes, conexoesRes] = await Promise.allSettled([
        api.get<Projeto[]>("/projects/"),
        api.get<{ results: ConexaoDisponivel[] }>("/conn/connections/", {
          params: { page: 1, limit: 100 },
        }),
      ]);

      if (projetosRes.status === "fulfilled") {
        setProjetos(projetosRes.value.data ?? []);
      } else {
        setErro(extractApiError(projetosRes.reason, "Não foi possível carregar os projetos."));
      }

      if (conexoesRes.status === "fulfilled") {
        setConexoes(conexoesRes.value.data?.results ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = useCallback(
    async (dados: Partial<Projeto>) => {
      setAGuardar(true);
      setErro(null);
      try {
        const { data } = await api.post<Projeto>("/projects/", dados);
        setProjetos((anteriores) => [data, ...anteriores]);
        return data;
      } catch (err) {
        setErro(extractApiError(err, "Não foi possível criar o projeto."));
        return null;
      } finally {
        setAGuardar(false);
      }
    },
    []
  );

  const atualizar = useCallback(async (id: string, dados: Partial<Projeto>) => {
    setAGuardar(true);
    setErro(null);
    try {
      const { data } = await api.put<Projeto>(`/projects/${id}`, dados);
      setProjetos((anteriores) => anteriores.map((p) => (p.id === id ? data : p)));
      return data;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível atualizar o projeto."));
      return null;
    } finally {
      setAGuardar(false);
    }
  }, []);

  /** Arquivar é `is_active = false` — não apaga nada nem perde histórico. */
  const arquivar = useCallback(
    async (projeto: Projeto, arquivado: boolean) =>
      atualizar(projeto.id, {
        name: projeto.name,
        description: projeto.description,
        id_conexao_db: projeto.id_conexao_db ?? projeto.connection?.id ?? null,
        due_date: projeto.due_date,
        is_active: !arquivado,
      }),
    [atualizar]
  );

  const remover = useCallback(async (id: string) => {
    setAGuardar(true);
    setErro(null);
    try {
      await api.delete(`/projects/${id}`);
      setProjetos((anteriores) => anteriores.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível eliminar o projeto."));
      return false;
    } finally {
      setAGuardar(false);
    }
  }, []);

  /** Números do cabeçalho, somados uma vez em vez de por cada card. */
  const totais = useMemo(() => {
    const tarefas = projetos.flatMap((p) => p.tasks ?? []);
    const resumo = resumirTarefas(tarefas);
    return {
      projetos: projetos.length,
      ativos: projetos.filter((p) => p.is_active !== false).length,
      atrasados: projetos.filter((p) => estadoDoProjeto(p) === "atrasado").length,
      semConexao: projetos.filter((p) => !p.connection && !p.id_conexao_db).length,
      tarefas: resumo.total,
      concluidas: resumo.concluidas,
      progresso: resumo.progresso,
    };
  }, [projetos]);

  return {
    projetos,
    conexoes,
    totais,
    loading,
    erro,
    aGuardar,
    carregar,
    criar,
    atualizar,
    arquivar,
    remover,
  };
}
