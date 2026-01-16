"use client";
import { useState, Dispatch, SetStateAction, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { DBConnection } from "@/types/db-structure";
import { Option } from "@/app/task/components/select_Component";
import QueryBuilderComponent from "@/app/component/query-builder-component";
import { MetadataTableResponse, QueryPayload } from "@/types";
import { LabeledSelect } from "@/app/component/LabeledSelect";

interface Step2TablesQueryProps {
    sourceConnection?: DBConnection;
    targetConnection?: DBConnection;
    selectedTables: Record<string, string>;
    setSelectedTables: Dispatch<SetStateAction<Record<string, string>>>;
    onSelectAll: (all: Record<string, string>) => void;
    onClearSelection: () => void;
    listTarget: Option[];
}

export const Step2QueryTables: React.FC<Step2TablesQueryProps> = ({
    sourceConnection,
    selectedTables,
    setSelectedTables,
    listTarget,
}) => {

    const [queryLimit,] = useState("100");
    const [tableList, setTableList] = useState<string[]>([]);
    const [selectColumns, setSelectColumns] = useState<string[]>([]);
    const [aliasTables, setAliasTables] = useState<Record<string, string>>({});
    const [loadingQuery, setLoadingQuery] = useState(false);
    const [querySelected, setQuerySelected] = useState<QueryPayload | null>(null);

    const [columnsInfo, setColumnsInfo] = useState<MetadataTableResponse[]>([]);

    // ============================================================
    //  Executar Query
    // ============================================================
    const handleExecuteQuery = useCallback(
        async (query: QueryPayload) => {
            setLoadingQuery(true);

            try {
                query.limit = parseInt(queryLimit, 10);
                setQuerySelected(query);
            } catch (err) {
                console.error("❌ Erro ao executar query:", err);
            } finally {
                setLoadingQuery(false);
            }
        },
        [queryLimit]
    );

    // ============================================================
    //  Adicionar nova tabela
    // ============================================================
    const adicionarTabela = useCallback(
        async (tableNameSource: string) => {
            if (!tableNameSource) return;

            setTableList((prev) =>
                prev.includes(tableNameSource) ? prev : [...prev, tableNameSource]
            );

            const tabela = sourceConnection?.structures?.find(
                (t) => t.table_name === tableNameSource
            );

            if (tabela) {
                setColumnsInfo((prev) => {
                    const exists = prev.some((c) => c.table_name === tableNameSource);
                    if (exists) return prev;

                    return [
                        ...prev,
                        {
                            message: "OK",
                            executado_em: new Date().toISOString(),
                            connection_id: sourceConnection?.id || 0,
                            schema_name: tabela.schema_name ?? "",
                            table_name: tabela.table_name,
                            total_colunas: tabela.fields?.length ?? 0,
                            colunas:
                                tabela.fields?.map((field) => ({
                                    nome: field.name,
                                    tipo: field.type,
                                    is_nullable: field.is_nullable ?? false,
                                    is_primary_key: field.is_primary_key ?? false,
                                    is_foreign_key: field.is_foreign_key ?? false,
                                    is_auto_increment: field.is_auto_increment ?? false,
                                    referenced_table: field.referenced_table ?? null,
                                    field_references: field.referenced_field ?? null,
                                    is_unique: field.is_unique ?? false,
                                    default: field.default_value ?? null,
                                    comentario: field.comment ?? null,
                                    length: field.length ?? null,
                                    enum_valores_encontrados: field.enum_values ?? [],
                                    on_delete_action: field.fk_on_delete?.toString(),
                                    on_update_action: field.fk_on_update?.toString(),
                                })) ?? [],
                        },
                    ];
                });
            }
        },
        [sourceConnection]
    );

    // ============================================================
    //  UI
    // ============================================================
    if (!sourceConnection) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Carregando tabelas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transferência por Query Select (Tabelas)
            </h3>

            <LabeledSelect
                label="Tabelas"
                value={tableList}
                onChange={adicionarTabela}
                options={sourceConnection.structures?.map((t) => ({
                    value: t.table_name,
                    label: `${t.table_name} (id:${t.id})`,
                })) || []}
                maxSelections={16}
            />

            <QueryBuilderComponent
                columns={columnsInfo}
                table_list={tableList}
                setTable_list={setTableList}
                onExecuteQuery={handleExecuteQuery}
                title={`Consulta: ${sourceConnection.name}`}
                maxConditions={25}
                showLogicalOperators
                setSelect={setSelectColumns}
                select={selectColumns}
                setAliasTables={setAliasTables}
                aliasTables={aliasTables}
                isExecuting={loadingQuery}
            />

            <div className="flex justify-between items-center text-sm mt-4 px-1">
                <span className="text-gray-600 font-medium">
                    {Object.keys(selectedTables).length} de{" "}
                    {sourceConnection.structures?.length || 0} tabela(s) selecionada(s)
                </span>
            </div>

            {querySelected?.aliaisTables && (
                <div className="border rounded-lg p-4 bg-gray-50 shadow-sm mt-6">
                    <h4 className="text-md font-semibold mb-3 text-gray-800">
                        Selecione a tabela de destino:
                    </h4>

                    <div className="space-y-2">
                        {listTarget.map((tabela, index) => (
                            <div
                                key={tabela.value}
                                className="flex items-center gap-3 p-2 border rounded hover:bg-white cursor-pointer"
                                onClick={() =>
                                    setSelectedTables({
                                        [String(querySelected.baseTable || "query") + index]:
                                            tabela.value,
                                    })
                                }
                            >
                                <span className="text-gray-700">{tabela.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
