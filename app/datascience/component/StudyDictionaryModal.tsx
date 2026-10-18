import React, { useState, useMemo } from "react";
import {
  X,
  BookOpen,
  Search,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Calculator,
  CheckCircle2,
} from "lucide-react";

export interface DictionaryTerm {
  id: string;
  category: "Geral" | "Estatística" | "Qualidade" | "Relações" | "Machine Learning";
  term: string;
  subtitle: string;
  whatIs: string;
  whyUseful: string;
  practicalExample: string;
  formulaOrIntuition: string;
  actionTip: string;
}

export const DICTIONARY_TERMS: DictionaryTerm[] = [
  {
    id: "media-vs-mediana",
    category: "Estatística",
    term: "Média vs. Mediana",
    subtitle: "Medidas de tendência central",
    whatIs:
      "A Média é a soma de todos os valores dividida pela quantidade de itens. A Mediana é o valor central exato que divide a base em duas metades (50% acima, 50% abaixo).",
    whyUseful:
      "A Média é muito sensível a valores extremos (outliers). Se uma pessoa rica entrar em uma sala com 9 pessoas desempregadas, a 'média' salarial sobe para um valor alto que não reflete a realidade de ninguém. A Mediana, por outro lado, permanece realista e imune a distorções.",
    practicalExample:
      "Em salários: se 9 pessoas ganham R$ 1.500 e 1 diretor ganha R$ 100.000, a média é R$ 11.350 (ilusória), mas a mediana é R$ 1.500 (verdadeira).",
    formulaOrIntuition:
      "Se Média ≈ Mediana: distribuição simétrica. Se Média >> Mediana: existem valores gigantes puxando a média para cima.",
    actionTip:
      "Para preços, salários ou tempos de resposta, sempre olhe a Mediana antes da Média.",
  },
  {
    id: "desvio-padrao-cv",
    category: "Estatística",
    term: "Desvio Padrão e CV (Coeficiente de Variação)",
    subtitle: "Mede dispersão e volatilidade dos dados",
    whatIs:
      "O Desvio Padrão (std) mede o quanto os valores se afastam da média em média. O CV é o Desvio Padrão dividido pela Média, expresso em porcentagem.",
    whyUseful:
      "Permite saber se seus dados são homogêneos (previsíveis) ou caóticos (dispersos). Um CV baixo (< 15%) indica grande estabilidade; um CV alto (> 50%) indica muita variação entre os registros.",
    practicalExample:
      "Dois restaurantes têm média de faturamento de R$ 5.000/dia. O Restaurante A varia sempre entre R$ 4.800 e R$ 5.200 (CV baixo, seguro). O Restaurante B faz R$ 200 na segunda e R$ 15.000 no sábado (CV altíssimo, arriscado).",
    formulaOrIntuition:
      "CV = (Desvio Padrão / Média) × 100%. Se CV > 100%, o desvio é maior que a própria média!",
    actionTip:
      "Em finanças e estoques, use o CV para mensurar risco e incerteza.",
  },
  {
    id: "percentis-p90-p95",
    category: "Estatística",
    term: "Percentis (P25, P75, P90, P95, P99)",
    subtitle: "Cortes percentuais de ordenação",
    whatIs:
      "O percentil P95 indica que 95% dos registros da tabela possuem valor menor ou igual àquele número, e apenas 5% o superam.",
    whyUseful:
      "Essencial para contratos de nível de serviço (SLA), análise de clientes VIP e tolerância a lentidão. A média esconde os 5% piores casos; o P95 escancara a experiência da cauda.",
    practicalExample:
      "Tempo de carregamento de uma página web: média de 1.2s, mas P95 de 8.5s. Significa que 1 em cada 20 clientes está esperando quase 10 segundos!",
    formulaOrIntuition:
      "Ordene todos os valores do menor para o maior e selecione o elemento na posição 95% da fila.",
    actionTip:
      "Para avaliar a experiência do usuário ou grandes faturamentos, use P95 e P99 para enxergar casos críticos.",
  },
  {
    id: "outliers-iqr",
    category: "Qualidade",
    term: "Outliers & Regra IQR (Intervalo Interquartil)",
    subtitle: "Detecção de valores aberrantes ou extremos",
    whatIs:
      "Outliers são pontos discrepantes da regra geral. A regra IQR calcula o meio dos dados (Q75 - Q25) e define limites de segurança: [Q25 - 1.5×IQR, Q75 + 1.5×IQR].",
    whyUseful:
      "Identifica erros de digitação (ex: produto com preço R$ 0,01 ou R$ 9.999.999), potenciais fraudes com cartão de crédito, ou clientes atípicos supervaliosos que merecem atendimento dedicado.",
    practicalExample:
      "Em um cadastro de clientes, uma idade digitada como '250' anos ou peso de '1 kg' para um adulto.",
    formulaOrIntuition:
      "IQR = Q3 (75%) - Q1 (25%). Qualquer valor fora de [Q1 - 1.5×IQR, Q3 + 1.5×IQR] é classificado como outlier.",
    actionTip:
      "Antes de treinar modelos de machine learning, investigue os outliers para decidir se devem ser filtrados, corrigidos ou estudados à parte.",
  },
  {
    id: "skewness-assimetria",
    category: "Estatística",
    term: "Assimetria (Skewness)",
    subtitle: "Formato da cauda da distribuição",
    whatIs:
      "Mede se a curva dos dados está inclinada para a esquerda (negativa) ou para a direita (positiva) em relação ao centro.",
    whyUseful:
      "Indica como os dados se comportam naturalmente. Na maioria dos negócios (vendas, salários, número de acessos), a assimetria é positiva: muita gente gasta pouco, e poucos gastam fortunas.",
    practicalExample:
      "Se Skewness > +1: cauda longa à direita (poucos valores gigantes). Se Skewness entre -0.5 e +0.5: curva em sino perfeitamente equilibrada (Normal).",
    formulaOrIntuition:
      "Skew > 0: Moda < Mediana < Média. Skew < 0: Média < Mediana < Moda.",
    actionTip:
      "Se uma coluna tiver assimetria muito alta, considere aplicar transformação logarítmica (log(x)) para estabilizar modelos.",
  },
  {
    id: "correlacao-pearson",
    category: "Relações",
    term: "Correlação de Pearson (Matriz r)",
    subtitle: "Intensidade da relação linear entre duas variáveis",
    whatIs:
      "Um número que varia de -1.0 a +1.0. +1 significa que quando X sobe, Y sobe na mesma proporção. -1 significa que quando X sobe, Y desce. 0 significa ausência de relação linear.",
    whyUseful:
      "Descobre alavancas de negócio (ex: 'Investimento em marketing correlaciona fortemente com novos leads?').",
    practicalExample:
      "Correlação entre altura e peso: ~+0.75 (positiva forte). Correlação entre preço do produto e quantidade vendida: ~-0.60 (negativa moderada).",
    formulaOrIntuition:
      "r varia de -1 (inverso perfeito) passando por 0 (sem ligação) até +1 (direto perfeito).",
    actionTip:
      "REGRA DE OURO DO CIENTISTA: 'Correlação NÃO implica causalidade!'. Duas coisas podem subir juntas por pura coincidência ou por causa de uma terceira variável oculta.",
  },
  {
    id: "kmeans-clustering",
    category: "Machine Learning",
    term: "Segmentos K-Means (Agrupamento Não Supervisionado)",
    subtitle: "Como a IA descobre perfis automaticamente",
    whatIs:
      "O algoritmo K-Means calcula a proximidade matemática entre as linhas e reúne registros com características semelhantes em K grupos (clusters), sem intervenção humana.",
    whyUseful:
      "Permite dividir sua base em personas ou perfis operacionais. Em vez de tratar todos os clientes igualmente, você descobre grupos de 'VIPs', 'Ocasionais', 'Novos' ou 'Em Risco'.",
    practicalExample:
      "Em um aplicativo de mobilidade: Grupo 1 = passageiros de horário de pico em trajetos curtos; Grupo 2 = viajantes de fins de semana em viagens longas.",
    formulaOrIntuition:
      "Cada grupo tem um 'Centroide' (o perfil médio representativo daquele grupo).",
    actionTip:
      "Observe os valores do 'centroide' de cada grupo para dar um nome de negócio a ele e criar estratégias personalizadas.",
  },
  {
    id: "anomalias-multivariadas",
    category: "Machine Learning",
    term: "Detecção de Anomalias Multivariadas",
    subtitle: "Identificação de combinações estranhas de dados",
    whatIs:
      "Enquanto um outlier olha uma única coluna, a anomalia multivariada olha o conjunto. Uma linha pode ter valores normais individualmente, mas a combinação é absurda.",
    whyUseful:
      "Base de algoritmos antifraude e controle de qualidade industrial.",
    practicalExample:
      "Um cliente com idade de 8 anos é normal em um cadastro familiar; um saldo de investimento de R$ 500.000 também é normal. Mas uma linha com 'idade = 8 anos' E 'saldo = R$ 500.000' E 'renda = R$ 0' é uma anomalia gritante!",
    formulaOrIntuition:
      "Mede a distância daquele registro em relação à nuvem densa de pontos dos registros normais.",
    actionTip:
      "Comece a auditoria pelas linhas com maior 'Score de Anomalia' exibidas na tabela.",
  },
  {
    id: "qualidade-dados-score",
    category: "Qualidade",
    term: "Score de Saúde dos Dados & Governança (0 a 100)",
    subtitle: "Fórmula ponderada em 4 dimensões (DAMA-DMBOK)",
    whatIs:
      "Uma avaliação quantitativa rigorosa baseada em 4 pilares: Completude (40%), Unicidade (25%), Variabilidade (20%) e Identificabilidade (15%).",
    whyUseful:
      "Evita que você tome decisões ou treine modelos preditivos com dados corrompidos ou enviesados ('Garbage In, Garbage Out').",
    practicalExample:
      "Score 95: dados com preenchimento quase total, sem duplicações e com chaves íntegras. Score 45: base com muitos nulos em campos críticos e registros duplicados.",
    formulaOrIntuition:
      "Score = 0.40 × Completude (com peso para campos críticos) + 0.25 × Unicidade (ausência de duplicadas) + 0.20 × Variabilidade (ausência de colunas constantes) + 0.15 × Identificabilidade (presença de chave primária).",
    actionTip:
      "Examine o quadro de dimensões na Visão Geral para saber exatamente qual pilar está perdendo pontos.",
  },
  {
    id: "identificadores-vs-metricas",
    category: "Geral",
    term: "Identificadores Técnicos vs. Métricas de Negócio",
    subtitle: "Por que IDs não devem ser tratados como números comuns",
    whatIs:
      "Identificadores (IDs, UUIDs, chaves primárias ou códigos sequenciais) são rótulos de indexação de banco de dados, e não quantidades de negócio mensuráveis.",
    whyUseful:
      "Calcular a 'média de IDs', somar códigos de clientes ou medir a 'correlação entre ID e Vendas' gera falsas conclusões estatísticas (correlação espúria) e deforma clusters K-Means.",
    practicalExample:
      "Um cliente com ID 999999 não comprou 'mais' nem tem 'mais valor' que o cliente com ID 1; o número 999999 é apenas uma chave de banco gerada pelo auto-increment.",
    formulaOrIntuition:
      "O MustaInfo detecta automaticamente colunas com padrão de ID e as exclui de correlações, clusters K-Means e detecção de anomalias de negócio.",
    actionTip:
      "Nunca use colunas de ID em eixos numéricos de gráficos de dispersão ou em algoritmos de Machine Learning sem anonimização ou hashing categórico.",
  },
  {
    id: "intervalo-confianca-series",
    category: "Estatística",
    term: "Intervalo de Confiança em Séries Temporais (IC 95%)",
    subtitle: "Margem de incerteza estatística da previsão futura",
    whatIs:
      "O Intervalo de Confiança de 95% define a faixa numérica [Limite Inferior, Limite Superior] dentro da qual o valor real tem 95% de probabilidade matemática de se situar no próximo ciclo.",
    whyUseful:
      "Nenhuma previsão matemática é 100% determinística. Apresentar uma previsão pontual sem intervalo transmite uma falsa sensação de certeza.",
    practicalExample:
      "Previsão de 1.500 vendas: se o IC 95% for [1.450 a 1.550], a previsão é altamente precisa (margem estreita). Se o IC 95% for [200 a 2.800], a incerteza é gigantesca e requer prudência.",
    formulaOrIntuition:
      "Previsão ± (t-Student crítico × Erro Padrão da Regressão). Quanto mais dados históricos consistentes, menor a margem de erro.",
    actionTip:
      "Use o limite inferior do IC 95% para planejamento conservador de caixa, e o limite superior para dimensionamento de estoques de pico.",
  },
  {
    id: "cardinalidade-entropia",
    category: "Qualidade",
    term: "Cardinalidade e Entropia",
    subtitle: "Diversidade e equilíbrio de categorias",
    whatIs:
      "Cardinalidade é o número de valores distintos em uma coluna de texto. Entropia mede se os valores estão distribuídos de forma equilibrada (entropia alta) ou concentrados em uma única categoria (baixa).",
    whyUseful:
      "Ajuda a escolher como tratar colunas de texto em consultas e machine learning. Alta cardinalidade (ex: nomes de pessoas) não deve ser usada diretamente como categoria simples.",
    practicalExample:
      "Coluna 'País': se 99% das linhas forem 'Portugal', a coluna tem desequilíbrio altíssimo (pouco poder preditivo). Se tiver 20 países bem distribuídos, tem alta entropia (ótima para filtros).",
    formulaOrIntuition:
      "Entropia 1.0 = distribuição perfeitamente uniforme. Entropia próxima de 0 = quase todos os dados pertencem a um só valor.",
    actionTip:
      "Colunas com cardinalidade igual ao número de linhas costumam ser chaves primárias (IDs).",
  },
];

interface StudyDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string;
}

export function StudyDictionaryModal({
  isOpen,
  onClose,
  initialTermId,
}: StudyDictionaryModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [selectedTermId, setSelectedTermId] = useState<string>(
    initialTermId || DICTIONARY_TERMS[0].id
  );

  const categories = ["Todas", "Estatística", "Qualidade", "Relações", "Machine Learning"];

  const filteredTerms = useMemo(() => {
    return DICTIONARY_TERMS.filter((item) => {
      const matchCat =
        selectedCategory === "Todas" || item.category === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.whatIs.toLowerCase().includes(q) ||
        item.practicalExample.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, search]);

  const activeTerm = useMemo(() => {
    return (
      DICTIONARY_TERMS.find((t) => t.id === selectedTermId) ||
      filteredTerms[0] ||
      DICTIONARY_TERMS[0]
    );
  }, [selectedTermId, filteredTerms]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Laboratório & Aprendizagem
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  Guia Didático
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Dicionário Interativo de Ciência de Dados
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Sidebar + Detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Terms List (Left Sidebar) */}
          <div className="md:col-span-5 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar conceito (ex: P95, Outliers, Skew...)"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left">
              {filteredTerms.map((t) => {
                const isSelected = t.id === activeTerm?.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTermId(t.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-500 shadow-md ring-1 ring-indigo-400/30"
                        : "bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {t.category}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {t.term}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {t.subtitle}
                    </div>
                  </div>
                );
              })}

              {filteredTerms.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum termo encontrado para &quot;{search}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* Term Detail (Right Panel) */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
            {activeTerm && (
              <>
                {/* Header of Term */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      {activeTerm.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      Conceito Fundamental
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {activeTerm.term}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {activeTerm.subtitle}
                  </p>
                </div>

                {/* Card: O que é? */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                    <Sparkles size={16} className="text-indigo-600" />
                    O que é esta métrica?
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {activeTerm.whatIs}
                  </p>
                </div>

                {/* Card: Por que é útil no seu estudo? */}
                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5">
                    <GraduationCap size={16} className="text-indigo-600" />
                    Para que serve no mundo real e no seu estudo?
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {activeTerm.whyUseful}
                  </p>
                </div>

                {/* Card: Exemplo Prático */}
                <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                    <Lightbulb size={16} className="text-amber-600" />
                    Exemplo Prático Descomplicado
                  </div>
                  <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-200/90">
                    {activeTerm.practicalExample}
                  </p>
                </div>

                {/* Card: Como calcular ou pensar sobre isso */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                      <Calculator size={14} className="text-slate-500" />
                      Intuição & Fórmula
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {activeTerm.formulaOrIntuition}
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Como agir com este dado
                    </div>
                    <div className="text-emerald-950 dark:text-emerald-200/90 text-[11px] leading-relaxed">
                      {activeTerm.actionTip}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/60">
          <span>
            MustaInf Data Science Hub · Navegue pelos conceitos para dominar a análise dos seus dados.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
