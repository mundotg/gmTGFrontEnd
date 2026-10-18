import React, { useState } from "react";
import { GraduationCap, ChevronDown, ChevronUp, Lightbulb, Sparkles } from "lucide-react";

interface StudyCalloutProps {
  title: string;
  concept: string;
  whyItMatters: string;
  practicalTip?: string;
  defaultExpanded?: boolean;
  badge?: string;
}

export function StudyCallout({
  title,
  concept,
  whyItMatters,
  practicalTip,
  defaultExpanded = true,
  badge = "Conceito & Estudo",
}: StudyCalloutProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/80 border border-indigo-200/80 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
            <GraduationCap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {badge}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Guia Didático</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 leading-tight mt-0.5">
              {title}
            </h4>
          </div>
        </div>
        <button
          type="button"
          className="w-7 h-7 rounded-lg hover:bg-white/80 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          title={expanded ? "Recolher explicação" : "Expandir explicação"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3 border-t border-indigo-100 space-y-2.5 text-xs text-slate-700 animate-in fade-in duration-200">
          <div>
            <span className="font-bold text-indigo-950 flex items-center gap-1.5 mb-0.5">
              <Sparkles size={13} className="text-indigo-600" /> O que é esta informação?
            </span>
            <p className="text-slate-600 leading-relaxed pl-5">{concept}</p>
          </div>

          <div>
            <span className="font-bold text-indigo-950 flex items-center gap-1.5 mb-0.5">
              <Lightbulb size={13} className="text-amber-500" /> Para que serve no seu estudo / projeto?
            </span>
            <p className="text-slate-600 leading-relaxed pl-5">{whyItMatters}</p>
          </div>

          {practicalTip && (
            <div className="bg-white/80 rounded-xl p-2.5 border border-indigo-100/80 text-[11px] text-slate-700 flex items-start gap-2">
              <span className="font-bold text-indigo-600 shrink-0">🎯 Como interpretar:</span>
              <span className="leading-relaxed">{practicalTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
