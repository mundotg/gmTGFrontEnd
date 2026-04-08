"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  CampoDetalhado,
  EditedField,
  EditedFieldForQuery,
  ForeignKeyOption,
  RowDetailsModalCreateProps,
} from "@/types";
import { Key, X, Save, AlertCircle, Database, Loader2 } from "lucide-react";
import { Badge, validateField } from "@/util";
import { ForeignKeySelect } from "./ForeignKeySelect";
import api from "@/context/axioCuston";
import DynamicInputByTypeWithNullable from "./DynamicInputByTypeWithNullable";
import { useI18n } from "@/context/I18nContext";
import OCRButton from "./ocrComponent";

const CriarRegistroNovo: React.FC<RowDetailsModalCreateProps> = ({
  isOpen,
  onClose,
  informacaosOftables,
  onSave,
}) => {
  const { t } = useI18n();
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
          value: "",
          tableName: table.table_name,
          hasChanged: false,
          type_column: col.tipo,
        };
      });
    });

    setEditedFields(initialFields);
  }, [isOpen, informacaosOftables]);





  const handleOcrResult = useCallback(
    (mappedValues: Record<string, EditedField>) => {

      setEditedFields((prev) => {
        const updated = { ...prev };

        Object.entries(mappedValues).forEach(([rawKey, fieldData]) => {
          if (!fieldData.hasChanged) return;

          const key = rawKey.includes(".")
            ? rawKey
            : `${fieldData.tableName}.${rawKey}`;

          if (updated[key]) {
            updated[key] = {
              ...updated[key],
              value: fieldData.value,
              hasChanged: true,
            };
          }
        });

        return updated;
      });

      setErrors((prev) => {
        const updated = { ...prev };

        Object.entries(mappedValues).forEach(([rawKey, fieldData]) => {
          const key = rawKey.includes(".")
            ? rawKey
            : `${fieldData.tableName}.${rawKey}`;

          if (fieldData.value && updated[key]) {
            updated[key] = "";
          }
        });

        return updated;
      });
    },
    []
  );
  // Atualiza campo
  const handleFieldChange = useCallback(
    (
      key: string,
      value: string,
      tableName: string,
      columnType: string,
      isNullable?: boolean
    ) => {
      let error = validateField(columnType, String(value));

      // Valida NOT NULL
      if (!isNullable && (value === "" || value === null || value === undefined)) {
        error = t("common.requiredField") || "Este campo é obrigatório.";
      }

      setErrors((prev) => ({
        ...prev,
        [key]: error || "",
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
    [t]
  );

  // Seleciona opção FK
  const handleFkSelect = useCallback(
    (
      key: string,
      option: ForeignKeyOption | null,
      tableName: string,
      columnType: string
    ) => {
      handleFieldChange(key, option?.id || "", tableName, columnType);
    },
    [handleFieldChange]
  );

  const ocrFields = useMemo<CampoDetalhado[]>(() => {
    // 1. Prevenção: Se os estados ainda não carregaram
    if (Object.keys(editedFields).length === 0 || selectedTables.length === 0) {
      return [];
    }

    return Object.entries(editedFields)
      .map(([key, field]) => {
        // 2. CORREÇÃO: Remove o "nome_da_tabela." do início da key para sobrar apenas a coluna
        // Ex: "dbo.t_aluno.nome" -> tira "dbo.t_aluno." -> sobra "nome"
        const colName = key.replace(`${field.tableName}.`, "");

        // 3. Procura a tabela
        const table = selectedTables.find(
          (t) => t.table_name === field.tableName
        );

        if (!table) {
          console.warn(`❌ Tabela '${field.tableName}' não encontrada.`);
          return null;
        }

        // 4. Procura a coluna
        const coluna = table.colunas?.find(
          (c: any) => c.nome === colName
        );

        if (!coluna) {
          console.warn(`❌ Coluna '${colName}' não encontrada na tabela '${table.table_name}'`);
          return null;
        }

        // Encontrou tudo com sucesso!
        return {
          nome: key, // Tem de ser a key original (ex: "dbo.t_aluno.nome") para o Modal atualizar o campo certo
          tipo: coluna?.tipo || field.type_column || "text",
          is_nullable: coluna?.is_nullable,
          enum_valores_encontrados: coluna?.enum_valores_encontrados,
          tableName: field.tableName,
        } as CampoDetalhado;
      })
      .filter(Boolean) as CampoDetalhado[]; // Remove os nulls
  }, [editedFields, selectedTables]);

  // Salvar novo registro
  const handleSave = useCallback(async () => {
    if (!onSave || !hasChanges) return;

    if (Object.values(errors).some((e) => e)) {
      console.warn("Não é possível salvar: existem erros de validação");
      return;
    }

    if (!window.confirm(t("actions.confirmCreate") || "Tem certeza que deseja criar este registro?")) return;

    setIsLoading(true);
    try {
      const createdRow = Object.entries(editedFields).reduce<EditedFieldForQuery>(
        (acc, [key, field]) => {
          if (!field.hasChanged) return acc;
          const [tableName, column] = key.split(".");
          if (!acc[tableName]) acc[tableName] = {};
          acc[tableName][column] = {
            value: String(field.value),
            type_column: field.type_column,
          };
          return acc;
        },
        {}
      );

      console.log("Novo registro a ser salvo:", createdRow);
      await api.post("/exe/insert_row", { createdRow }, { withCredentials: true });

      if (onSave) onSave(createdRow);

      onClose?.(); // Fecha modal após salvar
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onSave, hasChanges, errors, editedFields, onClose, t]);

  // Fechar modal
  const handleClose = useCallback(() => {
    if (
      hasChanges &&
      !window.confirm(t("actions.confirmDiscard") || "Você tem alterações não salvas. Deseja realmente fechar?")
    ) {
      return;
    }
    onClose();
  }, [hasChanges, onClose, t]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  if (!isOpen || selectedTables.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header - Padrão Cinza Claro */}
        <header className="flex justify-between items-center border-b border-gray-200 p-6 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                {t("forms.createRecordTitle") || "Criar Novo Registro"}
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                {t("forms.createRecordDesc") || "Preencha os campos abaixo para inserir no banco de dados."}
              </p>
            </div>
            {hasChanges && (
              <span className="hidden sm:flex ml-4 items-center gap-1.5 text-amber-700 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <AlertCircle className="w-4 h-4" />
                {t("forms.pendingChanges") || "Alterações pendentes"}
              </span>
            )}
          </div>
          {ocrFields.length > 0 && (
            <div className="mb-6 flex justify-end">
              <OCRButton formFields={ocrFields} valuesDefault={editedFields} onResult={handleOcrResult} />
            </div>
          )}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label={t("actions.close") || "Fechar modal"}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="space-y-8">
            {selectedTables.map((metadata, tableIndex) => (
              <div
                key={`${metadata.table_name}_${tableIndex}`}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                {/* Cabeçalho da Tabela */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-gray-600 text-sm font-bold">T</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {metadata.table_name}
                  </h3>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md ml-auto">
                    {metadata.colunas.length} {t("common.fields") || "campos"}
                  </span>
                </div>

                {/* Grid de Campos */}
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
                        className={`bg-gray-50 rounded-xl p-5 border transition-all duration-200 ${hasChanged
                          ? "border-blue-300 bg-blue-50/30 ring-2 ring-blue-50"
                          : hasError
                            ? "border-red-300 bg-red-50/30 ring-2 ring-red-50"
                            : "border-gray-200"
                          }`}
                      >
                        <label
                          htmlFor={qualifiedName}
                          className="block text-sm font-medium text-gray-700 mb-3"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={`text-sm ${hasChanged ? "text-blue-700 font-bold" : "text-gray-900 font-semibold"
                                }`}
                            >
                              {col.nome}
                              {!col.is_nullable && <span className="text-red-500 ml-0.5">*</span>}
                            </span>

                            {col.is_primary_key && (
                              <Badge color="yellow" icon={<Key className="w-3 h-3" />} text="PK" />
                            )}

                            {col.is_auto_increment && (
                              <Badge color="blue" text="AUTO" />
                            )}

                            <Badge color="gray" text={col.tipo} />

                            {hasChanged && <Badge color="blue" text={t("common.changed") || "Alterado"} />}
                          </div>
                        </label>

                        <div className="text-gray-900">
                          <DynamicInputByTypeWithNullable
                            is_nullable={col.is_nullable}
                            enum_values={col.enum_valores_encontrados}
                            type={col.tipo}
                            value={fieldState.value}
                            onChange={(val) =>
                              handleFieldChange(
                                qualifiedName,
                                val,
                                metadata.table_name,
                                col.tipo,
                                col.is_nullable
                              )
                            }
                            disabled={col.is_auto_increment}
                            aria-invalid={!!hasError}
                          />
                          {col.is_foreign_key && (
                            <div className="mt-2">
                              <ForeignKeySelect
                                referencedTable={col.referenced_table!}
                                referencedField={col.field_references!}
                                value={fieldState.value}
                                onChange={(valor, option) =>
                                  handleFkSelect(qualifiedName, option, metadata.table_name, col.tipo)
                                }
                              />
                            </div>
                          )}
                        </div>

                        {hasError && (
                          <div className="mt-2 flex items-center gap-1.5 text-red-600 text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
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
        <footer className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={isLoading}
          >
            {t("actions.cancel") || "Cancelar"}
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading || Object.values(errors).some((e) => e)}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("actions.saving") || "Salvando..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("actions.createRecord") || "Criar novo registro"}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CriarRegistroNovo;