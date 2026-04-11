"use client";

import React, { useState, Dispatch, SetStateAction, useCallback, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { DBConnection } from "@/types/db-structure";
import type { Option } from "@/app/task/components/select_Component";
import type { MetadataTableResponse, QueryPayload } from "@/types";
import { LabeledSelect } from "@/app/component/LabeledSelect";
import QueryBuilderAux from "@/app/component/QueryBuilder-aux";

interface Step2TablesQueryProps {
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>; // { sourceTableId: targetTableId }
  setSelectedTables: Dispatch<SetStateAction<Record<string, string>>>;
  onSelectAll: (all: Record<string, string>) => void; // mantido
  onClearSelection: () => void; // mantido
  listTarget: Option[] | Map<string, string>; // Map<table_name_lower, targetId> (fallback)
}

const toLower = (s: unknown) => String(s ?? "").trim().toLowerCase();

export const Step2QueryTables: React.FC<Step2TablesQueryProps> = ({
  sourceConnection,
  targetConnection,
  selectedTables,
  setSelectedTables,
  listTarget,
}) => {
  const queryLimit = 100;

  const [tableList, setTableList] = useState<string[]>([]);
  const [selectColumns, setSelectColumns] = useState<string[]>([]);
  const [aliasTables, setAliasTables] = useState<Record<string, string>>({});
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [querySelected, setQuerySelected] = useState<QueryPayload | null>(null);
  const [columnsInfo, setColumnsInfo] = useState<MetadataTableResponse[]>([]);

  // ============================================================
  //  Source map: table_name -> structure (lookup rápido)
  // ============================================================
  const sourceTableMap = useMemo(() => {
    const map = new Map<string, NonNullable<DBConnection["structures"]>[number]>();
    for (const t of sourceConnection?.structures ?? []) {
      map.set(String(t.table_name), t);
    }
    return map;
  }, [sourceConnection?.structures]);

  // ============================================================
  //  Target options (preferência: targetConnection.structures)
  //  fallback: listTarget (Map ou Option[])
  // ============================================================
  const targetOptions: Option[] = useMemo(() => {
    // ✅ melhor fonte: a própria estrutura do target (label real + id real)
    if (targetConnection?.structures?.length) {
      return targetConnection.structures.map((t) => ({
        value: String(t.id),
        label: String(t.table_name),
      }));
    }

    // fallback: Map<table_name_lower, id>
    if (listTarget instanceof Map) {
      return Array.from(listTarget.entries()).map(([tableNameLower, id]) => ({
        value: String(id),
        label: String(tableNameLower), // não é ideal, mas serve sem target structures
      }));
    }

    // fallback: Option[]
    if (Array.isArray(listTarget)) {
return listTarget.map((opt: string | Option) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
      );
    }

    return [];
  }, [targetConnection?.structures, listTarget]);

  // ============================================================
  //  Auto-match de destino por nome (quando adiciona tabela)
  // ============================================================
  const targetIdByNameLower = useMemo(() => {
    const map = new Map<string, string>();

    // se tiver targetConnection structures, melhor ainda
    for (const t of targetConnection?.structures ?? []) {
      map.set(toLower(t.table_name), String(t.id));
    }

    // fallback: Map passado
    if (listTarget instanceof Map) {
      for (const [k, v] of listTarget.entries()) {
        if (!map.has(toLower(k))) map.set(toLower(k), String(v));
      }
    }

    return map;
  }, [targetConnection?.structures, listTarget]);

  // ============================================================
  //  Executar Query (sem mutar objeto)
  // ============================================================
  const handleExecuteQuery = useCallback(
    async (query: QueryPayload) => {
      setLoadingQuery(true);
      try {
        setQuerySelected({ ...query, limit: queryLimit });
      } catch (err) {
        console.error("❌ Erro ao executar query:", err);
      } finally {
        setLoadingQuery(false);
      }
    },
    [queryLimit]
  );

  // ============================================================
  //  Adicionar tabela (sem duplicar) + alimentar columnsInfo
  //  ✅ também tenta pré-mapear destino por nome (se existir)
  // ============================================================
  const adicionarTabela = useCallback(
    (tableNameSource: string) => {
      const name = String(tableNameSource ?? "").trim();
      if (!name) return;

      setTableList((prev) => (prev.includes(name) ? prev : [...prev, name]));

      const tabela = sourceTableMap.get(name);
      if (!tabela || !sourceConnection?.id) return;

      // ✅ adiciona metadata pro query builder (não duplica)
      setColumnsInfo((prev) => {
        if (prev.some((c) => c.table_name === name)) return prev;

        return [
          ...prev,
          {
            message: "OK",
            executado_em: new Date().toISOString(),
            connection_id: sourceConnection.id,
            schema_name: tabela.schema_name ?? "",
            table_name: tabela.table_name,
            total_colunas: tabela.fields?.length ?? 0,
            colunas: (tabela.fields ?? []).map((field) => ({
              nome: field.name,
              tipo: field.type,
              is_nullable: field.is_nullable ?? false,
              is_primary_key: field.is_primary_key ?? false,
              is_foreign_key: field.is_foreign_key ?? false,
              is_auto_increment: field.is_auto_increment ?? false,
              referenced_table: field.referenced_table ?? null,
              field_references: field.referenced_field ?? null,
              is_unique: field.is_unique ?? false,
              default: field.default_value ?? null,
              comentario: field.comment ?? null,
              length: field.length ?? null,
              enum_valores_encontrados: field.enum_values ?? [],
              on_delete_action: field.fk_on_delete?.toString?.(),
              on_update_action: field.fk_on_update?.toString?.(),
            })),
          },
        ];
      });

      // ✅ pré-mapeia destino por nome (se ainda não estiver setado)
      const srcId = String(tabela.id);
      const suggestedTgtId = targetIdByNameLower.get(toLower(name)) || "";

      if (suggestedTgtId) {
        setSelectedTables((prev) => {
          if (prev[srcId]) return prev; // não sobrescreve escolha existente
          return { ...prev, [srcId]: suggestedTgtId };
        });
      }
    },
    [sourceConnection?.id, sourceTableMap, targetIdByNameLower, setSelectedTables]
  );

  // ============================================================
  //  Limpeza: se remover tabela da tableList, remove mapeamento dela
  //  ✅ evita "lixo" no selectedTables
  // ============================================================
  useEffect(() => {
    const validSrcIds = new Set(
      tableList
        .map((name) => sourceTableMap.get(name))
        .filter(Boolean)
        .map((t) => String(t!.id))
    );

    setSelectedTables((prev) => {
      let changed = false;
      const next: Record<string, string> = {};
      for (const [srcId, tgtId] of Object.entries(prev)) {
        if (validSrcIds.has(String(srcId))) {
          next[srcId] = tgtId;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tableList, sourceTableMap, setSelectedTables]);

  // ============================================================
  //  UI (fail fast)
  // ============================================================
  if (!sourceConnection) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Carregando tabelas...</span>
      </div>
    );
  }

  const sourceOptions: Option[] =
    sourceConnection.structures?.map((t) => ({
      value: String(t.table_name),
      label: `${t.table_name} (id:${t.id})`,
    })) ?? [];

  const shouldShowTargetSelect = tableList.length > 0 && targetOptions.length > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Transferência por Query Select (Tabelas)
      </h3>

      <LabeledSelect
        label="Tabelas"
        value={tableList}
        onChange={(value) => Promise.resolve(adicionarTabela(String(value)))}
        options={sourceOptions}
        maxSelections={16}
      />

      <QueryBuilderAux
        columns={columnsInfo}
        table_list={tableList}
        setTable_list={setTableList}
        onExecuteQuery={handleExecuteQuery}
        title={`Consulta: ${sourceConnection.name}`}
        maxConditions={25}
        showLogicalOperators
        setSelect={setSelectColumns}
        select={selectColumns}
        setAliasTables={setAliasTables}
        aliasTables={aliasTables}
        isExecuting={loadingQuery}
      />

      <div className="flex justify-between items-center text-sm mt-4 px-1">
        <span className="text-gray-600 font-medium">
          {Object.keys(selectedTables).length} de{" "}
          {sourceConnection.structures?.length ?? 0} tabela(s) selecionada(s)
        </span>
      </div>

      {/* =======================================================
          ✅ Mapeamento origem -> destino usando ID REAL da tabela
         ======================================================= */}
      {shouldShowTargetSelect && (
        <div className="border rounded-lg p-4 bg-gray-50 shadow-sm mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800">
            Mapear tabelas de origem → destino
          </h4>

          <div className="space-y-3">
            {tableList.map((srcTableName) => {
              const src = sourceTableMap.get(srcTableName);
              if (!src) return null;

              const srcId = String(src.id);

              return (
                <div key={srcId} className="flex items-center gap-3">
                  <div className="flex-1 text-sm text-gray-700 font-mono truncate">
                    {srcTableName}
                  </div>

                  <div className="w-80">
                    {/* ⚠️ se teu LabeledSelect não suporta single value,
                        troca por JoinSelect ou um select simples.
                        Aqui assumo que maxSelections=1 funciona bem. */}
                    <LabeledSelect
                      label="Destino"
                      value={selectedTables[srcId] || ""}
                      onChange={(targetId) =>
                        Promise.resolve(
                          setSelectedTables((prev) => ({
                            ...prev,
                            [srcId]: String(targetId),
                          }))
                        )
                      }
                      options={targetOptions}
                      maxSelections={1}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Formato salvo: <span className="font-mono">{`{ "sourceId": "targetId" }`}</span>
          </div>
        </div>
      )}

      {/* Debug opcional */}
      {querySelected && (
        <pre className="text-xs bg-white border rounded p-3 overflow-auto">
          {JSON.stringify({ querySelected, tableList, selectedTables }, null, 2)}
        </pre>
      )}
    </div>
  );
};