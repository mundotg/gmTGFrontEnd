import { AdvancedJoinOption, AdvancedJoinOptionPayload, JoinCondition, JoinConditionPayload } from "@/types";

export const convertAdvancedJoinOptionToPayload = (
  joinOptions: Record<string, AdvancedJoinOption>
): Record<string, AdvancedJoinOptionPayload> => {
  const result: Record<string, AdvancedJoinOptionPayload> = {};

  for (const [key, joinOption] of Object.entries(joinOptions)) {
    // 🚫 Ignora joins sem condições
    if (!joinOption.conditions || joinOption.conditions.length === 0) {
      continue;
    }

    // 🔹 Converter apenas condições que têm valor para query
    const conditionsPayload: JoinConditionPayload[] = joinOption.conditions
      .filter(condition => {
        // deve ter uma coluna à esquerda válida
        if (!condition.leftColumn) return false;

        // precisa ou de uma coluna à direita ou de um valor
        if (!condition.useValue && !condition.rightColumn) return false;
        if (condition.useValue && !condition.rightValue) return false;

        return true;
      })
      .map(condition => ({
        table: condition.table,
        leftColumn: condition.leftColumn,
        operator: condition.operator,
        rightColumn: condition.rightColumn,
        valueColumnType: condition.valueColumnType,
        rightValue: condition.rightValue,
        useValue: condition.useValue,
        logicalOperator: condition.logicalOperator,
        caseSensitive: condition.caseSensitive,
        collation: condition.collation,
        functionLeft: condition.functionLeft,
        functionRight: condition.functionRight,
        pattern: condition.pattern
      }));

    // 🚫 Ignora JOIN se, após validação, não sobrar nenhuma condição válida
    if (conditionsPayload.length === 0) {
      continue;
    }

    // ✅ Adiciona apenas joins aceitáveis
    result[key] = {
      conditions: conditionsPayload,
      alias: joinOption.alias,
      typeJoin: joinOption.typeJoin,
      groupStart: joinOption.groupStart,
      groupEnd: joinOption.groupEnd
    };
  }

  return result;
};


// Método para converter de AdvancedJoinOptionPayload para AdvancedJoinOption
export const convertAdvancedJoinOptionPayloadToOption = (
  joinPayloads: Record<string, AdvancedJoinOptionPayload>
): Record<string, AdvancedJoinOption> => {
  const result: Record<string, AdvancedJoinOption> = {};

  for (const [key, joinPayload] of Object.entries(joinPayloads)) {
    const conditions: JoinCondition[] = joinPayload.conditions.map((condition, index) => ({
      id: `condition-${key}-${index}-${Date.now()}`, // Gera ID único
      table: condition.table,
      leftColumn: condition.leftColumn,
      operator: condition.operator,
      rightColumn: condition.rightColumn,
      valueColumnType: condition.valueColumnType,
      rightValue: condition.rightValue,
      useValue: condition.useValue,
      logicalOperator: condition.logicalOperator,
      caseSensitive: condition.caseSensitive,
      collation: condition.collation,
      functionLeft: condition.functionLeft,
      functionRight: condition.functionRight,
      enumValores: [] // Valor padrão, pode ser preenchido depois se necessário
    }));

    result[key] = {
      conditions: conditions,
      alias: joinPayload.alias,
      typeJoin: joinPayload.typeJoin,
      groupStart: joinPayload.groupStart,
      groupEnd: joinPayload.groupEnd
    };
  }

  return result;
};

// Método para converter um único AdvancedJoinOption
export const convertSingleJoinOptionToPayload = (
  joinOption: AdvancedJoinOption
): AdvancedJoinOptionPayload => {
  const conditionsPayload: JoinConditionPayload[] = joinOption.conditions.map(condition => ({
    table: condition.table,
    leftColumn: condition.leftColumn,
    operator: condition.operator,
    rightColumn: condition.rightColumn,
    valueColumnType: condition.valueColumnType,
    rightValue: condition.rightValue,
    useValue: condition.useValue,
    logicalOperator: condition.logicalOperator,
    caseSensitive: condition.caseSensitive,
    collation: condition.collation,
    functionLeft: condition.functionLeft,
    functionRight: condition.functionRight
  }));

  return {
    conditions: conditionsPayload,
    alias: joinOption.alias,
    typeJoin: joinOption.typeJoin,
    groupStart: joinOption.groupStart,
    groupEnd: joinOption.groupEnd
  };
};

// Método para converter um único AdvancedJoinOptionPayload
export const convertSingleJoinOptionPayloadToOption = (
  joinPayload: AdvancedJoinOptionPayload
): AdvancedJoinOption => {
  const conditions: JoinCondition[] = joinPayload.conditions.map((condition, index) => ({
    id: `condition-${index}-${Date.now()}`,
    table: condition.table,
    leftColumn: condition.leftColumn,
    operator: condition.operator,
    rightColumn: condition.rightColumn,
    valueColumnType: condition.valueColumnType,
    rightValue: condition.rightValue,
    useValue: condition.useValue,
    logicalOperator: condition.logicalOperator,
    caseSensitive: condition.caseSensitive,
    collation: condition.collation,
    functionLeft: condition.functionLeft,
    functionRight: condition.functionRight,
    enumValores: []
  }));

  return {
    conditions: conditions,
    alias: joinPayload.alias,
    typeJoin: joinPayload.typeJoin,
    groupStart: joinPayload.groupStart,
    groupEnd: joinPayload.groupEnd
  };
};

