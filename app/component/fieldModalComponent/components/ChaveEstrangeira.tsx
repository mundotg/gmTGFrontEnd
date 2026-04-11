import React, { useEffect, useState } from "react";
import { LinkIcon } from "lucide-react";
import { JoinSelect } from "../../BuildQueryComponent/JoinSelect";
import { FORMDATA, inputClass, labelClass } from "../utils";

interface ChaveEstrangeiraProps {
    // Estado do formulário
    form: {
        referencedTable: string;
        fieldReferences: string;
        onDeleteAction: string;
        onUpdateAction: string;
    };
    updateFormField: <K extends keyof FORMDATA>(key: K, value: FORMDATA[K]) => void;

    // Lógica e Estado UI
    busy: boolean;
    isForeignKey: boolean;
    useJoinForFieldReferences: boolean;

    // Dependências Assíncronas / Dados
    tabelaExistenteNaDB: string[];

    // 🔥 CORREÇÃO: Faltava adicionar a tipagem para o getTableColumns
    getTableColumns?: (tableName: string) => Promise<string[] | void> | string[] | void;
}

export default function ChaveEstrangeira({
    form,
    updateFormField,
    busy,
    isForeignKey,
    useJoinForFieldReferences,
    tabelaExistenteNaDB,
    getTableColumns, // 🔥 CORREÇÃO: Faltava receber a função aqui
}: ChaveEstrangeiraProps) {

    // =========================
    // ✅ Colunas da tabela referenciada (JoinSelect)
    // =========================
    const [refCols, setRefCols] = useState<string[]>([]);
    const [refColsLoading, setRefColsLoading] = useState(false);
    const [refColsError, setRefColsError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const run = async () => {
            setRefColsError(null);

            const rt = form.referencedTable.trim();
            // Se não houver tabela ou se a função não foi passada, limpa e sai
            if (!rt || !getTableColumns) {
                setRefCols([]);
                return;
            }

            setRefColsLoading(true);
            try {
                const res = await Promise.resolve(getTableColumns(rt));
                if (!alive) return;
                const list = (res || []).map(String).map((s) => s.trim()).filter(Boolean);
                setRefCols(list);
            } catch (e: unknown) { // 🔥 MELHORIA: unknown em vez de any é mais seguro no TS
                if (!alive) return;
                setRefCols([]);
                const errorMessage = e instanceof Error ? e.message : "Falha ao carregar colunas da tabela.";
                setRefColsError(errorMessage);
            } finally {
                if (alive) setRefColsLoading(false);
            }
        };

        run();
        return () => {
            alive = false;
        };
    }, [form.referencedTable, getTableColumns]);

    return (
        <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <LinkIcon size={16} className="text-blue-600" /> Relacionamento (Chave Estrangeira)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* TABELA REFERENCIADA */}
                <div>
                    <label className={labelClass}>Tabela Referenciada</label>
                    <JoinSelect
                        onChange={(value: string) => updateFormField("referencedTable", value)}
                        className="w-full bg-white border border-gray-300 rounded-xl"
                        placeholder={"Ex: " + (tabelaExistenteNaDB[0] || "usuarios")}
                        value={form.referencedTable}
                        options={tabelaExistenteNaDB}
                        disabled={busy}
                    />
                </div>

                {/* COLUNA REFERENCIADA */}
                <div>
                    <label className={labelClass}>Coluna Referenciada</label>

                    {useJoinForFieldReferences ? (
                        <div className="space-y-2">
                            <JoinSelect
                                onChange={(value: string) => updateFormField("fieldReferences", value)}
                                className="w-full bg-white border border-gray-300 rounded-xl"
                                placeholder={refColsLoading ? "Carregando colunas..." : "Ex: id"}
                                value={form.fieldReferences}
                                options={refCols}
                                disabled={busy || refColsLoading}
                            />
                            {refColsError && (
                                <p className="text-xs text-red-600 font-semibold">
                                    {refColsError} (vou te deixar digitar se quiser: remove o loader ou trata no service)
                                </p>
                            )}
                            {!refColsLoading && !refColsError && refCols.length === 0 && (
                                <p className="text-xs text-gray-500 font-medium">
                                    Nenhuma coluna encontrada para essa tabela (ou teu loader retornou vazio).
                                </p>
                            )}
                        </div>
                    ) : (
                        <input
                            value={form.fieldReferences}
                            onChange={(e) => updateFormField("fieldReferences", e.target.value)}
                            className={`${inputClass} bg-white`}
                            placeholder="Ex: id"
                            disabled={busy}
                        />
                    )}
                </div>
            </div>

            {/* COMPORTAMENTO ON DELETE / ON UPDATE */}
            {isForeignKey && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-200 animate-in fade-in">
                    <div>
                        <label className={labelClass}>Comportamento ON DELETE</label>
                        <JoinSelect
                            onChange={(value: string) => updateFormField("onDeleteAction", value)}
                            className="w-full bg-white border border-gray-300 rounded-xl"
                            placeholder="ON DELETE"
                            value={form.onDeleteAction}
                            options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT", "SET DEFAULT"]}
                            disabled={busy}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Comportamento ON UPDATE</label>
                        <JoinSelect
                            onChange={(value: string) => updateFormField("onUpdateAction", value)}
                            className="w-full bg-white border border-gray-300 rounded-xl"
                            placeholder="ON UPDATE"
                            value={form.onUpdateAction}
                            options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT", "SET DEFAULT"]}
                            disabled={busy}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}