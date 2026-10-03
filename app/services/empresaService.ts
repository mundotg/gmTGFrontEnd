// app/services/empresaService.ts
import api from "@/context/axioCuston";

export interface EmpresaItem {
  id: number;
  nome: string;
  company?: string;
  tamanho?: string | null;
  companySize?: string | null;
  nif?: string | null;
  endereco?: string | null;
  is_active?: boolean;
  users_count?: number;
  criado_em?: string | null;
  can_manage?: boolean;
}

export interface EmpresaPaginadaResposta {
  items: EmpresaItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  is_admin: boolean;
}

export interface FetchEmpresasParams {
  page?: number;
  pageSize?: number;
  busca?: string;
  status?: "todas" | "ativas" | "inativas";
  forceRefresh?: boolean;
}

interface CacheEntry {
  data: EmpresaPaginadaResposta;
  timestamp: number;
}

// 📦 Armazém de cache local para as requisições de empresas (TTL de 2 minutos)
const empresaCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

export function getEmpresaCacheKey(params: FetchEmpresasParams): string {
  const p = params.page || 1;
  const s = params.pageSize || 10;
  const b = (params.busca || "").trim().toLowerCase();
  const st = params.status || "todas";
  return `empresa_${st}_p${p}_s${s}_q${b}`;
}

export function clearEmpresaFrontendCache(): void {
  empresaCache.clear();
}

/**
 * Busca empresas de forma paginada e com cache no frontend.
 * Garante que tanto `nome` quanto `company` venham preenchidos.
 */
export async function fetchEmpresasPaginadas(
  params: FetchEmpresasParams = {}
): Promise<EmpresaPaginadaResposta> {
  const cacheKey = getEmpresaCacheKey(params);

  // 1. Tenta recuperar do cache local do frontend
  if (!params.forceRefresh) {
    const cached = empresaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Busca na API (o backend também aplica cache em Redis/L1)
  const { data } = await api.get<EmpresaPaginadaResposta>("/empresas", {
    params: {
      page: params.page || 1,
      page_size: params.pageSize || 10,
      busca: params.busca?.trim() || undefined,
      status: params.status || "todas",
    },
  });

  // 3. Normalização para garantir consistência
  const normalizedItems: EmpresaItem[] = (data.items || []).map((item) => {
    const nome = item.nome || item.company || "";
    return {
      ...item,
      nome,
      company: nome,
    };
  });

  const response: EmpresaPaginadaResposta = {
    items: normalizedItems,
    total: data.total || 0,
    page: data.page || params.page || 1,
    page_size: data.page_size || params.pageSize || 10,
    total_pages: data.total_pages || Math.max(1, Math.ceil((data.total || 0) / (params.pageSize || 10))),
    is_admin: Boolean(data.is_admin),
  };

  // 4. Salva no cache com limite de tamanho
  if (empresaCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = empresaCache.keys().next().value;
    if (oldestKey) empresaCache.delete(oldestKey);
  }

  empresaCache.set(cacheKey, {
    data: response,
    timestamp: Date.now(),
  });

  return response;
}

/**
 * Provedor de opções paginadas para componentes de Select (ex: JoinSelect).
 */
export async function fetchEmpresasOptions(
  page: number,
  search: string,
  includeNoneOption = false
): Promise<{
  options: { value: string; label: string }[];
  hasMore: boolean;
  total: number;
}> {
  const data = await fetchEmpresasPaginadas({
    page,
    pageSize: 10,
    busca: search,
    status: "todas",
  });

  const options: { value: string; label: string }[] = [];

  // Se for a primeira página e não houver termo de busca, adiciona a opção de nenhuma empresa
  if (page === 1 && !search.trim() && includeNoneOption) {
    options.push({
      value: "",
      label: "— Nenhuma (Global / Plataforma) —",
    });
  }

  for (const emp of data.items || []) {
    options.push({
      value: String(emp.id),
      label: emp.nome || emp.company || `Empresa #${emp.id}`,
    });
  }

  return {
    options,
    hasMore: page < (data.total_pages || 1),
    total: data.total || 0,
  };
}
