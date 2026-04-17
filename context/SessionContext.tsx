
"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";

import type { Axios } from "axios";
import api from "./axioCuston";
import usePersistedState from "@/hook/localStoreUse";
import { aes_decrypt } from "@/service";
import { AuthProvider, LoginOptions, Usuario } from "@/types";


interface SessionData {
    user: Usuario | null;
    token?: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: AuthProvider, options?: LoginOptions) => Promise<boolean>;
    logout: (redirect?: string | null) => Promise<boolean>;
    api: Axios;
}

const desencriptarUser = (user: Usuario): Usuario => {
    // Verifica se o utilizador existe e se tem um email para desencriptar
    if (user?.email) {
        return {
            ...user,
            id: aes_decrypt(user.id),

            // Novos campos: Só desencripta se o valor não for null/undefined
            nome: user.nome ? aes_decrypt(user.nome) : user.nome,
            apelido: user.apelido ? aes_decrypt(user.apelido) : user.apelido,
            email: aes_decrypt(user.email), // O email costuma ser obrigatório
            telefone: user.telefone ? aes_decrypt(user.telefone) : user.telefone,

            // Roles e Permissões mantêm-se iguais
            roles: user.roles?.map(role => ({
                ...role,
                name: aes_decrypt(role.name)
            })) || [],
            permissions: user.permissions?.map(perm => aes_decrypt(perm)) || [],
        };
    }

    // Se não tiver email ou o objeto for inválido, devolve como está
    return user;
};


const SessionContext = createContext<SessionData | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = usePersistedState<Usuario | null>("_user_logado", null);
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
            setIsLoggingOut(false);
            setIsLoading(false);
            if (redirect) {
                // route.push(redirect);
            }
            fetch("/api/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: "" }),
            });

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


        const refresh = async () => {
            try {
                await refreshAccessToken(); // faz request ao backend, backend usa refresh_token do httpOnly cookie
                console.log("Access token renovado ✅");
            } catch (err) {
                console.error("Falha ao atualizar token:", err);
            }
        };

        // chama refresh a cada 13 minutos (antes dos 15 min)
        const interval: NodeJS.Timeout = setInterval(refresh, 13 * 60 * 1000);

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
                if (user) {
                    logout()
                }
            })
            .finally(() => setIsLoading(false));

    }, []);

    const storeLoginData = useCallback((user: Usuario) => {
        setUser(desencriptarUser(user));
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

            // const { user } = await response.json();
            // console.log("Login bem-sucedido:", response.data);
            storeLoginData(response.data.user);
            fetch("/api/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.data.user?.email }),
            });
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

        <SessionContext.Provider value={{ user, isAuthenticated: isAuthenticated, isLoading, login, logout, api }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession deve ser usado dentro de um SessionProvider");
    return context;
};
