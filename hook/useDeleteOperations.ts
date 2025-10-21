import { useCallback, useRef, useState } from "react";
import { QueryResultType, PayloadDeleteRow, SelectedRow } from "@/types";
import api from "@/context/axioCuston";
import { createLogger } from "@/util/logger";
import { usePrimaryKeyExtractor } from "./getPrimarykeyValorOfRow";
import { ListaDelete } from "@/app/component/ResultadosQueryComponent/types";

const logger = createLogger({ hook: "useDeleteOperations" });

interface DeleteOperationState {
    isDeleting: boolean;
    deleteProgress: number;
}

interface DeleteOperations {
    eliminarRegistrosSelecionados: (
        lista: ListaDelete[],
        queryResults: QueryResultType,
        setQueryResults: (value: QueryResultType | null) => void
    ) => Promise<void>;

    eliminarTodosRegistros: (
        queryResults: QueryResultType,
        setQueryResults: (value: QueryResultType | null) => void
    ) => Promise<void>;

    state: DeleteOperationState;
    setDeleteProgress: (progress: number) => void;
    setIsDeleting: (deleting: boolean) => void;
}

export const useDeleteOperations = (): DeleteOperations => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState(0);
    const deleteInProgressRef = useRef(false);

    /**
     * 🔹 Elimina uma lista de registros selecionados (em um único request)
     */
    const eliminarRegistrosSelecionados = useCallback(
        async (
            lista: ListaDelete[],
            queryResults: QueryResultType,
            setQueryResults: (value: QueryResultType | null) => void
        ): Promise<void> => {
            if (deleteInProgressRef.current) {
                logger.warn("Operação de exclusão já em andamento");
                return;
            }

            if (!lista?.length) {
                logger.warn("Nenhum registro selecionado para exclusão");
                return;
            }

            return logger.measure('Eliminação em lote de registros', async () => {
                logger.info("Iniciando exclusão em lote", {
                    totalRegistros: lista.length,
                    indices: lista.map(item => item.index).filter(Boolean)
                });

                deleteInProgressRef.current = true;
                setIsDeleting(true);
                setDeleteProgress(0);

                try {
                    const total = lista.length;

                    // Preparar informações das tabelas
                    const informacaosOftables = queryResults.tabela_coluna
                        ? Object.entries(queryResults.tabela_coluna).map(([tableName, colunas]) => ({
                            message: "",
                            executado_em: "",
                            connection_id: 0,
                            schema_name: "",
                            table_name: tableName,
                            total_colunas: colunas.length,
                            colunas,
                        }))
                        : [];

                    logger.debug("Informações das tabelas carregadas", {
                        tabelasCount: informacaosOftables.length,
                        tabelas: informacaosOftables.map(t => t.table_name)
                    });

                    const payloads: PayloadDeleteRow[] = [];

                    // Fase 1: Montagem dos payloads
                    logger.debug("Fase 1: Montando payloads de exclusão");
                    for (let i = 0; i < total; i++) {
                        const item = lista[i];

                        if (!item?.row || !item?.table?.length) {
                            logger.warn("Item inválido ignorado", { index: i, item });
                            continue;
                        }

                        const selectedRow: SelectedRow = {
                            row: item.row,
                            index: item.index ?? -1,
                            tableName: item.table,
                            nameColumns: queryResults.columns,
                        };

                        try {
                            const { getPrimaryKeyInfo } = usePrimaryKeyExtractor(selectedRow, informacaosOftables);
                            const payload = getPrimaryKeyInfo();
                            payload.payloadSelectedRow = queryResults.QueryPayload;
                            payloads.push(payload);

                            logger.trace(`Payload ${i + 1} gerado`, {
                                index: item.index,
                                tables: Object.keys(payload.rowDeletes),
                                hasQueryPayload: !!queryResults.QueryPayload
                            });

                        } catch (error) {
                            logger.error(`Erro ao gerar payload para item ${i}`, error, {
                                index: item.index,
                                table: item.table
                            });
                            // Continua com os outros itens mesmo se um falhar
                        }

                        setDeleteProgress(Math.round(((i + 1) / total) * 50));
                    }

                    if (payloads.length === 0) {
                        const error = new Error("Nenhum payload válido para exclusão foi gerado.");
                        logger.error("Falha na montagem de payloads", error, {
                            totalItens: lista.length,
                            payloadsGerados: payloads.length
                        });
                        throw error;
                    }

                    logger.info("Payloads montados com sucesso", {
                        totalPayloads: payloads.length,
                        payloadsSummary: payloads.map(p => ({
                            index: p.index,
                            tables: Object.keys(p.rowDeletes),
                            tablesWithValues: Object.entries(p.rowDeletes)
                                .filter(([_, config]) => config.primaryKeyValue)
                                .map(([tableName]) => tableName)
                        }))
                    });

                    setDeleteProgress(60);

                    // Fase 2: Envio para a API
                    logger.debug("Fase 2: Enviando requisição para a API");
                    const requestPayload = { registros: payloads };

                    logger.debug("Enviando payload para API", {
                        endpoint: "/delete/records",
                        payloadSize: JSON.stringify(requestPayload).length,
                        registrosCount: payloads.length
                    });

                    const response = await api.delete(
                        "/delete/records",
                        {
                            data: { requestPayload },
                            withCredentials: true
                        }
                    );

                    logger.debug("Resposta da API recebida", {
                        status: response.status,
                        data: response.data
                    });

                    // Validação da resposta
                    if (!response.data) {
                        throw new Error("Resposta da API vazia");
                    }

                    setDeleteProgress(90);

                    // Fase 3: Atualização da interface
                    logger.debug("Fase 3: Atualizando interface");
                    const indicesParaRemover = new Set(lista.map(item => item.index).filter((idx): idx is number => idx !== undefined));
                    const newPreview = queryResults.preview.filter((_, idx) => !indicesParaRemover.has(idx));

                    setQueryResults({
                        ...queryResults,
                        preview: newPreview,
                        totalResults: Math.max(0, (queryResults.totalResults || 0) - indicesParaRemover.size),
                    });

                    setDeleteProgress(100);

                    logger.success("Exclusão em lote concluída com sucesso", {
                        registrosEliminados: indicesParaRemover.size,
                        previewAtualizado: newPreview.length,
                        totalResultsAtualizado: Math.max(0, (queryResults.totalResults || 0) - indicesParaRemover.size)
                    });

                } catch (error) {
                    logger.error("Erro durante exclusão em lote", error, {
                        listaCount: lista.length,
                        queryResultsPreviewCount: queryResults.preview?.length
                    });

                    // Re-lançar o erro para tratamento externo
                    throw error;
                } finally {
                    deleteInProgressRef.current = false;
                    setIsDeleting(false);
                    logger.debug("Estado de deleção resetado");

                    // Reset suave do progresso
                    setTimeout(() => {
                        setDeleteProgress(0);
                        logger.trace("Progresso resetado para 0");
                    }, 300);
                }
            }, {
                operation: 'batch_delete',
                batchSize: lista.length
            });
        },
        []
    );

    /**
     * 🔹 Elimina todos os registros da tabela atual
     */
    const eliminarTodosRegistros = useCallback(
        async (
            queryResults: QueryResultType,
            setQueryResults: (value: QueryResultType | null) => void
        ): Promise<void> => {
            if (deleteInProgressRef.current) {
                logger.warn("Operação de exclusão já em andamento");
                return;
            }

            return logger.measure('Eliminação de todos os registros', async () => {
                // logger.info("Iniciando eliminação de todos os registros", {
                //     previewCount: queryResults.preview?.length,
                //     totalResults: queryResults.totalResults,
                //     hasQueryPayload: !!queryResults.QueryPayload
                // });

                deleteInProgressRef.current = true;
                setIsDeleting(true);
                setDeleteProgress(0);

                try {
                    setDeleteProgress(30);

                    // logger.debug("Enviando requisição para eliminar todos os registros", {
                    //     endpoint: "/delete/delete_all",
                    //     queryPayload: queryResults.QueryPayload
                    // });

                    console.log(` Payload para eliminar todos os registros:`, queryResults.QueryPayload);

                    const response = await api.delete("/delete/delete_all", {
                        data: queryResults.QueryPayload, // 👈 diretamente, sem chave extra
                        withCredentials: true,
                    });

                    // logger.debug("Resposta da API recebida", {
                    //     status: response.status,
                    //     data: response.data
                    // });

                    setDeleteProgress(70);

                    // Atualizar interface
                    setQueryResults({
                        ...queryResults,
                        preview: [],
                        totalResults: 0,
                    });

                    setDeleteProgress(100);

                    // logger.success("Todos os registros eliminados com sucesso", {
                    //     registrosEliminados: queryResults.preview?.length || 0,
                    //     totalResultsAnterior: queryResults.totalResults
                    // });

                } catch (error) {
                    logger.error("Erro ao eliminar todos os registros", error, {
                        previewCount: queryResults.preview?.length,
                        hasQueryPayload: !!queryResults.QueryPayload
                    });
                    throw error;
                } finally {
                    deleteInProgressRef.current = false;
                    setIsDeleting(false);
                    logger.debug("Estado de deleção resetado");

                    setTimeout(() => {
                        setDeleteProgress(0);
                        logger.trace("Progresso resetado para 0");
                    }, 300);
                }
            }, {
                operation: 'delete_all_records'
            });
        },
        []
    );

    // Wrappers com logging para funções de estado
    const setDeleteProgressWrapper = useCallback((progress: number) => {
        logger.trace("Atualizando progresso de deleção", {
            progressoAnterior: deleteProgress,
            progressoNovo: progress
        });
        setDeleteProgress(progress);
    }, [deleteProgress]);

    const setIsDeletingWrapper = useCallback((deleting: boolean) => {
        logger.debug("Alterando estado de deleção", {
            estadoAnterior: isDeleting,
            estadoNovo: deleting
        });
        setIsDeleting(deleting);
    }, [isDeleting]);

    return {
        eliminarRegistrosSelecionados,
        eliminarTodosRegistros,
        state: { isDeleting, deleteProgress },
        setDeleteProgress: setDeleteProgressWrapper,
        setIsDeleting: setIsDeletingWrapper,
    };
};