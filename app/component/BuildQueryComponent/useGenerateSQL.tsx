import { useMemo } from "react";
import { CondicaoFiltro, DistinctList, MultiOrderByOption, MetadataTableResponse, AdvancedJoinOption } from "@/types"; 
import { generateJoinConditionSQL, generateOrderBySQL } from "@/util/Joins_select";

interface UseGenerateSQLProps {
  columns: MetadataTableResponse[];
  select: string[];
  distinctList: DistinctList;
  table_list: string[];
  advancedConditions: Record<string, AdvancedJoinOption>;
  conditions: CondicaoFiltro[];
  orderBy: MultiOrderByOption;
}

export function useGenerateSQL({
  columns,
  select,
  distinctList,
  table_list,
  advancedConditions,
  conditions,
  orderBy
}: UseGenerateSQLProps) {
  return useMemo(() => {
    if (table_list.length === 0) return "";

    // Todas colunas
    const allColumns: string[] = columns.flatMap((table) =>
      table.colunas.map((col) => `${table.table_name}.${col.nome}`)
    );

    const isAllSelected = select.length === allColumns.length;
    const hasDistinct =
      distinctList.useDistinct && distinctList.distinct_columns.length > 0;

    // SELECT
    let selectClause = "*";
    if (select.length > 0) {
      if (isAllSelected) {
        selectClause = hasDistinct ? "DISTINCT *" : "*";
      } else {
        selectClause = hasDistinct
          ? "DISTINCT " + select.join(", ")
          : select.join(", ");
      }
    }

    // FROM
    const queryParts: string[] = [
      `SELECT ${selectClause}`,
      `FROM ${table_list[0]}`
    ];

    // JOINS
    const joins = Object.entries(advancedConditions);
    joins.forEach(([table, join]) => {
      if (join.typeJoin && table && join.conditions.length > 0) {
        queryParts.push(
          `${join.typeJoin} ${table} ON ${generateJoinConditionSQL(join.conditions)}`
        );
      }
    });

    // WHERE
    const validConditions = conditions.filter(
      (c) =>
        (c.column && c.value?.toString().trim()) ||
        c.operator === "IS NOT NULL" ||
        c.operator === "IS NULL"
    );

    if (validConditions.length > 0) {
      const whereClauses = validConditions.map((cond, index) => {
        const { table_name_fil, column, operator, value, logicalOperator } = cond;

        let formattedValue: string;
        if (["IN", "NOT IN"].includes(operator)) {
          formattedValue = `(${value
            .toString()
            .split(",")
            .map((v) => `'${v.trim()}'`)
            .join(", ")})`;
        } else if (["LIKE", "NOT LIKE"].includes(operator)) {
          formattedValue = `'%${value}%'`;
        } else if (value == null || value === "") {
          formattedValue = "NULL";
        } else if (isNaN(Number(value))) {
          formattedValue = `'${value}'`;
        } else {
          formattedValue = value.toString();
        }

        const logic =
          index > 0 && logicalOperator ? `${logicalOperator} ` : "";
        return `${logic}${table_name_fil}.${column} ${operator} ${formattedValue}`;
      });

      queryParts.push("WHERE " + whereClauses.join("\n  "));
    }

    // ORDER BY
    if (orderBy.length > 0) {
      queryParts.push(generateOrderBySQL(orderBy));
    }

    return queryParts.join("\n") + ";";
  }, [columns, select, distinctList, table_list, advancedConditions, conditions, orderBy]);
}
