export type NumericStats = {
  min: number;
  max: number;
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

export type Quality = {
  score: number;
  constant_columns: string[];
  high_null_columns: string[];
  potential_keys: string[];
};

export type Trend = {
  measure: string;
  freq: string;
  direction: string;
  change_pct: number;
  forecast_next: number;
  series: { t: string; v: number }[];
};

export type Anomalies = {
  count: number;
  rows: { index: number; score: number; row: Record<string, unknown> }[];
};

export type Segments = {
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
  count: number;
  nulls: number;
  null_pct: number;
  distinct: number;
  distinct_pct: number;
  numeric?: NumericStats;
  categorical?: CatStats;
  datetime?: { min: string; max: string };
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
} | null;

export const fmt = (n: number | undefined | null): string =>
  n == null
    ? "—"
    : Math.abs(n) >= 1000
    ? n.toLocaleString()
    : Number.isInteger(n)
    ? String(n)
    : n.toFixed(2);
