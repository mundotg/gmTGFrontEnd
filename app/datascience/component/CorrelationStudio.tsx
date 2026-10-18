import React, { useState } from "react";
import { Corr } from "./types";
import {
  Sigma,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { StudyCallout } from "./StudyCallout";

interface CorrelationStudioProps {
  corr: Corr;
  studyMode: boolean;
  onOpenDictionaryTerm: (termId: string) => void;
}

export function CorrelationStudio({
  corr,
  studyMode,
  onOpenDictionaryTerm,
}: CorrelationStudioProps) {
  const cols = corr.columns;

  const [colA, setColA] = useState<string>(cols[0] || "");
  const [colB, setColB] = useState<string>(cols[1] || cols[0] || "");
  const [hoveredPair, setHoveredPair] = useState<{
    x: string;
    y: string;
    v: number | null;
  } | null>(null);

  if (!cols || cols.length < 2) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
        <Sigma size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm">
          São necessárias pelo menos duas colunas numéricas com variação para calcular a matriz de correlação.
        </p>
      </div>
    );
  }

  // Get correlation between selected colA and colB
  const idxA = cols.indexOf(colA);
  const idxB = cols.indexOf(colB);
  const selectedVal =
    idxA >= 0 && idxB >= 0 && corr.matrix[idxA]
      ? corr.matrix[idxA][idxB]
      : null;

  const getInterpretation = (v: number | null, nameA: string, nameB: string) => {
    if (v == null) return { tone: "slate", text: "Sem correlação calculável." };
    if (nameA === nameB) {
      return {
        tone: "indigo",
        title: "Auto-correlação Perfeita (r = 1.0)",
        text: `Uma coluna é sempre 100% idêntica a si mesma.`,
      };
    }
    const abs = Math.abs(v);
    if (abs >= 0.7) {
      if (v > 0) {
        return {
          tone: "blue",
          title: `Forte Correlação Positiva (r = +${v.toFixed(2)})`,
          text: `Quando "${nameA}" aumenta, "${nameB}" tende fortemente a aumentar na mesma proporção. Existe uma relação direta acentuada entre estas variáveis.`,
        };
      } else {
        return {
          tone: "red",
          title: `Forte Correlação Negativa (r = ${v.toFixed(2)})`,
          text: `Relação inversa: quando "${nameA}" sobe, "${nameB}" despenca na proporção inversa.`,
        };
      }
    }
    if (abs >= 0.3) {
      if (v > 0) {
        return {
          tone: "blue",
          title: `Correlação Positiva Moderada (r = +${v.toFixed(2)})`,
          text: `Existe uma tendência moderada de que valores altos de "${nameA}" acompanhem valores altos de "${nameB}", com dispersão intermediária.`,
        };
      } else {
        return {
          tone: "red",
          title: `Correlação Negativa Moderada (r = ${v.toFixed(2)})`,
          text: `Existe uma tendência moderada de comportamento oposto entre as duas variáveis.`,
        };
      }
    }
    return {
      tone: "slate",
      title: `Correlação Fraca ou Nula (r = ${v >= 0 ? "+" : ""}${v.toFixed(2)})`,
      text: `Não há evidência de associação linear entre "${nameA}" e "${nameB}". O comportamento de uma varia independentemente da outra.`,
    };
  };

  const inter = getInterpretation(selectedVal, colA, colB);

  const cellBg = (v: number | null) => {
    if (v == null) return "#f1f5f9";
    const a = Math.min(1, Math.abs(v));
    return v >= 0 ? `rgba(79, 70, 229, ${0.15 + a * 0.75})` : `rgba(225, 29, 72, ${0.15 + a * 0.75})`;
  };

  return (
    <div className="space-y-6">
      {studyMode && (
        <StudyCallout
          badge="Guia de Associação & Causalidade"
          title="O que é e para que serve a Matriz de Correlação?"
          concept="A correlação linear de Pearson (r) mede a força e a direção da relação entre duas variáveis numéricas, variando de -1 (inverso perfeito) até +1 (direto perfeito). Zero indica ausência de relação linear."
          whyItMatters="Permite descobrir alavancas operacionais ocultas (ex: quais custos sobem mais rápido que a receita?) e selecionar variáveis preditivas para treinar inteligência artificial."
          practicalTip="REGRA DE OURO: 'Correlação NÃO implica causalidade!'. Se as vendas de sorvete e o número de afogamentos sobem juntos no verão, o sorvete não causa o afogamento; ambos são causados por uma terceira variável oculta: o calor."
        />
      )}

      {/* Interactive Pair Comparator */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sigma size={18} className="text-indigo-600" />
              Comparador Interativo de Duas Variáveis
            </h3>
            <p className="text-xs text-slate-500">
              Escolha duas colunas para testar a associação estatística entre elas
            </p>
          </div>
          <button
            onClick={() => onOpenDictionaryTerm("correlacao-pearson")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <HelpCircle size={14} /> Entenda a fórmula de Pearson
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 mb-4">
          <div className="sm:col-span-5">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Primeira Variável (X)
            </label>
            <select
              value={colA}
              onChange={(e) => setColA(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer shadow-sm"
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-center text-slate-400 font-bold">
            <ArrowRight size={20} className="hidden sm:block" />
            <span className="sm:hidden text-xs">cruzado com</span>
          </div>

          <div className="sm:col-span-5">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Segunda Variável (Y)
            </label>
            <select
              value={colB}
              onChange={(e) => setColB(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer shadow-sm"
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Pair Result Box */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                r = {selectedVal != null ? (selectedVal >= 0 ? `+${selectedVal.toFixed(2)}` : selectedVal.toFixed(2)) : "—"}
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {inter.title}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
              Escala de Pearson [-1.0 a +1.0]
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {inter.text}
          </p>

          <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 flex items-center gap-2 text-[11px] text-indigo-950 dark:text-indigo-200">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <span>
              <b>Atenção do Pesquisador:</b> Use a correlação para formular hipóteses e investigar, nunca para presumir causa sem um experimento controlado.
            </span>
          </div>
        </div>
      </section>

      {/* Heatmap Matrix */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Matriz de Calor Completa (Heatmap)
            </h3>
            <p className="text-xs text-slate-500">
              Passe o mouse ou clique sobre qualquer quadrado para carregar o par no comparador
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block" />
              <span>Negativa (-1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-200 inline-block" />
              <span>Neutra (0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block" />
              <span>Positiva (+1)</span>
            </div>
          </div>
        </div>

        <div className="inline-block min-w-full">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-400 font-bold uppercase text-[10px]">
                  Variáveis
                </th>
                {cols.map((colName) => (
                  <th
                    key={colName}
                    className="p-2 text-center text-slate-600 dark:text-slate-300 font-bold max-w-[100px] truncate"
                    title={colName}
                  >
                    {colName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corr.matrix.map((row, i) => {
                const rowName = cols[i];
                return (
                  <tr key={rowName}>
                    <td
                      className="p-2 font-bold text-slate-700 dark:text-slate-200 text-right max-w-[140px] truncate pr-3"
                      title={rowName}
                    >
                      {rowName}
                    </td>
                    {row.map((val, j) => {
                      const colName = cols[j];
                      const isSelf = i === j;
                      return (
                        <td
                          key={colName}
                          onClick={() => {
                            setColA(rowName);
                            setColB(colName);
                          }}
                          onMouseEnter={() =>
                            setHoveredPair({ x: rowName, y: colName, v: val })
                          }
                          onMouseLeave={() => setHoveredPair(null)}
                          className="p-1 text-center cursor-pointer transition-transform hover:scale-105"
                        >
                          <div
                            className={`w-12 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                              val != null && Math.abs(val) > 0.4
                                ? "text-white"
                                : "text-slate-800 dark:text-slate-100"
                            }`}
                            style={{ backgroundColor: cellBg(val) }}
                            title={`${rowName} × ${colName}: r = ${val ?? "—"}`}
                          >
                            {val == null ? "—" : val.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Hover inspector footer */}
        {hoveredPair && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span>
              Par em foco: <b>{hoveredPair.x}</b> × <b>{hoveredPair.y}</b> (r ={" "}
              <b>{hoveredPair.v != null ? hoveredPair.v.toFixed(2) : "—"}</b>). Clique para fixar no comparador.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
