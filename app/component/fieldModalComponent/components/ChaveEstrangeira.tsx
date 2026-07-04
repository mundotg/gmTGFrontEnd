import React, { useEffect, useState } from "react";
import { LinkIcon, AlertCircle } from "lucide-react";
import { JoinSelect } from "../../BuildQueryComponent/JoinSelect";
import { FORMDATA, inputClass, labelClass } from "../utils";

interface ChaveEstrangeiraProps {
    // Estado do formulário tipado com base no FORMDATA global
    form: Pick<
        FORMDATA,
        "referencedTable" | "fieldReferences" | "onDeleteAction" | "onUpdateAction" | "isForeignKey"
    >;
    updateFormField: <K extends keyof FORMDATA>(key: K, value: FORMDATA[K]) => void;

    // Lógica e Estado UI
    busy: boolean;
    isForeignKey: boolean;
    useJoinForFieldReferences: boolean;

    // Dependências
    tabelaExistenteNaDB: string[];
    getTableColumns?: (tableName: string) => Promise<string[] | void> | string[] | void;
}

export default function ChaveEstrangeira({
    form,
    updateFormField,
    busy,
    isForeignKey,
    useJoinForFieldReferences,
    tabelaExistenteNaDB,
    getTableColumns,
}: ChaveEstrangeiraProps) {
    // =====================================================
    // 🔥 ESTADO: Colunas da tabela referenciada
    // =====================================================
    const [refCols, setRefCols] = useState<string[]>([]);
    const [refColsLoading, setRefColsLoading] = useState(false);
    const [refColsError, setRefColsError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const fetchColumns = async () => {
            const rt = form.referencedTable?.trim();

            if (!rt || !getTableColumns || !isForeignKey) {
                setRefCols([]);
                setRefColsError(null);
                return;
            }

            setRefColsLoading(true);
            setRefColsError(null);

            try {
                const res = await Promise.resolve(getTableColumns(rt));
                if (!alive) return;

                const list = (res || [])
                    .map(String)
                    .map((s) => s.trim())
                    .filter(Boolean);

                setRefCols(list);
            } catch (e: unknown) {
                if (!alive) return;
                setRefCols([]);
                const errorMessage = e instanceof Error ? e.message : "Falha ao carregar colunas.";
                setRefColsError(errorMessage);
            } finally {
                if (alive) {
                    setRefColsLoading(false);
                }
            }
        };

        fetchColumns();

        return () => {
            alive = false;
        };
    }, [form.referencedTable, getTableColumns, isForeignKey]);

    // =====================================================
    // 🔥 UI
    // =====================================================

    // Fallback: Se der erro na busca ou não for para usar o JoinSelect, usamos um input simples.
    const renderFieldReferencesInput = () => {
        if (!useJoinForFieldReferences || refColsError) {
            return (
                <div className="space-y-2">
                    <input
                        value={form.fieldReferences}
                        onChange={(e) => updateFormField("fieldReferences", e.target.value)}
                        className={`${inputClass} bg-white`}
                        placeholder="Ex: id"
                        disabled={busy}
                    />
                    {refColsError && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <AlertCircle size={12} />
                            Erro ao buscar colunas. Entrada manual liberada.
                        </p>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-2">
                <JoinSelect
                    onChange={(value: string) => updateFormField("fieldReferences", value)}
                    className="w-full bg-white border border-gray-300 rounded-xl"
                    placeholder={refColsLoading ? "Carregando colunas..." : "Ex: id"}
                    value={form.fieldReferences}
                    options={refCols}
                    disabled={busy || refColsLoading}
                />
                {!refColsLoading && !refColsError && refCols.length === 0 && form.referencedTable && (
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Nenhuma coluna encontrada para esta tabela.
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className={`p-5 rounded-2xl transition-colors duration-200 border ${isForeignKey ? "bg-blue-50/30 border-blue-200" : "bg-gray-50 border-gray-200"}`}>

            {/* HEADER COM CHECKBOX */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="isForeignKeyToggle"
                    checked={form.isForeignKey}
                    onChange={(e) => updateFormField("isForeignKey", e.target.checked)}
                    disabled={busy}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                    htmlFor="isForeignKeyToggle"
                    className="text-sm font-bold text-gray-900 flex items-center gap-2 cursor-pointer select-none"
                >
                    <LinkIcon size={16} className={isForeignKey ? "text-blue-600" : "text-gray-400"} />
                    Definir como Chave Estrangeira
                </label>
            </div>

            {/* CONTEÚDO EXPANSÍVEL (Só aparece se o checkbox estiver marcado) */}
            {form.isForeignKey && (
                <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* ======================================= */}
                        {/* TABELA REFERENCIADA */}
                        {/* ======================================= */}
                        <div>
                            <label className={labelClass}>Tabela Referenciada</label>
                            <JoinSelect
                                onChange={(value: string) => updateFormField("referencedTable", value)}
                                className="w-full bg-white border border-gray-300 rounded-xl mt-1"
                                placeholder={"Ex: " + (tabelaExistenteNaDB[0] || "usuarios")}
                                value={form.referencedTable}
                                options={tabelaExistenteNaDB}
                                disabled={busy}
                            />
                        </div>

                        {/* ======================================= */}
                        {/* COLUNA REFERENCIADA */}
                        {/* ======================================= */}
                        <div>
                            <label className={labelClass}>Coluna Referenciada</label>
                            <div className="mt-1">
                                {renderFieldReferencesInput()}
                            </div>
                        </div>
                    </div>

                    {/* ======================================= */}
                    {/* COMPORTAMENTO ON DELETE / ON UPDATE */}
                    {/* ======================================= */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100">
                        <div>
                            <label className={labelClass}>Comportamento ON DELETE</label>
                            <JoinSelect
                                onChange={(value: string) => updateFormField("onDeleteAction", value)}
                                className="w-full bg-white border border-gray-300 rounded-xl mt-1"
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
                                className="w-full bg-white border border-gray-300 rounded-xl mt-1"
                                placeholder="ON UPDATE"
                                value={form.onUpdateAction}
                                options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT", "SET DEFAULT"]}
                                disabled={busy}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}