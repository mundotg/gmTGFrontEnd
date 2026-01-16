"use client";
import { useSSEStream } from "@/hook/useTransferStream";
import { Download, Loader2, Upload } from "lucide-react";
import { useState, useRef, useMemo } from "react";

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
  const [database, setDatabase] = useState("");
  const [backupType, setBackupType] = useState("full");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"backup" | "restore">("backup");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Usa o hook SSE genérico
  const { messages : messagesRestore1, startStream, stopStream, isRunning } = useSSEStream({
    url: `database/stream/${connectionId}`,
    autoStart: false,
    autoRetry: true,
    retryDelay: 2000,
  });

  const { messages: messagesRestore2, startStream: startRestore} = useSSEStream({
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
    if (!database.trim()){
        stopStream();
        return
    };
    if (activeTab === "backup") {
      startStream()
    } else if (backupFile) {
      await startRestore()
    }
  };

  return (
    <div className="space-y-5 p-4 rounded-xl border bg-white shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["backup", "restore"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-500"
            }`}
          >
            {tab === "backup" ? (
              <Download className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {tab === "backup" ? "Backup" : "Restore"}
          </button>
        ))}
      </div>

      {/* Formulário principal */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Base de Dados
          </label>
          <input
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="Nome da base de dados"
          />
        </div>

        {activeTab === "backup" && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tipo de Backup
            </label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="full">Completo</option>
              <option value="schema">Apenas Schema</option>
              <option value="data">Apenas Dados</option>
            </select>
          </div>
        )}

        {activeTab === "restore" && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Arquivo de Backup
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.backup,.dump"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          disabled={loading || isRunning}
        >
          Cancelar
        </button>

        <button
          onClick={handleAction}
          disabled={
            loading ||
            !database.trim() ||
            (activeTab === "restore" && !backupFile) ||
            isRunning
          }
          className="px-4 py-2 bg-orange-500 text-white rounded-md flex items-center gap-2 disabled:opacity-50 hover:bg-orange-600 transition-colors"
        >
          {(loading || isRunning) && <Loader2 className="w-4 h-4 animate-spin" />}
          {activeTab === "backup" ? "Fazer Backup" : "Fazer Restore"}
        </button>
      </div>

      {/* Logs em tempo real */}
      {messages.length > 0 && (
        <div className="mt-4 bg-gray-50 border rounded-md p-3 h-48 overflow-y-auto text-sm font-mono">
          {messages.map((msg, i) => (
            <div key={i} className="text-gray-700 whitespace-pre-wrap">
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
