"use client";
import { DBStructure } from "@/types/db-structure";
import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";

export const EditTableForm: React.FC<{ 
  tableName: string | null; 
  onSave: (newName: string, newDesc: string) => void; 
  onCancel: () => void; 
  getStructure: (name: string) => DBStructure | undefined 
}> = ({ tableName, onSave, onCancel, getStructure }) => {
  const { t } = useI18n();
  const structure = tableName ? getStructure(tableName) : undefined;
  
  const [name, setName] = useState(tableName ?? "");
  const [desc, setDesc] = useState(structure?.description ?? "");

  // Sincroniza o estado caso a tabela a ser editada mude
  useEffect(() => {
    setName(tableName ?? "");
    setDesc(structure?.description ?? "");
  }, [tableName, structure]);

  return (
    <div className="space-y-4">
      {/* Input de Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t("tableForm.nameLabel") || "Nome da tabela"}
        </label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder={t("tableForm.namePlaceholder") || "Ex: usuarios"}
          className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
        />
      </div>

      {/* Textarea de Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t("tableForm.descLabel") || "Descrição"}
        </label>
        <textarea 
          value={desc} 
          onChange={(e) => setDesc(e.target.value)} 
          rows={3}
          placeholder={t("tableForm.descPlaceholder") || "Adicione uma descrição para esta tabela..."}
          className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none" 
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
        <button 
          onClick={onCancel} 
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t("actions.cancel") || "Cancelar"}
        </button>
        <button 
          onClick={() => onSave(name, desc)} 
          disabled={!name.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("actions.save") || "Salvar"}
        </button>
      </div>
    </div>
  );
};