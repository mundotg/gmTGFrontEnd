import axios, { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { notifyForbidden } from './forbiddenEvents';

/**
 * 🛡️ DEDUPLICAÇÃO GLOBAL E CACHE DE CURTO PRAZO PARA O AXIOS
 * 
 * Evita que componentes re-renderizados ou requisições paralelas disparem múltiplos
 * pedidos HTTP idênticos na mesma fração de segundo para o backend.
 * 
 * 1. Deduplicação em voo: Se um GET já está em andamento, todas as chamadas aguardam a mesma Promise.
 * 2. Cache de fração de segundo (TTL 1200ms): Respostas recentes idênticas são servidas instantaneamente.
 * 3. Invalidação automática em mutações: Qualquer POST/PUT/DELETE/PATCH limpa o cache de leituras.
 */

const defaultAdapter: AxiosAdapter = axios.getAdapter(
  axios.defaults.adapter || ['xhr', 'http', 'fetch']
);

interface CachedItem {
  timestamp: number;
  response: AxiosResponse;
}

const inFlightRequests = new Map<string, Promise<AxiosResponse>>();
const recentGetCache = new Map<string, CachedItem>();

// Janela padrão para barrar repetições na mesma fração de segundo (1200ms)
const DEFAULT_DEDUPE_TTL = 1200;

function serializeParams(params: any): string {
  if (!params) return '';
  if (typeof params === 'string') return params;
  try {
    const keys = Object.keys(params).sort();
    return keys.map((k) => `${k}=${encodeURIComponent(String(params[k]))}`).join('&');
  } catch {
    return String(params);
  }
}

function buildRequestKey(config: InternalAxiosRequestConfig): string {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const params = serializeParams(config.params);
  return `${method}:${url}?${params}`;
}

/**
 * Invalida manualmente o cache de requisições GET (ou apenas chaves que contenham o padrão).
 */
export function invalidateApiCache(pattern?: string | RegExp): void {
  if (!pattern) {
    recentGetCache.clear();
    return;
  }
  for (const key of recentGetCache.keys()) {
    if (typeof pattern === 'string' && key.includes(pattern)) {
      recentGetCache.delete(key);
    } else if (pattern instanceof RegExp && pattern.test(key)) {
      recentGetCache.delete(key);
    }
  }
}

// Adaptador customizado de deduplicação
const dedupeAdapter: AxiosAdapter = async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const customConfig = config as InternalAxiosRequestConfig & {
    skipDedupe?: boolean;
    forceRefresh?: boolean;
    dedupeTtl?: number;
  };

  // Se for qualquer mutação (POST, PUT, DELETE, PATCH), invalida o cache de leitura imediatamente
  if (method !== 'get') {
    recentGetCache.clear();
    return defaultAdapter(config);
  }

  // Se a requisição pediu explicitamente para pular a deduplicação
  if (customConfig.skipDedupe || customConfig.forceRefresh) {
    return defaultAdapter(config);
  }

  const key = buildRequestKey(config);
  const now = Date.now();
  const ttl = customConfig.dedupeTtl ?? DEFAULT_DEDUPE_TTL;

  // 1. Verifica se temos resposta idêntica muito recente (fração de segundos)
  const cached = recentGetCache.get(key);
  if (cached && now - cached.timestamp < ttl) {
    return {
      ...cached.response,
      config,
    };
  }

  // 2. Se já existe um pedido idêntico em voo, reaproveita a mesma Promise
  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    const res = await inFlight;
    return {
      ...res,
      config,
    };
  }

  // 3. Executa a requisição real
  const requestPromise = (async () => {
    try {
      const response = await defaultAdapter(config);
      // Salva no cache de curto prazo
      recentGetCache.set(key, {
        timestamp: Date.now(),
        response: {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: response.config,
          request: response.request,
        },
      });
      return response;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: dedupeAdapter,
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
