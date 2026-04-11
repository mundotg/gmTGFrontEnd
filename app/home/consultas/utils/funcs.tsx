import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import api from "@/context/axioCuston"; // Certifique-se do caminho correto
import {
    SelectedRow,
    QueryResultType,
    MetadataTableResponse,
    EditedFieldForQuery,
    Tables_primary_keys_values,
} from '@/types';
import { findIdentifierField, parseErrorMessage } from '@/util/func';
import { fetchRowData, fetchRowDataIndex } from '@/util/linhaCompletaBusca';
import { createLogger } from '@/util/logger';
import { isAxiosError } from 'axios';
import { BatchDeleteRequest, PayloadDeleteRow } from '@/app/component/ResultadosQueryComponent/types';


const logger = createLogger({ component: "RowDetailsModal" });

interface UseHandleRowClickProps {
    queryResults: QueryResultType | null;
    columnsInfo: MetadataTableResponse[];
    selectedRow: SelectedRow | null;
    isEditingRow: boolean;
    openRowModal: (row: SelectedRow) => void;
    setLoadingFields: (loading: boolean) => void;
    setQueryResults: Dispatch<SetStateAction<QueryResultType | null>>;
    setError: (error: string | null) => void;
    setSelectedRow: (row: SelectedRow | null) => void;
    setIsEditingRow: (isEditing: boolean) => void;
    t?: (key: string) => string; // Função de tradução (opcional caso use i18n)
}

export const useHandleRowClick = ({
    queryResults,
    columnsInfo,
    selectedRow,
    isEditingRow,
    openRowModal,
    setLoadingFields,
    setQueryResults,
    setError,
    setSelectedRow,
    setIsEditingRow,
    t = (str: string) => str, // Fallback se 't' não for passado
}: UseHandleRowClickProps) => {

    const [modalFetchOpen, setModalFetchOpen] = useState(false);
    const [incompleteTablesToSelect, setIncompleteTablesToSelect] = useState<string[]>([]);
    const [pendingRowToFetch, setPendingRowToFetch] = useState<SelectedRow | null>(null);
    const [optionModalTable, setOptionModalTable] = useState<string>()
    const [responseModal, setResponseModal] = useState<string[]>()

    // ========================================================================
    // PARTE 2: A FUNÇÃO QUE REALMENTE VAI NO BANCO DE DADOS
    // ========================================================================
    const executeFetch = useCallback(async (row: SelectedRow, tablesToFetch: string[], selectedTablesArray: string[]) => {
        const allTabelaColuna = queryResults?.tabela_coluna || {};

        try {
            setLoadingFields(true);
            let fullRow = null;

            // Lógica Rápida: 1 Tabela exata com PK
            if (tablesToFetch.length === 1 && selectedTablesArray.length === 1) {
                const singleTableName = tablesToFetch[0];
                const primaryKeyField = findIdentifierField(singleTableName, columnsInfo);
                let primaryKeyValue: string | number | null = null;

                if (primaryKeyField) {
                    const pkIndex = row.nameColumns.findIndex((col) => {
                        if (!col) return false;
                        const expectedTable = singleTableName.includes(".") ? singleTableName.split(".").pop() : singleTableName;
                        const colParts = col.split(".");
                        const actualColumn = colParts.pop();
                        const actualTable = colParts.pop();

                        if (actualColumn === primaryKeyField.nome) {
                            if (actualTable) return actualTable === expectedTable;
                            return true;
                        }
                        return false;
                    });

                    if (pkIndex !== -1) {
                        const exactColumnKey = row.nameColumns[pkIndex];
                        primaryKeyValue = row.row?.[exactColumnKey] ?? null;
                    }
                }

                if (primaryKeyField && primaryKeyValue !== null && primaryKeyValue !== undefined) {
                    fullRow = await fetchRowData(
                        row, singleTableName, primaryKeyField.nome, primaryKeyField.tipo, String(primaryKeyValue)
                    );
                }
            }

            // Fallback: Usa o Index se for JOIN ou falhou PK e se o usuário escolheu pelo menos 1 tabela
            if (!fullRow && queryResults?.QueryPayload && tablesToFetch.length > 0) {
                const colunasParaBuscar: Record<string, any[]> = {};
                tablesToFetch.forEach(table => {
                    colunasParaBuscar[table] = allTabelaColuna[table] || [];
                });

                fullRow = await fetchRowDataIndex(
                    row.index!,
                    queryResults.QueryPayload,
                    colunasParaBuscar,
                    row.row || {}
                );
            }

            if (!fullRow) {
                openRowModal(row); // Se não achou nada novo, abre com o velho
                return;
            }

            // Recria o array de colunas garantindo integridade
            const newNameColumns = Object.keys(fullRow).map(key => {
                if (key.includes(".")) return key;
                return selectedTablesArray.length === 1 ? `${selectedTablesArray[0]}.${key}` : key;
            });

            openRowModal({
                ...row,
                row: fullRow,
                // nameColumns: newNameColumns
            });

        } catch (err) {
            setError(parseErrorMessage(err));
        } finally {
            setLoadingFields(false);
            setModalFetchOpen(false); // Garante que o modal de escolha vai fechar
            setPendingRowToFetch(null);
        }
    }, [columnsInfo, openRowModal, queryResults, setError, setLoadingFields]);

    useEffect(() => {
        // 1. Garantimos que temos um objeto seguro para ler (fallback para {})
        const selectedTablesObj = queryResults?.tabela_coluna || {};

        // 2. Extraímos as chaves do objeto (que presumo serem os nomes das tabelas)
        const incompleteTables: string[] = Object.keys(selectedTablesObj);

        // 3. Atualizamos o estado
        setIncompleteTablesToSelect(incompleteTables);

    }, [queryResults]); // 👈 queryResults precisa estar aqui!

    // ========================================================================
    // PARTE 1: A AÇÃO DE CLICAR NA LINHA (Decide se abre modal ou vai direto)
    // ========================================================================
    const handleRowClick = useCallback(async (row: SelectedRow) => {
        if (!row || row.index === undefined) return;

        const selectedTablesArray = Array.isArray(row.tableName) ? row.tableName : [row.tableName];
        if (selectedTablesArray.length === 0) return;

        const allTabelaColuna = queryResults?.tabela_coluna || {};
        const incompleteTables: string[] = [];

        // Verifica QUAIS tabelas estão incompletas na tela
        selectedTablesArray.forEach((tName) => {
            if (!tName) return;

            const chaveEncontrada = Object.keys(allTabelaColuna).find(key =>
                key === tName || key.split(".").pop() === tName.split(".").pop()
            );

            const colunasDaTabela = chaveEncontrada ? allTabelaColuna[chaveEncontrada] : [];
            if (colunasDaTabela.length === 0) return;

            let columnsFound = 0;
            colunasDaTabela.forEach((col) => {
                const fullKey = chaveEncontrada ? `${chaveEncontrada}.${col.nome}` : `${tName}.${col.nome}`;
                const shortKey = col.nome;

                if (
                    Object.prototype.hasOwnProperty.call(row.row || {}, fullKey) ||
                    Object.prototype.hasOwnProperty.call(row.row || {}, shortKey)
                ) {
                    columnsFound++;
                }
            });

            if (columnsFound < colunasDaTabela.length) {
                incompleteTables.push(chaveEncontrada || tName);
            }
        });

        // Se tudo já estiver 100% completo, abre o modal principal direto
        if (incompleteTables.length === 0) {
            return openRowModal(row);
        }

        // Lógica de Decisão
        if (selectedTablesArray.length === 1) {
            // Se for só uma tabela, vai direto pro executeFetch (não precisa perguntar)
            executeFetch(row, incompleteTables, selectedTablesArray.filter((t): t is string => t !== undefined));
        } else {
            // SÃO MÚLTIPLAS TABELAS INCOMPLETAS! Abre o modal e para a execução aqui.
            setPendingRowToFetch(row);
            // setIncompleteTablesToSelect(incompleteTables);
            setModalFetchOpen(true);
        }
    }, [executeFetch, openRowModal, queryResults]);


    // ========================================================================
    // O QUE O MODAL DE ESCOLHA CHAMA AO CLICAR EM CONFIRMAR
    // ========================================================================
    const handleConfirmFetchModal = useCallback((selectedTablesToFetch: string[], op: string = "line") => {


        // Se o usuário cancelou/escolheu nada, selecionou [], a gente manda pra API com array vazio (abre direto)
        if (op === "line") {
            if (!pendingRowToFetch) return;

            const selectedTablesArray = Array.isArray(pendingRowToFetch.tableName)
                ? pendingRowToFetch.tableName
                : [pendingRowToFetch.tableName];
            executeFetch(pendingRowToFetch, selectedTablesToFetch, selectedTablesArray as string[]);
        }
        if (op === "oneDelet")
            setResponseModal(selectedTablesToFetch)

        setOptionModalTable(undefined)

        setModalFetchOpen(false)
    }, [executeFetch, pendingRowToFetch]);


    // ========================================================================
    // 2. AÇÃO: ATUALIZAR A LINHA (UPDATE)
    // ========================================================================
    const handleRowUpdate = useCallback(async (
        updatedRow: EditedFieldForQuery,
        tables_primary_keys_values: Tables_primary_keys_values
    ) => {
        if (!updatedRow || isEditingRow || !tables_primary_keys_values) {
            console.warn("⚠️ Dados inválidos para atualização da linha");
            return;
        }

        setIsEditingRow(true);
        setError(null);

        try {
            await api.post(
                "/exe/update_row",
                { updatedRow, tables_primary_keys_values },
                { withCredentials: true }
            );

            // Transforma o updatedRow aninhado de volta para um formato plano
            const updatedValues = Object.entries(updatedRow).reduce<Record<string, string>>(
                (acc, [, columns]) => {
                    Object.entries(columns).forEach(([col, { value }]) => {
                        acc[col] = value;
                    });
                    return acc;
                },
                {}
            );

            // Atualiza o estado da linha no Frontend instantaneamente
            if (selectedRow) {
                const updatedSelectedRow = {
                    ...selectedRow,
                    row: { ...selectedRow.row, ...updatedValues }
                };
                setSelectedRow(updatedSelectedRow);
            }

        } catch (error) {
            const errorMsg = parseErrorMessage(error);
            setError(errorMsg);
            console.error("❌ Erro ao atualizar linha:", errorMsg);
        } finally {
            setIsEditingRow(false);
        }
    }, [isEditingRow, selectedRow, setError, setIsEditingRow, setSelectedRow]);

    // ========================================================================
    // 3. AÇÃO: ELIMINAR A LINHA (DELETE)
    // ========================================================================
    const handleDelete = useCallback(async (payload: PayloadDeleteRow) => {
        try {
            // 1. Clona o payload da query original para não mutar o estado do React
            let filteredPayloadSelectedRow = queryResults?.QueryPayload
                ? { ...queryResults.QueryPayload }
                : undefined;

            // 2. FILTRO MÁGICO: Limpa os aliases das tabelas que não vão ser apagadas
            if (filteredPayloadSelectedRow) {
                // Descobre quais tabelas vamos manter (se o array estiver vazio, usa a baseTable)
                const tablesToKeep = payload.tableForDelete.length > 0
                    ? payload.tableForDelete
                    : [filteredPayloadSelectedRow.baseTable].filter(Boolean) as string[];

                // Filtra o objeto aliaisTables
                if (filteredPayloadSelectedRow.aliaisTables) {
                    const newAliaisTables: Record<string, string> = {};

                    Object.entries(filteredPayloadSelectedRow.aliaisTables).forEach(([key, value]) => {
                        // Verifica se a chave (ex: "public.users.nome") começa com o nome de alguma tabela que vamos deletar
                        const belongsToTargetTable = tablesToKeep.some(table => key.startsWith(`${table}.`));

                        if (belongsToTargetTable) {
                            newAliaisTables[key] = value;
                        }
                    });

                    filteredPayloadSelectedRow.aliaisTables = newAliaisTables;
                }

                // Filtra o array select (se existir)
                if (filteredPayloadSelectedRow.select && filteredPayloadSelectedRow.select.length > 0) {
                    filteredPayloadSelectedRow.select = filteredPayloadSelectedRow.select.filter(col =>
                        tablesToKeep.some(table => col.startsWith(`${table}.`))
                    );
                }
            }

            // 3. Monta o payload final
            const finalPayload: BatchDeleteRequest = {
                registros: [payload],
                payloadSelectedRow: filteredPayloadSelectedRow // 👈 Agora vai limpinho!
            };

            // 4. Dispara a requisição
            await api.delete("/delete/records", {
                data: finalPayload,
                withCredentials: true,
            });

            // 5. Atualiza a UI
            setQueryResults(prev => {
                if (!prev) return prev;
                const newPreview = prev.preview.filter((_, i) => i !== payload.index);
                return {
                    ...prev,
                    preview: newPreview,
                    totalResults: Math.max(0, (prev.totalResults || 0) - 1),
                };
            });

        } catch (error: unknown) {
            console.error("❌ Erro ao eliminar registro:", error);
            let errorMessage = t("query.deleteError") || "Erro inesperado ao tentar eliminar o registro.";

            if (isAxiosError(error) && error.response?.data) {
                errorMessage = error.response.data.detail || error.response.data.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    }, [queryResults?.QueryPayload, setQueryResults, t]);
    // 👆 Dica de performance: Dependemos apenas do QueryPayload em vez do objeto inteiro

    // Retorna as 3 funções prontas para uso no componente
    return {
        modalFetchOpen,
        responseModal, setResponseModal,
        setModalFetchOpen,
        incompleteTablesToSelect,
        setIncompleteTablesToSelect,
        pendingRowToFetch, optionModalTable, setOptionModalTable,
        handleConfirmFetchModal, executeFetch,
        setPendingRowToFetch,
        handleRowClick,
        handleRowUpdate,
        handleDelete
    };
};













/* 


const handleRowClick_v_antiga = useCallback(async (row: SelectedRow) => {
        if (!row || row.index === undefined) return;

        // 1. Tratamento para múltiplas tabelas (JOIN)
        const selectedTablesArray = Array.isArray(row.tableName) ? row.tableName : [row.tableName];
        if (selectedTablesArray.length > 1) return openRowModal(row);

        const tableName = selectedTablesArray[0];
        if (!tableName) return;

        // 2. Verifica se a query atual já trouxe todas as colunas. Se sim, não faz requisição.
        const isColumnComplete = queryResults?.tabela_coluna?.[tableName]?.length === row.nameColumns.length;
        if (isColumnComplete) return openRowModal(row);

        try {
            setLoadingFields(true);

            const primaryKeyField = findIdentifierField(tableName, columnsInfo);
            let primaryKeyValue: string | number | null = null;

            // 3. Tenta encontrar a PK apenas se ela existir nos metadados
            if (primaryKeyField) {
                const pkIndex = row.nameColumns.findIndex((col) => {
                    if (!col) return false;

                    const expectedTable = tableName.includes(".") ? tableName.split(".").pop() : tableName;
                    const colParts = col.split(".");
                    const actualColumn = colParts.pop();
                    const actualTable = colParts.pop();

                    if (actualColumn === primaryKeyField.nome) {
                        if (actualTable) {
                            return actualTable === expectedTable;
                        }
                        return true;
                    }
                    return false;
                });

                // 🚨 FIX: Forma segura de pegar o valor! Pega o nome exato da chave e busca no objeto
                if (pkIndex !== -1) {
                    const exactColumnKey = row.nameColumns[pkIndex];
                    primaryKeyValue = row.row?.[exactColumnKey] ?? null;
                }
            }

            let fullRow = null;

            // 4. Lógica de decisão: Se temos a PK e seu valor, usamos a rota rápida.
            if (primaryKeyField && primaryKeyValue !== null && primaryKeyValue !== undefined) {
                fullRow = await fetchRowData(
                    row,
                    tableName,
                    primaryKeyField.nome,
                    primaryKeyField.tipo,
                    String(primaryKeyValue)
                );
            }
            // 5. Fallback: Não temos PK ou ela não veio no SELECT atual? Busca pelo Index + Payload!
            else if (queryResults?.QueryPayload) {
                fullRow = await fetchRowDataIndex(row.index, queryResults.QueryPayload, queryResults?.tabela_coluna || {}, row.row || {});
            }
            // 6. Se as requisições falharem, abre o modal com o que já tem na tela
            if (!fullRow) return openRowModal(row);

            // Sucesso! Atualiza o row com todos os dados da linha.
            openRowModal({
                ...row,
                row: fullRow
            });

        } catch (err) {
            setError(parseErrorMessage(err));
        } finally {
            setLoadingFields(false);
        }
    }, [setLoadingFields, columnsInfo, openRowModal, setError, queryResults]); */
