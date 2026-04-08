"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useI18n } from "@/context/I18nContext";

type DragPayload =
    | { type: "line"; value: string[] }
    | { type: "lineblock"; value: string }
    | { type: "token"; value: string };

interface DraggableLineListProps {
    tokenizedLines: string[][];
    onDragStart: (e: React.DragEvent, payload: DragPayload) => void;
}

const ITEMS_PER_PAGE = 50; // Quantidade de itens a carregar de cada vez

export default function DraggableLineList({
    tokenizedLines,
    onDragStart,
}: DraggableLineListProps) {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>({});

    // Estado para controlar quantos itens estão visíveis no ecrã
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // Referência para o elemento invisível no fundo da lista
    const observerTarget = useRef<HTMLDivElement>(null);

    const toggleLineExpansion = (i: number) => {
        setExpandedLines((prev) => ({
            ...prev,
            [i]: !prev[i],
        }));
    };

    // 1. Memorizar a lista filtrada para não recalcular em cada render
    const filteredLines = useMemo(() => {
        return tokenizedLines
            .map((lineTokens, originalIndex) => ({ lineTokens, originalIndex }))
            .filter(({ lineTokens }) => {
                if (!searchTerm) return true;
                const lineText = lineTokens.join(" ").toLowerCase();
                return lineText.includes(searchTerm.toLowerCase());
            });
    }, [tokenizedLines, searchTerm]);

    // 2. Sempre que a pesquisa mudar ou o ficheiro mudar, resetamos o contador para 50
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [searchTerm, tokenizedLines]);

    // 3. Intersection Observer: Deteta quando o utilizador faz scroll até ao fundo
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // Se o elemento alvo entrar na área visível
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) =>
                        Math.min(prev + ITEMS_PER_PAGE, filteredLines.length)
                    );
                }
            },
            { rootMargin: "100px" } // Dispara 100px antes de chegar ao fundo real
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
    }, [filteredLines.length]);

    // 4. Pegamos apenas na fatia que queremos renderizar
    const linesToRender = filteredLines.slice(0, visibleCount);
    const hasSearchResults = filteredLines.length > 0;

    return (
        <div className="w-full h-[35vh] md:h-full md:w-1/3 lg:w-1/4 flex flex-col border-b md:border-b-0 md:border-r shrink-0 bg-gray-50/50">
            {/* BARRA DE PESQUISA */}
            <div className="p-3 border-b border-gray-200 bg-gray-50/80 shrink-0">
                <input
                    type="text"
                    placeholder={t("common.search") || "Pesquisar linha..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                />
            </div>

            {/* LISTA DE LINHAS */}
            <div className="p-3 overflow-y-auto flex flex-col gap-2 flex-1 relative">
                {linesToRender.map(({ lineTokens, originalIndex: li }) => {
                    const lineText = lineTokens.join(" ");
                    const isOpen = expandedLines[li];

                    return (
                        <div
                            key={li}
                            draggable
                            onDragStart={(e) => {
                                if ((e.target as HTMLElement).dataset.type === "token") return;

                                onDragStart(
                                    e,
                                    isOpen
                                        ? { type: "line", value: lineTokens }
                                        : { type: "lineblock", value: lineText }
                                );
                            }}
                            className={`border border-gray-200 rounded-lg bg-white flex flex-col transition-all duration-300 shadow-sm ${isOpen ? "flex-[2]" : "flex-none"
                                }`}
                        >
                            <div
                                className="flex justify-between px-3 py-2.5 bg-gray-50/80 cursor-pointer shrink-0 hover:bg-gray-100 transition rounded-t-lg"
                                onClick={() => toggleLineExpansion(li)}
                            >
                                <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2">
                                    {lineTokens.slice(0, 4).join(" ")}
                                    {lineTokens.length > 4 && " ..."}
                                </span>

                                <span className="text-xs text-gray-400">
                                    {isOpen ? "▲" : "▼"}
                                </span>
                            </div>

                            <div
                                className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[300px] p-2 border-t border-gray-100 overflow-y-auto" : "max-h-0 p-0"
                                    }`}
                            >
                                <div className="flex flex-wrap gap-1.5">
                                    {lineTokens.map((token, ti) => (
                                        <div
                                            key={`${li}-${ti}`}
                                            draggable
                                            data-type="token"
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                onDragStart(e, { type: "token", value: token });
                                            }}
                                            className="bg-blue-50 border border-blue-100 text-blue-800 px-2.5 py-1.5 rounded-md text-xs cursor-grab active:cursor-grabbing hover:bg-blue-100 transition"
                                        >
                                            {token}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* ELEMENTO ALVO PARA O INTERSECTION OBSERVER */}
                {visibleCount < filteredLines.length && (
                    <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
                        <span className="text-xs text-gray-400 animate-pulse">A carregar mais...</span>
                    </div>
                )}

                {/* Mensagem Not Found */}
                {!hasSearchResults && tokenizedLines.length > 0 && (
                    <div className="text-center text-xs text-gray-400 py-4 mt-4">
                        Nenhum resultado encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}