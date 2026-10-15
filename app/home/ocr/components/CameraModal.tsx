"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, AlertTriangle, Check } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async () => {
    stopStream();
    setError(null);
    setStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("A API de câmera não é suportada neste navegador.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Permissão para aceder à câmera foi recusada. Verifique as configurações do navegador.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("Nenhuma câmera encontrada conectada ao dispositivo.");
      } else {
        setError("Não foi possível inicializar a câmera. " + (err.message || ""));
      }
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      setCapturedFile(null);
      startStream();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Se a câmera for frontal, espelha para o utilizador ver natural
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan_camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPreview(previewUrl);
        setCapturedFile(file);
      },
      "image/jpeg",
      0.95
    );
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  };

  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview(null);
    setCapturedFile(null);
    startStream();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Scanner de Documentos</h3>
              <p className="text-xs text-slate-400">Enquadre o documento com boa iluminação</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport da Câmera / Preview */}
        <div className="relative flex-1 bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-8 text-center max-w-md space-y-3">
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-white text-sm">Falha no Acesso à Câmera</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              <button
                onClick={startStream}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
              >
                Tentar Novamente
              </button>
            </div>
          ) : capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Fotografia Capturada"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Moldura de enquadramento do documento com cantos */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-white/20 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between -mt-1 -mx-1">
                  <div className="w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                  <div className="w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                </div>
                <div className="flex justify-between -mb-1 -mx-1">
                  <div className="w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                  <div className="w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
                </div>
              </div>

              {/* Indicador de carregamento */}
              {starting && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Iniciando câmera...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controles do Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          {capturedPreview ? (
            <>
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 font-medium text-xs transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tirar Outra</span>
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Processar Fotografia</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleCamera}
                disabled={Boolean(error) || starting}
                className="p-3 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors disabled:opacity-40"
                title="Alternar Câmera (Frontal / Traseira)"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleCapture}
                disabled={Boolean(error) || starting}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 border-4 border-blue-500/40 p-1 flex items-center justify-center shadow-xl active:scale-95 transition-all disabled:opacity-40"
                title="Capturar"
              >
                <div className="w-full h-full rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-inner">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
