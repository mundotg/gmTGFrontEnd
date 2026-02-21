"use client";
import React, { useState } from "react";
import { useI18n } from "@/context/I18nContext";

export const CreateTableForm: React.FC<{ 
  onCreate: (name: string, schema?: string) => void; 
  onCancel: () => void; 
  schemas: string[] 
}> = ({ onCreate, onCancel, schemas }) => {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [schema, setSchema] = useState<string | undefined>(schemas?.[0]);

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
      
      {/* Select de Schema */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t("tableForm.schemaLabel") || "Schema (opcional)"}
        </label>
        <select 
          value={schema} 
          onChange={(e) => setSchema(e.target.value)} 
          className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
        >
          <option value="">{t("tableForm.defaultSchema") || "(padrão)"}</option>
          {schemas.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
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
          onClick={() => onCreate(name, schema)} 
          disabled={!name.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("actions.create") || "Criar"}
        </button>
      </div>
    </div>
  );
};