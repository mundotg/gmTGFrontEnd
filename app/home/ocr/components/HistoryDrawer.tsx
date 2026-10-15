"use client";

import React from "react";
import { History, X, Trash2, ArrowRight, FileText, Image as ImageIcon, TableProperties, Calendar, Copy, Check } from "lucide-react";

export interface OCRHistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  fileType: string;
  textSnippet: string;
  fullText: string;
  linesCount: number;
  extractedData?: Record<string, string>;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OCRHistoryItem[];
  onSelect: (item: OCRHistoryItem) => void;
  onClear: () => void;
  onDeleteOne: (id: string) => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  items,
  onSelect,
  onClear,
  onDeleteOne,
}: HistoryDrawerProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatDate = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getIcon = (type: string, name: string) => {
    if (type.includes("pdf") || name.endsWith(".pdf")) return <FileText className="w-4 h-4 text-red-500" />;
    if (type.includes("sheet") || name.match(/\.(xlsx|xls|csv)$/i)) return <TableProperties className="w-4 h-4 text-emerald-500" />;
    return <ImageIcon className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/80 text-blue-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Histórico de Scans</h3>
              <p className="text-xs text-gray-500">{items.length} leituras salvas localmente</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Limpar todo o histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <History className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Nenhum scan recente</p>
              <p className="text-xs text-gray-400 max-w-xs">
                As imagens, PDFs e planilhas processadas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="group p-3.5 rounded-2xl border border-gray-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer relative bg-white shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-gray-100 rounded-lg shrink-0">
                      {getIcon(item.fileType, item.fileName)}
                    </div>
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {item.fileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleCopy(item.id, item.fullText, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      title="Copiar texto"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOne(item.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Excluir este item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded-lg line-clamp-2 leading-relaxed border border-gray-100 mb-2">
                  {item.textSnippet || "Sem texto extraído"}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.timestamp)}
                  </span>
                  <span className="font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Restaurar <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
