"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/context/I18nContext";
import DynamicInputByTypeWithNullable from "@/app/component/DynamicInputByTypeWithNullable";
import { CampoDetalhado } from "@/types"; // Ajusta o caminho se necessário

// Tipagem do payload de Drag & Drop
type DragPayload =
    | { type: "line"; value: string[] }
    | { type: "lineblock"; value: string }
    | { type: "token"; value: string; fromField?: string; index?: number };

interface MapperFormGridProps {
    fields: CampoDetalhado[];

    // Estados do Mapper
    mappedTokens: Record<string, string[]>;
    dragOverField: string | null;
    selectedTokens: string[];
    editingToken: { field: string; index: number } | null;

    // Ações do Mapper
    handleDropField: (e: React.DragEvent, fieldKey: string) => void;
    setDragOverField: (fieldKey: string | null) => void;
    mergeSelectedTokens: (fieldKey: string) => void;
    getFieldValue: (fieldKey: string) => string;
    clearFieldTokens: (fieldKey: string) => void;
    handleDragStart: (e: React.DragEvent, payload: DragPayload) => void;
    setSelectedTokens: React.Dispatch<React.SetStateAction<string[]>>;
    setEditingToken: React.Dispatch<React.SetStateAction<{ field: string; index: number } | null>>;
    updateToken: (fieldKey: string, index: number, value: string) => void;
    removeToken: (fieldKey: string, index: number) => void;
    setManualValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const ITEMS_PER_PAGE = 20;

// ==========================================
// VALIDADOR DE TIPOS DE DADOS
// ==========================================
const validateValueType = (value: string, type: string): boolean => {
    if (!value || value.trim() === "") return true; // Ignora validação se estiver vazio (o "NOT NULL" deve ser validado na gravação final)

    const t = (type || "").toLowerCase();

    // Numéricos
    if (t.includes("int") || t.includes("float") || t.includes("decimal") || t.includes("numeric") || t === "number" || t.includes("double")) {
        // Limpa espaços e substitui vírgulas por pontos antes de testar
        const cleanVal = value.replace(/\s/g, '').replace(',', '.');
        return !isNaN(Number(cleanVal));
    }

    // Datas
    if (t.includes("date") || t.includes("time") || t.includes("timestamp")) {
        // Aceita formatos DD/MM/YYYY, YYYY/MM/DD ou validações nativas do JS
        const datePattern = /^(\d{2}|\d{4})[-/]\d{2}[-/](\d{2}|\d{4})/;
        return datePattern.test(value) || !isNaN(Date.parse(value));
    }

    // Booleanos
    if (t.includes("bool") || t.includes("bit")) {
        const lowerVal = value.toLowerCase().trim();
        return ["true", "false", "1", "0", "sim", "não", "nao", "yes", "no"].includes(lowerVal);
    }

    // Texto, Varchar, Enum, etc. aceitam qualquer string
    return true;
};

export default function MapperFormGrid({
    fields,
    mappedTokens,
    dragOverField,
    selectedTokens,
    editingToken,
    handleDropField,
    setDragOverField,
    mergeSelectedTokens,
    getFieldValue,
    clearFieldTokens,
    handleDragStart,
    setSelectedTokens,
    setEditingToken,
    updateToken,
    removeToken,
    setManualValues,
}: MapperFormGridProps) {
    const { t } = useI18n();

    // Estado da Pesquisa
    const [searchQuery, setSearchQuery] = useState("");

    // Estado para o scroll infinito
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const observerTarget = useRef<HTMLDivElement>(null);

    // 1. Filtrar os campos pela pesquisa
    const filteredFields = useMemo(() => {
        if (!searchQuery.trim()) return fields;

        const lowerQuery = searchQuery.toLowerCase();
        return fields.filter(col => col.nome.toLowerCase().includes(lowerQuery));
    }, [fields, searchQuery]);

    // Reseta a contagem se a lista de campos ou a pesquisa mudar
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [fields, searchQuery]);

    // Intersection Observer para carregar mais campos no scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredFields.length));
                }
            },
            { rootMargin: "200px" }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [filteredFields.length]);

    // Fatia de campos a renderizar atualmente baseada nos campos filtrados
    const fieldsToRender = filteredFields.slice(0, visibleCount);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">

            {/* HEADER DA GRELHA (Barra de Pesquisa) */}
            <div className="p-3 md:p-4 border-b border-gray-200 bg-white shrink-0">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">🔍</span>
                    </div>
                    <input
                        type="text"
                        placeholder={t("common.search") || "Pesquisar nome do campo..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* ÁREA COM SCROLL DA GRELHA */}
            <div className="flex-1 p-3 md:p-4 overflow-y-auto relative">

                {filteredFields.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                        {t("common.noResults") || "Nenhum campo encontrado para a sua pesquisa."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {fieldsToRender.map((col) => {
                            const fieldKey = col.nome;
                            const currentValue = getFieldValue(fieldKey);

                            // VALIDAÇÃO EM TEMPO REAL
                            const isTypeValid = validateValueType(currentValue, col.tipo);

                            return (
                                <div
                                    key={fieldKey}
                                    onDrop={(e) => handleDropField(e, fieldKey)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverField(fieldKey);
                                    }}
                                    onDragLeave={() => setDragOverField(null)}
                                    className={`border rounded-xl bg-gray-50 p-3 flex flex-col gap-3 min-h-[160px] shadow-sm transition-colors duration-300 ${!isTypeValid
                                        ? "border-red-400 bg-red-50/30"
                                        : "border-gray-200"
                                        }`}
                                >
                                    {/* FIELD HEADER */}
                                    <div className="flex justify-between items-center text-xs shrink-0 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold uppercase tracking-wide ${!isTypeValid ? "text-red-700" : "text-gray-700"}`}>
                                                {fieldKey}
                                            </span>
                                            {/* BADGE DE TIPO */}
                                            <span className="text-[10px] font-semibold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                {col.tipo}
                                            </span>
                                            {!col.is_nullable && (
                                                <span className="text-red-500 font-bold" title="Campo Obrigatório">*</span>
                                            )}
                                        </div>

                                        <div className="flex gap-2 sm:gap-3 text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                                            <button onClick={() => mergeSelectedTokens(fieldKey)} className="hover:text-blue-600 font-medium transition">
                                                {t("tokenMapper.merge") || "Unir"}
                                            </button>
                                            <span className="w-px h-3 bg-gray-300 self-center"></span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(currentValue)}
                                                className="hover:text-blue-600 font-medium transition"
                                            >
                                                {t("tokenMapper.copy") || "Copiar"}
                                            </button>
                                            <span className="w-px h-3 bg-gray-300 self-center"></span>
                                            <button onClick={() => clearFieldTokens(fieldKey)} className="hover:text-red-500 font-medium transition">
                                                {t("tokenMapper.clear") || "Limpar"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* DROP ZONE */}
                                    <div
                                        className={`flex-1 overflow-y-auto flex flex-wrap content-start gap-1.5 p-2.5 rounded-lg border-2 border-dashed transition-colors ${dragOverField === fieldKey
                                            ? "border-blue-400 bg-blue-50/50"
                                            : !isTypeValid
                                                ? "border-red-300 bg-white hover:border-red-400"
                                                : "border-gray-300 bg-white hover:border-gray-400"
                                            }`}
                                    >
                                        {(mappedTokens[fieldKey] || []).length === 0 && (
                                            <span className="text-xs text-gray-400 m-auto pointer-events-none text-center px-4">
                                                {t("tokenMapper.dragHere") || "Arrasta tokens ou clica neles..."}
                                            </span>
                                        )}

                                        {(mappedTokens[fieldKey] || []).map((token, i) => (
                                            <span
                                                key={i}
                                                data-index={i}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    handleDragStart(e, {
                                                        type: "token",
                                                        value: token,
                                                        fromField: fieldKey,
                                                        index: i,
                                                    });
                                                }}
                                                onClick={() =>
                                                    setSelectedTokens((prev) =>
                                                        prev.includes(token)
                                                            ? prev.filter((t) => t !== token)
                                                            : [...prev, token]
                                                    )
                                                }
                                                onDoubleClick={() => setEditingToken({ field: fieldKey, index: i })}
                                                className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer flex items-center gap-1.5 shadow-sm border transition-colors ${selectedTokens.includes(token)
                                                    ? "bg-purple-100 border-purple-200 text-purple-800"
                                                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                                    }`}
                                            >
                                                {editingToken?.field === fieldKey && editingToken?.index === i ? (
                                                    <input
                                                        autoFocus
                                                        value={token}
                                                        onChange={(e) => updateToken(fieldKey, i, e.target.value)}
                                                        onBlur={() => setEditingToken(null)}
                                                        className="text-xs bg-white border border-emerald-300 px-1 py-0.5 w-full rounded outline-none ring-1 ring-emerald-500"
                                                    />
                                                ) : (
                                                    <>
                                                        {token}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeToken(fieldKey, i);
                                                            }}
                                                            className="text-red-400 hover:text-red-600 focus:outline-none ml-1 opacity-70 hover:opacity-100"
                                                            aria-label="Remover token"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                            </span>
                                        ))}
                                    </div>

                                    {/* MENSAGEM DE ERRO DE TIPO */}
                                    {!isTypeValid && (
                                        <div className="text-xs text-red-600 font-medium px-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            {t("forms.invalidType") || `Valor inválido. Esperado formato compatível com: ${col.tipo}`}
                                        </div>
                                    )}

                                    {/* MANUAL INPUT */}
                                    <div className="mt-1">
                                        <DynamicInputByTypeWithNullable
                                            enum_values={col.enum_valores_encontrados}
                                            type={col.tipo}
                                            is_nullable={col.is_nullable}
                                            value={currentValue}
                                            onChange={(val) =>
                                                setManualValues((prev) => ({
                                                    ...prev,
                                                    [fieldKey]: val,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ALVO PARA O INTERSECTION OBSERVER */}
                {visibleCount < filteredFields.length && (
                    <div ref={observerTarget} className="w-full h-16 flex items-center justify-center mt-4">
                        <span className="text-xs text-gray-400 animate-pulse">A carregar mais campos...</span>
                    </div>
                )}
            </div>
        </div>
    );
}