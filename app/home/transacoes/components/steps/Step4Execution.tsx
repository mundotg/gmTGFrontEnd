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
  Square,
  Download,
  Copy,
  ArrowRight,
  Zap,
  FileJson,
  Activity,
  Trash2,
  Terminal,
  Check,
  RefreshCw,
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
  onStop?: () => void;
  onReset?: () => void;
}

function safeArr<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

function classifyLogMessage(msg: string): {
  type: "error" | "warning" | "success" | "status" | "info";
  cleanText: string;
} {
  const s = msg ?? "";
  const lower = s.toLowerCase();

  if (s.startsWith("❌") || lower.includes("erro") || lower.includes("error") || lower.includes("exception") || lower.includes("falha")) {
    return { type: "error", cleanText: s.replace(/^❌\s*/, "") };
  }
  if (s.startsWith("⚠️") || lower.includes("warning") || lower.includes("aviso") || lower.includes("atenção")) {
    return { type: "warning", cleanText: s.replace(/^⚠️\s*/, "") };
  }
  if (lower.includes("sucesso") || lower.includes("concluído") || lower.includes("concluido") || lower.includes("completed") || lower.includes("finalizada com sucesso")) {
    return { type: "success", cleanText: s.replace(/^✅\s*/, "") };
  }
  if (s.startsWith("STATUS:") || lower.includes("iniciando") || lower.includes("transferindo") || lower.includes("copiando")) {
    return { type: "status", cleanText: s.replace(/^STATUS:\s*/, "") };
  }
  return { type: "info", cleanText: s };
}

export const Step4Execution: React.FC<Step4ExecutionProps> = ({
  sourceConnection,
  targetConnection,
  tableMappings,
  isRunning,
  messages,
  error,
  onExecute,
  onStop,
  onReset,
}) => {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesRef = useRef<HTMLDivElement>(null);
  const msgTimesRef = useRef<number[]>([]);

  useEffect(() => {
    if (messages.length > msgTimesRef.current.length) {
      const now = Date.now();
      const diff = messages.length - msgTimesRef.current.length;
      for (let i = 0; i < diff; i++) msgTimesRef.current.push(now);
    }
  }, [messages.length]);

  // Estatísticas de migração
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

  // Payload da Configuração
  const config = useMemo(() => {
    return {
      bd_origen: sourceConnection?.id ?? null,
      bd_distino: targetConnection?.id ?? null,
      tabelas: tableMappings ?? {},
    };
  }, [sourceConnection?.id, targetConnection?.id, tableMappings]);

  // Copiar Config
  const copyConfigToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch {
      //
    }
  }, [config]);

  // Copiar todos os logs
  const copyLogsToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(messages.join("\n"));
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    } catch {
      //
    }
  }, [messages]);

  // Baixar Configuração em JSON
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

  // Status de conclusão
  const hasCompleted = useMemo(() => {
    if (isRunning || error) return false;
    return messages.some((m) => {
      const lower = (m || "").toLowerCase();
      return lower.includes("conclu") || lower.includes("sucesso") || lower.includes("completed") || lower.includes("done");
    });
  }, [messages, isRunning, error]);

  const hasAnyError = Boolean(error || messages.some((m) => {
    const l = (m || "").toLowerCase();
    return l.includes("erro") || l.includes("error") || l.includes("exception");
  }));

  // Auto-scroll nos logs
  useEffect(() => {
    if (!autoScroll) return;
    const el = messagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, autoScroll]);

  if (!sourceConnection || !targetConnection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Configuração Incompleta</h3>
        <p className="text-gray-500 max-w-md text-xs sm:text-sm">
          É necessário definir as conexões de origem e destino antes de prosseguir com a execução.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3.5 shadow-xs">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Execução da Transferência</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                Revise os parâmetros e acompanhe o fluxo de migração em tempo real via WebSocket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <div className="flex items-center gap-2 bg-emerald-500/30 border border-emerald-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                <span>Processando...</span>
              </div>
            ) : hasCompleted ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Concluído com Sucesso</span>
              </div>
            ) : hasAnyError ? (
              <div className="flex items-center gap-1.5 bg-red-500/30 border border-red-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-300" />
                <span>Falha na Migração</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-100">
                <Activity className="w-4 h-4" />
                <span>Pronto para Iniciar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas Chave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard icon={<TableIcon className="w-5 h-5" />} label="Tabelas Selecionadas" value={stats.totalTables} color="blue" />
        <StatCard
          icon={<Columns className="w-5 h-5" />}
          label="Campos Ativos"
          value={`${stats.enabledColumns}/${stats.totalColumns}`}
          color="green"
        />
        <StatCard
          icon={<ArrowRight className="w-5 h-5" />}
          label="Tabelas Renomeadas"
          value={stats.renamedTables}
          color="purple"
        />
        <StatCard
          icon={<ArrowRight className="w-5 h-5" />}
          label="Campos Renomeados"
          value={stats.renamedColumns}
          color="orange"
        />
      </div>

      {/* Painel de Conexões e Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Conexões (Origem e Destino) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConnectionCard
              title="Banco de Origem"
              connection={sourceConnection}
              color="blue"
              icon={<Database className="w-4 h-4" />}
            />
            <ConnectionCard
              title="Banco de Destino"
              connection={targetConnection}
              color="green"
              icon={<Server className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Card de Controles de Execução */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Controles de Execução</h3>
              <p className="text-[11px] text-gray-500">Inicie ou interrompa a transmissão</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-sm shadow-sm"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Interromper Transferência</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onExecute}
                disabled={stats.totalTables === 0 || stats.enabledColumns === 0}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-md shadow-emerald-200 disabled:shadow-none"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{messages.length ? "Reiniciar Transferência" : "Iniciar Transferência"}</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfig((s) => !s)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                <span>{showConfig ? "Ocultar JSON" : "Ver JSON"}</span>
              </button>

              <button
                type="button"
                onClick={downloadConfig}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuração JSON (colapsável) */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-600" />
              <span>Configuração Serializada da Transferência (Payload)</span>
            </h4>
            <button
              onClick={copyConfigToClipboard}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedConfig ? "Copiado!" : "Copiar"}</span>
            </button>
          </div>
          <pre className="text-xs bg-gray-950 text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-64 font-mono border border-gray-800">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}

      {/* Terminal de Logs ao Vivo */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Terminal de Migração em Tempo Real</h3>
              <p className="text-[11px] text-gray-500">Acompanhamento dos lotes e integridade transacional</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>Rolar Automaticamente</span>
            </label>

            <button
              type="button"
              onClick={copyLogsToClipboard}
              disabled={messages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLogs ? "Copiado" : "Copiar Logs"}</span>
            </button>
          </div>
        </div>

        {/* Janela de Logs com Formatação */}
        <div
          ref={messagesRef}
          className="max-h-96 min-h-[220px] overflow-y-auto font-mono text-xs bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-1.5"
        >
          {messages.length ? (
            messages.map((msg, idx) => {
              const { type, cleanText } = classifyLogMessage(msg);
              const timestamp = new Date(msgTimesRef.current[idx] ?? Date.now()).toLocaleTimeString();

              let textStyle = "text-gray-300";
              let badgeBg = "bg-gray-800 text-gray-300";

              if (type === "error") {
                textStyle = "text-red-400 font-semibold";
                badgeBg = "bg-red-950 text-red-300 border border-red-800";
              } else if (type === "warning") {
                textStyle = "text-amber-300";
                badgeBg = "bg-amber-950 text-amber-300 border border-amber-800";
              } else if (type === "success") {
                textStyle = "text-emerald-300 font-semibold";
                badgeBg = "bg-emerald-950 text-emerald-300 border border-emerald-800";
              } else if (type === "status") {
                textStyle = "text-blue-300";
                badgeBg = "bg-blue-950 text-blue-300 border border-blue-800";
              }

              return (
                <div key={`${idx}-${msg.slice(0, 30)}`} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-gray-600 text-[10px] select-none pt-0.5">{timestamp}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider select-none ${badgeBg}`}>
                    {type}
                  </span>
                  <span className={`flex-1 break-words ${textStyle}`}>{cleanText}</span>
                </div>
              );
            })
          ) : (
            <div className="text-gray-500 text-center py-12 italic">
              {isRunning ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Estabelecendo conexão WebSocket e iniciando envio dos lotes...</span>
                </div>
              ) : (
                "Nenhum log gerado ainda. Clique em 'Iniciar Transferência' para executar a migração."
              )}
            </div>
          )}
        </div>

        {/* Feedback visual de Sucesso ou Erro no final */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-red-800">
              <strong className="block font-bold">Erro reportado durante a transferência:</strong>
              <p className="mt-0.5 font-mono">{error}</p>
            </div>
          </div>
        )}

        {hasCompleted && !error && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-900">
                <strong className="block font-bold">Migração Concluída com Sucesso!</strong>
                <p className="mt-0.5 text-emerald-800">
                  Todos os registros e tabelas configurados foram processados e gravados com integridade no banco de destino.
                </p>
              </div>
            </div>

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nova Migração</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detalhes das Tabelas Mapeadas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <TableIcon className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-gray-900 text-sm">Resumo dos Mapeamentos Configurados</h3>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {Object.entries(tableMappings ?? {}).map(([tableId, mapping]) => {
            const enabledCols = safeArr(mapping?.colunas_relacionados_para_transacao).filter((c) => c?.enabled);
            const isRenamed = mapping?.tabela_name_origem !== mapping?.tabela_name_destino;

            return (
              <div
                key={tableId}
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-gray-900">{mapping?.tabela_name_origem}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className={`font-mono font-bold text-xs ${isRenamed ? "text-purple-700" : "text-emerald-700"}`}>
                      {mapping?.tabela_name_destino}
                    </span>
                    {mapping?.custom_query && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        ⚡ Query
                      </span>
                    )}
                    {mapping?.where_clause && !mapping?.custom_query && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        🔍 WHERE: {mapping.where_clause}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                    {enabledCols.length} campo{enabledCols.length !== 1 ? "s" : ""} ativo{enabledCols.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {enabledCols.map((col) => (
                    <span
                      key={String(col.id_coluna_origem || col.coluna_origen_name)}
                      className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[11px] font-mono text-gray-700"
                    >
                      {col.coluna_origen_name}
                      {col.coluna_origen_name !== col.coluna_distino_name && (
                        <span className="text-emerald-600 font-semibold"> ➔ {col.coluna_distino_name}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};