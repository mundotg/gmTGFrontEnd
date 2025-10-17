import { useCallback } from "react";
import { useSessionTask } from "../contexts/UserContext";
import { PaginatedResponse } from "../components/Paginacao";
import { Sprint, Usuario } from "../types";

// Custom hook for data fetching with pagination
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTaskModalData = (projectId?: string, editingTask?: any) => {
    const { api } = useSessionTask();

    // Função para buscar sprints com paginação
    const fetchSprints = useCallback(async (page: number, search: string) => {
        try {
            const params = new URLSearchParams({
                tipo: "sprint",
                page: String(page),
                limit: "20",
            });
            console.log("projectId: ", projectId)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filtro: Record<string, any> = {
                "project_id": projectId || editingTask?.project_id
            };

            if (search) {
                params.append("search", search)
            }


            params.append("filtro", JSON.stringify(filtro));

            const { data } = await api.get<PaginatedResponse<Sprint>>("/geral/paginate?" + params);

            return {
                options: data.items.map((sprint: Sprint) => ({
                    value: sprint.id || "",
                    label: `🏃 ${sprint.name} ${sprint.is_active ? "(Ativa)" : ""}`
                })),
                hasMore: data.items.length === 20, // Assume que se retornou 20 items, tem mais
                total: data.total
            };
        } catch (err) {
            console.error("Erro ao buscar sprints:", err);
            return { options: [], hasMore: false, total: 0 };
        }
    }, [api, projectId, editingTask?.project_id]);

    // Função para buscar usuários com paginação
    const fetchUsers = useCallback(async (page: number, search: string) => {
        try {
            const params = new URLSearchParams({
                tipo: "user",
                page: String(page),
                limit: "20",
            });

            if (search) {
                params.append("search", search)
            }

            const { data } = await api.get<PaginatedResponse<Usuario>>("/geral/paginate?" + params);

            return {
                options: data.items.map((user: Usuario) => ({
                    value: user.id || "",
                    label: `${user.nome} (${user.email})`
                })),
                hasMore: data.items.length === 20,
                total: data.total
            };
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
            return { options: [], hasMore: false, total: 0 };
        }
    }, [api]);

    return {
        fetchSprints,
        fetchUsers,
    };
};

// Date utilities
export const useDateUtils = () => {
    const formatDateTimeLocal = useCallback((date: Date | string | undefined): string => {
        if (!date) return "";
        const d = typeof date === "string" ? new Date(date) : date;
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    }, []);

    const formatDateLocal = useCallback((date: Date | string | undefined): string => {
        if (!date) return "";
        const d = typeof date === "string" ? new Date(date) : date;
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);
    }, []);

    return { formatDateTimeLocal, formatDateLocal };
};

