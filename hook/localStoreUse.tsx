import { useState, useEffect } from "react";

function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue; // SSR não tem localStorage
    }

    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (err) {
      console.error(`Erro ao ler localStorage[${key}]`, err);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.error(`Erro ao salvar localStorage[${key}]`, err);
    }
  }, [key, state]);

  return [state, setState] as const;
}

export default usePersistedState;
