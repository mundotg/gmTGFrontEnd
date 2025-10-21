/**
 * Hook React para usar o cliente SSE de queries
 * Preparado para receber eventos do backend
 */
"use client";

import { QueryCountResultType, QueryPayload, QueryResultType } from "@/types";
import { useState, useCallback, useRef, useEffect } from "react";
import { QuerySSEClient, SSEState } from "./queryExecuteUse";
import { parseErrorMessage } from "@/util/func";
import usePersistedState from "./localStoreUse";

export interface UseQuerySSEReturn {
  executeQuery: (query: QueryPayload) => Promise<void>;
  cancelQuery: () => void;
  executingQuery: boolean;
  setQueryResults: React.Dispatch<React.SetStateAction<QueryResultType | null>>;
  queryResults: QueryResultType | null;
  totalResults: number | null;
  error: string | null;
  progress: string;
  sseState: SSEState;
  isConnected: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isIdle: boolean;
  hasError: boolean;
}

export const useQuerySSE = (): UseQuerySSEReturn => {
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryResults, setQueryResults] = usePersistedState<QueryResultType | null>(
    "consu_QueryResultType",
    null
  );
  const [totalResults, setTotalResults] = usePersistedState<number | null>(
    "consu_QueryResultType_count",
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [sseState, setSSEState] = useState<SSEState>(SSEState.IDLE);
  const [queryPayload, setQueryPayload] = useState<QueryPayload | null>(null);

  const sseClientRef = useRef<QuerySSEClient | null>(null);

  // --- Handlers de eventos vindos do backend ---
  const handleStateChange = useCallback((state: SSEState) => {
    setSSEState(state);
    setExecutingQuery(
      [SSEState.CONNECTING, SSEState.CONNECTED, SSEState.PROCESSING].includes(
        state
      )
    );

    if (state === SSEState.IDLE) {
      setProgress("");
    } else if (state === SSEState.COMPLETED) {
      setProgress("✅ Query finalizada com sucesso");
    } else if (state === SSEState.ERROR) {
      setProgress("❌ Erro durante a execução");
    }
  }, []);

const handleData = useCallback((data: QueryResultType) => {
  // Backend envia "event: data"
  // console.log(data)
  setQueryResults((prev) => {
    if (!prev) return data;
    // console.log("prev.tabela_coluna: ",prev.tabela_coluna)
    return {
      ...prev,
      ...data,
      tabela_coluna: prev.tabela_coluna, 
    };
  });
  setError(null);
}, []);

  const handleCount = useCallback((count: QueryCountResultType) => {
    // Backend envia "event: count"
    setTotalResults(count.count);
    setQueryResults((prev) => {
      if (!prev) return prev;
      return { ...prev, totalResults: count.count };
    });
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    // Backend envia "event: error"
    setError(parseErrorMessage(errorMessage));
    setExecutingQuery(false);
    setSSEState(SSEState.ERROR);
    console.error("🚨 Erro na query:", errorMessage);
  }, []);

  const handleProgress = useCallback(
    (status: string) => {
      // Backend envia "event: status" e "event: info"
      if (status === "Query executada com sucesso!" && queryPayload) {
        setQueryResults((prev) =>
          prev ? { ...prev, queryPayload } : prev
        );
      }
      setProgress(status);
    },
    [setQueryResults, queryPayload]
  );

  // --- Executa query via SSE ---
  const executeQuery = useCallback(
    async (query: QueryPayload) => {
      try {
        if (!query) throw new Error("Query payload é obrigatório");
        setQueryPayload(query);
        setQueryResults({
          success: false,
          query: "", // or query.sql if available
          params: {},
          duration_ms: 0,
          columns: [],
          preview: [],
          totalResults: 0,
          tabela_coluna: {},
          QueryPayload: query,

        });
        setTotalResults(null);
        setError(null);
        setProgress("Preparando execução...");

        if (sseClientRef.current) {
          sseClientRef.current.close("new_query");
        }

        const client = new QuerySSEClient(
          handleStateChange,
          handleData,
          handleCount,
          handleError,
          handleProgress
        );

        sseClientRef.current = client;

        await client.executeQuery(query);
      } catch (err: any) {
        setError(err.message || "Erro ao executar query");
        setExecutingQuery(false);
        setSSEState(SSEState.ERROR);
      }
    },
    [handleStateChange, handleData, handleCount, handleError, handleProgress]
  );

  // --- Cancela execução ---
  const cancelQuery = useCallback(() => {
    if (sseClientRef.current && sseClientRef.current.isActive()) {
      sseClientRef.current.close("cancelled");
      setExecutingQuery(false);
      setProgress("Query cancelada pelo usuário ⛔");
      setSSEState(SSEState.IDLE);
    }
  }, []);

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      if (sseClientRef.current) {
        sseClientRef.current.close("component_unmount");
      }
    };
  }, []);

  // Estados derivados
  const isConnected = sseState === SSEState.CONNECTED;
  const isProcessing = sseState === SSEState.PROCESSING;
  const isCompleted = sseState === SSEState.COMPLETED;
  const isIdle = sseState === SSEState.IDLE;
  const hasError = sseState === SSEState.ERROR || error !== null;

  return {
    setQueryResults,
    executeQuery,
    cancelQuery,
    executingQuery,
    queryResults,
    totalResults,
    error,
    progress,
    sseState,
    isConnected,
    isProcessing,
    isCompleted,
    isIdle,
    hasError,
  };
};
