"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";
import { Project, ProjectFormData } from "@/app/task/types";
import { estadoDoProjeto, resumirTarefas } from "@/app/task/utils";

/**
 * CRUD de projetos + números agregados, para a aba de configurações.
 *
 * Os tipos (`Project`, `ProjectFormData`) e o cálculo de progresso
 * (`resumirTarefas`, `estadoDoProjeto`) vêm de `app/task` — são os mesmos que o
 * quadro de projetos usa. Aqui só está o que é próprio desta aba: carregar a
 * lista, mutar, e somar os totais do cabeçalho.
 */
export function useProjetos() {
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const { data } = await api.get<Project[]>("/projects/");
      setProjetos(data ?? []);
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível carregar os projetos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = useCallback(async (dados: ProjectFormData) => {
    setAGuardar(true);
    setErro(null);
    try {
      const { data } = await api.post<Project>("/projects/", dados);
      setProjetos((anteriores) => [data, ...anteriores]);
      return data;
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível criar o projeto."));
      return null;
    } finally {
      setAGuardar(false);
    }
  }, []);

  const atualizar = useCallback(async (id: string, dados: Partial<ProjectFormData>) => {
    setAGuardar(true);
    setErro(null);
    try {
      const { data } = await api.put<Project>(`/projects/${id}`, dados);
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
    async (projeto: Project, arquivado: boolean) =>
      atualizar(projeto.id!, {
        name: projeto.name,
        description: projeto.description,
        id_conexao_db: projeto.connection?.id,
        due_date:
          typeof projeto.due_date === "string"
            ? projeto.due_date
            : projeto.due_date?.toISOString(),
        ...({ is_active: !arquivado } as Partial<ProjectFormData>),
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
    const resumo = resumirTarefas(projetos.flatMap((p) => p.tasks ?? []));
    return {
      projetos: projetos.length,
      ativos: projetos.filter((p) => estadoDoProjeto(p) !== "arquivado").length,
      atrasados: projetos.filter((p) => estadoDoProjeto(p) === "atrasado").length,
      semConexao: projetos.filter((p) => !p.connection?.id).length,
      tarefas: resumo.total,
      concluidas: resumo.concluidas,
      progresso: resumo.progresso,
    };
  }, [projetos]);

  return {
    projetos,
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
