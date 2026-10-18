export interface LineageNode {
  id: string;
  type: "table" | "transformation" | "database";
  label: string;
  database_name?: string;
  db_type?: string;
  table_name?: string;
  columns_count?: number;
  columns?: string[];
  connection_id?: number;
  level: number;
  metadata?: {
    event_id?: number;
    transformation_type?: string;
    query?: string;
    rule?: string;
    rows_transferred?: number;
    duration_ms?: number;
    status?: string;
    created_at?: string;
    total_flows_origin?: number;
    total_flows_dest?: number;
    [key: string]: any;
  };
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  rows?: number;
  duration_ms?: number;
  query?: string;
  transformation_type?: string;
  status?: string;
  timestamp?: string;
}

export interface LineageSummary {
  total_sources: number;
  total_targets: number;
  total_transformations: number;
  total_volume_records: number;
  databases_involved: string[];
  active_flows_count: number;
  average_duration_ms: number;
}

export interface LineageGraphResponse {
  nodes: LineageNode[];
  edges: LineageEdge[];
  summary: LineageSummary;
}

export interface LineageEvent {
  id: number;
  source_connection_id?: number;
  source_connection_name?: string;
  source_db_type?: string;
  source_table: string;
  source_query?: string;
  target_connection_id?: number;
  target_connection_name?: string;
  target_db_type?: string;
  target_table: string;
  columns_mapping?: Array<{ source: string; target: string; type?: string }>;
  transformation_type: string;
  transformation_rule?: string;
  rows_transferred: number;
  duration_ms: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface TableImpactAnalysis {
  table_name: string;
  connection_id?: number;
  database_name?: string;
  upstream_sources: Array<{
    source_table: string;
    source_database?: string;
    db_type?: string;
    query?: string;
    transformation?: string;
    last_rows?: number;
    last_updated?: string;
  }>;
  downstream_dependents: Array<{
    target_table: string;
    target_database?: string;
    db_type?: string;
    transformation?: string;
    last_rows?: number;
    last_updated?: string;
  }>;
  total_dependent_tables: number;
  risk_assessment: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_explanation: string;
}
