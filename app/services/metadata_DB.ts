// services/databaseService.ts

import api from "@/context/axioCuston";
import { DatabaseMetadata, TableInfo } from "@/types";
import { DBStructure } from "@/types/db-structure";

interface ResponseWrapper<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Busca apenas os nomes das tabelas.
 */
export const fetchTables = async (): Promise<string[]> => {
  const { data } = await api.get<ResponseWrapper<string[]>>("/consu/tables", { withCredentials: true ,  timeout: 65000});
  return data?.data ?? [];
};

/**
 * Busca as estruturas das tabelas com detalhes completos.
 */
export const fetchStructures = async (): Promise<DBStructure[]> => {
  const { data } = await api.get<ResponseWrapper<DBStructure[]>>("/consu/structures", { withCredentials: true, timeout: 65000 });
  return data?.data ?? [];
};

/**
 * Busca a estrutura de uma tabela específica.
 */
export const fetchStructure = async (tableName: string): Promise<DBStructure | null> => {
  const { data } = await api.get<ResponseWrapper<DBStructure>>(`/consu/structures/${tableName}`, { withCredentials: true , timeout: 65000});
  return data?.data ?? null;
};

/**
 * Busca a contagem de registros de uma tabela específica.
 */
export const fetchTableCount = async (tableName: string): Promise<number> => {
  const { data } = await api.get<ResponseWrapper<number>>(`/consu/table/${tableName}/count`, { withCredentials: true, timeout: 65000 });
  return data?.data ?? -1;
};

/**
 * Sincroniza e retorna metadados da conexão ativa.
 */
export const fetchSyncMetadata = async (): Promise<DatabaseMetadata> => {
  const { data } = await api.get<ResponseWrapper<DatabaseMetadata>>("/consu/sync", { withCredentials: true,  timeout: 65000 });
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

/**
 * Stream em tempo real das contagens de tabelas.
 */
export const fetchTableCountsStream = async (): Promise<ReadableStream | null> => {
  try {
    const response = await fetch('/api/consu/stream/tables/counts', {
      credentials: 'include',
    });
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    return response.body;
  } catch (error) {
    console.error('Erro no stream de contagens:', error);
    return null;
  }
};

/**
 * Limpa o cache das consultas do usuário atual.
 */
export const clearCache = async (): Promise<{ cleared_functions: number }> => {
  const { data } = await api.post<ResponseWrapper<{ cleared_functions: number }>>(
    "/consu/cache/clear", 
    {}, 
    { withCredentials: true }
  );
  
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao limpar cache.");
  }
  
  return data.data;
};

/**
 * Busca informações do cache.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchCacheInfo = async (): Promise<Record<string, any>> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.get<ResponseWrapper<Record<string, any>>>("/consu/cache/info", { withCredentials: true });
  return data?.data ?? {};
};

/**
 * Health check da conexão do usuário.
 */
export const fetchHealthCheck = async (): Promise<{
  user_id: number;
  active_connection: {
    connection_id: number;
    database_name: string;
    connection_type: string;
  };
  cache_enabled: boolean;
  status: string;
}> => {
  const { data } = await api.get<ResponseWrapper<{
    user_id: number;
    active_connection: {
      connection_id: number;
      database_name: string;
      connection_type: string;
    };
    cache_enabled: boolean;
    status: string;
  }>>("/consu/health", { withCredentials: true });
  
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro no health check.");
  }
  
  return data.data;
};

/**
 * Busca estatísticas detalhadas de uma tabela específica.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchTableStatistics = async (tableName: string): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.get<ResponseWrapper<any>>(`/consu/table/${tableName}/statistics`, { withCredentials: true });
  return data?.data ?? {};
};

/**
 * Busca informações de schema de uma tabela.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchTableSchema = async (tableName: string): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.get<ResponseWrapper<any>>(`/consu/table/${tableName}/schema`, { withCredentials: true });
  return data?.data ?? {};
};

// Serviços avançados para gerenciamento de estruturas
/**
 * Cria uma nova estrutura de tabela.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStructure = async (structureData: any): Promise<DBStructure> => {
  const { data } = await api.post<ResponseWrapper<DBStructure>>(
    "/consu/structures", 
    structureData, 
    { withCredentials: true }
  );
  
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao criar estrutura.");
  }
  
  return data.data;
};

/**
 * Atualiza uma estrutura de tabela existente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateStructure = async (structureId: number, structureData: any): Promise<DBStructure> => {
  const { data } = await api.put<ResponseWrapper<DBStructure>>(
    `/consu/structures/${structureId}`, 
    structureData, 
    { withCredentials: true }
  );
  
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao atualizar estrutura.");
  }
  
  return data.data;
};

/**
 * Deleta uma estrutura de tabela.
 */
const deleteStructure = async (structureId: number): Promise<void> => {
  const { data } = await api.delete<ResponseWrapper<void>>(
    `/consu/structures/${structureId}`, 
    { withCredentials: true }
  );
  
  if (!data.success) {
    throw new Error(data.error || "Erro ao deletar estrutura.");
  }
};

// Serviços para campos (fields)
/**
 * Adiciona um campo a uma estrutura existente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFieldToStructure = async (structureId: number, fieldData: any): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.post<ResponseWrapper<any>>(
    `/consu/structures/${structureId}/fields`, 
    fieldData, 
    { withCredentials: true }
  );
  
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao adicionar campo.");
  }
  
  return data.data;
};

/**
 * Atualiza um campo específico.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateField = async (structureId: number, fieldId: number, fieldData: any): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.put<ResponseWrapper<any>>(
    `/consu/structures/${structureId}/fields/${fieldId}`, 
    fieldData, 
    { withCredentials: true }
  );
  
  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao atualizar campo.");
  }
  
  return data.data;
};

/**
 * Remove um campo de uma estrutura.
 */
const removeField = async (structureId: number, fieldId: number): Promise<void> => {
  const { data } = await api.delete<ResponseWrapper<void>>(
    `/consu/structures/${structureId}/fields/${fieldId}`, 
    { withCredentials: true }
  );
  
  if (!data.success) {
    throw new Error(data.error || "Erro ao remover campo.");
  }
};

export default {
  fetchTables,
  fetchStructures,
  fetchStructure,
  fetchTableCount,
  fetchSyncMetadata,
  fetchTablesWithCount,
  fetchTableCountsStream,
  clearCache,
  fetchCacheInfo,
  fetchHealthCheck,
  fetchTableStatistics,
  fetchTableSchema,
  createStructure,
  updateStructure,
  deleteStructure,
  addFieldToStructure,
  updateField,
  removeField,
};