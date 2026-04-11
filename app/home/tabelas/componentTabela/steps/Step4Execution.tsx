"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Server,
  Table as TableIcon,
  Columns,
  Play,
  Download,
  Copy,
  ArrowRight,
  Zap,
  FileJson,
  Activity,
} from "lucide-react";

import type { DBConnection } from "@/types/db-structure";
import type { TableMapping } from "@/app/task/types/transfer-types";
import { ConnectionCard, StatCard } from "./utils/index";

interface Step4ExecutionProps {
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  tableMappings: Record<string, TableMapping>;
  isRunning: boolean;
  messages: string[];
  error: string | null;
  onExecute: () => void;
}

function safeArr<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

function looksLikeCompleted(msg: string) {
  const s = (msg ?? "").toLowerCase();
  // ajusta conforme teu backend manda
  return (
    s.includes("conclu") ||
    s.includes("finaliz") ||
    s.includes("sucesso") ||
    s.includes("completed") ||
    s.includes("done")
  );
}

function looksLikeError(msg: string) {
  const s = (msg ?? "").toLowerCase();
  return s.includes("erro") || s.includes("error") || s.includes("fail") || s.includes("exception");
}

/**
 * Scroll automático “inteligente”:
 * - Se o usuário está no fundo (ou perto), auto-scroll.
 * - Se o usuário subiu para ler logs antigos, NÃO força scroll.
 */
function isNearBottom(el: HTMLElement, thresholdPx = 120) {
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distance <= thresholdPx;
}

export const Step4Execution: React.FC<Step4ExecutionProps> = ({
  sourceConnection,
  targetConnection,
  tableMappings,
  isRunning,
  messages,
  error,
  onExecute,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);

  /**
   * Guardar timestamps por índice (ou por hash) para não renderizar
   * um horário “novo” a cada render. Assim cada linha mantém seu horário.
   */
  const msgTimesRef = useRef<number[]>([]);
  useEffect(() => {
    // garante que cada mensagem ganhe um timestamp uma única vez
    if (messages.length > msgTimesRef.current.length) {
      const now = Date.now();
      const missing = messages.length - msgTimesRef.current.length;
      for (let i = 0; i < missing; i++) msgTimesRef.current.push(now);
    }
  }, [messages.length]);

  // 🧠 Estatísticas memoizadas (não explode com undefined)
  const stats = useMemo(() => {
    const values = Object.values(tableMappings ?? {});
    let totalCols = 0;
    let enabledCols = 0;
    let renamedCols = 0;
    let renamedTables = 0;

    for (const map of values) {
      const cols = safeArr(map?.colunas_relacionados_para_transacao);
      totalCols += cols.length;

      const enabled = cols.filter((c) => c?.enabled);
      enabledCols += enabled.length;

      renamedCols += enabled.filter((c) => c?.coluna_origen_name !== c?.coluna_distino_name).length;

      if (map?.tabela_name_origem && map?.tabela_name_destino && map.tabela_name_origem !== map.tabela_name_destino) {
        renamedTables++;
      }
    }

    return {
      totalTables: values.length,
      totalColumns: totalCols,
      enabledColumns: enabledCols,
      renamedColumns: renamedCols,
      renamedTables,
    };
  }, [tableMappings]);

  // ⚙️ Config memoizada
  const config = useMemo(() => {
    return {
      bd_origen: sourceConnection?.id ?? null,
      bd_distino: targetConnection?.id ?? null,
      tabelas: tableMappings ?? {},
    };
  }, [sourceConnection?.id, targetConnection?.id, tableMappings]);

  // 📋 Copiar config (com fallback)
  const copyConfigToClipboard = useCallback(async () => {
    const text = JSON.stringify(config, null, 2);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback (antigo)
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar configuração:", err);
    }
  }, [config]);

  // 💾 Baixar config
  const downloadConfig = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `transfer-config-${new Date().toISOString().split("T")[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Falha ao exportar configuração:", err);
    }
  }, [config]);

  // ✅ Estado concluído mais robusto
  const hasCompleted = useMemo(() => {
    if (isRunning) return false;
    if (error) return false;
    return messages.some((m) => looksLikeCompleted(m));
  }, [messages, isRunning, error]);

  const hasAnyErrorInLogs = useMemo(() => {
    return messages.some((m) => looksLikeError(m));
  }, [messages]);

  // 🔄 Scroll inteligente
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    // Só autoscroll se usuário estiver perto do fundo
    if (isNearBottom(el, 160)) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  // ✅ Guards
  if (!sourceConnection || !targetConnection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-red-50 rounded-full p-4 mb-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Configuração incompleta</h3>
        <p className="text-gray-600 max-w-md text-sm">
          É necessário configurar ambas as conexões (origem e destino) antes de executar a transferência.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Execução da Transferência</h2>
              <p className="text-blue-100 text-sm">Revise e execute a migração de dados entre bancos de dados</p>
            </div>
          </div>

          {isRunning && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Processando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TableIcon className="w-6 h-6" />} label="Tabelas" value={stats.totalTables} color="blue" />
        <StatCard
          icon={<Columns className="w-6 h-6" />}
          label="Campos Ativos"
          value={`${stats.enabledColumns}/${stats.totalColumns}`}
          color="green"
        />
        <StatCard
          icon={<ArrowRight className="w-6 h-6" />}
          label="Tabelas Renomeadas"
          value={stats.renamedTables}
          color="purple"
        />
        <StatCard
          icon={<ArrowRight className="w-6 h-6" />}
          label="Campos Renomeados"
          value={stats.renamedColumns}
          color="orange"
        />
      </div>

      {/* Connections & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conexões */}
        <div className="lg:col-span-2 space-y-4">
          <ConnectionCard
            title="Banco de Dados de Origem"
            connection={sourceConnection}
            color="blue"
            icon={<Database className="w-5 h-5" />}
          />
          <ConnectionCard
            title="Banco de Dados de Destino"
            connection={targetConnection}
            color="green"
            icon={<Server className="w-5 h-5" />}
          />
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-2.5">
                <Play className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Controles</h3>
            </div>

            <div className="space-y-3">
              <button
                onClick={onExecute}
                disabled={isRunning || stats.totalTables === 0 || stats.enabledColumns === 0}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-green-200 disabled:shadow-none"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Executando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Iniciar Transferência</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowConfig((s) => !s)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <FileJson className="w-4 h-4" />
                  Config
                </button>
                <button
                  onClick={downloadConfig}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          {(isRunning || hasCompleted || error || hasAnyErrorInLogs) && (
            <div
              className={`rounded-2xl p-4 ${
                error || hasAnyErrorInLogs
                  ? "bg-red-50 border border-red-200"
                  : hasCompleted
                  ? "bg-green-50 border border-green-200"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {error || hasAnyErrorInLogs ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : hasCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
                )}

                <div>
                  <div
                    className={`font-semibold ${
                      error || hasAnyErrorInLogs ? "text-red-900" : hasCompleted ? "text-green-900" : "text-blue-900"
                    }`}
                  >
                    {error || hasAnyErrorInLogs ? "Erro" : hasCompleted ? "Concluído" : "Em Progresso"}
                  </div>
                  <div
                    className={`text-xs ${
                      error || hasAnyErrorInLogs ? "text-red-700" : hasCompleted ? "text-green-700" : "text-blue-700"
                    }`}
                  >
                    {error || hasAnyErrorInLogs
                      ? "Falha na transferência"
                      : hasCompleted
                      ? `${stats.totalTables} tabelas processadas`
                      : "Processando dados..."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuração JSON */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-xl p-2">
                <FileJson className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Configuração JSON</h3>
            </div>

            <button
              onClick={copyConfigToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>

          <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto max-h-80 border border-gray-700 font-mono">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}

      {/* Detalhes das Tabelas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-indigo-100 rounded-xl p-2">
            <TableIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-bold text-gray-900">Detalhes das Tabelas</h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {Object.entries(tableMappings ?? {}).map(([tableId, mapping]) => {
            const enabledCols = safeArr(mapping?.colunas_relacionados_para_transacao).filter((c) => c?.enabled);
            const isRenamed = mapping?.tabela_name_origem !== mapping?.tabela_name_destino;

            return (
              <div
                key={tableId}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TableIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className={`font-mono font-bold text-sm ${isRenamed ? "text-purple-600" : "text-gray-900"}`}>
                      {mapping?.tabela_name_origem}
                    </span>

                    {isRenamed && (
                      <>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-bold text-sm text-green-600">{mapping?.tabela_name_destino}</span>
                      </>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                    {enabledCols.length} campo{enabledCols.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {enabledCols.slice(0, 6).map((col) => (
                    <div
                      key={String(col.id_coluna_origem)}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100"
                    >
                      <Columns className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-gray-700 truncate">{col.coluna_origen_name}</span>
                      {col.coluna_origen_name !== col.coluna_distino_name && (
                        <>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="font-mono text-green-600 truncate">{col.coluna_distino_name}</span>
                        </>
                      )}
                    </div>
                  ))}

                  {enabledCols.length > 6 && (
                    <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 font-medium">
                      +{enabledCols.length - 6} campos adicionais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gray-800 rounded-xl p-2">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="font-bold text-gray-900">Logs de Transferência</h3>
        </div>

        <div
          ref={messagesRef}
          className="max-h-96 overflow-y-auto font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-xl border border-gray-700"
        >
          {messages.length ? (
            messages.map((msg, i) => (
              <div
                key={`${i}-${msg}`}
                className="border-b border-gray-800 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0"
              >
                <span className="text-gray-500 text-xs mr-3">
                  {new Date(msgTimesRef.current[i] ?? Date.now()).toLocaleTimeString()}
                </span>
                <span className="text-green-300">{msg}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic text-center py-12">
              {isRunning ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Aguardando início da transferência...</span>
                </div>
              ) : (
                "Nenhuma mensagem ainda. Clique em 'Iniciar Transferência' para começar."
              )}
            </div>
          )}
        </div>

        {/* Alertas de Resultado */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 mb-1">Erro na Transferência</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {hasCompleted && !error && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-green-900 mb-1">Transferência Concluída com Sucesso!</h4>
              <p className="text-sm text-green-700">
                A transferência foi executada com sucesso. {stats.totalTables} tabelas e {stats.enabledColumns} campos foram processados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};