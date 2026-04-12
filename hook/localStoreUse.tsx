"use client";
// hooks/usePersistedState.ts
import { useState, useEffect, useRef, useCallback } from "react";

// Cache para instâncias do banco
const dbCache = new Map<string, IDBDatabase>();

// Utilitário IndexedDB melhorado
async function openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  const cacheKey = `${dbName}_${storeName}`;

  if (dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey)!;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      dbCache.set(cacheKey, db);
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

// ✅ Salvar em IndexedDB (tratando null e undefined)
// ===============================
// ===============================
// ✅ Salvar em IndexedDB (tratando Set, Map, Date, null e undefined)
// ===============================
async function saveBinary<T>(
  dbName: string,
  storeName: string,
  key: string,
  data: T
): Promise<void> {
  try {
    const db = await openDB(dbName, storeName);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    // 🔹 Serializar com suporte a tipos especiais
    const json = JSON.stringify(data, replacer);

    // 🔹 Converter para binário antes de salvar
    const binary = new TextEncoder().encode(json);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value: binary, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Erro ao salvar ${key} no IndexedDB:`, error);
    throw error;
  }
}

// ===============================
// 🔁 Replacer customizado para JSON.stringify
// ===============================
function replacer(_key: string, value: any) {
  if (value instanceof Set) {
    return { __type: "Set", values: Array.from(value) };
  }
  if (value instanceof Map) {
    return { __type: "Map", entries: Array.from(value.entries()) };
  }
  if (value instanceof Date) {
    return { __type: "Date", value: value.toISOString() };
  }
  if (value === null) {
    return { __type: "null" };
  }
  if (value === undefined) {
    return { __type: "undefined" };
  }
  return value;
}

// ===============================
// ✅ Ler do IndexedDB (reconvertendo null e undefined)
// ===============================
// ===============================
// ✅ Ler do IndexedDB (reconvertendo tipos especiais, null e undefined)
// ===============================
async function loadBinary<T>(
  dbName: string,
  storeName: string,
  key: string,
  fallback: T
): Promise<T> {
  try {
    const db = await openDB(dbName, storeName);
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    return new Promise<T>((resolve) => {
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result?.value) {
          try {
            const json = new TextDecoder().decode(request.result.value);
            const parsed = JSON.parse(json, reviver); // 👈 usar reviver customizado
            resolve(parsed);
          } catch (parseError) {
            console.error(`Erro ao parsear dados de ${key}:`, parseError);
            resolve(fallback);
          }
        } else {
          resolve(fallback);
        }
      };

      request.onerror = () => {
        console.error(`Erro ao carregar ${key} do IndexedDB:`, request.error);
        resolve(fallback);
      };
    });
  } catch (error) {
    console.error(`Erro ao acessar IndexedDB para ${key}:`, error);
    return fallback;
  }
}

// ===============================
// 🔁 Reviver customizado para JSON.parse
// ===============================
function reviver(_key: string, value: any) {
  if (value && typeof value === "object" && "__type" in value) {
    switch (value.__type) {
      case "null":
        return null;
      case "undefined":
        return undefined;
      case "Set":
        return new Set(value.values);
      case "Map":
        return new Map(value.entries);
      case "Date":
        return new Date(value.value);
      default:
        return value;
    }
  }
  return value;
}


// Limpar dados antigos (opcional)
export async function clearOldData(dbName: string, storeName: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await openDB(dbName, storeName);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const cutoffTime = Date.now() - maxAge;

    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (cursor.value.timestamp < cutoffTime) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Erro ao limpar dados antigos:', error);
  }
}

export async function clearDataKey(
  dbName: string,
  storeName: string,
  key: string
): Promise<void> {
  try {
    const db = await openDB(dbName, storeName);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`🗑️ Dado com chave "${key}" removido de ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Erro ao deletar chave "${key}" do IndexedDB:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Erro ao limpar dado específico do IndexedDB:", error);
  }
}


// Hook persistente com IndexedDB
function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // Carregar dados na inicialização
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await loadBinary("AppDB", "AppStore", key, initialValue);

        if (mounted) {
          setState(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Erro ao carregar estado persistente ${key}:`, error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [key]);

  const clearKey = useCallback(() => {
    clearDataKey("AppDB", "AppStore", key)

  }, [])

  // Salvar dados quando o estado muda
  useEffect(() => {
    // Não salvar na montagem inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce para evitar salvamentos muito frequentes
    const timeoutId = setTimeout(() => {
      saveBinary("AppDB", "AppStore", key, state).catch(error => {
        console.error(`Erro ao salvar estado ${key}:`, error);
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [key, state]);

  return [state, setState, clearKey, isLoading, clearOldData] as const;
}

export default usePersistedState;