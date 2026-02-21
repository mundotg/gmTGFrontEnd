"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  EditedField,
  EditedFieldForQuery,
  MetadataTableResponse,
  RowDetailsModalProps,
  Tables_primary_keys_values,
} from "@/types";
import { Lock, Key, Pencil, X, Save, AlertCircle, Search, Trash2, Loader2 } from "lucide-react";
import { validateField, Badge } from "@/util";
import { usePopupReference } from "../services/popups";
import { findIdentifierField } from "@/util/func";
import { useRowDelete } from "@/hook/useRowDelete";
import { createLogger } from "@/util/logger";
import DynamicInputByTypeWithNullable from "./DynamicInputByTypeWithNullable";
import ConfirmDeleteModal from "./ConfirmDeleteModal"; // 🔹 Importado o modal padronizado
import { useI18n } from "@/context/I18nContext"; // 🔹 Importado

const logger = createLogger({ component: "RowDetailsModal" });

const RowDetailsModal: React.FC<RowDetailsModalProps> = ({
  isOpen,
  onClose,
  row,
  informacaosOftables,
  onSave,
  onDelete,
}) => {
  const { t } = useI18n();
  const [editedFields, setEditedFields] = useState<Record<string, EditedField>>({});
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { openReferencePopup: viewReferenceTable } = usePopupReference();

  // Memoização das tabelas selecionadas
  const selectedTables = useMemo<MetadataTableResponse[]>(() => {
    if (!row?.tableName || !informacaosOftables) return [];

    return Object.entries(informacaosOftables)
      .filter(([tableName]) => row.tableName?.includes(tableName))
      .map(([tableName, colunas]) => ({
        message: "",
        executado_em: "",
        connection_id: 0,
        schema_name: "",
        table_name: tableName,
        total_colunas: colunas.length,
        colunas,
      }));
  }, [row, informacaosOftables]);

  // Usa o hook de delete
  const { handleDelete, showDeleteConfirm, setShowDeleteConfirm, isDeleting } = useRowDelete({
    row,
    selectedTables,
    onDelete,
    onClose,
  });

  // Verificação de mudanças
  const hasChanges = useMemo(() => {
    return Object.values(editedFields).some((field) => field.hasChanged);
  }, [editedFields]);

  // Reset do modal quando abrir/fechar
  useEffect(() => {
    if (!isOpen || !row?.row) {
      setEditedFields({});
      setEnabledFields({});
      setErrors({});
      setShowDeleteConfirm(false);
      return;
    }

    const initialEditedFields: Record<string, EditedField> = {};
    const initialEnabledFields: Record<string, boolean> = {};

    const rowEntries = Object.entries(row.row);
    const nameColumns = row.nameColumns || [];
    const mainTableName = row.tableName?.[0] || "unknown_table";
    
    rowEntries.forEach(([key, value], index) => {
      let columnName: string;
      let tableName: string;

      if (index < nameColumns.length && nameColumns[index]) {
        columnName = nameColumns[index];
        if (typeof columnName === "string" && columnName.includes(".")) {
          tableName = columnName.split(".")[0];
        } else {
          tableName = mainTableName;
        }
      } else {
        columnName = key;
        tableName = mainTableName;
      }

      const safeColumnName = typeof columnName === "string" ? columnName : key;

      initialEditedFields[safeColumnName] = {
        value: value !== null && value !== undefined ? String(value) : "",
        tableName,
        hasChanged: false,
        type_column: typeof value,
      };
      initialEnabledFields[safeColumnName] = false;
    });

    setEditedFields(initialEditedFields);
    setEnabledFields(initialEnabledFields);
  }, [row, isOpen, informacaosOftables, setShowDeleteConfirm]);

  // Handler para mudanças nos campos
  const handleFieldChange = useCallback(
    (key: string, value: string, tableName: string, columnType: string, isNullable?: boolean) => {
      let error = validateField(columnType, String(value));
      if (!isNullable && (value === "" || value === null || value === undefined)) {
        error = t("common.requiredField") || "Este campo é obrigatório.";
      }
      setErrors((prev) => ({
        ...prev,
        [key]: error || "",
      }));

      setEditedFields((prev) => {
        const originalValue = row?.row?.[key] ?? "";
        const hasChanged = String(originalValue) !== value;

        return {
          ...prev,
          [key]: {
            value,
            tableName,
            hasChanged,
            type_column: columnType,
          },
        };
      });
    },
    [row?.row, t]
  );

  // Handler para salvar
  const handleSave = useCallback(async () => {
    if (!onSave || !hasChanges) return;

    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      logger.warn("Não é possível salvar: existem erros de validação");
      return;
    }
    if (!window.confirm(t("actions.confirmEdit") || "Tens a certeza que queres editar?")) return;

    setIsLoading(true);

    try {
      const tables_primary_keys_values = Object.entries(editedFields)
        .filter(([, field]) => field.hasChanged)
        .reduce((acc, [key, field]) => {
          const table = selectedTables.find((t) => t.table_name === field.tableName);
          if (!table) return acc;

          if (!acc[table.table_name]) {
            const primaryKeyField = findIdentifierField(table.table_name, selectedTables)?.nome;
            const primary_key_name = `${table.table_name}.${primaryKeyField}`;
            acc[table.table_name] = {
              primaryKey: primary_key_name,
              valor: String(row?.row?.[primary_key_name]) ?? "null",
            };
          }

          acc[table.table_name][key] = field.value;
          return acc;
        }, {} as Tables_primary_keys_values);

      const updatedRow = Object.entries(editedFields)
        .filter(([, field]) => field.hasChanged)
        .reduce<EditedFieldForQuery>((acc, [key, field]) => {
          const [tableName, column] = key?.split(".");
          if (!acc[tableName]) acc[tableName] = {};
          acc[tableName][column] = { value: String(field.value), type_column: field.type_column };
          return acc;
        }, {});

      logger.success("Campos alterados:", updatedRow);

      await onSave(updatedRow, tables_primary_keys_values, row?.index ?? -1);
      onClose();
    } catch (error) {
      logger.error("Erro ao salvar:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onSave, hasChanges, errors, editedFields, onClose, row, selectedTables, t]);

  // Handler para alternar edição
  const toggleEdit = useCallback((field: string) => {
    setEnabledFields((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Handler para fechar modal
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmClose = window.confirm(t("actions.confirmDiscard") || "Você tem alterações não salvas. Deseja realmente fechar?");
      if (!confirmClose) return;
    }
    onClose();
  }, [hasChanges, onClose, t]);

  // Handler para clique no overlay
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Early return se modal não deve ser exibido
  if (!isOpen || !row || selectedTables.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-label={t("modals.rowDetails") || "Modal de Detalhes da Linha"}
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-200 p-5 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900">
              {t("modals.rowDetails") || "Detalhes da Linha"}
            </h2>
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 text-xs font-bold px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                {t("forms.pendingChanges") || "Alterações pendentes"}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label={t("actions.close") || "Fechar modal"}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="space-y-8">
            {selectedTables.map((metadata, tableIndex) => (
              <div key={`${metadata.table_name}_${tableIndex}`} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                  {t("common.table") || "Tabela"}: {metadata.table_name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {metadata.colunas.map((col, index) => {
                    const qualifiedName = `${metadata.table_name}.${col.nome}`;
                    const editedField = editedFields[qualifiedName];

                    if (!editedField) return null;

                    const isEnabled = enabledFields[qualifiedName] ?? false;
                    const hasError = errors[qualifiedName];
                    const hasChanged = editedField.hasChanged;

                    return (
                      <div 
                        key={`${qualifiedName}_${index}`} 
                        className={`bg-gray-50 rounded-xl p-4 border transition-colors ${
                          hasChanged ? "border-blue-300 bg-blue-50/30 ring-2 ring-blue-50" : "border-gray-200"
                        }`}
                      >
                        <label
                          htmlFor={qualifiedName}
                          className="flex flex-wrap items-center gap-2 mb-3"
                        >
                          <span className={`text-sm ${hasChanged ? "text-blue-700 font-bold" : "text-gray-900 font-semibold"}`}>
                            {col.nome}{!col.is_nullable && <span className="text-red-500 ml-0.5">*</span>}
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
                                  viewReferenceTable({
                                    table: col.referenced_table!,
                                    field: col.field_references!,
                                    value: editedField.value,
                                  }, {
                                    name: `${metadata.table_name}_${col.nome}_to_${col.referenced_table}_${col.field_references}`
                                  });
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
                                handleFieldChange(qualifiedName, newVal, metadata.table_name, col.tipo, col.is_nullable)
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
                            onClick={() => toggleEdit(qualifiedName)}
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
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          {/* Botão de Delete - Lado esquerdo */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title={t("actions.deleteRecord") || "Eliminar este registro"}
          >
            <Trash2 className="w-4 h-4" />
            {t("actions.delete") || "Eliminar"}
          </button>

          {/* Botões de Save/Cancel - Lado direito */}
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
              disabled={isLoading || isDeleting}
            >
              {t("actions.cancel") || "Cancelar"}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isDeleting || Object.values(errors).some(error => error)}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("actions.saving") || "Salvando..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t("actions.saveChanges") || "Salvar Alterações"}
                </>
              )}
            </button>
          </div>
        </footer>

        {/* Modal de Confirmação de Delete (Componente Padronizado) */}
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          type="single"
          isDeleting={isDeleting}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
};

export default RowDetailsModal;