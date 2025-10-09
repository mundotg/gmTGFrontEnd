"use client";

import { Check, CheckCircle, Key, Lock, XCircle } from "lucide-react";
import React from "react";
import clsx from "clsx";
import { CampoDetalhado } from "@/types";


interface RenderItemProps {
  column: CampoDetalhado & { tableName: string };
  index: number;
  isSelected: boolean;
  currentTheme: "light" | "dark";
  themeClasses: { card: string; cardSelected: string };
  onColumnClick?: (col: CampoDetalhado & { tableName: string }) => void;
  handleColumnClick: (col: CampoDetalhado & { tableName: string }) => void;
  handleColumnSelect: (col: CampoDetalhado & { tableName: string }, e: React.MouseEvent) => void;
  getColumnIcon: (col: CampoDetalhado & { tableName: string }, theme: "light" | "dark") => React.ReactNode;
}

export function RenderItem({
  column,
  index,
  isSelected,
  currentTheme,
  themeClasses,
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
        "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400",
        isSelected ? themeClasses.cardSelected : themeClasses.card,
        onColumnClick && "hover:shadow-md hover:scale-[1.02]"
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Coluna ${column.nome}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onColumnClick?.(column);
        }
      }}
    >
      {/* Checkbox de seleção */}
      <div
        className="absolute top-2 right-2 z-10"
        onClick={(e) => handleColumnSelect(column, e)}
      >
        <div
          className={clsx(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
            isSelected
              ? currentTheme === "dark"
                ? "bg-blue-600 border-blue-600"
                : "bg-blue-500 border-blue-500"
              : currentTheme === "dark"
              ? "border-gray-500 hover:border-blue-500 bg-gray-800"
              : "border-gray-300 hover:border-blue-400 bg-white"
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Indicador visual de seleção */}
      {isSelected && (
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-1 rounded-t-lg",
            currentTheme === "dark" ? "bg-blue-500" : "bg-blue-400"
          )}
        />
      )}

      <div className="flex items-start gap-3 pr-8">
        {getColumnIcon(column, currentTheme)}

        <div className="flex-1 min-w-0">
          {/* Nome da coluna */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate" title={column.nome}>
              {column.nome}
            </span>
            {column.is_primary_key && (
              <Key
                className="w-3 h-3 text-yellow-500 flex-shrink-0"
                aria-label="Chave primária"
              />
            )}
          </div>

          {/* Tipo + Nullability */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
            <span
              className={clsx(
                "font-mono px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-[80px]",
                currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
              )}
              title={column.tipo.toUpperCase()}
            >
              {column.tipo.toUpperCase()}
            </span>

            {column.is_nullable ? (
              <span className="text-green-500 flex items-center gap-1 sm:text-[10px]">
                <CheckCircle className="w-3 h-3 sm:w-2 sm:h-2" /> NULL
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-1 sm:text-[10px]">
                <XCircle className="w-3 h-3 sm:w-2 sm:h-2" /> NOT NULL
              </span>
            )}
          </div>

          {/* Valor padrão */}
          {column.default != null && (
            <div className="text-xs opacity-75 mb-1 break-words">
              <span className="mr-1">Padrão:</span>
              <code
                className={clsx(
                  "px-1 py-0.5 rounded font-mono text-xs break-all",
                  currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
                )}
              >
                {String(column.default)}
              </code>
            </div>
          )}

          {/* ENUM valores */}
          {column.enum_valores_encontrados &&
            column.enum_valores_encontrados.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {column.enum_valores_encontrados.map((valor, idx) => (
                  <span
                    key={`${valor}-${idx}-enum`}
                    className="text-xs sm:text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded font-mono truncate max-w-[100px]"
                    title={valor}
                  >
                    {valor}
                  </span>
                ))}
              </div>
            )}

          {/* Foreign Key */}
          {column.is_foreign_key && (
            <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3" />
              {column.referenced_table} - {column.field_references}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
