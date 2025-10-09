// hooks/usePersistedState.ts
import { useState, useEffect, useRef } from "react";

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

// Salvar em IndexedDB com tratamento de erro melhorado
async function saveBinary<T>(dbName: string, storeName: string, key: string, data: T): Promise<void> {
  try {
    const db = await openDB(dbName, storeName);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    // Serializa para JSON e converte para binário
    const json = JSON.stringify(data);
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

// Ler de IndexedDB com fallback
async function loadBinary<T>(dbName: string, storeName: string, key: string, fallback: T): Promise<T> {
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
            const data = JSON.parse(json);
            resolve(data);
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

// Limpar dados antigos (opcional)
async function clearOldData(dbName: string, storeName: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
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

  return [state, setState, isLoading] as const;
}

export default usePersistedState;