"use client";

import React, { useRef, useState } from "react";
import {
  Camera, Upload, RotateCw, Sparkles, Save, 
  History, Trash2, ChevronRight, Share, Check
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";

const OCRPage = () => {
  const { api } = useSession();
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // As referências de vídeo e canvas estavam sem uso na UI, mas as mantive caso você vá implementar a câmera depois
  // const videoRef = useRef<HTMLVideoElement | null>(null);
  // const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  // const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [structuredData, setStructuredData] = useState<{label: string, value: string}[]>([]);

  /* ===================== Lógica de Extração ===================== */
  console.log("Texto extraído:", cameraOpen ? "(usando câmera)" : resultText);
  const extractSmartData = (text: string) => {
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
    const moneyRegex = /(R\$\s?\d+[.,]\d{2})/g;
    const cnpjRegex = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;

    const found: {label: string, value: string}[] = [];
    const dates = text.match(dateRegex);
    const money = text.match(moneyRegex);
    const cnpjs = text.match(cnpjRegex);

    if (dates) found.push({ label: t("ocr.dataLabel") || "Data", value: dates[0] });
    if (money) found.push({ label: t("ocr.valueLabel") || "Valor", value: money[0] });
    if (cnpjs) found.push({ label: "CNPJ", value: cnpjs[0] });

    setStructuredData(found);
  };

  

  const sendToBackend = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/ocr/analyze-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      
      const text = response.data?.text || response.data?.lines?.join("\n") || "";
      setResultText(text);
      extractSmartData(text);
    } catch (err: { name?: string; code?: string; message?: string } | unknown) {
      let message: string | undefined = undefined;
      if (err && typeof err === "object" && "message" in err) {
        message = (err as { message?: string }).message;
      }
      setError(t("ocr.errorReading") || "Não foi possível ler a imagem. Tente um ângulo mais claro." + (message ? ` (${message})` : ""));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    sendToBackend(file);
  };



  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased transition-colors">
      
      {/* Top Navbar Padronizada */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              MustaInf <span className="text-blue-600">OCR</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50">
              <History size={16}/> {t("actions.history") || "Histórico"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* HEADER */}
        <header className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {t("ocr.title") || "Scanner Inteligente."}
          </h2>
          <p className="text-gray-500 text-base font-medium">
            {t("ocr.subtitle") || "Extraia dados de documentos com precisão nativa."}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA 1: INPUT */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dropzone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileSelect(e.dataTransfer.files[0]); }}
              className={`group relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-white shadow-sm ${
                dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              {!imagePreview ? (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                    <Upload className="text-blue-600" size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t("ocr.dragFile") || "Arraste seu arquivo"}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("ocr.orClick") || "ou clique para selecionar"}</p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white text-xs px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    {t("actions.select") || "Selecionar"}
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full group/image">
                   <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                   <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button 
                        onClick={() => { setImagePreview(null); setResultText(""); setStructuredData([]); }} 
                        className="p-3 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-lg transition-colors"
                        title={t("actions.remove") || "Remover imagem"}
                      >
                        <Trash2 size={20}/>
                      </button>
                   </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>

            {/* Botão Câmera */}
            <button 
              onClick={() => setCameraOpen(true)}
              className="w-full py-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors font-bold text-gray-700 text-sm"
            >
              <Camera size={18} className="text-gray-500" />
              {t("ocr.useCamera") || "Usar Câmera do Sistema"}
            </button>
          </div>

          {/* COLUNA 2: RESULTADOS */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* DADOS DETECTADOS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {structuredData.length > 0 ? structuredData.map((data, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{data.label}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{data.value}</p>
                </div>
              )) : (
                <div className="col-span-full bg-white p-5 rounded-xl border border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-500 font-medium">
                    {t("ocr.noDataDetected") || "Nenhum dado estruturado detectado ainda."}
                  </p>
                </div>
              )}
            </div>

            {/* ÁREA DE TEXTO */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[450px] relative overflow-hidden">
              
              {/* Header do Texto */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    {t("ocr.extractedText") || "Texto Extraído"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`p-2 rounded-lg transition-colors border ${
                      isEditing 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200 hover:text-gray-700'
                    }`}
                    title={isEditing ? (t("actions.save") || "Salvar") : (t("actions.edit") || "Editar")}
                  >
                    {isEditing ? <Save size={16}/> : <RotateCw size={16}/>}
                  </button>
                  <button 
                    onClick={() => {}} 
                    className="p-2 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
                    title={t("actions.share") || "Compartilhar"}
                  >
                    <Share size={16}/>
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                readOnly={!isEditing}
                placeholder={t("ocr.textPlaceholder") || "O texto aparecerá aqui após o processamento..."}
                className={`flex-1 p-5 sm:p-6 bg-transparent resize-none focus:outline-none focus:ring-0 text-base leading-relaxed transition-colors ${
                  isEditing ? "text-gray-900 font-medium bg-blue-50/10" : "text-gray-700"
                }`}
              />
              
              {/* Rodapé do Texto */}
              <div className="p-4 sm:p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 mt-auto">
                  <button 
                    onClick={handleCopy}
                    disabled={!resultText}
                    className={`text-sm font-bold flex items-center gap-1.5 transition-all ${
                      !resultText ? "text-gray-400 cursor-not-allowed" : 
                      copied ? "text-green-600" : "text-blue-600 hover:text-blue-700 group"
                    }`}
                  >
                    {copied ? (
                      <><Check size={16} /> {t("actions.copied") || "Copiado!"}</>
                    ) : (
                      <>{t("actions.copyText") || "Copiar texto"} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/></>
                    )}
                  </button>
                  {error && <p className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-md border border-red-100">{error}</p>}
              </div>

              {/* Overlay de Loading */}
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-xs font-bold tracking-widest uppercase text-blue-600">
                        {t("ocr.analyzing") || "Analisando..."}
                      </p>
                   </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default OCRPage;