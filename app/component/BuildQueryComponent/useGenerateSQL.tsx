import { useMemo } from "react";
import { CondicaoFiltro, DistinctList, MultiOrderByOption, MetadataTableResponse, AdvancedJoinOption } from "@/types";
import { generateJoinConditionSQL, generateOrderBySQL } from "@/util/Joins_select";

export type OperatorType =
  | "=" | "!=" | ">" | "<" | ">=" | "<="
  | "IN" | "NOT IN"
  | "Entre" | "Não Entre"
  | "Contém" | "Não Contém"
  | "Depois de" | "Antes de"
  | "IS NULL" | "IS NOT NULL";

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

    const allColumns: string[] = columns.flatMap((table) =>
      table.colunas.map((col) => `${table.table_name}.${col.nome}`)
    );

    const isAllSelected = select.length === allColumns.length;
    const hasDistinct = distinctList.useDistinct && distinctList.distinct_columns.length > 0;

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

    const queryParts: string[] = [
      `SELECT ${selectClause}`,
      `FROM ${table_list[0]}`
    ];

    // JOINS
    Object.entries(advancedConditions).forEach(([table, join]) => {
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
        const {
          table_name_fil,
          column,
          operator,
          value,
          logicalOperator,
          pattern
        } = cond;

        let sqlOperator = operator as string;
        let sqlValue = "";

        // 🔹 Mapear operadores
        switch (operator) {
          case "Contém": sqlOperator = "LIKE"; break;
          case "Não Contém": sqlOperator = "NOT LIKE"; break;
          case "Depois de": sqlOperator = ">"; break;
          case "Antes de": sqlOperator = "<"; break;
          case "Entre": sqlOperator = "BETWEEN"; break;
          case "Não Entre": sqlOperator = "NOT BETWEEN"; break;
        }

        const escapeSql = (val: any) =>
          String(val).replace(/'/g, "''");

        // 🔥 opcional (escape literal de % e _)
        // const escapeLike = (val: string) =>
        //   val.replace(/[%_]/g, "\\$&");

        // 🔹 Construção do valor
        if (sqlOperator === "IS NULL" || sqlOperator === "IS NOT NULL") {
          sqlValue = "";
        }

        else if (["IN", "NOT IN"].includes(sqlOperator)) {
          const vals = String(value)
            .split(",")
            .map((v) => `'${escapeSql(v.trim())}'`);
          sqlValue = `(${vals.join(", ")})`;
        }

        else if (["LIKE", "NOT LIKE"].includes(sqlOperator)) {
          const prefix = pattern?.prefix || "";
          const suffix = pattern?.suffix || "";

          // const safeValue = escapeLike(escapeSql(value)); // 🔥 opcional
          const safeValue = escapeSql(value);

          sqlValue = `'${prefix}${safeValue}${suffix}'`;
          // sqlValue = `'${prefix}${safeValue}${suffix}' ESCAPE '\\'`; // 🔥 opcional
        }

        else if (["BETWEEN", "NOT BETWEEN"].includes(sqlOperator)) {
          const parts = String(value).split(",");
          if (parts.length >= 2) {
            sqlValue = `'${escapeSql(parts[0].trim())}' AND '${escapeSql(parts[1].trim())}'`;
          } else {
            sqlValue = `'${escapeSql(value)}' AND '${escapeSql(value)}'`;
          }
        }

        else {
          if (isNaN(Number(value)) || String(value).trim() === "") {
            sqlValue = `'${escapeSql(value)}'`;
          } else {
            sqlValue = String(value);
          }
        }

        const logic = index > 0 && logicalOperator ? `${logicalOperator} ` : "";

        return `${logic}${table_name_fil}.${column} ${sqlOperator} ${sqlValue}`.trim();
      });

      queryParts.push("WHERE " + whereClauses.join("\n  "));
    }

    // ORDER BY
    if (orderBy && orderBy.length > 0) {
      queryParts.push(generateOrderBySQL(orderBy));
    }

    return queryParts.join("\n") + ";";
  }, [columns, select, distinctList, table_list, advancedConditions, conditions, orderBy]);
}