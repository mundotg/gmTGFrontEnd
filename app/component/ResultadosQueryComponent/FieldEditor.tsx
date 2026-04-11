import DynamicInputByTypeWithNullable from "@/app/component/DynamicInputByTypeWithNullable";
import { CampoDetalhado, EditedField, MetadataTableResponse } from "@/types";
import { Badge } from "@/util";
import { AlertCircle, Key, Lock, Pencil, Search } from "lucide-react";
import React from "react";
import { useI18n } from "@/context/I18nContext";

// Componente para campo individual
const FieldEditor = React.memo(({
  qualifiedName,
  col,
  metadata,
  editedField,
  isEnabled,
  hasError,
  onFieldChange,
  onToggleEdit,
  onViewReference
}: {
  qualifiedName: string;
  col: CampoDetalhado;
  metadata: MetadataTableResponse;
  editedField: EditedField;
  isEnabled: boolean;
  hasError: string;
  onFieldChange: (key: string, value: string, tableName: string, columnType: string, is_nullable?: boolean) => void;
  onToggleEdit: (field: string) => void;
  onViewReference: (table: string, field: string, value: string, name: string) => void;
}) => {
  const { t } = useI18n(); // 👈 Adicionado para os textos internacionalizados
  const hasChanged = editedField.hasChanged; // 👈 Derivado da prop

  return (
    <div
      key={qualifiedName} // 👈 Corrigido: usando qualifiedName
      className={`bg-gray-50 rounded-xl p-4 border transition-colors ${
        hasChanged ? "border-blue-300 bg-blue-50/30 ring-2 ring-blue-50" : "border-gray-200"
      }`}
    >
      <label
        htmlFor={qualifiedName || ""} // 👈 Corrigido: usando qualifiedName
        className="flex flex-wrap items-center gap-2 mb-3"
      >
        <span className={`text-sm ${hasChanged ? "text-blue-700 font-bold" : "text-gray-900 font-semibold"}`}>
          {col.nome.substring(col.nome.indexOf(".") + 1)}{!col.is_nullable && <span className="text-red-500 ml-0.5">*</span>}
        </span>

        {col.is_primary_key && (
          <Badge color="yellow" icon={<Key className="w-3.5 h-3.5" />} text="PK" />
        )}

        {col.is_foreign_key && (
          <div className="flex items-center gap-1.5">
            <Badge
              color="green"
              icon={<Key className="w-3.5 h-3.5" />}
              text={`→ ${col.referenced_table}.${col.field_references}`}
            />
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!editedField.value}
              onClick={() => {
                onViewReference( // 👈 Corrigido: chamando a prop onViewReference
                  col.referenced_table!,
                  col.field_references!,
                  editedField.value,
                  `${metadata.table_name}_${col.nome}_to_${col.referenced_table}_${col.field_references}`
                );
              }}
              aria-label={`${t("actions.viewRef") || "Ver referência de"} ${col.referenced_table}.${col.field_references}`}
              title={`${t("actions.openRefTable") || "Abrir tabela de referência:"} ${col.referenced_table}.${col.field_references}`}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <Badge color="gray" text={col.tipo} />

        {hasChanged && (
          <Badge color="blue" text={t("common.changed") || "Alterado"} />
        )}
      </label>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <DynamicInputByTypeWithNullable
            enum_values={col.enum_valores_encontrados}
            type={col.tipo}
            is_nullable={col.is_nullable}
            value={editedField.value}
            onChange={(newVal) =>
              onFieldChange(qualifiedName || "", newVal, metadata.table_name, col.tipo, col.is_nullable) // 👈 Corrigido: usando as props mapeadas
            }
            disabled={!isEnabled}
            aria-invalid={!!hasError}
          />
          {hasError && (
            <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {hasError}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={col.is_auto_increment}
          onClick={() => onToggleEdit(qualifiedName || "")} // 👈 Corrigido: chamando onToggleEdit
          className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 shadow-sm
            ${col.is_auto_increment
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
              : isEnabled
                ? "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 focus:ring-red-500/50"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-blue-600 focus:ring-blue-500/50"
            }`}
          title={
            col.is_auto_increment
              ? (t("forms.errAutoIncrement") || "Não podes modificar porque é um autoincremento")
              : isEnabled
                ? (t("actions.disableEdit") || "Bloquear edição")
                : (t("actions.enableEdit") || "Habilitar edição")
          }
        >
          {col.is_auto_increment ? (
            <Lock className="w-4 h-4 opacity-50" />
          ) : isEnabled ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Pencil className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
});

FieldEditor.displayName = 'FieldEditor';

export { FieldEditor };