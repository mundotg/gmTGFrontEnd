import api from "@/context/axioCuston";
import { CampoDetalhado, LinhaCompletaResponse, QueryPayload, SelectedRow } from "@/types";

const MAX_CACHE_SIZE = 25;

// 📦 Armazém de cache local para as requisições
const queryCache = new Map<string, Promise<Record<string, any> | null>>();

export const clearRowDataCache = () => {
  queryCache.clear();
  console.log("🧹 Cache de linhas limpo.");
};

/**
 * 🛠️ Helper interno: Gerencia a adição no cache respeitando o limite.
 * Usa o padrão LRU (Least Recently Used).
 */
const setCacheItem = (key: string, promise: Promise<Record<string, any> | null>) => {
  // Se a chave já existe, removemos para inseri-la de novo no "final" da fila (atualiza a prioridade)
  if (queryCache.has(key)) {
    queryCache.delete(key);
  }

  queryCache.set(key, promise);

  // Se exceder o limite, removemos o item mais antigo (o primeiro do Map)
  if (queryCache.size > MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) {
      queryCache.delete(oldestKey);
      console.log(`🗑️ Limite de cache atingido (${MAX_CACHE_SIZE}). O registro mais antigo foi removido.`);
    }
  }
};


export const fetchRowData = async (
  row: SelectedRow,
  tableName: string,
  primaryKeyField: string,
  col_type?: string,
  primaryKeyValue?: string,
  tableColumns?: CampoDetalhado[],     // 👈 NOVO: Passamos as colunas conhecidas
  currentRowData?: Record<string, any> // 👈 NOVO: Passamos os dados que já temos
): Promise<Record<string, any> | null> => {
  if (row?.index === undefined || row.index === null) {
    console.warn("⚠️ Índice da linha não informado");
    return null;
  }

  // 🏆 1. OTIMIZAÇÃO: Verifica se já temos todas as colunas na tela
  let hasMissingColumns = false;
  const currentData = currentRowData || {};

  if (tableColumns && tableColumns.length > 0) {
    for (const col of tableColumns) {
      const fullKey = `${tableName}.${col.nome}`;
      const shortKey = col.nome;

      if (
        !Object.prototype.hasOwnProperty.call(currentData, fullKey) &&
        !Object.prototype.hasOwnProperty.call(currentData, shortKey)
      ) {
        hasMissingColumns = true;
        break; // Achou pelo menos uma coluna faltando, para o loop e vai pro fetch!
      }
    }
  } else {
    hasMissingColumns = true; // Se não sabemos as colunas, forçamos a busca por segurança
  }

  // Se não falta nada, cancela a requisição e devolve os dados da tela!
  if (!hasMissingColumns) {
    console.log(`⚡ Todas as colunas da tabela ${tableName} já estão na tela. Requisição evitada!`);
    return currentData;
  }

  // 2. Lógica de Cache
  const orderByStr = row.orderBy ? JSON.stringify(row.orderBy) : "[]";
  const cacheKey = `fetchRowData_${tableName}_${row.index}_${primaryKeyField}_${primaryKeyValue}_${orderByStr}`;

  if (queryCache.has(cacheKey)) {
    console.log(`📦 Retornando dados do Cache: ${cacheKey}`);
    const cachedPromise = queryCache.get(cacheKey)!;
    setCacheItem(cacheKey, cachedPromise); 
    return cachedPromise;
  }

  // 3. Execução da Requisição
  const requestPromise = (async () => {
    try {
      const response = await api.get<LinhaCompletaResponse>(
        `/consu/linha-completa/${encodeURIComponent(row?.index || 0)}`,
        {
          params: {
            primary_key_field: primaryKeyField,
            col_type: col_type ?? "",
            primary_key_value: primaryKeyValue ?? "",
            order_by: orderByStr,
            table_name: tableName,
          },
          withCredentials: true,
        }
      );

      const result = response.data?.data?.__root__ ?? null;

      if (result === null) {
        console.warn(`⚠️ Resultado nulo recebido. Removendo do cache: ${cacheKey}`);
        queryCache.delete(cacheKey);
        return null;
      }

      // 🚨 4. A TRADUÇÃO DAS CHAVES (Garantir formato tabela.coluna)
      const mappedResult: Record<string, any> = {};
      
      Object.entries(result).forEach(([key, value]) => {
        // Se o backend retornar "name", nós forçamos para "public.db_fields.name"
        const finalKey = key.includes(".") ? key : `${tableName}.${key}`;
        mappedResult[finalKey] = value;
      });

      // 🧩 5. MERGE SEGURO: Mistura o que já tínhamos com o resultado formatado
      const completeRow = { ...currentData, ...mappedResult };

      return completeRow;
    } catch (error) {
      console.error("❌ Erro ao buscar linha completa:", error);
      queryCache.delete(cacheKey);
      return null;
    }
  })();

  setCacheItem(cacheKey, requestPromise);
  return requestPromise;
};


export const fetchRowDataIndex = async (
  index: number,
  payload: QueryPayload,
  all_colunas: Record<string, CampoDetalhado[]>,
  currentRowData: Record<string, any>
): Promise<Record<string, any> | null> => {
  
  // 1. Validações iniciais
  if (typeof index !== "number" || Number.isNaN(index) || index < 0) {
    console.warn(`⚠️ Índice da linha inválido. Recebido: ${index}`);
    return null;
  }

  if (!payload || typeof payload !== "object") {
    console.warn("⚠️ Payload inválido ou não informado.");
    return null;
  }

  // 2. Setup do Payload de requisição
  const requestPayload: QueryPayload = {
    ...payload,
    aliaisTables: {} // Começa vazio, pede só o que falta
  };

  let columnsToFetch = 0;
  let hasBaseTableColumn = false;

  // 🚨 3. O MAPA DE TRADUÇÃO: Guarda a relação "nome_curto" -> "nome.longo.com.schema"
  const expectedKeysMap: Record<string, string> = {};

  if (all_colunas) {
    Object.entries(all_colunas).forEach(([tableName, colunas]) => {
      colunas.forEach((col) => {
        const fullColumnKey = `${tableName}.${col.nome}`;
        const shortColumnKey = col.nome;

        // Verifica se a coluna já existe (com nome longo ou curto)
        const alreadyHasData = 
          Object.prototype.hasOwnProperty.call(currentRowData, fullColumnKey) ||
          Object.prototype.hasOwnProperty.call(currentRowData, shortColumnKey);

        if (!alreadyHasData) {
          // Solicita a chave completa para o banco
          requestPayload.aliaisTables[fullColumnKey] = fullColumnKey; 
          
          // Ensina ao tradutor que se o banco retornar "name", deve virar "public.tabela.name"
          expectedKeysMap[shortColumnKey] = fullColumnKey; 
          columnsToFetch++;

          if (tableName === payload.baseTable) hasBaseTableColumn = true;
        }
      });
    });
  }

  // 🏆 4. OTIMIZAÇÃO EXTREMA: Se não falta nada, devolve a memória e encerra!
  if (columnsToFetch === 0) {
    console.log("⚡ Todas as colunas já estão nos dados da tabela. Requisição evitada!");
    return currentRowData;
  }

  // 🛠️ 5. BLINDAGEM DO BACKEND: O SQLAlchemy falha se a "baseTable" não estiver no SELECT.
  // Se o frontend só precisou de colunas do JOIN, forçamos a 1ª coluna da baseTable só para não dar erro 500.
  if (!hasBaseTableColumn && all_colunas[payload.baseTable] && all_colunas[payload.baseTable].length > 0) {
    const primeiraColunaBase = all_colunas[payload.baseTable][0];
    const baseColKey = `${payload.baseTable}.${primeiraColunaBase.nome}`;
    
    requestPayload.aliaisTables[baseColKey] = baseColKey;
    expectedKeysMap[primeiraColunaBase.nome] = baseColKey;
  }

  // 6. Tratamento de Cache
  const cacheKey = `fetchRowDataIndex_${index}_${JSON.stringify(requestPayload)}`;
  if (queryCache.has(cacheKey)) {
    console.log(`📦 Retornando dados do Cache: ${cacheKey}`);
    const cachedPromise = queryCache.get(cacheKey)!;
    setCacheItem(cacheKey, cachedPromise);
    return cachedPromise;
  }

  // 7. Execução da Requisição
  const requestPromise = (async () => {
    try {
      const response = await api.post<LinhaCompletaResponse>(
        `/consu/query_line/${encodeURIComponent(index)}`,
        requestPayload, 
        { withCredentials: true }
      );

      const partialResult = response.data?.data ?? null;

      if (partialResult === null) {
        queryCache.delete(cacheKey);
        return null;
      }

      // 🚨 8. A TRADUÇÃO DAS CHAVES ACONTECE AQUI
      const mappedPartialResult: Record<string, any> = {};
      
      Object.entries(partialResult).forEach(([key, value]) => {
        // Se o backend enviou "name", o tradutor acha "public.db_fields.name". 
        // Se já vier "public.db_fields.name", ele usa a própria key.
        const finalKey = expectedKeysMap[key] || key;
        mappedPartialResult[finalKey] = value;
      });

      // 🧩 9. MERGE FINAL: Junta os dados da tela com os dados novos (ambos agora possuem chaves longas)
      const completeRow = { ...currentRowData, ...mappedPartialResult };
      
      return completeRow;

    } catch (error) {
      console.error(`❌ Erro ao buscar linha completa (index: ${index}):`, error);
      queryCache.delete(cacheKey);
      return null;
    }
  })();

  setCacheItem(cacheKey, requestPromise);
  return requestPromise;
};