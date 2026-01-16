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

export const DataTransactionForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    /** =========================
     * ESTADOS PRINCIPAIS
     ========================== */
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [sourceConnection, setSourceDb] = usePersistedState<DBConnection | undefined>("sourceDb", undefined);
    const [targetConnection, setTargetDb] = usePersistedState<DBConnection | undefined>("targetDb", undefined);
    const [selectedTables, setSelectedTables] = usePersistedState<Record<string, string>>("selectedTablesSourceBd", {});
    const [tableMappings, setTableMappings] = usePersistedState<Record<string, TableMapping>>("tableMappingsbd", {});

    /** =========================
    * CONEXÕES DE BANCO
    ========================== */
    const {fetchPaginated, loading } = usePaginatedFetcher<DBConnection>((row) => ({
        value: String(row.id),
        label: `${getDatabaseIcon(row.type)} ${row.name}`
      }));
 

    useEffect(() => {
        if (!sourceConnection?.structures || !targetConnection?.structures) return;
        // ✅ Tabelas existentes no banco real
        const validSourceTables = sourceConnection.structures.map(t => t.table_name);
        const validTargetTables = targetConnection.structures.map(t => t.table_name);

        setSelectedTables(prev => {
            const updated: Record<string, string> = {};

            for (const [srcTable, dstTable] of Object.entries(prev)) {
                // ✅ Só mantém se existir nas duas conexões
                if (
                    validSourceTables.includes(srcTable) &&
                    validTargetTables.includes(dstTable)
                ) {
                    updated[srcTable] = dstTable;
                }
            }

            return updated;
        });

        setTableMappings(prev => {
            const updated: Record<string, TableMapping> = {};

            for (const [srcTable, mapping] of Object.entries(prev)) {
                if (validSourceTables.includes(srcTable)) {
                    updated[srcTable] = mapping;
                }
            }

            return updated;
        });

    }, [sourceConnection, targetConnection]);


    useEffect(() => {
        // Filtra apenas as tabelas que ainda estão selecionadas
        const filtered: Record<string, TableMapping> = Object.keys(tableMappings)
            .filter(tableName => tableName in selectedTables)
            .reduce((acc, tableName) => {
                acc[tableName] = tableMappings[tableName];
                return acc;
            }, {} as Record<string, TableMapping>);

        // Só atualiza se realmente houve mudança
        if (Object.keys(filtered).length !== Object.keys(tableMappings).length) {
            setTableMappings(filtered);
        }
    }, [selectedTables, tableMappings]);
    
    const montarParametro = useMemo(() => ({
        id_connectio_origen: sourceConnection?.id,
        id_connectio_distino: targetConnection?.id,
        tables_origen: JSON.stringify(tableMappings),
    }), [tableMappings, targetConnection, sourceConnection])
    /** =========================
     * EXECUÇÃO E MENSAGENS
     ========================== */
    const { error, isRunning, messages, startStream, stopStream } = useSSEStream({ url: "database/transfer/stream", params: montarParametro, autoRetry: false })



    /** =========================
     * CONTROLES DE ETAPAS
     ========================== */
    const handleNext = useCallback(() => {
        if (step < 4) setStep((prev) => (prev + 1) as typeof step);
    }, [step]);

    const handleBack = useCallback(() => {
        if (step > 1) setStep((prev) => (prev - 1) as typeof step);
    }, [step]);

    const handleCancel = useCallback(() => {
        stopStream()
        onClose();
    }, [onClose]);

    /** =========================
     * CONDIÇÕES DE PROGRESSO
     ==========================*/
    const canProceedStep1 = sourceConnection && targetConnection;
    const canProceedStep2 = Object.keys(selectedTables).length > 0;
    const canProceedStep3 = Object.keys(tableMappings).length > 0;

    /** =========================
     * EXECUTAR TRANSFERÊNCIA
     ========================== */
    const handleExecute = useCallback(() => {
        if (isRunning) return;
        startStream()

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
                            <p className="text-blue-100 mt-1">
                                Configure e execute a migração de dados
                            </p>
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

                {/* Conteúdo das Etapas */}
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
                            sourceConnection={sourceConnection as DBConnection}
                            targetConnection={targetConnection as DBConnection}
                            selectedTables={selectedTables}
                            setSelectedTables={setSelectedTables}
                            onSelectAll={(all) =>
                                setSelectedTables(
                                    all
                                )
                            }
                            onClearSelection={() => setSelectedTables({})}
                        />
                    )}

                    {step === 3 && (
                        <Step3Mapping
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

                {/* Rodapé com Navegação */}
                <footer className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex justify-between items-center">
                        {/* Botões Esquerda */}
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

                        {/* Botões Direita */}
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
                </footer>
            </div>
        </div>
    );
};
