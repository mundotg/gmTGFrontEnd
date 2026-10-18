// types/transfer-types.ts
export interface ColumnMapping {
  coluna_origen_name: string;
  coluna_distino_name: string;
  type_coluna_origem: string;
  type_coluna_destino: string;
  id_coluna_origem: number;
  id_coluna_destino: number;
  enabled: boolean;
}

export interface TableMapping {
  tabela_name_origem: string;
  tabela_name_destino: string;
  id_tabela_origen: number;
  id_tabela_destino: number;
  custom_query?: string;
  where_clause?: string;
  colunas_relacionados_para_transacao: ColumnMapping[];
}

export interface TransferConfig {
  bd_origen: string;
  bd_distino: string;
  tabelas: Record<string, TableMapping>;
}

export interface QueryImpact {
  supported: boolean;
  dialect?: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  scan_type: "INDEX_SCAN" | "SEQUENTIAL_SCAN" | "COLLECTION_SCAN" | "FULL_TABLE_SCAN" | "UNKNOWN" | string;
  table_name?: string | null;
  estimated_rows?: number;
  estimated_cost?: number;
  estimated_duration_ms?: number;
  summary: string;
  warning?: string | null;
  suggestions: string[];
  requires_confirmation: boolean;
  raw_plan?: unknown;
}