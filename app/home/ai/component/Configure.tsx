import { useState, useEffect } from "react";
import { SimilarityMetric } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  useRag: boolean;
  llm: string;
  similarityMetric: SimilarityMetric;
  trainingMode: boolean;
  normalMode: boolean;
  criticalMode: boolean;
  setConfiguration: (
    useRag: boolean,
    llm: string,
    similarityMetric: SimilarityMetric,
    trainingMode: boolean,
    normalMode: boolean,
    criticalMode: boolean
  ) => void;
}

export default function Configure({
  isOpen,
  onClose,
  useRag,
  llm,
  similarityMetric,
  trainingMode,
  normalMode,
  criticalMode,
  setConfiguration
}: Props) {
  // 1. Unificamos o estado para ser mais limpo e fácil de gerir
  const [formData, setFormData] = useState({
    rag: useRag,
    llm: llm,
    metric: similarityMetric,
    training: trainingMode,
    normal: normalMode,
    critical: criticalMode
  });

  // 2. Garante que se o utilizador fechar sem guardar, o estado volta ao original ao reabrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        rag: useRag,
        llm: llm,
        metric: similarityMetric,
        training: trainingMode,
        normal: normalMode,
        critical: criticalMode
      });
    }
  }, [isOpen, useRag, llm, similarityMetric, trainingMode, normalMode, criticalMode]);

  if (!isOpen) return null;

  const handleSave = () => {
    // 3. Corrigido o bug: agora envia os dados do estado atualizado e não as props antigas
    setConfiguration(
      formData.rag,
      formData.llm,
      formData.metric,
      formData.training,
      formData.normal,
      formData.critical
    );
    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    // Fundo escuro com desfoque (blur) moderno
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">

      {/* Container do Modal */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl flex flex-col p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Configurações do Modelo
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Corpo (Formulário) */}
        <div className="flex-grow space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Native Select para LLM */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LLM Engine</label>
              <select
                value={formData.llm}
                onChange={(e) => handleChange("llm", e.target.value)}
                className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-colors"
              >
                {/* Aqui podes depois adicionar os modelos do Gemini que vimos há pouco! */}
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gpt-4">GPT 4</option>
                <option value="gpt-3.5-turbo">GPT 3.5 Turbo</option>
              </select>
            </div>

            {/* Native Select para Similaridade */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Métrica de Similaridade</label>
              <select
                value={formData.metric}
                onChange={(e) => handleChange("metric", e.target.value as SimilarityMetric)}
                className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-colors"
              >
                <option value="cosine">Cosine Similarity</option>
                <option value="euclidean">Euclidean Distance</option>
                <option value="dot_product">Dot Product</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-zinc-800" />

          {/* Toggles Nativos em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <ToggleItem
              label="Enable vector content (RAG)"
              checked={formData.rag}
              onChange={() => handleChange("rag", !formData.rag)}
            />
            <ToggleItem
              label="Training Mode"
              checked={formData.training}
              onChange={() => handleChange("training", !formData.training)}
            />
            <ToggleItem
              label="Normal Mode"
              checked={formData.normal}
              onChange={() => handleChange("normal", !formData.normal)}
            />
            <ToggleItem
              label="Critical Mode"
              checked={formData.critical}
              onChange={() => handleChange("critical", !formData.critical)}
            />

          </div>
        </div>

        {/* Rodapé (Botões) */}
        <div className="mt-10 flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-6">
          <button
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            onClick={handleSave}
          >
            Guardar Alterações
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * Sub-componente leve apenas para renderizar um Toggle switch usando Tailwind
 * sem precisar de ficheiros ou bibliotecas externas.
 */
function ToggleItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer w-full p-3 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[14px] after:left-[14px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}