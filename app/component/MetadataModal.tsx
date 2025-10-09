'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { EditedField, EditedFieldForQuery, MetadataTableResponse, RowDetailsModalProps, Tables_primary_keys_values } from '@/types';
import DynamicInputByType from './DynamicInputByType';
import { Lock, Key, Pencil, X, Save, AlertCircle, Search, Trash2 } from 'lucide-react';
import { validateField, Badge } from '@/util';
import { usePopupReference } from '../services/popups';
import { CLASSNAME_BUTTON } from '@/constant';
import { findIdentifierField } from '@/util/func';
import { useRowDelete } from '@/hook/useRowDelete';
import { createLogger } from '@/util/logger';

const logger = createLogger({ component: 'RowDetailsModal' });
  
const RowDetailsModal: React.FC<RowDetailsModalProps> = ({
  isOpen,
  onClose,
  row,
  informacaosOftables,
  onSave,
  onDelete,
}) => {
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
  const {
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting
  } = useRowDelete({
    row,
    selectedTables,
    onDelete,
    onClose
  });

  // Verificação de mudanças
  const hasChanges = useMemo(() => {
    return Object.values(editedFields).some(field => field.hasChanged);
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
    const mainTableName = row.tableName?.[0] || 'unknown_table';
    rowEntries.forEach(([key, value], index) => {
      let columnName: string;
      let tableName: string;

      if (index < nameColumns.length && nameColumns[index]) {
        columnName = nameColumns[index];
        if (typeof columnName === 'string' && columnName.includes('.')) {
          tableName = columnName.split('.')[0];
        } else {
          tableName = mainTableName;
        }
      } else {
        columnName = key;
        tableName = mainTableName;
      }

      const safeColumnName = typeof columnName === 'string' ? columnName : key;

      initialEditedFields[safeColumnName] = {
        value: value !== null && value !== undefined ? String(value) : '',
        tableName,
        hasChanged: false,
        type_column: typeof value
      };
      initialEnabledFields[safeColumnName] = false;
    });

    setEditedFields(initialEditedFields);
    setEnabledFields(initialEnabledFields);

  }, [row, isOpen, informacaosOftables, setShowDeleteConfirm]);

  // Handler para mudanças nos campos
  const handleFieldChange = useCallback((key: string, value: string, tableName: string, columnType: string, isNullable?: boolean) => {
    let error = validateField(columnType, String(value));
    if (!isNullable && (value === "" || value === null || value === undefined)) {
      error = "Este campo é obrigatório.";
    }
    setErrors(prev => ({
      ...prev,
      [key]: error || ''
    }));

    setEditedFields(prev => {
      const originalValue = row?.row?.[key] ?? '';
      const hasChanged = String(originalValue) !== value;

      return {
        ...prev,
        [key]: {
          value,
          tableName,
          hasChanged,
          type_column: columnType
        }
      };
    });
  }, [row?.row]);

  // Handler para salvar
  const handleSave = useCallback(async () => {
    if (!onSave || !hasChanges) return;

    const hasErrors = Object.values(errors).some(error => error);
    if (hasErrors) {
      logger.warn("Não é possível salvar: existem erros de validação");
      return;
    }
    if (!window.confirm("Tens a certeza que queres editar?")) return;

    setIsLoading(true);

    try {
      const tables_primary_keys_values = Object.entries(editedFields)
        .filter(([, field]) => field.hasChanged)
        .reduce((acc, [key, field]) => {
          const table = selectedTables.find(t => t.table_name === field.tableName);
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
  }, [onSave, hasChanges, errors, editedFields, onClose, informacaosOftables, row, selectedTables]);

  // Handler para alternar edição
  const toggleEdit = useCallback((field: string) => {
    setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Handler para fechar modal
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmClose = window.confirm("Você tem alterações não salvas. Deseja realmente fechar?");
      if (!confirmClose) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  // Handler para clique no overlay
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Early return se modal não deve ser exibido
  if (!isOpen || !row || selectedTables.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-label="Modal de Metadados"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in scale-95">

        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <h2 id="modal-title" className="text-2xl font-bold text-gray-800">
              Detalhes da Linha
            </h2>
            {hasChanges && (
              <span className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Alterações pendentes
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {selectedTables.map((metadata, tableIndex) => (
              <div key={`${metadata.table_name}_${tableIndex}`} className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Tabela: {metadata.table_name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metadata.colunas.map((col, index) => {
                    const qualifiedName = `${metadata.table_name}.${col.nome}`;
                    const editedField = editedFields[qualifiedName];

                    if (!editedField) return null;

                    const isEnabled = enabledFields[qualifiedName] ?? false;
                    const hasError = errors[qualifiedName];
                    const hasChanged = editedField.hasChanged;

                    return (
                      <div key={`${qualifiedName}_${index}`} className="bg-white rounded-lg p-4 border border-gray-200">
                        <label
                          htmlFor={qualifiedName}
                          className="block text-sm font-medium text-gray-700 mb-2 flex flex-wrap items-center gap-2"
                        >
                          <span className={hasChanged ? 'text-blue-600 font-semibold' : ''}>
                            {col.nome}{!col.is_nullable && "*"}
                          </span>

                          {col.is_primary_key && (
                            <Badge color="yellow" icon={<Key className="w-4 h-4" />} text="PK" />
                          )}

                          {col.is_foreign_key && (
                            <div className="flex items-center gap-2">
                              <Badge
                                color="green"
                                icon={<Key className="w-4 h-4" />}
                                text={`→ ${col.referenced_table}.${col.field_references}`}
                              />
                              <button
                                type="button"
                                className={CLASSNAME_BUTTON[0]}
                                disabled={!editedField.value}
                                onClick={() => {
                                  viewReferenceTable({
                                    table: col.referenced_table,
                                    field: col.field_references,
                                    value: editedField.value,
                                  }, {
                                    name: `${metadata.table_name}_${col.nome}_to_${col.referenced_table}_${col.field_references}`
                                  });
                                }}
                                aria-label={`Ver referência de ${col.referenced_table}.${col.field_references}`}
                                title={`Abrir tabela de referência: ${col.referenced_table}.${col.field_references}`}
                              >
                                <Search className={CLASSNAME_BUTTON[1]} />
                              </button>
                            </div>
                          )}

                          <Badge color="gray" text={col.tipo} />

                          {hasChanged && (
                            <Badge color="blue" text="Alterado" />
                          )}
                        </label>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <DynamicInputByType
                              enum_values={col.enum_valores_encontrados}
                              type={col.tipo}
                              value={editedField.value}
                              onChange={(newVal) =>
                                handleFieldChange(qualifiedName, newVal, metadata.table_name, col.tipo, col.is_nullable)
                              }
                              disabled={!isEnabled}
                              aria-invalid={!!hasError}
                            />
                            {hasError && (
                              <p className="text-red-500 text-xs mt-1">{hasError}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={col.is_auto_increment}
                            onClick={() => toggleEdit(qualifiedName)}
                            className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2
                              ${col.is_auto_increment
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isEnabled
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-400'
                              }`}
                            title={
                              col.is_auto_increment
                                ? "Não podes modificar porque é um autoincremento"
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
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          {/* Botão de Delete - Lado esquerdo */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || isDeleting}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Eliminar este registro"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>

          {/* Botões de Save/Cancel - Lado direito */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isLoading || isDeleting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isDeleting || Object.values(errors).some(error => error)}
              className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </footer>

        {/* Modal de Confirmação de Delete */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Confirmar Eliminação</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Tem a certeza que deseja eliminar este registro? Esta ação não pode ser desfeita.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Sim, Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RowDetailsModal;