// =======================
// SOURCE OF TRUTH
// =======================

export const QUERY_TYPES = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "OTHER",
  "COUNT",
  "ADD COLUMN",
  "REMOVE COLUMN",
  "ALTER COLUMN",
  "ADD FK",
  "REMOVE FK",
  "CREATETABLE",
  "ALTERTABLE",
  "DROPTABLE",
] as const;

export type QueryType = (typeof QUERY_TYPES)[number];

// =======================
// HELPERS (🔥 NOVO)
// =======================

// 🔥 validação rápida e segura
export const isValidQueryType = (value: string): value is QueryType => {
  return QUERY_TYPES.includes(value as QueryType);
};

// 🔥 normalização (evita bugs vindo do backend)
export const normalizeQueryType = (value?: string | null): QueryType => {
  if (!value) return "OTHER";

  const normalized = value.toUpperCase().trim();

  return isValidQueryType(normalized) ? normalized : "OTHER";
};

// =======================
// TYPES AUXILIARES (🔥 NOVO)
// =======================

export type QueryMetaInfo = {
  rows_affected?: number;
  execution_plan?: string;
  cache_hit?: boolean;
  [key: string]: unknown;
};

// =======================
// MAIN INTERFACE
// =======================

export interface QueryHistory {
  id: number;

  // 🔹 Relacionamentos
  user_id: number | null;
  db_connection_id: number | null;

  // 🔹 Query
  query: string;
  query_type?: QueryType | null;
  duration_ms: number | null;
  result_preview: string | null;
  error_message: string | null;

  // 🔹 Flags
  is_favorite: boolean;
  tags: string | null;

  // 🔹 Origem
  app_source: string | null;
  client_ip: string | null;
  executed_by: string | null;

  // 🔹 Metadata (melhor tipado)
  meta_info: QueryMetaInfo | null;

  // 🔹 Datas
  executed_at: string;
  updated_at: string;
  modified_by: string | null;
}