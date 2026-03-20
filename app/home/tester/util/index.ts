import { BarChart3, CheckCircle, TestTube } from "lucide-react";
import {
  ApiResponse,
  AuthType,
  EnvVars,
  ValidationResultItem,
} from "../types";

export const TESTER_TABS = [
  { id: "test" as const, label: "Teste Único", icon: TestTube },
  { id: "batch" as const, label: "Testes em Lote", icon: BarChart3 },
  { id: "validate" as const, label: "Validações", icon: CheckCircle },
];

export const batchRequestsPlaceholder = `[
  {
    "name": "Listar utilizadores",
    "method": "GET",
    "url": "\${BASE_URL}/users"
  },
  {
    "name": "Criar utilizador",
    "method": "POST",
    "url": "\${BASE_URL}/users",
    "headers": "{\\"Content-Type\\":\\"application/json\\"}",
    "body": "{\\"name\\":\\"Francemy\\",\\"email\\":\\"teste@email.com\\"}"
  },
  {
    "name": "Login Basic",
    "method": "GET",
    "url": "\${BASE_URL}/secure",
    "auth": {
      "type": "basic",
      "token": "usuario:senha",
      "encode": true
    }
  }
]`;

export const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

export const toBase64 = (value: string): string => {
  return btoa(unescape(encodeURIComponent(value)));
};

export const applyAuthHeader = (
  headers: Record<string, string>,
  auth: {
    type: AuthType;
    token?: string;
    encodeBasicAuth?: boolean;
  }
): Record<string, string> => {
  const nextHeaders = { ...headers };

  if (auth.type === "bearer" && auth.token) {
    nextHeaders.Authorization = `Bearer ${auth.token}`;
  }

  if (auth.type === "basic" && auth.token) {
    const basicValue =
      auth.encodeBasicAuth === false ? auth.token : toBase64(auth.token);
    nextHeaders.Authorization = `Basic ${basicValue}`;
  }

  return nextHeaders;
};

export const getStatusColor = (
  status: number | "ERROR" | undefined
): string => {
  if (status === "ERROR" || status === undefined) return "text-red-400";
  if (status >= 200 && status < 300) return "text-emerald-400";
  if (status >= 300 && status < 400) return "text-blue-400";
  if (status >= 400 && status < 500) return "text-amber-400";
  return "text-red-400";
};

export const substituteVars = (text: string, envVars: EnvVars): string => {
  let result = text;

  for (const [key, value] of Object.entries(envVars)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value));
  }

  return result;
};

export const parseEnvVars = (envInput: string): EnvVars => {
  const parsed = JSON.parse(envInput) as EnvVars;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("As variáveis de ambiente devem ser um objeto JSON.");
  }

  return parsed;
};

export const saveEnvVarsToStorage = (envVars: EnvVars): void => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("apiTesterEnv", JSON.stringify(envVars));
  }
};

export const loadEnvVarsFromStorage = (): EnvVars | null => {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem("apiTesterEnv");
  if (!saved) return null;

  try {
    return JSON.parse(saved) as EnvVars;
  } catch {
    return null;
  }
};

export const parseHeadersJson = (
  headerText: string,
  envVars: EnvVars
): Record<string, string> => {
  const substituted = substituteVars(headerText, envVars);
  const obj = JSON.parse(substituted) as Record<string, unknown>;

  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new Error("Os headers devem ser um objeto JSON válido.");
  }

  const headersMap: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    headersMap[key] = String(value);
  }

  return headersMap;
};

export const safeErrorMessage = (
  err: unknown
): { message: string; stack?: string } => {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }

  return { message: String(err) };
};

export const copyResponse = async (
  response?: ApiResponse | null
): Promise<void> => {
  if (!response) {
    throw new Error("Nenhuma resposta disponível para copiar.");
  }

  const text =
    response.kind === "success"
      ? JSON.stringify(response.data, null, 2)
      : JSON.stringify(
          {
            error: response.error,
            details: response.errorDetails,
          },
          null,
          2
        );

  await navigator.clipboard.writeText(text);
};

export const exportResults = ({
  response,
  envVars,
  name,
  url,
  method,
  headers,
  body,
  validationResults,
}: {
  response: ApiResponse | null;
  envVars: EnvVars;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  validationResults: ValidationResultItem[] | null;
}): void => {
  if (!response) {
    throw new Error("Nenhuma resposta para exportar.");
  }

  const data = {
    timestamp: response.timestamp,
    request: {
      name,
      method,
      url: response.kind === "success" ? response.url : substituteVars(url, envVars),
      headers: parseHeadersJson(headers, envVars),
      body: method !== "GET" && method !== "HEAD" ? body : null,
    },
    response,
    validations: validationResults,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = `test-${Date.now()}.json`;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
};