import { AlertCircle, Database, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FieldEditor } from "./FieldEditor";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditedField, EditedFieldForQuery, MetadataTableResponse, PayloadDeleteRow, QueryPayload, QueryResultType, SelectedRow, Tables_primary_keys_values } from "@/types";
import { usePopupReference } from "@/app/services/popups";
import api from "@/context/axioCuston";
import { validateField } from "@/util";
import { findIdentifierField } from "@/util/func";
import { useRowDelete } from "@/hook/useRowDelete";

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
    return informacaosOftables.filter((table) =>
      selectColumns.some((col) => col.startsWith(`${table.table_name}.`))
    );
  }, [selectColumns, informacaosOftables]);

  const hasChanges = useMemo(() => {
    return Object.values(editedFields).some(field => field.hasChanged);
  }, [editedFields]);

  const hasValidationErrors = useMemo(() => {
    return Object.values(errors).some(error => error);
  }, [errors]);

  const changedFieldsCount = useMemo(() => {
    return Object.values(editedFields).filter(field => field.hasChanged).length;
  }, [editedFields]);

  // Carregamento inicial dos dados
  useEffect(() => {
    if (!table || !field || !value) {
      setLoadError('Parâmetros inválidos: table, field e value são obrigatórios');
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
        const selectColumns: Record<string, string> = metadata.colunas.reduce((acc, col) => {
          acc[`${table}.${col.nome}`] = `${table}.${col.nome}`;
          return acc;
        }, {} as Record<string, string>);

        // Construir query para buscar o registro
        const query: QueryPayload = {
          baseTable: table,
          aliaisTables: selectColumns,
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
          setLoadError('Registro não encontrado');
          return;
        }
        console.log(queryResponse.data.preview[0])

        const selectedRow: SelectedRow = {
          row: queryResponse.data.preview[0],
          nameColumns: Object.keys(selectColumns),
          tableName: [table],
        };

        setRow(selectedRow);
        setInformacaosOftables([metadata]);
        setSelectColumns(Object.keys(selectColumns));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          console.error("Erro ao carregar dados:", error);
          setLoadError(error.response?.data?.message || 'Erro ao carregar dados');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [table, field, value, setRow, setInformacaosOftables, setSelectColumns]);

  // Hook customizado para deletar registro

  const onDelete = useCallback(async (payload: PayloadDeleteRow,index: number)  => {
    try {
      // Chamar sua API de delete
      payload.index = payload.index || index
      await api.delete("/delete/records", {
        data: {
          registros: [payload],
        },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error('Erro ao eliminar registro:', error);
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
    onClose: window.close
  });

  // Inicializar campos editáveis
  useEffect(() => {
    if (!row?.row || Object.keys(row.row).length === 0) return;

    const initialEditedFields: Record<string, EditedField> = {};
    const initialEnabledFields: Record<string, boolean> = {};

    Object.entries(row.row).forEach(([key, value]) => {
      initialEditedFields[key] = {
        value: String(value ?? ''),
        tableName: table || row.tableName?.[0] || "",
        hasChanged: false,
        type_column: "text"
      };
      initialEnabledFields[table + key] = false;
    });

    setEditedFields(initialEditedFields);
    setEnabledFields(initialEnabledFields);
    setErrors({}); // Limpar erros ao reinicializar
  }, [row, informacaosOftables, table]);

  // Handlers
  // Handler para mudanças nos campos
  const handleFieldChange = useCallback((key: string, value: string, tableName: string, columnType: string, isNullable?: boolean) => {
    // Validação
    let error = validateField(columnType, String(value));
    // Valida NOT NULL
    if (!isNullable && (value === "" || value === null || value === undefined)) {
      error = "Este campo é obrigatório.";
    }
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
          hasChanged,
          type_column: columnType
        }
      };
    });
  }, [row?.row]);

  const handleToggleEdit = useCallback((field: string) => {
    setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleViewReference = useCallback((table: string, field: string, value: string, name: string) => {
    viewReferenceTable({ table, field, value }, { name });
  }, [viewReferenceTable]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || hasValidationErrors) return;
    if (!window.confirm("Tens a certeza que queres editar?")) return;
    setIsSaving(true);
    try {
      // Preparar dados para salvar
      const tables_primary_keys_values = Object.entries(editedFields)
        .filter(([, field]) => field.hasChanged)
        .reduce((acc, [key, field]) => {
          const table = informacaosOftables.find(t => t.table_name === field.tableName);
          if (!table) return acc;

          if (!acc[table.table_name]) {
            const primaryKeyField = findIdentifierField(table.table_name, informacaosOftables)?.nome;
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
          const [tableName, column] = key.split(".");
          if (!acc[tableName]) acc[tableName] = {};
          acc[tableName][column] = {
            value: String(field.value),
            type_column: field.type_column
          };
          return acc;
        }, {});

      await api.post("/exe/update_row", {
        updatedRow,
        tables_primary_keys_values
      }, { withCredentials: true });

      // Mostrar sucesso e fechar
      setTimeout(() => window.close(), 500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, hasValidationErrors, editedFields, informacaosOftables, row?.row]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirm = window.confirm("Você tem alterações não salvas. Deseja realmente sair?");
      if (!confirm) return;
    }
    window.close();
  }, [hasChanges]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <header className="flex justify-between items-center border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold text-gray-800">Carregando...</h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <FieldSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!row || selectedTables.length === 0) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nenhum Dado Encontrado</h2>
          <p className="text-gray-600">Não foi possível carregar os dados solicitados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-gray-200 p-4 shadow-sm bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Detalhes da Linha</h2>
          {hasChanges && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {changedFieldsCount} campo{changedFieldsCount !== 1 ? 's' : ''} alterado{changedFieldsCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          title="Fechar"
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
              <span>Tabela: {metadata.table_name}</span>
              <span className="text-sm text-gray-500 font-normal">
                ({metadata.colunas.length} campos)
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metadata.colunas.map((col, index) => {
                const qualifiedName = `${metadata.table_name}.${col.nome}`;
                const editedField = editedFields[col.nome];

                if (!editedField) {
                  // console.log(editedField,editedFields)
                  return null
                };

                return (
                  <FieldEditor
                    key={`${qualifiedName}_${index}`}
                    col={col}
                    metadata={metadata}
                    editedField={editedField}
                    isEnabled={enabledFields[qualifiedName] ?? false}
                    hasError={errors[qualifiedName] || ''}
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
      <footer className="flex justify-between items-center p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {hasValidationErrors && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              Corrija os erros antes de salvar
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || isDeleting}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Eliminar este registro"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>

          <button
            onClick={handleClose}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {hasChanges ? 'Cancelar' : 'Fechar'}
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || hasValidationErrors || isSaving}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar {changedFieldsCount > 0 ? `(${changedFieldsCount})` : ''}
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
  );
};