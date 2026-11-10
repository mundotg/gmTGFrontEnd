import { AlertCircle, Database, RefreshCw, X } from "lucide-react";
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

// Componente principal do popup de referência
export const ReferencePopup = () => {
  const searchParams = useSearchParams();
  const table = useMemo(() => searchParams.get("table") || "", [searchParams]);
  const field = useMemo(() => searchParams.get("field") || "", [searchParams]);
  const value = useMemo(() => searchParams.get("value") || "", [searchParams]);
  const schemaParam = useMemo(() => searchParams.get("schema") || "", [searchParams]);
  const connectionIdParam = useMemo(() => searchParams.get("connection_id") || searchParams.get("conn_id") || "", [searchParams]);

  const { t } = useI18n();

  // Estados principais
  const [informacaosOftables, setInformacaosOftables] = useState<MetadataTableResponse[]>([]);
  const [row, setRow] = useState<SelectedRow>({ row: {}, nameColumns: [] });
  const [selectColumns, setSelectColumns] = useState<string[]>([]);

  // Estados de edição
  const [editedFields, setEditedFields] = useState<Record<string, EditedField>>({});
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados de UI - inicia em true para exibir o skeleton enquanto busca dados
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  const { openReferencePopup: viewReferenceTable } = usePopupReference();

  // Dados computados - na página de referência há apenas uma tabela em foco
  const selectedTables = useMemo(() => {
    return informacaosOftables;
  }, [informacaosOftables]);

  const hasChanges = useMemo(() => {
    return Object.values(editedFields).some(f => f.hasChanged);
  }, [editedFields]);

  const hasValidationErrors = useMemo(() => {
    return Object.values(errors).some(error => !!error);
  }, [errors]);

  const changedFieldsCount = useMemo(() => {
    return Object.values(editedFields).filter(f => f.hasChanged).length;
  }, [editedFields]);

  // Carregamento inicial dos dados com normalização robusta
  useEffect(() => {
    console.log('[ReferencePopup 🔍] useEffect acionado com parâmetros:', {
      table,
      field,
      value,
      schemaParam,
      connectionIdParam,
    });

    if (!table || !field || !value) {
      console.warn('[ReferencePopup ⚠️] Parâmetros obrigatórios ausentes:', { table, field, value });
      setLoadError(t("referencePopup.invalidParams") || 'Parâmetros inválidos: table, field e value são obrigatórios');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        console.log('[ReferencePopup 🚀] Iniciando fetchData...');
        setIsLoading(true);
        setLoadError('');

        // 1. Normaliza os nomes de tabela e campo
        const pureTable = table.includes(".") ? table.split(".").pop()! : table;
        const pureField = field.includes(".") ? field.split(".").pop()! : field;
        const embeddedSchema = table.includes(".") ? table.split(".")[0] : "";
        const targetSchema = schemaParam || embeddedSchema;

        console.log('[ReferencePopup ⚙️] Nomes normalizados:', {
          pureTable,
          pureField,
          embeddedSchema,
          targetSchema,
        });

        // 2. Buscar metadados da tabela com fallback seguro
        let metadata: MetadataTableResponse | null = null;
        let lastErrorMsg = '';

        const fetchMeta = async (tbl: string, sch?: string) => {
          const params: Record<string, string> = {};
          if (sch) params.schema = sch;
          if (connectionIdParam) params.connection_id = connectionIdParam;

          console.log(`[ReferencePopup 📡] GET /consu/metadata_fieds/${encodeURIComponent(tbl)}`, { params });
          return await api.get<MetadataTableResponse>(
            `/consu/metadata_fieds/${encodeURIComponent(tbl)}`,
            { params, withCredentials: true, signal: controller.signal }
          );
        };

        // Tentativa 1: nome informado + schema (se houver)
        try {
          console.log('[ReferencePopup 📡] Metadados Tentativa 1 (nome informado + schema)...');
          const res = await fetchMeta(table, targetSchema);
          metadata = res.data;
          console.log('[ReferencePopup ✅] Metadados obtidos na Tentativa 1:', {
            table_name: metadata?.table_name,
            connection_id: metadata?.connection_id,
            total_colunas: metadata?.colunas?.length,
          });
        } catch (err: any) {
          console.warn('[ReferencePopup ⚠️] Falha na Tentativa 1:', {
            message: err?.message,
            status: err?.response?.status,
            data: err?.response?.data,
            aborted: controller.signal.aborted,
          });
          if (controller.signal.aborted) {
            console.log('[ReferencePopup 🛑] Requisição abortada pelo controller.');
            return;
          }
          lastErrorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || '';

          // Tentativa 2: pureTable com schema explícito ou fallback para 'public'
          try {
            console.log('[ReferencePopup 📡] Metadados Tentativa 2 (pureTable com schema)...', { pureTable, schema: targetSchema || 'public' });
            const res = await fetchMeta(pureTable, targetSchema || 'public');
            metadata = res.data;
            console.log('[ReferencePopup ✅] Metadados obtidos na Tentativa 2:', {
              table_name: metadata?.table_name,
              connection_id: metadata?.connection_id,
              total_colunas: metadata?.colunas?.length,
            });
          } catch (err2: any) {
            console.warn('[ReferencePopup ⚠️] Falha na Tentativa 2:', {
              message: err2?.message,
              status: err2?.response?.status,
              data: err2?.response?.data,
              aborted: controller.signal.aborted,
            });
            if (controller.signal.aborted) {
              console.log('[ReferencePopup 🛑] Requisição abortada pelo controller.');
              return;
            }
            lastErrorMsg = err2?.response?.data?.detail || err2?.response?.data?.message || lastErrorMsg;

            // Tentativa 3: pureTable sem schema
            try {
              console.log('[ReferencePopup 📡] Metadados Tentativa 3 (pureTable sem schema)...', { pureTable });
              const res = await fetchMeta(pureTable);
              metadata = res.data;
              console.log('[ReferencePopup ✅] Metadados obtidos na Tentativa 3:', {
                table_name: metadata?.table_name,
                connection_id: metadata?.connection_id,
                total_colunas: metadata?.colunas?.length,
              });
            } catch (err3: any) {
              console.error('[ReferencePopup ❌] Falha em todas as tentativas de metadados:', {
                message: err3?.message,
                status: err3?.response?.status,
                data: err3?.response?.data,
                aborted: controller.signal.aborted,
              });
              if (controller.signal.aborted) {
                console.log('[ReferencePopup 🛑] Requisição abortada pelo controller.');
                return;
              }
              lastErrorMsg = err3?.response?.data?.detail || err3?.response?.data?.message || lastErrorMsg;
              throw new Error(lastErrorMsg || `Não foi possível carregar os metadados da tabela '${table}'.`);
            }
          }
        }

        if (controller.signal.aborted) {
          console.log('[ReferencePopup 🛑] Requisição abortada antes de processar query.');
          return;
        }

        if (!metadata || !metadata.colunas || metadata.colunas.length === 0) {
          console.error('[ReferencePopup ❌] Metadados vazios ou sem colunas:', metadata);
          throw new Error("Não foi possível carregar a estrutura de colunas desta tabela.");
        }

        // Tabela efetiva para a query
        const actualTable = metadata.table_name || pureTable;

        // 3. Montar aliases de coluna sem duplicar prefixo
        const selectCols: Record<string, string> = {};
        metadata.colunas.forEach((col) => {
          const colClean = col.nome.includes(".") ? col.nome.split(".").pop()! : col.nome;
          const qualified = `${actualTable}.${colClean}`;
          selectCols[qualified] = qualified;
        });

        // 4. Identificar o tipo correto da coluna do filtro
        const targetCol = metadata.colunas.find((c) => {
          const cName = c.nome.includes(".") ? c.nome.split(".").pop()! : c.nome;
          return cName.toLowerCase() === pureField.toLowerCase();
        });

        let columnType = targetCol?.tipo?.toLowerCase() || "string";
        const trimmedVal = value.trim();

        // Se o valor for no padrão UUID (36 caracteres hex com hífens), força tipo 'uuid'
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedVal)) {
          columnType = "uuid";
        }

        // Conexão associada (se conhecida)
        const connId = metadata.connection_id || (connectionIdParam ? parseInt(connectionIdParam, 10) : undefined);

        console.log('[ReferencePopup 🔧] Configuração para /exe/execute_query:', {
          actualTable,
          columnType,
          trimmedVal,
          connId,
          colunasTotais: Object.keys(selectCols).length,
        });

        // 5. Construir query para buscar o registro
        const query: QueryPayload = {
          baseTable: actualTable,
          connection_id: connId,
          aliaisTables: selectCols,
          table_list: [actualTable],
          joins: {},
          where: [{
            table_name_fil: actualTable,
            column: pureField,
            operator: "=",
            value: trimmedVal,
            logicalOperator: "AND",
            column_type: columnType as any,
            value_type: "string",
          }],
          limit: 1,
        };

        console.log('[ReferencePopup 📤] Executando POST /exe/execute_query...', query);

        // 6. Executar query
        const queryResponse = await api.post<QueryResultType>(
          "/exe/execute_query",
          query,
          { withCredentials: true, signal: controller.signal }
        );

        if (controller.signal.aborted) {
          console.log('[ReferencePopup 🛑] Requisição abortada após /exe/execute_query.');
          return;
        }

        console.log('[ReferencePopup 📥] Resposta de /exe/execute_query recebida:', queryResponse.data);

        const previewRows = queryResponse.data?.preview || [];
        if (!previewRows[0]) {
          console.warn('[ReferencePopup ⚠️] Nenhum registro retornado em previewRows:', queryResponse.data);
          setLoadError(t("referencePopup.notFound") || 'Registro não encontrado');
          return;
        }

        const selectedRow: SelectedRow = {
          row: previewRows[0],
          nameColumns: Object.keys(selectCols),
          tableName: [actualTable],
        };

        console.log('[ReferencePopup 🎉] Carregamento bem-sucedido! Definindo row:', selectedRow);
        setRow(selectedRow);
        setInformacaosOftables([metadata]);
        setSelectColumns(Object.keys(selectCols));
      } catch (error) {
        const e = error as { name?: string; message?: string; response?: { data?: { message?: string; detail?: string } } };
        console.error('[ReferencePopup ❌] Erro no bloco catch de fetchData:', error);
        // Ignora apenas se foi cancelado por desmontagem real
        if (!controller.signal.aborted) {
          const errorMsg =
            e?.response?.data?.detail ||
            e?.response?.data?.message ||
            e?.message ||
            t("referencePopup.loadError") ||
            'Erro ao carregar dados';
          console.error('[ReferencePopup ❌] Definindo loadError:', errorMsg);
          setLoadError(errorMsg);
        } else {
          console.log('[ReferencePopup 🛑] Erro ignorado pois controller.signal.aborted é true.');
        }
      } finally {
        console.log('[ReferencePopup 🏁] finally de fetchData executado. signalAborted:', controller.signal.aborted);
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      console.log('[ReferencePopup 🧹] Cleanup do useEffect: abortando controller');
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, field, value, schemaParam, connectionIdParam]);

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

  // Inicializar campos editáveis garantindo que todas as variantes de chaves casem com FieldEditor
  useEffect(() => {
    if (!row?.row || Object.keys(row.row).length === 0) return;

    const initialEditedFields: Record<string, EditedField> = {};
    const initialEnabledFields: Record<string, boolean> = {};

    const meta = informacaosOftables[0];
    const actualTable = meta?.table_name || table || row.tableName?.[0] || "";
    const justTable = actualTable.includes(".") ? actualTable.split(".").pop()! : actualTable;

    // Popula a partir dos dados retornados da query
    Object.entries(row.row).forEach(([rawKey, val]) => {
      const pureKey = rawKey.includes(".") ? rawKey.split(".").pop()! : rawKey;
      const valStr = val !== null && val !== undefined ? String(val) : "";

      const targetCol = meta?.colunas?.find((c) => {
        const cName = c.nome.includes(".") ? c.nome.split(".").pop()! : c.nome;
        return cName.toLowerCase() === pureKey.toLowerCase();
      });

      const fieldObj: EditedField = {
        value: valStr,
        tableName: actualTable,
        hasChanged: false,
        type_column: targetCol?.tipo || "text",
      };

      // Mapeia todas as possíveis variações da chave
      initialEditedFields[rawKey] = fieldObj;
      initialEnabledFields[rawKey] = false;

      initialEditedFields[pureKey] = fieldObj;
      initialEnabledFields[pureKey] = false;

      initialEditedFields[`${actualTable}.${pureKey}`] = fieldObj;
      initialEnabledFields[`${actualTable}.${pureKey}`] = false;

      if (justTable && justTable !== actualTable) {
        initialEditedFields[`${justTable}.${pureKey}`] = fieldObj;
        initialEnabledFields[`${justTable}.${pureKey}`] = false;
      }
    });

    // Garante que todas as colunas dos metadados tenham entrada em editedFields
    meta?.colunas?.forEach((col) => {
      const pureKey = col.nome.includes(".") ? col.nome.split(".").pop()! : col.nome;
      const keyWithTable = `${actualTable}.${pureKey}`;
      if (!initialEditedFields[keyWithTable] && !initialEditedFields[pureKey]) {
        const fieldObj: EditedField = {
          value: "",
          tableName: actualTable,
          hasChanged: false,
          type_column: col.tipo || "text",
        };
        initialEditedFields[keyWithTable] = fieldObj;
        initialEditedFields[pureKey] = fieldObj;
        initialEnabledFields[keyWithTable] = false;
        initialEnabledFields[pureKey] = false;
      }
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

  const handleViewReference = useCallback((
    refTable: string,
    refField: string,
    refValue: string,
    name: string,
    connectionId?: number,
    schema?: string | null
  ) => {
    viewReferenceTable({
      table: refTable,
      field: refField,
      value: refValue,
      ...(connectionId ? { connection_id: connectionId } : {}),
      ...(schema ? { schema } : {})
    }, { name });
  }, [viewReferenceTable]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || hasValidationErrors) return;
    if (!window.confirm(t("modals.confirmEdit") || "Tens a certeza que queres editar?")) return;

    setIsSaving(true);
    try {
      const tables_primary_keys_values = Object.entries(editedFields)
        .filter(([, f]) => f.hasChanged)
        .reduce((acc, [key, f]) => {
          const t_meta = informacaosOftables.find(t => t.table_name === f.tableName) || informacaosOftables[0];
          if (!t_meta) return acc;

          const pureColKey = key.includes(".") ? key.split(".").pop()! : key;

          if (!acc[t_meta.table_name]) {
            const pkCol = findIdentifierField(t_meta.table_name, informacaosOftables);
            const pkField = pkCol?.nome ? (pkCol.nome.includes(".") ? pkCol.nome.split(".").pop()! : pkCol.nome) : "id";
            const primary_key_name = `${t_meta.table_name}.${pkField}`;
            
            // Busca o valor da PK em todas as possíveis variantes de chave no row
            const pkVal =
              row?.row?.[primary_key_name] ??
              row?.row?.[pkField] ??
              row?.row?.[`${t_meta.table_name.split(".").pop()}.${pkField}`] ??
              "null";

            acc[t_meta.table_name] = {
              primaryKey: primary_key_name,
              valor: String(pkVal),
            };
          }

          acc[t_meta.table_name][pureColKey] = f.value;
          return acc;
        }, {} as Tables_primary_keys_values);

      const updatedRow = Object.entries(editedFields)
        .filter(([, f]) => f.hasChanged)
        .reduce<EditedFieldForQuery>((acc, [key, f]) => {
          const parts = key.split(".");
          const column = parts.pop() || key;
          const tableName = f.tableName || parts.join(".") || table;

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
  }, [hasChanges, hasValidationErrors, editedFields, informacaosOftables, row?.row, table, t]);

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
    console.log('[ReferencePopup 🎨] Renderizando: LOADING');
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
    console.log('[ReferencePopup 🎨] Renderizando: ERROR ->', loadError);
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t("referencePopup.errorTitle") || "Erro ao Carregar"}</h2>
          <p className="text-gray-600 mb-4 break-words">{loadError}</p>
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
  if (!isLoading && (!row?.row || Object.keys(row.row).length === 0 || selectedTables.length === 0)) {
    console.log('[ReferencePopup 🎨] Renderizando: NO DATA. Detalhes:', {
      isLoading,
      hasRow: !!row?.row,
      rowKeys: Object.keys(row?.row || {}),
      selectedTablesCount: selectedTables.length,
      loadError,
    });
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t("referencePopup.noDataTitle") || "Nenhum Dado Encontrado"}</h2>
          <p className="text-gray-600 mb-4">{t("referencePopup.noDataDesc") || "Não foi possível carregar os dados solicitados."}</p>
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

  console.log('[ReferencePopup 🎨] Renderizando: SUCESSO / FORMULÁRIO com colunas:', selectColumns.length);

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
                // 1. Extrai o nome puro da coluna e da tabela
                const pureCol = col.nome.includes(".") ? col.nome.split(".").pop()! : col.nome;
                const justTable = metadata.table_name.includes(".")
                  ? metadata.table_name.split(".").pop()!
                  : metadata.table_name;

                // 2. Procura nas variações registradas
                const keyWithSchema = `${metadata.table_name}.${pureCol}`;
                const keyWithTable = `${justTable}.${pureCol}`;
                const keyJustColumn = pureCol;
                const keyExact = col.nome;

                const correctKey =
                  editedFields[keyWithSchema] ? keyWithSchema :
                  editedFields[keyWithTable] ? keyWithTable :
                  editedFields[keyExact] ? keyExact :
                  editedFields[keyJustColumn] ? keyJustColumn :
                  keyWithTable;

                // 3. Fallback seguro caso não tenha sido inicializado
                const editedField = editedFields[correctKey] || {
                  value: "",
                  tableName: metadata.table_name,
                  hasChanged: false,
                  type_column: col.tipo || "text",
                };

                const isEnabled = enabledFields[correctKey] ?? false;
                const hasError = errors[correctKey] ?? "";

                return (
                  <FieldEditor
                    key={`${correctKey}_${index}`}
                    col={col}
                    qualifiedName={correctKey}
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
        onDelete={() => setShowDeleteConfirm(true)}
        onCancel={handleClose}
        onSave={handleSave}
        isLoading={isLoading}
        isDeleting={isDeleting}
        isSaving={isSaving}
        disableSave={!hasChanges || isLoading || isDeleting || Object.values(errors).some(error => !!error)}
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
