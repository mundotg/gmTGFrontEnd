export type NumericStats = {
  min: number;
  max: number;
  min_row?: Record<string, unknown> | null;
  max_row?: Record<string, unknown> | null;
  min_index?: number | string | null;
  max_index?: number | string | null;
  mean: number;
  median: number;
  std: number;
  q25: number;
  q75: number;
  zeros: number;
  negatives: number;
  p90?: number;
  p95?: number;
  p99?: number;
  mode?: number | null;
  range?: number;
  cv?: number | null;
  skew?: number | null;
  kurtosis?: number | null;
  outliers?: { count: number; pct: number; lower: number; upper: number };
  histogram: { counts: number[]; edges: number[] };
};

export type CatStats = {
  cardinality: number;
  is_text: boolean;
  mode?: string | null;
  imbalance_pct?: number;
  entropy?: number;
  semantic?: string | null;
  top: { value: string; count: number; pct: number }[];
};

export type QualityDimension = {
  name: string;
  weight: number;
  weight_pct: number;
  score: number;
  weighted_score: number;
  status: "Excelente" | "Bom" | "Atenção" | "Crítico";
  description: string;
  metrics: string;
};

export type CriticalField = {
  column: string;
  completeness_pct: number;
  nulls: number;
  reason?: string;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  referenced_table?: string | null;
  tipo_db?: string | null;
};

export type Quality = {
  score: number;
  formula?: string;
  dimensions?: QualityDimension[];
  critical_completeness_pct?: number;
  critical_fields?: CriticalField[];
  completeness_by_column?: {
    column: string;
    completeness_pct: number;
    nulls: number;
    is_critical: boolean;
    is_identifier: boolean;
    reason?: string | null;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
    referenced_table?: string | null;
    tipo_db?: string | null;
  }[];
  constant_columns: string[];
  high_null_columns: string[];
  potential_keys: string[];
};

export type Trend = {
  has_enough_data?: boolean;
  time_column?: string;
  measure: string;
  freq: string;
  direction: string;
  change_pct: number;
  forecast_next?: number | null;
  forecast_ci_lower?: number | null;
  forecast_ci_upper?: number | null;
  confidence_level?: number;
  margin_of_error?: number | null;
  r_squared?: number | null;
  data_points?: number;
  min_required_points?: number;
  reason?: string;
  series: { t: string; v: number; trend?: number | null }[];
};

export type AnomalyRow = {
  index: number;
  record_id?: string;
  score: number;
  culprit_column?: string;
  culprit_value?: unknown;
  culprit_z?: number;
  justification?: string;
  row: Record<string, unknown>;
};

export type Anomalies = {
  count: number;
  method?: string;
  rows: AnomalyRow[];
};

export type ClusterRequirement = {
  label: string;
  met: boolean;
  current: string;
};

export type Segments = {
  has_enough_data?: boolean;
  reason?: string;
  details?: string;
  requirements?: ClusterRequirement[];
  k: number;
  columns: string[];
  segments: {
    id: number;
    size: number;
    pct: number;
    center: Record<string, number>;
  }[];
};

export type ColumnStat = {
  name: string;
  kind: "numeric" | "categorical" | "datetime" | "boolean";
  is_identifier?: boolean;
  is_critical?: boolean;
  completeness_pct?: number;
  count: number;
  nulls: number;
  null_pct: number;
  distinct: number;
  distinct_pct: number;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  is_auto_increment?: boolean;
  is_nullable?: boolean;
  referenced_table?: string | null;
  field_references?: string | null;
  tipo_db?: string | null;
  comentario?: string | null;
  db_meta?: {
    tableName?: string;
    nome?: string;
    tipo?: string;
    is_nullable?: boolean;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
    is_auto_increment?: boolean;
    referenced_table?: string | null;
    field_references?: string | null;
    is_unique?: boolean;
    default?: string | null;
    comentario?: string | null;
    length?: number | null;
    precision?: number | null;
    scale?: number | null;
    is_unsigned?: boolean;
  };
  numeric?: NumericStats;
  categorical?: CatStats;
  datetime?: {
    min: string;
    max: string;
    min_row?: Record<string, unknown> | null;
    max_row?: Record<string, unknown> | null;
    min_index?: number | string | null;
    max_index?: number | string | null;
  };
  boolean?: { true: number; false: number };
};

export type Overview = {
  n_rows: number;
  n_cols: number;
  n_duplicated: number;
  total_cells: number;
  total_nulls: number;
  null_pct: number;
  memory_kb: number;
};

export type Corr = {
  columns: string[];
  matrix: (number | null)[][];
};

export type PersistedResult = {
  QueryPayload?: Record<string, unknown>;
  preview?: Record<string, unknown>[];
  tabela_coluna?: Record<string, unknown>;
} | null;

export const fmt = (n: number | undefined | null): string =>
  n == null
    ? "—"
    : Math.abs(n) >= 1000
    ? n.toLocaleString()
    : Number.isInteger(n)
    ? String(n)
    : n.toFixed(2);
