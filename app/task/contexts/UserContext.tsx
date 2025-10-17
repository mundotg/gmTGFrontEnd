"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";
import { LoginResponse, UsuarioTaskCreate } from "../types";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface SessionContextType {
  user: LoginResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  api: AxiosInstance;
  login: (email: string, password: string) => Promise<void>;
  register: (data:UsuarioTaskCreate) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType>({} as SessionContextType);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getAccessToken = () => (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  const getRefreshToken = () => (typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null);

  const api = useMemo(() => axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  }), []);

  // ✅ Interceptor de requisição → adiciona o token
  api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.tokena = `Bearer ${token}`;
    return config;
  });

  // ✅ Gerenciamento da fila de refresh
  let isRefreshing = false;
  let failedQueue: {
    resolve: (value?: unknown) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void;
  }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    failedQueue = [];
  };

  // ✅ Interceptor de resposta → refresh automático de token
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalRequest = error.config as any;
      if (error.response?.status === 401 && !originalRequest._retry) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.tokena = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log("🔄 Tentando atualizar token via /usuario/refresh");
          const { data } = await axios.get<LoginResponse>(`${API_URL}usuario/refresh`, {
            withCredentials: true,
            headers: { refresh_token: refreshToken },
          });

          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          api.defaults.headers.tokena = `Bearer ${data.access_token}`;

          processQueue(null, data.access_token);
          console.log("✅ Token atualizado com sucesso");
          return api(originalRequest);
        } catch (err) {
          console.error("❌ Falha ao atualizar token:", err);
          processQueue(err, null);
          logout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  // ✅ Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data } = await api.post<LoginResponse>("/usuario/login", { email, senha: password });

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("❌ Erro no login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // ✅ Registro
  const register = useCallback(
    async (data:UsuarioTaskCreate) => {
      await api.post("/usuario/", data );
    },
    [api]
  );

  // ✅ Logout
  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ✅ Validação inicial de sessão
  useEffect(() => {
    const refreshSession = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔁 Atualizando sessão inicial com refresh token...");
        const { data } = await api.get<LoginResponse>("/usuario/refresh", {
          headers: { refresh_token: refreshToken },
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        setUser(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.warn("⚠️ Sessão expirada:", err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    refreshSession();

    // Atualiza o token a cada 13 minutos
    const interval = setInterval(refreshSession, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [logout, api]);

  return (
    <SessionContext.Provider
      value={{ user, isLoading, isAuthenticated, api, login, register, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionTask = () => useContext(SessionContext);
