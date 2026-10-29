"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Camera, Upload, RotateCw, Sparkles, Save, History,
  Trash2, ChevronRight, Share, Check, FileText, TableProperties,
  File as FileIcon, Map, Copy, Download, HelpCircle, Eye,
  Maximize2, X, RefreshCw, Layers, AlignLeft, CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import TokenMapperPage from "../../component/ocrComponent/TokenMapperModal";
import { DEFAULTFIELDS } from "@/app/component/ocrComponent/utils";
import HelpModal from "./components/HelpModal";
import CameraModal from "./components/CameraModal";
import HistoryDrawer, { OCRHistoryItem } from "./components/HistoryDrawer";

const HISTORY_STORAGE_KEY = "MustaInfo_ocr_history";

export default function OCRPage() {
  const { api } = useSession();
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modais e gavetas
  const [showMapper, setShowMapper] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Estados do ficheiro
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Estados do processo
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Estados da UI e visualização
  const [activeTab, setActiveTab] = useState<"text" | "structured" | "lines">("text");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [structuredData, setStructuredData] = useState<{ label: string; value: string }[]>([]);
  const [autoFilledData, setAutoFilledData] = useState<Record<string, string>>({});

  // Histórico local
  const [historyItems, setHistoryItems] = useState<OCRHistoryItem[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistoryItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de OCR:", err);
    }
  }, []);

  const saveToHistory = (
    fileName: string,
    fileType: string,
    fullText: string,
    extracted?: Record<string, string>
  ) => {
    if (!fullText.trim()) return;

    try {
      const newItem: OCRHistoryItem = {
        id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        fileName,
        fileType,
        textSnippet: fullText.trim().slice(0, 140),
        fullText,
        linesCount: fullText.split("\n").filter((l) => l.trim().length > 0).length,
        extractedData: extracted,
      };

      setHistoryItems((prev) => {
        const updated = [newItem, ...prev.slice(0, 24)];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Erro ao salvar no histórico de OCR:", err);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistoryItems([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleRestoreFromHistory = (item: OCRHistoryItem) => {
    setResultText(item.fullText);
    if (item.extractedData) {
      setAutoFilledData(item.extractedData);
    }
    extractSmartData(item.fullText, item.extractedData);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setError(null);
  };

  /* ===================== Lógica de Extração Inteligente ===================== */
  const extractSmartData = (text: string, backendData?: Record<string, string>) => {
    const found: { label: string; value: string }[] = [];

    // Se o backend já enviou dados estruturados (BI, Nome, NIF, etc.)
    if (backendData && Object.keys(backendData).length > 0) {
      Object.entries(backendData).forEach(([key, val]) => {
        if (val && typeof val === "string" && val.trim().length > 0) {
          found.push({
            label: key.replace(/_/g, " ").toUpperCase(),
            value: val.trim(),
          });
        }
      });
    }

    // Heurísticas regex locais adicionais (foco no formato de Angola e padrão internacional)
    const biAngolaRegex = /\b\d{9}[A-Z]{2}\d{3}\b/i; // BI Angolano ex: 004123456LA042
    const nifRegex = /\b\d{10}\b|\b\d{14}\b/;
    const dateRegex = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/g;
    const phoneRegex = /(?:\+?244)?\s*(?:9\d{2}\s?\d{3}\s?\d{3})/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    const moneyRegex = /(?:Kz|AKZ|kz|AOA|€|\$|R\$)\s*(\d{1,3}(?:\.\d{3})*(?:[,\.]\d{2})?)|(\d{1,3}(?:\.\d{3})*(?:[,\.]\d{2})?)\s*(?:Kz|AKZ|kz|AOA)/gi;

    const biMatch = text.match(biAngolaRegex);
    const nifMatch = text.match(nifRegex);
    const dates = text.match(dateRegex);
    const phones = text.match(phoneRegex);
    const emails = text.match(emailRegex);
    const money = text.match(moneyRegex);

    if (biMatch && !found.some((f) => f.label.includes("BI"))) {
      found.push({ label: "Nº BI ANGOLA", value: biMatch[0].toUpperCase() });
    }
    if (nifMatch && !found.some((f) => f.label.includes("NIF"))) {
      found.push({ label: "NIF / CONTRIBUINTE", value: nifMatch[0] });
    }
    if (phones && phones.length > 0 && !found.some((f) => f.label.includes("TELEFONE"))) {
      found.push({ label: "TELEFONE", value: phones[0].trim() });
    }
    if (emails && emails.length > 0 && !found.some((f) => f.label.includes("EMAIL"))) {
      found.push({ label: "E-MAIL", value: emails[0] });
    }
    if (dates && dates.length > 0 && !found.some((f) => f.label.includes("DATA"))) {
      found.push({ label: "DATA DETECTADA", value: dates[0] });
    }
    if (money && money.length > 0 && !found.some((f) => f.label.includes("VALOR"))) {
      found.push({ label: "VALOR / TOTAL", value: money[0].trim() });
    }

    setStructuredData(found);
  };

  /* ===================== Rotação de Imagem ===================== */
  const handleRotateImage = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
  };

  /* ===================== Processamento de Ficheiro ===================== */
  const processSelectedFile = async (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
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
      setLoading(true);
      setError(null);
      setResultText("");
      setAutoFilledData({});
      setStructuredData([]);

      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

      /* ---------- IMAGE (PADDLE OCR) ---------- */
      if (isImage) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("formulario", JSON.stringify(DEFAULTFIELDS));

        const response = await api.post("/ocr/analyze-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 90000,
        });

        const text =
          response.data?.text ||
          response.data?.lines?.join("\n") ||
          "";

        setResultText(text);

        const extracted = response.data?.extracted_data || {};
        setAutoFilledData(extracted);
        extractSmartData(text, extracted);
        saveToHistory(file.name, file.type, text, extracted);
      }
      /* ---------- PDF (STREAMING) ---------- */
      else if (isPdf) {
        const formData = new FormData();
        formData.append("pdf", file);

        const response = await fetch(`${baseUrl}/ocr/analyze-pdf`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Falha ao processar o arquivo PDF.");
        }

        if (!response.body) {
          throw new Error("Stream de leitura indisponível.");
        }

        let accumulatedText = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulatedText += decoder.decode(value, { stream: true });
          setResultText(accumulatedText);
        }

        extractSmartData(accumulatedText);
        saveToHistory(file.name, file.type, accumulatedText);
      }
      /* ---------- SPREADSHEET (STREAMING) ---------- */
      else if (isSpreadsheet) {
        const formData = new FormData();
        formData.append("spreadsheet", file);

        const response = await fetch(`${baseUrl}/ocr/analyze-spreadsheet`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Falha ao processar a planilha.");
        }

        if (!response.body) {
          throw new Error("Stream de leitura indisponível.");
        }

        let accumulatedText = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulatedText += decoder.decode(value, { stream: true });
          setResultText(accumulatedText);
        }

        extractSmartData(accumulatedText);
        saveToHistory(file.name, file.type, accumulatedText);
      }
      /* ---------- TEXT FILE ---------- */
      else if (isText) {
        const text = await file.text();
        setResultText(text);
        extractSmartData(text);
        saveToHistory(file.name, file.type, text);
      } else {
        setError(
          t("ocr.invalidFile") ||
          "Formato não suportado. Por favor, envie uma Imagem, PDF, Excel ou Texto."
        );
      }
    } catch (err: any) {
      console.error("Erro no processamento OCR:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail?.message ||
        err?.message ||
        "Erro ao processar ficheiro com o motor OCR.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);

    setSelectedFile(file);
    setRotationDegrees(0);

    if (file.type.startsWith("image/")) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }

    processSelectedFile(file);
  };

  const handleClear = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setRotationDegrees(0);
    setResultText("");
    setStructuredData([]);
    setAutoFilledData({});
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!resultText) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Texto Reconhecido por MustaInfo OCR",
          text: resultText,
        });
        return;
      } catch {
        // Fallback para cópia
      }
    }

    navigator.clipboard.writeText(resultText);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ocr_extraido_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!resultText) return;
    const payload = {
      timestamp: new Date().toISOString(),
      fileName: selectedFile?.name || "documento",
      fullText: resultText,
      lines: resultText.split("\n"),
      structuredData: structuredData,
      autoFilledData: autoFilledData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ocr_extraido_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Métricas do texto em tempo real
  const textStats = useMemo(() => {
    const chars = resultText.length;
    const words = resultText.trim() ? resultText.trim().split(/\s+/).length : 0;
    const lines = resultText.split("\n").filter((l) => l.trim().length > 0).length;
    return { chars, words, lines };
  }, [resultText]);

  // Lista de linhas para visualização em modo tabela
  const parsedLines = useMemo(() => {
    return resultText.split("\n").filter((l) => l.trim().length > 0);
  }, [resultText]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                MustaInfo <span className="text-blue-600">Vision OCR</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Paddle v3 + IA
                </span>
              </h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Extração e digitalização de faturas, bilhetes de identidade e tabelas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="text-gray-600 text-xs font-semibold hover:text-blue-600 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <HelpCircle size={15} />
              <span className="hidden sm:inline">Ajuda</span>
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="text-gray-700 text-xs font-semibold hover:text-blue-600 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 shadow-2xs"
            >
              <History size={15} className="text-blue-600" />
              <span>Histórico</span>
              {historyItems.length > 0 && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Banner de Boas-vindas / Subtítulo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm border border-blue-800/30">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>Scanner & Reconhecimento Inteligente</span>
            </h2>
            <p className="text-xs md:text-sm text-blue-200 max-w-2xl leading-relaxed">
              Arraste imagens, fotografias de documentos ou relatórios PDF/Excel. O motor extrai texto contínuo e mapeia automaticamente campos de BI Angolano, NIF, datas e valores.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCamera(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Camera size={16} />
              <span>Câmera / Scanner</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all active:scale-95"
            >
              <Upload size={16} />
              <span>Upload de Arquivo</span>
            </button>
          </div>
        </div>

        {/* Mensagem de Erro com Ação de Fechar */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs">Erro no Processamento</h4>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Grade Principal: Input (Esquerda) e Output (Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= COLUNA 1: INPUT DO DOCUMENTO ================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={15} className="text-blue-600" />
                  Documento de Origem
                </span>
                {selectedFile && (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>

              {/* Dropzone com Preview */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className={`group relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-gray-50/50 ${dragActive
                    ? "border-blue-500 bg-blue-50/60"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
              >
                {!selectedFile ? (
                  <div className="text-center p-6 space-y-3.5">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105 shadow-2xs">
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {t("ocr.dragFile") || "Arraste e solte o ficheiro aqui"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Imagens (JPG, PNG), PDFs, Planilhas (XLSX, CSV)
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                    >
                      {t("actions.select") || "Selecionar no Computador"}
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full group/image flex flex-col items-center justify-center bg-slate-900">
                    {/* Visualização de imagem ou ícone de arquivo */}
                    {filePreviewUrl ? (
                      <div
                        className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
                        style={{ transform: `rotate(${rotationDegrees}deg)` }}
                      >
                        <Image
                          src={filePreviewUrl}
                          alt="Preview do Documento"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-blue-400 p-6 text-center">
                        {selectedFile.name.endsWith(".pdf") ? (
                          <FileText size={56} className="text-red-400" />
                        ) : selectedFile.name.match(/\.(xlsx|xls|csv)$/i) ? (
                          <TableProperties size={56} className="text-emerald-400" />
                        ) : (
                          <FileIcon size={56} className="text-blue-400" />
                        )}
                        <span className="text-sm font-bold text-white max-w-xs truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          Formato processado via streaming
                        </span>
                      </div>
                    )}

                    {/* Barra de Ações Rápidas Sobre a Imagem */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover/image:opacity-100 transition-opacity">
                      {filePreviewUrl && (
                        <>
                          <button
                            onClick={handleRotateImage}
                            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-colors"
                            title="Rotacionar 90°"
                          >
                            <RotateCw size={15} />
                          </button>
                          <button
                            onClick={() => setShowZoomModal(true)}
                            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-colors"
                            title="Ampliar Imagem"
                          >
                            <Maximize2 size={15} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleClear}
                        className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-colors"
                        title={t("actions.remove") || "Remover ficheiro"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.xls,.xlsx,.csv,.txt,.json"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>

              {/* Botões de Ação Abaixo da Dropzone */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setShowCamera(true)}
                  className="py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 shadow-2xs hover:bg-gray-50 transition-colors font-bold text-gray-700 text-xs"
                >
                  <Camera size={16} className="text-blue-600" />
                  <span>Usar Câmera</span>
                </button>

                <button
                  onClick={() => selectedFile && processSelectedFile(selectedFile)}
                  disabled={!selectedFile || loading}
                  className="py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 shadow-2xs hover:bg-gray-50 transition-colors font-bold text-gray-700 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={15} className={`text-indigo-600 ${loading ? "animate-spin" : ""}`} />
                  <span>Reprocessar</span>
                </button>
              </div>
            </div>

            {/* Dica de Formatos e Confiabilidade */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                <span>Otimizado para Bilhetes de Identidade e Faturas</span>
              </div>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                Para melhores resultados em imagens, certifique-se de que o texto esteja legível, sem reflexos fortes de luz sobre números de BI ou valores fiscais.
              </p>
            </div>
          </div>

          {/* ================= COLUNA 2: RESULTADOS E EXTRAÇÃO ================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* Cards de Dados Estruturados / Ficha Rápida */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500" />
                  Dados Inteligentes Identificados
                </span>
                {structuredData.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {structuredData.length} campos detectados
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {structuredData.length > 0 ? (
                  structuredData.map((data, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-center transition-all hover:border-blue-300 hover:shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-blue-600 transition-colors truncate">
                          {data.label}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(data.value);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity"
                          title="Copiar campo"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-gray-900 truncate mt-0.5 font-mono">
                        {data.value}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white p-4 rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                      Nenhum dado estruturado ainda. Processe um documento para extrair BI, NIF, telefones e valores.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Painel Principal de Texto Extraído */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col min-h-[460px] relative overflow-hidden">
              {/* Header do Painel com Tabs */}
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-gray-50/60">
                {/* Tabs de visualização */}
                <div className="flex items-center gap-1 bg-gray-200/60 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "text"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <AlignLeft size={13} />
                    <span>Texto</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("lines")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "lines"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <Layers size={13} />
                    <span>Linhas ({textStats.lines})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("structured")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "structured"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <Sparkles size={13} />
                    <span>Ficha ({structuredData.length})</span>
                  </button>
                </div>

                {/* Ações do Header */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                  {/* Botão Mapear Dados (Abre TokenMapper) */}
                  <button
                    onClick={() => setShowMapper(true)}
                    disabled={!resultText}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
                  >
                    <Map size={13} />
                    <span>Mapear Tokens</span>
                  </button>

                  <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={!resultText}
                    className={`p-2 rounded-xl transition-colors border text-xs font-semibold flex items-center gap-1 ${isEditing
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                      }`}
                    title={isEditing ? "Concluir Edição" : "Editar Texto Manualmente"}
                  >
                    {isEditing ? <Save size={14} /> : <RotateCw size={14} />}
                    <span className="hidden sm:inline">{isEditing ? "Salvar" : "Editar"}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    disabled={!resultText}
                    className="p-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors disabled:opacity-40"
                    title="Baixar como TXT"
                  >
                    <Download size={14} />
                  </button>

                  <button
                    onClick={handleShare}
                    disabled={!resultText}
                    className="p-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors disabled:opacity-40"
                    title="Compartilhar ou Copiar"
                  >
                    {shared ? <Check size={14} className="text-emerald-600" /> : <Share size={14} />}
                  </button>
                </div>
              </div>

              {/* Corpo de Conteúdo Conforme a Aba Ativa */}
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto max-h-[500px]">
                {activeTab === "text" && (
                  <textarea
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    readOnly={!isEditing}
                    placeholder={
                      loading
                        ? "Extraindo e digitalizando o conteúdo com Paddle OCR..."
                        : t("ocr.textPlaceholder") ||
                        "O texto extraído do documento aparecerá aqui..."
                    }
                    className={`flex-1 w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed font-mono transition-colors min-h-[360px] ${isEditing
                        ? "text-gray-900 font-medium bg-blue-50/20 p-2 rounded-xl border border-blue-200"
                        : "text-gray-800"
                      }`}
                  />
                )}

                {activeTab === "lines" && (
                  <div className="space-y-2">
                    {parsedLines.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-12">
                        Nenhuma linha detectada ainda.
                      </p>
                    ) : (
                      parsedLines.map((line, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-xs font-mono group transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 w-6 text-right shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="text-gray-800 truncate">{line}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(line);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded-md transition-opacity"
                            title="Copiar linha"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "structured" && (
                  <div className="space-y-3">
                    {structuredData.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-12">
                        Nenhum dado estruturado disponível.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                        {structuredData.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3.5 bg-white hover:bg-gray-50/80 text-xs transition-colors"
                          >
                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">
                                {item.value}
                              </span>
                              <button
                                onClick={() => navigator.clipboard.writeText(item.value)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                title="Copiar"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rodapé do Painel com Contadores e Ação de Cópia */}
              <div className="p-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-gray-50/60 mt-auto">
                <div className="flex items-center gap-4 text-[11px] text-gray-500">
                  <span>
                    <strong>{textStats.chars}</strong> caracteres
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{textStats.words}</strong> palavras
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{textStats.lines}</strong> linhas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadJson}
                    disabled={!resultText}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Exportar JSON
                  </button>

                  <button
                    onClick={handleCopy}
                    disabled={!resultText}
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs ${!resultText
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : copied
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                      }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar Texto</span>
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Overlay de Loading Visual */}
              {loading && !resultText && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-10 animate-in fade-in">
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {t("ocr.analyzing") || "Processando Documento..."}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        O motor neural Paddle OCR está localizando caixas de texto e decodificando caracteres.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= MODAL MAPPER COM TOKEN MAPPER ================= */}
        {showMapper && (
          <TokenMapperPage
            text={resultText}
            valuesDefault={autoFilledData}
            onClose={() => setShowMapper(false)}
          />
        )}

        {/* ================= MODAL DE AJUDA / GUIA ================= */}
        <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />

        {/* ================= MODAL DA CÂMERA DO SISTEMA ================= */}
        <CameraModal
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onCapture={(capturedFile) => handleFileSelect(capturedFile)}
        />

        {/* ================= GAVETA DE HISTÓRICO ================= */}
        <HistoryDrawer
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          items={historyItems}
          onSelect={handleRestoreFromHistory}
          onClear={handleClearHistory}
          onDeleteOne={handleDeleteHistoryItem}
        />

        {/* ================= MODAL DE ZOOM DE IMAGEM ================= */}
        {showZoomModal && filePreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center">
              <button
                onClick={() => setShowZoomModal(false)}
                className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors z-20"
              >
                <X size={20} />
              </button>
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${rotationDegrees}deg)` }}
              >
                <Image
                  src={filePreviewUrl}
                  alt="Zoom do Documento"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}