import React from "react";
import { Hash } from "lucide-react"; // Assume que usas lucide-react
import { FORMDATA, inputClass, labelClass } from "../utils";

// Adapta este tipo conforme o que já tens no teu projeto
type tipo_db_Options = string;

interface DefinicaoPrincipalProps {
    // Estado do formulário
    form: FORMDATA;
    updateFormField: <K extends keyof FORMDATA>(key: K, value: FORMDATA[K]) => void;

    // Lógica e Estado UI
    busy: boolean;
    shouldShowLength: boolean;
    shouldShowPrecisionScale: boolean;
    isFloatType: boolean;

    // Dependências de Dados
    userDbType?: string; // Vem de user?.info_extra?.type
    tiposPorBanco: Record<string, string[]>;

    // Estilização e Tradução
    t: (key: string) => string;
}

export default function DefinicaoPrincipal({
    form,
    updateFormField,
    busy,
    shouldShowLength,
    shouldShowPrecisionScale,
    isFloatType,
    userDbType,
    tiposPorBanco,
    t
}: DefinicaoPrincipalProps) {

    // Segurança caso os tipos ainda não tenham carregado
    const availableTypes = userDbType ? tiposPorBanco[userDbType] : [];

    return (
        <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Hash size={16} className="text-blue-600" /> Definição Principal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* NOME DA COLUNA */}
                <div className="md:col-span-2">
                    <label className={labelClass}>
                        {t("fields.columnName") || "Nome da Coluna"} <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={form.nome}
                        onChange={(e) => updateFormField("nome", e.target.value)}
                        className={inputClass}
                        placeholder="Ex: id_usuario, data_criacao..."
                        disabled={busy}
                    />
                </div>

                {/* TIPO DE DADO */}
                <div>
                    <label className={labelClass}>
                        {t("fields.dataType") || "Tipo de Dado"} <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.tipo}
                        onChange={(e) =>
                            updateFormField("tipo", e.target.value as FORMDATA["tipo"])
                        }
                        className={`${inputClass} appearance-none cursor-pointer`}
                        disabled={busy}
                    >
                        <option value="" disabled>
                            -- Selecione o tipo --
                        </option>
                        {availableTypes?.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt.toUpperCase()}
                            </option>
                        ))}
                        {userDbType &&
                            !availableTypes?.includes(form.tipo) &&
                            form.tipo && (
                                <option value={form.tipo}>{String(form.tipo).toUpperCase()}</option>
                            )}
                    </select>
                </div>

                {/* TAMANHO E PRECISÃO */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="animate-in fade-in duration-200">
                        <label className={labelClass}>{t("fields.length") || "Tamanho"}</label>
                        <input
                            type="number"
                            min={1}
                            value={form.length ?? ""}
                            onChange={(e) => updateFormField("length", e.target.value ? Number(e.target.value) : undefined)}
                            className={`${inputClass} ${shouldShowLength ? "" : "opacity-60"}`}
                            placeholder={shouldShowLength ? "Ex: 255" : "(Opcional)"}
                            disabled={busy || !shouldShowLength}
                            title={!shouldShowLength ? "Tamanho é usado principalmente para varchar/char." : undefined}
                        />
                    </div>

                    <div className="animate-in fade-in duration-200">
                        <label className={labelClass}>{t("fields.precision") || "Precisão"}</label>
                        <input
                            type="number"
                            min={1}
                            value={form.precision ?? ""}
                            onChange={(e) => updateFormField("precision", e.target.value ? Number(e.target.value) : undefined)}
                            className={`${inputClass} ${shouldShowPrecisionScale ? "" : "opacity-60"}`}
                            placeholder={shouldShowPrecisionScale ? "Ex: 10" : "(Opcional)"}
                            disabled={busy || !shouldShowPrecisionScale}
                        />
                    </div>

                    {/* ESCALA */}
                    {shouldShowPrecisionScale && (
                        <div className="animate-in fade-in duration-200 col-span-2">
                            <label className={labelClass}>{t("fields.scale") || "Escala"}</label>
                            <input
                                type="number"
                                min={0}
                                value={form.scale ?? ""}
                                onChange={(e) => updateFormField("scale", e.target.value ? Number(e.target.value) : undefined)}
                                className={inputClass}
                                placeholder="Ex: 2"
                                disabled={busy}
                            />
                            {form.precision !== undefined && form.scale !== undefined && form.scale > form.precision && (
                                <p className="mt-1 text-xs text-red-600 font-medium">Escala não pode ser maior que a precisão.</p>
                            )}
                        </div>
                    )}

                    {/* AVISO FLOAT */}
                    {isFloatType && (
                        <p className="col-span-2 text-xs text-gray-500 font-medium">
                            Tipos FLOAT/DOUBLE geralmente não usam precisão/escala como DECIMAL.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}