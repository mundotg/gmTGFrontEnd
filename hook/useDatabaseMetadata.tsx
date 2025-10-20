"use client"
import { Dispatch, SetStateAction, useCallback, useEffect,useState } from "react";
import { DatabaseMetadata } from "@/types";
import { fetchSyncMetadata, fetchTables } from "@/app/services/metadata_DB";
import { useSession } from "@/context/SessionContext";

interface UseDatabaseMetadataResult {
  metadata: DatabaseMetadata | null;
  setMetadata: Dispatch<SetStateAction<DatabaseMetadata | null>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<(() => void) | undefined>;
}

export function useDatabaseMetadata(op?: string): UseDatabaseMetadataResult {
  const { user } = useSession();
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initmetadata, setInitmetadata]= useState(false) ;

  const fetchMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    let isCancelled = false;

    try {
      // 1. Busca informações gerais
      const baseMetadata = await fetchSyncMetadata();
      if (isCancelled) return;

      // 2. Busca lista de tabelas
      const tables =op ? [] : await fetchTables();
      if (isCancelled) return;

      const initial: DatabaseMetadata = {
        ...baseMetadata,
        table_names: tables.map((t) => ({ name: t, rowcount: -1 })),
      };
      setMetadata(initial);
    } catch (err: any) {
      if (!isCancelled) {
        setError(err?.message || "Erro inesperado ao buscar metadados");
      }
    } finally {
      setInitmetadata(true)
      if (!isCancelled) {
        setLoading(false);
      }
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // 🔹 Consome SSE para atualizar contagem de linhas das tabelas
  useEffect(() => {
    if (!user || !initmetadata) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}consu/stream/tables/counts`, {withCredentials: true}
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { table: string; count: number };
        // console.log("📨 SSE recebido:", data.table, data.count);

        setMetadata((prev) =>
          prev
            ? {
                ...prev,
                table_names: prev.table_names.map((tbl) =>
                  tbl.name === data.table && tbl.rowcount !== data.count
                    ? { ...tbl, rowcount: data.count }
                    : tbl
                ),
              }
            : prev
        );
      } catch (err) {
        console.error("❌ Erro ao processar SSE:", err);
      }
    };

    eventSource.addEventListener("end", () => {
      // console.log("✅ Stream finalizada.");
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("❌ Erro SSE:", err);
      setError(JSON.stringify(err));
      eventSource.close();
    };

    // cleanup
    return () => {
      if (eventSource) {
        // console.log("♻️ Encerrando SSE");
        eventSource.close();
      }
    };
  }, [user, initmetadata,setMetadata]);

  // 🔹 Busca inicial dos metadados
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!cancel) {
        await fetchMetadata();
      }
    })();

    return () => {
      cancel = true;
    };
  }, [fetchMetadata]);

  return { metadata,setMetadata, loading, error, refresh: fetchMetadata };
}
