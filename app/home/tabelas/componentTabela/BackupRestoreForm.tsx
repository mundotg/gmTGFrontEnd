"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileArchive,
  FileDown,
  Info,
  Loader2,
  Upload,
  UploadCloud,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { DBConnection } from "@/app/task/types";
import { usePaginatedFetcher } from "../../hooks/useDBConnections";
import { JoinSelect } from "@/app/task/components/select_Component";
import { useBackupJob, BackupJob } from "@/hook/useBackupJob";

interface BackupRestoreFormProps {
  onCancel: () => void;
  loading?: boolean;
  connectionId: string;
}

type Tab = "backup" | "restore";

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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

const STATUS_STYLE: Record<BackupJob["status"], string> = {
  queued: "bg-amber-50 text-amber-700 border-amber-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_KEY: Record<BackupJob["status"], string> = {
  queued: "backup.statusQueued",
  running: "backup.statusRunning",
  done: "backup.statusDone",
  error: "backup.statusError",
};

export const BackupRestoreForm: React.FC<BackupRestoreFormProps> = ({
  onCancel,
  loading,
  connectionId,
}) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<Tab>("backup");

  const [backupConnId, setBackupConnId] = useState<string>(connectionId || "");
  const [restoreConnId, setRestoreConnId] = useState<string>(connectionId || "");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const [uiError, setUiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const jobPanelRef = useRef<HTMLDivElement>(null);

  const { job, connected, error: jobError, isRunning, startBackup, startRestore, downloadUrl, reset } =
    useBackupJob();

  const { fetchPaginated, loading: loadingConnections } = usePaginatedFetcher<DBConnection>(
    (row) => ({ value: String(row.id), label: `${getDatabaseIcon(row.type)} ${row.name}` })
  );

  const effectiveBackupConnId = (backupConnId || connectionId || "").trim();
  const effectiveRestoreConnId = (restoreConnId || connectionId || "").trim();

  const logs = job?.logs ?? [];
  const lastLog = logs[logs.length - 1];
  const progress = job?.progress ?? 0;
  const status = job?.status;
  const finished = status === "done" || status === "error";
  const activeError = uiError || jobError || job?.error || null;

  const busy = loading || isRunning;
  // Os campos só voltam a ficar editáveis com "Nova operação": assim o
  // resultado que está no ecrã corresponde sempre ao que está nos campos.
  const locked = isRunning || finished;

  const formats = ACCEPT_EXT.join(", ");
  // Limite em unidades "redondas" (5000 MB → "5 GB", não "4.9 GB").
  const maxSize = MAX_FILE_MB >= 1000 ? `${MAX_FILE_MB / 1000} GB` : `${MAX_FILE_MB} MB`;

  // Mantém o painel de logs sempre a mostrar a linha mais recente.
  useEffect(() => {
    const el = logsContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length, showLogs]);

  // Ao arrancar e ao terminar, traz o progresso/resultado para a vista: em
  // ecrãs pequenos fica abaixo do formulário e passaria despercebido.
  useEffect(() => {
    if (status) jobPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [status]);

  // Num erro, os detalhes são o que explica o que falhou: abre-os.
  useEffect(() => {
    if (status === "error" && logs.length > 0) setShowLogs(true);
  }, [status, logs.length]);

  const clearFile = () => {
    setBackupFile(null);
    setRestoreConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectFile = (file: File | null) => {
    setUiError(null);
    if (!file) {
      clearFile();
      return;
    }
    if (!fileHasAllowedExt(file)) {
      clearFile();
      setUiError(t("backup.errExtension", { formats }));
      return;
    }
    if (!fileSizeOk(file)) {
      clearFile();
      setUiError(t("backup.errSize", { max: maxSize }));
      return;
    }
    setBackupFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (locked) return;
    selectFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleStart = async () => {
    setUiError(null);
    setShowLogs(false);
    if (activeTab === "backup") {
      if (!effectiveBackupConnId || !isValidConnId(effectiveBackupConnId)) {
        setUiError(t("backup.errConnectionBackup"));
        return;
      }
      await startBackup(Number(effectiveBackupConnId), true);
    } else {
      if (!effectiveRestoreConnId || !isValidConnId(effectiveRestoreConnId)) {
        setUiError(t("backup.errConnectionRestore"));
        return;
      }
      if (!backupFile) {
        setUiError(t("backup.errFile"));
        return;
      }
      if (!restoreConfirmed) {
        setUiError(t("backup.errConfirm"));
        return;
      }
      await startRestore(Number(effectiveRestoreConnId), backupFile);
    }
  };

  /** Depois de um erro: volta ao formulário com tudo o que estava preenchido. */
  const retry = () => {
    reset();
    setUiError(null);
    setShowLogs(false);
  };

  const newOperation = () => {
    retry();
    clearFile();
  };

  const switchTab = (tab: Tab) => {
    if (isRunning || tab === activeTab) return;
    setActiveTab(tab);
    // Evita arrastar um ficheiro selecionado para uma nova operação.
    newOperation();
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "backup", icon: <Download className="w-4 h-4" />, label: t("backup.backupTab") },
    { id: "restore", icon: <Upload className="w-4 h-4" />, label: t("backup.restoreTab") },
  ];

  return (
    <div className="flex flex-col gap-5" aria-busy={busy}>
      {/* Separadores — controlo segmentado, alvo de toque ≥ 44px */}
      <div>
        <div role="tablist" aria-label={t("backup.operation")} className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`backup-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="backup-tab-panel"
                onClick={() => switchTab(tab.id)}
                disabled={isRunning && !selected}
                title={isRunning && !selected ? t("backup.switchLocked") : undefined}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {activeTab === "backup" ? t("backup.descriptionBackup") : t("backup.descriptionRestore")}
        </p>
      </div>

      <div
        id="backup-tab-panel"
        role="tabpanel"
        aria-labelledby={`backup-tab-${activeTab}`}
        className="flex flex-col gap-4"
      >
        {/* Conexão */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-800">
            {t("backup.connectionLabel")}
          </label>
          <JoinSelect
            value={String((activeTab === "backup" ? backupConnId : restoreConnId) || "")}
            onChange={(value) => {
              setUiError(null);
              if (activeTab === "backup") setBackupConnId(String(value || ""));
              else setRestoreConnId(String(value || ""));
            }}
            fetchOptions={loadingConnections ? undefined : fetchPaginated}
            placeholder={t("backup.connectionPlaceholder")}
            disabled={locked}
            className="w-full"
            buttonClassName="w-full min-h-[44px] border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {activeTab === "backup" && (
          <p className="flex gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span>{t("backup.supportNote")}</span>
          </p>
        )}

        {activeTab === "restore" && (
          <>
            {/* Ficheiro — arrastar e largar ou escolher */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-800">
                {t("backup.fileLabel")}
              </span>

              {backupFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <FileArchive className="h-8 w-8 shrink-0 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900" title={backupFile.name}>
                      {backupFile.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(backupFile.size)}</p>
                  </div>
                  {!locked && (
                    <button
                      type="button"
                      onClick={clearFile}
                      aria-label={t("backup.removeFile")}
                      title={t("backup.removeFile")}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="backup-file-input"
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!locked) setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <UploadCloud className={`h-8 w-8 ${dragActive ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="text-sm text-gray-700">
                    <span className="hidden sm:inline">{t("backup.dropHere")} </span>
                    <span className="font-semibold text-blue-600">{t("backup.chooseFile")}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {t("backup.acceptedFormats", { formats, max: maxSize })}
                  </span>
                </label>
              )}

              <input
                id="backup-file-input"
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_EXT.join(",")}
                onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
                disabled={locked}
                className="sr-only"
              />
            </div>

            {/* Aviso + confirmação: o restauro escreve por cima dos dados */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{t("backup.restoreWarning")}</span>
              </p>
              <label className="mt-2.5 flex cursor-pointer items-start gap-2.5 pl-6">
                <input
                  type="checkbox"
                  checked={restoreConfirmed}
                  onChange={(e) => {
                    setRestoreConfirmed(e.target.checked);
                    setUiError(null);
                  }}
                  disabled={locked}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium">{t("backup.restoreConfirm")}</span>
              </label>
            </div>
          </>
        )}

        {activeError && (
          <div
            role="alert"
            className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 break-words">{activeError}</div>
          </div>
        )}
      </div>

      {/* Estado + progresso */}
      {job && (
        <div ref={jobPanelRef} className="scroll-mb-24 rounded-xl border border-gray-200 p-3 sm:p-4" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {status && (
                <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
                  {t(STATUS_KEY[status])}
                </span>
              )}
              {isRunning && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {connected ? (
                    <>
                      <Wifi size={12} className="text-emerald-500" /> {t("backup.live")}
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} /> {t("backup.offline")}
                    </>
                  )}
                </span>
              )}
            </div>
            <span className="text-sm font-bold tabular-nums text-gray-800">{progress}%</span>
          </div>

          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full transition-all duration-500 ${
                status === "error" ? "bg-red-500" : status === "done" ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Passo atual, sem ter de abrir os detalhes */}
          {lastLog && !showLogs && (
            <p className="mt-2 truncate font-mono text-xs text-gray-500" title={lastLog}>
              {lastLog}
            </p>
          )}

          {isRunning && <p className="mt-2 text-xs text-gray-500">{t("backup.keepOpen")}</p>}

          {logs.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowLogs((v) => !v)}
                aria-expanded={showLogs}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLogs ? "rotate-180" : ""}`} />
                {showLogs ? t("backup.hideDetails") : t("backup.showDetails", { count: logs.length })}
              </button>
              {showLogs && (
                <div
                  ref={logsContainerRef}
                  className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-3 shadow-inner sm:max-h-56"
                >
                  {logs.map((msg, i) => (
                    <div key={i} className="mb-1 whitespace-pre-wrap break-words font-mono text-xs text-green-400">
                      <span className="mr-2 text-gray-500">{">"}</span>
                      {msg}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Resultado */}
      {status === "done" && job?.kind === "backup" && job.result && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-start gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">{t("backup.doneBackup")}</p>
              <p className="truncate text-emerald-700" title={job.result.filename}>
                {job.result.filename} · {job.result.size_mb} MB
              </p>
            </div>
          </div>
          <a
            href={downloadUrl(job.result.filename)}
            download={job.result.filename}
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <FileDown className="h-4 w-4" /> {t("backup.download")}
          </a>
        </div>
      )}

      {status === "done" && job?.kind === "restore" && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 sm:p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          {t("backup.doneRestore")}
        </div>
      )}

      {/* Ações — empilhadas e a toda a largura em telemóvel */}
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
        <button
          onClick={onCancel}
          disabled={busy}
          type="button"
          className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {finished ? t("backup.close") : t("actions.cancel")}
        </button>

        {finished ? (
          <button
            onClick={status === "error" ? retry : newOperation}
            type="button"
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {status === "error" ? t("backup.tryAgain") : t("backup.newOperation")}
          </button>
        ) : (
          <button
            onClick={isRunning ? undefined : handleStart}
            disabled={isRunning || loading}
            type="button"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("backup.processing")}
              </>
            ) : activeTab === "backup" ? (
              <>
                <Download className="h-4 w-4" /> {t("backup.startBackup")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> {t("backup.startRestore")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
