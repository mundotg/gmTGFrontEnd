
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type AuthType = "none" | "bearer" | "basic";
export type ActiveTab = "test" | "batch" | "validate";

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