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
  TableProperties,
  Trash2,
} from "lucide-react";

import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import usePersistedState from "@/hook/localStoreUse";

type DatasetPreviewRow = Record<string, unknown>;

// 1. Tipagem ajustada para o formato do Back-end
export type DatasetTableInfo = {
  table_name: string;
  rows: number;
  columns: number;
  column_names: string[];
  preview: DatasetPreviewRow[];
};

export type DatasetImportResponse = {
  success: boolean;
  source: "file" | "url" | "kaggle";
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
  onError?: () => void;
};

type ImportMode = "file" | "url" | "kaggle";

const ACCEPTED_EXTENSIONS = ".csv,.json,.xls,.xlsx";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB
const LARGE_FILE_THRESHOLD_BYTES = 1024 * 1024 * 1024; // 1 GB (abaixo disso não exige amostragem)

export function DatasetImportModal({
  isOpen,
  onClose,
  onImported,
  onError,
}: DatasetImportModalProps) {
  const { api } = useSession();
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados persistidos com usePersistedState (preferências e credenciais reutilizáveis)
  const [rawMode, setMode] = usePersistedState<ImportMode>(
    "dataset_import_mode",
    "file"
  );
  const [kaggleUsername, setKaggleUsername, clearKaggleUsername] =
    usePersistedState<string>("dataset_import_kaggle_username", "");
  const [kaggleKey, setKaggleKey, clearKaggleKey] = usePersistedState<string>(
    "dataset_import_kaggle_key",
    ""
  );
  const [saveKaggleCreds, setSaveKaggleCreds] = usePersistedState<boolean>(
    "dataset_import_save_kaggle_creds",
    false
  );
  const [kaggleMaxRows, setKaggleMaxRows] = usePersistedState<number>(
    "dataset_import_kaggle_max_rows",
    50000
  );

  const mode: ImportMode =
    rawMode === "file" || rawMode === "url" || rawMode === "kaggle"
      ? rawMode
      : "file";

  // Estados transitórios (específicos de cada processo de importação)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetUrl, setDatasetUrl] = useState("");
  const [kaggleHandle, setKaggleHandle] = useState("");
  const [kaggleFilePath, setKaggleFilePath] = useState("");
  const [availableFiles, setAvailableFiles] = useState<
    { name: string; size_bytes: number }[]
  >([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<DatasetImportResponse | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const canSubmit = useMemo(() => {
    if (isImporting) return false;
    if (mode === "file") {
      if (!selectedFile) return false;
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) return false;
      if (
        selectedFile.size > LARGE_FILE_THRESHOLD_BYTES &&
        (!kaggleMaxRows || kaggleMaxRows === 0)
      ) {
        return false;
      }
      return true;
    }
    if (mode === "url") return datasetUrl.trim().length > 0;
    if (mode === "kaggle") return kaggleHandle.trim().length > 0;
    return false;
  }, [isImporting, mode, selectedFile, kaggleMaxRows, datasetUrl, kaggleHandle]);

  // Função para limpar os campos específicos do processo (usada no sucesso e fechar)
  const clearProcessInputs = useCallback(() => {
    setSelectedFile(null);
    setDatasetUrl("");
    setKaggleHandle("");
    setKaggleFilePath("");
    setAvailableFiles([]);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClearKaggleCreds = useCallback(() => {
    setKaggleUsername("");
    setKaggleKey("");
    clearKaggleUsername?.();
    clearKaggleKey?.();
  }, [setKaggleUsername, setKaggleKey, clearKaggleUsername, clearKaggleKey]);

  const handleClose = useCallback(() => {
    clearProcessInputs();
    setResult(null);
    onClose();
  }, [clearProcessInputs, onClose]);

  const handleModeChange = useCallback(
    (nextMode: ImportMode) => {
      setMode(nextMode);
      setErrorMessage("");

      if (nextMode === "file") {
        setDatasetUrl("");
      } else {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [setMode]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      if (file && file.size > MAX_FILE_SIZE_BYTES) {
        setSelectedFile(null);
        setErrorMessage(
          t(
            "datasetImportModal.errors.maxSizeExceeded",
            "O arquivo selecionado excede o limite máximo permitido de 20 GB."
          )
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
      setErrorMessage("");
      setResult(null);
    },
    [t]
  );

  const handleUrlChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDatasetUrl(event.target.value);
      setErrorMessage("");
      setResult(null);
    },
    []
  );

  const fetchKaggleFiles = useCallback(async () => {
    const clean = kaggleHandle.trim();
    if (!clean) return;
    try {
      setIsLoadingFiles(true);
      setErrorMessage("");
      const { data } = await api.get<{
        success: boolean;
        files: { name: string; size_bytes: number }[];
      }>("/conn/dataset/kaggle/files", {
        params: {
          dataset_handle: clean,
          kaggle_username: kaggleUsername.trim() || undefined,
          kaggle_key: kaggleKey.trim() || undefined,
        },
        withCredentials: true,
      });
      if (data?.files) {
        setAvailableFiles(data.files);
        if (data.files.length === 1 && !kaggleFilePath) {
          setKaggleFilePath(data.files[0].name);
        }
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        t(
          "datasetImportModal.errors.fetchFilesError",
          "Erro ao consultar arquivos do dataset no Kaggle."
        );
      setErrorMessage(detail);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [api, kaggleHandle, kaggleUsername, kaggleKey, kaggleFilePath, t]);

  const importDataset = useCallback(async () => {
    try {
      setIsImporting(true);
      setErrorMessage("");
      setResult(null);

      const formData = new FormData();

      if (mode === "file") {
        if (!selectedFile) {
          setErrorMessage(
            t(
              "datasetImportModal.errors.selectFile",
              "Seleciona um arquivo antes de importar."
            )
          );
          return;
        }

        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
          setErrorMessage(
            t(
              "datasetImportModal.errors.maxSizeExceeded",
              "O arquivo selecionado excede o limite máximo permitido de 20 GB."
            )
          );
          return;
        }

        if (
          selectedFile.size > LARGE_FILE_THRESHOLD_BYTES &&
          (!kaggleMaxRows || kaggleMaxRows === 0)
        ) {
          setErrorMessage(
            t(
              "datasetImportModal.file.largeFileWarningDesc",
              "Arquivos com mais de 1 GB necessitam de uma amostragem de linhas (ex: 50.000 linhas) para evitar lentidão ou falta de memória no servidor (máx. 20 GB)."
            )
          );
          return;
        }

        // Se o arquivo for muito volumoso (> 25 MB) e o usuário escolheu amostragem de linhas:
        // Fatia no cliente apenas o bloco necessário para a amostragem, evitando transferir gigabytes pela rede
        let fileToSend: File | Blob = selectedFile;
        const isCsv = selectedFile.name.toLowerCase().endsWith(".csv");

        if (
          kaggleMaxRows &&
          kaggleMaxRows > 0 &&
          selectedFile.size > 25 * 1024 * 1024 &&
          isCsv
        ) {
          const estimatedBytes = Math.max(
            25 * 1024 * 1024,
            kaggleMaxRows * 800
          );
          const sliceBytes = Math.min(selectedFile.size, estimatedBytes);
          fileToSend = new File(
            [selectedFile.slice(0, sliceBytes)],
            selectedFile.name,
            { type: selectedFile.type || "text/csv" }
          );
        }

        formData.append("file", fileToSend);
        if (kaggleMaxRows && kaggleMaxRows > 0) {
          formData.append("max_rows", String(kaggleMaxRows));
        }
      }

      if (mode === "url") {
        const cleanUrl = datasetUrl.trim();
        if (!cleanUrl) {
          setErrorMessage(
            t(
              "datasetImportModal.errors.validUrl",
              "Informa uma URL pública válida."
            )
          );
          return;
        }
        formData.append("url", cleanUrl);
        if (kaggleMaxRows && kaggleMaxRows > 0) {
          formData.append("max_rows", String(kaggleMaxRows));
        }
      }

      if (mode === "kaggle") {
        const cleanHandle = kaggleHandle.trim();
        if (!cleanHandle) {
          setErrorMessage(
            t(
              "datasetImportModal.errors.kaggleHandleRequired",
              "Informa o identificador do dataset do Kaggle (ex: usuario/dataset ou URL)."
            )
          );
          return;
        }
        formData.append("dataset_handle", cleanHandle);
        if (kaggleFilePath.trim()) {
          formData.append("file_path", kaggleFilePath.trim());
        }
        if (kaggleMaxRows && kaggleMaxRows > 0) {
          formData.append("max_rows", String(kaggleMaxRows));
        }
        if (kaggleUsername.trim()) {
          formData.append("kaggle_username", kaggleUsername.trim());
        }
        if (kaggleKey.trim()) {
          formData.append("kaggle_key", kaggleKey.trim());
        }
        formData.append("save_credentials", String(saveKaggleCreds));
      }

      const endpoint =
        mode === "kaggle" ? "/conn/dataset/kaggle" : "/conn/dataset/open";

      const { data } = await api.post<DatasetImportResponse>(
        endpoint,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 600000,
        }
      );

      // Gerencia quando terminar o processo e der sucesso limpa
      if (data && data.success) {
        setResult(data);
        clearProcessInputs();
        onImported?.(data);
      } else {
        setResult(data);
      }
    } catch (error: unknown) {
      console.error("Erro ao importar dataset:", error);

      const fallbackError = t(
        "datasetImportModal.errors.failedToImport",
        "Não foi possível importar o dataset."
      );

      let apiError = fallbackError;

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "ECONNABORTED"
      ) {
        apiError = t(
          "datasetImportModal.errors.timeout",
          "O envio do dataset excedeu o tempo limite. Tente novamente ou use uma amostragem menor."
        );
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
      ) {
        const res = (error as { response?: { data?: { detail?: string } } }).response;
        apiError = res?.data?.detail || fallbackError;
      }

      setErrorMessage(apiError);
      onError?.();
    } finally {
      setIsImporting(false);
    }
  }, [
    api,
    clearProcessInputs,
    datasetUrl,
    mode,
    onImported,
    onError,
    selectedFile,
    kaggleHandle,
    kaggleFilePath,
    kaggleMaxRows,
    kaggleUsername,
    kaggleKey,
    saveKaggleCreds,
    t,
  ]);

  const renderSamplingSelector = (focusColor: "blue" | "sky" = "blue") => (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700">
          {t(
            "datasetImportModal.kaggle.samplingLabel",
            "Amostragem de linhas"
          )}
        </label>
        <span className="text-[11px] font-medium text-amber-700">
          {t(
            "datasetImportModal.kaggle.samplingBadge",
            "Recomendado para datasets grandes"
          )}
        </span>
      </div>
      <select
        value={kaggleMaxRows}
        onChange={(e) => setKaggleMaxRows(Number(e.target.value))}
        className={`w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition ${
          focusColor === "sky"
            ? "focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            : "focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        }`}
      >
        <option value={10000}>
          {t(
            "datasetImportModal.kaggle.samplingOptions.rows10k",
            "10.000 linhas (Amostra rápida)"
          )}
        </option>
        <option value={50000}>
          {t(
            "datasetImportModal.kaggle.samplingOptions.rows50k",
            "50.000 linhas (Recomendado)"
          )}
        </option>
        <option value={100000}>
          {t(
            "datasetImportModal.kaggle.samplingOptions.rows100k",
            "100.000 linhas (Amostra média)"
          )}
        </option>
        <option value={250000}>
          {t(
            "datasetImportModal.kaggle.samplingOptions.rows250k",
            "250.000 linhas (Amostra grande)"
          )}
        </option>
        <option value={0}>
          {t(
            "datasetImportModal.kaggle.samplingOptions.allRows",
            "Todas as linhas (Atenção: arquivos de gigabytes podem demorar ou esgotar RAM)"
          )}
        </option>
      </select>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex h-full items-center justify-center">
        <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-3xl">
          {/* Cabeçalho */}
          <div className="flex shrink-0 flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 text-blue-600 shadow-sm sm:h-12 sm:w-12">
                <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {t("datasetImportModal.title", "Importar dataset")}
                </h2>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  {t(
                    "datasetImportModal.description",
                    "Faz upload de um arquivo, usa uma URL pública ou importa do Kaggle para criar uma conexão SQLite."
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end md:justify-start">
              <button
                onClick={handleClose}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label={t("datasetImportModal.closeAria", "Fechar modal")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              {/* LADO ESQUERDO: CONFIGURAÇÃO / INPUTS */}
              <div className="space-y-4 sm:space-y-5">
                {/* Seleção do Modo */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleModeChange("file")}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      mode === "file"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      {t("datasetImportModal.modes.file", "Upload")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("url")}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      mode === "url"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      {t("datasetImportModal.modes.url", "URL pública")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("kaggle")}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      mode === "kaggle"
                        ? "border-sky-500 bg-sky-50 text-sky-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 fill-current text-sky-500"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.352c-.234 0-.352-.117-.352-.352V.352c0-.235.118-.352.352-.352h2.583c.234 0 .351.117.351.352v13.916l6.236-6.685c.164-.164.339-.246.527-.246h3.292c.164 0 .258.058.281.176.023.117-.023.234-.141.351l-6.353 6.448 6.552 9.07c.14.187.164.316.071.477z" />
                      </svg>
                      {t("datasetImportModal.modes.kaggle", "Kaggle")}
                    </span>
                  </button>
                </div>

                {/* MODO FILE */}
                {mode === "file" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        {t(
                          "datasetImportModal.file.selectLabel",
                          "Seleciona o arquivo"
                        )}
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
                              {t(
                                "datasetImportModal.file.dropLabel",
                                "Clica para escolher um arquivo"
                              )}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {t(
                                "datasetImportModal.file.formats",
                                "Formatos suportados: CSV, JSON, XLS e XLSX"
                              )}
                              {" • "}
                              <span className="font-semibold text-gray-600">
                                {t(
                                  "datasetImportModal.file.maxSizeInfo",
                                  "Tamanho máx: 20 GB"
                                )}
                              </span>
                            </p>
                          </div>
                        </label>
                      </div>

                      {selectedFile && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                          <p className="text-sm font-semibold text-green-800">
                            {t(
                              "datasetImportModal.file.selectedFile",
                              "Arquivo selecionado"
                            )}
                          </p>
                          <p className="mt-1 break-all text-sm text-green-700">
                            {selectedFile.name}
                          </p>
                          <p className="mt-1 text-xs text-green-600">
                            {formatFileSize(selectedFile.size)}
                          </p>

                          {selectedFile.size > MAX_FILE_SIZE_BYTES ? (
                            <div className="mt-2.5 rounded-lg border border-red-300 bg-red-100/80 p-2.5 text-xs text-red-900">
                              <p>
                                ⛔ <strong>{t("datasetImportModal.file.largeFileWarning", "Atenção")}:</strong>{" "}
                                {t(
                                  "datasetImportModal.errors.maxSizeExceeded",
                                  "O arquivo selecionado excede o limite máximo permitido de 20 GB."
                                )}
                              </p>
                            </div>
                          ) : selectedFile.size > LARGE_FILE_THRESHOLD_BYTES ? (
                            <div
                              className={`mt-2.5 rounded-lg p-2.5 text-xs ${
                                kaggleMaxRows && kaggleMaxRows > 0
                                  ? "border border-sky-200 bg-sky-100/70 text-sky-800"
                                  : "border border-amber-300 bg-amber-100/80 text-amber-900"
                              }`}
                            >
                              {kaggleMaxRows && kaggleMaxRows > 0 ? (
                                <p>
                                  ⚡ <strong>{t("datasetImportModal.file.largeFileSamplingActive", "Arquivo volumoso")} ({formatFileSize(selectedFile.size)}):</strong>{" "}
                                  {t(
                                    "datasetImportModal.file.largeFileSamplingDesc",
                                    "A amostragem de linhas está ativa. O envio será otimizado automaticamente para carregar em segundos."
                                  )}
                                </p>
                              ) : (
                                <p>
                                  ⚠️ <strong>{t("datasetImportModal.file.largeFileWarning", "Atenção")}:</strong>{" "}
                                  {t(
                                    "datasetImportModal.file.largeFileWarningDesc",
                                    "Arquivos com mais de 1 GB necessitam de uma amostragem de linhas (ex: 50.000 linhas) para evitar lentidão ou falta de memória no servidor (máx. 20 GB)."
                                  )}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      {renderSamplingSelector("blue")}
                    </div>
                  </div>
                )}

                {/* MODO URL */}
                {mode === "url" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        {t(
                          "datasetImportModal.url.label",
                          "URL pública do dataset"
                        )}
                      </label>

                      <input
                        type="url"
                        value={datasetUrl}
                        onChange={handleUrlChange}
                        placeholder={t(
                          "datasetImportModal.url.placeholder",
                          "https://exemplo.com/dataset.csv"
                        )}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        {t(
                          "datasetImportModal.url.helper",
                          "Usa uma URL direta para um arquivo CSV, JSON, XLS ou XLSX."
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      {renderSamplingSelector("blue")}
                    </div>
                  </div>
                )}

                {/* MODO KAGGLE */}
                {mode === "kaggle" && (
                  <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-800">
                          {t(
                            "datasetImportModal.kaggle.handleLabel",
                            "Dataset do Kaggle"
                          )}
                        </label>
                        <span className="text-[11px] text-gray-500">
                          {t(
                            "datasetImportModal.kaggle.handleBadge",
                            "ID, URL ou Código"
                          )}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={kaggleHandle}
                          onChange={(e) => {
                            setKaggleHandle(e.target.value);
                            setAvailableFiles([]);
                          }}
                          placeholder={t(
                            "datasetImportModal.kaggle.handlePlaceholder",
                            "ex: ofurkancoban/discogs-data-dumps-february-2026"
                          )}
                          className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        />
                        <button
                          type="button"
                          onClick={fetchKaggleFiles}
                          disabled={!kaggleHandle.trim() || isLoadingFiles}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3.5 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50"
                          title={t(
                            "datasetImportModal.kaggle.listBtnTitle",
                            "Ver arquivos contidos no dataset"
                          )}
                        >
                          {isLoadingFiles ? (
                            <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                          ) : (
                            <TableProperties className="h-4 w-4 text-sky-600" />
                          )}
                          <span>
                            {t(
                              "datasetImportModal.kaggle.listBtn",
                              "Listar arquivos"
                            )}
                          </span>
                        </button>
                      </div>

                      <p className="mt-1.5 text-xs text-gray-500">
                        {t(
                          "datasetImportModal.kaggle.handleHelpPrefix",
                          "Pode colar o ID ("
                        )}
                        <code className="rounded bg-white/80 px-1 py-0.5 text-[11px] font-mono text-gray-700 border border-gray-200">
                          usuario/dataset
                        </code>
                        {t(
                          "datasetImportModal.kaggle.handleHelpOr",
                          "), a URL do Kaggle ou o snippet Python com "
                        )}
                        <code className="rounded bg-white/80 px-1 py-0.5 text-[11px] font-mono text-gray-700 border border-gray-200">
                          kagglehub
                        </code>
                        .
                      </p>
                    </div>

                    {/* Seleção do arquivo */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                        {t(
                          "datasetImportModal.kaggle.fileLabel",
                          "Arquivo específico (tabela)"
                        )}
                      </label>
                      {availableFiles.length > 0 ? (
                        <select
                          value={kaggleFilePath}
                          onChange={(e) => setKaggleFilePath(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        >
                          <option value="">
                            {t(
                              "datasetImportModal.kaggle.selectFileOption",
                              "Selecione um arquivo ({count} encontrados)...",
                              { count: availableFiles.length }
                            )}
                          </option>
                          {availableFiles.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.name}{" "}
                              {f.size_bytes > 0
                                ? `(${(f.size_bytes / (1024 * 1024)).toFixed(1)} MB)`
                                : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={kaggleFilePath}
                          onChange={(e) => setKaggleFilePath(e.target.value)}
                          placeholder={t(
                            "datasetImportModal.kaggle.fileInputPlaceholder",
                            "ex: artists.csv (obrigatório se o dataset tiver múltiplos arquivos)"
                          )}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        />
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {t(
                          "datasetImportModal.kaggle.discogsHelpPrefix",
                          "Para o Discogs: use "
                        )}
                        <code className="rounded bg-white/80 px-1 py-0.5 text-[11px] font-mono text-gray-700 border border-gray-200">
                          artists.csv
                        </code>
                        ,{" "}
                        <code className="rounded bg-white/80 px-1 py-0.5 text-[11px] font-mono text-gray-700 border border-gray-200">
                          labels.csv
                        </code>
                        {t("datasetImportModal.kaggle.discogsHelpSuffix", ", etc.")}
                      </p>
                    </div>

                    {/* Amostragem de linhas */}
                    {renderSamplingSelector("sky")}

                    {/* Credenciais do Kaggle */}
                    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800">
                          {t(
                            "datasetImportModal.kaggle.credentialsTitle",
                            "Credenciais do Kaggle (API Token)"
                          )}
                        </span>
                        <div className="flex items-center gap-3">
                          {(kaggleUsername || kaggleKey) && (
                            <button
                              type="button"
                              onClick={handleClearKaggleCreds}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-700"
                              title={t(
                                "datasetImportModal.kaggle.clearCreds",
                                "Limpar credenciais guardadas"
                              )}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>
                                {t(
                                  "datasetImportModal.kaggle.clearCreds",
                                  "Limpar"
                                )}
                              </span>
                            </button>
                          )}
                          <a
                            href="https://www.kaggle.com/settings/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-sky-600 hover:underline"
                          >
                            {t(
                              "datasetImportModal.kaggle.credentialsLink",
                              "Obter chave no Kaggle ↗"
                            )}
                          </a>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {t(
                          "datasetImportModal.kaggle.credentialsHelp",
                          "Opcional se já configurado no .env do servidor."
                        )}
                      </p>
                      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={kaggleUsername}
                          onChange={(e) => setKaggleUsername(e.target.value)}
                          placeholder={t(
                            "datasetImportModal.kaggle.usernamePlaceholder",
                            "Kaggle Username"
                          )}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                        <input
                          type="password"
                          value={kaggleKey}
                          onChange={(e) => setKaggleKey(e.target.value)}
                          placeholder={t(
                            "datasetImportModal.kaggle.keyPlaceholder",
                            "Kaggle API Key / Token"
                          )}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                      <label className="mt-2.5 flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={saveKaggleCreds}
                          onChange={(e) => setSaveKaggleCreds(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>
                          {t(
                            "datasetImportModal.kaggle.saveCredsCheckbox",
                            "Guardar credenciais no servidor para futuras importações"
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Mensagem de Erro */}
                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-red-800">
                        {t("datasetImportModal.errors.title", "Erro na importação")}
                      </p>
                      <p className="mt-1 break-words text-sm text-red-700">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    {t("datasetImportModal.actions.cancel", "Cancelar")}
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
                        {t(
                          "datasetImportModal.actions.importing",
                          "Importando..."
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {mode === "kaggle"
                          ? t(
                              "datasetImportModal.actions.importKaggle",
                              "Importar do Kaggle"
                            )
                          : t(
                              "datasetImportModal.actions.importDataset",
                              "Importar dataset"
                            )}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* LADO DIREITO: PREVIEW MULTI-TABELA */}
              <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
                  {t("datasetImportModal.preview.title", "Preview")}
                </h3>

                {!result ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center sm:min-h-[320px]">
                    <Database className="mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-700">
                      {t(
                        "datasetImportModal.preview.emptyTitle",
                        "Nenhum dataset importado ainda"
                      )}
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-gray-500">
                      {t(
                        "datasetImportModal.preview.emptyDesc",
                        "Depois da importação vais ver aqui as tabelas geradas, número de linhas, colunas e uma pré-visualização dos dados."
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-green-800">
                          {t(
                            "datasetImportModal.preview.successTitle",
                            "Dataset importado com sucesso"
                          )}
                        </p>
                        <p className="mt-1 break-words text-sm text-green-700">
                          {result.message}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {t(
                            "datasetImportModal.preview.originalFile",
                            "Arquivo Original"
                          )}
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                          {result.filename}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {t(
                            "datasetImportModal.preview.connection",
                            "Conexão"
                          )}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          #{result.connection_id}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                          {t(
                            "datasetImportModal.preview.generatedTables",
                            "Tabelas Geradas"
                          )}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-blue-900">
                          {result.total_tables_extracted}
                        </p>
                      </div>
                    </div>

                    {/* Mapear sobre todas as tabelas retornadas */}
                    <div className="space-y-6">
                      {result.tables.map((table, idx) => (
                        <div
                          key={`table-${idx}`}
                          className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                        >
                          {/* Cabeçalho da Tabela */}
                          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                            <div className="flex items-center gap-2 text-gray-800">
                              <TableProperties className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold">
                                {table.table_name}
                              </span>
                            </div>
                            <div className="flex gap-3 text-xs font-medium text-gray-500">
                              <span>
                                {t(
                                  "datasetImportModal.preview.rowsCount",
                                  "{count} Linhas",
                                  { count: table.rows }
                                )}
                              </span>
                              <span>•</span>
                              <span>
                                {t(
                                  "datasetImportModal.preview.colsCount",
                                  "{count} Colunas",
                                  { count: table.columns }
                                )}
                              </span>
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
                                      {t(
                                        "datasetImportModal.preview.noData",
                                        "Não há dados para preview nesta tabela."
                                      )}
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
                        {t(
                          "datasetImportModal.preview.closeAndOpen",
                          "Fechar e Ver Conexão"
                        )}
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