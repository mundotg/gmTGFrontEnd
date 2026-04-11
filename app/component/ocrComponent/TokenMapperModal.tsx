"use client";

import { useEffect, useState } from "react";
import HelpModal from "../../home/ocr/components/HelpModal";
import { useI18n } from "@/context/I18nContext";
import { useTokenMapper } from "./useTokenMapper";
import { DEFAULTFIELDS, Props } from "./utils";
import DraggableLineList from "./DraggableLineList";
import MapperFormGrid from "./MapperFormGrid";
import { Sparkles, Loader2 } from "lucide-react"; // Adicionado para o botão mágico

// ==========================================
// FUNÇÃO DE PREENCHIMENTO AUTOMÁTICO (Heurística / Regex)
// ==========================================
const extractDataFromText = (text: string, fields: any[]) => {
    const extracted: Record<string, string> = {};
    const lines = text.split("\n").map(l => l.trim().toUpperCase());

    fields.forEach((field) => {
        const tType = field.tipo?.toLowerCase() || "";
        const fName = field.nome.toLowerCase();

        // 1. EXTRAIR DATAS
        if (tType.includes("date") || fName.includes("data")) {
            const dateMatch = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
            if (dateMatch) extracted[field.nome] = dateMatch[1];
        }
        // 2. EXTRAIR TELEFONES (Angola / Genérico)
        else if (fName.includes("telefone") || fName.includes("telemovel") || fName.includes("contacto")) {
            const phoneMatch = text.match(/(?:\+?244)?\s*(?:9\d{2}\s?\d{3}\s?\d{3})/);
            if (phoneMatch) extracted[field.nome] = phoneMatch[0].trim();
        }
        // 3. EXTRAIR EMAILS
        else if (fName.includes("email")) {
            const emailMatch = text.match(/\S+@\S+\.\S+/);
            if (emailMatch) extracted[field.nome] = emailMatch[0];
        }
        // 4. EXTRAIR VALORES MONETÁRIOS
        else if (tType.includes("number") || tType.includes("decimal") || fName.includes("valor")) {
            const moneyMatch = text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:Kz|AKZ|USD|EUR)/i)
                || text.match(/(?:Kz|AKZ|USD|EUR|R\$)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i);
            if (moneyMatch) extracted[field.nome] = moneyMatch[1];
        }
        // 5. EXTRAIR NOME (Tenta encontrar a linha a seguir a "NOME")
        else if (fName === "nome" || fName.includes("nome_completo")) {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes("NOME")) {
                    if (lines[i].includes(":")) {
                        extracted[field.nome] = lines[i].split(":")[1].trim(); // Se for "Nome: João"
                    } else if (i + 1 < lines.length) {
                        extracted[field.nome] = lines[i + 1].trim(); // Se o nome estiver na linha de baixo
                    }
                    break;
                }
            }
        }
    });

    console.log("Dados extraídos automaticamente:", extracted);

    return extracted;
};


export default function TokenMapperModal({
    text,
    fields,
    onComplete,
    valuesDefault,
    onClose,
}: Props) {
    const { t } = useI18n();

    /* ---------------- DEFAULT FORM ---------------- */
    const finalFields = fields?.length ? fields : DEFAULTFIELDS;

    /* ---------------- LINES + TOKENS ---------------- */
    const tokenizedLines: string[][] = text.includes("\n")
        ? text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.split(/\s+/).filter(Boolean))
        : text.match(/.{1,40}/g)!.map((line) => line.split(/\s+/).filter(Boolean));

    /* ---------------- VALUE RESOLVER ---------------- */
    const {
        mappedTokens,
        selectedTokens,
        setSelectedTokens,
        setManualValues,
        dragOverField,
        setDragOverField,
        getFieldValue,
        handleDragStart,
        handleDropField,
        removeToken,
        updateToken,
        clearFieldTokens,
        mergeSelectedTokens,
    } = useTokenMapper({ valuesDefault });

    useEffect(() => {
        if (valuesDefault) {
            setManualValues(valuesDefault);
        }
    }, [valuesDefault, setManualValues]);

    const [editingToken, setEditingToken] = useState<{
        field: string;
        index: number;
    } | null>(null);

    const [isHelpVisible, setIsHelpVisible] = useState(false);

    // Estado de Loading para o Auto-Fill
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    /* ---------------- LÓGICA DE AUTO-FILL ---------------- */
    const handleAutoFill = async () => {
        setIsAutoFilling(true);

        try {
            // Se decidires usar um LLM no Backend, podes substituir o código abaixo por isto:
            // const response = await api.post("/ocr/auto-fill", { text, fields: finalFields });
            // const extractedData = response.data;

            // Simula um tempo de pensamento para dar feedback visual (remove se usares API real)
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Usamos a nossa função Regex de cima:
            const extractedData = extractDataFromText(text, finalFields);

            // Atualiza os inputs manuais com os dados encontrados
            setManualValues((prev) => ({
                ...prev,
                ...extractedData
            }));

        } catch (error) {
            console.error("Erro no auto-preenchimento:", error);
        } finally {
            setIsAutoFilling(false);
        }
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = () => {
        const result: Record<string, string> = {};

        finalFields.forEach((field) => {
            result[field.nome] = getFieldValue(field.nome);
        });

        onComplete?.(result);
        onClose();
    };

    /* ---------------- UI ---------------- */
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center md:p-4 backdrop-blur-sm">
            {/* MODAL CONTAINER */}
            <div className="bg-white w-full h-full md:rounded-2xl md:max-w-6xl md:h-[90vh] flex flex-col shadow-xl overflow-hidden">

                {/* HEADER */}
                <div className="flex justify-between items-center p-4 border-b shrink-0 bg-gray-50/50">
                    <h2 className="font-bold text-sm sm:text-base text-gray-800">{t("tokenMapper.title") || "Mapeamento de Dados"}</h2>

                    <div className="flex items-center gap-2 sm:gap-3">

                        {/* BOTÃO AUTO-FILL AQUI */}
                        <button
                            onClick={handleAutoFill}
                            disabled={isAutoFilling}
                            className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-sm disabled:opacity-70"
                        >
                            {isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            <span className="hidden sm:inline">
                                {t("tokenMapper.autoFill") || "Auto-Preencher"}
                            </span>
                        </button>

                        <button
                            onClick={() => setIsHelpVisible(true)}
                            className="text-xs bg-blue-50 text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                        >
                            {t("tokenMapper.howToUse") || "Como Usar?"}
                        </button>

                        <div className="w-px h-5 bg-gray-300 hidden sm:block"></div>

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* MAIN BODY */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-white">

                    {/* LEFT: LINES */}
                    <DraggableLineList
                        tokenizedLines={tokenizedLines}
                        onDragStart={handleDragStart}
                    />

                    {/* RIGHT: FORM */}
                    <MapperFormGrid
                        fields={finalFields}
                        mappedTokens={mappedTokens}
                        dragOverField={dragOverField}
                        selectedTokens={selectedTokens}
                        editingToken={editingToken}
                        handleDropField={handleDropField}
                        setDragOverField={setDragOverField}
                        mergeSelectedTokens={mergeSelectedTokens}
                        getFieldValue={getFieldValue}
                        clearFieldTokens={clearFieldTokens}
                        handleDragStart={handleDragStart}
                        setSelectedTokens={setSelectedTokens}
                        setEditingToken={setEditingToken}
                        updateToken={updateToken}
                        removeToken={removeToken}
                        setManualValues={setManualValues}
                    />
                </div>

                <HelpModal open={isHelpVisible} onClose={() => setIsHelpVisible(false)} />

                {/* FOOTER */}
                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 shrink-0 md:rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        {t("actions.cancel") || "Cancelar"}
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                    >
                        {t("common.confirm") || "Confirmar"}
                    </button>
                </div>
            </div>
        </div>
    );
}