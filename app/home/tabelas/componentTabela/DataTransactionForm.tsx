// components/DataTransactionForm.tsx
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Database, X } from "lucide-react";

import { Step1Connections } from "./steps/Step1Connections";
import { Step2Tables } from "./steps/Step2Tables";
import { Step3Mapping } from "./steps/Step3Mapping";
import { Step4Execution } from "./steps/Step4Execution";
import { StepIndicator } from "./steps/StepIndicator";

import type { TableMapping } from "@/app/task/types/transfer-types";
import type { DBConnection } from "@/types/db-structure";

import usePersistedState from "@/hook/localStoreUse";
import { useSSEStream } from "@/hook/useTransferStream";
import { usePaginatedFetcher } from "../../hooks/useDBConnections";
import { getDatabaseIcon } from "./steps/utils";
import { buildTransferPayload } from "./transacao_query_component/compactar-payload";

export const DataTransactionForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  /** =========================
   * ESTADOS PRINCIPAIS
   ========================== */
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // persisted
  const [sourceConnection, setSourceDb] = usePersistedState<DBConnection | undefined>("sourceDb", undefined);
  const [targetConnection, setTargetDb] = usePersistedState<DBConnection | undefined>("targetDb", undefined);

  // IMPORTANT: selectedTables aqui é { [sourceTableId]: targetTableId }
  const [selectedTables, setSelectedTables] = usePersistedState<Record<string, string>>(
    "selectedTablesSourceBd",
    {}
  );

  // IMPORTANT: tableMappings aqui é { [sourceTableId]: TableMapping }
  const [tableMappings, setTableMappings] = usePersistedState<Record<string, TableMapping>>("tableMappingsbd", {});

  /** =========================
   * CONEXÕES DE BANCO
   ========================== */
  const { fetchPaginated, loading } = usePaginatedFetcher<DBConnection>((row) => ({
    value: String(row.id),
    label: `${getDatabaseIcon(row.type)} ${row.name}`,
  }));

  /** =========================
   * 🔒 SANITIZAÇÃO (não apagar dados por engano)
   * - Só roda quando as structures existem
   * - Valida por ID (não por table_name)
   * - Só atualiza state quando há mudança real (evita loops no persisted state)
   ========================== */
  useEffect(() => {
    const srcStructs = sourceConnection?.structures ?? [];
    const tgtStructs = targetConnection?.structures ?? [];

    if (!srcStructs.length || !tgtStructs.length) return;

    const validSrcIds = new Set(srcStructs.map((t) => String(t.id)));
    const validTgtIds = new Set(tgtStructs.map((t) => String(t.id)));

    // 1) selectedTables: remove pares inválidos (IDs inexistentes)
    setSelectedTables((prev) => {
      const prevObj = prev ?? {};
      let changed = false;

      const next: Record<string, string> = {};
      for (const [srcId, tgtId] of Object.entries(prevObj)) {
        const srcOk = validSrcIds.has(String(srcId));
        // target pode ser "" em alguns fluxos (permitimos)
        const tgtOk = !tgtId ? true : validTgtIds.has(String(tgtId));

        if (srcOk && tgtOk) next[srcId] = tgtId;
        else changed = true;
      }

      return changed ? next : prevObj;
    });

    // 2) tableMappings: remove mapping se:
    // - origem já não existe
    // - destino já não existe (se setado)
    // - ou se a tabela já não está selecionada
    setTableMappings((prev) => {
      const prevObj = prev ?? {};
      let changed = false;

      const next: Record<string, TableMapping> = {};

      for (const [srcId, mapping] of Object.entries(prevObj)) {
        const mappingSrcId = String(mapping.id_tabela_origen ?? srcId);
        const mappingTgtId = mapping.id_tabela_destino ? String(mapping.id_tabela_destino) : "";

        const srcOk = validSrcIds.has(mappingSrcId);
        const tgtOk = !mappingTgtId || mappingTgtId === "0" ? true : validTgtIds.has(mappingTgtId);
        const stillSelected = !!selectedTables?.[srcId];

        if (srcOk && tgtOk && stillSelected) {
          next[srcId] = mapping;
        } else {
          changed = true;
        }
      }

      return changed ? next : prevObj;
    });
  }, [sourceConnection?.structures, targetConnection?.structures, selectedTables, setSelectedTables, setTableMappings]);

  /** =========================
   * PARAMS DA TRANSFERÊNCIA
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
}, [tableMappings, targetConnection, sourceConnection]);

  /** =========================
   * EXECUÇÃO E MENSAGENS
   ========================== */
  const { error, isRunning, messages, startStream, stopStream } = useSSEStream({
    url: "transfer/stream",
    params: montarParametro,
    autoRetry: false,
  });

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
    onClose();
  }, [stopStream, onClose]);

  /** =========================
   * VALIDAÇÃO STEP 3
   ========================== */
  const validation = useMemo(() => {
    const issues: { tableId: string; message: string }[] = [];

    for (const [tableId, mapping] of Object.entries(tableMappings ?? {})) {
      const cols = mapping.colunas_relacionados_para_transacao ?? [];
      const enabled = cols.filter((c) => c.enabled);

      if (enabled.length === 0) {
        issues.push({ tableId, message: "Ative pelo menos 1 coluna nesta tabela." });
        continue;
      }

      const invalid = enabled.find((c) => !c.id_coluna_destino || !c.coluna_distino_name);
      if (invalid) issues.push({ tableId, message: "Há colunas ativas sem destino selecionado." });
    }

    return { isValid: issues.length === 0, issues };
  }, [tableMappings]);

  /** =========================
   * CONDIÇÕES DE PROGRESSO
   ========================== */
  const canProceedStep1 = !!(sourceConnection && targetConnection);
  const canProceedStep2 = Object.keys(selectedTables ?? {}).length > 0;

  // ✅ Melhor: usar selectedTables como base + validação quando tiver mappings
  // (Se quiser manter “precisa ter mappings”, deixa como estava.)
  const canProceedStep3 = Object.keys(selectedTables ?? {}).length > 0 && validation.isValid;

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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Database className="w-8 h-8" />
                Transferência de Dados entre Bases
              </h2>
              <p className="text-blue-100 mt-1">Configure e execute a migração de dados</p>
            </div>

            <button
              onClick={handleCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Indicador de Etapas */}
        <StepIndicator currentStep={step} />

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-6">
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
            />
          )}
        </main>

        {/* Rodapé */}
        <footer className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Esquerda */}
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isRunning}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-gray-700"
                >
                  Voltar
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700"
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Direita */}
            <div className="flex gap-3">
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
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
                >
                  Próximo
                </button>
              ) : (
                !isRunning && (
                  <button
                    type="button"
                    onClick={handleExecute}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-sm"
                  >
                    Executar Transferência
                  </button>
                )
              )}
            </div>
          </div>

          {/* Opcional: mostrar issues da validação no step 3 */}
          {step === 3 && !validation.isValid && (
            <div className="mt-3 text-sm text-red-600">
              {validation.issues.slice(0, 3).map((i) => (
                <div key={`${i.tableId}-${i.message}`}>• {i.message}</div>
              ))}
              {validation.issues.length > 3 && <div>… e mais {validation.issues.length - 3}.</div>}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};