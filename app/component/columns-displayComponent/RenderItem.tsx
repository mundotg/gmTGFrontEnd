"use client";

import { Check, CheckCircle, Key, Lock, XCircle } from "lucide-react";
import React from "react";
import clsx from "clsx";
import { CampoDetalhado } from "@/types";

interface RenderItemProps {
  column: CampoDetalhado & { tableName: string };
  index: number;
  isSelected: boolean;
  
  // Propriedades mantidas para compatibilidade de assinatura, mas ignoradas no visual
  currentTheme?: "light" | "dark";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  themeClasses?: any; 
  
  onColumnClick?: (col: CampoDetalhado & { tableName: string }) => void;
  handleColumnClick: (col: CampoDetalhado & { tableName: string }) => void;
  handleColumnSelect: (col: CampoDetalhado & { tableName: string }, e: React.MouseEvent) => void;
  getColumnIcon: (col: CampoDetalhado & { tableName: string }, theme: "light" | "dark") => React.ReactNode;
}

export function RenderItem({
  column,
  index,
  isSelected,
  currentTheme = "light", // Fallback seguro
  onColumnClick,
  handleColumnClick,
  handleColumnSelect,
  getColumnIcon,
}: RenderItemProps) {
  return (
    <div
      key={`${column.nome}-${index}-pa`}
      onClick={() => handleColumnClick(column)}
      className={clsx(
        "relative p-4 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 overflow-hidden",
        isSelected 
          ? "bg-blue-50/30 border-blue-500 shadow-sm" 
          : "bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50",
        onColumnClick && "hover:shadow-md hover:-translate-y-0.5"
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Coluna ${column.nome}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onColumnClick?.(column);
        }
      }}
    >
      {/* Checkbox de seleção customizado (Padrão Oficial) */}
      <div
        className="absolute top-3 right-3 z-10 p-1"
        onClick={(e) => handleColumnSelect(column, e)}
      >
        <div
          className={clsx(
            "w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer border",
            isSelected
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-300 text-transparent hover:border-blue-400"
          )}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
      </div>

      {/* Indicador visual de seleção (Topo colorido) */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-xl" />
      )}

      <div className="flex items-start gap-3 pr-8">
        {/* Container do ícone */}
        <div className="mt-0.5 p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 shrink-0">
          {getColumnIcon(column, currentTheme)}
        </div>

        <div className="flex-1 min-w-0">
          
          {/* Nome da coluna e Chave Primária */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-gray-900 truncate" title={column.nome}>
              {column.nome}
            </span>
            {column.is_primary_key && (
              <div className="bg-amber-50 p-1 rounded border border-amber-200 flex-shrink-0" title="Chave Primária">
                <Key className="w-3 h-3 text-amber-600" aria-label="Chave primária" />
              </div>
            )}
          </div>

          {/* Tipo + Nullability */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
            <span
              className="font-mono bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-[80px]"
              title={column.tipo.toUpperCase()}
            >
              {column.tipo.toUpperCase()}
            </span>

            {column.is_nullable ? (
              <span className="text-gray-500 flex items-center gap-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                <CheckCircle className="w-3 h-3 text-gray-400" /> NULL
              </span>
            ) : (
              <span className="text-gray-700 flex items-center gap-1 font-medium bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                <XCircle className="w-3 h-3 text-red-500" /> NOT NULL
              </span>
            )}
          </div>

          {/* Valor padrão */}
          {column.default != null && (
            <div className="text-xs text-gray-500 mb-2 break-words bg-gray-50 p-1.5 rounded-md border border-gray-100">
              <span className="mr-1 font-semibold">Padrão:</span>
              <code className="font-mono text-gray-700 break-all bg-white px-1 rounded border border-gray-200">
                {String(column.default)}
              </code>
            </div>
          )}

          {/* ENUM valores */}
          {column.enum_valores_encontrados && column.enum_valores_encontrados.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {column.enum_valores_encontrados.map((valor, idx) => (
                <span
                  key={`${valor}-${idx}-enum`}
                  className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded truncate max-w-[100px]"
                  title={valor}
                >
                  {valor}
                </span>
              ))}
            </div>
          )}

          {/* Foreign Key */}
          {column.is_foreign_key && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md flex items-center gap-1.5 mt-2 w-fit">
              <Lock className="w-3 h-3 text-indigo-500" />
              {column.referenced_table} - {column.field_references}
            </span>
          )}
          
        </div>
      </div>
    </div>
  );
}