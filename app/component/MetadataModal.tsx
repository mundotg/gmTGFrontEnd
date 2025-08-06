'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MetadataTableResponse, SelectedRow } from '@/types';
import DynamicInputByType from './DynamicInputByType';
import { Lock, Key, Pencil, X, Save, AlertCircle } from 'lucide-react';

interface RowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: SelectedRow | null;
  selectColumns?: string[];
  informacaosOftables: MetadataTableResponse[];
  onSave?: (updatedRow: Record<string, any>) => void;
}

interface EditedField {
  value: string;
  tableName: string;
  hasChanged: boolean;
}

const RowDetailsModal: React.FC<RowDetailsModalProps> = ({
  isOpen,
  onClose,
  row,
  selectColumns,
  informacaosOftables,
  onSave
}) => {
  const [editedFields, setEditedFields] = useState<Record<string, EditedField>>({});
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoização das tabelas selecionadas
  const selectedTables = useMemo(() => {
    if (!selectColumns || !informacaosOftables) return [];
    
    return informacaosOftables.filter((table) => 
      selectColumns.some((col) => col.startsWith(`${table.table_name}.`))
    );
  }, [selectColumns, informacaosOftables]);

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
      return;
    }

    // Inicializar campos editados com valores originais
    const initialEditedFields: Record<string, EditedField> = {};
    const initialEnabledFields: Record<string, boolean> = {};

    Object.entries(row.row).forEach(([key, value]) => {
      const tableName = key.split('.')[0];
      initialEditedFields[key] = {
        value: String(value ?? ''),
        tableName,
        hasChanged: false
      };
      initialEnabledFields[key] = false;
    });

    setEditedFields(initialEditedFields);
    setEnabledFields(initialEnabledFields);
  }, [row, isOpen]);

  // Validação de campo
  const validateField = useCallback((columnType: string, value: string): string | null => {
    if (!value.trim()) return null;

    switch (columnType.toLowerCase()) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Email inválido';
      case 'int':
      case 'integer':
        return isNaN(Number(value)) ? 'Deve ser um número inteiro' : null;
      case 'float':
      case 'decimal':
        return isNaN(Number(value)) ? 'Deve ser um número decimal' : null;
      case 'date':
        return isNaN(Date.parse(value)) ? 'Data inválida' : null;
      default:
        return null;
    }
  }, []);

  // Handler para mudanças nos campos
  const handleFieldChange = useCallback((key: string, value: string, tableName: string, columnType: string) => {
    // Validação
    const error = validateField(columnType, String(value));
    setErrors(prev => ({
      ...prev,
      [key]: error || ''
    }));

    // Atualizar campo editado
    setEditedFields(prev => {
      const originalValue = row?.row?.[key] ?? '';
      const hasChanged = String(originalValue) !== value;
      
      return {
        ...prev,
        [key]: {
          value,
          tableName,
          hasChanged
        }
      };
    });
  }, [row?.row, validateField]);

  // Handler para salvar
  const handleSave = useCallback(async () => {
    if (!onSave || !hasChanges) return;

    // Verificar se há erros
    const hasErrors = Object.values(errors).some(error => error);
    if (hasErrors) {
      console.warn("Não é possível salvar: existem erros de validação");
      return;
    }

    setIsLoading(true);
    
    try {
      // Filtrar apenas campos que foram alterados
      const changedFields = Object.entries(editedFields)
        .filter(([, field]) => field.hasChanged)
        .reduce((acc, [key, field]) => {
          acc[key] = { value: field.value, tableName: field.tableName };
          return acc;
        }, {} as Record<string, any>);

      await onSave(changedFields);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onSave, hasChanges, errors, editedFields, onClose]);

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
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Detalhes da Linha
            </h2>
            {hasChanges && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Alterações pendentes</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {selectedTables.map((metadata, tableIndex) => (
              <div key={`${metadata.table_name}_${tableIndex}`} className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Tabela: {metadata.table_name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metadata.colunas.map((col, index) => {
                    const qualifiedName = `${metadata.table_name}.${col.nome}`;
                    const editedField = editedFields[qualifiedName];
                    
                    if (!editedField) {
                      return null;
                    }

                    const isEnabled = enabledFields[qualifiedName] ?? false;
                    const hasError = errors[qualifiedName];
                    const hasChanged = editedField.hasChanged;

                    return (
                      <div key={`${qualifiedName}_${index}`} className="bg-white rounded-lg p-4 border border-gray-200">
                        <label
                          htmlFor={qualifiedName}
                          className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                        >
                          <span className={hasChanged ? 'text-blue-600 font-semibold' : ''}>
                            {col.nome}
                          </span>
                          {col.is_ForeignKey && (
                            <Key className="w-4 h-4 text-blue-500" xlinkTitle="Chave estrangeira" />
                          )}
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {col.tipo}
                          </span>
                          {hasChanged && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Alterado
                            </span>
                          )}
                        </label>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <DynamicInputByType
                              type={col.tipo}
                              value={editedField.value}
                              onChange={(newVal) => handleFieldChange(qualifiedName, newVal, metadata.table_name, col.tipo)}
                              disabled={!isEnabled}
                            />
                            {hasError && (
                              <p className="text-red-500 text-xs mt-1">{hasError}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleEdit(qualifiedName)}
                            className={`p-2 rounded-lg transition-all ${
                              isEnabled
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                            }`}
                            title={isEnabled ? 'Bloquear edição' : 'Habilitar edição'}
                          >
                            {isEnabled ? <Lock className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading || Object.values(errors).some(error => error)}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      </div>
    </div>
  );
};

export default RowDetailsModal;