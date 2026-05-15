import React, { useCallback, useMemo, useEffect } from "react";
import {
    ShieldCheck,
    FileText,
    Plus,
    X,
} from "lucide-react";

import {
    FORMDATA,
    inputClass,
    labelClass,
    defaultValueOptionsGeneric,
} from "../utils";

import { ToggleCard } from "../ToggleCard";

import {
    extrairTipoBase,
    mapColumnTypeToDbType,
} from "@/app/services";

interface AtributosRestricoesProps {
    form: FORMDATA;

    updateFormField: <K extends keyof FORMDATA>(
        key: K,
        value: FORMDATA[K]
    ) => void;

    busy: boolean;
    supportsUnsigned: boolean;
    isEnumType: boolean;

    dbType: string;

    t: (key: string) => string;
}

export default function AtributosRestricoes({
    form,
    updateFormField,
    busy,
    supportsUnsigned,
    isEnumType,
    t,
    dbType,
}: AtributosRestricoesProps) {

    // =====================================================
    // 🔥 TYPE DB
    // =====================================================

    const baseType = useMemo(() => {
        return mapColumnTypeToDbType(
            extrairTipoBase(form.tipo)
        );
    }, [form.tipo]);

    const isNumericType = useMemo(() => {
        return [
            "int",
            "integer",
            "bigint",
            "smallint",
            "decimal",
            "numeric",
            "float",
            "double",
            "real",
            "number",
        ].includes(baseType);
    }, [baseType]);

    const supportsAutoIncrement = isNumericType;

    // =====================================================
    // 🔥 DEFAULTS & REGRAS DE CHAVE ESTRANGEIRA
    // =====================================================

    const defaultValueOptionsByDb = useMemo(() => {
        const base = defaultValueOptionsGeneric;

        const map: Record<string, Record<string, string[]>> = {
            mysql: {
                ...base,
                date: ["", "NULL", "CURRENT_DATE"],
                datetime: ["", "NULL", "CURRENT_TIMESTAMP"],
                timestamp: ["", "NULL", "CURRENT_TIMESTAMP"],
                boolean: ["", "NULL", "0", "1"],
            },
            postgresql: {
                ...base,
                date: ["", "NULL", "CURRENT_DATE"],
                datetime: ["", "NULL", "NOW()"],
                timestamp: ["", "NULL", "NOW()"],
                boolean: ["", "NULL", "true", "false"],
            },
            oracle: {
                ...base,
                date: ["", "NULL", "SYSDATE"],
                datetime: ["", "NULL", "SYSTIMESTAMP"],
                timestamp: ["", "NULL", "SYSTIMESTAMP"],
                boolean: ["", "NULL", "0", "1"],
            },
            sqlserver: {
                ...base,
                date: ["", "NULL", "GETDATE()"],
                datetime: ["", "NULL", "GETDATE()"],
                timestamp: ["", "NULL"],
                boolean: ["", "NULL", "0", "1"],
            },
            sqlite: {
                ...base,
                date: ["", "NULL", "CURRENT_DATE"],
                datetime: ["", "NULL", "CURRENT_TIMESTAMP"],
                timestamp: ["", "NULL", "CURRENT_TIMESTAMP"],
                boolean: ["", "NULL", "0", "1"],
            },
        };

        return map[dbType?.toLowerCase()] || base;
    }, [dbType]);

    const currentDefaults = useMemo(() => {
        if (form.enumValues.length > 0) {
            return ["", ...form.enumValues];
        }

        let defaults = defaultValueOptionsByDb[baseType] || ["", "NULL"];

        // 🚨 REGRA: Se for chave estrangeira, não permite DEFAULT NULL
        if (form.fieldReferences) {
            defaults = defaults.filter((opt) => opt !== "NULL");
        }

        return defaults;
    }, [
        form.enumValues,
        baseType,
        defaultValueOptionsByDb,
        form.fieldReferences, // <-- Adicionado como dependência
    ]);

    // 🚨 REGRA: Limpa o campo caso ele estivesse como NULL e virou Chave Estrangeira
    useEffect(() => {
        if (form.fieldReferences && form.defaultValue === "NULL") {
            updateFormField("defaultValue", "");
        }
    }, [form.fieldReferences, form.defaultValue, updateFormField]);

    // =====================================================
    // 🔥 REGRAS INTELIGENTES
    // =====================================================

    const handlePrimaryKey = (value: boolean) => {
        updateFormField("isPrimaryKey", value);

        if (value) {
            updateFormField("isNullable", false);
            updateFormField("isUnique", true);
        }
    };

    const handleUnique = (value: boolean) => {
        updateFormField("isUnique", value);

        if (value) {
            updateFormField("isNullable", false);
        }
    };

    const handleNullable = (value: boolean) => {
        updateFormField("isNullable", value);

        if (value) {
            updateFormField("isPrimaryKey", false);
            updateFormField("isUnique", false);
        }
    };

    // =====================================================
    // 🔥 ENUM
    // =====================================================

    const addEnumValue = useCallback(() => {
        const val = form.newEnumValue.trim();

        if (val && !form.enumValues.includes(val)) {
            updateFormField("enumValues", [...form.enumValues, val]);
            updateFormField("newEnumValue", "");
        }
    }, [form.newEnumValue, form.enumValues, updateFormField]);

    const removeEnumValue = useCallback((i: number) => {
        updateFormField(
            "enumValues",
            form.enumValues.filter((_, idx) => idx !== i)
        );
    }, [form.enumValues, updateFormField]);

    // =====================================================
    // 🔥 UI
    // =====================================================

    return (
        <div className="space-y-5">
            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}
            <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-blue-600" />
                    Atributos e Restrições
                </h3>
            </div>

            {/* ================================================= */}
            {/* TOGGLES */}
            {/* ================================================= */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                <ToggleCard
                    label="NULL"
                    checked={form.isNullable}
                    onChange={handleNullable}
                    disabled={busy}
                />

                <ToggleCard
                    label="UNIQUE"
                    checked={form.isUnique}
                    onChange={handleUnique}
                    disabled={busy || form.isPrimaryKey}
                />

                <ToggleCard
                    label="PRIMARY"
                    checked={form.isPrimaryKey}
                    onChange={handlePrimaryKey}
                    isPrimary
                    disabled={busy}
                />

                <ToggleCard
                    label="AUTO INC"
                    checked={form.isAutoIncrement}
                    onChange={(v: boolean) => updateFormField("isAutoIncrement", v)}
                    disabled={busy || !supportsAutoIncrement}
                />

                <ToggleCard
                    label="UNSIGNED"
                    checked={supportsUnsigned ? form.isUnsigned : false}
                    onChange={(v: boolean) => updateFormField("isUnsigned", v)}
                    disabled={busy || !supportsUnsigned || !isNumericType}
                />
            </div>

            {/* ================================================= */}
            {/* DEFAULT + COMMENT */}
            {/* ================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>
                        {t("fields.defaultValue") || "Valor Padrão"}
                    </label>

                    <select
                        value={form.defaultValue}
                        onChange={(e) => updateFormField("defaultValue", e.target.value)}
                        className={`${inputClass} text-sm`}
                        disabled={busy}
                    >
                        {currentDefaults.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt === "" ? "-- Nenhum --" : opt}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>
                        <FileText size={13} className="inline mr-1" />
                        {t("fields.comment") || "Comentário"}
                    </label>

                    <input
                        value={form.comentario}
                        onChange={(e) => updateFormField("comentario", e.target.value)}
                        className={`${inputClass} text-sm`}
                        placeholder="Descrição do campo..."
                        disabled={busy}
                    />
                </div>
            </div>

            {/* ================================================= */}
            {/* ENUM */}
            {/* ================================================= */}
            {isEnumType && (
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
                    <label className={labelClass}>Valores ENUM</label>

                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <input
                            value={form.newEnumValue}
                            onChange={(e) => updateFormField("newEnumValue", e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addEnumValue();
                                }
                            }}
                            className={`${inputClass} text-sm`}
                            placeholder="Novo valor..."
                            disabled={busy}
                        />

                        {/* Botão Menor e Estável */}
                        <button
                            type="button"
                            onClick={addEnumValue}
                            disabled={busy}
                            className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                            <Plus size={14} />
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {form.enumValues.map((val, i) => (
                            <span
                                key={`${val}-${i}`}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs sm:text-sm text-gray-700"
                            >
                                {val}

                                <button
                                    type="button"
                                    onClick={() => removeEnumValue(i)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    disabled={busy}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}

                        {form.enumValues.length === 0 && (
                            <span className="text-xs text-gray-500 italic">
                                Nenhum ENUM definido.
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}