"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Camera, Upload, Copy, X, RotateCw, Sparkles, Save, 
  History, ScanLine, Trash2, ChevronRight, Share
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import Image from "next/image";

const OCRPage = () => {
  const { api } = useSession();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [structuredData, setStructuredData] = useState<{label: string, value: string}[]>([]);

  /* ===================== Lógica de Extração ===================== */
  
  const extractSmartData = (text: string) => {
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
    const moneyRegex = /(R\$\s?\d+[.,]\d{2})/g;
    const cnpjRegex = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;

    const found: {label: string, value: string}[] = [];
    const dates = text.match(dateRegex);
    const money = text.match(moneyRegex);
    const cnpjs = text.match(cnpjRegex);

    if (dates) found.push({ label: "Data", value: dates[0] });
    if (money) found.push({ label: "Valor", value: money[0] });
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
    } catch (err: any) {
      setError("Não foi possível ler a imagem. Tente um ângulo mais claro.");
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased transition-colors">
      
      {/* NAVEGAÇÃO ESTILO MACOS */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 mr-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight opacity-80">Live Text Intelligence</h1>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-[#007AFF] text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1">
               <History size={16}/> Histórico
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        
        {/* HEADER MINIMALISTA */}
        <header className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Scanner.</h2>
          <p className="text-[#86868B] text-lg">Extraia dados de documentos com precisão nativa.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA 1: INPUT */}
          <div className="lg:col-span-5 space-y-6">
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileSelect(e.dataTransfer.files[0]); }}
              className={`group relative aspect-[4/3] rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#1C1C1E] ${
                dragActive ? "border-[#007AFF] bg-[#007AFF]/5" : "border-black/5 dark:border-white/10"
              }`}
            >
              {!imagePreview ? (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto">
                    <Upload className="text-[#007AFF]" size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Arraste seu arquivo</p>
                    <p className="text-xs text-[#86868B] mt-1">ou clique para selecionar</p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#007AFF] text-white text-xs px-6 py-2 rounded-full font-bold shadow-lg shadow-[#007AFF]/20 hover:scale-105 transition-transform"
                  >
                    Selecionar
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full group">
                   <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setImagePreview(null)} className="p-3 bg-white text-black rounded-full shadow-xl"><Trash2 size={20}/></button>
                   </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>

            <button 
              onClick={() => setCameraOpen(true)}
              className="w-full py-5 bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-3xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all font-semibold active:scale-[0.98]"
            >
              <Camera size={20} className="text-[#007AFF]" />
              Usar Câmera do Sistema
            </button>
          </div>

          {/* COLUNA 2: RESULTADOS */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* DADOS DETECTADOS ESTILO APPLE WATCH CARDS */}
            <div className="grid grid-cols-3 gap-3">
              {structuredData.length > 0 ? structuredData.map((data, i) => (
                <div key={i} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[1.5rem] border border-black/5 dark:border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">{data.label}</p>
                  <p className="text-sm font-bold truncate">{data.value}</p>
                </div>
              )) : (
                <div className="col-span-3 bg-white/50 dark:bg-[#1C1C1E]/50 p-4 rounded-[1.5rem] border border-dashed border-black/5 dark:border-white/10 text-center">
                  <p className="text-xs text-[#86868B] font-medium">Nenhum dado estruturado detectado ainda.</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-xl flex flex-col min-h-[450px] relative overflow-hidden">
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#007AFF]" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Texto Extraído</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`p-2.5 rounded-full transition-all ${isEditing ? 'bg-[#007AFF] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#86868B]'}`}
                  >
                    {isEditing ? <Save size={18}/> : <RotateCw size={18}/>}
                  </button>
                  <button onClick={() => {}} className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[#86868B] transition-all">
                    <Share size={18}/>
                  </button>
                </div>
              </div>

              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                readOnly={!isEditing}
                placeholder="O texto aparecerá aqui após o processamento..."
                className={`flex-1 p-8 bg-transparent resize-none focus:outline-none text-lg leading-relaxed font-medium transition-colors ${
                  isEditing ? "text-[#007AFF] dark:text-[#0A84FF]" : "text-[#1D1D1F] dark:text-[#F5F5F7]"
                }`}
              />
              
              <div className="p-6 bg-[#F5F5F7] dark:bg-[#2C2C2E]/30 flex justify-between items-center">
                  <button 
                    onClick={() => navigator.clipboard.writeText(resultText)}
                    className="text-[#007AFF] font-bold text-sm flex items-center gap-1 group"
                  >
                    Copiar texto <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                  </button>
                  {error && <p className="text-[#FF3B30] text-xs font-medium">{error}</p>}
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-[3px] border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#007AFF]">Analisando</p>
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