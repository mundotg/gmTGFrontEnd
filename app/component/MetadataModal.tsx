"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  CampoDetalhado,
  EditedField,
  EditedFieldForQuery,
  MetadataTableResponse,
  Tables_primary_keys_values,
} from "@/types";
import { X, AlertCircle, Pencil, FlaskConical, CheckCircle2, AlertTriangle } from "lucide-react";
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
import OCRButton from "./ocrComponent";
import api from "@/context/axioCuston";

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
  isBulkEdit = false,
  isSelectionBulk = false,
  totalRows,
  onSaveBulk,
  onDryRun,
  onDryRunBulk,
}) => {
  const { t } = useI18n();
  const [editedFields, setEditedFields] = useState<Record<string, EditedField>>({});
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{
    success: boolean;
    message: string;
    query?: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { openReferencePopup: viewReferenceTable } = usePopupReference();
  // Memoização das tabelas selecionadas
  // Memoização das tabelas selecionadas
  const selectedTables = useMemo<MetadataTableResponse[]>(() => {
    if (!row?.row) return [];

    let matched: MetadataTableResponse[] = [];

    if (informacaosOftables && Object.keys(informacaosOftables).length > 0) {
      matched = Object.entries(informacaosOftables)
        .filter(([keyName]) => {
          if (!row.tableName || row.tableName.length === 0) return true;
          return row.tableName.some((tName) => {
            if (!tName) return false;
            if (tName === keyName) return true;
            if (tName.startsWith(`${keyName}.`)) return true;
            const tBase = tName.split(".").pop();
            const kBase = keyName.split(".").pop();
            return tBase === kBase;
          });
        })
        .map(([keyName, colunas]) => {
          // Se as colunas vierem vazias, extrai as colunas da própria linha
          const safeColunas: CampoDetalhado[] =
            colunas && colunas.length > 0
              ? colunas
              : Object.keys(row.row || {}).map((colKey) => {
                  const colName = colKey.includes(".") ? colKey.split(".").pop()! : colKey;
                  const val = row.row?.[colKey];
                  return {
                    nome: colName,
                    tipo: typeof val === "number" ? "integer" : "text",
                    is_nullable: true,
                    is_primary_key: colName.toLowerCase() === "pk" || colName.toLowerCase() === "id",
                  } as CampoDetalhado;
                });

          return {
            message: "",
            executado_em: "",
            connection_id: 0,
            schema_name: keyName.includes(".") ? keyName.split(".")[0] : "",
            table_name: keyName,
            total_colunas: safeColunas.length,
            colunas: safeColunas,
          };
        });
    }

    // Fallback: se não encontrou nenhuma tabela correspondente nos metadados, constrói a partir da linha
    if (matched.length === 0) {
      const primaryTable = row.tableName?.[0] || "tabela";
      const fallbackColunas: CampoDetalhado[] = Object.keys(row.row || {}).map((colKey) => {
        const colName = colKey.includes(".") ? colKey.split(".").pop()! : colKey;
        const val = row.row?.[colKey];
        return {
          nome: colName,
          tipo: typeof val === "number" ? "integer" : "text",
          is_nullable: true,
          is_primary_key: colName.toLowerCase() === "pk" || colName.toLowerCase() === "id",
        } as CampoDetalhado;
      });

      matched = [
        {
          message: "",
          executado_em: "",
          connection_id: 0,
          schema_name: primaryTable.includes(".") ? primaryTable.split(".")[0] : "",
          table_name: primaryTable,
          total_colunas: fallbackColunas.length,
          colunas: fallbackColunas,
        },
      ];
    }

    return matched;
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

  const setShowDeleteConfirmRef = useRef(setShowDeleteConfirm);
  setShowDeleteConfirmRef.current = setShowDeleteConfirm;

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
      setShowDeleteConfirmRef.current?.(false);
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
        value: isBulkEdit ? "" : (value !== null && value !== undefined ? String(value) : ""),
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
  }, [row, isOpen, isBulkEdit]);

  // Handler para mudanças nos campos
  const handleFieldChange = useCallback(
    (key: string, value: string, tableName: string, columnType: string, isNullable?: boolean) => {
      let error = validateField(columnType, String(value));
      if (!isBulkEdit && !isNullable && (value === "" || value === null || value === undefined)) {
        error = t("common.requiredField") || "Este campo é obrigatório.";
      }
      setErrors((prev) => ({
        ...prev,
        [key]: error || "",
      }));

      setEditedFields((prev) => {
        const originalValue = isBulkEdit ? "" : (row?.row?.[key] ?? "");
        const hasChanged = isBulkEdit
          ? (value !== null && value !== undefined && String(value).trim() !== "")
          : (String(originalValue) !== value);

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
    [row?.row, t, isBulkEdit]
  );

  // Handler para salvar
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      logger.warn("Não é possível salvar: existem erros de validação");
      return;
    }

    // Fluxo especial: Edição em massa de todos os registros da consulta ou selecionados
    if (isBulkEdit) {
      const rowCountText = totalRows
        ? (isSelectionBulk ? `os ${totalRows} selecionados` : `todos os ${totalRows}`)
        : (isSelectionBulk ? "os selecionados" : "todos os");
      const confirmMsg = isSelectionBulk
        ? (t("actions.confirmSelectedEdit") ||
           `Tem certeza que deseja atualizar ${rowCountText} registros com os novos valores?`)
        : (t("actions.confirmBulkEdit") ||
           `Tem certeza que deseja atualizar ${rowCountText} registros desta consulta com os novos valores?`);
      if (!window.confirm(confirmMsg)) return;

      setIsLoading(true);
      try {
        const updatedRow = Object.entries(editedFields)
          .filter(([, field]) => field.hasChanged)
          .reduce<EditedFieldForQuery>((acc, [key, field]) => {
            const tableName = field.tableName;
            const keyParts = key.split(".");
            const column = keyParts[keyParts.length - 1];

            if (!acc[tableName]) acc[tableName] = {};
            acc[tableName][column] = {
              value: String(field.value),
              type_column: field.type_column,
            };
            return acc;
          }, {});

        logger.success("Campos alterados em massa:", updatedRow);
        if (onSaveBulk) {
          await onSaveBulk(updatedRow);
        }
        onClose();
      } catch (error) {
        logger.error("Erro ao salvar em massa:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Fluxo padrão: Edição de uma única linha
    if (!onSave) return;
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
  }, [onSave, hasChanges, errors, editedFields, onClose, row, selectedTables, t, isBulkEdit, totalRows, onSaveBulk]);

  // Handler para testar/simular alterações sem persistir (Dry Run)
  const handleDryRun = useCallback(async () => {
    if (!hasChanges) {
      setDryRunResult({
        success: false,
        message: t("errors.noChangesToSimulate") || "Nenhum campo foi alterado para simular.",
      });
      return;
    }

    const hasErrors = Object.entries(errors).some(
      ([k, error]) => error && (!isBulkEdit || editedFields[k]?.hasChanged)
    );
    if (hasErrors) {
      setDryRunResult({
        success: false,
        message: t("errors.validationErrorsPresent") || "Existem erros de validação nos campos. Corrija-os antes de simular.",
      });
      return;
    }

    setIsDryRunning(true);
    setDryRunResult(null);

    try {
      if (isBulkEdit) {
        const updatedRow = Object.entries(editedFields)
          .filter(([, field]) => field.hasChanged)
          .reduce<EditedFieldForQuery>((acc, [key, field]) => {
            const tableName = field.tableName;
            const keyParts = key.split(".");
            const column = keyParts[keyParts.length - 1];

            if (!acc[tableName]) acc[tableName] = {};
            acc[tableName][column] = {
              value: String(field.value),
              type_column: field.type_column,
            };
            return acc;
          }, {});

        let resData;
        if (onDryRunBulk) {
          resData = await onDryRunBulk(updatedRow);
        } else {
          const endpoint = isSelectionBulk ? "/exe/update_selected" : "/exe/update_all";
          const payload = isSelectionBulk
            ? { updatedRow, rows_primary_keys: [], dry_run: true }
            : { updatedRow, query: (row as any)?.QueryPayload || {}, dry_run: true };
          const response = await api.post(endpoint, payload, { withCredentials: true });
          resData = response.data;
        }

        const isValid = resData?.valid ?? resData?.success ?? true;
        const msg = resData?.error || resData?.response || (
          isValid
            ? (t("modals.simulationSuccess") || "Simulação concluída com sucesso! Nenhuma restrição violada.")
            : (t("modals.simulationFailed") || "Falha na simulação.")
        );

        setDryRunResult({
          success: isValid,
          message: msg,
          query: resData?.query,
        });
        return;
      }

      // Edição de uma única linha
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
          const tableName = field.tableName;
          const keyParts = key.split(".");
          const column = keyParts[keyParts.length - 1];

          if (!acc[tableName]) acc[tableName] = {};

          acc[tableName][column] = {
            value: String(field.value),
            type_column: field.type_column,
          };

          return acc;
        }, {});

      let resData;
      if (onDryRun) {
        resData = await onDryRun(updatedRow, tables_primary_keys_values, row?.index ?? -1);
      } else {
        const response = await api.post(
          "/exe/update_row",
          { updatedRow, tables_primary_keys_values, dry_run: true },
          { withCredentials: true }
        );
        resData = response.data;
      }

      const isValid = resData?.valid ?? resData?.success ?? true;
      const msg = resData?.error || resData?.response || (
        isValid
          ? (t("modals.simulationSuccess") || "Simulação concluída com sucesso! Nenhuma restrição violada.")
          : (t("modals.simulationFailed") || "Falha na simulação.")
      );

      setDryRunResult({
        success: isValid,
        message: msg,
        query: resData?.query,
      });

    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || "Erro durante simulação.";
      setDryRunResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setIsDryRunning(false);
    }
  }, [
    hasChanges,
    errors,
    isBulkEdit,
    isSelectionBulk,
    editedFields,
    t,
    onDryRunBulk,
    row,
    selectedTables,
    onDryRun,
  ]);

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


  const ocrFields = useMemo<CampoDetalhado[]>(() => {
    // 1. Prevenção: Se os estados ainda não carregaram
    if (Object.keys(editedFields).length === 0 || selectedTables.length === 0) {
      return [];
    }

    return Object.entries(editedFields)
      .map(([key, field]) => {
        // 2. Extrai o nome da coluna pegando o último segmento
        const colName = key.includes(".") ? key.split(".").pop()! : key;

        // 3. Procura a tabela
        const table =
          selectedTables.find(
            (t) =>
              t.table_name === field.tableName ||
              t.table_name.split(".").pop() === field.tableName?.split(".").pop()
          ) || selectedTables[0];

        if (!table) {
          return null;
        }

        // 4. Procura a coluna (case-insensitive para compatibilidade com SQLite/Postgres)
        const coluna = table.colunas?.find(
          (c: any) => c.nome?.toLowerCase() === colName.toLowerCase()
        );

        // Retorna a coluna encontrada ou fallback limpo
        return {
          nome: key, // Mantém a chave original
          tipo: coluna?.tipo || field.type_column || "text",
          is_nullable: coluna?.is_nullable,
          enum_valores_encontrados: coluna?.enum_valores_encontrados,
          tableName: field.tableName,
        } as CampoDetalhado;
      })
      .filter(Boolean) as CampoDetalhado[]; // Remove os nulls
  }, [editedFields, selectedTables]);


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
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {isBulkEdit ? (
                <>
                  <Pencil className="w-5 h-5 text-blue-600" />
                  {isSelectionBulk
                    ? (t("modals.editSelectedTitle") || "Editar Registros Selecionados")
                    : (t("modals.bulkEditTitle") || "Editar Todos os Registros da Consulta")}
                </>
              ) : (
                t("modals.rowDetails") || "Detalhes da Linha"
              )}
            </h2>
            {isBulkEdit && totalRows !== undefined && totalRows > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {totalRows} {isSelectionBulk ? (t("common.selectedPlural") || "selecionados") : (t("common.records") || "registros")}
              </span>
            )}
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 text-xs font-bold px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                {t("forms.pendingChanges") || "Alterações pendentes"}
              </span>
            )}
          </div>

          {!isBulkEdit && ocrFields.length > 0 && (
            <div className="mb-6 flex justify-end">
              <OCRButton formFields={ocrFields} valuesDefault={editedFields} onResult={handleOcrResult} />
            </div>
          )}
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
          {isBulkEdit && (
            <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 mb-6 shadow-sm">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950 mb-0.5">
                  {isSelectionBulk
                    ? (t("actions.editSelectedTitle") || "Edição dos Registros Selecionados")
                    : (t("actions.editAllDescription") || "Modo de Edição em Massa")}
                </p>
                <p>
                  Clique no ícone de lápis da coluna que deseja alterar e digite o novo valor.{" "}
                  O valor será aplicado em{" "}
                  {isSelectionBulk ? (
                    <strong>{totalRows} registros selecionados</strong>
                  ) : (
                    <strong>todos os registros</strong>
                  )}{" "}
                  da consulta atual. Colunas que não forem alteradas permanecerão com os seus dados originais.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {selectedTables.map((metadata, tableIndex) => (
              <div key={`${metadata.table_name}_${tableIndex}`} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                  {t("common.table") || "Tabela"}: {metadata.table_name.includes(".") ? metadata.table_name.split(".").pop() : metadata.table_name}
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
                    const correctKey =
                      editedFields[keyWithSchema] ? keyWithSchema :
                      editedFields[keyWithTable] ? keyWithTable :
                      editedFields[keyJustColumn] ? keyJustColumn :
                      Object.keys(editedFields).find(
                        (k) =>
                          k.toLowerCase() === col.nome?.toLowerCase() ||
                          k.toLowerCase().endsWith(`.${col.nome?.toLowerCase()}`)
                      ) || null;

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

        {/* Banner de Feedback do Dry Run */}
        {dryRunResult && (
          <div
            className={`mx-5 my-2 p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in ${
              dryRunResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            {dryRunResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm">
                {dryRunResult.success
                  ? (t("modals.simulationSuccessTitle") || "✅ Simulação Aprovada (Dry Run)")
                  : (t("modals.simulationErrorTitle") || "❌ Falha na Simulação (Restrição Detectada)")}
              </p>
              <p className="mt-1 font-medium leading-relaxed">{dryRunResult.message}</p>
              {dryRunResult.query && (
                <details className="mt-2 text-[11px] text-gray-600 font-mono bg-white/70 p-2 rounded border border-gray-200">
                  <summary className="cursor-pointer font-sans font-semibold text-gray-700 hover:underline">
                    {t("modals.viewSimulatedQuery") || "Ver query gerada"}
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{dryRunResult.query}</pre>
                </details>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDryRunResult(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        <ModalFooter
          onDelete={isBulkEdit ? undefined : confirmeDelet_open_modal_for_selection_table}
          onCancel={handleClose}
          onSave={handleSave}
          onDryRun={handleDryRun}
          isDryRunning={isDryRunning}
          isLoading={isLoading}
          isDeleting={isDeleting}
          isSaving={isLoading}
          saveText={
            isBulkEdit
              ? (isSelectionBulk
                  ? (t("actions.updateSelectedRecords") || `Atualizar (${totalRows}) Selecionados`)
                  : (t("actions.updateAllRecords") || "Atualizar Todos os Registros"))
              : undefined
          }
          savingText={
            isBulkEdit
              ? (isSelectionBulk
                  ? (t("actions.updatingSelectedRecords") || "Atualizando Selecionados...")
                  : (t("actions.updatingAllRecords") || "Atualizando..."))
              : undefined
          }
          disableSave={
            !hasChanges ||
            isLoading ||
            isDeleting ||
            isDryRunning ||
            Object.entries(errors).some(([k, error]) => error && (!isBulkEdit || editedFields[k]?.hasChanged))
          }
          disableDryRun={
            !hasChanges ||
            isLoading ||
            isDeleting ||
            isDryRunning ||
            Object.entries(errors).some(([k, error]) => error && (!isBulkEdit || editedFields[k]?.hasChanged))
          }
        />

        {/* Modal de Confirmação de Delete (Componente Padronizado) */}
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          type="single"
          isDeleting={isDeleting}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          onDryRun={() => handleDelete(true)}
        />
      </div>
    </div>
  );
};

export default RowDetailsModal;