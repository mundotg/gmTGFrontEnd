"use client";

import React, { useState, useEffect } from "react";
import {
    Trash2,
    Download,
    Upload,
    Copy,
    ArrowUp,
    ArrowDown,
    FileText,
    Image as ImageIcon,
    List,
    Table,
    AlignLeft,
    Minus,
    Maximize2,
    BookDown as Footer,
    RefreshCw,
    Settings,
    Eye,
    Code,
    CheckCircle2,
    AlertCircle,
    SquareDashedBottomCode,
    LayoutTemplate,
} from "lucide-react";
import { Section, SectionType, ValidationError } from "../types";
import { SectionPreview } from "./SectionPreview";
import { PropertyEditor } from "./PropertyEditor";
import { validateTemplate } from "./validateTemplate";
import { generateId, STORAGE_KEY } from "../ultils";
import { generateDefaultTemplate } from "./generateDefaultTemplate";
import usePersistedState from "@/hook/localStoreUse";
import { IconButton, PreviewRenderer, ToolButton } from "./SUBCOMPONENTS";
import { useSectionsManager } from "../hooks/useSectionsManager";

// 🔥 Helper para encontrar seções em QUALQUER nível
const findSectionById = (sections: Section[], id: string): Section | undefined => {
    for (const section of sections) {
        if (section.id === id) return section;
        if (section.children) {
            const found = findSectionById(section.children, id);
            if (found) return found;
        }
    }
    return undefined;
};

export default function OrionForgeTemplateStudio() {
    // ============================================================================
    // STATE & EFFECTS
    // ============================================================================
    const [sections, setSections] = usePersistedState<Section[]>(
        STORAGE_KEY,
        generateDefaultTemplate()
    );

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [view, setView] = useState<"editor" | "preview">("editor");
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [showValidation, setShowValidation] = useState(false);

    // ============================================================================
    // HOOK MANAGER
    // ============================================================================
    const {
        addSection,
        duplicateSection,
        moveSection,
        removeSection,
        updateSection,
        updateSectionStyle
    } = useSectionsManager(setSections, setSelectedId);

    useEffect(() => {
        setValidationErrors(validateTemplate(sections));
    }, [sections]);

    // ============================================================================
    // EXPORT / IMPORT
    // ============================================================================
    const buildExportData = (items: Section[] | undefined): any[] => {
        if (!items) return []; // 🔥 Proteção: Se não tiver itens, retorna array vazio

        return items.map((section) => {
            return {
                [section.type]: {
                    ...section.data,
                    style: section.style,
                    children: section.children ? buildExportData(section.children) : undefined
                }
            };
        });
    };

    const exportJSON = () => {
        const errors = validateTemplate(sections);
        if (errors.length > 0) {
            setShowValidation(true);
            alert("⚠️ Existem erros de validação. Corrija antes de exportar.");
            return;
        }

        const reportData = buildExportData(sections);
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `template_${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) throw new Error("JSON deve ser um array");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parseSection = (item: any): Section => {
                // Como agora tudo está dentro da chave do tipo, a chave do tipo é sempre a primeira (e única)
                const type = Object.keys(item)[0] as SectionType;
                if (!type) throw new Error("Tipo de seção não encontrado no JSON");

                // Extraímos tudo de dentro de item[type]
                const nodeContent = item[type];

                // Separamos style e children dos dados reais (data)
                const { style, children, ...realData } = nodeContent;

                return {
                    id: generateId(),
                    type,
                    data: realData, // Passa apenas os dados puros (sem style/children misturados)
                    style: style || {},
                    children: children ? children.map(parseSection) : undefined,
                };
            };

            setSections(parsed.map(parseSection));
            setSelectedId(null);
            alert("✅ Template importado com sucesso!");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            alert(`❌ Erro ao importar: ${err.message}`);
        }
    };
    const resetToDefault = () => {
        if (confirm("Deseja substituir o template atual pelo modelo padrão?")) {
            setSections(generateDefaultTemplate());
            setSelectedId(null);
        }
    };

    // ============================================================================
    // HELPERS
    // ============================================================================
    const selectedSection = selectedId ? findSectionById(sections, selectedId) : undefined;

    const getSectionIcon = (type: SectionType) => {
        const icons: Record<SectionType, any> = {
            header: FileText, text: AlignLeft, table: Table, image: ImageIcon,
            list: List, line: Minus, spacer: Maximize2, footer: Footer,
            pagebreak: SquareDashedBottomCode, container: LayoutTemplate,
        };
        return icons[type] ?? FileText;
    };

    // ============================================================================
    // 🔥 RECURSIVIDADE 1: SIDEBAR (O NÓ GERAL)
    // ============================================================================
    const renderSidebarNode = (node: any, index: number, parentId: string | null, totalSiblings: number, depth: number = 0) => {
        const Icon = getSectionIcon(node.type);
        const isSelected = selectedId === node.id;
        const isContainer = ["container", "header", "footer"].includes(node.type);
        const hasError = validationErrors.some((e) => e.sectionId === node.id);

        // Ajustes visuais baseados na profundidade para não quebrar a tela
        const isRoot = depth === 0;
        const cardClasses = isRoot
            ? `rounded-lg border-2 transition-all ${isSelected ? "border-blue-500 bg-blue-50 shadow-md" : hasError ? "border-red-200 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`
            : `p-2 rounded border-2 transition-all ${isSelected ? "border-indigo-500 bg-indigo-50 shadow" : "border-slate-200 bg-white hover:border-slate-300"}`;

        return (
            <div key={node.id} className={cardClasses}>
                {/* Header do Card */}
                <div className={isRoot ? "p-3" : ""}>
                    <div className="flex items-start justify-between gap-1">
                        <div
                            className="flex items-start gap-2 flex-1 cursor-pointer min-w-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(node.id);
                            }}
                        >
                            <Icon size={isRoot ? 16 : 13} className={isSelected ? (isRoot ? "text-blue-600" : "text-indigo-600") : "text-slate-400"} />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1">
                                    {node.type}
                                    {isContainer && (
                                        <span className="text-indigo-500 font-normal normal-case text-[10px]">
                                            ({(node.children ?? []).length})
                                        </span>
                                    )}
                                </div>
                                {!isRoot && <div className="text-[10px] text-slate-500 truncate">{node.type !== 'container' ? node.data?.value || node.data?.title || '...' : 'Agrupador'}</div>}
                            </div>
                        </div>

                        {/* Ações: Duplicar / Deletar */}
                        <div className="flex gap-1 shrink-0">
                            <IconButton icon={Copy} onClick={(e) => { e.stopPropagation(); duplicateSection(node.id); }} title="Duplicar" />
                            <IconButton icon={Trash2} danger onClick={(e) => { e.stopPropagation(); removeSection(node.id); }} title="Remover" />
                        </div>
                    </div>

                    {/* Controles de Movimento (Sobe/Desce) */}
                    <div className="flex gap-1 mt-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (index > 0) moveSection(index, index - 1, parentId); }}
                            disabled={index === 0}
                            className="flex-1 px-1 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs transition-colors"
                        >
                            <ArrowUp size={11} className="mx-auto" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (index < totalSiblings - 1) moveSection(index, index + 1, parentId); }}
                            disabled={index === totalSiblings - 1}
                            className="flex-1 px-1 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs transition-colors"
                        >
                            <ArrowDown size={11} className="mx-auto" />
                        </button>
                    </div>
                </div>

                {/* 🔥 Renderização dos Filhos (RECURSIVIDADE AQUI) */}
                {isContainer && (
                    <div className={`mt-2 p-2 rounded-lg ${isRoot ? "mx-3 mb-3 bg-indigo-50 border border-indigo-200" : "bg-indigo-50/50 border border-indigo-100"}`}>
                        <div className="flex flex-col gap-2 mb-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                                    Conteúdo Interno
                                </span>
                            </div>

                            {/* Botões de Adicionar Filho */}
                            <div className="flex gap-1 flex-wrap">
                                {(
                                    [
                                        { icon: AlignLeft, label: "Txt", type: "text" },
                                        { icon: ImageIcon, label: "Img", type: "image" },
                                        { icon: Table, label: "Tab", type: "table" },
                                        { icon: List, label: "List", type: "list" },
                                        { icon: Minus, label: "Lin", type: "line" },
                                        { icon: LayoutTemplate, label: "Box", type: "container" },
                                    ] as { icon: React.ElementType; label: string; type: SectionType }[]
                                ).map((btn) => (
                                    <button
                                        key={btn.type}
                                        title={`Adicionar ${btn.label}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addSection(btn.type, node.id);
                                        }}
                                        className="px-1.5 py-1 bg-white border border-indigo-200 hover:bg-indigo-100 rounded text-[10px] text-indigo-700 flex items-center gap-0.5 transition-colors"
                                    >
                                        <btn.icon size={10} /> {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chamada recursiva para os filhos */}
                        {(node.children ?? []).length === 0 ? (
                            <p className="text-[10px] text-indigo-400 text-center py-1">Vazio.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(node.children ?? []).map((child: Section, childIndex: number) =>
                                    renderSidebarNode(child, childIndex, node.id, (node.children ?? []).length, depth + 1)
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================================
    // 🔥 RECURSIVIDADE 2: CANVAS CENTRAL
    // ============================================================================
    const renderCanvasNode = (node: Section, isRoot: boolean = true) => {
        const isSelected = selectedId === node.id;
        const isContainer = ["container", "header", "footer"].includes(node.type);

        return (
            <div
                key={node.id}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(node.id);
                }}
                className={
                    isRoot
                        ? `bg-white rounded-lg p-6 border-2 cursor-pointer transition-all ${isSelected ? "border-blue-500 shadow-lg" : "border-slate-200 hover:border-slate-300"}`
                        : `p-3 rounded border-2 cursor-pointer transition-all mt-2 ${isSelected ? "border-indigo-500 bg-indigo-50 shadow" : "border-slate-100 hover:border-indigo-200"}`
                }
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{node.type}</span>
                    {isSelected && (
                        <span className={`text-xs px-2 py-1 rounded ${isRoot ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"}`}>
                            Selecionado
                        </span>
                    )}
                </div>

                {/* Importante: O componente visual */}
                <SectionPreview section={node} />

                {/* 🔥 Se for container, desenha os filhos recursivamente */}
                {isContainer && (node.children ?? []).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 pl-4 border-l-2 border-indigo-100">
                        {(node.children ?? []).map((child) => renderCanvasNode(child, false))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================================
    // RENDER PRINCIPAL
    // ============================================================================
    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* LEFT SIDEBAR */}
            <aside className="w-80 bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 flex flex-col shadow-md">
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h1 className="text-white font-bold text-lg flex items-center gap-2">
                        <FileText size={20} /> OrionForge Studio
                    </h1>
                    <p className="text-blue-100 text-xs mt-1">Template Designer v2.0</p>
                </div>

                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">ADICIONAR SEÇÃO RAIZ</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { icon: FileText, label: "Header", type: "header" },
                            { icon: AlignLeft, label: "Texto", type: "text" },
                            { icon: Table, label: "Tabela", type: "table" },
                            { icon: ImageIcon, label: "Imagem", type: "image" },
                            { icon: List, label: "Lista", type: "list" },
                            { icon: Minus, label: "Linha", type: "line" },
                            { icon: Maximize2, label: "Espaço", type: "spacer" },
                            { icon: Footer, label: "Rodapé", type: "footer" },
                            { icon: LayoutTemplate, label: "Container", type: "container" },
                        ].map((btn) => (
                            <ToolButton
                                key={btn.type}
                                icon={btn.icon}
                                label={btn.label}
                                onClick={() => addSection(btn.type as SectionType, null)} // Passa null explícito para forçar raiz
                            />
                        ))}
                    </div>
                </div>

                <div className="p-3 border-b border-slate-200 flex gap-2">
                    <button onClick={resetToDefault} className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded text-xs font-medium flex items-center justify-center gap-1">
                        <RefreshCw size={12} /> Padrão
                    </button>
                    <button onClick={() => setShowValidation(!showValidation)} className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-1 ${validationErrors.length ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {validationErrors.length ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />} {validationErrors.length}
                    </button>
                </div>

                {showValidation && validationErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border-b border-red-200">
                        <p className="text-xs font-semibold text-red-700 mb-2">ERROS DE VALIDAÇÃO</p>
                        <ul className="space-y-1">
                            {validationErrors.map((error, i) => (
                                <li key={i} className="text-xs text-red-600 bg-white p-2 rounded border border-red-200">Seção {error.sectionIndex + 1}: {error.message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {sections.length === 0 ? (
                        <div className="text-center text-sm text-slate-400 py-8">Nenhuma seção.</div>
                    ) : (
                        sections.map((section, index) => renderSidebarNode(section, index, null, sections.length, 0))
                    )}
                </div>

                <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
                    <button onClick={exportJSON} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                        <Download size={16} /> Exportar JSON
                    </button>

                    <label className="block cursor-pointer">
                        <input type="file" accept=".json" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => importJSON(ev.target?.result as string);
                                reader.readAsText(file);
                            }
                        }} />
                        <div className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                            <Upload size={16} /> Importar JSON
                        </div>
                    </label>
                </div>
            </aside>

            {/* CENTER CANVAS */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between">
                    <div className="flex gap-2">
                        {["editor", "preview"].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setView(mode as "editor" | "preview")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${view === mode ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                            >
                                {mode === "editor" ? <Settings size={16} /> : <Eye size={16} />} {mode === "editor" ? "Editor" : "Preview"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-slate-50">
                    {view === "editor" ? (
                        <div className="max-w-5xl mx-auto space-y-4">
                            {sections.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Template vazio</p>
                                </div>
                            ) : (
                                sections.map((section) => renderCanvasNode(section, true))
                            )}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-xl p-16 border border-slate-200">
                            <PreviewRenderer sections={sections} />
                        </div>
                    )}
                </div>
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-md">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                        <Settings size={16} /> PROPRIEDADES
                    </h2>
                    {selectedSection && <p className="text-xs text-slate-500 mt-1 uppercase">{selectedSection.type}</p>}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {selectedSection ? (
                        <PropertyEditor
                            section={selectedSection}
                            onUpdate={(data) => updateSection(selectedSection.id, data)}
                            onUpdateStyle={(data) => updateSectionStyle(selectedSection.id, data)}
                        />
                    ) : (
                        <div className="p-6 text-center text-slate-400">
                            <Code size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-sm">Selecione uma seção para editar</p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}