import React, { useCallback, useMemo } from "react";
import { ShieldCheck, FileText, Plus, X } from "lucide-react";
import { FORMDATA, inputClass, labelClass, defaultValueOptionsGeneric } from "../utils"; // 🔥 Faltava importar defaultValueOptionsGeneric
import { ToggleCard } from "../ToggleCard";
import { extrairTipoBase, mapColumnTypeToDbType } from "@/app/services";

interface AtributosRestricoesProps {
    // Estado do formulário
    form: FORMDATA;
    updateFormField: <K extends keyof FORMDATA>(key: K, value: FORMDATA[K]) => void;

    // Lógica e Estado UI
    busy: boolean;
    supportsUnsigned: boolean;
    isEnumType: boolean;

    dbType: string;
    // Estilização e Tradução
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

    const defaultValueOptionsByDb = useMemo(() => {
        const base = defaultValueOptionsGeneric;

        const mysql = {
            ...base,
            date: ["", "NULL", "CURRENT_DATE"],
            datetime: ["", "NULL", "CURRENT_TIMESTAMP"],
            timestamp: ["", "NULL", "CURRENT_TIMESTAMP"],
            boolean: ["", "NULL", "0", "1"],
        };

        const postgres = {
            ...base,
            date: ["", "NULL", "CURRENT_DATE"],
            timestamp: ["", "NULL", "CURRENT_TIMESTAMP", "NOW()"],
            datetime: ["", "NULL", "CURRENT_TIMESTAMP", "NOW()"],
            boolean: ["", "NULL", "true", "false"],
        };

        const sqlserver = {
            ...base,
            date: ["", "NULL", "CAST(GETDATE() AS date)"],
            datetime: ["", "NULL", "GETDATE()"],
            timestamp: ["", "NULL"],
            boolean: ["", "NULL", "0", "1"],
        };

        const sqlite = {
            ...base,
            date: ["", "NULL", "CURRENT_DATE"],
            datetime: ["", "NULL", "CURRENT_TIMESTAMP"],
            timestamp: ["", "NULL", "CURRENT_TIMESTAMP"],
            boolean: ["", "NULL", "0", "1"],
        };

        const map: Record<string, Record<string, string[]>> = {
            mysql,
            mariadb: mysql,
            postgres,
            postgresql: postgres,
            sqlserver,
            mssql: sqlserver,
            sqlite,
        };

        return map[dbType] || base;
    }, [dbType]);

    const currentDefaults = useMemo(() => {
        if (form.enumValues.length > 0) return ["", ...form.enumValues];

        const baseType = mapColumnTypeToDbType(extrairTipoBase(form.tipo));
        return defaultValueOptionsByDb[baseType] || ["", "NULL"];
    }, [form.tipo, form.enumValues, defaultValueOptionsByDb]);

    // =========================
    // ✅ ENUM handlers (Corrigidos para usar updateFormField em vez de setForm)
    // =========================
    const addEnumValue = useCallback(() => {
        const val = form.newEnumValue.trim();
        if (val && !form.enumValues.includes(val)) {
            // Atualiza os dois campos diretamente no pai
            updateFormField("enumValues", [...form.enumValues, val]);
            updateFormField("newEnumValue", "");
        }
    }, [form.newEnumValue, form.enumValues, updateFormField]);

    const removeEnumValue = useCallback((i: number) => {
        const novosEnums = form.enumValues.filter((_, idx) => idx !== i);
        updateFormField("enumValues", novosEnums);
    }, [form.enumValues, updateFormField]);

    return (
        <>
            {/* Restrições */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" /> Atributos e Restrições
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <ToggleCard label="Aceita NULL" checked={form.isNullable} onChange={(v: boolean) => updateFormField("isNullable", v)} disabled={busy} />
                    <ToggleCard label="Único (UNIQUE)" checked={form.isUnique} onChange={(v: boolean) => updateFormField("isUnique", v)} disabled={busy} />
                    <ToggleCard label="Chave Primária" checked={form.isPrimaryKey} onChange={(v: boolean) => updateFormField("isPrimaryKey", v)} isPrimary disabled={busy} />
                    <ToggleCard label="Auto Increment" checked={form.isAutoIncrement} onChange={(v: boolean) => updateFormField("isAutoIncrement", v)} disabled={busy} />

                    <ToggleCard
                        label="Unsigned"
                        checked={supportsUnsigned ? form.isUnsigned : false}
                        onChange={(v: boolean) => updateFormField("isUnsigned", v)}
                        disabled={busy || !supportsUnsigned}
                        hint={!supportsUnsigned ? "Unsigned só é suportado em MySQL/MariaDB." : undefined}
                    />
                </div>
            </div>

            {/* Default e Comentário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                    <label className={labelClass}>{t("fields.defaultValue") || "Valor Padrão (Default)"}</label>
                    <select
                        value={form.defaultValue}
                        onChange={(e) => updateFormField("defaultValue", e.target.value)}
                        className={`${inputClass} appearance-none cursor-pointer`}
                        disabled={busy}
                    >
                        {currentDefaults.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt === "" ? "-- Sem valor padrão --" : opt}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>
                        <FileText size={14} className="inline mr-1" /> {t("fields.comment") || "Dicionário de Dados (Comentário)"}
                    </label>
                    <input
                        value={form.comentario}
                        onChange={(e) => updateFormField("comentario", e.target.value)}
                        className={inputClass}
                        placeholder="Descreva o propósito deste campo..."
                        disabled={busy}
                    />
                </div>
            </div>

            {/* ENUM */}
            {isEnumType && (
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl animate-in fade-in mt-6">
                    <label className={labelClass}>Valores ENUM Restritos</label>

                    <div className="flex gap-3 mb-4 mt-2">
                        <input
                            value={form.newEnumValue}
                            onChange={(e) => updateFormField("newEnumValue", e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addEnumValue();
                                }
                            }}
                            className={inputClass}
                            placeholder="Novo valor permitido..."
                            disabled={busy}
                        />
                        <button
                            type="button"
                            onClick={addEnumValue}
                            disabled={busy}
                            className="px-5 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {form.enumValues.map((val, i) => (
                            <span
                                key={`${val}-${i}`}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm"
                            >
                                {val}
                                <button
                                    type="button"
                                    onClick={() => removeEnumValue(i)}
                                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                    aria-label={`Remover enum ${val}`}
                                    disabled={busy}
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {form.enumValues.length === 0 && (
                            <span className="text-xs text-gray-500 italic">Nenhum valor ENUM definido.</span>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}