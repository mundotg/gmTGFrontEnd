import React, { useState } from "react";
import { Segments, fmt } from "./types";
import {
  Users,
  Sparkles,
  PieChart,
  Lightbulb,
  ArrowRight,
  HelpCircle,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Info,
} from "lucide-react";
import { StudyCallout } from "./StudyCallout";

interface ClustersStudioProps {
  segments: Segments | null;
  studyMode: boolean;
  onOpenDictionaryTerm: (termId: string) => void;
}

export function ClustersStudio({
  segments,
  studyMode,
  onOpenDictionaryTerm,
}: ClustersStudioProps) {
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  // Requisito 6: Explicar quando não existem dados suficientes para formar clusters
  if (!segments || segments.has_enough_data === false || !segments.segments || segments.segments.length === 0) {
    const requirements = segments?.requirements ?? [
      {
        label: "Pelo menos 2 variáveis numéricas de negócio (excluindo IDs técnicos)",
        met: (segments?.columns?.length ?? 0) >= 2,
        current: `${segments?.columns?.length ?? 0} variável(eis) encontrada(s)`,
      },
      {
        label: "Mínimo de 15 a 20 registros válidos e preenchidos",
        met: false,
        current: "Volume insuficiente de linhas",
      },
    ];

    return (
      <div className="space-y-6">
        {studyMode && (
          <StudyCallout
            badge="Guia de Machine Learning Não Supervisionado"
            title="Por que o K-Means requer volume e múltiplas variáveis?"
            concept="O agrupamento K-Means divide o espaço geométrico multidimensional para encontrar nuvens de pontos com centros (centroides) distintos. Com apenas 1 variável ou pouquíssimos registros, a distância euclidiana torna-se degenerada ou redundante."
            whyItMatters="Gerar clusters com poucas linhas produziria grupos espúrios e sem valor para o negócio, levando a conclusões falsas sobre perfis de clientes."
            practicalTip="Para desbloquear a segmentação, assegure que sua consulta retorne ao menos 2 métricas de negócio (ex: faturamento, quantidade, ticket médio, score) e mais de 15 linhas."
          />
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/60 shadow-sm">
              <Users size={28} />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                Segmentação Condicionada a Critérios Mínimos
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                Dados Insuficientes para Formação de Clusters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {segments?.details ||
                  "O algoritmo K-Means requer pelo menos 2 métricas numéricas de negócio (identificadores técnicos como IDs e chaves são desconsiderados) e um mínimo de 15 registros válidos para identificar perfis e personas estatisticamente consistentes."}
              </p>
            </div>

            {/* Checklist of Requirements */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 text-left space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info size={15} className="text-indigo-600 dark:text-indigo-400" />
                Diagnóstico de Requisitos do Algoritmo:
              </div>

              <div className="space-y-2">
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      {req.met ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-semibold ${req.met ? "text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                          {req.label}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          Status Atual: {req.current}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        req.met
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {req.met ? "Atendido ✓" : "Pendente ✗"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => onOpenDictionaryTerm("kmeans-clustering")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                <BookOpen size={14} /> Como o K-Means calcula os grupos?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const palette = [
    { bg: "bg-indigo-600", light: "bg-indigo-50 text-indigo-700 border-indigo-200", hex: "#4f46e5" },
    { bg: "bg-emerald-600", light: "bg-emerald-50 text-emerald-700 border-emerald-200", hex: "#059669" },
    { bg: "bg-amber-600", light: "bg-amber-50 text-amber-700 border-amber-200", hex: "#d97706" },
    { bg: "bg-rose-600", light: "bg-rose-50 text-rose-700 border-rose-200", hex: "#e11d48" },
    { bg: "bg-purple-600", light: "bg-purple-50 text-purple-700 border-purple-200", hex: "#7c3aed" },
  ];

  // Identify min and max for each centroid key across clusters for comparative bar charts
  const allKeys = Array.from(
    new Set(segments.segments.flatMap((s) => Object.keys(s.center)))
  );

  const ranges: Record<string, { min: number; max: number }> = {};
  allKeys.forEach((k) => {
    const vals = segments.segments.map((s) => s.center[k] ?? 0);
    ranges[k] = { min: Math.min(...vals), max: Math.max(...vals) };
  });

  return (
    <div className="space-y-6">
      {studyMode && (
        <StudyCallout
          badge="Guia de Machine Learning Não Supervisionado"
          title="O que é K-Means e como os segmentos são descobertos?"
          concept="O K-Means é um dos algoritmos fundamentais de Inteligência Artificial. Ele agrupa registros semelhantes no espaço multidimensional sem que ninguém precise dizer o que cada grupo é. O 'Centroide' representa a média ou o perfil arquetípico daquele grupo."
          whyItMatters="Permite criar personas de clientes (ex: VIPs, compradores frequentes, caçadores de desconto), segmentar produtos por giro e margem, ou identificar padrões de comportamento em sistemas."
          practicalTip="Olhe os valores do Centroide de cada grupo: o grupo que tiver os maiores valores em faturamento e frequência costuma ser o grupo 'VIP' ou 'Premium'."
        />
      )}

      {/* Overview of Clusters */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                Machine Learning · K-Means
              </span>
              <span className="text-xs text-slate-400">
                {segments.k} clusters identificados
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Segmentação Automática da População
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Variáveis multidimensionais analisadas: {segments.columns.join(", ")}
            </p>
          </div>

          <button
            onClick={() => onOpenDictionaryTerm("kmeans-clustering")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <HelpCircle size={14} /> Como funciona o cálculo de centroides?
          </button>
        </div>

        {/* Population Distribution Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Distribuição Populacional por Segmento</span>
            <span>100% da Base Alocada</span>
          </div>

          <div className="w-full h-4 rounded-xl overflow-hidden flex shadow-inner">
            {segments.segments.map((s, i) => {
              const pal = palette[i % palette.length];
              return (
                <div
                  key={s.id}
                  className={`${pal.bg} transition-all hover:opacity-90 relative group cursor-pointer`}
                  style={{ width: `${s.pct}%` }}
                  onClick={() => setSelectedClusterId(s.id)}
                  title={`Grupo ${i + 1}: ${s.size} linhas (${s.pct}%)`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-500">
            {segments.segments.map((s, i) => {
              const pal = palette[i % palette.length];
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedClusterId(s.id)}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <span className={`w-3 h-3 rounded-full ${pal.bg}`} />
                  <span>
                    Grupo {i + 1}: <b>{s.pct}%</b> ({s.size} linhas)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cluster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.segments.map((s, i) => {
            const pal = palette[i % palette.length];
            const isSelected = selectedClusterId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => setSelectedClusterId(s.id)}
                className={`rounded-3xl border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-400/30"
                    : "bg-slate-50/50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:shadow-md"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shadow-sm ${pal.bg}`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Grupo {i + 1}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Perfil do Segmento
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${pal.light}`}
                  >
                    {s.pct}% ({s.size} linhas)
                  </span>
                </div>

                {/* Centroide Features */}
                <div className="space-y-2 mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Características Típicas (Centroide)
                  </div>

                  {Object.entries(s.center).map(([key, val]) => {
                    const range = ranges[key] || { min: 0, max: 1 };
                    const rng = range.max - range.min || 1;
                    const fillPct = Math.max(
                      8,
                      Math.min(100, ((val - range.min) / rng) * 100)
                    );

                    return (
                      <div key={key} className="space-y-0.5 text-xs">
                        <div className="flex justify-between text-[11px]">
                          <span
                            className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px]"
                            title={key}
                          >
                            {key.split(".").pop()}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {fmt(val)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pal.bg} transition-all`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Practical Guidance */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
                  💡 <b>Como estudar:</b> Compare os valores deste grupo com os demais para identificar quem são os clientes/registros deste nicho.
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
