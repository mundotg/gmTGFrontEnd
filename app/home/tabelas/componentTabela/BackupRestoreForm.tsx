"use client";

import {
  Download,
  Loader2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { DBConnection } from "@/app/task/types";
import { usePaginatedFetcher } from "../../hooks/useDBConnections";
import { JoinSelect } from "@/app/task/components/select_Component";
import { useBackupJob } from "@/hook/useBackupJob";

interface BackupRestoreFormProps {
  onCancel: () => void;
  loading?: boolean;
  connectionId: string;
}

/** limites e validações — inclui formatos NoSQL (Mongo). */
const MAX_FILE_MB = 5000;
const ACCEPT_EXT = [".sql", ".backup", ".dump", ".gz", ".archive", ".bson", ".db", ".bak"];

function getDatabaseIcon(type: string) {
  const icons: Record<string, string> = {
    postgresql: "🐘",
    mysql: "🐬",
    sqlserver: "🔷",
    sqlite: "💾",
    oracle: "🔶",
    mariadb: "🌊",
    mongodb: "🍃",
  };
  return icons[type] || "🗄️";
}

const isValidConnId = (v: string) => /^\d+$/.test(v.trim());
const fileHasAllowedExt = (file: File) =>
  ACCEPT_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));
const fileSizeOk = (file: File) => file.size / (1024 * 1024) <= MAX_FILE_MB;

export const BackupRestoreForm: React.FC<BackupRestoreFormProps> = ({
  onCancel,
  loading,
  connectionId,
}) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"backup" | "restore">("backup");

  const [backupConnId, setBackupConnId] = useState<string>(connectionId || "");
  const [restoreConnId, setRestoreConnId] = useState<string>(connectionId || "");
  const [backupFile, setBackupFile] = useState<File | null>(null);

  const [uiError, setUiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { job, connected, error: jobError, isRunning, startBackup, startRestore, downloadUrl, reset } =
    useBackupJob();

  const { fetchPaginated, loading: loadingConnections } = usePaginatedFetcher<DBConnection>(
    (row) => ({ value: String(row.id), label: `${getDatabaseIcon(row.type)} ${row.name}` })
  );

  const effectiveBackupConnId = (backupConnId || connectionId || "").trim();
  const effectiveRestoreConnId = (restoreConnId || connectionId || "").trim();

  const logs = job?.logs ?? [];
  const progress = job?.progress ?? 0;
  const status = job?.status;
  const activeError = uiError || jobError || job?.error || null;

  const busy = loading || isRunning;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUiError(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setBackupFile(null);
      return;
    }
    if (!fileHasAllowedExt(file)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUiError(`Extensão inválida. Aceito: ${ACCEPT_EXT.join(", ")}`);
      return;
    }
    if (!fileSizeOk(file)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUiError(`Ficheiro muito grande. Máximo: ${MAX_FILE_MB} MB.`);
      return;
    }
    setBackupFile(file);
  };

  const handleStart = async () => {
    setUiError(null);
    if (activeTab === "backup") {
      if (!effectiveBackupConnId || !isValidConnId(effectiveBackupConnId)) {
        setUiError("Selecione uma conexão válida para o backup.");
        return;
      }
      await startBackup(Number(effectiveBackupConnId), true);
    } else {
      if (!effectiveRestoreConnId || !isValidConnId(effectiveRestoreConnId)) {
        setUiError("Selecione uma conexão válida para o restauro.");
        return;
      }
      if (!backupFile) {
        setUiError("Selecione um ficheiro de backup para restaurar.");
        return;
      }
      await startRestore(Number(effectiveRestoreConnId), backupFile);
    }
  };

  const switchTab = (tab: "backup" | "restore") => {
    if (isRunning) return;
    setActiveTab(tab);
    setUiError(null);
    reset();
  };

  const statusPill = useMemo(() => {
    if (!status) return null;
    const map = {
      queued: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Na fila" },
      running: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "A executar" },
      done: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Concluído" },
      error: { cls: "bg-red-50 text-red-700 border-red-200", label: "Erro" },
    } as const;
    return map[status];
  }, [status]);

  return (
    <div className="space-y-5 p-1 bg-white rounded-xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["backup", "restore"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
            type="button"
            disabled={isRunning}
            title={isRunning ? "Pare a operação antes de trocar de aba." : ""}
          >
            {tab === "backup" ? <Download className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {tab === "backup" ? t("backup.backupTab") || "Backup" : t("backup.restoreTab") || "Restore"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4 px-2">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            {activeTab === "backup"
              ? t("backup.databaseLabel") || "Base de Dados (Backup)"
              : "Base de Dados (Restauro)"}
          </label>
          <JoinSelect
            value={String((activeTab === "backup" ? backupConnId : restoreConnId) || "")}
            onChange={(value) => {
              setUiError(null);
              if (activeTab === "backup") setBackupConnId(String(value || ""));
              else setRestoreConnId(String(value || ""));
            }}
            fetchOptions={loadingConnections ? undefined : fetchPaginated}
            placeholder={t("backup.databasePlaceholder") || "Selecione a conexão"}
            className="w-full"
            buttonClassName="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
          />
        </div>

        {/* Backup: nota de suporte */}
        {activeTab === "backup" && (
          <p className="text-xs text-gray-500">
            Suporta PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, SQLite e{" "}
            <span className="font-semibold text-emerald-600">MongoDB</span> (NoSQL). O ficheiro é
            comprimido automaticamente.
          </p>
        )}

        {/* Restore: ficheiro */}
        {activeTab === "restore" && (
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              {t("backup.fileLabel") || "Ficheiro de Backup"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_EXT.join(",")}
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isRunning}
            />
            {backupFile && (
              <p className="mt-1 text-xs text-gray-600">
                {backupFile.name} ({Math.round(backupFile.size / 1024)} KB)
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Mongo: <span className="font-mono">.archive</span> /{" "}
              <span className="font-mono">.gz</span>. SQL:{" "}
              <span className="font-mono">.sql</span>,{" "}
              <span className="font-mono">.backup</span>,{" "}
              <span className="font-mono">.dump</span>.
            </p>
          </div>
        )}

        {/* Errors */}
        {activeError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{activeError}</div>
          </div>
        )}
      </div>

      {/* Estado + progresso */}
      {job && (
        <div className="mx-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusPill && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusPill.cls}`}>
                  {statusPill.label}
                </span>
              )}
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                {connected ? (
                  <>
                    <Wifi size={12} className="text-emerald-500" /> ligado
                  </>
                ) : (
                  <>
                    <WifiOff size={12} /> desligado
                  </>
                )}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-700">{progress}%</span>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                status === "error"
                  ? "bg-red-500"
                  : status === "done"
                  ? "bg-emerald-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="mx-2 mt-3 bg-gray-900 rounded-lg p-3 h-44 overflow-y-auto border border-gray-800 shadow-inner">
          {logs.map((msg, i) => (
            <div key={i} className="text-green-400 font-mono text-xs mb-1 whitespace-pre-wrap">
              <span className="text-gray-500 mr-2">{">"}</span>
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Download do backup concluído */}
      {job?.kind === "backup" && status === "done" && job.result && (
        <div className="mx-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
            <span>
              <span className="font-semibold">{job.result.filename}</span> ({job.result.size_mb} MB)
            </span>
          </div>
          <a
            href={downloadUrl(job.result.filename)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <FileDown className="w-4 h-4" /> Descarregar
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 px-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={busy}
          type="button"
        >
          {t("actions.cancel") || "Cancelar"}
        </button>

        {status === "done" || status === "error" ? (
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            type="button"
          >
            Nova operação
          </button>
        ) : (
          <button
            onClick={isRunning ? undefined : handleStart}
            disabled={isRunning || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            type="button"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> A processar…
              </>
            ) : activeTab === "backup" ? (
              <>
                <Download className="w-4 h-4" /> {t("backup.startBackup") || "Fazer Backup"}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> {t("backup.startRestore") || "Fazer Restore"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
