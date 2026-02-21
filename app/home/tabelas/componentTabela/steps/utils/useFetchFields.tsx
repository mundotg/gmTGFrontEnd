import { useEffect, useMemo, useRef } from "react";
import type { TableMapping } from "@/app/task/types/transfer-types";
import api from "@/context/axioCuston";
import type { DBConnection, DBField, DBStructure } from "@/types/db-structure";
import type { ResponseWrapper } from "@/app/services/metadata_DB";

type FieldsByTableName = Record<string, DBField[]>;
const norm = (s: string) => (s ?? "").trim().toLowerCase();

/** Merge aditivo: nunca remove fields existentes */
function mergeStructuresWithIncomingFields(
  prevStructures: DBStructure[] | undefined,
  incoming: FieldsByTableName | null | undefined
): DBStructure[] | undefined {
  if (!prevStructures?.length) return prevStructures;
  if (!incoming) return prevStructures;

  // Normaliza keys do incoming por nome
  const incomingNorm: FieldsByTableName = {};
  for (const [k, v] of Object.entries(incoming)) {
    incomingNorm[norm(k)] = Array.isArray(v) ? v : [];
  }

  return prevStructures.map((table) => {
    const incomingFields = incomingNorm[norm(table.table_name)];
    if (!incomingFields?.length) return table; // ✅ mantém 100%

    const existingFields = (table.fields ?? []) as DBField[];

    // index por id e por nome (para casar mesmo se id mudar)
    const byId = new Map<string, DBField>();
    const idByName = new Map<string, string>(); // nameNorm -> idKey

    for (const f of existingFields) {
      const idKey = String(f.id);
      byId.set(idKey, f);
      idByName.set(norm(f.name), idKey);
    }

    for (const nf of incomingFields) {
      const idKey = String(nf.id);
      const nameKey = norm(nf.name);

      const existingIdByName = idByName.get(nameKey);
      const base =
        byId.get(idKey) ||
        (existingIdByName ? byId.get(existingIdByName) : undefined);

      // ✅ preserva propriedades antigas + atualiza com o novo
      const merged: DBField = { ...(base ?? ({} as DBField)), ...nf };

      byId.set(idKey, merged);
      idByName.set(nameKey, idKey);
    }

    return { ...table, fields: Array.from(byId.values()) };
  });
}

function applyIncomingFieldsToConnection(
  prev: DBConnection | undefined,
  incoming: FieldsByTableName | null | undefined
): DBConnection | undefined {
  if (!prev) return prev;
  if (!incoming) return prev;

  // ✅ Se ainda não tem structures, não mexe (não "zera" nada)
  if (!prev.structures?.length) return prev;

  const merged = mergeStructuresWithIncomingFields(prev.structures, incoming);
  if (!merged) return prev;

  return { ...prev, structures: merged };
}

function createSkeletonMapping(srcTable: DBStructure, tgtTable?: DBStructure): TableMapping {
  return {
    tabela_name_origem: srcTable.table_name,
    tabela_name_destino: tgtTable?.table_name || srcTable.table_name,
    id_tabela_origen: srcTable.id,
    id_tabela_destino: tgtTable?.id || 0,
    colunas_relacionados_para_transacao: [],
  };
}

function makeToken() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useFetchColumns({
  selectedTables,
  sourceConnection,
  targetConnection,
  setSourceConnection,
  setTargetConnection,
  tableMappings,
  onTableMappingsChange,
  setIsLoading,
}: {
  selectedTables: Record<string, string>; // ✅ { sourceTableId: targetTableId }
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  tableMappings: Record<string, TableMapping>;
  onTableMappingsChange?: (mappings: Record<string, TableMapping>) => void;
  setSourceConnection: React.Dispatch<React.SetStateAction<DBConnection | undefined>>;
  setTargetConnection: React.Dispatch<React.SetStateAction<DBConnection | undefined>>;
  setIsLoading: (loading: boolean) => void;
}) {
  const doneRef = useRef(new Set<string>());
  const inFlightRef = useRef(new Set<string>());
  const latestTokenRef = useRef<{ src?: string; tgt?: string }>({});

  const srcConnId = sourceConnection?.id;
  const tgtConnId = targetConnection?.id;

  // ✅ índices estáveis: id -> struct (sem find repetido)
  const srcById = useMemo(() => {
    const m = new Map<string, DBStructure>();
    for (const t of sourceConnection?.structures ?? []) m.set(String(t.id), t);
    return m;
  }, [sourceConnection?.structures]);

  const tgtById = useMemo(() => {
    const m = new Map<string, DBStructure>();
    for (const t of targetConnection?.structures ?? []) m.set(String(t.id), t);
    return m;
  }, [targetConnection?.structures]);

  const srcStructuresLen = sourceConnection?.structures?.length ?? 0;
  const tgtStructuresLen = targetConnection?.structures?.length ?? 0;

  // ✅ calcula work só por IDs (estável) e gera table_names só para API
  const work = useMemo(() => {
    const srcNames: string[] = [];
    const tgtNames: string[] = [];

    if (!srcConnId && !tgtConnId) return { src: [], tgt: [], hasWork: false };

    for (const [srcId, tgtId] of Object.entries(selectedTables ?? {})) {
      const sTab = srcById.get(String(srcId));
      const tTab = tgtById.get(String(tgtId));

      if (srcConnId && sTab) {
        const key = `src:${srcConnId}:${norm(sTab.table_name)}`;
        if (!doneRef.current.has(key) && !inFlightRef.current.has(key)) {
          srcNames.push(sTab.table_name);
        }
      }

      if (tgtConnId && tTab) {
        const key = `tgt:${tgtConnId}:${norm(tTab.table_name)}`;
        if (!doneRef.current.has(key) && !inFlightRef.current.has(key)) {
          tgtNames.push(tTab.table_name);
        }
      }
    }

    const src = Array.from(new Set(srcNames));
    const tgt = Array.from(new Set(tgtNames));
    return { src, tgt, hasWork: src.length > 0 || tgt.length > 0 };
  }, [selectedTables, srcConnId, tgtConnId, srcById, tgtById]);

  // ---------------- Fetch ----------------
  useEffect(() => {
    if (!work.hasWork) return;

    const controller = new AbortController();
    setIsLoading(true);

    const srcKeys = (srcConnId ? work.src : []).map((n) => `src:${srcConnId}:${norm(n)}`);
    const tgtKeys = (tgtConnId ? work.tgt : []).map((n) => `tgt:${tgtConnId}:${norm(n)}`);

    srcKeys.forEach((k) => inFlightRef.current.add(k));
    tgtKeys.forEach((k) => inFlightRef.current.add(k));

    const srcToken = work.src.length ? makeToken() : undefined;
    const tgtToken = work.tgt.length ? makeToken() : undefined;
    if (srcToken) latestTokenRef.current.src = srcToken;
    if (tgtToken) latestTokenRef.current.tgt = tgtToken;

    (async () => {
      let ok = false;
      try {
        const [srcRes, tgtRes] = await Promise.all([
          srcConnId && work.src.length
            ? api.post<ResponseWrapper<FieldsByTableName>>(
                `/consu/fields/${srcConnId}`,
                { table_names: work.src },
                { signal: controller.signal, timeout: 20000 }
              )
            : Promise.resolve(null),
          tgtConnId && work.tgt.length
            ? api.post<ResponseWrapper<FieldsByTableName>>(
                `/consu/fields/${tgtConnId}`,
                { table_names: work.tgt },
                { signal: controller.signal, timeout: 20000 }
              )
            : Promise.resolve(null),
        ]);

        const srcData = srcRes?.data?.data ?? null;
        const tgtData = tgtRes?.data?.data ?? null;

        // ✅ ignora resposta velha
        if (srcToken && latestTokenRef.current.src !== srcToken) return;
        if (tgtToken && latestTokenRef.current.tgt !== tgtToken) return;

        // ✅ aplica SEM apagar
        if (srcData) setSourceConnection((prev) => applyIncomingFieldsToConnection(prev, srcData));
        if (tgtData) setTargetConnection((prev) => applyIncomingFieldsToConnection(prev, tgtData));

        ok = true;

        // ✅ marca done só do que foi pedido
        srcKeys.forEach((k) => doneRef.current.add(k));
        tgtKeys.forEach((k) => doneRef.current.add(k));
      } catch (err: { name?: string; code?: string; message?: string } | unknown) {
        if (err && typeof err === "object" ) return;

        // ✅ se falhar, libera para retry
        srcKeys.forEach((k) => doneRef.current.delete(k));
        tgtKeys.forEach((k) => doneRef.current.delete(k));

        console.error("[useFetchColumns] erro:", err);
      } finally {
        setIsLoading(false);
        srcKeys.forEach((k) => inFlightRef.current.delete(k));
        tgtKeys.forEach((k) => inFlightRef.current.delete(k));

        // ✅ StrictMode aborta e re-monta: se não ok, remove inflight já foi feito; done não foi setado
        if (!ok) {
          // nada adicional aqui — já fica pronto para retry
        }
      }
    })();

    return () => {
      controller.abort();
      srcKeys.forEach((k) => inFlightRef.current.delete(k));
      tgtKeys.forEach((k) => inFlightRef.current.delete(k));
    };
  }, [work, srcConnId, tgtConnId, setIsLoading, setSourceConnection, setTargetConnection]);

  // ---------------- Skeleton Mapping ----------------
  useEffect(() => {
    if (!onTableMappingsChange) return;
    if (!srcConnId || !srcStructuresLen) return;

    const next = { ...tableMappings };
    let changed = false;

    for (const [srcId, tgtId] of Object.entries(selectedTables ?? {})) {
      if (next[srcId]) continue;

      const srcTable = srcById.get(String(srcId));
      const tgtTable = tgtById.get(String(tgtId));

      if (srcTable) {
        next[srcId] = createSkeletonMapping(srcTable, tgtTable);
        changed = true;
      }
    }

    if (changed) onTableMappingsChange(next);
  }, [
    selectedTables,
    srcConnId,
    srcStructuresLen,
    tgtStructuresLen,
    tableMappings,
    onTableMappingsChange,
    srcById,
    tgtById,
  ]);
}