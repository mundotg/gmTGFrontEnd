import React, { useState } from "react";
import {
  X,
  Hash,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  Sparkles,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ColumnStat, fmt } from "./types";

interface ColumnInspectorModalProps {
  col: ColumnStat | null;
  onClose: () => void;
  onOpenDictionaryTerm?: (termId: string) => void;
}

function ExtremeRowCard({
  title,
  badge,
  badgeClass,
  valueText,
  rowIndex,
  rowData,
  highlightCol,
  icon: IconComponent,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  valueText: string;
  rowIndex: number | string | null | undefined;
  rowData: Record<string, unknown> | null | undefined;
  highlightCol: string;
  icon: React.ElementType;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const entries = rowData ? Object.entries(rowData) : [];
  const displayEntries = expanded ? entries : entries.slice(0, 4);

  const handleCopy = () => {
    if (!rowData) return;
    navigator.clipboard?.writeText(JSON.stringify(rowData, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center ${badgeClass}`}>
              <IconComponent size={14} />
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Linha #{rowIndex ?? "—"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {badge}
            </span>
          </div>
        </div>

        <div className="text-xl font-black text-slate-900 dark:text-white mt-1 mb-3">
          {valueText}
        </div>

        {/* Row fields preview */}
        {entries.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
              <span>Campos da Linha Correspondente:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span>{copied ? "Copiado!" : "Copiar Linha"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {displayEntries.map(([k, v]) => {
                const isTarget = k === highlightCol;
                return (
                  <div
                    key={k}
                    className={`p-2 rounded-xl text-[11px] border ${
                      isTarget
                        ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 font-bold"
                        : "bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800"
                    }`}
                  >
                    <span className="text-slate-400 font-medium block truncate text-[9px] uppercase" title={k}>
                      {k}
                    </span>
                    <span
                      className={`truncate block mt-0.5 ${
                        isTarget ? "text-indigo-700 dark:text-indigo-300 font-extrabold" : "text-slate-700 dark:text-slate-200"
                      }`}
                      title={String(v ?? "")}
                    >
                      {String(v ?? "—")}
                    </span>
                  </div>
                );
              })}
            </div>

            {entries.length > 4 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 py-1 flex items-center justify-center gap-1 cursor-pointer mt-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={12} /> Recolher campos
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> Ver todos os {entries.length} campos desta linha
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            Registro localizado na linha #{rowIndex ?? "—"} da tabela.
          </div>
        )}
      </div>
    </div>
  );
}

export function ColumnInspectorModal({
  col,
  onClose,
  onOpenDictionaryTerm,
}: ColumnInspectorModalProps) {
  if (!col) return null;

  const kindMeta = {
    numeric: { icon: Hash, label: "Coluna Numérica", color: "text-blue-600 bg-blue-50 border-blue-200" },
    categorical: { icon: TypeIcon, label: "Coluna Categórica / Texto", color: "text-purple-600 bg-purple-50 border-purple-200" },
    datetime: { icon: Calendar, label: "Coluna Temporal (Data/Hora)", color: "text-amber-600 bg-amber-50 border-amber-200" },
    boolean: { icon: ToggleLeft, label: "Coluna Booleana (Sim/Não)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  }[col.kind];

  const Icon = kindMeta.icon;

  // Geração de interpretação em linguagem natural didática para estudo
  const generateNarrative = () => {
    const idCriticalNotes: string[] = [];
    if (col.is_primary_key) {
      idCriticalNotes.push(
        "🔑 Chave Primária (PK): Esta coluna é a chave primária da tabela no banco de dados. Ela garante unicidade absoluta para cada registro e é desconsiderada em correlações numéricas e clusters K-Means para evitar distorções espúrias decorrentes de identificadores técnicos."
      );
    } else if (col.is_foreign_key) {
      idCriticalNotes.push(
        `🔗 Chave Estrangeira (FK): Esta coluna estabelece integridade referencial com a tabela '${col.referenced_table || "relacionada"}'. Por representar um apontador técnico entre entidades, é tratada como identificador relacional.`
      );
    } else if (col.is_identifier) {
      idCriticalNotes.push(
        "🔑 Identificador Técnico: Esta coluna é tratada como chave ou código identificador. Em conformidade com boas práticas de Ciência de Dados, ela é desconsiderada de cálculos de correlação, clusters K-Means e anomalias numéricas para evitar que números arbitrários de IDs gerem distorções de negócio."
      );
    }

    if (col.is_nullable === false) {
      idCriticalNotes.push(
        "🛡️ Restrição NOT NULL: O esquema da base de dados define este campo como estritamente obrigatório (não aceita nulos)."
      );
    }

    if (col.comentario) {
      idCriticalNotes.push(`📝 Comentário no Dicionário da Base: "${col.comentario}"`);
    }

    if (col.is_critical && !col.is_identifier && !col.is_primary_key && !col.is_foreign_key) {
      idCriticalNotes.push(
        `⭐ Campo Crítico de Governança: Esta coluna é considerada vital para integridade do banco. Sua completude atual é de ${col.completeness_pct ?? (100 - col.null_pct)}% (${col.nulls} valores ausentes).`
      );
    }

    if (col.kind === "numeric" && col.numeric) {
      const num = col.numeric;
      const notes: string[] = [...idCriticalNotes];

      // 1. Tendência Central
      const diffMeanMed = Math.abs(num.mean - num.median);
      const ratio = num.median ? diffMeanMed / Math.abs(num.median) : 0;
      if (ratio > 0.15) {
        if (num.mean > num.median) {
          notes.push(
            `A média (${fmt(num.mean)}) é consideravelmente maior que a mediana (${fmt(num.median)}). Isso acontece quando há valores extremamente altos (puxando a média para cima). Para estudos ou relatórios executivos desta coluna, a Mediana reflete melhor a realidade da maioria.`
          );
        } else {
          notes.push(
            `A média (${fmt(num.mean)}) é menor que a mediana (${fmt(num.median)}), indicando presença de valores muito baixos ou negativos puxando a distribuição.`
          );
        }
      } else {
        notes.push(
          `A média (${fmt(num.mean)}) e a mediana (${fmt(num.median)}) são muito próximas, o que indica uma distribuição equilibrada e simétrica em torno do centro.`
        );
      }

      // 2. Dispersão (CV)
      if (num.cv != null) {
        const cvPct = Math.round(num.cv * 100);
        if (cvPct < 15) {
          notes.push(
            `O Coeficiente de Variação é baixo (${cvPct}%), significando que os dados desta coluna são muito homogêneos e estáveis.`
          );
        } else if (cvPct > 60) {
          notes.push(
            `O Coeficiente de Variação é elevado (${cvPct}%), mostrando alta volatilidade e grande disparidade entre os menores e maiores valores registrados.`
          );
        }
      }

      // 3. Outliers
      if (num.outliers && num.outliers.count > 0) {
        notes.push(
          `Foram detectados ${num.outliers.count} outliers (${num.outliers.pct}% das linhas). Pela regra do IQR, valores fora do intervalo [${fmt(num.outliers.lower)} até ${fmt(num.outliers.upper)}] são incomuns e merecem investigação.`
        );
      }

      // 4. Assimetria
      if (num.skew != null) {
        if (num.skew > 1.0) {
          notes.push(
            `Assimetria positiva acentuada (${num.skew.toFixed(2)}): a maioria dos registros está concentrada nos valores mais baixos, com uma 'cauda' longa esticando-se para a direita.`
          );
        } else if (num.skew < -1.0) {
          notes.push(
            `Assimetria negativa (${num.skew.toFixed(2)}): concentração de valores altos com cauda esticando-se para a esquerda.`
          );
        }
      }

      return notes;
    }

    if (col.kind === "categorical" && col.categorical) {
      const cat = col.categorical;
      const notes: string[] = [];

      if (cat.top && cat.top.length > 0) {
        const top1 = cat.top[0];
        notes.push(
          `A categoria mais frequente (moda) é "${top1.value}", presente em ${top1.count} linhas (${top1.pct}% do total).`
        );
        if (cat.imbalance_pct && cat.imbalance_pct >= 70) {
          notes.push(
            `Atenção ao desequilíbrio: a categoria líder domina ${cat.imbalance_pct}% de todas as ocorrências. Em modelos preditivos, isso pode causar viés excessivo.`
          );
        }
      }

      if (cat.is_text) {
        notes.push(
          `Alta cardinalidade (${col.distinct} valores únicos). Esta coluna se comporta como identificador livre ou texto longo descritivo, não como uma categoria finita.`
        );
      }

      if (cat.semantic) {
        notes.push(
          `Padrão semântico detectado pela IA: tipo "${cat.semantic}". Pode conter informações sensíveis ou chaves estruturadas.`
        );
      }

      return notes;
    }

    if (col.kind === "datetime" && col.datetime) {
      return [
        `Período temporal coberto: de ${new Date(col.datetime.min).toLocaleString()} até ${new Date(col.datetime.max).toLocaleString()}.`,
        `Ideal para agregação cronológica (diária, semanal, mensal) e cálculo de tendências.`,
      ];
    }

    if (col.kind === "boolean" && col.boolean) {
      const total = (col.boolean.true || 0) + (col.boolean.false || 0) || 1;
      const truePct = Math.round(((col.boolean.true || 0) / total) * 100);
      return [
        `Distribuição binária: ${col.boolean.true} registros 'Sim' (${truePct}%) vs. ${col.boolean.false} registros 'Não' (${100 - truePct}%).`,
      ];
    }

    return ["Coluna com distribuição regular."];
  };

  const narrative = generateNarrative();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${kindMeta.color}`}>
              <Icon size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {kindMeta.label}
                </span>
                {col.tipo_db && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    BD: {col.tipo_db.toUpperCase()}
                  </span>
                )}
                {col.is_primary_key && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    🔑 Chave Primária (PK)
                  </span>
                )}
                {col.is_foreign_key && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                    🔗 Chave Estrangeira (FK{col.referenced_table ? ` → ${col.referenced_table}` : ""})
                  </span>
                )}
                {col.is_identifier && !col.is_primary_key && !col.is_foreign_key && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    🔑 Identificador Técnico
                  </span>
                )}
                {col.is_critical && !col.is_identifier && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    ⭐ Campo Crítico
                  </span>
                )}
                {col.is_nullable === false && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    NOT NULL
                  </span>
                )}
                <span className="text-xs text-slate-400">· Raio-X Detalhado</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {col.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Health Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Preenchidos</span>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {fmt(col.count)}
              </div>
              <div className="text-[11px] text-slate-500">
                {((col.count / (col.count + col.nulls || 1)) * 100).toFixed(1)}% preenchimento
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Nulos / Vazios</span>
              <div className={`text-lg font-bold mt-0.5 ${col.null_pct > 30 ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>
                {col.null_pct}%
              </div>
              <div className="text-[11px] text-slate-500">{col.nulls} valores ausentes</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Valores Distintos</span>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {fmt(col.distinct)}
              </div>
              <div className="text-[11px] text-slate-500">{col.distinct_pct}% da base</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Diagnóstico</span>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
                {col.null_pct > 50 ? (
                  <>
                    <AlertTriangle size={15} className="text-amber-500" /> Nulos Críticos
                  </>
                ) : col.distinct === 1 ? (
                  <>
                    <AlertTriangle size={15} className="text-amber-500" /> Coluna Constante
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-500" /> Dados Saudáveis
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-500">Pronto para uso</div>
            </div>
          </div>

          {/* Narrative Insight (Didactic Interpretation) */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-blue-50/60 dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-300 mb-2">
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
              Interpretação Guiada da Coluna (O que os dados revelam)
            </div>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {narrative.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================== */}
          {/* SEÇÃO PEDIDA PELO USUÁRIO: LINHA COM MAIOR E MENOR VALOR/DATA */}
          {/* ============================================================== */}
          {col.kind === "numeric" && col.numeric && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    Registros Extremos: Linhas com Menor e Maior Número
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Veja os registros reais do banco que atingiram os limites mínimo e máximo desta coluna
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Menor Número */}
                <ExtremeRowCard
                  title="Menor Número Registrado"
                  badge="Mínimo Absoluto"
                  badgeClass="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  valueText={fmt(col.numeric.min)}
                  rowIndex={col.numeric.min_index}
                  rowData={col.numeric.min_row}
                  highlightCol={col.name}
                  icon={ArrowDown}
                />

                {/* Maior Número */}
                <ExtremeRowCard
                  title="Maior Número Registrado"
                  badge="Máximo / Pico"
                  badgeClass="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                  valueText={fmt(col.numeric.max)}
                  rowIndex={col.numeric.max_index}
                  rowData={col.numeric.max_row}
                  highlightCol={col.name}
                  icon={ArrowUp}
                />
              </div>
            </div>
          )}

          {col.kind === "datetime" && col.datetime && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={16} className="text-amber-600" />
                    Registros Extremos: Linhas com Menor e Maior Data
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Identifique a linha do evento mais antigo (início) e a linha do evento mais recente (término)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Menor Data */}
                <ExtremeRowCard
                  title="Menor Data (Mais Antiga / Início)"
                  badge="Primeiro Registro"
                  badgeClass="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  valueText={new Date(col.datetime.min).toLocaleString()}
                  rowIndex={col.datetime.min_index}
                  rowData={col.datetime.min_row}
                  highlightCol={col.name}
                  icon={ArrowDown}
                />

                {/* Maior Data */}
                <ExtremeRowCard
                  title="Maior Data (Mais Recente / Término)"
                  badge="Último Registro"
                  badgeClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  valueText={new Date(col.datetime.max).toLocaleString()}
                  rowIndex={col.datetime.max_index}
                  rowData={col.datetime.max_row}
                  highlightCol={col.name}
                  icon={ArrowUp}
                />
              </div>
            </div>
          )}

          {/* If Numeric: Histogram & Detailed Statistics */}
          {col.kind === "numeric" && col.numeric && (
            <div className="space-y-5">
              {/* Histogram */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Distribuição de Frequências (Histograma)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Passe o mouse sobre as barras para ver os intervalos e contagens exatas
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {col.numeric.histogram.counts.length} faixas de valores
                  </span>
                </div>

                <div className="h-32 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {(() => {
                    const counts = col.numeric.histogram.counts;
                    const edges = col.numeric.histogram.edges;
                    const maxCount = Math.max(1, ...counts);

                    return counts.map((count, i) => {
                      const hPct = (count / maxCount) * 100;
                      const fromVal = fmt(edges[i]);
                      const toVal = fmt(edges[i + 1]);

                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        >
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-20">
                            Faixa: [{fromVal} a {toVal}]<br />
                            <b>{count} registros</b>
                          </div>

                          <div
                            className="w-full rounded-t-lg bg-indigo-500/80 group-hover:bg-indigo-600 transition-all shadow-sm"
                            style={{ height: `${Math.max(4, hPct)}%` }}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>Mínimo: {fmt(col.numeric.min)}</span>
                  <span>Mediana: {fmt(col.numeric.median)}</span>
                  <span>Máximo: {fmt(col.numeric.max)}</span>
                </div>
              </div>

              {/* Statistics Grid with Explanation Callouts */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
                  <span>Estatísticas Descritivas Detalhadas</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Clique em qualquer métrica para ver o que significa
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {[
                    { label: "Mínimo", val: fmt(col.numeric.min), term: "media-vs-mediana", desc: "Menor valor registrado nesta coluna." },
                    { label: "Q25 (1º Quartil)", val: fmt(col.numeric.q25), term: "percentis-p90-p95", desc: "25% de toda a base está abaixo deste valor." },
                    { label: "Mediana (50%)", val: fmt(col.numeric.median), term: "media-vs-mediana", desc: "O ponto central exato que divide a base em metades iguais." },
                    { label: "Média Aritmética", val: fmt(col.numeric.mean), term: "media-vs-mediana", desc: "Soma de todos os valores dividida pelo total de linhas." },
                    { label: "Q75 (3º Quartil)", val: fmt(col.numeric.q75), term: "percentis-p90-p95", desc: "75% dos valores são menores ou iguais a este ponto." },
                    { label: "P90 (90%)", val: fmt(col.numeric.p90), term: "percentis-p90-p95", desc: "90% das ocorrências ficam abaixo deste valor." },
                    { label: "P95 (95%)", val: fmt(col.numeric.p95), term: "percentis-p90-p95", desc: "Métrica de cauda: apenas 5% superam este número." },
                    { label: "Máximo", val: fmt(col.numeric.max), term: "outliers-iqr", desc: "Maior valor isolado registrado nesta coluna." },
                    { label: "Desvio Padrão", val: fmt(col.numeric.std), term: "desvio-padrao-cv", desc: "Grau de afastamento dos valores em relação à média." },
                    {
                      label: "Coef. Variação (CV)",
                      val: col.numeric.cv != null ? `${(col.numeric.cv * 100).toFixed(1)}%` : "—",
                      term: "desvio-padrao-cv",
                      desc: "Volatilidade relativa: CV < 15% estável, CV > 50% muito disperso.",
                    },
                    {
                      label: "Assimetria (Skew)",
                      val: col.numeric.skew != null ? col.numeric.skew.toFixed(2) : "—",
                      term: "skewness-assimetria",
                      desc: "Indica se a curva puxa para direita (>0) ou esquerda (<0).",
                    },
                    {
                      label: "Outliers Detectados",
                      val: `${col.numeric.outliers?.count ?? 0} (${col.numeric.outliers?.pct ?? 0}%)`,
                      term: "outliers-iqr",
                      desc: "Valores extremos calculados pela regra de 1.5×IQR.",
                    },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenDictionaryTerm && onOpenDictionaryTerm(m.term)}
                      className="bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800 rounded-xl p-2.5 border border-slate-200/70 dark:border-slate-800 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {m.label}
                        </span>
                        <HelpCircle size={12} className="text-slate-300 group-hover:text-indigo-500" />
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                        {m.val}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {m.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* If Categorical: Top distribution */}
          {col.kind === "categorical" && col.categorical && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Frequência das Categorias Mais Comuns (Top Valores)
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                {col.categorical.top.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-200 truncate max-w-[280px]">
                        {item.value || "<vazio/nulo>"}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        <b>{item.count}</b> ocorrências ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações Práticas */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1.5">
              <Lightbulb size={16} className="text-emerald-600" />
              Recomendações para Estudos & Modelagem
            </div>
            <ul className="text-xs text-emerald-950 dark:text-emerald-200/90 space-y-1 list-disc list-inside">
              {col.null_pct > 0 && (
                <li>
                  Tratamento de ausentes: preencha os {col.null_pct}% nulos com a <b>Mediana</b> (se numérica) ou com a <b>Moda</b> (se texto) antes de cálculos críticos.
                </li>
              )}
              {col.kind === "numeric" && col.numeric?.outliers && col.numeric.outliers.count > 0 && (
                <li>
                  Investigue os {col.numeric.outliers.count} outliers para verificar se são erros de lançamento ou clientes atípicos de alto valor.
                </li>
              )}
              {col.distinct === 1 && (
                <li>
                  Esta coluna possui valor único constante e não agrega poder discriminatório em análises estatísticas.
                </li>
              )}
              <li>
                Para cruzar esta coluna com outras variáveis, use a aba de <b>Correlações</b> ou <b>Segmentos K-Means</b>.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/60">
          <span>
            Dica: No &quot;Modo Estudo&quot;, cada indicador possui um conceito associado para aprofundar seu aprendizado.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Fechar Raio-X
          </button>
        </div>
      </div>
    </div>
  );
}
