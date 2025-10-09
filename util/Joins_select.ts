import { AdvancedJoinOption, JoinCondition, MultiOrderByOption } from "@/types";

export function detectInvalidJoinOrderAdvance(
  baseTable: string,
  joins: Record<string, AdvancedJoinOption>
): string[] {
  const usedTables: Set<string> = new Set([baseTable]);
  const errors: string[] = [];

  Object.entries(joins).forEach(([table, join], index) => {
    join.conditions.forEach((cond) => {
      // Reconstrói a cláusula ON (simplificada)
      const onClause = cond.useValue
        ? `${cond.leftColumn} ${cond.operator} ${cond.rightValue}`
        : `${cond.leftColumn} ${cond.operator} ${cond.rightColumn}`;

      // Captura todos os "tabela.coluna"
      const matches = [...onClause.matchAll(/([a-zA-Z_][\w]*)\.[a-zA-Z_][\w]*/g)];
      const referencedTables = matches.map((m) => m[1]);

      referencedTables.forEach((tbl) => {
        if (!usedTables.has(tbl) && tbl !== table) {
          errors.push(
            `❌ Join na posição ${index} (${table}) referencia tabela "${tbl}" antes dela existir`
          );
        }
      });
    });

    // Marca a tabela do join como já "usada" após todas as condições
    usedTables.add(table);
  });

  return errors;
}


export function reorderJoinsAdvance_Object(
  baseTable: string,
  joins: Record<string, AdvancedJoinOption>
): Record<string, AdvancedJoinOption> {
  const pending = Object.entries(joins); // [table, AdvancedJoinOption]
  const ordered: Record<string, AdvancedJoinOption> = {};
  const usedTables: Set<string> = new Set([baseTable]);

  // remove duplicados por stringify
  const deduplicate = (conditions: JoinCondition[]): JoinCondition[] => {
    const seen = new Set<string>();
    return conditions.filter(c => {
      const key = JSON.stringify({
        left: c.leftColumn,
        op: c.operator,
        right: c.useValue ? c.rightValue : c.rightColumn,
      });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const extractTablesFromConditions = (conditions: JoinCondition[], self: string): string[] => {
    const referenced: string[] = [];

    for (const c of conditions) {
      if (!c.useValue && c.rightColumn.includes(".")) {
        referenced.push(c.rightColumn.split(".")[0]);
      }
      if (c.leftColumn.includes(".")) {
        referenced.push(c.leftColumn.split(".")[0]);
      }
    }

    return [...new Set(referenced)].filter(tbl => tbl !== self);
  };

  while (pending.length > 0) {
    let placedAny = false;

    for (let i = 0; i < pending.length; i++) {
      const [table, join] = pending[i];
      const dedupedConditions = deduplicate(join.conditions);
      const referenced = extractTablesFromConditions(dedupedConditions, table);

      const allDepsResolved = referenced.every(tbl => usedTables.has(tbl));

      if (allDepsResolved) {
        ordered[table] = {
          ...join,
          conditions: dedupedConditions, // 🔥 garante que duplicados saiam do retorno
        };
        usedTables.add(table);
        pending.splice(i, 1);
        placedAny = true;
        break;
      }
    }

    if (!placedAny) {
      const pendingInfo = pending
        .map(([t, j]) => `${t} -> [${extractTablesFromConditions(j.conditions, t).join(", ")}]`)
        .join("; ");
      throw new Error(
        `❌ Não foi possível reordenar os JOINs — dependências não resolvidas ou ciclo detectado. Pending: ${pendingInfo}`
      );
    }
  }

  return ordered;
}

export const generateOrderBySQL = (orderBy: MultiOrderByOption) => {
    if (orderBy.length === 0) return '';

    const orderClauses = orderBy
      .filter(item => item.column)
      .map(item => `${item.column} ${item.direction}`);

    return orderClauses.length > 0 ? `ORDER BY ${orderClauses.join(', ')}` : '';
  };


export function reorderJoinsAdvance_Object_p(
  baseTable: string,
  joins: Record<string, AdvancedJoinOption>
): Record<string, AdvancedJoinOption> {
  const pending = Object.entries(joins); // [table, AdvancedJoinOption]
  const ordered: Record<string, AdvancedJoinOption> = {};
  const usedTables: Set<string> = new Set([baseTable]);

  // remove duplicados por stringify
  const deduplicate = (conditions: JoinCondition[]): JoinCondition[] => {
    const seen = new Set<string>();
    return conditions.filter(c => {
      const key = JSON.stringify({
        left: c.leftColumn,
        op: c.operator,
        right: c.useValue ? c.rightValue : c.rightColumn,
      });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const extractTablesFromConditions = (conditions: JoinCondition[], self: string): string[] => {
    const referenced: string[] = [];

    for (const c of conditions) {
      if (!c.useValue && c.rightColumn.includes(".")) {
        referenced.push(c.rightColumn.split(".")[0]);
      }
      if (c.leftColumn.includes(".")) {
        referenced.push(c.leftColumn.split(".")[0]);
      }
    }

    return [...new Set(referenced)].filter(tbl => tbl !== self);
  };

  while (pending.length > 0) {
    let placedAny = false;

    for (let i = 0; i < pending.length; i++) {
      const [table, join] = pending[i];
      const dedupedConditions = deduplicate(join.conditions);
      const referenced = extractTablesFromConditions(dedupedConditions, table);

      const allDepsResolved = referenced.every(tbl => usedTables.has(tbl));

      if (allDepsResolved) {
        ordered[table] = {
          ...join,
          conditions: dedupedConditions, // 🔥 garante que duplicados saiam do retorno
        };
        usedTables.add(table);
        pending.splice(i, 1);
        placedAny = true;
        break;
      }
    }

    if (!placedAny) {
      const pendingInfo = pending
        .map(([t, j]) => `${t} -> [${extractTablesFromConditions(j.conditions, t).join(", ")}]`)
        .join("; ");
      throw new Error(
        `❌ Não foi possível reordenar os JOINs — dependências não resolvidas ou ciclo detectado. Pending: ${pendingInfo}`
      );
    }
  }

  return ordered;
}

// Função auxiliar para formatar o lado direito da condição
function formatRightValue(cond: JoinCondition): string {
  if (!cond.useValue) return cond.rightColumn;

  if (!cond.rightValue) return "NULL";

  // Se já está entre aspas, retorna direto
  if (cond.rightValue.startsWith("'") && cond.rightValue.endsWith("'")) {
    return cond.rightValue;
  }

  // Se é número, não adiciona aspas
  if (/^\d+(\.\d+)?$/.test(cond.rightValue)) {
    return cond.rightValue;
  }

  // Default: adiciona aspas simples
  return `'${cond.rightValue}'`;
}

// Função genérica para montar cláusula ON
export function buildJoinClause(
  conditions: JoinCondition[],
  defaultOperator: "AND" | "OR" = "AND"
): string {
  if (conditions.length === 0) return "";

  return conditions
    .map((condition, index) => {
      let clause = "";

      if (index > 0) {
        clause = ` ${condition.logicalOperator || defaultOperator} `;
      }

      const left = condition.leftColumn;
      const op = condition.operator;

      if (op === "IS NULL" || op === "IS NOT NULL") {
        clause += `${left} ${op}`;
      } else {
        const right = formatRightValue(condition);
        clause += `${left} ${op} ${right}`;
      }

      return clause;
    })
    .join("");
}

// Alias para compatibilidade
export const generateJoinConditionSQL = (conditions: JoinCondition[]) =>
  buildJoinClause(conditions);

export const generateOnClause = (conditions: JoinCondition[]) =>
  buildJoinClause(conditions);


    // Gerar ID único para condições
export const generateConditionId = () => `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


  // --- Função auxiliar: verifica duplicados
  export const isDuplicateCondition = (
    conditions: JoinCondition[],
    newCondition: JoinCondition,
    conditionId: string
  ): boolean => {
    return conditions.some(
      c =>
        c.id !== conditionId &&
        c.leftColumn === newCondition.leftColumn &&
        c.operator === newCondition.operator &&
        c.useValue === newCondition.useValue &&
        (c.useValue
          ? c.rightValue === newCondition.rightValue
          : c.rightColumn === newCondition.rightColumn)
    );
  };



