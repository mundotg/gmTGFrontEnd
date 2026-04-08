"use client";

import React, { useCallback, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import TokenMapperPage from "./TokenMapperModal";
import { CampoDetalhado, EditedField } from "@/types";

type Props = {
    formFields: CampoDetalhado[];
    valuesDefault?: Record<string, EditedField>; // Valores pré-definidos para o mapper (opcional)
    onResult: (mappedFields: Record<string, EditedField>) => void;
};

export default function OCRButton({ formFields, valuesDefault, onResult }: Props) {
    const { api } = useSession();
    const { t } = useI18n();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [isMapperVisible, setIsMapperVisible] = useState(false);
    const [extractedText, setExtractedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ✨ NOVO: Estado para guardar o que o backend conseguiu auto-extrair
    const [autoFilledData, setAutoFilledData] = useState<Record<string, string>>({});

    /* ================= FILE HANDLER ================= */

    const processSelectedFile = async (file: File) => {
        if (!file) return;

        // 1. Identificar o tipo de ficheiro
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

        // Suporte para Excel (.xls, .xlsx)
        const isSpreadsheet =
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.type === "application/vnd.ms-excel" ||
            file.name.toLowerCase().endsWith(".xlsx") ||
            file.name.toLowerCase().endsWith(".xls");

        const isText =
            file.type.startsWith("text/") ||
            file.name.toLowerCase().endsWith(".txt") ||
            file.name.toLowerCase().endsWith(".csv") ||
            file.name.toLowerCase().endsWith(".json");

        try {
            setIsLoading(true);
            setErrorMessage(null);
            setAutoFilledData({}); // Limpa dados extraídos anteriormente

            /* ---------- IMAGE ---------- */
            if (isImage) {
                const formData = new FormData();
                formData.append("image", file);

                // Envia os campos do formulário para o backend saber o que extrair!
                formData.append(
                    "formulario",
                    JSON.stringify(formFields.map((f) => ({ nome: f.nome, tipo: f.tipo, tableName: f.tableName })))
                );

                const response = await api.post("/ocr/analyze-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    timeout: 80000,
                });

                const text =
                    response.data?.text ||
                    response.data?.lines?.join("\n") ||
                    "";

                setExtractedText(text);

                // ✨ NOVO: Guarda os dados extraídos pelo Backend
                if (response.data?.extracted_data) {
                    setAutoFilledData(response.data.extracted_data);
                }

                setIsMapperVisible(true);
            }
            /* ---------- PDF (STREAMING) ---------- */
            else if (isPdf) {
                const formData = new FormData();
                formData.append("pdf", file);

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}ocr/analyze-pdf`, {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Falha ao processar o PDF.");
                }

                if (!response.body) {
                    throw new Error("Stream indisponível.");
                }

                let accumulatedText = "";
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    accumulatedText += decoder.decode(value, { stream: true });
                    setExtractedText(accumulatedText);
                }

                setIsMapperVisible(true);
            }
            /* ---------- SPREADSHEET (STREAMING) ---------- */
            else if (isSpreadsheet) {
                const formData = new FormData();
                formData.append("spreadsheet", file);

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}ocr/analyze-spreadsheet`, {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Falha ao processar a planilha.");
                }

                if (!response.body) {
                    throw new Error("Stream indisponível.");
                }

                let accumulatedText = "";
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    accumulatedText += decoder.decode(value, { stream: true });
                    setExtractedText(accumulatedText);
                }

                setIsMapperVisible(true);
            }
            /* ---------- TEXT ---------- */
            else if (isText) {
                const text = await file.text();
                setExtractedText(text);
                setIsMapperVisible(true);
            }
            /* ---------- INVALID ---------- */
            else {
                setErrorMessage(
                    t("ocr.invalidFile") ||
                    "Formato não suportado. Usa imagem, PDF, Excel ou ficheiro de texto."
                );
            }
        } catch (error: any) {
            console.error(error);
            setErrorMessage(
                t("ocr.errorReading") || "Erro ao processar ficheiro."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const convertertype = useCallback(
        (f?: Record<string, EditedField>): Record<string, string> => {
            if (!f) return {};

            return Object.fromEntries(
                Object.entries(f).map(([key, field]) => [key, field?.value ?? ""])
            );
        },
        []
    );

    /* ================= INPUT HANDLERS ================= */

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processSelectedFile(file);
        }

        // Limpa o valor do input para permitir re-selecionar o mesmo ficheiro caso o modal seja fechado
        if (event.target) {
            event.target.value = "";
        }
    };

    const handleMapperCompletion = useCallback(
        (mappedValues: Record<string, string>) => {
            const finalResult: Record<string, EditedField> = {};

            formFields.forEach((field) => {
                const value = mappedValues[field.nome] ?? "";
                const df = valuesDefault?.[field.nome];

                finalResult[field.nome] = {
                    value,
                    tableName: field.tableName ?? "default_table",
                    hasChanged: !!value,
                    type_column: field.tipo ?? "text",
                };
            });

            onResult?.(finalResult);
            setIsMapperVisible(false);
        },
        [onResult, formFields, valuesDefault]
    );

    return (
        <div className="flex flex-col gap-2">
            {/* INPUT HIDDEN */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.xls,.xlsx,.csv,.txt"
                capture="environment" // 👈 abre a câmara no mobile
                className="hidden"
                onChange={handleFileInputChange}
            />

            {/* BUTTON */}
            <button
                onClick={openFilePicker}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
                {isLoading ? (
                    <span className="text-sm">{t("ocr.processing") || "A processar..."}</span>
                ) : (
                    <>
                        <Camera size={16} />
                        <span>{t("ocr.scan") || "Escanear documento"}</span>
                    </>
                )}
            </button>

            {/* MODAL / MAPPER */}
            {isMapperVisible && (
                <TokenMapperPage
                    fields={formFields}
                    text={extractedText}
                    // ✨ MÁGICA: Junta os valores antigos que o user já tinha digitado com os novos gerados pelo backend
                    valuesDefault={{ ...convertertype(valuesDefault), ...autoFilledData }}
                    onComplete={handleMapperCompletion}
                    onClose={() => setIsMapperVisible(false)}
                />
            )}

            {/* ERROR */}
            {errorMessage && (
                <span className="text-xs text-red-500">{errorMessage}</span>
            )}
        </div>
    );
}