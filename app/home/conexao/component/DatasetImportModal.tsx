"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  FileSpreadsheet,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TableProperties
} from "lucide-react";

import { useSession } from "@/context/SessionContext";

type DatasetPreviewRow = Record<string, unknown>;

// 1. Tipagem ajustada para o novo formato do Back-end
export type DatasetTableInfo = {
  table_name: string;
  rows: number;
  columns: number;
  column_names: string[];
  preview: DatasetPreviewRow[];
};

export type DatasetImportResponse = {
  success: boolean;
  source: "file" | "url";
  filename: string;
  connection_id: string;
  total_tables_extracted: number;
  tables: DatasetTableInfo[];
  message: string;
};

type DatasetImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: (result: DatasetImportResponse) => void;
};

type ImportMode = "file" | "url";

const ACCEPTED_EXTENSIONS = ".csv,.json,.xls,.xlsx";

export function DatasetImportModal({
  isOpen,
  onClose,
  onImported,
}: DatasetImportModalProps) {
  const { api } = useSession();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<ImportMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetUrl, setDatasetUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<DatasetImportResponse | null>(null);

  const canSubmit = useMemo(() => {
    if (isImporting) return false;
    if (mode === "file") return !!selectedFile;
    return datasetUrl.trim().length > 0;
  }, [isImporting, mode, selectedFile, datasetUrl]);

  const resetState = useCallback(() => {
    setMode("file");
    setSelectedFile(null);
    setDatasetUrl("");
    setIsImporting(false);
    setErrorMessage("");
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleModeChange = useCallback((nextMode: ImportMode) => {
    setMode(nextMode);
    setErrorMessage("");
    setResult(null);

    if (nextMode === "file") {
      setDatasetUrl("");
    } else {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      setSelectedFile(file);
      setErrorMessage("");
      setResult(null);
    },
    []
  );

  const handleUrlChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDatasetUrl(event.target.value);
      setErrorMessage("");
      setResult(null);
    },
    []
  );

  const importDataset = useCallback(async () => {
    try {
      setIsImporting(true);
      setErrorMessage("");
      setResult(null);

      const formData = new FormData();

      if (mode === "file") {
        if (!selectedFile) {
          setErrorMessage("Seleciona um arquivo antes de importar.");
          return;
        }
        formData.append("file", selectedFile);
      }

      if (mode === "url") {
        const cleanUrl = datasetUrl.trim();
        if (!cleanUrl) {
          setErrorMessage("Informa uma URL pública válida.");
          return;
        }
        formData.append("url", cleanUrl);
      }

      const { data } = await api.post<DatasetImportResponse>(
        "/conn/dataset/open",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(data);
      onImported?.(data);
    } catch (error: unknown) {
      console.error("Erro ao importar dataset:", error);

      const apiError =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
          ? (
              (error as {
                response?: { data?: { detail?: string } };
              }).response?.data?.detail || "Não foi possível importar o dataset."
            )
          : "Não foi possível importar o dataset.";

      setErrorMessage(apiError);
    } finally {
      setIsImporting(false);
    }
  }, [api, datasetUrl, mode, onImported, selectedFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex h-full items-center justify-center">
        <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-3xl">
          <div className="flex shrink-0 flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 text-blue-600 shadow-sm sm:h-12 sm:w-12">
                <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  Importar dataset
                </h2>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Faz upload de um arquivo ou usa uma URL pública para criar uma
                  conexão SQLite.
                </p>
              </div>
            </div>

            <div className="flex justify-end md:justify-start">
              <button
                onClick={handleClose}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <div className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("file")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      mode === "file"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("url")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      mode === "url"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      URL pública
                    </span>
                  </button>
                </div>

                {mode === "file" && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-3 block text-sm font-semibold text-gray-700">
                      Seleciona o arquivo
                    </label>

                    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-4 text-center transition hover:border-blue-400 sm:p-5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        onChange={handleFileChange}
                        className="hidden"
                        id="dataset-file-input"
                      />

                      <label
                        htmlFor="dataset-file-input"
                        className="flex cursor-pointer flex-col items-center justify-center gap-3"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-14 sm:w-14">
                          <FileSpreadsheet className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Clica para escolher um arquivo
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Formatos suportados: CSV, JSON, XLS e XLSX
                          </p>
                        </div>
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                        <p className="text-sm font-semibold text-green-800">
                          Arquivo selecionado
                        </p>
                        <p className="mt-1 break-all text-sm text-green-700">
                          {selectedFile.name}
                        </p>
                        <p className="mt-1 text-xs text-green-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {mode === "url" && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-3 block text-sm font-semibold text-gray-700">
                      URL pública do dataset
                    </label>

                    <input
                      type="url"
                      value={datasetUrl}
                      onChange={handleUrlChange}
                      placeholder="https://exemplo.com/dataset.csv"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Usa uma URL direta para um arquivo CSV, JSON, XLS ou XLSX.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-red-800">
                        Erro na importação
                      </p>
                      <p className="mt-1 break-words text-sm text-red-700">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={importDataset}
                    disabled={!canSubmit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Importar dataset
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* LADO DIREITO: PREVIEW MULTI-TABELA */}
              <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
                  Preview
                </h3>

                {!result ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center sm:min-h-[320px]">
                    <Database className="mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-700">
                      Nenhum dataset importado ainda
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-gray-500">
                      Depois da importação vais ver aqui as tabelas geradas, número
                      de linhas, colunas e uma pré-visualização dos dados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-green-800">
                          Dataset importado com sucesso
                        </p>
                        <p className="mt-1 break-words text-sm text-green-700">
                          {result.message}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Arquivo Original
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                          {result.filename}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Conexão
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          #{result.connection_id}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                          Tabelas Geradas
                        </p>
                        <p className="mt-1 text-sm font-semibold text-blue-900">
                          {result.total_tables_extracted}
                        </p>
                      </div>
                    </div>

                    {/* Mapear sobre todas as tabelas retornadas */}
                    <div className="space-y-6">
                      {result.tables.map((table, idx) => (
                        <div key={`table-${idx}`} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                          {/* Cabeçalho da Tabela */}
                          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                            <div className="flex items-center gap-2 text-gray-800">
                                <TableProperties className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold">{table.table_name}</span>
                            </div>
                            <div className="flex gap-3 text-xs font-medium text-gray-500">
                                <span>{table.rows} Linhas</span>
                                <span>•</span>
                                <span>{table.columns} Colunas</span>
                            </div>
                          </div>
                          
                          {/* Tabela de Dados */}
                          <div className="max-w-full overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  {table.column_names.map((column) => (
                                    <th
                                      key={`${table.table_name}-${column}`}
                                      className="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500"
                                    >
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              <tbody>
                                {table.preview.length > 0 ? (
                                  table.preview.map((row, rowIndex) => (
                                    <tr
                                      key={`preview-row-${table.table_name}-${rowIndex}`}
                                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                                    >
                                      {table.column_names.map((column) => (
                                        <td
                                          key={`${rowIndex}-${column}`}
                                          className="max-w-[140px] truncate px-3 py-2 text-sm text-gray-700 sm:max-w-[180px]"
                                          title={String(row[column] ?? "")}
                                        >
                                          {String(row[column] ?? "")}
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={table.column_names.length || 1}
                                      className="px-3 py-6 text-center text-sm text-gray-500"
                                    >
                                      Não há dados para preview nesta tabela.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto"
                      >
                        Fechar e Ver Conexão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}