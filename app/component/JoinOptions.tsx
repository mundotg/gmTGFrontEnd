"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useJoinOrderDragDrop } from "./BuildQueryComponent/useJoinOrderDragDrop";
import { AdvancedJoinOption, JoinCondition, JoinType, MetadataTableResponse } from "@/types";
import { generateConditionId, isDuplicateCondition } from "@/util/Joins_select";
import { AllColumnOptions_type } from "./BuildQueryComponent/types";
import { Plus, Database } from "lucide-react";
import JoinTableItem from "./BuildQueryComponent/ListarJoinsOptionComponent";
import { NotificationType } from "./NotificationComponent";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";
import { useI18n } from "@/context/I18nContext";

const joinTypes: JoinType[] = ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"];
const operators = ["=", "!=", "<>", ">", "<", ">=", "<=", "LIKE", "NOT LIKE", "IS NULL", "IS NOT NULL", "IN", "NOT IN"];

interface JoinOptionsProps {
  advancedConditions: Record<string, AdvancedJoinOption>;
  setAdvancedConditions: React.Dispatch<React.SetStateAction<Record<string, AdvancedJoinOption>>>;
  columns: MetadataTableResponse[];
  addNotification: (type: NotificationType, title: string, message: string, autoClose?: boolean, duration?: number) => string
  table_list: string[];
  onBaseTableChange: (newBaseTable: string) => void;
}

export function JoinOptions({
  columns,
  advancedConditions,
  setAdvancedConditions,
  table_list,
  addNotification,
  onBaseTableChange
}: JoinOptionsProps) {
  const { t } = useI18n();
  const [expandedJoins, setExpandedJoins] = useState<Set<string>>(new Set());
  const baseTable = useMemo(() => table_list[0], [table_list])

  // ✅ Lista inicial só com a tabela base
  const tabelasLista = useMemo(
    () => columns
      .filter(t => t.table_name === baseTable)
      .map(t => t.table_name),
    [columns, baseTable]
  );

  const {
    joinOrder,
    setJoinOrder,
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    moveTable,
  } = useJoinOrderDragDrop(tabelasLista);

  // ✅ Sempre que advancedConditions mudar, atualiza joinOrder
  useEffect(() => {
    if (!advancedConditions) return;

    const tabelasJoin: string[] = [];

    Object.entries(advancedConditions).forEach(([tableName, joinOption]) => {
      // adiciona a própria tabela do join
      if (!tabelasJoin.includes(tableName)) {
        tabelasJoin.push(tableName);
      }

      // percorre condições para pegar tabelas referenciadas
      joinOption.conditions.forEach(cond => {
        const leftTable = cond.leftColumn.split(".")[0];
        const rightTable = cond.useValue ? null : cond.rightColumn.split(".")[0];

        if (leftTable && !tabelasJoin.includes(leftTable)) {
          tabelasJoin.push(leftTable);
        }
        if (rightTable && !tabelasJoin.includes(rightTable)) {
          tabelasJoin.push(rightTable);
        }
      });
    });

    // junta com a baseTable (sempre primeiro)
    const novoJoinOrder = [baseTable, ...tabelasJoin.filter(t => t !== baseTable)];

    // só atualiza se mudou
    if (JSON.stringify(novoJoinOrder) !== JSON.stringify(joinOrder)) {
      setJoinOrder(novoJoinOrder);
    }
  }, [advancedConditions, baseTable, joinOrder, setJoinOrder]);


  // Criar condição padrão sem duplicar
  const createDefaultCondition = React.useCallback(
    (tableName: string): JoinCondition | null => {
      const targetTable = columns.find(t => t.table_name === tableName);
      const baseTableObj = columns.find(t => t.table_name === baseTable);

      if (!targetTable || !baseTableObj) {
        addNotification('error', t("joins.configError") || 'Erro de Configuração',
          `${t("joins.tableNotFound") || "Tabela não encontrada:"} ${!targetTable ? tableName : baseTable}`);
        return null;
      }

      const targetCols = targetTable.colunas || [];
      const baseCols = baseTableObj.colunas || [];

      if (!targetCols.length || !baseCols.length) {
        addNotification('warning', t("joins.columnsUnavailable") || 'Colunas Indisponíveis',
          `${t("joins.noColumnsForJoin") || "Não há colunas disponíveis para criar condições entre"} ${baseTable} e ${tableName}`);
        return null;
      }

      // Procurar primeira combinação disponível
      for (let j = 0; j < baseCols.length; j++) {
        for (let i = 0; i < targetCols.length; i++) {
          const baseCol = baseCols[j];
          const targetCol = targetCols[i];

          const candidate: JoinCondition = {
            id: generateConditionId(),
            leftColumn: `${baseTable}.${baseCol.nome}`,
            operator: "=",
            rightColumn: `${tableName}.${targetCol.nome}`,
            valueColumnType: baseCol.tipo,
            useValue: false,
            logicalOperator: "AND",
            table: tableName,
            enumValores: baseCol.enum_valores_encontrados,
          };

          // Verificar se já existe condição idêntica
          const existingConditions = advancedConditions[tableName]?.conditions || [];
          const exists = existingConditions.some(
            c =>
              c.leftColumn === candidate.leftColumn &&
              c.rightColumn === candidate.rightColumn &&
              c.operator === candidate.operator
          );

          if (!exists) {
            addNotification('info', t("joins.conditionCreated") || 'Condição Criada',
              `${t("joins.defaultConditionCreated") || "Criada condição padrão para"} ${tableName}: ${baseCol.nome} = ${targetCol.nome}`);
            return candidate;
          }
        }
      }

      addNotification('warning', t("joins.combinationsExhausted") || 'Combinações Esgotadas',
        `${t("joins.allCombinationsUsed") || "Todas as combinações de colunas já foram usadas para a tabela"} ${tableName}.`,
        false);

      // caso não tem usar o value
      const candidate: JoinCondition = {
        id: generateConditionId(),
        leftColumn: `${baseTable}.${targetCols[0].nome}`,
        operator: "=",
        rightColumn: ``,
        valueColumnType: targetCols[0].tipo,
        useValue: true,
        logicalOperator: "AND",
        table: tableName,
        enumValores: targetCols[0].enum_valores_encontrados,
      };
      return candidate;
    },
    [columns, baseTable, advancedConditions, addNotification, t]
  );

  // Toggle expansão
  const toggleExpanded = useCallback((tableName: string) => {
    setExpandedJoins(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(tableName)) {
        newExpanded.delete(tableName);
      } else {
        newExpanded.add(tableName);
      }
      return newExpanded;
    });
  }, []);

  // Utilitário genérico para atualizar condições de uma tabela
  const updateConditions = React.useCallback(
    (tableName: string, updater: (conds: JoinCondition[]) => JoinCondition[]) => {
      setAdvancedConditions(prevAll => {
        const current = prevAll[tableName];
        if (!current) {
          addNotification('error', t("joins.stateError") || 'Erro de Estado',
            `${t("joins.joinConfigNotFound") || "Configuração de JOIN não encontrada para a tabela"} ${tableName}`);
          return prevAll;
        }

        const updatedConditions = updater(current.conditions);
        return {
          ...prevAll,
          [tableName]: {
            ...current,
            conditions: updatedConditions,
          },
        };
      });
    },
    [setAdvancedConditions, addNotification, t]
  );

  // Adicionar nova tabela (COM VERIFICAÇÃO DE DUPLICATA)
  const addJoinTable = React.useCallback(() => {
    // Filtra tabelas que não são a base e não estão já nos joins
    const availableTables = columns
      .filter(t => t.table_name !== baseTable)
      .filter(t => !joinOrder.includes(t.table_name));

    if (availableTables.length === 0) {
      addNotification('info', t("joins.allTablesAdded") || 'Todas as Tabelas Adicionadas',
        t("joins.noTablesLeft") || 'Não há mais tabelas disponíveis para adicionar JOINs.');
      return;
    }

    const newTable = availableTables[0].table_name;

    // VERIFICAÇÃO EXTRA: garantir que a tabela não está já nos joins
    if (joinOrder.includes(newTable)) {
      addNotification('error', t("joins.tableAlreadyAdded") || 'Tabela Já Adicionada',
        `${t("joins.tableAlreadyInJoins") || "A tabela"} ${newTable} ${t("joins.alreadyInJoins") || "já foi adicionada aos JOINs."}`);
      return;
    }

    const defaultCondition = createDefaultCondition(newTable);

    if (!defaultCondition) {
      return;
    }

    // Atualizar condições avançadas
    setAdvancedConditions(prev => ({
      ...prev,
      [newTable]: {
        conditions: [defaultCondition],
        typeJoin: "INNER JOIN"
      },
    }));

    // Atualizar ordem dos joins
    setJoinOrder(prev => [...prev, newTable]);

    // Expandir automaticamente o novo join
    setExpandedJoins(prev => new Set([...prev, newTable]));

    addNotification('success', t("joins.joinAdded") || 'JOIN Adicionado',
      `${t("joins.tableSuccessfullyAdded") || "Tabela"} ${newTable} ${t("joins.successfullyAdded") || "foi adicionada com sucesso aos JOINs."}`);
  }, [columns, baseTable, joinOrder, createDefaultCondition, setAdvancedConditions, setJoinOrder, addNotification, t]);

  // Remover condição
  const removeCondition = React.useCallback(
    (tableName: string, conditionId: string) => {
      updateConditions(tableName, conds => {
        const filtered = conds.filter(c => c.id !== conditionId);
        addNotification('info', t("joins.conditionRemoved") || 'Condição removida',
          `${t("joins.conditionRemovedFrom") || "Condição removida de"} ${tableName}. ${t("joins.remainingConditions") || "Restam"} ${filtered.length} ${t("joins.conditions") || "condições"}`);
        return filtered;
      });
    },
    [updateConditions, addNotification, t]
  );

  // Remover tabela do JOIN (ATUALIZADA)
  const removeJoinTable = React.useCallback(
    (tableName: string) => {
      // Verificar se a tabela existe nos joins
      if (!joinOrder.includes(tableName)) {
        addNotification('warning', t("joins.tableNotFound") || 'Tabela Não Encontrada',
          `${t("joins.tableNotInList") || "A tabela"} ${tableName} ${t("joins.notInJoinList") || "não está na lista de JOINs."}`);
        return;
      }

      // Remover da ordem
      setJoinOrder(prevOrder => {
        const newOrder = prevOrder.filter(name => name !== tableName);
        return newOrder;
      });

      // Remover das condições
      setAdvancedConditions(prevConfig => {
        const { [tableName]: removed, ...rest } = prevConfig;
        console.log(removed, "Configurações removidas para", tableName);
        return rest;
      });

      // Remover da expansão
      setExpandedJoins(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(tableName);
        return newExpanded;
      });

      addNotification('info', t("joins.joinRemoved") || 'JOIN Removido',
        `JOIN com a tabela ${tableName} foi removido.`);
    },
    [joinOrder, setJoinOrder, setAdvancedConditions, addNotification, t]
  );

  // Mudar tabela base (FUNCIONALIDADE NOVA)
  const changeBaseTable = React.useCallback((newBaseTable: string) => {
    if (newBaseTable === baseTable) {
      return; // Mesma tabela, nada a fazer
    }

    // Verificar se a nova tabela base está nos joins atuais
    const isNewBaseInJoins = joinOrder.includes(newBaseTable);

    if (isNewBaseInJoins) {
      addNotification('warning', t("joins.reorganizationNeeded") || 'Reorganização Necessária',
        `${t("joins.tableWillBeRemovedFromJoins") || "A tabela"} ${newBaseTable} ${t("joins.willBeRemovedFromJoins") || "será removida dos JOINs para se tornar a tabela base."}`);

      // Remover a tabela dos joins
      removeJoinTable(newBaseTable);
    }

    // Notificar o componente pai sobre a mudança
    onBaseTableChange(newBaseTable);

  }, [baseTable, joinOrder, onBaseTableChange, addNotification, removeJoinTable, t]);


  // Adicionar condição
  const addCondition = React.useCallback(
    (tableName: string) => {
      const newCondition = createDefaultCondition(tableName);

      if (!newCondition) {
        return;
      }

      updateConditions(tableName, existingConditions => [
        ...existingConditions,
        newCondition
      ]);

      addNotification('success', t("joins.conditionAdded") || 'Condição Adicionada',
        `${t("joins.newConditionAddedTo") || "Nova condição adicionada à tabela"} ${tableName}.`);
    },
    [createDefaultCondition, updateConditions, addNotification, t]
  );

  // Função auxiliar: atualiza lado direito baseado no lado esquerdo 
  const getRightSideUpdateForLeftColumn = React.useCallback(
    (leftColumnFull: string): Partial<JoinCondition> => {
      const [tableName, columnName] = leftColumnFull.split(".");
      const col = columns
        .find(t => t.table_name === tableName)
        ?.colunas.find(c => c.nome === columnName);

      if (!col) {
        addNotification('warning', t("joins.columnNotFound") || 'Coluna Não Encontrada',
          `${t("joins.columnNotInMetadata") || "A coluna"} ${leftColumnFull} ${t("joins.notInMetadata") || "não foi encontrada nos metadados."}`);
        return {};
      }

      return {
        enumValores: col.enum_valores_encontrados,
        valueColumnType: col.tipo,
      };
    },
    [columns, addNotification, t]
  );

  // Atualizar condição
  const updateJoinCondition = React.useCallback((tableName: string, conditionId: string, updates: Partial<JoinCondition>) => {
    updateConditions(tableName, conds =>
      conds.map(c => {
        if (c.id !== conditionId) return c;

        let resolvedUpdates = { ...updates };
        if (resolvedUpdates.operator === "Contém" || resolvedUpdates.operator === "Não Contém") {
          resolvedUpdates = {
            ...resolvedUpdates,
            rightValue: "", // continua limpo
            pattern: {
              prefix: "%",
              suffix: "%",
            },
          };
        }

        // Se mudou a coluna da esquerda, atualizar metadados
        if (updates.leftColumn) {
          const columnMetadata = getRightSideUpdateForLeftColumn(updates.leftColumn);
          resolvedUpdates = { ...resolvedUpdates, ...columnMetadata };
        }





        const newCondition = { ...c, ...resolvedUpdates };

        // Verificar duplicatas (excluindo a condição atual)
        if (isDuplicateCondition(conds, newCondition, conditionId)) {
          addNotification('warning', t("joins.duplicateCondition") || 'Condição Duplicada',
            t("joins.duplicateConditionDesc") || 'Esta combinação de coluna/operador já existe. A alteração foi cancelada.');
          return c; // Manter condição original
        }

        return newCondition;
      })
    );
  },
    [updateConditions, getRightSideUpdateForLeftColumn, addNotification, t]
  );

  // Atualizar tipo de JOIN
  const handleJoinTypeChange = React.useCallback(
    (tableName: string, joinType: JoinType) => {
      setAdvancedConditions(prev => ({
        ...prev,
        [tableName]: {
          ...prev[tableName],
          typeJoin: joinType
        },
      }));
    },
    [setAdvancedConditions]
  );

  // Memo para performance
  const allColumnOptions = useMemo<AllColumnOptions_type[]>(
    () =>
      columns.flatMap(table =>
        table.colunas.map(col => ({
          value: `${table.table_name}.${col.nome}`,
          label: `${table.table_name}.${col.nome}`,
        }))
      ),
    [columns]
  );

  // Tabelas disponíveis para adicionar (ATUALIZADA)
  const availableTablesCount = useMemo(
    () => columns
      .filter(t => t.table_name !== baseTable)
      .filter(t => !joinOrder.includes(t.table_name))
      .length,
    [columns, baseTable, joinOrder]
  );

  // Opções para mudar a tabela base
  const baseTableOptions = useMemo(
    () => columns.map(table => ({
      value: table.table_name,
      label: table.table_name,
    })),
    [columns]
  );

  if (columns.length < 2) return null;

  return (
    <div className="space-y-4">
      {/* Seletor de Tabela Base */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-1.5 bg-blue-100 rounded-md border border-blue-200">
            <Database className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
            {t("joins.baseTable") || "Tabela Base"}:
          </span>
          <JoinSelect
            className="flex-1 sm:flex-none min-w-[200px]"
            buttonClassName="px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold text-gray-900 shadow-sm"
            value={baseTable}
            onChange={(value) => changeBaseTable(value)}
            options={baseTableOptions}
            placeholder={t("joins.selectBaseTable") || "Selecione"}
          />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
          {joinOrder.length} JOIN{joinOrder.length !== 1 ? 's' : ''} {t("joins.configured") || "configurado(s)"}
        </span>
      </div>

      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <label className="block text-sm font-bold text-gray-900">
          {t("joins.joinConfigs") || "Configurações de JOIN"}
        </label>

        {availableTablesCount > 0 && (
          <button
            type="button"
            onClick={addJoinTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            title={`${t("actions.add")} ${availableTablesCount} ${t("joins.availableTables")}`}
          >
            <Plus className="h-4 w-4" />
            {t("joins.addJoin") || "Adicionar JOIN"} ({availableTablesCount})
          </button>
        )}
      </div>

      {joinOrder.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="space-y-2">
            <p className="text-gray-500 font-medium text-sm">
              {t("joins.noTablesConfigured") || "Nenhuma tabela configurada para JOIN"}
            </p>
            {availableTablesCount > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {availableTablesCount} {availableTablesCount !== 1 ? (t("joins.tables") || "tabelas") : (t("joins.table") || "tabela")} {t("joins.availableToAdd") || "disponível(eis) para adicionar"}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {joinOrder.map((tableName, index) => {
            const table = columns.find(t => t.table_name === tableName);
            if (!table) return null;

            const selectedJoin = advancedConditions[tableName];
            if (!selectedJoin) return null;

            const conditions = selectedJoin.conditions || [];

            return (
              <JoinTableItem
                key={`join-${tableName}-${index}`}
                tableName={tableName}
                index={index}
                selectedJoin={selectedJoin}
                conditions={conditions}
                isExpanded={expandedJoins.has(tableName)}
                isDragging={draggedIndex === index}
                isDragOver={dragOverIndex === index}
                joinOrderLength={joinOrder.length}
                joinTypes={joinTypes}
                operators={operators}
                allColumnOptions={allColumnOptions}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                handleJoinTypeChange={handleJoinTypeChange}
                toggleExpanded={toggleExpanded}
                moveTable={moveTable}
                removeJoinTable={removeJoinTable}
                addCondition={addCondition}
                updateCondition={updateJoinCondition}
                removeCondition={removeCondition}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}