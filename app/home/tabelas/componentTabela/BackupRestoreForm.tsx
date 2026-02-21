"use client";
import { useSSEStream } from "@/hook/useTransferStream";
import { Download, Loader2, Upload } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { useI18n } from "@/context/I18nContext";

interface BackupRestoreFormProps {
  /** Ação de cancelamento */
  onCancel: () => void;
  /** Estado de carregamento externo */
  loading?: boolean;
  /** Identificador de conexão (para o stream SSE) */
  connectionId: string;
}

export const BackupRestoreForm: React.FC<BackupRestoreFormProps> = ({
  onCancel,
  loading,
  connectionId,
}) => {
  const { t } = useI18n();
  const [database, setDatabase] = useState("");
  const [backupType, setBackupType] = useState("full");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"backup" | "restore">("backup");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Usa o hook SSE genérico
  const { messages: messagesRestore1, startStream, stopStream, isRunning } = useSSEStream({
    url: `database/stream/${connectionId}`,
    autoStart: false,
    autoRetry: true,
    retryDelay: 2000,
  });

  const { messages: messagesRestore2, startStream: startRestore } = useSSEStream({
    url: `/database/${connectionId}/stream`,
    autoStart: false,
    autoRetry: true,
    retryDelay: 2000,
  });

  const messages = useMemo(() => {
    return activeTab === "backup" ? messagesRestore1 : messagesRestore2;
  }, [activeTab, messagesRestore1, messagesRestore2]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBackupFile(file);
  };

  const handleAction = async () => {
    if (!database.trim()) {
      stopStream();
      return;
    }
    if (activeTab === "backup") {
      startStream();
    } else if (backupFile) {
      await startRestore();
    }
  };

  return (
    <div className="space-y-5 p-1 bg-white dark:bg-[#1C1C1E] rounded-xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(["backup", "restore"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700"
            }`}
          >
            {tab === "backup" ? (
              <Download className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {tab === "backup" ? (t("backup.backupTab") || "Backup") : (t("backup.restoreTab") || "Restore")}
          </button>
        ))}
      </div>

      {/* Formulário principal */}
      <div className="space-y-4 px-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t("backup.databaseLabel") || "Base de Dados"}
          </label>
          <input
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            placeholder={t("backup.databasePlaceholder") || "Nome da base de dados"}
          />
        </div>

        {activeTab === "backup" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("backup.typeLabel") || "Tipo de Backup"}
            </label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            >
              <option value="full">{t("backup.typeFull") || "Completo"}</option>
              <option value="schema">{t("backup.typeSchema") || "Apenas Schema"}</option>
              <option value="data">{t("backup.typeData") || "Apenas Dados"}</option>
            </select>
          </div>
        )}

        {activeTab === "restore" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("backup.fileLabel") || "Arquivo de Backup"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.backup,.dump"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        )}
      </div>

      {/* Logs em tempo real */}
      {messages.length > 0 && (
        <div className="mx-2 mt-4 bg-gray-900 rounded-lg p-3 h-48 overflow-y-auto border border-gray-800 shadow-inner">
          {messages.map((msg, i) => (
            <div key={i} className="text-green-400 font-mono text-xs mb-1 whitespace-pre-wrap">
              <span className="text-gray-500 mr-2">{'>'}</span>{msg}
            </div>
          ))}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-800 px-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          disabled={loading || isRunning}
        >
          {t("actions.cancel") || "Cancelar"}
        </button>

        <button
          onClick={handleAction}
          disabled={
            loading ||
            !database.trim() ||
            (activeTab === "restore" && !backupFile) ||
            isRunning
          }
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {(loading || isRunning) && <Loader2 className="w-4 h-4 animate-spin" />}
          {activeTab === "backup" 
            ? (t("backup.startBackup") || "Fazer Backup") 
            : (t("backup.startRestore") || "Fazer Restore")}
        </button>
      </div>
    </div>
  );
};