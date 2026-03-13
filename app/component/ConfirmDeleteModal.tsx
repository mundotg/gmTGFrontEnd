"use client";

import { useEffect, useMemo } from "react";
import { AlertTriangle, Trash2, X, Loader2, Info } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { PayloadDeleteRow } from "./ResultadosQueryComponent/types";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  type: "single" | "all" | "select";
  total?: number;
  lista?: PayloadDeleteRow[];
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  type,
  total,
  lista = [],
  isDeleting,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen || isDeleting) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isDeleting, onClose]);

  

  const safeTotal = total ?? lista.length ?? 0;

  const getMessage = () => {
    switch (type) {
      case "all":
        return (
          t("modals.deleteAllMsg") ||
          "Tem certeza que deseja eliminar todos os {{total}} registros? Esta ação não pode ser desfeita."
        ).replace("{{total}}", String(safeTotal));

      case "select":
        return (
          t("modals.deleteSelectedMsg") ||
          "Tem certeza que deseja eliminar os {{total}} registros selecionados? Esta ação não pode ser desfeita."
        ).replace("{{total}}", String(safeTotal));

      case "single":
      default:
        return (
          t("modals.deleteSingleMsg") ||
          "Tem certeza que deseja eliminar este registro? Esta ação não pode ser desfeita."
        );
    }
  };

  const getTitle = () => {
    switch (type) {
      case "all":
        return t("modals.deleteAllTitle") || "Eliminar Todos os Registros";
      case "select":
        return t("modals.deleteSelectedTitle") || "Eliminar Registros Selecionados";
      case "single":
      default:
        return t("modals.deleteSingleTitle") || "Eliminar Registro";
    }
  };

  const formatPreviewItem = (item: PayloadDeleteRow, fallbackIndex: number) => {
    const entries = Object.entries(item.rowDeletes || {});

    if (entries.length === 0) {
      return `${t("common.record") || "Registro"} #${fallbackIndex + 1}`;
    }

    

    return entries
      .slice(0, 3)
      .map(([tableName, config]) => {
        console.log("primaryKey:",config?.primaryKey ,"primaryKeyValue:", config?.primaryKeyValue)
        const pk = config?.primaryKey || "id";
        const value = config?.primaryKeyValue ?? "undefined";
        const uniqueFlag =
          config?.isPrimarykeyOrUnique === true
            ? "PK/Unique"
            : config?.isPrimarykeyOrUnique === false
            ? "Sem PK/Unique"
            : "Não identificado";

        return `${tableName}.${pk}: ${value} (${uniqueFlag})`;
      })
      .join(" • ");
  };

  const shouldShowPreview = useMemo(() => {
    return lista.length > 0 && (type === "select" || type === "single");
  }, [lista.length, type]);

  const renderRecordsPreview = () => {
    if (!shouldShowPreview) return null;

    const previewItems = type === "single" ? lista.slice(0, 1) : lista.slice(0, 3);
    const hasMore = type !== "single" && lista.length > 3;

    return (
      <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
          {t("modals.recordsToDelete") || "Registros a eliminar"} ({lista.length}):
        </p>

        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
          {previewItems.map((item, idx) => (
            <div
              key={`delete-${idx}`}
              className="text-xs text-gray-700 p-2 bg-white rounded-lg border border-gray-200 shadow-sm truncate flex gap-2"
              title={JSON.stringify(item.rowDeletes, null, 2)}
            >
              <span className="font-bold text-gray-400">#{idx + 1}</span>
              <span className="font-medium truncate">
                {formatPreviewItem(item, idx)}
              </span>
            </div>
          ))}

          {hasMore && (
            <p className="text-xs font-medium text-gray-400 text-center pt-2">
              ... {t("common.andMore") || "e mais"} {lista.length - 3}{" "}
              {t("common.records") || "registros"}
            </p>
          )}
        </div>
      </div>
    );
  };

  const progressPercent =
    isDeleting && safeTotal > 0
      ? Math.min(100, (lista.length / safeTotal) * 100)
      : 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!isDeleting ? onClose : undefined}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t("actions.close") || "Fechar"}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {getTitle()}
              </h3>
              <p className="text-sm font-medium text-gray-500 mt-1.5 leading-relaxed pr-6">
                {getMessage()}
              </p>
            </div>
          </div>

          {renderRecordsPreview()}

          {isDeleting && (
            <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  {t("actions.processing") || "Processando..."}
                </span>
                <span>
                  {Math.min(lista.length, safeTotal)} {t("common.of") || "de"} {safeTotal}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {!isDeleting && (
            <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">
                {t("modals.irreversibleWarning") ||
                  "Esta ação é irreversível. Certifique-se de que os dados não são mais necessários antes de confirmar."}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {t("actions.cancel") || "Cancelar"}
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 border border-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:border-red-400 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("actions.deleting") || "Eliminando..."}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {type === "select" || type === "all"
                  ? `${t("actions.delete") || "Eliminar"} ${safeTotal}`
                  : t("actions.delete") || "Eliminar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}