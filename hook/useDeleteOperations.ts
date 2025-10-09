import { useCallback, useRef, useState } from 'react';
import { QueryResultType, MetadataTableResponse } from '@/types';
import api from '@/context/axioCuston';
import { createLogger } from '@/util/logger';

// Criar logger específico para este hook
const logger = createLogger({ hook: 'useDeleteOperations' });

interface DeleteOperationState {
    isDeleting: boolean;
    deleteProgress: number;
}

interface DeleteOperations {
    eliminarRegistro: (
        row: Record<string, unknown>,
        tabela: string[],
        index: number
    ) => Promise<void>;
    eliminarRegistrosSelecionados: (
        lista: {
            row?: Record<string, string>;
            index?: number;
            table?: string[];
        }[],
        queryResults: QueryResultType,
        setQueryResults: (value: QueryResultType | null) => void
    ) => Promise<void>;
    eliminarTodosRegistros: (
        queryResults: QueryResultType,
        setQueryResults: (value: QueryResultType | null) => void,
        columnsInfo: MetadataTableResponse[]
    ) => Promise<void>;
    state: DeleteOperationState;
    setDeleteProgress: (progress: number) => void;
    setIsDeleting: (deleting: boolean) => void;
}

export const useDeleteOperations = (): DeleteOperations => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState(0);
    const deleteInProgressRef = useRef(false);

    

    // Função auxiliar para extrair tabela principal com validação
    const getMainTable = useCallback((queryResults: QueryResultType, columnsInfo: MetadataTableResponse[]): string => {
        return logger.measureSync('Extrair tabela principal', () => {
            logger.debug('Iniciando extração de tabela principal', { 
                hasQueryPayload: !!queryResults.QueryPayload,
                hasTableList: !!queryResults.QueryPayload?.table_list,
                columnsCount: queryResults.columns?.length,
                columnsInfoCount: columnsInfo.length
            });

            // Prioridade 1: table_list do QueryPayload
            if (queryResults.QueryPayload?.table_list && queryResults.QueryPayload.table_list.length > 0) {
                const mainTable = queryResults.QueryPayload.table_list[0];
                logger.debug('Tabela principal encontrada via table_list', { mainTable });
                return mainTable;
            }

            // Prioridade 2: Extrair da primeira coluna
            const firstColumn = queryResults.columns?.[0];
            if (firstColumn && firstColumn.includes('.')) {
                const mainTable = firstColumn.split('.')[0];
                logger.debug('Tabela principal extraída da primeira coluna', { firstColumn, mainTable });
                return mainTable;
            }

            // Prioridade 3: Usar primeira tabela do columnsInfo
            const fallbackTable = columnsInfo[0]?.table_name || '';
            if (fallbackTable) {
                logger.warn('Usando fallback para tabela principal', { fallbackTable });
            } else {
                logger.error('Nenhuma tabela principal pôde ser identificada');
                throw new Error('Não foi possível identificar a tabela principal');
            }

            return fallbackTable;
        });
    }, []);

    // Função auxiliar para extrair condições da query original
    const getConditionsFromQuery = useCallback((queryResults: QueryResultType) => {
        return logger.measureSync('Extrair condições da query', () => {
            const conditions: Array<{ field: string, operator: string, value: any }> = [];
            const originalQuery = queryResults.QueryPayload;

            logger.debug('Analisando query original para condições', {
                hasWhere: !!originalQuery?.where,
                whereCount: originalQuery?.where?.length
            });

            if (!originalQuery?.where) {
                logger.warn('Nenhuma condição WHERE encontrada na query original');
                return conditions;
            }

            originalQuery.where.forEach((whereClause, index) => {
                try {
                    // Valida estrutura do whereClause
                    if (!whereClause.column || !whereClause.operator || whereClause.value === undefined) {
                        logger.warn('Condição WHERE incompleta ignorada', { whereClause, index });
                        return;
                    }

                    // Remove o prefixo da tabela se existir
                    const fieldName = whereClause.column.includes('.')
                        ? whereClause.column.split('.')[1]
                        : whereClause.column;

                    const condition = {
                        field: fieldName,
                        operator: whereClause.operator,
                        value: whereClause.value
                    };

                    conditions.push(condition);
                    logger.trace(`Condição ${index + 1} processada`, condition);

                } catch (error) {
                    logger.error(`Erro ao processar condição WHERE ${index + 1}`, error, { whereClause, index });
                }
            });

            logger.info(`Total de condições extraídas: ${conditions.length}`, { conditions });
            return conditions;
        });
    }, []);

    // Função auxiliar para extrair ID do registro com múltiplas estratégias
    const getRecordId = useCallback((row: Record<string, unknown>): string | null => {
        return logger.measureSync('Extrair ID do registro', () => {
            if (!row || typeof row !== 'object') {
                logger.error('Row inválido para extração de ID', { row });
                return null;
            }

            logger.trace('Iniciando extração de ID do registro', { rowKeys: Object.keys(row) });

            // Estratégia 1: Campos de ID comuns
            const commonIdFields = ['id', 'ID', 'Id', 'codigo', 'cod', 'chave', 'key', 'pk', 'PK'];
            for (const field of commonIdFields) {
                if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
                    const value = String(row[field]);
                    logger.debug('ID encontrado via campo comum', { field, value });
                    return value;
                }
            }

            // Estratégia 2: Campos que terminam com 'id'
            for (const key of Object.keys(row)) {
                if (key.toLowerCase().endsWith('id') && 
                    row[key] !== undefined && 
                    row[key] !== null && 
                    String(row[key]).trim() !== '') {
                    const value = String(row[key]);
                    logger.debug('ID encontrado via campo terminado em "id"', { key, value });
                    return value;
                }
            }

            // Estratégia 3: Primeiro campo não vazio
            for (const key of Object.keys(row)) {
                if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                    const value = String(row[key]);
                    logger.warn('Usando primeiro campo não vazio como ID', { key, value });
                    return value;
                }
            }

            logger.error('Nenhum ID válido encontrado no registro', { row });
            return null;
        });
    }, []);

    // Validação de resposta da API
    const validateApiResponse = useCallback((response: any, context: string) => {
        logger.trace(`Validando resposta da API para: ${context}`, { response });

        if (!response) {
            throw new Error(`Resposta da API vazia no contexto: ${context}`);
        }

        if (!response.data) {
            throw new Error(`Resposta da API sem dados no contexto: ${context}`);
        }

        if (response.data.success === false) {
            throw new Error(response.data.message || `Operação falhou no contexto: ${context}`);
        }

        logger.debug('Resposta da API validada com sucesso', { 
            context,
            success: response.data.success,
            deletedCount: response.data.deleted_count 
        });

        return response.data;
    }, []);

    // Eliminar registro único com validação completa
    const eliminarRegistro = useCallback(async (
        row: Record<string, unknown>,
        tabela: string[],
        index: number
    ): Promise<void> => {
        if (deleteInProgressRef.current) {
            logger.warn('Delete já em progresso, operação ignorada');
            return;
        }

        return logger.measure('Eliminação registro único', async () => {
            logger.info('Iniciando eliminação de registro único', { 
                tabela, 
                index,
                rowKeys: Object.keys(row || {})
            });

            try {
                // Validações iniciais
                if (!row) {
                    throw new Error("Dados do registro inválidos");
                }
                if (!tabela || tabela.length === 0) {
                    throw new Error("Não foi possível identificar a tabela deste registro");
                }

                deleteInProgressRef.current = true;
                setIsDeleting(true);
                setDeleteProgress(0);

                const tableName = tabela[0];
                logger.debug(`Tabela identificada: ${tableName}`);

                setDeleteProgress(10);
                const primaryKeyValue = getRecordId(row);

                if (!primaryKeyValue) {
                    throw new Error("Não foi possível identificar o ID do registro para eliminação");
                }

                logger.info('ID do registro identificado', { tableName, primaryKeyValue });
                setDeleteProgress(25);

                // Preparar payload
                const payload = {
                    table: tableName,
                    ids: [primaryKeyValue],
                };

                logger.debug('Enviando requisição de delete', { payload });
                setDeleteProgress(40);

                const response = await api.post(
                    "/delete/bulk",
                    payload,
                    { withCredentials: true }
                );

                setDeleteProgress(70);
                logger.debug('Resposta recebida da API', { response: response.data });

                // Validar resposta
                const responseData = validateApiResponse(response, 'eliminarRegistro');
                
                setDeleteProgress(90);
                logger.success('Registro eliminado com sucesso', { 
                    tableName, 
                    primaryKeyValue,
                    deletedCount: responseData.deleted_count 
                });

                setDeleteProgress(100);

            } catch (error) {
                logger.error('Erro durante eliminação de registro único', error, {
                    tableName: tabela[0],
                    index,
                    rowKeys: Object.keys(row || {})
                });
                throw error;
            } finally {
                setIsDeleting(false);
                deleteInProgressRef.current = false;
                logger.debug('Operação de eliminação única finalizada');
            }
        }, { operation: 'single_delete', rowIndex: index });
    }, [getRecordId, validateApiResponse]);

    // Eliminar registros selecionados em batch com validação completa
    const eliminarRegistrosSelecionados = useCallback(async (
        lista: {
            row?: Record<string, string>;
            index?: number;
            table?: string[];
        }[],
        queryResults: QueryResultType,
        setQueryResults: (value: QueryResultType | null) => void
    ): Promise<void> => {
        if (deleteInProgressRef.current) {
            logger.warn('Delete em lote já em progresso, operação ignorada');
            return;
        }

        return logger.measure('Eliminação em lote', async () => {
            logger.info('Iniciando eliminação em lote', { 
                totalRegistros: lista.length,
                previewCount: queryResults.preview?.length 
            });

            try {
                // Validações iniciais
                if (!lista || lista.length === 0) {
                    throw new Error("Lista de registros para eliminar está vazia");
                }
                if (!queryResults) {
                    throw new Error("Query results inválidos");
                }

                deleteInProgressRef.current = true;
                setIsDeleting(true);
                setDeleteProgress(0);

                // Fase 1: Agrupamento por tabela
                logger.debug('Fase 1: Agrupando registros por tabela');
                const recordsByTable: Record<string, any[]> = {};
                const invalidRecords: any[] = [];

                lista.forEach((item, index) => {
                    try {
                        if (!item.row || item.index === undefined || !item.table) {
                            invalidRecords.push({ index, reason: 'Dados incompletos', item });
                            return;
                        }

                        const tableName = item.table[0];
                        const recordId = getRecordId(item.row);

                        if (!recordId || !tableName) {
                            invalidRecords.push({ index, reason: 'ID ou tabela inválidos', item });
                            return;
                        }

                        if (!recordsByTable[tableName]) {
                            recordsByTable[tableName] = [];
                        }

                        recordsByTable[tableName].push({
                            id: recordId,
                            index: item.index
                        });

                    } catch (error) {
                        invalidRecords.push({ index, reason: 'Erro no processamento', error, item });
                    }
                });

                logger.info('Agrupamento concluído', {
                    tabelasEncontradas: Object.keys(recordsByTable),
                    registrosInvalidos: invalidRecords.length,
                    invalidRecords
                });

                if (invalidRecords.length > 0) {
                    logger.warn('Registros inválidos encontrados', { invalidRecords });
                }

                // Verifica se há registros válidos
                const tableNames = Object.keys(recordsByTable);
                if (tableNames.length === 0) {
                    throw new Error("Nenhum registro válido encontrado para eliminação");
                }

                setDeleteProgress(20);

                // Fase 2: Eliminação por tabela
                logger.debug('Fase 2: Iniciando eliminação por tabela');
                const indicesToRemove = new Set<number>();
                let totalEliminados = 0;

                for (const tableName of tableNames) {
                    const records = recordsByTable[tableName];
                    const ids = records.map(record => record.id);

                    logger.info(`Eliminando registros da tabela ${tableName}`, {
                        quantidade: records.length,
                        ids: ids
                    });

                    setDeleteProgress(30 + (tableNames.indexOf(tableName) * 20));

                    const response = await api.post(
                        "/delete/bulk",
                        {
                            table: tableName,
                            ids: ids,
                        },
                        { withCredentials: true }
                    );

                    const responseData = validateApiResponse(response, `eliminarRegistrosSelecionados - ${tableName}`);

                    // Adiciona índices para remover
                    records.forEach(record => {
                        if (record.index !== undefined) {
                            indicesToRemove.add(record.index);
                        }
                    });

                    totalEliminados += responseData.deleted_count || 0;
                    logger.success(`Tabela ${tableName} processada`, {
                        eliminados: responseData.deleted_count,
                        totalAcumulado: totalEliminados
                    });
                }

                setDeleteProgress(80);

                // Fase 3: Atualização da interface
                logger.debug('Fase 3: Atualizando interface', {
                    indicesParaRemover: Array.from(indicesToRemove),
                    totalIndices: indicesToRemove.size
                });

                const newPreview = queryResults.preview.filter((_, index) => !indicesToRemove.has(index));

                setQueryResults({
                    ...queryResults,
                    preview: newPreview,
                    totalResults: Math.max(0, (queryResults.totalResults || 0) - indicesToRemove.size),
                });

                setDeleteProgress(100);
                logger.success('Eliminação em lote concluída com sucesso', {
                    totalEliminados,
                    previewAtualizado: newPreview.length,
                    indicesRemovidos: indicesToRemove.size
                });

            } catch (error: unknown) {
                logger.error('Erro durante eliminação em lote', error, {
                    listaCount: lista.length,
                    queryResultsCount: queryResults.preview?.length
                });
                throw error;
            } finally {
                setIsDeleting(false);
                deleteInProgressRef.current = false;
                logger.debug('Operação de eliminação em lote finalizada');
            }
        }, { operation: 'batch_delete', batchSize: lista.length });
    }, [getRecordId, validateApiResponse]);

    // Eliminar todos os registros baseado na consulta original
    const eliminarTodosRegistros = useCallback(async (
        queryResults: QueryResultType,
        setQueryResults: (value: QueryResultType | null) => void,
        columnsInfo: MetadataTableResponse[]
    ): Promise<void> => {
        if (deleteInProgressRef.current) {
            logger.warn('Delete total já em progresso, operação ignorada');
            return;
        }

        return logger.measure('Eliminação total', async () => {
            logger.info('Iniciando eliminação de todos os registros', {
                previewCount: queryResults.preview?.length,
                totalResults: queryResults.totalResults
            });

            try {
                // Validações iniciais
                if (!queryResults) {
                    throw new Error("Query results inválidos");
                }
                if (!columnsInfo || columnsInfo.length === 0) {
                    throw new Error("Columns info inválido");
                }

                deleteInProgressRef.current = true;
                setIsDeleting(true);
                setDeleteProgress(0);

                setDeleteProgress(10);
                const mainTable = getMainTable(queryResults, columnsInfo);
                
                if (!mainTable) {
                    throw new Error("Não foi possível identificar a tabela principal para eliminação");
                }

                logger.info('Tabela principal identificada', { mainTable });

                setDeleteProgress(20);
                const conditions = getConditionsFromQuery(queryResults);

                // Validação de segurança para delete total
                if (conditions.length === 0) {
                    const errorMsg = "Não é possível eliminar todos os registros sem condições específicas por motivos de segurança";
                    logger.error(errorMsg, { 
                        mainTable,
                        hasWhere: !!queryResults.QueryPayload?.where 
                    });
                    throw new Error(errorMsg);
                }

                logger.info('Condições validadas para eliminação total', {
                    mainTable,
                    conditionsCount: conditions.length,
                    conditions
                });

                setDeleteProgress(30);

                // Preparar payload
                const payload = {
                    table: mainTable,
                    conditions: conditions,
                };

                logger.debug('Enviando requisição de eliminação total', { payload });
                setDeleteProgress(50);

                const response = await api.post(
                    "/delete/records",
                    payload,
                    { withCredentials: true }
                );

                setDeleteProgress(70);
                logger.debug('Resposta recebida da API para eliminação total', { response: response.data });

                // Validar resposta
                const responseData = validateApiResponse(response, 'eliminarTodosRegistros');

                setDeleteProgress(80);

                // Atualizar interface
                setQueryResults({
                    ...queryResults,
                    preview: [],
                    totalResults: 0,
                });

                setDeleteProgress(100);
                logger.success('Eliminação total concluída com sucesso', {
                    mainTable,
                    conditionsCount: conditions.length,
                    deletedCount: responseData.deleted_count
                });

            } catch (error) {
                logger.error('Erro durante eliminação total', error, {
                    mainTable: getMainTable(queryResults, columnsInfo),
                    conditionsCount: getConditionsFromQuery(queryResults).length
                });
                throw error;
            } finally {
                setIsDeleting(false);
                deleteInProgressRef.current = false;
                logger.debug('Operação de eliminação total finalizada');
            }
        }, { operation: 'delete_all' });
    }, [getMainTable, getConditionsFromQuery, validateApiResponse]);

    return {
        eliminarRegistro,
        eliminarRegistrosSelecionados,
        eliminarTodosRegistros,
        state: {
            isDeleting,
            deleteProgress
        },
        setDeleteProgress,
        setIsDeleting
    };
};