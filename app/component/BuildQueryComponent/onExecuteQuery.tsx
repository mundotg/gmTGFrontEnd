import { useCallback } from "react";
import {
  QueryPayload,
  AdvancedJoinOption,
  CondicaoFiltro,
  DistinctList,
  MultiOrderByOption,
  MetadataTableResponse,
} from "@/types";
import {
  detectInvalidJoinOrderAdvance,
  reorderJoinsAdvance_Object_p,
} from "@/util/Joins_select";
import { convertAdvancedJoinOptionToPayload } from "@/util/query_build_util/convertAdvancedJoinOptionToPayload";

interface UseExecuteQueryProps {
  conditions: CondicaoFiltro[];
  distinctList: DistinctList;
  onExecuteQuery: (payload: QueryPayload) => Promise<void>;
  orderBy: MultiOrderByOption;
  aliasTables: Record<string, string>;
  table_list: string[];            // ideal: ["public.users", ...], mas suporta ["users"]
  select: string[];                // agora pode vir com schema: ["public.users.nome", ...]
  setSelect: (cols: string[]) => void;
  columns: MetadataTableResponse[]; // contém schema_name + table_name + colunas[]
  advancedConditions: Record<string, AdvancedJoinOption>;
  setAdvancedConditions: (conds: Record<string, AdvancedJoinOption>) => void;
}

/** "public.users.nome" -> "users.nome"  |  "users.nome" -> "users.nome" */
function dropSchemaFromQualified(col: string): string {
  const parts = (col || "").split(".").filter(Boolean);
  if (parts.length >= 3) return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  return col;
}

/** "users" -> tenta achar no metadata e vira "public.users"; se já vier qualificado, mantém */
function ensureQualifiedTable(
  rawTable: string,
  metadata: MetadataTableResponse[]
): string {
  if (!rawTable) return rawTable;
  if (rawTable.includes(".")) return rawTable; // já qualificado: schema.table

  const found = metadata.find((t) => t.table_name === rawTable);
  return found ? `${found.schema_name}.${found.table_name}` : rawTable;
}

/** compara se "users" bate com "public.users" também */
function tableMatchesList(tableQualified: string, tableList: string[]): boolean {
  if (tableList.includes(tableQualified)) return true;
  const parts = tableQualified.split(".").filter(Boolean);
  const tableOnly = parts.length >= 2 ? parts[parts.length - 1] : tableQualified;
  return tableList.includes(tableOnly);
}

export function useExecuteQuery({
  conditions,
  distinctList,
  onExecuteQuery,
  orderBy,
  aliasTables,
  table_list,
  select,
  setSelect,
  columns,
  advancedConditions,
  setAdvancedConditions,
}: UseExecuteQueryProps) {
  const executeQuery = useCallback(async () => {
    // 1) Filtrar condições válidas
    const validConditions = conditions.filter(
      (c) =>
        c.column &&
        (c.value?.toString().trim() ||
          c.operator === "IS NOT NULL" ||
          c.operator === "IS NULL")
    );

    // 2) Detectar e reordenar joins inválidos
    let ordered: Record<string, AdvancedJoinOption> = advancedConditions;
    const isDetect = detectInvalidJoinOrderAdvance(table_list[0], advancedConditions);
    if (isDetect.length > 0) {
      ordered = reorderJoinsAdvance_Object_p(table_list[0], ordered);
    }

    // 3) Completar aliases + montar select default com schema.table.column
    const completeAliases: Record<string, string> = {};
    const newSelect = [...select];

    // base table qualificada (schema.table)
    const baseQualified = ensureQualifiedTable(table_list[0], columns);

    if (select.length === 0) {
      columns.forEach((t) => {
        const tblQualified = `${t.schema_name}.${t.table_name}`;

        // inclui se essa tabela está na table_list (qualificada ou não)
        if (!tableMatchesList(tblQualified, table_list)) return;

        t.colunas.forEach((col) => {
          const qualifiedCol = `${tblQualified}.${col.nome}`; // ✅ schema.table.column
          newSelect.push(qualifiedCol);

          // aliasTables pode estar em 2 formatos: com schema OU sem schema
          const fallbackNoSchema = dropSchemaFromQualified(qualifiedCol); // "users.nome"
          completeAliases[qualifiedCol] =
            aliasTables[qualifiedCol] ||
            aliasTables[fallbackNoSchema] ||
            qualifiedCol;
        });
      });

      setSelect(newSelect);
    } else {
      // Se o select já veio preenchido, apenas garante aliases com fallback
      select.forEach((col) => {
        const fallbackNoSchema = dropSchemaFromQualified(col);
        completeAliases[col] = aliasTables[col] || aliasTables[fallbackNoSchema] || col;
      });
    }

    // 4) Atualizar joins ordenados
    setAdvancedConditions(ordered);

    // 5) Converter AdvancedJoinOption para payload de joins
    const joinsPayload = convertAdvancedJoinOptionToPayload(ordered);

    // 6) Montar request
    const bodyRequest: QueryPayload = {
      baseTable: baseQualified, // ✅ schema.table (quando possível)
      joins: joinsPayload,
      aliaisTables: completeAliases,
      distinct: distinctList,
      limit: 10,
      orderBy,
      where: validConditions,
      table_list: table_list.map((t) => ensureQualifiedTable(t, columns)), // ✅ qualifica a lista também
    };

    // 7) Executar
    try {
      await onExecuteQuery(bodyRequest);
    } catch (error) {
      console.error("Erro ao executar consulta:", error);
    }
  }, [
    conditions,
    distinctList,
    onExecuteQuery,
    orderBy,
    aliasTables,
    table_list,
    select,
    setSelect,
    columns,
    advancedConditions,
    setAdvancedConditions,
  ]);

  return { executeQuery };
}