import { AdvancedJoinOption, MetadataTableResponse } from "@/types";

// 🔹 Função utilitária para validar colunas
const buildColumnMap = (columns: any[]) => {
  const columnMap = new Map<string, Set<string>>();
  columns.forEach(table => {
    columnMap.set(
      table.table_name,
      new Set(table.colunas.map((c: any) => c.nome.toLowerCase()))
    );
  });
  return columnMap;
};

const validateColumn = (
  fullColumnName: string,
  columnMap: Map<string, Set<string>>
): boolean => {
  if (!fullColumnName) return false;

  let [tableName, columnName] = fullColumnName.split(".");
  columnName = columnName?.toLowerCase() ?? tableName?.toLowerCase();

  if (!columnName) return false;

  if (fullColumnName.includes(".")) {
    // validar em tabela específica
    return columnMap.get(tableName)?.has(columnName) ?? false;
  } else {
    // procurar em qualquer tabela
    return Array.from(columnMap.values()).some(cols => cols.has(columnName));
  }
};

// 🔹 Método principal reutilizável
export const sanitizeAdvancedConditions = (
  prevCond: Record<string, AdvancedJoinOption>,
  columns: MetadataTableResponse[],
  baseTable: string,
  table_list: string[]
) => {
  let changed = false;
  const newCond: Record<string, AdvancedJoinOption> = {};
  const removedJoins: string[] = [];

  const columnMap = buildColumnMap(columns);

  for (const [key, option] of Object.entries(prevCond)) {
    const validConditions = option.conditions.filter(cond => {
      // remover condições que envolvem a tabela base (não pode ser join)
      if (cond.table && cond.table === baseTable) return false;

      // validar se tabela ainda existe
      const tableExists = cond.table ? table_list.includes(cond.table) : true;
      if (!tableExists) return false;

      const leftValid = validateColumn(cond.leftColumn, columnMap);

      let rightValid = true;
      if (!cond.useValue && cond.rightColumn) {
        rightValid = validateColumn(cond.rightColumn, columnMap);
      }

      return leftValid && rightValid;
    });

    if (validConditions.length === 0) {
      changed = true;
      removedJoins.push(key);
      continue;
    }

    if (validConditions.length !== option.conditions.length) {
      changed = true;
    }

    newCond[key] = { ...option, conditions: validConditions };
  }

  return { newCond, removedJoins, changed };
};
