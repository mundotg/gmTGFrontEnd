import React from "react";
import { BarChart3, Wifi, WifiOff, RefreshCcw, Loader2 } from "lucide-react";

interface DataScienceHeaderProps {
  connected: boolean;
  status: string;
  cached: boolean;
  running: boolean;
  onAnalyse: () => void;
}

export function DataScienceHeader({
  connected,
  status,
  cached,
  running,
  onAnalyse,
}: DataScienceHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center">
          <BarChart3 size={20} />
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            Análise de Dados
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            {connected ? (
              <Wifi size={12} className="text-emerald-500" />
            ) : (
              <WifiOff size={12} className="text-slate-400" />
            )}
            {status}
            {cached && " · cache"}
          </p>
        </div>
        <button
          onClick={onAnalyse}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          {running ? "A analisar…" : "Reanalisar"}
        </button>
      </div>
    </header>
  );
}
