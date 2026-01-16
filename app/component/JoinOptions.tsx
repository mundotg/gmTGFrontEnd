import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useJoinOrderDragDrop } from "./BuildQueryComponent/useJoinOrderDragDrop";
import { AdvancedJoinOption, JoinCondition, JoinType, MetadataTableResponse } from "@/types";
import { generateConditionId, isDuplicateCondition } from "@/util/Joins_select";
import { AllColumnOptions_type } from "./BuildQueryComponent/types";
import { Plus, RefreshCw } from "lucide-react";
import JoinTableItem from "./BuildQueryComponent/ListarJoinsOptionComponent";
import { NotificationType } from "./NotificationComponent";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";

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
  const [expandedJoins, setExpandedJoins] = useState<Set<string>>(new Set());
  const baseTable = useMemo(() => table_list[0], [table_list])
  // ✅ Lista inicial só com a tabela base
  const tabelasLista = useMemo(
    () => columns
      .filter(t => t.table_name === baseTable)
      .map(t => t.table_name),
    [columns]
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

    // console.log("advancedConditions não é null ")
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
        addNotification('error', 'Erro de Configuração',
          `Tabela não encontrada: ${!targetTable ? tableName : baseTable}`);
        return null;
      }

      const targetCols = targetTable.colunas || [];
      const baseCols = baseTableObj.colunas || [];

      if (!targetCols.length || !baseCols.length) {
        addNotification('warning', 'Colunas Indisponíveis',
          `Não há colunas disponíveis para criar condições entre ${baseTable} e ${tableName}`);
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
            addNotification('info', 'Condição Criada',
              `Criada condição padrão para ${tableName}: ${baseCol.nome} = ${targetCol.nome}`);
            return candidate;
          }
        }
      }

      addNotification('warning', 'Combinações Esgotadas',
        `Todas as combinações de colunas já foram usadas para a tabela ${tableName}. Você precisará configurar manualmente.`,
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
    [columns, baseTable, advancedConditions, addNotification]
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
          addNotification('error', 'Erro de Estado',
            `Configuração de JOIN não encontrada para a tabela ${tableName}`);
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
    [setAdvancedConditions, addNotification]
  );

  // Adicionar nova tabela (COM VERIFICAÇÃO DE DUPLICATA)
  const addJoinTable = React.useCallback(() => {
    // Filtra tabelas que não são a base e não estão já nos joins
    const availableTables = columns
      .filter(t => t.table_name !== baseTable)
      .filter(t => !joinOrder.includes(t.table_name));

    console.log("Tabelas disponíveis:", availableTables.map(t => t.table_name));

    if (availableTables.length === 0) {
      addNotification('info', 'Todas as Tabelas Adicionadas',
        'Não há mais tabelas disponíveis para adicionar JOINs.');
      return;
    }

    const newTable = availableTables[0].table_name;

    // VERIFICAÇÃO EXTRA: garantir que a tabela não está já nos joins
    if (joinOrder.includes(newTable)) {
      addNotification('error', 'Tabela Já Adicionada',
        `A tabela ${newTable} já foi adicionada aos JOINs.`);
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

    addNotification('success', 'JOIN Adicionado',
      `Tabela ${newTable} foi adicionada com sucesso aos JOINs.`);
  }, [columns, baseTable, joinOrder, createDefaultCondition, setAdvancedConditions, setJoinOrder, addNotification]);

  // Remover condição
  const removeCondition = React.useCallback(
    (tableName: string, conditionId: string) => {
      updateConditions(tableName, conds => {
        const filtered = conds.filter(c => c.id !== conditionId);
        addNotification('info', 'Condição removida',
          `Condição removida de ${tableName}. Restam ${filtered.length} condições`);
        return filtered;
      });
    },
    [updateConditions, addNotification]
  );
  // Remover tabela do JOIN (ATUALIZADA)
  const removeJoinTable = React.useCallback(
    (tableName: string) => {
      // Verificar se a tabela existe nos joins
      if (!joinOrder.includes(tableName)) {
        addNotification('warning', 'Tabela Não Encontrada',
          `A tabela ${tableName} não está na lista de JOINs.`);
        return;
      }

      // Remover da ordem
      setJoinOrder(prevOrder => {
        const newOrder = prevOrder.filter(name => name !== tableName);
        console.log(`Tabela ${tableName} removida da ordem. Nova ordem:`, newOrder);
        return newOrder;
      });

      // Remover das condições
      setAdvancedConditions(prevConfig => {
        const { [tableName]: removed, ...rest } = prevConfig;
        console.log(`Condições da tabela ${tableName} removidas ${removed}`);
        return rest;
      });

      // Remover da expansão
      setExpandedJoins(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(tableName);
        return newExpanded;
      });

      addNotification('info', 'JOIN Removido',
        `JOIN com a tabela ${tableName} foi removido.`);
    },
    [joinOrder, setJoinOrder, setAdvancedConditions, addNotification]
  );
  // Mudar tabela base (FUNCIONALIDADE NOVA)
  const changeBaseTable = React.useCallback((newBaseTable: string) => {
    if (newBaseTable === baseTable) {
      return; // Mesma tabela, nada a fazer
    }

    // Verificar se a nova tabela base está nos joins atuais
    const isNewBaseInJoins = joinOrder.includes(newBaseTable);

    if (isNewBaseInJoins) {
      addNotification('warning', 'Reorganização Necessária',
        `A tabela ${newBaseTable} será removida dos JOINs para se tornar a tabela base.`);

      // Remover a tabela dos joins
      removeJoinTable(newBaseTable);
    }

    // Notificar o componente pai sobre a mudança
    onBaseTableChange(newBaseTable);

  }, [baseTable, joinOrder, onBaseTableChange, addNotification, removeJoinTable]);


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

      addNotification('success', 'Condição Adicionada',
        `Nova condição adicionada à tabela ${tableName}.`);
    },
    [createDefaultCondition, updateConditions, addNotification]
  );

  // Função auxiliar: atualiza lado direito baseado no lado esquerdo 
  const getRightSideUpdateForLeftColumn = React.useCallback(
    (leftColumnFull: string): Partial<JoinCondition> => {
      const [tableName, columnName] = leftColumnFull.split(".");
      const col = columns
        .find(t => t.table_name === tableName)
        ?.colunas.find(c => c.nome === columnName);

      if (!col) {
        addNotification('warning', 'Coluna Não Encontrada',
          `A coluna ${leftColumnFull} não foi encontrada nos metadados.`);
        return {};
      }

      return {
        enumValores: col.enum_valores_encontrados,
        valueColumnType: col.tipo,
      };
    },
    [columns, addNotification]
  );

  // Atualizar condição
  const updateJoinCondition = React.useCallback(
    (tableName: string, conditionId: string, updates: Partial<JoinCondition>) => {
      updateConditions(tableName, conds =>
        conds.map(c => {
          if (c.id !== conditionId) return c;

          let resolvedUpdates = { ...updates };

          // Se mudou a coluna da esquerda, atualizar metadados
          if (updates.leftColumn) {
            const columnMetadata = getRightSideUpdateForLeftColumn(updates.leftColumn);
            resolvedUpdates = { ...resolvedUpdates, ...columnMetadata };
          }

          const newCondition = { ...c, ...resolvedUpdates };

          // Verificar duplicatas (excluindo a condição atual)
          if (isDuplicateCondition(conds, newCondition, conditionId)) {
            addNotification('warning', 'Condição Duplicada',
              `Esta combinação de coluna/operador já existe. A alteração foi cancelada.`);
            return c; // Manter condição original
          }

          return newCondition;
        })
      );
    },
    [updateConditions, getRightSideUpdateForLeftColumn, addNotification]
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
    <div className="space-y-3">
      {/* Seletor de Tabela Base (NOVO) */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg  border-blue-200">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Tabela Base:</span>
          <JoinSelect
            className="text-xs"
            buttonClassName="text-sm border border-blue-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={baseTable}
            onChange={(value) => changeBaseTable(value)}
            options={baseTableOptions}
            placeholder="Coluna direita"
          />

        </div>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {joinOrder.length} JOIN{joinOrder.length !== 1 ? 's' : ''} configurado{joinOrder.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          Configurações de JOIN
        </label>

        {availableTablesCount > 0 && (
          <button
            type="button"
            onClick={addJoinTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
            title={`Adicionar ${availableTablesCount} tabela${availableTablesCount !== 1 ? 's' : ''} disponível${availableTablesCount !== 1 ? 'eis' : ''}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar JOIN ({availableTablesCount})
          </button>
        )}
      </div>

      {joinOrder.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="space-y-2">
            <p>Nenhuma tabela configurada para JOIN</p>
            {availableTablesCount > 0 && (
              <p className="text-xs">
                {availableTablesCount} tabela{availableTablesCount !== 1 ? 's' : ''} disponível{availableTablesCount !== 1 ? 'eis' : ''} para adicionar
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {joinOrder.map((tableName, index) => {
            const table = columns.find(t => t.table_name === tableName);
            if (!table) {
              return null;
            }

            const selectedJoin = advancedConditions[tableName];
            if (!selectedJoin) {
              return null;
            }

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