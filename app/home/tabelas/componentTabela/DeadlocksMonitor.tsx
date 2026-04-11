"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PauseCircle,
  PlayCircle,
  Info,
  Skull,
  BarChartBig,
  List,
} from "lucide-react";
import { useSSEStream } from "@/hook/useTransferStream";
import { useSession } from "@/context/SessionContext";
import { ActionButton, DeadlockTable, EmptyState, ModalDeadlock } from "./DeadlockUtil";

interface DeadlocksMonitorProps {
  onClose: () => void;
  isDarkMode: boolean;
}

export const DeadlocksMonitor: React.FC<DeadlocksMonitorProps> = ({
  onClose,
  isDarkMode,
}) => {

  const {api} = useSession()
  const { messages, isRunning, startStream, stopStream } = useSSEStream({
    url: "database/deadlocks/monitor/stream",
    params: {},
    autoRetry: false,
  });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewData, setViewData] = useState<any[]>([]);
  // const [selected, setSelected] = useState<any | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    if (!messages.length) return;
    try {
      const json = JSON.parse(messages.at(-1) ?? "{}");
      const row = {
        timestamp: json.timestamp,
        count: json.count,
        items: json.items ?? [],
      };
      dataRef.current.unshift(row);
      if (dataRef.current.length > 200) dataRef.current.pop();
      setViewData([...dataRef.current]);
    } catch { }
  }, [messages]);

  const toggleStream =useCallback( () => (isRunning ? stopStream() : startStream()),[isRunning]);

  const onCloseModal =useCallback(()=>{
    if(isRunning) stopStream() ;
    onClose()
  },[isRunning])
  const empty = !viewData.length || viewData[0]?.count === 0;

  const fetchModalData = async (route: string, modal: string) => {
    setLoadingAction(true);
    setModalType(modal);
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}database/${route}`);
      setModalData(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingAction(false);
  };

  const killProcess = async (pid: number) => {
    if (!confirm(`Deseja matar o processo PID ${pid}?`)) return;
    await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}database/deadlocks/kill/${pid}`);
    alert("Processo encerrado ✅");
  };

  const killAll = async () => {
    if (!confirm("Matar TODOS os bloqueadores?")) return;
    await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}database/deadlocks/kill-all`);
    alert("Processos encerrados ✅");
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  return (
    <div className={`
      space-y-4 p-4 sm:p-6 rounded-xl
      ${isDarkMode
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900'}
      shadow-xl
    `}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3 flex-wrap">
          Deadlocks Monitor
          <span className={`
            text-xs font-semibold px-3 py-1 rounded-full
            ${isRunning
              ? 'bg-green-500 text-white'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-300 text-gray-700'}
            shadow-sm
          `}>
            {isRunning ? "● Ativo" : "○ Pausado"}
          </span>
        </h3>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleStream}
            className={`
              px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm
              transition-all shadow-sm hover:shadow-md
              ${isRunning
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'}
              focus:outline-none focus:ring-2 focus:ring-offset-2
            `}
          >
            {isRunning ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            <span>{isRunning ? "Pausar" : "Iniciar"}</span>
          </button>

          <button
            onClick={onCloseModal}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              transition-all shadow-sm hover:shadow-md
              ${isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'}
              focus:outline-none focus:ring-2 focus:ring-offset-2
            `}
          >
            Fechar
          </button>
        </div>
      </div>

      {/* BOTÕES AÇÕES */}
      <div className="flex flex-wrap gap-2">
        <ActionButton
          icon={<List className="w-4 h-4" />}
          text="Detalhes"
          action={() => fetchModalData("deadlocks", "detalhes")}
        />
        <ActionButton
          icon={<BarChartBig className="w-4 h-4" />}
          text="Estatísticas"
          action={() => fetchModalData("deadlocks/stats", "stats")}
        />
        <ActionButton
          icon={<Info className="w-4 h-4" />}
          text="Histórico"
          action={() => fetchModalData("deadlocks/history", "history")}
        />
        <ActionButton
          icon={<Skull className="w-4 h-4" />}
          text="Kill ALL"
          action={killAll}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white"
        />
      </div>

      {/* LISTAGEM */}
      {empty ? (
        <EmptyState isDarkMode={isDarkMode} />
      ) : (
        <DeadlockTable
          viewData={viewData}
          isDarkMode={isDarkMode}
          killProcess={killProcess}
        />
      )}

      {/* MODAL */}
      {modalType && (
        <ModalDeadlock
          type={modalType}
          data={modalData}
          loading={loadingAction}
          onClose={closeModal}
        />
      )}
    </div>
  );
};