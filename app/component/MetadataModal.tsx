"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  EditedField,
  EditedFieldForQuery,
  MetadataTableResponse,
  Tables_primary_keys_values,
} from "@/types";
import { X, AlertCircle } from "lucide-react";
import { validateField } from "@/util";
import { usePopupReference } from "../services/popups";
import { findIdentifierField } from "@/util/func";
import { useRowDelete } from "@/hook/useRowDelete";
import { createLogger } from "@/util/logger";
import ConfirmDeleteModal from "./ConfirmDeleteModal"; // 🔹 Importado o modal padronizado
import { useI18n } from "@/context/I18nContext"; // 🔹 Importado
import { FieldEditor } from "./ResultadosQueryComponent/FieldEditor";
import ModalFooter from "./ResultadosQueryComponent/ModalFooter";
import { RowDetailsModalProps } from "./ResultadosQueryComponent/types";

const logger = createLogger({ component: "RowDetailsModal" });

const RowDetailsModal: React.FC<RowDetailsModalProps> = ({
  isOpen,
  setModalFetchOpen,
  responseModal, setResponseModal,
  modalFetchOpen, setOptionModalTable,
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
      .filter(([keyName]) => {
        return row?.tableName?.some((tName) => {
          if (!tName) return false;

          // 1. Possibilidade: Match exato ("public.users" === "public.users")
          if (tName === keyName) return true;

          // 2. Possibilidade: tName tem uma coluna pendurada ("public.users.id" vs "public.users")
          if (tName.startsWith(`${keyName}.`)) return true;

          // Desmontamos as strings para analisar a fundo
          const tParts = tName.split(".");
          const kParts = keyName.split(".");

          // Extraímos a base da tabela (sempre o último elemento do array)
          // Ex: "public.db_fields" vira "db_fields"
          const tBase = tParts[tParts.length - 1];
          const kBase = kParts[kParts.length - 1];

          // Se as tabelas base NÃO são iguais, verificamos um último fallback
          if (tBase !== kBase) {
            // Fallback: e se tName for "tabela.coluna" (ex: "users.id") e keyName for "users"?
            if (tParts.length >= 2 && tParts[tParts.length - 2] === kBase) {
              return true;
            }
            return false;
          }

          // 3. Possibilidade: As tabelas base são IGUAIS (ex: "db_fields" e "db_fields").
          // Agora verificamos a segurança: há conflito de schema?
          const tSchema = tParts.length > 1 ? tParts[tParts.length - 2] : null;
          const kSchema = kParts.length > 1 ? kParts[kParts.length - 2] : null;

          // Se AMBOS forneceram um schema, eles DEVEM ser iguais. 
          // (Isso impede que "audit.users" dê match com "public.users")
          if (tSchema && kSchema && tSchema !== kSchema) {
            return false;
          }

          // 4. Possibilidade: Base igual, e apenas um (ou nenhum) tem schema (ex: "db_fields" === "public.db_fields")
          return true;
        });
      })
      .map(([keyName, colunas]) => ({
        message: "",
        executado_em: "",
        connection_id: 0,
        schema_name: keyName.includes(".") ? keyName.split(".")[0] : "",
        table_name: keyName,
        total_colunas: colunas?.length || 0,
        colunas: colunas || [],
      }));
  }, [row, informacaosOftables]);

  // Usa o hook de delete
  const { handleDelete, showDeleteConfirm, setShowDeleteConfirm, isDeleting } = useRowDelete({
    row,
    selectedTables,
    responseModal,
    setResponseModal,

    onDelete,
    onClose,
  });

  // Verificação de mudanças
  const hasChanges = useMemo(() => {
    return Object.values(editedFields).some((field) => field.hasChanged);
  }, [editedFields]);

  const handleViewReference = useCallback((refTable: string, refField: string, refValue: string, name: string) => {
    viewReferenceTable({ table: refTable, field: refField, value: refValue }, { name });
  }, [viewReferenceTable]);

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
      let fullColumnName: string;
      let tableName: string;
      let pureColumnName: string = key; // <-- Nova variável para guardar o nome limpo

      if (index < nameColumns.length && nameColumns[index]) {
        fullColumnName = nameColumns[index];
        // console.log("fullColumnName:", fullColumnName);

        if (typeof fullColumnName === "string" && fullColumnName.includes(".")) {
          const parts = fullColumnName.split(".");

          // O último elemento é SEMPRE a coluna, não importa quantos schemas tenha
          pureColumnName = parts[parts.length - 1];

          // Se tiver 3 ou mais partes (ex: schema.tabela.coluna)
          if (parts.length >= 3) {
            tableName = parts.slice(0, -1).join("."); // Junta tudo exceto a coluna
          } else {
            // Se tiver 2 partes (ex: tabela.coluna)
            tableName = parts[0];
          }
        } else {
          tableName = mainTableName;
          pureColumnName = fullColumnName; // Se for só "name", ele mesmo é o puro
        }
      } else {
        fullColumnName = key;
        tableName = mainTableName;
      }

      const safeColumnName = typeof fullColumnName === "string" ? fullColumnName : key;
      // console.log("safeColumnName:", safeColumnName);

      initialEditedFields[safeColumnName] = {
        value: value !== null && value !== undefined ? String(value) : "",
        tableName,
        // columnName: pureColumnName, // <-- Agora o nome limpo da coluna vai junto no state!
        hasChanged: false,
        type_column: typeof value,
      };
      initialEnabledFields[safeColumnName] = false;
    });
    // console.log(initialEditedFields)
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

          // 1. Usa o tableName seguro que já garantimos no useEffect
          const tableName = field.tableName;

          // 2. Extrai a coluna pegando SEMPRE o último elemento da chave
          const keyParts = key.split(".");
          const column = keyParts[keyParts.length - 1];

          if (!acc[tableName]) acc[tableName] = {};

          acc[tableName][column] = {
            value: String(field.value),
            type_column: field.type_column
          };

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

  const [openModalConfirmeDelete, setOpenModalConfirmeDele] = useState(false)
  useEffect(() => {
    if (openModalConfirmeDelete)
      if (!modalFetchOpen)
        setShowDeleteConfirm(true)

  }, [openModalConfirmeDelete, modalFetchOpen])


  const confirmeDelet_open_modal_for_selection_table = useCallback(() => {

    setOptionModalTable("oneDelet")

    setModalFetchOpen(true)

    setOpenModalConfirmeDele(true)

  }, [])

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
  // console.log(selectedTables)
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
                  {t("common.table") || "Tabela"}: {metadata.table_name.substring(metadata.table_name.indexOf(".",) + 1)}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {metadata.colunas.map((col, index) => {
                    // 1. Extrai apenas o nome da tabela (remove o schema, se houver)
                    const justTable = metadata.table_name.includes(".")
                      ? metadata.table_name.split(".").pop()
                      : metadata.table_name;

                    // 2. Monta as 3 possíveis chaves que podem estar no nosso State
                    const keyWithSchema = `${metadata.table_name}.${col.nome}`; // Ex: public.users.name
                    const keyWithTable = `${justTable}.${col.nome}`;            // Ex: users.name
                    const keyJustColumn = col.nome;                             // Ex: name

                    // 3. Descobre qual é a chave correta procurando no objeto (do mais específico pro mais genérico)
                    const correctKey = editedFields[keyWithSchema] ? keyWithSchema :
                      editedFields[keyWithTable] ? keyWithTable :
                        editedFields[keyJustColumn] ? keyJustColumn :
                          null;

                    // 4. Agora sim, pegamos os valores corretamente e separados!
                    const editedField = correctKey ? editedFields[correctKey] : null;

                    // console.log("Chave encontrada:", correctKey);
                    // console.log("Estado do campo:", editedField);
                    if (!editedField) return null;

                    const isEnabled = correctKey ? enabledFields[correctKey] : false;
                    const hasError = correctKey ? errors[correctKey] : "";

                    return (
                      <FieldEditor
                        key={`${correctKey}_${index}`}
                        col={col}
                        qualifiedName={correctKey as string}
                        metadata={metadata}
                        editedField={editedField}
                        isEnabled={isEnabled}
                        hasError={hasError}
                        onFieldChange={handleFieldChange}
                        onToggleEdit={toggleEdit}
                        onViewReference={handleViewReference}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <ModalFooter
          onDelete={confirmeDelet_open_modal_for_selection_table} // Tira essa linha se for um modal de "Criar Novo"
          onCancel={handleClose}
          onSave={handleSave}
          isLoading={isLoading}
          isDeleting={isDeleting}
          isSaving={isLoading}
          disableSave={!hasChanges || isLoading || isDeleting || Object.values(errors).some(error => error)}
        />

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