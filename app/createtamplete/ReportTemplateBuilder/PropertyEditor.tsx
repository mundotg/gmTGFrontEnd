"use client";

import React, { useCallback } from "react";
import { Maximize2, LayoutTemplate, Palette, Settings2 } from "lucide-react";
import {
  Section,
  BaseStyle,
  HeaderSectionData,
  TextSectionData,
  TableSectionData,
  ListSectionData,
  LineSectionData,
  ImageSectionData,
  SpacerSectionData,
  FooterSectionData,
  PageBreakSectionData,
  ContainerSectionData
} from "../types";

// ---------------------------------------------------------------------------
// TYPES & UI HELPERS
// ---------------------------------------------------------------------------
interface PropertyEditorProps {
  section: Section;
  onUpdate: (data: Partial<Section["data"]>) => void;
  onUpdateStyle?: (style: Partial<BaseStyle>) => void;
}

const baseInputClass =
  "w-full rounded-md border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition text-sm px-2 py-1.5 outline-none bg-white";

// Sub-componente de Layout para campos
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-500 ml-0.5">
      {label}
    </label>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// PROPERTY EDITOR
// ---------------------------------------------------------------------------
export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  section,
  onUpdate,
  onUpdateStyle,
}) => {

  // Helper para converter string de input para número/undefined
  const toNumber = (value: string) => (value === "" ? undefined : Number(value));

  // Helper de Narrowing para evitar 'as any'
  const getData = <T,>() => section.data as T;

  // ============================================================
  // CAMPOS ESPECÍFICOS POR TIPO
  // ============================================================
  const renderFields = () => {
    switch (section.type) {
      case "header": {
        const data = getData<HeaderSectionData>();
        return (
          <div className="space-y-4">
            <Field label="Título">
              <input value={data.title ?? ""} onChange={(e) => onUpdate({ title: e.target.value })} className={baseInputClass} />
            </Field>
            <Field label="Subtítulo">
              <input value={data.subtitle ?? ""} onChange={(e) => onUpdate({ subtitle: e.target.value })} className={baseInputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Alinhamento">
                <select value={data.align ?? "left"} onChange={(e) => onUpdate({ align: e.target.value as any })} className={baseInputClass}>
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                  <option value="justify">Justificado</option>
                </select>
              </Field>
              <Field label="Exibir Logo">
                <select value={String(!!data.logo)} onChange={(e) => onUpdate({ logo: e.target.value === "true" })} className={baseInputClass}>
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </Field>
            </div>
          </div>
        );
      }

      case "text": {
        const data = getData<TextSectionData>();
        return (
          <div className="space-y-4">
            <Field label="Conteúdo">
              <textarea
                value={data.value ?? ""}
                onChange={(e) => onUpdate({ value: e.target.value })}
                className={`${baseInputClass} min-h-[120px] resize-y`}
              />
            </Field>
            <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded border border-slate-200">
              {(['bold', 'italic', 'underline'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition">
                  <input
                    type="checkbox"
                    checked={!!data[key]}
                    onChange={(e) => onUpdate({ [key]: e.target.checked })}
                    className="rounded border-slate-300 text-blue-500"
                  />
                  <span className="text-[10px] font-bold uppercase text-slate-600">{key}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamanho">
                <input type="number" value={data.size ?? ""} onChange={(e) => onUpdate({ size: toNumber(e.target.value) })} className={baseInputClass} />
              </Field>
              <Field label="Cor Texto">
                <input type="color" value={data.color ?? "#000000"} onChange={(e) => onUpdate({ color: e.target.value })} className="w-full h-8 rounded cursor-pointer border-none p-0" />
              </Field>
            </div>
          </div>
        );
      }

      case "image": {
        const data = getData<ImageSectionData>();
        return (
          <div className="space-y-4">
            <Field label="Caminho / URL">
              <input value={data.path ?? ""} onChange={(e) => onUpdate({ path: e.target.value })} className={baseInputClass} placeholder="https://..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Largura (cm)">
                <input type="number" value={data.width ?? ""} onChange={(e) => onUpdate({ width: toNumber(e.target.value) })} className={baseInputClass} />
              </Field>
              <Field label="Ajuste (Fit)">
                <select value={data.fit ?? "contain"} onChange={(e) => onUpdate({ fit: e.target.value as any })} className={baseInputClass}>
                  <option value="contain">Conter</option>
                  <option value="cover">Cobrir</option>
                  <option value="fill">Preencher</option>
                </select>
              </Field>
            </div>
          </div>
        );
      }

      case "container": {
        const data = getData<ContainerSectionData>();
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-700">
              <LayoutTemplate size={14} />
              <span className="text-[10px] font-bold uppercase">Configuração de Bloco</span>
            </div>
            <Field label="Direção">
              <select value={data.direction ?? "column"} onChange={(e) => onUpdate({ direction: e.target.value as any })} className={baseInputClass}>
                <option value="column">Coluna (Vertical)</option>
                <option value="row">Linha (Horizontal)</option>
              </select>
            </Field>
            <Field label="Espaçamento (Gap)">
              <input type="number" value={data.gap ?? ""} onChange={(e) => onUpdate({ gap: toNumber(e.target.value) })} className={baseInputClass} />
            </Field>
          </div>
        );
      }

      case "pagebreak": {
        const data = getData<PageBreakSectionData>();
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
              <Maximize2 size={24} className="mb-2 opacity-20" />
              <span className="text-xs font-medium">Salto de Página</span>
            </div>
            <Field label="Rótulo Interno">
              <input value={data.label ?? ""} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="Ex: Início do Capítulo 2" className={baseInputClass} />
            </Field>
          </div>
        );
      }

      default: return null;
    }
  };

  // ============================================================
  // ESTILO UNIVERSAL
  // ============================================================
  const renderStyle = () => {
    const s = section.style ?? {};
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Largura">
            <input type="number" value={s.width ?? ""} onChange={(e) => onUpdateStyle?.({ width: toNumber(e.target.value) })} className={baseInputClass} />
          </Field>
          <Field label="Alinhamento">
            <select value={s.align ?? "left"} onChange={(e) => onUpdateStyle?.({ align: e.target.value as any })} className={baseInputClass}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">Margens Externas (cm)</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Topo" value={s.marginTop ?? ""} onChange={(e) => onUpdateStyle?.({ marginTop: toNumber(e.target.value) })} className={baseInputClass} />
            <input type="number" placeholder="Base" value={s.marginBottom ?? ""} onChange={(e) => onUpdateStyle?.({ marginBottom: toNumber(e.target.value) })} className={baseInputClass} />
            <input type="number" placeholder="Esq" value={s.marginLeft ?? ""} onChange={(e) => onUpdateStyle?.({ marginLeft: toNumber(e.target.value) })} className={baseInputClass} />
            <input type="number" placeholder="Dir" value={s.marginRight ?? ""} onChange={(e) => onUpdateStyle?.({ marginRight: toNumber(e.target.value) })} className={baseInputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fundo">
            <input type="color" value={s.backgroundColor ?? "#ffffff"} onChange={(e) => onUpdateStyle?.({ backgroundColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border-none p-0" />
          </Field>
          <Field label="Raio Borda">
            <input type="number" value={s.radius ?? ""} onChange={(e) => onUpdateStyle?.({ radius: toNumber(e.target.value) })} className={baseInputClass} />
          </Field>
        </div>

        <div className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white">
          <span className="text-xs font-bold text-slate-600 uppercase">Ativar Borda</span>
          <input
            type="checkbox"
            checked={!!s.border}
            onChange={(e) => onUpdateStyle?.({ border: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-blue-500"
          />
        </div>

        {s.border && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in slide-in-from-top-2">
            <Field label="Cor Borda">
              <input type="color" value={s.borderColor ?? "#cbd5e1"} onChange={(e) => onUpdateStyle?.({ borderColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
            </Field>
            <Field label="Espessura">
              <input type="number" value={s.borderWidth ?? ""} onChange={(e) => onUpdateStyle?.({ borderWidth: toNumber(e.target.value) })} className={baseInputClass} />
            </Field>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-120px)]">

        {/* Bloco de Dados */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Settings2 size={16} />
            <h2 className="text-xs font-black uppercase tracking-tighter">Propriedades</h2>
          </div>
          {renderFields()}
        </div>

        {/* Bloco de Estilo */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Palette size={16} />
            <h2 className="text-xs font-black uppercase tracking-tighter">Estilo Visual</h2>
          </div>
          {renderStyle()}
        </div>

      </div>
    </div>
  );
};