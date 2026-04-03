"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { getSectionPreview } from "./previewElement";


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

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Validação automática ao alterar as seções
    useEffect(() => {
        setValidationErrors(validateTemplate(sections));
    }, [sections]);

    const { addSection,duplicateSection,moveSection,removeSection,updateSection,updateSectionStyle} = useSectionsManager( setSections, setSelectedId)
    // ============================================================================
    // DRAG & DROP HANDLERS
    // ============================================================================

    const handleDragStart = (index: number) => (dragItem.current = index);
    const handleDragEnter = (index: number) => (dragOverItem.current = index);
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null)
            moveSection(dragItem.current, dragOverItem.current);
        dragItem.current = dragOverItem.current = null;
    };

    // ============================================================================
    // EXPORT / IMPORT / RESET
    // ============================================================================

    const exportJSON = () => {
        const errors = validateTemplate(sections);
        if (errors.length > 0) {
            setShowValidation(true);
            alert("⚠️ Existem erros de validação. Corrija antes de exportar.");
            return;
        }

        const reportData = sections.map((s) => ({ [s.type]: s.data }));
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
            type: "application/json",
        });
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
            const imported: Section[] = parsed.map((item: any) => {
                const type = Object.keys(item)[0] as SectionType;
                return {
                    id: generateId(),
                    type,
                    data: item[type],
                };
            });

            setSections(imported);
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

    const selectedSection = sections.find((s) => s.id === selectedId);

    const getSectionIcon = (type: SectionType) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const icons: Record<SectionType, any> = {
            header: FileText,
            text: AlignLeft,
            table: Table,
            image: ImageIcon,
            list: List,
            line: Minus,
            spacer: Maximize2,
            footer: Footer,
            pagebreak: SquareDashedBottomCode,
        };
        return icons[type] ?? FileText;
    };


    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* =========================================================
          LEFT SIDEBAR — SECTIONS
      ========================================================== */}
            <aside className="w-80 bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 flex flex-col shadow-md">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h1 className="text-white font-bold text-lg flex items-center gap-2">
                        <FileText size={20} />
                        OrionForge Studio
                    </h1>
                    <p className="text-blue-100 text-xs mt-1">Template Designer v2.0</p>
                </div>

                {/* Add Section Toolbar */}
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
                        ADICIONAR SEÇÃO
                    </h3>
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
                            { icon: Maximize2, label: "Quebra", type: "pagebreak" },
                        ].map((btn) => (
                            <ToolButton
                                key={btn.type}
                                icon={btn.icon}
                                label={btn.label}
                                onClick={() => addSection(btn.type as SectionType)}
                            />
                        ))}
                    </div>
                </div>

                {/* Toolbar actions */}
                <div className="p-3 border-b border-slate-200 flex gap-2">
                    <button
                        onClick={resetToDefault}
                        className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all"
                    >
                        <RefreshCw size={12} />
                        Padrão
                    </button>
                    <button
                        onClick={() => setShowValidation(!showValidation)}
                        className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-1 transition-all ${validationErrors.length
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                    >
                        {validationErrors.length ? (
                            <AlertCircle size={12} />
                        ) : (
                            <CheckCircle2 size={12} />
                        )}
                        {validationErrors.length}
                    </button>
                </div>

                {/* Validation messages */}
                {showValidation && validationErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border-b border-red-200">
                        <p className="text-xs font-semibold text-red-700 mb-2">
                            ERROS DE VALIDAÇÃO
                        </p>
                        <ul className="space-y-1">
                            {validationErrors.map((error, i: number) => (
                                <li
                                    key={i}
                                    className="text-xs text-red-600 bg-white p-2 rounded border border-red-200"
                                >
                                    Seção {error.sectionIndex + 1}: {error.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Section list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {sections.length === 0 ? (
                        <div className="text-center text-sm text-slate-400 py-8">
                            Nenhuma seção. <br /> Adicione seções acima.
                        </div>
                    ) : (
                        sections.map((section: Section, index: number) => {
                            const Icon = getSectionIcon(section.type);
                            const hasError = validationErrors.some(
                                (e) => e.sectionId === section.id
                            );

                            return (
                                <div
                                    key={section.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setSelectedId(section.id)}
                                    className={`p-3 rounded-lg border-2 cursor-move transition-all ${selectedId === section.id
                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                        : hasError
                                            ? "border-red-200 bg-red-50"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1">
                                            <Icon
                                                size={16}
                                                className={
                                                    selectedId === section.id
                                                        ? "text-blue-600"
                                                        : "text-slate-400"
                                                }
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-700 uppercase">
                                                    {section.type}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate mt-1">
                                                    {getSectionPreview(section)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <IconButton
                                                icon={Copy}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    duplicateSection(section.id);
                                                }}
                                                title="Duplicar"
                                            />
                                            <IconButton
                                                icon={Trash2}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSection(section.id);
                                                }}
                                                title="Remover"
                                                danger
                                            />
                                        </div>
                                    </div>

                                    {/* Up/Down controls */}
                                    <div className="flex gap-1 mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (index > 0) moveSection(index, index - 1);
                                            }}
                                            disabled={index === 0}
                                            className="flex-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs transition-colors"
                                        >
                                            <ArrowUp size={12} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (index < sections.length - 1)
                                                    moveSection(index, index + 1);
                                            }}
                                            disabled={index === sections.length - 1}
                                            className="flex-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs transition-colors"
                                        >
                                            <ArrowDown size={12} className="mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Export / Import */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
                    <button
                        onClick={exportJSON}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download size={16} />
                        Exportar JSON
                    </button>

                    <label className="block cursor-pointer">
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) =>
                                        importJSON(ev.target?.result as string);
                                    reader.readAsText(file);
                                }
                            }}
                        />
                        <div className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                            <Upload size={16} />
                            Importar JSON
                        </div>
                    </label>
                </div>
            </aside>

            {/* =========================================================
          CENTER — CANVAS
      ========================================================== */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top toolbar */}
                <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between">
                    <div className="flex gap-2">
                        {["editor", "preview"].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setView(mode as "editor" | "preview")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${view === mode
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {mode === "editor" ? <Settings size={16} /> : <Eye size={16} />}
                                {mode === "editor" ? "Editor" : "Preview"}
                            </button>
                        ))}
                    </div>
                    <div className="text-sm text-slate-500">
                        {sections.length} seção{sections.length !== 1 ? "ões" : ""}
                    </div>
                </div>

                {/* Canvas content */}
                <div className="flex-1 overflow-auto p-6 bg-slate-50">
                    {view === "editor" ? (
                        <div className="max-w-5xl mx-auto space-y-4">
                            {sections.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Template vazio</p>
                                    <p className="text-sm">
                                        Adicione seções usando o painel lateral
                                    </p>
                                </div>
                            ) : (
                                sections.map((section: Section) => (
                                    <div
                                        key={section.id}
                                        onClick={() => setSelectedId(section.id)}
                                        className={`bg-white rounded-lg p-6 border-2 cursor-pointer transition-all ${selectedId === section.id
                                            ? "border-blue-500 shadow-lg"
                                            : "border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase">
                                                {section.type}
                                            </span>
                                            {selectedId === section.id && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    Selecionado
                                                </span>
                                            )}
                                        </div>
                                        <SectionPreview section={section} />
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-xl p-16 border border-slate-200">
                            <PreviewRenderer sections={sections} />
                        </div>
                    )}
                </div>
            </main>

            {/* =========================================================
          RIGHT SIDEBAR — PROPERTIES
      ========================================================== */}
            <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-md">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                        <Settings size={16} />
                        PROPRIEDADES
                    </h2>
                    {selectedSection && (
                        <p className="text-xs text-slate-500 mt-1 uppercase">
                            {selectedSection.type}
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {selectedSection ? (
                        <PropertyEditor
                            section={selectedSection}
                            onUpdate={(data) => updateSection(selectedSection.id, data)}
                            onUpdateStyle={(data) =>updateSectionStyle(selectedSection.id, data)}
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
