"use client";
import React from "react";
import { Trash2, Save, Loader2, FlaskConical } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export interface ModalFooterProps {
  onDelete?: () => void; // Opcional: Se não passar, o botão de Eliminar não aparece
  onCancel: () => void;
  onSave: () => void;
  onDryRun?: () => void; // 🧪 Opcional: Testa/Simula as alterações sem persistir (Dry Run)
  
  // Estados de carregamento
  isDeleting?: boolean;
  isSaving?: boolean;
  isDryRunning?: boolean; // 🧪 Estado de carregamento do Dry Run
  isLoading?: boolean; // Bloqueia todos os botões (ex: carregando dados iniciais)
  
  // Regra de negócio: true se não houver mudanças ou tiver erros
  disableSave?: boolean; 
  disableDryRun?: boolean; // 🧪 Desabilita o botão de simular se houver erros

  // Textos customizados opcionais (se não passar, usa os do i18n)
  deleteText?: string;
  cancelText?: string;
  saveText?: string;
  savingText?: string;
  dryRunText?: string;
  dryRunningText?: string;
}

export default function ModalFooter({
  onDelete,
  onCancel,
  onSave,
  onDryRun,
  isDeleting = false,
  isSaving = false,
  isDryRunning = false,
  isLoading = false,
  disableSave = false,
  disableDryRun = false,
  deleteText,
  cancelText,
  saveText,
  savingText,
  dryRunText,
  dryRunningText,
}: ModalFooterProps) {
  const { t } = useI18n();

  const isAnyActionRunning = isLoading || isDeleting || isSaving || isDryRunning;

  return (
    <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
      
      {/* Botão de Delete - Lado esquerdo (Só renderiza se passar o onDelete) */}
      <div className="w-full sm:w-auto">
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isAnyActionRunning}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title={t("actions.deleteRecord") || "Eliminar este registro"}
          >
            <Trash2 className="w-4 h-4" />
            {deleteText || t("actions.delete") || "Eliminar"}
          </button>
        )}
      </div>

      {/* Botões de Save/Cancel - Lado direito */}
      <div className="flex w-full sm:w-auto gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={isAnyActionRunning}
          className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText || t("actions.cancel") || "Cancelar"}
        </button>

        {onDryRun && (
          <button
            type="button"
            onClick={onDryRun}
            disabled={disableDryRun || isAnyActionRunning}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            title={t("actions.simulateChanges") || "Testar alterações sem salvar (Dry Run)"}
          >
            {isDryRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                {dryRunningText || t("actions.simulating") || "Testando..."}
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4 text-purple-600" />
                {dryRunText || t("actions.dryRun") || "Testar (Dry Run)"}
              </>
            )}
          </button>
        )}
        
        <button
          onClick={onSave}
          disabled={disableSave || isAnyActionRunning}
          className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {savingText || t("actions.saving") || "Salvando..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saveText || t("actions.saveChanges") || "Salvar Alterações"}
            </>
          )}
        </button>
      </div>
    </footer>
  );
}