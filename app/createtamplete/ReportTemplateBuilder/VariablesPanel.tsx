"use client";

import React, { useState } from "react";
import { Braces, ChevronDown, Copy, Table as TableIcon, Plus } from "lucide-react";
import { VARIABLE_GROUPS } from "../variables";
import { Section } from "../types";

type Props = {
  selectedSection?: Section;
  /** Insere {{key}} no campo principal da seção selecionada. */
  onInsertVariable: (key: string) => void;
  /** Liga a tabela selecionada aos dados da consulta (rows_from/columns_from). */
  onBindTable: () => void;
};

const VariablesPanel: React.FC<Props> = ({ selectedSection, onInsertVariable, onBindTable }) => {
  const [open, setOpen] = useState(true);

  const canInsert = !!selectedSection && ["text", "header", "footer", "list"].includes(selectedSection.type);
  const isTable = selectedSection?.type === "table";

  const handleClick = (key: string) => {
    // Copia sempre (fallback) e insere se possível.
    try {
      navigator.clipboard?.writeText(`{{${key}}}`);
    } catch {
      /* ignore */
    }
    if (canInsert) onInsertVariable(key);
  };

  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 tracking-wide">
          <Braces size={14} className="text-indigo-600" /> VARIÁVEIS
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>

      {open && (
        <div className="p-3 space-y-3">
          <p className="text-[11px] text-slate-500 leading-snug">
            {canInsert
              ? "Clica para inserir na seção selecionada."
              : isTable
                ? "Tabela selecionada: liga-a aos dados da consulta."
                : "Seleciona um texto/cabeçalho/rodapé/lista para inserir (ou clica para copiar)."}
          </p>

          {isTable && (
            <button
              type="button"
              onClick={onBindTable}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
            >
              <TableIcon size={13} /> Ligar tabela aos dados da consulta
            </button>
          )}

          {VARIABLE_GROUPS.map((grp) => (
            <div key={grp.group}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{grp.group}</div>
              <div className="flex flex-wrap gap-1">
                {grp.items.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleClick(v.key)}
                    title={`{{${v.key}}} — ex.: ${v.sample}`}
                    className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-indigo-100 bg-indigo-50 text-[11px] font-mono text-indigo-700 hover:bg-indigo-100"
                  >
                    {canInsert ? <Plus size={10} /> : <Copy size={10} className="opacity-60" />}
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VariablesPanel;
