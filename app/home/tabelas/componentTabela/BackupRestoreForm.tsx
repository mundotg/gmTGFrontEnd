"use client";

import { useSSEStream } from "@/hook/useTransferStream";
import { Download, Loader2, Upload, Square, AlertTriangle } from "lucide-react";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useI18n } from "@/context/I18nContext";
import { DBConnection } from "@/app/task/types";
import { usePaginatedFetcher } from "../../hooks/useDBConnections";
import { JoinSelect } from "@/app/task/components/select_Component";

interface BackupRestoreFormProps {
  onCancel: () => void;
  loading?: boolean;
  connectionId: string;
}

/** limites e validações */
const MAX_FILE_MB = 5000; // ajusta conforme tua infra
const ACCEPT_EXT = [".sql", ".backup", ".dump", ".gz"];

function getDatabaseIcon(type: string) {
  const icons: Record<string, string> = {
    postgresql: "🐘",
    mysql: "🐬",
    sqlserver: "🔷",
    sqlite: "💾",
    oracle: "🔶",
    mariadb: "🌊",
  };
  return icons[type] || "🗄️";
}

function isValidConnId(v: string) {
  // teu connId parece numérico (12). Se for UUID, troca a regex.
  return /^\d+$/.test(v.trim());
}

function fileHasAllowedExt(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPT_EXT.some((ext) => name.endsWith(ext));
}

function fileSizeOk(file: File) {
  const mb = file.size / (1024 * 1024);
  return mb <= MAX_FILE_MB;
}

async function uploadRestoreFile(opts: {
  connectionId: string;
  file: File;
  signal?: AbortSignal;
}): Promise<{ filepath: string }> {
  const fd = new FormData();
  fd.append("file", opts.file);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/database/restore/${opts.connectionId}/upload`,
    {
      method: "POST",
      body: fd,
      credentials: "include",
      signal: opts.signal,
    }
  );

  // tenta extrair erro decente
  if (!res.ok) {
    let msg = `Falha no upload (${res.status}).`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
    } catch {
      try {
        msg = await res.text();
      } catch {}
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as any;
  const filepath = String(data?.filepath || "").trim();
  if (!filepath) {
    throw new Error("Upload concluído, mas o servidor não retornou 'filepath'.");
  }
  return { filepath };
}

export const BackupRestoreForm: React.FC<BackupRestoreFormProps> = ({
  onCancel,
  loading,
  connectionId,
}) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"backup" | "restore">("backup");

  // Backup
  const [backupConnId, setBackupConnId] = useState<string>(connectionId || "");
  const [backupType, setBackupType] = useState<"full" | "schema" | "data">("full");

  // Restore
  const [restoreConnId, setRestoreConnId] = useState<string>(connectionId || "");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoreFilepath, setRestoreFilepath] = useState<string>(""); // <- path server (obrigatório)
  const [restoreIsUploading, setRestoreIsUploading] = useState(false);

  // Erros por aba (além do erro do hook)
  const [backupUiError, setBackupUiError] = useState<string | null>(null);
  const [restoreUiError, setRestoreUiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const { fetchPaginated, loading: loadingConnections } =
    usePaginatedFetcher<DBConnection>((row) => ({
      value: String(row.id),
      label: `${getDatabaseIcon(row.type)} ${row.name}`,
    }));

  const effectiveBackupConnId = (backupConnId || connectionId || "").trim();
  const effectiveRestoreConnId = (restoreConnId || connectionId || "").trim();

  /** SSE: backup */
  const backupStream = useSSEStream({
    url: `database/backup/${effectiveBackupConnId}/stream`,
    autoStart: false,
    autoRetry: false,
    retryDelay: 9000,
    // se quiser passar backupType como querystring:
    // params: { type: backupType },
  });

  /** SSE: restore (filepath precisa ser string válida) */
  const restoreStream = useSSEStream({
    url: `database/restore/${effectiveRestoreConnId}/stream`,
    params: restoreFilepath ? { filepath: restoreFilepath } : {},
    autoStart: false,
    autoRetry: false,
    retryDelay: 9000,
  });

  const messages = useMemo(() => {
    return activeTab === "backup" ? backupStream.messages : restoreStream.messages;
  }, [activeTab, backupStream.messages, restoreStream.messages]);

  const isRunning = activeTab === "backup" ? backupStream.isRunning : restoreStream.isRunning;
  const activeErrorFromHook = activeTab === "backup" ? backupStream.error : restoreStream.error;
  const activeUiError = activeTab === "backup" ? backupUiError : restoreUiError;

  // limpa erros ao trocar de aba
  useEffect(() => {
    setBackupUiError(null);
    setRestoreUiError(null);
  }, [activeTab]);

  // se mudar o arquivo do restore, invalida filepath antigo
  useEffect(() => {
    setRestoreFilepath("");
  }, [backupFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreUiError(null);

    const file = e.target.files?.[0] || null;
    if (!file) {
      setBackupFile(null);
      return;
    }

    if (!fileHasAllowedExt(file)) {
      setBackupFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setRestoreUiError(
        `Extensão inválida. Aceito: ${ACCEPT_EXT.join(", ")}`
      );
      return;
    }

    if (!fileSizeOk(file)) {
      setBackupFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setRestoreUiError(`Arquivo muito grande. Máximo: ${MAX_FILE_MB} MB.`);
      return;
    }

    setBackupFile(file);
  };

  /** validações backup */
  function validateBackup(): string | null {
    if (!effectiveBackupConnId) return "Selecione uma conexão para o backup.";
    if (!isValidConnId(effectiveBackupConnId)) return "ConnId inválido para backup.";
    // backupType aqui é UI apenas (se teu server não usa, ok)
    return null;
  }

  /** validações restore */
  function validateRestoreBeforeUpload(): string | null {
    if (!effectiveRestoreConnId) return "Selecione uma conexão para o restore.";
    if (!isValidConnId(effectiveRestoreConnId)) return "ConnId inválido para restore.";
    if (!backupFile) return "Selecione um arquivo de backup para restaurar.";
    if (!fileHasAllowedExt(backupFile)) return `Extensão inválida. Aceito: ${ACCEPT_EXT.join(", ")}`;
    if (!fileSizeOk(backupFile)) return `Arquivo muito grande. Máximo: ${MAX_FILE_MB} MB.`;
    return null;
  }

  const handleStartBackup = () => {
    setBackupUiError(null);

    const err = validateBackup();
    if (err) {
      backupStream.stopStream();
      setBackupUiError(err);
      return;
    }

    backupStream.startStream();
  };

  const handleStartRestore = async () => {
    setRestoreUiError(null);

    const err = validateRestoreBeforeUpload();
    if (err) {
      restoreStream.stopStream();
      setRestoreUiError(err);
      return;
    }

    // evita dupla execução
    if (restoreIsUploading || restoreStream.isRunning) return;

    // 1) upload
    setRestoreIsUploading(true);
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = new AbortController();

    try {
      const { filepath } = await uploadRestoreFile({
        connectionId: effectiveRestoreConnId,
        file: backupFile!, // já validado
        signal: uploadAbortRef.current.signal,
      });

      setRestoreFilepath(filepath);

      // 2) start SSE (agora com filepath)
      restoreStream.startStream();
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "Erro ao enviar arquivo para restore.";
      setRestoreUiError(msg);
    } finally {
      setRestoreIsUploading(false);
    }
  };

  const handleStopBackup = () => backupStream.stopStream();

  const handleStopRestore = () => {
    uploadAbortRef.current?.abort();
    setRestoreIsUploading(false);
    restoreStream.stopStream();
  };

  const handleAction = async () => {
    if (activeTab === "backup") return handleStartBackup();
    return handleStartRestore();
  };

  const handleStop = () => {
    if (activeTab === "backup") return handleStopBackup();
    return handleStopRestore();
  };

  // validações e disabled states
  const canRunBackup = !loading && !backupStream.isRunning && !restoreIsUploading;
  const canRunRestore = !loading && !restoreStream.isRunning && !restoreIsUploading;

  const isDisabled =
    loading ||
    isRunning ||
    restoreIsUploading ||
    (activeTab === "backup" ? !canRunBackup : !canRunRestore);

  return (
    <div className="space-y-5 p-1 bg-white rounded-xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["backup", "restore"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
            type="button"
            disabled={isRunning || restoreIsUploading}
            title={isRunning || restoreIsUploading ? "Pare a operação antes de trocar de aba." : ""}
          >
            {tab === "backup" ? <Download className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {tab === "backup" ? t("backup.backupTab") || "Backup" : t("backup.restoreTab") || "Restore"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4 px-2">
        {activeTab === "backup" ? (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              {t("backup.databaseLabel") || "Base de Dados (Backup)"}
            </label>

            <JoinSelect
              value={String(backupConnId || "")}
              onChange={(value) => {
                setBackupUiError(null);
                setBackupConnId(String(value || ""));
              }}
              fetchOptions={loadingConnections ? undefined : fetchPaginated}
              placeholder={t("backup.databasePlaceholder") || "Selecione a conexão"}
              className="w-full"
              buttonClassName="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
            />

            {effectiveBackupConnId && (
              <p className="mt-1 text-xs text-gray-600">
                ConnId: <span className="font-mono">{effectiveBackupConnId}</span>
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              {t("backup.databaseLabel") || "Base de Dados (Restore)"}
            </label>

            <JoinSelect
              value={String(restoreConnId || "")}
              onChange={(value) => {
                setRestoreUiError(null);
                setRestoreConnId(String(value || ""));
              }}
              fetchOptions={loadingConnections ? undefined : fetchPaginated}
              placeholder={t("backup.databasePlaceholder") || "Selecione a conexão"}
              className="w-full"
              buttonClassName="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
            />

            {effectiveRestoreConnId && (
              <p className="mt-1 text-xs text-gray-600">
                ConnId: <span className="font-mono">{effectiveRestoreConnId}</span>
              </p>
            )}
          </div>
        )}

        {/* Backup options */}
        {activeTab === "backup" && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              {t("backup.typeLabel") || "Tipo de Backup"}
            </label>

            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none"
              disabled={backupStream.isRunning || restoreIsUploading}
            >
              <option value="full">{t("backup.typeFull") || "Completo"}</option>
              <option value="schema">{t("backup.typeSchema") || "Apenas Schema"}</option>
              <option value="data">{t("backup.typeData") || "Apenas Dados"}</option>
            </select>

            <p className="mt-1 text-xs text-gray-600">
              Tipo selecionado: <span className="font-mono">{backupType}</span>
            </p>
          </div>
        )}

        {/* Restore options */}
        {activeTab === "restore" && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              {t("backup.fileLabel") || "Arquivo de Backup"}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_EXT.join(",")}
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={restoreStream.isRunning || restoreIsUploading}
            />

            {backupFile && (
              <p className="mt-1 text-xs text-gray-600">
                Arquivo: <span className="font-mono">{backupFile.name}</span> (
                {Math.round(backupFile.size / 1024)} KB)
              </p>
            )}

            {restoreFilepath && (
              <p className="mt-1 text-xs text-gray-600">
                Server path: <span className="font-mono">{restoreFilepath}</span>
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              * O restore faz upload do arquivo e depois inicia o stream.
            </p>
          </div>
        )}

        {/* Errors (UI + hook) */}
        {(activeUiError || activeErrorFromHook) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              {activeUiError && <div>{activeUiError}</div>}
              {activeErrorFromHook && <div>{activeErrorFromHook}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Logs */}
      {messages.length > 0 && (
        <div className="mx-2 mt-4 bg-gray-900 rounded-lg p-3 h-48 overflow-y-auto border border-gray-800 shadow-inner">
          {messages.map((msg, i) => (
            <div key={i} className="text-green-400 font-mono text-xs mb-1 whitespace-pre-wrap">
              <span className="text-gray-500 mr-2">{">"}</span>
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 px-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading || isRunning || restoreIsUploading}
          type="button"
        >
          {t("actions.cancel") || "Cancelar"}
        </button>

        <button
          onClick={handleStop}
          disabled={!isRunning && !restoreIsUploading}
          className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          type="button"
        >
          <Square className="w-4 h-4" />
          {t("actions.stop") || "Parar"}
        </button>

        <button
          onClick={handleAction}
          disabled={isDisabled}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          type="button"
          title={
            activeTab === "restore" && !backupFile
              ? "Selecione um arquivo antes de restaurar."
              : ""
          }
        >
          {(loading || isRunning || restoreIsUploading) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}

          {activeTab === "backup"
            ? t("backup.startBackup") || "Fazer Backup"
            : restoreIsUploading
            ? "Enviando arquivo..."
            : t("backup.startRestore") || "Fazer Restore"}
        </button>
      </div>
    </div>
  );
};