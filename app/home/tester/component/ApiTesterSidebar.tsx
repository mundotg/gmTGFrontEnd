"use client";

import React from "react";
import { History, Shield } from "lucide-react";
import { ApiResponseSuccess } from "../types";
import { getStatusColor } from "../util";

type ApiTesterSidebarProps = {
  showSettings: boolean;
  envInput: string;
  setEnvInput: React.Dispatch<React.SetStateAction<string>>;
  requestHistory: ApiResponseSuccess[];
  expandedHistory: number | null;
  setExpandedHistory: React.Dispatch<React.SetStateAction<number | null>>;
  onLoadEnvVars: () => void;
  onReloadHistoryItem: (item: ApiResponseSuccess) => void;
};

export default function ApiTesterSidebar({
  showSettings,
  envInput,
  setEnvInput,
  requestHistory,
  expandedHistory,
  setExpandedHistory,
  onLoadEnvVars,
  onReloadHistoryItem,
}: ApiTesterSidebarProps) {
  return (
    <aside className="w-80 border-r border-slate-700 bg-slate-900/30 overflow-y-auto">
      <div className="p-6 space-y-6">
        {showSettings && (
          <section className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Variáveis
            </h3>

            <textarea
              value={envInput}
              onChange={(e) => setEnvInput(e.target.value)}
              className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:border-cyan-500 outline-none resize-none"
              placeholder='{"BASE_URL": "..."}'
            />

            <button
              type="button"
              onClick={onLoadEnvVars}
              className="w-full bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded text-xs font-semibold transition"
            >
              Carregar Variáveis
            </button>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {requestHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhuma requisição ainda</p>
            ) : (
              requestHistory.map((item, idx) => {
                const isExpanded = expandedHistory === idx;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/40 hover:bg-slate-800/60 rounded border border-slate-700 transition"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedHistory(isExpanded ? null : idx)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs font-bold text-slate-300 truncate">
                            {item.method}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-1">
                            {item.url}
                          </div>
                        </div>

                        <div
                          className={`text-xs font-bold whitespace-nowrap ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 text-xs text-slate-400">
                        <p>Tempo: {item.timeMs.toFixed(2)}ms</p>
                        <p>Tamanho: {item.sizeBytes} bytes</p>

                        <button
                          type="button"
                          onClick={() => onReloadHistoryItem(item)}
                          className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold mt-2"
                        >
                          Recarregar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}