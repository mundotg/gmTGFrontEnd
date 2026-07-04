import React, { useMemo } from "react";
import {
    Hash,
    Database,
    Ruler,
    Sigma,
    AlertTriangle
} from "lucide-react";

import { FORMDATA, inputClass, labelClass } from "../utils";

interface DefinicaoPrincipalProps {
    form: FORMDATA;

    updateFormField: <K extends keyof FORMDATA>(
        key: K,
        value: FORMDATA[K]
    ) => void;

    busy: boolean;

    shouldShowLength: boolean;
    shouldShowPrecisionScale: boolean;
    isFloatType: boolean;

    userDbType?: string;

    tiposPorBanco: Record<string, string[]>;

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

    const availableTypes = useMemo(() => {
        if (!userDbType) return [];

        return tiposPorBanco?.[userDbType] || [];
    }, [tiposPorBanco, userDbType]);

    const dbName = useMemo(() => {
        switch (userDbType) {
            case "postgresql":
                return "PostgreSQL";

            case "mysql":
                return "MySQL";

            case "oracle":
                return "Oracle";

            case "sqlserver":
                return "SQL Server";

            case "sqlite":
                return "SQLite";

            case "mongodb":
                return "MongoDB";

            default:
                return userDbType || "Database";
        }
    }, [userDbType]);

    const precisionError =
        form.precision !== undefined &&
        form.scale !== undefined &&
        form.scale > form.precision;

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50">
                        <Hash size={16} className="text-blue-600" />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            {t("fields.mainDefinition") || "Definição Principal"}
                        </h3>

                        <p className="text-xs text-gray-500 mt-0.5">
                            Estrutura principal da coluna no banco de dados
                        </p>
                    </div>
                </div>

                {userDbType && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
                        <Database size={14} className="text-gray-600" />

                        <span className="text-xs font-semibold text-gray-700">
                            {dbName}
                        </span>
                    </div>
                )}
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* COLUMN NAME */}
                <div className="xl:col-span-2">
                    <label className={labelClass}>
                        {t("fields.columnName") || "Nome da Coluna"}

                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                        value={form.nome}
                        onChange={(e) =>
                            updateFormField("nome", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Ex: id, created_at, email, status..."
                        disabled={busy}
                        autoComplete="off"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                        Evite espaços, caracteres especiais e palavras reservadas.
                    </p>
                </div>

                {/* DATA TYPE */}
                <div>
                    <label className={labelClass}>
                        {t("fields.dataType") || "Tipo de Dado"}

                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <div className="relative">
                        <select
                            value={form.tipo}
                            onChange={(e) =>
                                updateFormField(
                                    "tipo",
                                    e.target.value as FORMDATA["tipo"]
                                )
                            }
                            className={`${inputClass} appearance-none cursor-pointer pr-10`}
                            disabled={busy}
                        >
                            <option value="" disabled>
                                -- Selecione o tipo --
                            </option>

                            {availableTypes.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt.toUpperCase()}
                                </option>
                            ))}

                            {!availableTypes.includes(form.tipo) &&
                                form.tipo && (
                                    <option value={form.tipo}>
                                        {String(form.tipo).toUpperCase()}
                                    </option>
                                )}
                        </select>

                        <Database
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                        O tipo define armazenamento, performance e validação dos dados.
                    </p>
                </div>

                {/* LENGTH / PRECISION */}
                <div className="grid grid-cols-2 gap-4">

                    {/* LENGTH */}
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1">
                                <Ruler size={13} />
                                {t("fields.length") || "Tamanho"}
                            </span>
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={form.length ?? ""}
                            onChange={(e) =>
                                updateFormField(
                                    "length",
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                )
                            }
                            className={`${inputClass} transition-opacity ${shouldShowLength
                                ? ""
                                : "opacity-50 cursor-not-allowed"
                                }`}
                            placeholder={
                                shouldShowLength
                                    ? "Ex: 255"
                                    : "Não aplicável"
                            }
                            disabled={busy || !shouldShowLength}
                        />

                        {shouldShowLength && (
                            <p className="mt-1 text-xs text-gray-500">
                                Usado em VARCHAR, CHAR e similares.
                            </p>
                        )}
                    </div>

                    {/* PRECISION */}
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1">
                                <Sigma size={13} />
                                {t("fields.precision") || "Precisão"}
                            </span>
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={form.precision ?? ""}
                            onChange={(e) =>
                                updateFormField(
                                    "precision",
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                )
                            }
                            className={`${inputClass} transition-opacity ${shouldShowPrecisionScale
                                ? ""
                                : "opacity-50 cursor-not-allowed"
                                }`}
                            placeholder={
                                shouldShowPrecisionScale
                                    ? "Ex: 10"
                                    : "Não aplicável"
                            }
                            disabled={busy || !shouldShowPrecisionScale}
                        />

                        {shouldShowPrecisionScale && (
                            <p className="mt-1 text-xs text-gray-500">
                                Total de dígitos suportados.
                            </p>
                        )}
                    </div>
                </div>

                {/* SCALE */}
                {shouldShowPrecisionScale && (
                    <div className="xl:col-span-2 animate-in fade-in duration-200">

                        <label className={labelClass}>
                            {t("fields.scale") || "Escala"}
                        </label>

                        <input
                            type="number"
                            min={0}
                            value={form.scale ?? ""}
                            onChange={(e) =>
                                updateFormField(
                                    "scale",
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                )
                            }
                            className={inputClass}
                            placeholder="Ex: 2"
                            disabled={busy}
                        />

                        <div className="mt-1 flex flex-col gap-1">

                            <p className="text-xs text-gray-500">
                                Quantidade de casas decimais.
                            </p>

                            {precisionError && (
                                <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                    <AlertTriangle size={12} />

                                    Escala não pode ser maior que a precisão.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FLOAT WARNING */}
                {isFloatType && (
                    <div className="xl:col-span-2">
                        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">

                            <AlertTriangle
                                size={16}
                                className="text-amber-600 mt-0.5"
                            />

                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    FLOAT / DOUBLE detectado
                                </p>

                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                    Tipos FLOAT e DOUBLE podem gerar perda de precisão.
                                    Para dados financeiros ou cálculos críticos,
                                    prefira DECIMAL ou NUMERIC.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}