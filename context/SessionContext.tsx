
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";

import type { Axios } from "axios";
import api from "./axioCuston";
import { BancoSuportado, Permission } from "@/constant";

export interface DbInfoExtra {
    id_connection: number;
    name_db: string;
    data: string;
    type: BancoSuportado;
    num_table: number;
    num_consultas: number;
    ultima_execucao_ms?: number;
    ultima_consulta_em?: string;
    registros_analizados?: number;
}


export interface Empresa {
    id: number;
    company: string;
    companySize?: string;
    nif?: string;
    endereco?: string;
}

export interface Cargo {
    id: number;
    position: string;
    descricao?: string;
    nivel?: "júnior" | "pleno" | "sênior" | string;
}


export interface Role {
    name: string; // ex: admin, manager, developer
}

export interface Usuario {
    id: string;
    nome: string;
    apelido?: string;
    email: string;
    telefone?: string;
    status?: "ativo" | "inativo" | "suspenso";
    createdAt?: string;
    lastLogin?: string;
    projects_participating?: string[];
    created_projects?: string[];
    assigned_tasks?: string[];
    delegated_tasks?: string[];
    created_tasks?: string[];
   
    empresa?: Empresa;
    cargo?: Cargo;

    roles?: Role[];
    permissions: Permission[] | string[];

    avatar_url?: string;
    datatimeSession?: string;

    // JWT
    exp?: number;
    iat?: number;
    sub?: string;

    // Conexão ativa
    info_extra?: DbInfoExtra | null;
}


export type AuthProvider = "google" | "azure-ad" | "facebook" | "github" | "gitlab" | "credenciais";

export interface LoginOptions {
    credenciais?: {
        email: string;
        senha: string;
    };
    redirect?: string;
}

interface SessionData {
    user: Usuario | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: AuthProvider, options?: LoginOptions) => Promise<boolean>;
    logout: (redirect?: string | null) => Promise<boolean>;
    api: Axios;
}

const SessionContext = createContext<SessionData | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isAuthenticated = useMemo(() => !!user, [user]);


    // const route = useRouter();

    const logout = useCallback(async (redirect: string | null = null) => {
        // console.log("Logout chamado", user);
        if (isLoggingOut) return false; // Evita múltiplos logouts simultâneos
        setIsLoggingOut(true);
        setIsLoading(true);

        try {
            await api.post("/auth/logout");
            setUser(null);
        } catch (error) {
            console.warn("Erro ao deslogar:", error);
            throw error;
        } finally {
            setToken(null);
            setIsLoggingOut(false);
            setIsLoading(false);
            localStorage.removeItem("user");
            if (redirect) {
                // route.push(redirect);
            }

        }
        return true;
    }, [isLoggingOut]);
    const refreshAccessToken = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);

        try {
            await api.post('/auth/refresh', {}, { withCredentials: true });
            setIsRefreshing(false);
            return true;
        } catch (error) {
            setIsRefreshing(false);
            return false
        }
    }, [logout, isRefreshing]);


    // 🛑 Interceptor para Logout Automático no erro 401
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            response => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !isLoggingOut && !originalRequest._retry) {

                    originalRequest._retry = true;
                    const success = await refreshAccessToken();
                    if (success) {
                        // Tenta novamente a requisição original
                        return api(originalRequest);
                    } else {
                        // Refresh falhou, força logout
                        await logout();
                    }
                }
                // console.error("Erro ao processar a resposta:", error);
                return Promise.reject(error);
            }
        );

        return () => api.interceptors.response.eject(interceptor);
    }, [isRefreshing, isLoggingOut, refreshAccessToken, logout]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const refresh = async () => {
            try {
                await refreshAccessToken(); // faz request ao backend, backend usa refresh_token do httpOnly cookie
                console.log("Access token renovado ✅");
            } catch (err) {
                console.error("Falha ao atualizar token:", err);
            }
        };

        // chama refresh a cada 13 minutos (antes dos 15 min)
        interval = setInterval(refresh, 13 * 60 * 1000);

        // chama uma vez logo ao montar (garantir sincronização inicial)
        refresh();

        return () => clearInterval(interval);
    }, []);

    // Recupera sessão ao carregar o app
    useEffect(() => {

        api.get("/auth/me", { withCredentials: true })
            .then(response => {
                // console.log("dados do user: ", response.data)
                storeLoginData(response.data)
            })
            .catch((err) => {
                console.error("Erro em /auth/me:", err);
                if (user || token) {
                    logout()
                }
            })
            .finally(() => setIsLoading(false));

    }, []);

    const storeLoginData = useCallback((user: Usuario) => {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    }, []);

    const login = useCallback(async (provider: AuthProvider, options?: LoginOptions) => {
        setIsLoading(true);
        const providerUrls: Record<AuthProvider, string> = {
            google: "/oauth2/google/login",
            "azure-ad": "/login/azure-ad",
            facebook: "/login/facebook",
            github: "/oauth2/github/login",
            gitlab: "/login/gitlab",
            credenciais: "",
        };

        if (provider !== "credenciais") {
            window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_AUTH_URL}${providerUrls[provider]}`;
            setIsLoading(false);
            return true;
        }

        try {
            const response = await api.post("/auth/login", options?.credenciais ?? {});
            // console.log("Login bem-sucedido:", response.data.user);
            storeLoginData(response.data.user);
            // if (options?.redirect)
            //route.push(options.redirect);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            setIsLoading(false);
            throw error;
        }
    }, [storeLoginData]);



    return (

        <SessionContext.Provider value={{ user, token, isAuthenticated: isAuthenticated, isLoading, login, logout, api }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession deve ser usado dentro de um SessionProvider");
    return context;
};
