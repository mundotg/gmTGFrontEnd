
"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from "react";

import type { Axios } from "axios";
import api from "./axioCuston";
import usePersistedState from "@/hook/localStoreUse";
import { onConnectionChanged } from "./connectionEvents";
import { aes_decrypt } from "@/service";
import { AuthProvider, LoginOptions, Usuario } from "@/types";


interface SessionData {
    user: Usuario | null;
    token?: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: AuthProvider, options?: LoginOptions) => Promise<boolean>;
    logout: (redirect?: string | null) => Promise<boolean>;
    /** Relê o /auth/me — usar depois de mudar a conexão ativa. */
    refreshUser: () => Promise<void>;
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

// 🛡️ Controlo de concorrência e cache a nível de módulo (evita tempestade de requisições e loops de 401)
let refreshPromise: Promise<boolean> | null = null;
let logoutPromise: Promise<boolean> | null = null;
let authMePromise: Promise<any> | null = null;
let lastAuthMeFetchTime = 0;
const AUTH_ME_CACHE_TTL = 30000; // 30 segundos de cache no cliente

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = usePersistedState<Usuario | null>("_user_logado", null);
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = useMemo(() => !!user, [user]);

    const storeLoginData = useCallback((userData: Usuario) => {
        setUser(desencriptarUser(userData));
    }, [setUser]);

    const logout = useCallback(async (redirect: string | null = null) => {
        if (logoutPromise) {
            return logoutPromise;
        }

        logoutPromise = (async () => {
            setIsLoading(true);
            try {
                await api.post("/auth/logout").catch(() => {});
                setUser(null);
                lastAuthMeFetchTime = 0;
            } catch (error) {
                console.warn("Erro ao deslogar:", error);
            } finally {
                setIsLoading(false);
                logoutPromise = null;
                try {
                    fetch("/api/login", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: "" }),
                    }).catch(() => {});
                } catch {}
                sessionStorage.removeItem("login_done");
                sessionStorage.removeItem("login_retry");
            }
            return true;
        })();

        return logoutPromise;
    }, [setUser]);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        // Se já existe um pedido de refresh em curso, todas as requisições paralelas aguardam a mesma Promise
        if (refreshPromise) {
            return refreshPromise;
        }

        refreshPromise = (async () => {
            try {
                await api.post('/auth/refresh', {}, { withCredentials: true });
                return true;
            } catch {
                return false;
            } finally {
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    }, []);

    // 🛑 Interceptor para Renovação e Logout Automático no erro 401 (sem loops de requisições)
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            response => response,
            async (error) => {
                const originalRequest = error.config;
                const url = originalRequest?.url || "";

                // NUNCA interceptar rotas de autenticação para evitar loops infinitos
                if (
                    url.includes("/auth/refresh") ||
                    url.includes("/auth/logout") ||
                    url.includes("/auth/login")
                ) {
                    return Promise.reject(error);
                }

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const success = await refreshAccessToken();
                    if (success) {
                        return api(originalRequest);
                    } else {
                        await logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => api.interceptors.response.eject(interceptor);
    }, [refreshAccessToken, logout]);

    // 🔄 Renovação de token periódica APENAS se o utilizador estiver autenticado
    useEffect(() => {
        if (!isAuthenticated) return;

        const refresh = async () => {
            try {
                await refreshAccessToken();
                console.log("Access token renovado ✅");
            } catch (err) {
                console.error("Falha ao atualizar token:", err);
            }
        };

        const interval: NodeJS.Timeout = setInterval(refresh, 13 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isAuthenticated, refreshAccessToken]);

    // 📦 Recupera sessão ao carregar com Cache e Deduplicação unificada
    const initialCheckDone = useRef(false);

    const fetchUserData = useCallback(async (options?: { force?: boolean }): Promise<Usuario | null> => {
        const now = Date.now();
        const force = options?.force ?? false;

        // Se não for forçado e já temos dados recentes (TTL 30s), devolve sem ir à rede
        if (!force && user && lastAuthMeFetchTime > 0 && (now - lastAuthMeFetchTime < AUTH_ME_CACHE_TTL)) {
            return user;
        }

        // Se uma requisição de /auth/me já está em andamento, reaproveita a mesma Promise
        if (authMePromise) {
            return authMePromise;
        }

        authMePromise = (async () => {
            try {
                const response = await api.get("/auth/me", {
                    withCredentials: true,
                    timeout: 25000,
                    ...(force ? { forceRefresh: true } : {}),
                });
                lastAuthMeFetchTime = Date.now();
                if (response.data) {
                    storeLoginData(response.data);
                    return response.data;
                }
                return null;
            } catch (err: any) {
                lastAuthMeFetchTime = 0;
                if (err?.response?.status !== 401) {
                    console.error("Erro em /auth/me:", err);
                } else if (user) {
                    // Apenas realiza logout se o utilizador constava como logado e o backend rejeitou expressamente
                    await logout();
                }
                return null;
            } finally {
                authMePromise = null;
            }
        })();

        return authMePromise;
    }, [user, storeLoginData, logout]);

    useEffect(() => {
        let isMounted = true;

        if (initialCheckDone.current) {
            return;
        }
        initialCheckDone.current = true;

        fetchUserData()
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [fetchUserData]);

    /**
     * Relê o `/auth/me` forçadamente (ignora cache local). O `info_extra` (base de dados ativa, nº de tabelas…)
     * só era lido no arranque, por isso o menu ficava a mostrar a conexão
     * antiga até se recarregar a página.
     */
    const refreshUser = useCallback(async () => {
        try {
            await fetchUserData({ force: true });
        } catch (err) {
            // Falhar aqui não deve deslogar: é uma revalidação, não o arranque.
            console.warn("Não foi possível atualizar a sessão:", err);
        }
    }, [fetchUserData]);

    // Qualquer alteração à conexão ativa (nesta aba ou noutra) atualiza o menu com debounce.
    useEffect(() => {
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const unsubscribe = onConnectionChanged(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                void refreshUser();
            }, 300);
        });
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            unsubscribe();
        };
    }, [refreshUser]);

    const login = useCallback(async (provider: AuthProvider, options?: LoginOptions) => {
        setIsLoading(true);
        const providerUrls: Record<AuthProvider, string> = {
            google: "/oauth2/google/login",
            "azure-ad": "/login/azure-ad",
            github: "/oauth2/github/login",
            facebook: "/facebook/login",
            linkedin: "/linkedin/login",
            microsoft: "/microsoft/login",
            gitlab: "/gitlab/login",
            discord: "/discord/login",
            kaggle: "/kaggle/login", // ⚠️ cuidado (não tem OAuth oficial)
            auth0: "/auth0/login",
            credenciais: "",
        };

        if (provider !== "credenciais") {
            const nextParam = options?.redirect ? `?next=${encodeURIComponent(options.redirect)}` : "";
            window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_AUTH_URL}${providerUrls[provider]}${nextParam}`;
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

        <SessionContext.Provider value={{ user, isAuthenticated: isAuthenticated, isLoading, login, logout, refreshUser, api }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession deve ser usado dentro de um SessionProvider");
    return context;
};
