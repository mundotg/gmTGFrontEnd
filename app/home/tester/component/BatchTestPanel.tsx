"use client";

import React from "react";
import { BarChart3, RefreshCw } from "lucide-react";

type BatchTestPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  loading?: boolean;
  placeholder?: string;
  title?: string;
};

export default function BatchTestPanel({
  value,
  onChange,
  onRun,
  loading = false,
  placeholder,
  title = "Array de Requisições (JSON)",
}: BatchTestPanelProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
        {/* Editor */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-2 block">
            {title}
          </label>

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-56 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none"
          />
        </div>

        {/* Ajuda */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">
            Como usar os testes em lote
          </h4>

          <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
            <p>
              Informe um array JSON com várias requisições para executar uma após outra.
            </p>

            <p>
              Cada item pode ter:
              <span className="font-mono text-slate-300"> name</span>,
              <span className="font-mono text-slate-300"> method</span>,
              <span className="font-mono text-slate-300"> url</span>,
              <span className="font-mono text-slate-300"> headers</span>,
              <span className="font-mono text-slate-300"> body</span> e
              <span className="font-mono text-slate-300"> auth</span>.
            </p>

            <p>
              No campo <span className="font-mono text-slate-300">headers</span>, o valor deve ser uma
              string JSON válida.
            </p>
          </div>
        </div>

        {/* Botão executar */}
        <button
          onClick={onRun}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-6 py-2.5 rounded-lg font-bold transition disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}

          {loading ? "Executando..." : "Executar Testes em Lote"}
        </button>
      </div>
    </div>
  );
}