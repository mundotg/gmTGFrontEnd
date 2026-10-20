// components/DataTransactionForm.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Database, X, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";

import { Step1Connections } from "./steps/Step1Connections";
import { Step2Tables } from "./steps/Step2Tables";
import { Step3Mapping } from "./steps/Step3Mapping";
import { Step4Execution } from "./steps/Step4Execution";
import { StepIndicator } from "./steps/StepIndicator";

import type { TableMapping } from "@/app/task/types/transfer-types";
import type { DBConnection } from "@/types/db-structure";

import usePersistedState from "@/hook/localStoreUse";
import { useTransferWs } from "@/hook/useTransferWs";
import { usePaginatedFetcher } from "../../../task/hook/useDBConnections";
import { getDatabaseIcon } from "./steps/utils";
import { buildTransferPayload } from "./transacao_query_component/compactar-payload";

export interface DataTransactionFormProps {
  onClose?: () => void;
  standalone?: boolean;
}

export const DataTransactionForm: React.FC<DataTransactionFormProps> = ({
  onClose,
  standalone = false,
}) => {
  /** =========================
   * ETAPA ATUAL
   ========================== */
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  /** =========================
   * ESTADOS PERSISTIDOS
   ========================== */
  const [sourceConnection, setSourceDb] = usePersistedState<DBConnection | undefined>(
    "sourceDb",
    undefined
  );
  const [targetConnection, setTargetDb] = usePersistedState<DBConnection | undefined>(
    "targetDb",
    undefined
  );

  // selectedTables: { [sourceTableId]: targetTableId }
  const [selectedTables, setSelectedTables] = usePersistedState<Record<string, string>>(
    "selectedTablesSourceBd",
    {}
  );

  // tableMappings: { [sourceTableId]: TableMapping }
  const [tableMappings, setTableMappings] = usePersistedState<Record<string, TableMapping>>(
    "tableMappingsbd",
    {}
  );

  /** =========================
   * CONEXÕES DE BANCO
   ========================== */
  const { fetchPaginated, loading } = usePaginatedFetcher<DBConnection>((row) => ({
    value: String(row.id),
    label: `${getDatabaseIcon(row.type)} ${row.name}`,
  }));

  /** =========================
   * REINICIAR / LIMPAR MIGRAÇÃO
   ========================== */
  const handleResetMigration = useCallback(() => {
    if (window.confirm("Deseja realmente reiniciar e limpar as configurações desta migração?")) {
      setSelectedTables({});
      setTableMappings({});
      setStep(1);
    }
  }, [setSelectedTables, setTableMappings]);

  /** =========================
   * PAYLOAD DA TRANSFERÊNCIA
   ========================== */
  const montarParametro = useMemo(() => {
    const compact = buildTransferPayload(tableMappings, {
      dropTablesWithNoEnabledColumns: true,
      keepDisabledColumns: false,
    });

    return {
      id_connectio_origen: sourceConnection?.id,
      id_connectio_distino: targetConnection?.id,
      tables_origen: JSON.stringify(compact),
    };
  }, [tableMappings, targetConnection?.id, sourceConnection?.id]);

  /** =========================
   * WEBSOCKET DE TRANSFERÊNCIA
   ========================== */
  const { error, isRunning, messages, startStream, stopStream } = useTransferWs(montarParametro);

  /** =========================
   * CONTROLES DE ETAPAS
   ========================== */
  const handleNext = useCallback(() => {
    setStep((prev) => (prev < 4 ? ((prev + 1) as typeof prev) : prev));
  }, []);

  const handleBack = useCallback(() => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as typeof prev) : prev));
  }, []);

  const handleCancel = useCallback(() => {
    stopStream();
    if (onClose) onClose();
  }, [stopStream, onClose]);

  /** =========================
   * VALIDAÇÃO STEP 3
   ========================== */
  const validation = useMemo(() => {
    const issues: { tableId: string; message: string }[] = [];
    const tableEntries = Object.entries(tableMappings ?? {});

    if (Object.keys(selectedTables ?? {}).length === 0) {
      issues.push({ tableId: "all", message: "Nenhuma tabela selecionada para migração." });
      return { isValid: false, issues };
    }

    for (const [tableId, mapping] of tableEntries) {
      const cols = mapping?.colunas_relacionados_para_transacao ?? [];
      const enabled = cols.filter((c) => c?.enabled);

      if (enabled.length === 0) {
        issues.push({
          tableId,
          message: `Ative pelo menos 1 coluna na tabela "${mapping?.tabela_name_origem || tableId}".`,
        });
      }
    }

    return { isValid: issues.length === 0, issues };
  }, [tableMappings, selectedTables]);

  /** =========================
   * CONDIÇÕES DE PROGRESSO
   ========================== */
  const canProceedStep1 = Boolean(sourceConnection && targetConnection);
  const canProceedStep2 = Object.keys(selectedTables ?? {}).length > 0;
  const canProceedStep3 = canProceedStep2 && validation.isValid;

  /** =========================
   * EXECUTAR TRANSFERÊNCIA
   ========================== */
  const handleExecute = useCallback(() => {
    if (isRunning) return;
    startStream();
  }, [startStream, isRunning]);

  /** =========================
   * RENDERIZAÇÃO
   ========================== */
  const cardContent = (
    <div
      className={`bg-white rounded-2xl w-full flex flex-col transition-all ${
        standalone
          ? "border border-gray-200 shadow-sm min-h-[700px]"
          : "shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden"
      }`}
    >
      {/* Header Modal (se não for standalone) */}
      {!standalone && (
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Transferência & Migração de Dados</h2>
                <p className="text-blue-100 text-xs">
                  Transações seguras entre bancos de dados relacionais e NoSQL
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetMigration}
                className="text-blue-100 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors text-xs flex items-center gap-1 font-medium"
                title="Reiniciar configuração"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Indicador de Etapas */}
      <StepIndicator currentStep={step} />

      {/* Conteúdo Dinâmico por Etapa */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-7">
        {step === 1 && (
          <Step1Connections
            loading={loading}
            sourceDb={sourceConnection}
            targetDb={targetConnection}
            onSourceDbChange={setSourceDb}
            onTargetDbChange={setTargetDb}
            fetchDBConnections={fetchPaginated}
          />
        )}

        {step === 2 && (
          <Step2Tables
            setSourceConnection={setSourceDb}
            setTargetConnection={setTargetDb}
            sourceConnection={sourceConnection as DBConnection}
            targetConnection={targetConnection as DBConnection}
            selectedTables={selectedTables}
            setSelectedTables={setSelectedTables}
            tableMappings={tableMappings}
            setTableMappings={setTableMappings}
            onSelectAll={(all) => setSelectedTables(all)}
            onClearSelection={() => setSelectedTables({})}
          />
        )}

        {step === 3 && (
          <Step3Mapping
            setSourceConnection={setSourceDb}
            setTargetConnection={setTargetDb}
            sourceConnection={sourceConnection as DBConnection}
            targetConnection={targetConnection as DBConnection}
            selectedTables={selectedTables}
            tableMappings={tableMappings}
            onTableMappingsChange={setTableMappings}
          />
        )}

        {step === 4 && (
          <Step4Execution
            sourceConnection={sourceConnection}
            targetConnection={targetConnection}
            tableMappings={tableMappings}
            isRunning={isRunning}
            messages={messages}
            error={error}
            onExecute={handleExecute}
            onStop={stopStream}
            onReset={handleResetMigration}
          />
        )}
      </main>

      {/* Rodapé Padronizado */}
      <footer className="border-t border-gray-200 bg-gray-50/80 px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isRunning}
                className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-xs sm:text-sm text-gray-700 shadow-2xs"
              >
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={handleResetMigration}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Limpar seleção e recomeçar do Passo 1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar Migração</span>
            </button>
          </div>

          {/* Lado Direito */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3) ||
                  isRunning
                }
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-xs sm:text-sm shadow-sm"
              >
                <span>Avançar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              isRunning ? (
                <button
                  type="button"
                  onClick={stopStream}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold text-xs sm:text-sm shadow-sm"
                >
                  Interromper
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecute}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-200"
                >
                  {messages.length ? "Executar Novamente" : "Iniciar Transferência"}
                </button>
              )
            )}
          </div>
        </div>

        {/* Feedback de Validação no Step 3 */}
        {step === 3 && !validation.isValid && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {validation.issues.slice(0, 3).map((issue, idx) => (
              <div key={`${issue.tableId}-${idx}`}>• {issue.message}</div>
            ))}
            {validation.issues.length > 3 && (
              <div className="mt-1 font-semibold">… e mais {validation.issues.length - 3} aviso(s).</div>
            )}
          </div>
        )}
      </footer>
    </div>
  );

  if (standalone) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      {cardContent}
    </div>
  );
};
