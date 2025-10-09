// services/databaseService.ts

import api from "@/context/axioCuston";
import { DatabaseMetadata, TableInfo } from "@/types";

// Tipagem genérica para o wrapper que o backend retorna
export interface ResponseWrapper<T> {
  success: boolean;
  data: T | null;
  error?: string;
}


/**
 * Busca apenas os nomes das tabelas.
 */
export const fetchTables = async (): Promise<string[]> => {
  const { data } = await api.get<ResponseWrapper<string[]>>("/consu/tables", { withCredentials: true });
  return data?.data ?? [];
};

/**
 * Busca a contagem de registros de uma tabela específica.
 */
export const fetchTableCount = async (tableName: string): Promise<number> => {
  const { data } = await api.get<ResponseWrapper<number>>(`/consu/table/${tableName}/count`, { withCredentials: true });
  return data?.data ?? -1;
};

/**
 * Sincroniza e retorna metadados da conexão ativa.
 */
export const fetchSyncMetadata = async (): Promise<DatabaseMetadata> => {
  const { data } = await api.get<ResponseWrapper<DatabaseMetadata>>("/consu/sync", { withCredentials: true });
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao sincronizar metadados.");
  }
  return data.data;
};

/**
 * Busca tabelas com contagem de registros.
 */
export const fetchTablesWithCount = async (): Promise<TableInfo[]> => {
  const { data } = await api.get<ResponseWrapper<TableInfo[]>>("/consu/tables-with-count", { withCredentials: true });
  return data?.data ?? [];
};
