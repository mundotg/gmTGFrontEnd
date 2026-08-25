
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type AuthType = "none" | "bearer" | "basic";
export type ActiveTab =
  | "test"
  | "batch"
  | "validate"
  | "bruteforce"
  | "loadtest"
  | "websocket"
  | "sse"
  | "history";

export type EnvVars = Record<string, string | number | boolean | null>;

export type HeadersMap = Record<string, string>;

export type ApiResponseSuccess = {
  kind: "success";
  id: number;
  timestamp: string;
  name: string;
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  timeMs: number; // number (não string)
  sizeBytes: number;
  data: unknown;
  isJson: boolean;
  headers: HeadersMap;
};

export type ApiResponseError = {
  kind: "error";
  id: number;
  timestamp: string;
  error: string;
  errorDetails?: string;
};

export type ApiResponse = ApiResponseSuccess | ApiResponseError;

/* =========================
   TYPES
========================= */




export type ValidationRules = {
  statusCode?: number | number[];
  maxTime?: number; // ms
  requiredFields?: string[];
  maxSize?: number; // bytes
};

export type ValidationResultItem = {
  type:
    | "Status Code"
    | "Max Response Time"
    | "Response Size"
    | "Required Field"
    | "Required Fields"
    | "Validation Error";
  rule: unknown;
  value: string | number | string[];
  passed: boolean;
};

export type BatchAuth = {
  type?: "bearer" | "basic";
  token?: string;
  encode? : boolean
};

export type BatchRequestItem = {
  name?: string;
  method?: HttpMethod;
  url?: string;
  headers?: string; // JSON string
  body?: string; // string JSON
  auth?: BatchAuth;
};

export type BatchResultItem = {
  name: string;
  status: number | "ERROR";
  timeMs: number;
  passed: boolean;
  error?: string;
};
/* ============================================================
 * 🛡️ PENTEST / TESTES DE SEGURANÇA
 * ============================================================ */

export type TestKind = "bruteforce" | "loadtest" | "websocket" | "sse" | "request";
export type AttemptOutcome =
  | "success"
  | "failure"
  | "error"
  | "rate_limited"
  | "message";

/** Um evento SSE emitido pelo backend durante um teste. */
export type PentestEvent =
  | { event: "start"; run_id: number; total: number; kind: TestKind; concurrency?: number }
  | {
      event: "attempt";
      seq: number;
      total: number;
      payload?: string;
      status_code: number | null;
      latency_ms: number;
      outcome: AttemptOutcome;
      success: number;
      failure: number;
      errors: number;
      rate_limited: number;
    }
  | {
      event: "progress";
      done: number;
      total: number;
      success: number;
      failure: number;
      errors: number;
      rate_limited: number;
      last_latency_ms: number;
    }
  | { event: "info"; message: string }
  | { event: "error"; message: string; run_id?: number }
  | { event: "end"; run_id: number; status: string; finding: string; totals: RunTotals };

export type RunTotals = {
  total_attempts: number;
  success_count: number;
  failure_count: number;
  error_count: number;
  rate_limited_count: number;
  throughput_rps: number;
  avg_ms: number;
  min_ms: number;
  max_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
};

export type BruteForceConfig = {
  label?: string;
  target_url: string;
  method?: string;
  body_template?: string;
  headers?: Record<string, string>;
  usernames?: string[];
  passwords?: string[];
  credentials?: { username: string; password: string }[];
  success_status_codes?: number[];
  success_body_contains?: string;
  delay_ms?: number;
  stop_on_success?: boolean;
  stop_after_rate_limited?: number;
};

export type LoadTestConfig = {
  label?: string;
  target_url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  total_requests?: number;
  concurrency?: number;
  timeout_ms?: number;
};

export type PentestAttempt = {
  id: number;
  seq: number;
  payload?: string | null;
  status_code?: number | null;
  latency_ms: number;
  outcome?: string | null;
  detail?: string | null;
  method?: string | null;
  endpoint?: string | null;
  request_headers?: Record<string, string> | null;
  request_body?: string | null;
  response_headers?: Record<string, string> | null;
  response_body?: string | null;
  response_size?: number | null;
  created_at?: string | null;
};

export type PentestRun = {
  id: number;
  user_id?: number | null;
  user_email?: string | null;
  kind: TestKind;
  label?: string | null;
  target_url: string;
  method?: string | null;
  status: string;
  total_attempts: number;
  success_count: number;
  failure_count: number;
  error_count: number;
  rate_limited_count: number;
  avg_ms: number;
  min_ms: number;
  max_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  throughput_rps: number;
  finding?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms: number;
};

export type PentestRunDetail = PentestRun & {
  attempts: PentestAttempt[];
};

export type PentestStats = {
  total_runs: number;
  runs_by_kind: Record<string, number>;
  total_attempts: number;
  total_success: number;
  total_rate_limited: number;
  total_errors: number;
  avg_p95_ms: number;
  credentials_found: number;
  last_run_at?: string | null;
};

export type PentestLimits = {
  allowed_hosts: string[];
  max_attempts: number;
  max_requests: number;
  max_concurrency: number;
};

/** Um evento numa sessão de cliente WS/SSE (guardado no fim). */
export type ClientEvent = {
  seq: number;
  outcome: AttemptOutcome;
  status_code?: number | null;
  latency_ms: number;
  detail?: string;
  payload?: string;
  ts: number;
};

/** Um request guardado na coleção do utilizador (persistido na BD). */
export type SavedRequest = {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: string;
  body?: string;
  authType?: AuthType;
  authToken?: string;
  encodeBasicAuth?: boolean;
  createdAt?: string;
};

export type TesterConfig = {
  env_vars: EnvVars;
  saved_requests: SavedRequest[];
  updated_at?: string | null;
};
