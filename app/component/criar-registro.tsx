'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { EditedField, EditedFieldForQuery, ForeignKeyOption, RowDetailsModalCreateProps } from '@/types';
import DynamicInputByType from './DynamicInputByType';
import { Key, X, Save, AlertCircle } from 'lucide-react';
import { Badge, validateField } from '@/util';
import { ForeignKeySelect } from './ForeignKeySelect';
import api from '@/context/axioCuston';
const CriarRegistroNovo: React.FC<RowDetailsModalCreateProps> = ({
    isOpen,
    onClose,
    informacaosOftables,
    onSave,
}) => {
    const [editedFields, setEditedFields] = useState<Record<string, EditedField>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    // Tabelas selecionadas
    const selectedTables = useMemo(() => informacaosOftables ?? [], [informacaosOftables]);
    // Detecta se houve mudanças
    const hasChanges = useMemo(
        () => Object.values(editedFields).some((field) => field.hasChanged),
        [editedFields]
    );

    // Reset inicial
    useEffect(() => {
        if (!isOpen || !informacaosOftables) {
            setEditedFields({});
            setErrors({});
            return;
        }

        // Inicializa campos vazios para criação
        const initialFields: Record<string, EditedField> = {};

        informacaosOftables.forEach((table) => {
            table.colunas.forEach((col) => {
                const key = `${table.table_name}.${col.nome}`;
                initialFields[key] = {
                    value: '',
                    tableName: table.table_name,
                    hasChanged: false,
                    type_column: col.tipo,

                };
            });
        });

        setEditedFields(initialFields);
    }, [isOpen, informacaosOftables]);

    // Seleciona opção FK
    const handleFkSelect = useCallback((key: string, option: ForeignKeyOption | null, tableName: string, columnType: string) => {
        handleFieldChange(key, option?.id || "", tableName, columnType);
    }, []);

    // Atualiza campo
    const handleFieldChange = useCallback(
        (key: string, value: string, tableName: string, columnType: string, isNullable?: boolean) => {
            let error = validateField(columnType, String(value));

            // Valida NOT NULL
            if (!isNullable && (value === "" || value === null || value === undefined)) {
                error = "Este campo é obrigatório.";
            }

            setErrors((prev) => ({
                ...prev,
                [key]: error || '',
            }));

            setEditedFields((prev) => ({
                ...prev,
                [key]: {
                    value,
                    tableName,
                    hasChanged: true,
                    type_column: columnType,
                },
            }));
        },
        []
    );


    // Salvar novo registro
    const handleSave = useCallback(async () => {
        if (!onSave || !hasChanges) return;

        if (Object.values(errors).some((e) => e)) {
            console.warn('Não é possível salvar: existem erros de validação');
            return;
        }
        if (!window.confirm('Tem certeza que deseja criar este registro?')) return;

        setIsLoading(true);
        try {
            const createdRow = Object.entries(editedFields).reduce<EditedFieldForQuery>(
                (acc, [key, field]) => {
                    if (!field.hasChanged) return acc;
                    const [tableName, column] = key.split('.');
                    if (!acc[tableName]) acc[tableName] = {};
                    acc[tableName][column] = { value: String(field.value), type_column: field.type_column };
                    return acc;
                },
                {}
            );

            console.log('Novo registro a ser salvo:', createdRow);
            // await onSave(newRow);
            const resp =await api.post("/exe/insert_row", { createdRow }, { withCredentials: true });

            if (onSave) onSave(createdRow);

            onClose?.(); // Fecha modal após salvar

        } catch (err) {
            console.error('Erro ao salvar:', err);
            
        } finally {
            setIsLoading(false);
        }
    }, [onSave, hasChanges, errors, editedFields, onClose]);

    // Fechar modal
    const handleClose = useCallback(() => {
        if (hasChanges && !window.confirm('Você tem alterações não salvas. Deseja realmente fechar?')) {
            return;
        }
        onClose();
    }, [hasChanges, onClose]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) handleClose();
        },
        [handleClose]
    );

    if (!isOpen || selectedTables.length === 0) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in scale-95">
                {/* Header */}
                <header className="flex justify-between items-center border-b border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Save className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 id="modal-title" className="text-2xl font-bold text-gray-800">
                                Criar Novo Registro
                            </h2>
                            <p className="text-sm text-gray-600">Preencha os campos para criar um novo registro</p>
                        </div>
                        {hasChanges && (
                            <span className="flex items-center gap-1 text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-full">
                                <AlertCircle className="w-4 h-4" />
                                Alterações pendentes
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label="Fechar modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">
                        {selectedTables.map((metadata, tableIndex) => (
                            <div key={`${metadata.table_name}_${tableIndex}`} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-3">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">T</span>
                                    </div>
                                    {metadata.table_name}
                                    <Badge color="gray" text={`${metadata.colunas.length} campos`} />
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {metadata.colunas.map((col, index) => {
                                        const qualifiedName = `${metadata.table_name}.${col.nome}`;
                                        const fieldState = editedFields[qualifiedName];
                                        if (!fieldState) return null;

                                        const hasError = errors[qualifiedName];
                                        const hasChanged = fieldState.hasChanged;

                                        return (
                                            <div
                                                key={`${qualifiedName}_${index}`}
                                                className={`bg-white rounded-lg p-5 border-2 transition-all duration-200 ${hasChanged
                                                    ? 'border-blue-300 shadow-md ring-2 ring-blue-50'
                                                    : hasError
                                                        ? 'border-red-300 shadow-md ring-2 ring-red-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <label
                                                    htmlFor={qualifiedName}
                                                    className="block text-sm font-medium text-gray-700 mb-3"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`text-base ${hasChanged ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}>
                                                            {col.nome}{!col.is_nullable && "*"}
                                                        </span>

                                                        {col.is_primary_key && (
                                                            <Badge color="yellow" icon={<Key className="w-3 h-3" />} text="PK" />
                                                        )}

                                                        {col.is_auto_increment && (
                                                            <Badge color="blue" text="AUTO" />
                                                        )}

                                                        <Badge color="gray" text={col.tipo} />

                                                        {hasChanged && <Badge color="blue" text="Alterado" />}
                                                    </div>
                                                </label>
                                                <div>
                                                    <DynamicInputByType
                                                        enum_values={col.enum_valores_adicionados}
                                                        type={col.tipo}
                                                        value={fieldState.value}
                                                        onChange={(val) =>
                                                            handleFieldChange(qualifiedName, val, metadata.table_name, col.tipo,col.is_nullable)
                                                        }
                                                        disabled={col.is_auto_increment}
                                                        aria-invalid={!!hasError}
                                                    //   className={`transition-colors ${hasError ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                    />
                                                    {col.is_foreign_key && <ForeignKeySelect
                                                        referencedTable={col.referenced_table!}
                                                        referencedField={col.field_references!}
                                                        value={fieldState.value}
                                                        onChange={(valor, option) =>
                                                            handleFkSelect(qualifiedName, option, metadata.table_name, col.tipo)
                                                        }
                                                    />}

                                                </div>



                                                {hasError && (
                                                    <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {hasError}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 hover:shadow-sm"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isLoading || Object.values(errors).some((e) => e)}
                        className="px-6 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:shadow-md disabled:hover:shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Criar novo registro
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CriarRegistroNovo;