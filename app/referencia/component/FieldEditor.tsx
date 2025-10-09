import DynamicInputByType from "@/app/component/DynamicInputByType";
import { CLASSNAME_BUTTON } from "@/constant";
import { CampoDetalhado, EditedField, MetadataTableResponse } from "@/types";
import { Badge } from "@/util";
import { AlertCircle, Key, Lock, Pencil, Search } from "lucide-react";
import React from "react";




// Componente para campo individual
const FieldEditor = React.memo(({
  col,
  metadata,
  editedField,
  isEnabled,
  hasError,
  onFieldChange,
  onToggleEdit,
  onViewReference
}: {
  col: CampoDetalhado;
  metadata: MetadataTableResponse;
  editedField: EditedField;
  isEnabled: boolean;
  hasError: string;
  onFieldChange: (key: string, value: string, tableName: string, columnType: string, is_nullable?: boolean) => void;
  onToggleEdit: (field: string) => void;
  onViewReference: (table: string, field: string, value: string, name: string) => void;
}) => {
  const qualifiedName = `${metadata.table_name}.${col.nome}`;
  const hasChanged = editedField.hasChanged;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`${hasChanged ? 'text-blue-600 font-semibold' : ''} transition-colors`}>
            {col.nome}{!col.is_nullable && "*"}
          </span>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1">
            {col.is_primary_key && (
              <Badge color="yellow" icon={<Key className="w-3 h-3" />} text="PK" />
            )}

            {col.is_foreign_key && (
              <>
                <Badge
                  color="green"
                  icon={<Key className="w-3 h-3" />}
                  text={`→ ${col.referenced_table}.${col.field_references}`}
                />
                <button
                  type="button"
                  className={`${CLASSNAME_BUTTON[0]} !p-1`}
                  onClick={() => onViewReference(
                    col.referenced_table ?? '',
                    col.field_references ?? '',
                    editedField.value,
                    `${metadata.table_name}_${col.nome}_to_${col.referenced_table ?? ''}_${col.field_references ?? ''}`
                  )}
                  aria-label={`Ver referência de ${col.referenced_table ?? ''}.${col.field_references ?? ''}`}
                  title={`Abrir tabela de referência: ${col.referenced_table ?? ''}.${col.field_references ?? ''}`}
                >
                  <Search className="w-3 h-3" />
                </button>
              </>
            )}

            <Badge color="gray" text={col.tipo} />

            {col.is_auto_increment && (
              <Badge color="yellow" text="AUTO" />
            )}

            {hasChanged && (
              <Badge color="blue" text="Alterado" />
            )}
          </div>
        </div>
      </label>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <DynamicInputByType
            enum_values={col.enum_valores_encontrados}
            type={col.tipo}
            value={editedField.value}
            onChange={(newVal) => onFieldChange(qualifiedName, newVal, metadata.table_name, col.tipo, col.is_nullable)}
            disabled={!isEnabled}
            placeholder={`Digite ${col.nome}...`}
          />
          {hasError && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {hasError}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={col.is_auto_increment}
          onClick={() => onToggleEdit(qualifiedName)}
          className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 flex-shrink-0
            ${col.is_auto_increment
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isEnabled
                ? 'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-400'
                : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-400'
            }`}
          title={
            col.is_auto_increment
              ? "Campo auto incremento - não editável"
              : isEnabled
                ? 'Bloquear edição'
                : 'Habilitar edição'
          }
        >
          {col.is_auto_increment
            ? <Lock className="w-4 h-4 opacity-50" />
            : isEnabled
              ? <Lock className="w-4 h-4" />
              : <Pencil className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
});

FieldEditor.displayName = 'FieldEditor';

export {FieldEditor}