"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  Zap,
  TestTube,
  History,
  Shield,
} from "lucide-react";

/* =========================
   TYPES
========================= */

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
type AuthType = "none" | "bearer" | "basic";
type ActiveTab = "test" | "batch" | "validate";

type EnvVars = Record<string, string | number | boolean | null>;

type HeadersMap = Record<string, string>;

type ApiResponseSuccess = {
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

type ApiResponseError = {
  kind: "error";
  id: number;
  timestamp: string;
  error: string;
  errorDetails?: string;
};

type ApiResponse = ApiResponseSuccess | ApiResponseError;

type ValidationRules = {
  statusCode?: number | number[];
  maxTime?: number; // ms
  requiredFields?: string[];
  maxSize?: number; // bytes
};

type ValidationResultItem =
  | {
      type: "Status Code" | "Max Response Time" | "Response Size" | "Required Field";
      rule: unknown;
      value: string | number;
      passed: boolean;
    }
  | {
      type: "Validation Error";
      rule: "Invalid JSON";
      value: string;
      passed: false;
    };

type BatchAuth = {
  type?: "bearer";
  token?: string;
};

type BatchRequestItem = {
  name?: string;
  method?: HttpMethod;
  url?: string;
  headers?: string; // JSON string
  body?: string; // string JSON
  auth?: BatchAuth;
};

type BatchResultItem = {
  name: string;
  status: number | "ERROR";
  timeMs: number;
  passed: boolean;
  error?: string;
};

export default function AdvancedApiTester() {
  // ==== FORM STATE ====
  const [name, setName] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<string>('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState<string>("{}");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [authToken, setAuthToken] = useState<string>("");
  const [showAuthToken, setShowAuthToken] = useState<boolean>(false);

  // ==== RESPONSE STATE ====
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestHistory, setRequestHistory] = useState<ApiResponseSuccess[]>([]);

  // ==== VALIDATION STATE ====
  const [validationRules, setValidationRules] = useState<string>("");
  const [validationResults, setValidationResults] = useState<ValidationResultItem[] | null>(null);

  // ==== ENVIRONMENT VARIABLES ====
  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [envInput, setEnvInput] = useState<string>('{\n  "BASE_URL": "https://api.example.com"\n}');

  // ==== BATCH TESTING ====
  const [batchRequests, setBatchRequests] = useState<string>("");
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);

  // ==== UI STATE ====
  const [activeTab, setActiveTab] = useState<ActiveTab>("test");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  const responseRef = useRef<HTMLDivElement | null>(null);

  // ==== EFFECTS ====
  useEffect(() => {
    const savedEnv = typeof window !== "undefined" ? window.localStorage.getItem("apiTesterEnv") : null;
    if (savedEnv) {
      try {
        setEnvVars(JSON.parse(savedEnv) as EnvVars);
      } catch {
        // ignore
      }
    }
  }, []);

  // ==== HELPERS ====
  const parseEnvVars = (): EnvVars => {
    try {
      const parsed = JSON.parse(envInput) as EnvVars;
      setEnvVars(parsed);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("apiTesterEnv", JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      alert("JSON inválido nas variáveis de ambiente");
      return envVars;
    }
  };

  const substituteVars = (text: string): string => {
    let result = text;
    Object.entries(envVars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value));
    });
    return result;
  };

  const parseHeadersJson = (headerText: string): Record<string, string> => {
    try {
      const obj = JSON.parse(substituteVars(headerText)) as Record<string, unknown>;
      // normaliza tudo para string (fetch gosta)
      const headersMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj)) headersMap[k] = String(v);
      return headersMap;
    } catch {
      return {};
    }
  };

  const safeErrorMessage = (err: unknown): { message: string; stack?: string } => {
    if (err instanceof Error) return { message: err.message, stack: err.stack };
    return { message: String(err) };
  };

  // ==== VALIDATION ENGINE ====
  const runValidations = (resp: ApiResponseSuccess) => {
    try {
      const rules = JSON.parse(validationRules) as ValidationRules;
      const results: ValidationResultItem[] = [];

      if (rules.statusCode !== undefined) {
        const expected = rules.statusCode;
        const passed = Array.isArray(expected) ? expected.includes(resp.status) : resp.status === expected;

        results.push({
          type: "Status Code",
          rule: expected,
          value: resp.status,
          passed,
        });
      }

      if (rules.maxTime !== undefined) {
        const passed = resp.timeMs <= rules.maxTime;
        results.push({
          type: "Max Response Time",
          rule: `${rules.maxTime}ms`,
          value: `${resp.timeMs.toFixed(2)}ms`,
          passed,
        });
      }

      if (rules.requiredFields && resp.isJson) {
        for (const field of rules.requiredFields) {
          const hasField =
            field
              .split(".")
              .reduce<unknown>((obj, key) => (obj && typeof obj === "object" ? (obj as any)[key] : undefined), resp.data) !==
            undefined;

          results.push({
            type: "Required Field",
            rule: field,
            value: hasField ? "✓ Existe" : "✗ Não existe",
            passed: hasField,
          });
        }
      }

      if (rules.maxSize !== undefined) {
        const passed = resp.sizeBytes <= rules.maxSize;
        results.push({
          type: "Response Size",
          rule: `${rules.maxSize} bytes`,
          value: `${resp.sizeBytes} bytes`,
          passed,
        });
      }

      setValidationResults(results);
    } catch (err) {
      const { message } = safeErrorMessage(err);
      setValidationResults([
        {
          type: "Validation Error",
          rule: "Invalid JSON",
          value: message,
          passed: false,
        },
      ]);
    }
  };

  // ==== MAIN TEST HANDLER ====
  const handleTest = async () => {
    if (!url.trim()) {
      alert("URL é obrigatória");
      return;
    }

    setLoading(true);
    setResponse(null);
    setValidationResults(null);

    try {
      const finalUrl = substituteVars(url);
      const parsedHeaders = parseHeadersJson(headers);

      // Add authentication
      if (authType === "bearer" && authToken) {
        parsedHeaders["Authorization"] = `Bearer ${authToken}`;
      } else if (authType === "basic" && authToken) {
        // authToken esperado "user:pass"
        parsedHeaders["Authorization"] = `Basic ${btoa(authToken)}`;
      }

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body.trim()) {
        options.body = substituteVars(body);
      }

      const startTime = performance.now();
      const res = await fetch(finalUrl, options);
      const endTime = performance.now();

      const responseText = await res.text();
      let responseData: unknown = responseText;
      let isJson = false;

      try {
        responseData = JSON.parse(responseText) as unknown;
        isJson = true;
      } catch {
        // keep text
      }

      const responseObj: ApiResponseSuccess = {
        kind: "success",
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        name,
        method,
        url: finalUrl,
        status: res.status,
        statusText: res.statusText,
        timeMs: endTime - startTime,
        sizeBytes: new Blob([responseText]).size,
        data: responseData,
        isJson,
        headers: Object.fromEntries(Array.from(res.headers.entries())),
      };

      setResponse(responseObj);
      setRequestHistory((prev) => [responseObj, ...prev].slice(0, 50));

      if (validationRules.trim()) {
        runValidations(responseObj);
      }
    } catch (err) {
      const { message, stack } = safeErrorMessage(err);
      const errorResp: ApiResponseError = {
        kind: "error",
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        error: message,
        errorDetails: stack,
      };
      setResponse(errorResp);
    } finally {
      setLoading(false);
    }
  };

  // ==== BATCH TESTING ====
  const handleBatchTest = async () => {
    try {
      const requests = JSON.parse(batchRequests) as unknown;
      if (!Array.isArray(requests)) {
        alert("Batch deve ser um array de requisições");
        return;
      }

      setBatchLoading(true);
      setBatchResults([]);

      for (const rawReq of requests) {
        const req = rawReq as BatchRequestItem;

        const finalUrl = substituteVars(req.url || "");
        const parsedHeaders = parseHeadersJson(req.headers || "{}");

        if (req.auth?.type === "bearer" && req.auth?.token) {
          parsedHeaders["Authorization"] = `Bearer ${req.auth.token}`;
        }

        const options: RequestInit = {
          method: req.method || "GET",
          headers: parsedHeaders,
        };

        if (req.body) {
          options.body = substituteVars(req.body);
        }

        try {
          const startTime = performance.now();
          const res = await fetch(finalUrl, options);
          const endTime = performance.now();

          // consome resposta (mesmo que não uses, evita stream pendente em alguns ambientes)
          await res.text().catch(() => null);

          setBatchResults((prev) => [
            ...prev,
            {
              name: req.name || finalUrl,
              status: res.status,
              timeMs: endTime - startTime,
              passed: res.ok,
            },
          ]);
        } catch (err) {
          const { message } = safeErrorMessage(err);
          setBatchResults((prev) => [
            ...prev,
            {
              name: req.name || finalUrl,
              status: "ERROR",
              timeMs: 0,
              passed: false,
              error: message,
            },
          ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      const { message } = safeErrorMessage(err);
      alert("Erro ao parsear batch: " + message);
    } finally {
      setBatchLoading(false);
    }
  };

  // ==== EXPORT FUNCTIONS ====
  const exportResults = () => {
    if (!response) {
      alert("Nenhuma resposta para exportar");
      return;
    }

    const data = {
      timestamp: response.timestamp,
      request: {
        name,
        method,
        url: response.kind === "success" ? response.url : substituteVars(url),
        headers: parseHeadersJson(headers),
        body: method !== "GET" ? body : null,
      },
      response,
      validations: validationResults,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `test-${Date.now()}.json`;
    a.click();
  };

  const copyResponse = () => {
    if (!response) return;
    const text =
      response.kind === "success"
        ? JSON.stringify(response.data, null, 2)
        : JSON.stringify({ error: response.error, details: response.errorDetails }, null, 2);

    navigator.clipboard.writeText(text);
  };

  // ==== RENDER HELPERS ====
  const getStatusColor = (status: number | "ERROR" | undefined): string => {
    if (status === "ERROR" || status === undefined) return "text-red-400";
    if (status >= 200 && status < 300) return "text-emerald-400";
    if (status >= 300 && status < 400) return "text-blue-400";
    if (status >= 400 && status < 500) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* HEADER */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">API Test Suite Pro</h1>
              <p className="text-xs text-slate-400">Testador avançado para APIs críticas</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-slate-800 rounded-lg transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* SIDEBAR */}
        <div className="w-80 border-r border-slate-700 bg-slate-900/30 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* ENVIRONMENT SETTINGS */}
            {showSettings && (
              <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Variáveis
                </h3>
                <textarea
                  value={envInput}
                  onChange={(e) => setEnvInput(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:border-cyan-500 outline-none"
                  placeholder='{"BASE_URL": "..."}'
                />
                <button
                  onClick={parseEnvVars}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded text-xs font-semibold transition"
                >
                  Carregar Variáveis
                </button>
              </div>
            )}

            {/* HISTORY */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {requestHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhuma requisição ainda</p>
                ) : (
                  requestHistory.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setExpandedHistory(expandedHistory === idx ? null : idx)}
                      className="w-full text-left p-3 bg-slate-800/40 hover:bg-slate-800/60 rounded border border-slate-700 transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs font-bold text-slate-300 truncate">{item.method}</div>
                          <div className="text-xs text-slate-400 truncate mt-1">{item.url}</div>
                        </div>
                        <div className={`text-xs font-bold whitespace-nowrap ${getStatusColor(item.status)}`}>
                          {item.status}
                        </div>
                      </div>

                      {expandedHistory === idx && (
                        <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 text-xs text-slate-400">
                          <p>Tempo: {item.timeMs.toFixed(2)}ms</p>
                          <p>Tamanho: {item.sizeBytes} bytes</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUrl(item.url);
                              setMethod(item.method);
                              setName(item.name);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold mt-2"
                          >
                            Recarregar
                          </button>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TABS */}
          <div className="flex border-b border-slate-700 bg-slate-900/30">
            {[
              { id: "test" as const, label: "Teste Único", icon: TestTube },
              { id: "batch" as const, label: "Testes em Lote", icon: BarChart3 },
              { id: "validate" as const, label: "Validações", icon: CheckCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-cyan-500 text-cyan-400 bg-slate-800/40"
                      : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* TAB: TESTE ÚNICO */}
              {activeTab === "test" && (
                <div className="space-y-4">
                  {/* REQUEST CONFIG */}
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Nome do teste"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-cyan-500 transition"
                      />
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono font-bold outline-none focus:border-cyan-500 transition"
                      >
                        {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="https://api.example.com/users"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="col-span-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    {/* AUTHENTICATION */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded border border-slate-700">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-2 block">Autenticação</label>
                        <select
                          value={authType}
                          onChange={(e) => setAuthType(e.target.value as AuthType)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs outline-none focus:border-cyan-500 transition"
                        >
                          <option value="none">Nenhuma</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="basic">Basic Auth</option>
                        </select>
                      </div>

                      {authType !== "none" && (
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-2 block">Token</label>
                          <div className="relative">
                            <input
                              type={showAuthToken ? "text" : "password"}
                              value={authToken}
                              onChange={(e) => setAuthToken(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs outline-none focus:border-cyan-500 transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAuthToken(!showAuthToken)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                            >
                              {showAuthToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* HEADERS & BODY */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-2 block">Headers (JSON)</label>
                        <textarea
                          value={headers}
                          onChange={(e) => setHeaders(e.target.value)}
                          className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-2 block">Body (JSON)</label>
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          disabled={method === "GET" || method === "HEAD"}
                          className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleTest}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-6 py-2.5 rounded-lg font-bold transition disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {loading ? "Testando..." : "Testar Endpoint"}
                      </button>

                      {response && (
                        <>
                          <button
                            onClick={copyResponse}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={exportResults}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RESPONSE */}
                  {response && (
                    <div ref={responseRef} className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                        <h3 className="font-bold flex items-center gap-2">
                          {response.kind === "error" ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : response.status >= 200 && response.status < 300 ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                          )}
                          Resposta
                        </h3>

                        {response.kind === "success" && (
                          <div className="flex gap-4 text-xs font-mono text-slate-300 space-x-4">
                            <span className={getStatusColor(response.status)}>
                              {response.status} {response.statusText}
                            </span>
                            <span className="text-blue-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {response.timeMs.toFixed(2)}ms
                            </span>
                            <span className="text-purple-400">{response.sizeBytes} bytes</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-950 border border-slate-700 rounded p-4 max-h-72 overflow-auto">
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words">
                          {response.kind === "error"
                            ? response.error
                            : JSON.stringify(response.data, null, 2)}
                        </pre>
                      </div>

                      {/* VALIDATION RESULTS */}
                      {validationResults && (
                        <div className="pt-4 border-t border-slate-700 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Resultados das Validações
                          </h4>

                          <div className="space-y-2">
                            {validationResults.map((result, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded border ${
                                  result.passed ? "bg-emerald-900/20 border-emerald-700" : "bg-red-900/20 border-red-700"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold">{result.type}</span>
                                  <span className={`text-xs font-bold ${result.passed ? "text-emerald-400" : "text-red-400"}`}>
                                    {result.passed ? "✓ PASSOU" : "✗ FALHOU"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  Esperado: {JSON.stringify(result.rule)} | Obtido: {String(result.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: BATCH */}
              {activeTab === "batch" && (
                <div className="space-y-4">
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-2 block">Array de Requisições (JSON)</label>
                      <textarea
                        value={batchRequests}
                        onChange={(e) => setBatchRequests(e.target.value)}
                        placeholder={`[
  {
    "name": "Get Users",
    "method": "GET",
    "url": "\${BASE_URL}/users"
  }
]`}
                        className="w-full h-40 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none"
                      />
                    </div>

                    <button
                      onClick={handleBatchTest}
                      disabled={batchLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-6 py-2.5 rounded-lg font-bold transition disabled:opacity-50"
                    >
                      {batchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                      {batchLoading ? "Executando..." : "Executar Testes em Lote"}
                    </button>
                  </div>

                  {batchResults.length > 0 && (
                    <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-400" /> Resultados
                      </h3>

                      <div className="space-y-2">
                        {batchResults.map((result, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{result.name}</p>
                              <p className="text-xs text-slate-400">{result.timeMs.toFixed(2)}ms</p>
                              {result.error && <p className="text-xs text-red-400 mt-1">{result.error}</p>}
                            </div>

                            <div className="flex items-center gap-3">
                              {result.status !== "ERROR" && (
                                <span className={getStatusColor(result.status)}>{result.status}</span>
                              )}
                              {result.passed ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VALIDATIONS */}
              {activeTab === "validate" && (
                <div className="space-y-4">
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-2 block">Regras de Validação (JSON)</label>
                      <textarea
                        value={validationRules}
                        onChange={(e) => setValidationRules(e.target.value)}
                        placeholder={`{
  "statusCode": [200, 201],
  "maxTime": 1000,
  "maxSize": 100000,
  "requiredFields": ["id", "name", "email"]
}`}
                        className="w-full h-40 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none"
                      />
                    </div>

                    <p className="text-xs text-slate-400 italic">
                      Configure as regras acima e execute um teste para validar a resposta.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}