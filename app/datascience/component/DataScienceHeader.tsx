import React from "react";
import {
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCcw,
  Loader2,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

interface DataScienceHeaderProps {
  connected: boolean;
  status: string;
  cached: boolean;
  running: boolean;
  studyMode: boolean;
  onToggleStudyMode: () => void;
  onOpenDictionary: () => void;
  onCopyStudySummary: () => void;
  copiedSummary: boolean;
  onAnalyse: () => void;
}

export function DataScienceHeader({
  connected,
  status,
  cached,
  running,
  studyMode,
  onToggleStudyMode,
  onOpenDictionary,
  onCopyStudySummary,
  copiedSummary,
  onAnalyse,
}: DataScienceHeaderProps) {
  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title + Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                MustaInf · Análise & Ciência de Dados
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                Interativo & Didático
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              {connected ? (
                <Wifi size={12} className="text-emerald-500" />
              ) : (
                <WifiOff size={12} className="text-slate-400" />
              )}
              <span>{status}</span>
              {cached && <span className="font-semibold text-indigo-600">· cache ativo</span>}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Study Mode Toggle */}
          <button
            onClick={onToggleStudyMode}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              studyMode
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
            title="Ative o Modo Estudo para ver explicações detalhadas em cada número e gráfico"
          >
            <GraduationCap size={15} />
            <span>Modo Estudo {studyMode ? "Ativo" : "Desligado"}</span>
          </button>

          {/* Dictionary Button */}
          <button
            onClick={onOpenDictionary}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            title="Abrir o Dicionário de Termos e Fórmulas de Ciência de Dados"
          >
            <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Dicionário de Conceitos</span>
            <span className="sm:hidden">Dicionário</span>
          </button>

          {/* Copy Summary */}
          <button
            onClick={onCopyStudySummary}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            title="Copiar relatório formatado para anotações de estudo"
          >
            {copiedSummary ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-slate-500" />
                <span className="hidden sm:inline">Copiar Resumo</span>
              </>
            )}
          </button>

          {/* Re-analyze Button */}
          <button
            onClick={onAnalyse}
            disabled={running}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {running ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCcw size={14} />
            )}
            <span>{running ? "A analisar…" : "Reanalisar"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
