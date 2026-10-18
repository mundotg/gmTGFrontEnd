import React from "react";
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Calculator,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { DICTIONARY_TERMS, DictionaryTerm } from "./StudyDictionaryModal";
import { Overview, Quality, ColumnStat } from "./types";

interface StudyLabTabProps {
  overview: Overview | null;
  quality: Quality | null;
  columns: ColumnStat[];
  onOpenDictionaryTerm: (termId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export function StudyLabTab({
  overview,
  quality,
  columns,
  onOpenDictionaryTerm,
  onNavigateTab,
}: StudyLabTabProps) {
  const steps = [
    {
      num: "01",
      title: "Verificar a Integridade dos Dados (Data Cleaning)",
      desc: "Antes de qualquer cálculo, checamos nulos, duplicações e colunas constantes. Se 50% dos dados estiverem faltando, qualquer média calculada será perigosa.",
      targetTab: "overview",
      badge: "Passo 1",
      term: "qualidade-dados-score",
    },
    {
      num: "02",
      title: "Explorar a Distribuição e Centro (Média vs Mediana)",
      desc: "Descubra se seus dados são homogêneos ou se existem bilionários distorcendo a média. O P95 revela como os 5% casos extremos se comportam.",
      targetTab: "columns",
      badge: "Passo 2",
      term: "media-vs-mediana",
    },
    {
      num: "03",
      title: "Identificar Associações e Relações (Correlações)",
      desc: "Cruzamos pares de variáveis para descobrir quais sobem ou descem juntas, lembrando sempre que correlação não significa causalidade direta.",
      targetTab: "correlations",
      badge: "Passo 3",
      term: "correlacao-pearson",
    },
    {
      num: "04",
      title: "Projetar a Tendência no Tempo (Séries Temporais)",
      desc: "Compreenda se o volume está em ascensão, declínio ou estabilidade e observe a previsão estatística para o próximo ciclo.",
      targetTab: "trend",
      badge: "Passo 4",
      term: "percentis-p90-p95",
    },
    {
      num: "05",
      title: "Descobrir Perfis Ocultos (K-Means Clustering)",
      desc: "A inteligência artificial não supervisionada agrupa registros por afinidade, criando personas e clusters automáticos.",
      targetTab: "segments",
      badge: "Passo 5",
      term: "kmeans-clustering",
    },
    {
      num: "06",
      title: "Auditar Casos Fora da Curva (Anomalias)",
      desc: "Isole registros com combinações atípicas que podem sinalizar erros de digitação, fraudes ou oportunidades únicas.",
      targetTab: "anomalies",
      badge: "Passo 6",
      term: "anomalias-multivariadas",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold border border-white/10">
            <GraduationCap size={14} /> Laboratório de Aprendizagem Interativa
          </div>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
            Para que serve a Ciência de Dados na prática?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Muitas vezes recebemos uma planilha ou tabela cheia de números e não sabemos o que fazer com eles. Esta página foi desenhada para transformar estatísticas frias em conhecimento acionável. Siga os 6 passos abaixo para dominar a leitura de qualquer base de dados.
          </p>
        </div>
      </section>

      {/* 6 Steps Roadmap */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass size={18} className="text-indigo-600" />
            O Roteiro Científico do Analista de Dados
          </h3>
          <span className="text-xs text-slate-400">
            Clique em qualquer etapa para ir à tela prática
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((st) => (
            <div
              key={st.num}
              onClick={() => onNavigateTab(st.targetTab)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
                    {st.num}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {st.badge}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {st.title}
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {st.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Ver nesta base</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Concept Quick Library */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              Fichas Rápidas de Conceitos Essenciais
            </h3>
            <p className="text-xs text-slate-500">
              Clique em qualquer card para abrir a explicação completa com exemplos práticos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DICTIONARY_TERMS.slice(0, 6).map((term) => (
            <div
              key={term.id}
              onClick={() => onOpenDictionaryTerm(term.id)}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800 cursor-pointer transition-all hover:border-indigo-300 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {term.category}
                </span>
                <HelpCircle size={13} className="text-slate-300 group-hover:text-indigo-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600">
                {term.term}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {term.whatIs}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
