"use client"
import { Dispatch, SetStateAction, useCallback, useEffect,useState } from "react";
import { DatabaseMetadata } from "@/types";
import { fetchSyncMetadata, fetchTables } from "@/app/services/metadata_DB";
import { useSession } from "@/context/SessionContext";

import { parseErrorMessage } from "@/util/func";

interface UseDatabaseMetadataResult {
  metadata: DatabaseMetadata | null;
  setMetadata: Dispatch<SetStateAction<DatabaseMetadata | null>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
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

    try {
      // ⚠️ A lista de tabelas e as estatísticas de sync são INDEPENDENTES.
      // Antes vinham em série (`await fetchSyncMetadata()` e só depois
      // `fetchTables()`); se o `/consu/sync` devolvesse `data: null` (o
      // `fetchSyncMetadata` lança nesse caso), o `fetchTables` nunca chegava a
      // correr e a página ficava SEM tabelas. Agora correm em paralelo e uma
      // falha do sync não impede a listagem das tabelas.
      const [baseResult, tablesResult] = await Promise.allSettled([
        fetchSyncMetadata(),
        op ? Promise.resolve<string[]>([]) : fetchTables(),
      ]);

      const base = baseResult.status === "fulfilled" ? baseResult.value : null;
      const tables = tablesResult.status === "fulfilled" ? tablesResult.value : [];

      // Só é erro "duro" se AMBOS falharem (nada para mostrar).
      if (!base && tablesResult.status === "rejected") {
        const reason =
          (tablesResult.status === "rejected" && tablesResult.reason) ||
          (baseResult.status === "rejected" && baseResult.reason);
        setError(parseErrorMessage(reason));
        return;
      }

      if (tablesResult.status === "rejected") {
        setError(parseErrorMessage(tablesResult.reason));
      } else if (baseResult.status === "rejected") {
        console.warn("⚠️ /consu/sync falhou (estatísticas ignoradas):", baseResult.reason?.message);
      }

      setMetadata({
        ...(base ?? {}),
        table_names: tables.map((t) => ({ name: t, rowcount: -1 })),
      } as DatabaseMetadata);
    } catch (err: any) {
      setError(parseErrorMessage(err));
    } finally {
      setInitmetadata(true);
      setLoading(false);
    }
  }, [op]);

  // 🔹 Consome SSE para atualizar contagem de linhas das tabelas
  useEffect(() => {
    console.info("aviso no ficheiro useDatabaseMetadata desabilitei a contagem de registro das tabelas por erros linha 59")
    const cancel = true
    if (!user || !initmetadata || cancel) return;

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
      // setError(JSON.stringify(err));
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
