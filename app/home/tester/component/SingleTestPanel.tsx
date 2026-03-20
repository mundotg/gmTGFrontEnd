"use client";

import React from "react";
import {
  Play,
  RefreshCw,
  Copy,
  Download,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  ApiResponse,
  AuthType,
  HttpMethod,
  ValidationResultItem,
} from "../types";
import { getStatusColor } from "../util";

type SingleTestPanelProps = {
  name: string;
  url: string;
  method: HttpMethod;
  headers: string;
  body: string;
  authType: AuthType;
  authToken: string;
  showAuthToken: boolean;
  encodeBasicAuth: boolean;
  loading: boolean;
  response: ApiResponse | null;
  validationResults: ValidationResultItem[] | null;
  responseRef?: React.RefObject<HTMLDivElement | null>;

  onNameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onMethodChange: (value: HttpMethod) => void;
  onHeadersChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onAuthTypeChange: (value: AuthType) => void;
  onAuthTokenChange: (value: string) => void;
  onToggleShowAuthToken: () => void;
  onEncodeBasicAuthChange: (checked: boolean) => void;

  onTest: () => void;
  onCopyResponse?: () => void;
  onExportResults?: () => void;
};

const METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

export default function SingleTestPanel({
  name,
  url,
  method,
  headers,
  body,
  authType,
  authToken,
  showAuthToken,
  encodeBasicAuth,
  loading,
  response,
  validationResults,
  responseRef,
  onNameChange,
  onUrlChange,
  onMethodChange,
  onHeadersChange,
  onBodyChange,
  onAuthTypeChange,
  onAuthTokenChange,
  onToggleShowAuthToken,
  onEncodeBasicAuthChange,
  onTest,
  onCopyResponse,
  onExportResults,
}: SingleTestPanelProps) {
  const bodyDisabled = method === "GET" || method === "HEAD";

  return (
    <div className="space-y-4">
      {/* REQUEST CONFIG */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <input
            type="text"
            placeholder="Nome do teste"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="md:col-span-3 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-cyan-500 transition"
          />

          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
            className="md:col-span-2 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono font-bold outline-none focus:border-cyan-500 transition"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="https://api.example.com/users"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="md:col-span-7 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* AUTHENTICATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded border border-slate-700">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Autenticação
            </label>

            <select
              value={authType}
              onChange={(e) => onAuthTypeChange(e.target.value as AuthType)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs outline-none focus:border-cyan-500 transition"
            >
              <option value="none">Nenhuma</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
            </select>
          </div>

          {authType !== "none" && (
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                {authType === "basic" ? "Credencial" : "Token"}
              </label>

              <div className="relative">
                <input
                  type={showAuthToken ? "text" : "password"}
                  value={authToken}
                  placeholder={
                    authType === "basic" ? "usuario:senha" : "Informe o token"
                  }
                  onChange={(e) => onAuthTokenChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 pr-10 text-xs outline-none focus:border-cyan-500 transition"
                />

                <button
                  type="button"
                  onClick={onToggleShowAuthToken}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showAuthToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {authType === "basic" && (
            <div className="md:col-span-2 mt-1 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={encodeBasicAuth}
                  onChange={(e) => onEncodeBasicAuthChange(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950"
                />
                Codificar em Base64 antes de enviar
              </label>

              <p className="text-[11px] text-slate-400">
                Informe no formato <span className="font-mono">usuario:senha</span>.
              </p>
            </div>
          )}
        </div>

        {/* HEADERS & BODY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Headers (JSON)
            </label>
            <textarea
              value={headers}
              onChange={(e) => onHeadersChange(e.target.value)}
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Body (JSON)
            </label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              disabled={bodyDisabled}
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onTest}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-6 py-2.5 rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {loading ? "Testando..." : "Testar Endpoint"}
          </button>

          {response && onCopyResponse && (
            <button
              onClick={onCopyResponse}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm transition"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {response && onExportResults && (
            <button
              onClick={onExportResults}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm transition"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* RESPONSE */}
      {response && (
        <div
          ref={responseRef}
          className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4"
        >
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
                      result.passed
                        ? "bg-emerald-900/20 border-emerald-700"
                        : "bg-red-900/20 border-red-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{result.type}</span>
                      <span
                        className={`text-xs font-bold ${
                          result.passed ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {result.passed ? "✓ PASSOU" : "✗ FALHOU"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      Esperado: {JSON.stringify(result.rule)} | Obtido:{" "}
                      {String(result.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}