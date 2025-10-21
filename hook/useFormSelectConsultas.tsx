import { MetadataTableResponse, SelectedRow } from "@/types";
import usePersistedState from "./localStoreUse";
import { useCallback, useState } from "react";

export const useFormSelectConsulta = (errorp: string | null) => {
  const [selectedTables, setSelectedTables] = usePersistedState<string[]>(
    "consulta_selectedTables",
    []
  );
  const [aliasTables, setAliasTables] =
    usePersistedState<Record<string, string>>("consulta_aliasTables", {});
  const [columnsInfo, setColumnsInfo] = usePersistedState<
    MetadataTableResponse[]
  >("consulta_columnsInfo", []);
  const [selectColumns, setSelectColumns] = usePersistedState<string[]>(
    "consulta_selectColumns",
    []
  );
  const [queryLimit, setQueryLimit] = usePersistedState<string>(
    "consulta_queryLimit",
    "100"
  );

  const [selectedRow, setSelectedRow] = useState<SelectedRow | null>(null);
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [error, setError] = useState<string | null>(errorp);

  const removerCacheLocalStorage = useCallback(() => {
    if (typeof window === "undefined") return; // ✅ corrigido

    localStorage.removeItem("consulta_selectedTables");
    localStorage.removeItem("consulta_columnsInfo");
    localStorage.removeItem("consulta_selectColumns");
    localStorage.removeItem("query_conditions");
    localStorage.removeItem("query_select");
    localStorage.removeItem("query_distinct");
    localStorage.removeItem("query_joins");

    // resetando estados
    setSelectColumns([]);
    setSelectedTables([]);
    setColumnsInfo([]);
    setAliasTables({});
    setQueryLimit("100");
    setSelectedRow(null);
    setModalOpenEdit(false);
    setIsEditingRow(false);
    setError(null);
  }, [
    setAliasTables,
    setColumnsInfo,
    setQueryLimit,
    setSelectColumns,
    setSelectedTables,
  ]);

  return {
    // setters
    setSelectColumns,
    setSelectedTables,
    setColumnsInfo,
    setAliasTables,
    setQueryLimit,
    setSelectedRow,
    setModalOpenEdit,
    setLoadingFields,
    setIsEditingRow,
    setError,

    // states
    selectedTables,
    aliasTables,
    columnsInfo,
    selectColumns,
    queryLimit,
    selectedRow,
    modalOpenEdit,
    loadingFields,
    isEditingRow,
    error,

    // helpers
    removerCacheLocalStorage,
  };
};
