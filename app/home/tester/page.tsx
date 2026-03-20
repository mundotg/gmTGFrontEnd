"use client";

import React, { useEffect, useRef, useState } from "react";
import { Settings, Zap } from "lucide-react";

import {
  ActiveTab,
  ApiResponse,
  ApiResponseError,
  ApiResponseSuccess,
  AuthType,
  BatchRequestItem,
  BatchResultItem,
  EnvVars,
  HttpMethod,
  ValidationResultItem,
  ValidationRules,
} from "./types";

import {
  applyAuthHeader,
  batchRequestsPlaceholder,
  copyResponse,
  exportResults,
  getNestedValue,
  parseHeadersJson,
  safeErrorMessage,
  substituteVars,
  TESTER_TABS,
} from "./util";

import ApiTesterSidebar from "./component/ApiTesterSidebar";
import ValidationRulesPanel from "./component/ValidationRulesPanel";
import BatchTestPanel from "./component/BatchTestPanel";
import SingleTestPanel from "./component/SingleTestPanel";

const STORAGE_KEYS = {
  env: "apiTesterEnv",
  history: "apiTesterHistory",
} as const;

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 15000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export default function AdvancedApiTester() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState("{}");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [authToken, setAuthToken] = useState("");
  const [showAuthToken, setShowAuthToken] = useState(false);

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestHistory, setRequestHistory] = useState<ApiResponseSuccess[]>([]);

  const [validationRules, setValidationRules] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResultItem[] | null>(null);

  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [envInput, setEnvInput] = useState('{\n  "BASE_URL": "https://api.example.com"\n}');

  const [batchRequests, setBatchRequests] = useState("");
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [encodeBasicAuth, setEncodeBasicAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>("test");
  const [showSettings, setShowSettings] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  const responseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedEnv = window.localStorage.getItem(STORAGE_KEYS.env);
    const savedHistory = window.localStorage.getItem(STORAGE_KEYS.history);

    if (savedEnv) {
      try {
        const parsedEnv = JSON.parse(savedEnv) as EnvVars;
        setEnvVars(parsedEnv);
        setEnvInput(JSON.stringify(parsedEnv, null, 2));
      } catch {
        //
      }
    }

    if (savedHistory) {
      try {
        setRequestHistory(JSON.parse(savedHistory) as ApiResponseSuccess[]);
      } catch {
        //
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.env, JSON.stringify(envVars));
    }
  }, [envVars]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(requestHistory));
    }
  }, [requestHistory]);

  const runValidations = (resp: ApiResponseSuccess, rawRules: string) => {
    try {
      const rules = JSON.parse(rawRules) as ValidationRules;
      const results: ValidationResultItem[] = [];

      if (rules.statusCode !== undefined) {
        const expected = rules.statusCode;
        const passed = Array.isArray(expected)
          ? expected.includes(resp.status)
          : resp.status === expected;

        results.push({
          type: "Status Code",
          rule: expected,
          value: resp.status,
          passed,
        });
      }

      if (rules.maxTime !== undefined) {
        results.push({
          type: "Max Response Time",
          rule: `${rules.maxTime}ms`,
          value: `${resp.timeMs.toFixed(2)}ms`,
          passed: resp.timeMs <= rules.maxTime,
        });
      }

      if (rules.requiredFields) {
        if (!resp.isJson) {
          results.push({
            type: "Required Fields",
            rule: rules.requiredFields,
            value: "Resposta não é JSON",
            passed: false,
          });
        } else {
          for (const field of rules.requiredFields) {
            const hasField = getNestedValue(resp.data, field) !== undefined;

            results.push({
              type: "Required Field",
              rule: field,
              value: hasField ? "✓ Existe" : "✗ Não existe",
              passed: hasField,
            });
          }
        }
      }

      if (rules.maxSize !== undefined) {
        results.push({
          type: "Response Size",
          rule: `${rules.maxSize} bytes`,
          value: `${resp.sizeBytes} bytes`,
          passed: resp.sizeBytes <= rules.maxSize,
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

  const handleTest = async () => {
    setUiError(null);

    if (!url.trim()) {
      setUiError("URL é obrigatória.");
      return;
    }

    if (authType === "basic" && authToken && !authToken.includes(":")) {
      setUiError('No Basic Auth, informe a credencial no formato "usuario:senha".');
      return;
    }

    setLoading(true);
    setResponse(null);
    setValidationResults(null);

    try {
      const finalUrl = substituteVars(url, envVars);
      const parsedHeaders = applyAuthHeader(
        parseHeadersJson(headers, envVars),
        {
          type: authType,
          token: authToken,
          encodeBasicAuth,
        }
      );

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body.trim()) {
        options.body = substituteVars(body, envVars);
      }

      const startTime = performance.now();
      const res = await fetchWithTimeout(finalUrl, options, 15000);
      const endTime = performance.now();

      const responseText = await res.text();
      let responseData: unknown = responseText;
      let isJson = false;

      try {
        responseData = JSON.parse(responseText);
        isJson = true;
      } catch {
        //
      }

      const responseObj: ApiResponseSuccess = {
        kind: "success",
        id: Date.now(),
        timestamp: new Date().toISOString(),
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
        runValidations(responseObj, validationRules);
      }

      requestAnimationFrame(() => {
        responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      const { message, stack } = safeErrorMessage(err);

      const errorResp: ApiResponseError = {
        kind: "error",
        id: Date.now(),
        timestamp: new Date().toISOString(),
        error: message,
        errorDetails: stack,
      };

      setResponse(errorResp);
      setUiError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchTest = async () => {
    setUiError(null);

    try {
      const requests = JSON.parse(batchRequests) as unknown;

      if (!Array.isArray(requests)) {
        setUiError("Batch deve ser um array de requisições.");
        return;
      }

      setBatchLoading(true);
      setBatchResults([]);

      for (const rawReq of requests) {
        const req = rawReq as BatchRequestItem;

        const finalUrl = substituteVars(req.url || "", envVars);
        const parsedHeaders = applyAuthHeader(
          parseHeadersJson(req.headers || "{}", envVars),
          {
            type: req.auth?.type ?? "none",
            token: req.auth?.token,
            encodeBasicAuth: req.auth?.encode,
          }
        );

        const requestMethod = req.method || "GET";

        const options: RequestInit = {
          method: requestMethod,
          headers: parsedHeaders,
        };

        if (req.body && requestMethod !== "GET" && requestMethod !== "HEAD") {
          options.body = substituteVars(req.body, envVars);
        }

        try {
          const startTime = performance.now();
          const res = await fetchWithTimeout(finalUrl, options, 15000);
          const endTime = performance.now();

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
      setUiError("Erro ao processar os testes em lote: " + message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleLoadEnvVars = () => {
    try {
      const parsed = JSON.parse(envInput) as EnvVars;
      setEnvVars(parsed);
      setUiError(null);
    } catch (err) {
      setUiError("JSON inválido nas variáveis de ambiente.");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
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

          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {uiError && (
        <div className="mx-6 mt-4 rounded-lg border border-red-700 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {uiError}
        </div>
      )}

      <div className="flex h-[calc(100vh-73px)]">
        <ApiTesterSidebar
          showSettings={showSettings}
          envInput={envInput}
          setEnvInput={setEnvInput}
          // envVars={envVars}
          // setEnvVars={setEnvVars}
          requestHistory={requestHistory}
          expandedHistory={expandedHistory}
          setExpandedHistory={setExpandedHistory}
          onLoadEnvVars={handleLoadEnvVars}
          onReloadHistoryItem={(item) => {
            setUrl(item.url);
            setMethod(item.method);
            setName(item.name);
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-700 bg-slate-900/30">
            {TESTER_TABS.map((tab) => {
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

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {activeTab === "test" && (
                <SingleTestPanel
                  name={name}
                  url={url}
                  method={method}
                  headers={headers}
                  body={body}
                  authType={authType}
                  authToken={authToken}
                  showAuthToken={showAuthToken}
                  encodeBasicAuth={encodeBasicAuth}
                  loading={loading}
                  response={response}
                  validationResults={validationResults}
                  responseRef={responseRef}
                  onNameChange={setName}
                  onUrlChange={setUrl}
                  onMethodChange={setMethod}
                  onHeadersChange={setHeaders}
                  onBodyChange={setBody}
                  onAuthTypeChange={setAuthType}
                  onAuthTokenChange={setAuthToken}
                  onToggleShowAuthToken={() => setShowAuthToken((prev) => !prev)}
                  onEncodeBasicAuthChange={setEncodeBasicAuth}
                  onTest={handleTest}
                  onCopyResponse={async () => {
                    try {
                      await copyResponse(response);
                    } catch (err) {
                      setUiError(safeErrorMessage(err).message);
                    }
                  }}
                  onExportResults={() => {
                    try {
                      exportResults({
                        response,
                        envVars,
                        name,
                        url,
                        method,
                        headers,
                        body,
                        validationResults,
                      });
                    } catch (err) {
                      setUiError(safeErrorMessage(err).message);
                    }
                  }}
                />
              )}

              {activeTab === "batch" && (
                <BatchTestPanel
                  value={batchRequests}
                  onChange={setBatchRequests}
                  onRun={handleBatchTest}
                  loading={batchLoading}
                  placeholder={batchRequestsPlaceholder}
                />
              )}

              {activeTab === "validate" && (
                <ValidationRulesPanel
                  value={validationRules}
                  onChange={setValidationRules}
                />
              )}

              {activeTab === "batch" && batchResults.length > 0 && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-6 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-200">Resultados do lote</h3>

                  <div className="space-y-2">
                    {batchResults.map((result, index) => (
                      <div
                        key={`${result.name}-${index}`}
                        className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate">{result.name}</p>
                          <p className="text-xs text-slate-400">
                            {result.timeMs.toFixed(2)}ms
                            {result.error ? ` • ${result.error}` : ""}
                          </p>
                        </div>

                        <div className="ml-4 flex items-center gap-3">
                          <span className={result.status === "ERROR" ? "text-red-400 text-sm font-semibold" : "text-slate-300 text-sm font-semibold"}>
                            {result.status}
                          </span>
                          <span className={result.passed ? "text-emerald-400 text-xs font-bold" : "text-red-400 text-xs font-bold"}>
                            {result.passed ? "PASSOU" : "FALHOU"}
                          </span>
                        </div>
                      </div>
                    ))}
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