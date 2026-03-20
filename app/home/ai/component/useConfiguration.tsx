"use client"

import { useState, useEffect } from 'react';

export type SimilarityMetric = "cosine" | "euclidean" | "dot_product";

const useConfiguration = () => {
  // Safely get values from localStorage
  const getLocalStorageValue = (key: string, defaultValue: any) => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return storedValue;
      }
    }
    return defaultValue;
  };

  const [useRag, setUseRag] = useState<boolean>(() => getLocalStorageValue('useRag', 'true') === 'true');
  const [llm, setLlm] = useState<string>(() => getLocalStorageValue('llm', 'gpt-4o-mini'));
  const [similarityMetric, setSimilarityMetric] = useState<SimilarityMetric>(
    () => getLocalStorageValue('similarityMetric', 'cosine') as SimilarityMetric
  );
  const [trainingMode, setTrainingMode] = useState(() => getLocalStorageValue('trainingMode', false));
  const [normalMode, setNormalMode] = useState(() => getLocalStorageValue('normalMode', false));
  const [criticalMode, setCriticalMode] = useState(() => getLocalStorageValue('criticalMode', false));

  const setConfiguration = (rag: boolean, llm: string, similarityMetric: SimilarityMetric,trainingMode_:boolean,normalMode_:boolean,criticalMode_:boolean) => {
    setUseRag(rag);
    setLlm(llm);
    setSimilarityMetric(similarityMetric);
    setTrainingMode(trainingMode_);
    setNormalMode(normalMode_);
    setCriticalMode(criticalMode_);
  }

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useRag', JSON.stringify(useRag));
      localStorage.setItem('llm', llm);
      localStorage.setItem('similarityMetric', similarityMetric);
      localStorage.setItem('trainingMode',trainingMode)
      localStorage.setItem('normalMode',normalMode)
      localStorage.setItem('criticalMode',criticalMode)
    }
  }, [useRag, llm, similarityMetric,criticalMode,normalMode,trainingMode]);

  return {
    useRag,
    llm,
    similarityMetric,
    setConfiguration,
    criticalMode,
    normalMode,
    trainingMode,
  };
}

export default useConfiguration;
