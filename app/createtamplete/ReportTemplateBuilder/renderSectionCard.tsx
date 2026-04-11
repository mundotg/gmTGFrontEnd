import React from "react";
import {
    Trash2, Copy, ArrowUp, ArrowDown,
    AlignLeft, Image as ImageIcon, Table,
    List, Minus, Maximize2
} from "lucide-react";
import { Section, SectionType } from "../types";

// Interface para as dependências do card
interface SectionCardProps {
    section: Section;
    index: number;
    totalSections: number;
    isSelected: boolean;
    hasError: boolean;
    onSelect: (id: string) => void;
    onDuplicate: (id: string) => void;
    onRemove: (id: string) => void;
    onMove: (from: number, to: number) => void;
    onAddChild: (type: SectionType, parentId: string) => void;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDragEnd: () => void;
    // Função de preview que você já criou
    renderPreview: (section: Section) => string;
    // Função para ícones
    getIcon: (type: SectionType) => React.ElementType;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    section,
    index,
    totalSections,
    isSelected,
    hasError,
    onSelect,
    onDuplicate,
    onRemove,
    onMove,
    onAddChild,
    onDragStart,
    onDragEnter,
    onDragEnd,
    renderPreview,
    getIcon
}) => {
    const Icon = getIcon(section.type);
    const isContainer = section.type === "container";

    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onClick={() => onSelect(section.id)}
            className={`rounded-lg border-2 cursor-move transition-all ${isSelected
                ? "border-blue-500 bg-blue-50 shadow-md"
                : hasError
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
        >
            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Icon
                            size={16}
                            className={isSelected ? "text-blue-600" : "text-slate-400"}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1">
                                {section.type}
                                {isContainer && (
                                    <span className="text-indigo-500 font-normal normal-case italic">
                                        ({(section.children ?? []).length} filhos)
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-1 italic">
                                {renderPreview(section)}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(section.id); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title="Duplicar"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(section.id); }}
                            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                            title="Remover"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Controles de Ordenação */}
                <div className="flex gap-1 mt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(index, index - 1); }}
                        disabled={index === 0}
                        className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-20 rounded border border-slate-200 text-slate-500 transition-colors"
                    >
                        <ArrowUp size={12} className="mx-auto" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(index, index + 1); }}
                        disabled={index === totalSections - 1}
                        className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-20 rounded border border-slate-200 text-slate-500 transition-colors"
                    >
                        <ArrowDown size={12} className="mx-auto" />
                    </button>
                </div>
            </div>

            {/* Área de Filhos para Container */}
            {isContainer && (
                <div
                    className="mx-3 mb-3 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                            Adicionar Filho
                        </span>
                        <div className="flex gap-1 flex-wrap justify-end">
                            {(
                                [
                                    { icon: AlignLeft, label: "Txt", type: "text" },
                                    { icon: ImageIcon, label: "Img", type: "image" },
                                    { icon: Table, label: "Tab", type: "table" },
                                    { icon: List, label: "Lst", type: "list" },
                                    { icon: Minus, label: "Lin", type: "line" },
                                    { icon: Maximize2, label: "Esp", type: "spacer" },
                                ] as const
                            ).map((btn) => (
                                <button
                                    key={btn.type}
                                    onClick={() => onAddChild(btn.type as SectionType, section.id)}
                                    className="px-1.5 py-1 bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-white rounded text-[10px] text-indigo-600 flex items-center gap-1 transition-all shadow-sm"
                                >
                                    <btn.icon size={10} />
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Renderização Recursiva dos Filhos */}
                    <div className="space-y-2 mt-2">
                        {(section.children ?? []).length === 0 ? (
                            <p className="text-[10px] text-indigo-300 text-center py-2 italic">
                                Container vazio
                            </p>
                        ) : (
                            section.children?.map((child, cIdx) => (
                                <div key={child.id} className="ml-2 border-l-2 border-indigo-200 pl-2">
                                    {/* Aqui você chamaria a lógica de renderização de filho ou o próprio SectionCard novamente se for recursivo */}
                                    <div className="text-[10px] bg-white p-2 rounded border border-indigo-100 flex justify-between items-center">
                                        <span className="font-medium text-slate-600 uppercase">{child.type}</span>
                                        <button onClick={() => onRemove(child.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};