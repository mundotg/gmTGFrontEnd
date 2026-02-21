"use client";
import { useState, useMemo, Dispatch, SetStateAction, useEffect, useRef, useCallback } from "react";
import { Table, CheckCircle2, Database } from "lucide-react";
import type { DBConnection, DBStructure } from "@/types/db-structure";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";
import { Step2QueryTables } from "../transacao_query_component";
import api from "@/context/axioCuston";
import type { ResponseWrapper } from "@/app/services/metadata_DB";

interface Step2TablesProps {
  sourceConnection?: DBConnection;
  setSourceConnection: Dispatch<SetStateAction<DBConnection | undefined>>;
  setTargetConnection: Dispatch<SetStateAction<DBConnection | undefined>>;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>; // { sourceTableId: targetTableId }
  setSelectedTables: Dispatch<SetStateAction<Record<string, string>>>;
  onSelectAll: (all: Record<string, string>) => void;
  onClearSelection: () => void;
}

function safeArray<T>(v: unknown): T[] | null {
  return Array.isArray(v) ? (v as T[]) : null;
}

export const Step2Tables: React.FC<Step2TablesProps> = ({
  setSourceConnection,
  setTargetConnection,
  sourceConnection,
  targetConnection,
  selectedTables,
  setSelectedTables,
  onSelectAll,
  onClearSelection,
}) => {
  const [searchTable, setSearchTable] = useState("");
  const [optionsTarget, setOptionsTarget] = useState(false);

  // --- Guards anti sobrescrita fora de ordem ---
  const reqTokenRef = useRef<{ src?: string; tgt?: string }>({});

  const srcId = sourceConnection?.id;
  const tgtId = targetConnection?.id;

  const srcHasStructures = !!sourceConnection?.structures?.length;
  const tgtHasStructures = !!targetConnection?.structures?.length;

  // ✅ Fetch structures (só se faltar) — não apaga o que já existe
  useEffect(() => {
    if (!srcId || !tgtId) return;

    const needsSource = !srcHasStructures;
    const needsTarget = !tgtHasStructures;

    if (!needsSource && !needsTarget) return;

    const controller = new AbortController();
    let alive = true;

    const makeToken = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const srcToken = needsSource ? makeToken() : undefined;
    const tgtToken = needsTarget ? makeToken() : undefined;

    if (srcToken) reqTokenRef.current.src = srcToken;
    if (tgtToken) reqTokenRef.current.tgt = tgtToken;

    async function fetchOne(connectionId: number) {
      return api.get<ResponseWrapper<DBStructure[]>>(`/consu/all/structures/${connectionId}`, {
        timeout: 15000,
        signal: controller.signal,
      });
    }

    (async () => {
      try {
        const [srcRes, tgtRes] = await Promise.allSettled([
          needsSource ? fetchOne(srcId) : Promise.resolve(null),
          needsTarget ? fetchOne(tgtId) : Promise.resolve(null),
        ]);

        if (!alive) return;

        if (needsSource && srcRes.status === "fulfilled") {
          // ✅ ignora resposta velha
          if (srcToken && reqTokenRef.current.src !== srcToken) return;

          const data = safeArray<DBStructure>(srcRes.value?.data?.data) ?? null;
          if (data && data.length) {
            setSourceConnection((prev) => {
              if (!prev) return prev;
              // ✅ só seta se ainda não tem structures (evita apagar/recolocar)
              if (prev.structures?.length) return prev;
              return { ...prev, structures: data };
            });
          }
        }

        if (needsTarget && tgtRes.status === "fulfilled") {
          if (tgtToken && reqTokenRef.current.tgt !== tgtToken) return;

          const data = safeArray<DBStructure>(tgtRes.value?.data?.data) ?? null;
          if (data && data.length) {
            setTargetConnection((prev) => {
              if (!prev) return prev;
              if (prev.structures?.length) return prev;
              return { ...prev, structures: data };
            });
          }
        }

        // Se alguma falhar, não explode (Promise.allSettled)
        if (needsSource && srcRes.status === "rejected") {
          console.error("Erro ao carregar estruturas (source):", srcRes.reason);
        }
        if (needsTarget && tgtRes.status === "rejected") {
          console.error("Erro ao carregar estruturas (target):", tgtRes.reason);
        }
      } catch (err: { name?: string; code?: string; message?: string } | unknown) {
        if (err) {
          const e = err as { name?: string; code?: string };
          if (e.name === "AbortError" || e.code === "ERR_CANCELED") return;
        }
        console.error("Erro ao carregar estruturas:", err);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [srcId, tgtId, srcHasStructures, tgtHasStructures, setSourceConnection, setTargetConnection]);

  // 🔹 Map table_name -> targetTableId (pra auto map por nome)
  const targetTableMap = useMemo(() => {
    const map = new Map<string, string>();
    targetConnection?.structures?.forEach((t) => {
      map.set(t.table_name.toLowerCase(), String(t.id));
    });
    return map;
  }, [targetConnection?.structures]);

  // 🔹 Alternar seleção (sourceId -> targetId)
  const toggleTable = useCallback(
    (sourceId: string, tableName: string) => {
      setSelectedTables((prev) => {
        // remove
        if (prev[sourceId]) {
          const { [sourceId]: _, ...rest } = prev;
          console.log(_)
          return rest;
        }

        // adiciona com destino sugerido por nome (se existir)
        const targetId = targetTableMap.get(tableName.toLowerCase()) || "";
        return { ...prev, [sourceId]: targetId };
      });
    },
    [setSelectedTables, targetTableMap]
  );

  const handleMappingChange = useCallback(
    (sourceId: string, targetTableId: string) => {
      if (!targetTableId) return;
      setSelectedTables((prev) => ({ ...prev, [sourceId]: targetTableId }));
    },
    [setSelectedTables]
  );

  // 🔹 Filtrar tabelas de origem
  const filteredTables = useMemo(() => {
    const structures = sourceConnection?.structures || [];
    const term = searchTable.trim().toLowerCase();
    if (!term) return structures;
    return structures.filter((table) => table.table_name.toLowerCase().includes(term));
  }, [searchTable, sourceConnection?.structures]);

  // 🔹 Estado inválido (mas sem “pular hooks” — aqui é render)
  if (!sourceConnection) {
    return <div className="text-sm text-gray-500">Selecione a conexão de origem…</div>;
  }
  if (!Array.isArray(sourceConnection.structures)) {
    return <div className="text-sm text-red-500">Estrutura de origem inválida.</div>;
  }

  if (optionsTarget) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">Query Select</h3>
          <button
            onClick={() => setOptionsTarget(false)}
            className="px-4 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Voltar
          </button>
        </div>

        <Step2QueryTables
          sourceConnection={sourceConnection}
          targetConnection={targetConnection}
          selectedTables={selectedTables}
          setSelectedTables={setSelectedTables}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          listTarget={targetTableMap}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Selecione as tabelas para transferir</h3>

          <button
            className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            onClick={() => setOptionsTarget(true)}
          >
            🔄 Usar Query Select
          </button>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="🔍 Pesquisar tabelas..."
          value={searchTable}
          onChange={(e) => setSearchTable(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-amber-950"
        />

        {/* Lista */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredTables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {filteredTables.map((table) => {
                const tableId = String(table.id);
                const isSelected = tableId in selectedTables;

                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTable(tableId, table.table_name)}>
                      <input type="checkbox" checked={isSelected} readOnly className="w-5 h-5 text-blue-600 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold font-mono text-gray-900 truncate flex items-center gap-2">
                          <Table className="w-4 h-4 text-gray-400" />
                          {table.table_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{table?.fields?.length || 0} campos</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                    </div>

                    {/* Mapeamento destino */}
                    {isSelected && targetConnection && (
                      <div className="mt-3 text-black">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-gray-500" />
                          Selecionar tabela de destino:
                        </label>

                        <JoinSelect
                          onChange={(value) => handleMappingChange(tableId, value)}
                          options={targetTableMap}
                          value={selectedTables[tableId] || ""}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm">
              {searchTable ? "Nenhuma tabela encontrada." : "Nenhuma tabela disponível."}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex justify-between items-center text-sm mt-4 px-1">
          <span className="text-gray-600 font-medium">
            {Object.keys(selectedTables).length} de {sourceConnection.structures?.length || 0} tabela(s) selecionada(s)
          </span>
        </div>
      </div>
    </div>
  );
};