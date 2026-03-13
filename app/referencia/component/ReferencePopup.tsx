import { AlertCircle, Database, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FieldEditor } from "../../component/ResultadosQueryComponent/FieldEditor";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EditedField, EditedFieldForQuery, MetadataTableResponse,
  QueryPayload, QueryResultType,
  SelectedRow, Tables_primary_keys_values
} from "@/types";
import { usePopupReference } from "@/app/services/popups";
import api from "@/context/axioCuston";
import { validateField } from "@/util";
import { findIdentifierField } from "@/util/func";
import { useRowDelete } from "@/hook/useRowDelete";
import { useI18n } from "@/context/I18nContext";
import ConfirmDeleteModal from "@/app/component/ConfirmDeleteModal";
import ModalFooter from "@/app/component/ResultadosQueryComponent/ModalFooter";
import { PayloadDeleteRow } from "@/app/component/ResultadosQueryComponent/types";

const FieldSkeleton = () => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-10 bg-gray-200 rounded"></div>
  </div>
);

// Componente principal do popup
export const ReferencePopup = () => {
  const searchParams = useSearchParams();
  const table = useMemo(() => searchParams.get("table"), [searchParams]);
  const field = useMemo(() => searchParams.get("field"), [searchParams]);
  const value = useMemo(() => searchParams.get("value"), [searchParams]);

  const { t } = useI18n();

  // Estados principais
  const [informacaosOftables, setInformacaosOftables] = useState<MetadataTableResponse[]>([]);
  const [row, setRow] = useState<SelectedRow>({ row: {}, nameColumns: [] });
  const [selectColumns, setSelectColumns] = useState<string[]>([]);

  // Estados de edição
  const [editedFields, setEditedFields] = useState<Record<string, EditedField>>({});
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  const { openReferencePopup: viewReferenceTable } = usePopupReference();

  // Dados computados
  const selectedTables = useMemo(() => {
    return informacaosOftables.filter((t_meta) =>
      selectColumns.some((col) => col.startsWith(`${t_meta.table_name}.`))
    );
  }, [selectColumns, informacaosOftables]);

  const hasChanges = useMemo(() => {
    return Object.values(editedFields).some(f => f.hasChanged);
  }, [editedFields]);

  const hasValidationErrors = useMemo(() => {
    return Object.values(errors).some(error => error);
  }, [errors]);

  const changedFieldsCount = useMemo(() => {
    return Object.values(editedFields).filter(f => f.hasChanged).length;
  }, [editedFields]);

  // Carregamento inicial dos dados
  useEffect(() => {
    if (!table || !field || !value) {
      setLoadError(t("referencePopup.invalidParams") || 'Parâmetros inválidos: table, field e value são obrigatórios');
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        // Buscar metadados da tabela
        const metadataResponse = await api.get<MetadataTableResponse>(
          `/consu/metadata_fieds/${encodeURIComponent(table)}`,
          { withCredentials: true, signal: controller.signal }
        );

        const metadata = metadataResponse.data;
        const selectCols: Record<string, string> = metadata.colunas.reduce((acc, col) => {
          acc[`${table}.${col.nome}`] = `${table}.${col.nome}`;
          return acc;
        }, {} as Record<string, string>);

        // Construir query para buscar o registro
        const query: QueryPayload = {
          baseTable: table,
          aliaisTables: selectCols,
          table_list: [table],
          joins: {},
          where: [{
            table_name_fil: table,
            column: field,
            operator: "=",
            value,
            logicalOperator: "AND",
            column_type: metadata.colunas.find((c) => c.nome === field)?.tipo || "string",
            value_type: "string",
          }],
          limit: 1,
        };

        // Executar query
        const queryResponse = await api.post<QueryResultType>(
          "/exe/execute_query/",
          query,
          { withCredentials: true, signal: controller.signal }
        );

        if (!queryResponse.data.preview[0]) {
          setLoadError(t("referencePopup.notFound") || 'Registro não encontrado');
          return;
        }

        const selectedRow: SelectedRow = {
          row: queryResponse.data.preview[0],
          nameColumns: Object.keys(selectCols),
          tableName: [table],
        };

        setRow(selectedRow);
        setInformacaosOftables([metadata]);
        setSelectColumns(Object.keys(selectCols));
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          console.error("Erro ao carregar dados:", error);
          setLoadError(error.response?.data?.message || t("referencePopup.loadError") || 'Erro ao carregar dados');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [table, field, value, t]);

  // Hook customizado para deletar registro
  const onDelete = useCallback(async (payload: PayloadDeleteRow, index: number) => {
    try {
      const firstTable = payload.tableForDelete?.[0];

      if (!firstTable) {
        throw new Error("Nenhuma tabela foi informada para exclusão.");
      }

      const rowDelete = payload.rowDeletes[firstTable];

      if (!rowDelete) {
        throw new Error(`Nenhuma configuração de exclusão encontrada para a tabela '${firstTable}'.`);
      }

      const normalizedPayload: PayloadDeleteRow = {
        ...payload,
        rowDeletes: {
          ...payload.rowDeletes,
          [firstTable]: {
            ...rowDelete,
            index: rowDelete.index ?? index,
          },
        },
      };

      await api.delete("/delete/records", {
        data: { registros: [normalizedPayload] },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao eliminar registro:", error);
      throw error;
    }
  }, []);

  const {
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting
  } = useRowDelete({
    row,
    selectedTables,

    onDelete,
    onClose: typeof window !== "undefined" ? () => window.close() : () => { }
  });

  // Inicializar campos editáveis
  useEffect(() => {
    if (!row?.row || Object.keys(row.row).length === 0) return;

    const initialEditedFields: Record<string, EditedField> = {};
    const initialEnabledFields: Record<string, boolean> = {};

    Object.entries(row.row).forEach(([key, val]) => {
      initialEditedFields[key] = {
        value: String(val ?? ''),
        tableName: table || row.tableName?.[0] || "",
        hasChanged: false,
        type_column: "text"
      };
      initialEnabledFields[table + key] = false;
    });

    setEditedFields(initialEditedFields);
    setEnabledFields(initialEnabledFields);
    setErrors({});
  }, [row, informacaosOftables, table]);

  // Handlers
  const handleFieldChange = useCallback((key: string, val: string, tableName: string, columnType: string, isNullable?: boolean) => {
    let error = validateField(columnType, String(val));
    if (!isNullable && (val === "" || val === null || val === undefined)) {
      error = t("validation.required") || "Este campo é obrigatório.";
    }
    setErrors(prev => ({ ...prev, [key]: error || '' }));

    setEditedFields(prev => {
      const originalValue = row?.row?.[key] ?? '';
      const hasChanged = String(originalValue) !== val;

      return {
        ...prev,
        [key]: { value: val, tableName, hasChanged, type_column: columnType }
      };
    });
  }, [row?.row, t]);

  const handleToggleEdit = useCallback((fieldName: string) => {
    setEnabledFields(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  const handleViewReference = useCallback((refTable: string, refField: string, refValue: string, name: string) => {
    viewReferenceTable({ table: refTable, field: refField, value: refValue }, { name });
  }, [viewReferenceTable]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || hasValidationErrors) return;
    if (!window.confirm(t("modals.confirmEdit") || "Tens a certeza que queres editar?")) return;

    setIsSaving(true);
    try {
      const tables_primary_keys_values = Object.entries(editedFields)
        .filter(([, f]) => f.hasChanged)
        .reduce((acc, [key, f]) => {
          const t_meta = informacaosOftables.find(t => t.table_name === f.tableName);
          if (!t_meta) return acc;

          if (!acc[t_meta.table_name]) {
            const primaryKeyField = findIdentifierField(t_meta.table_name, informacaosOftables)?.nome;
            const primary_key_name = `${t_meta.table_name}.${primaryKeyField}`;
            acc[t_meta.table_name] = {
              primaryKey: primary_key_name,
              valor: String(row?.row?.[primary_key_name]) ?? "null",
            };
          }

          acc[t_meta.table_name][key] = f.value;
          return acc;
        }, {} as Tables_primary_keys_values);

      const updatedRow = Object.entries(editedFields)
        .filter(([, f]) => f.hasChanged)
        .reduce<EditedFieldForQuery>((acc, [key, f]) => {
          const [tableName, column] = key.split(".");
          if (!acc[tableName]) acc[tableName] = {};
          acc[tableName][column] = {
            value: String(f.value),
            type_column: f.type_column
          };
          return acc;
        }, {});

      await api.post("/exe/update_row", {
        updatedRow,
        tables_primary_keys_values
      }, { withCredentials: true });

      setTimeout(() => window.close(), 500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(t("modals.saveError") || "Erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, hasValidationErrors, editedFields, informacaosOftables, row?.row, t]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirm = window.confirm(t("modals.unsavedWarning") || "Você tem alterações não salvas. Deseja realmente sair?");
      if (!confirm) return;
    }
    if (typeof window !== "undefined") {
      window.close();
    }
  }, [hasChanges, t]);

  // Render: Loading
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <header className="flex justify-between items-center border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold text-gray-800">{t("referencePopup.loading") || "Carregando..."}</h2>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <FieldSkeleton key={i} />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render: Error
  if (loadError) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t("referencePopup.errorTitle") || "Erro ao Carregar"}</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {t("actions.tryAgain") || "Tentar Novamente"}
          </button>
        </div>
      </div>
    );
  }

  // Render: No Data
  if (!row || selectedTables.length === 0) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t("referencePopup.noDataTitle") || "Nenhum Dado Encontrado"}</h2>
          <p className="text-gray-600">{t("referencePopup.noDataDesc") || "Não foi possível carregar os dados solicitados."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-gray-200 p-4 shadow-sm bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">{t("referencePopup.headerTitle") || "Detalhes da Linha"}</h2>
          {hasChanges && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {changedFieldsCount} {t("common.field") || "campo"}{changedFieldsCount !== 1 ? 's' : ''} {t("common.changed") || "alterado"}{changedFieldsCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          title={t("actions.close") || "Fechar"}
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {selectedTables.map((metadata, tableIndex) => (
          <div key={`${metadata.table_name}_${tableIndex}`} className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
              <span>{t("common.table") || "Tabela"}: {metadata.table_name}</span>
              <span className="text-sm text-gray-500 font-normal">
                ({metadata.colunas.length} {t("common.fields") || "campos"})
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metadata.colunas.map((col, index) => {
                // 1. Extrai apenas o nome da tabela (remove o schema, se houver)
                const justTable = metadata.table_name.includes(".")
                  ? metadata.table_name.split(".").pop()
                  : metadata.table_name;

                // 2. Monta as 3 possíveis chaves que podem estar no nosso State
                const keyWithSchema = `${metadata.table_name}.${col.nome}`; // Ex: public.users.name
                const keyWithTable = `${justTable}.${col.nome}`;            // Ex: users.name
                const keyJustColumn = col.nome;                             // Ex: name

                // 3. Descobre qual é a chave correta procurando no objeto
                const correctKey = editedFields[keyWithSchema] ? keyWithSchema :
                  editedFields[keyWithTable] ? keyWithTable :
                    editedFields[keyJustColumn] ? keyJustColumn :
                      null;

                // 4. Pega os valores
                const editedField = correctKey ? editedFields[correctKey] : null;

                if (!editedField) return null;

                // Como editField existe, sabemos que correctKey é uma string!
                const isEnabled = enabledFields[correctKey as string] ?? false;
                const hasError = errors[correctKey as string] ?? "";

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
                    onToggleEdit={handleToggleEdit}
                    onViewReference={handleViewReference}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <ModalFooter
        onDelete={() => setShowDeleteConfirm(true)} // Tira essa linha se for um modal de "Criar Novo"
        onCancel={handleClose}
        onSave={handleSave}
        isLoading={isLoading}
        isDeleting={isDeleting}
        isSaving={isSaving}
        disableSave={!hasChanges || isLoading || isDeleting || Object.values(errors).some(error => error)}
      />

      {/* Modal de Confirmação de Delete */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        type="single"
        isDeleting={isDeleting}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => handleDelete()}
      />

    </div>
  );
};