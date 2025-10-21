import { useCallback } from "react";
import { 
  QueryPayload, 
  AdvancedJoinOption, 
  CondicaoFiltro, 
  DistinctList, 
  MultiOrderByOption, 
  MetadataTableResponse 
} from "@/types";
import { 
  detectInvalidJoinOrderAdvance, 
  reorderJoinsAdvance_Object_p 
} from "@/util/Joins_select";
import { convertAdvancedJoinOptionToPayload } from "@/util/query_build_util/convertAdvancedJoinOptionToPayload";

interface UseExecuteQueryProps {
  conditions: CondicaoFiltro[];
  distinctList: DistinctList;
  onExecuteQuery: (payload: QueryPayload) => Promise<void>;
  orderBy: MultiOrderByOption;
  aliasTables: Record<string, string>;
  table_list: string[];
  select: string[];
  setSelect: (cols: string[]) => void;
  columns: MetadataTableResponse[];
  advancedConditions: Record<string, AdvancedJoinOption>;
  setAdvancedConditions: (conds: Record<string, AdvancedJoinOption>) => void;
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
    // 1. Filtrar condições válidas
    const validConditions = conditions.filter(
      (c) =>
        c.column &&
        (c.value?.toString().trim() ||
          c.operator === "IS NOT NULL" ||
          c.operator === "IS NULL")
    );

    // 2. Detectar e reordenar joins inválidos
    let ordered: Record<string, AdvancedJoinOption> = advancedConditions;
    const isDetect = detectInvalidJoinOrderAdvance(
      table_list[0],
      advancedConditions
    );
    if (isDetect.length > 0) {
      ordered = reorderJoinsAdvance_Object_p(table_list[0], ordered);
    }

    // 3. Completar aliases
    const completeAliases: Record<string, string> = {};
    const newSelect = [...select];

    if (select.length === 0) {
      columns.forEach((table) => {
        if (table_list.includes(table.table_name)) {
          table.colunas.forEach((col) => {
            newSelect.push(`${table.table_name}.${col.nome}`);
            completeAliases[`${table.table_name}.${col.nome}`] =
              aliasTables[`${table.table_name}.${col.nome}`] ||
              `${table.table_name}.${col.nome}`;
          });
        }
      });
      setSelect(newSelect);
    } else {
      select.forEach((col) => {
        completeAliases[col] = aliasTables[col] || col;
      });
    }

    // 4. Atualizar joins ordenados
    setAdvancedConditions(ordered);

    // 5. Converter AdvancedJoinOption para AdvancedJoinOptionPayload
    const joinsPayload = convertAdvancedJoinOptionToPayload(ordered);

    // 6. Montar request
    const bodyRequest: QueryPayload = {
      baseTable: table_list[0],
      joins: joinsPayload, // Agora usa o tipo correto
      aliaisTables: completeAliases,
      distinct: distinctList,
      limit: 10,
      orderBy,
      where: validConditions,
      table_list,
    };

    // 7. Executar
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