import axios from 'axios';
import { notifyForbidden } from './forbiddenEvents';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor global para capturar erros 403 (Permissão negada) e avisar a interface
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 403) {
      const detail = error.response.data?.detail;
      const message =
        (typeof detail === 'string' ? detail : null) ||
        (Array.isArray(detail) && detail[0]?.msg ? detail[0].msg : null) ||
        error.response.data?.message ||
        error.response.data?.error ||
        'Acesso negado: Você não possui permissão para realizar esta operação.';

      notifyForbidden({
        message,
        status: 403,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      });
    }
    return Promise.reject(error);
  }
);

export default api;

