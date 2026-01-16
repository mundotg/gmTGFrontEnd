// ============================================================================
// PROPERTY EDITOR (Versão Aprimorada)
// ============================================================================

import React from "react";
import { Maximize2 } from "lucide-react";
import { Section } from "../types";

// ---------------------------------------------------------------------------
// FIELD COMPONENT (Reutilizável)
// ---------------------------------------------------------------------------
interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700">{label}</label>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// BASE INPUT STYLES
// ---------------------------------------------------------------------------
const baseInputClass =
  "input w-full rounded-md border border-slate-300 focus:border-blue-400 focus:ring focus:ring-blue-200 transition text-sm px-2 py-1.5";

// ---------------------------------------------------------------------------
// PROPERTY EDITOR
// ---------------------------------------------------------------------------
interface PropertyEditorProps {
  section: Section;
  onUpdate: (data: Partial<Section["data"]>) => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ section, onUpdate }) => {
  const renderFields = () => {
    switch (section.type) {
      case "header":
        return (
          <>
            <Field label="Título">
              <input
                type="text"
                value={section.data.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className={baseInputClass}
              />
            </Field>

            <Field label="Subtítulo">
              <input
                type="text"
                value={section.data.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                className={baseInputClass}
              />
            </Field>

            <Field label="Exibir Logo">
              <select
                value={section.data.logo ? "true" : "false"}
                onChange={(e) => onUpdate({ logo: e.target.value === "true" })}
                className={baseInputClass}
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamanho do Título (pt)">
                <input
                  type="number"
                  value={section.data.title_size || 20}
                  onChange={(e) => onUpdate({ title_size: Number(e.target.value) })}
                  className={baseInputClass}
                />
              </Field>
              <Field label="Tamanho do Subtítulo (pt)">
                <input
                  type="number"
                  value={section.data.subtitle_size || 12}
                  onChange={(e) => onUpdate({ subtitle_size: Number(e.target.value) })}
                  className={baseInputClass}
                />
              </Field>
            </div>
          </>
        );

      case "text":
        return (
          <>
            <Field label="Conteúdo">
              <textarea
                value={section.data.value || ""}
                onChange={(e) => onUpdate({ value: e.target.value })}
                className={`${baseInputClass} min-h-32`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Alinhamento">
                <select
                  value={section.data.align || "left"}
                  onChange={(e) => onUpdate({ align: e.target.value as "left" | "center" | "right" | "justify" })}
                  className={baseInputClass}
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                  <option value="justify">Justificado</option>
                </select>
              </Field>

              <Field label="Tamanho (pt)">
                <input
                  type="number"
                  value={section.data.size || 11}
                  onChange={(e) => onUpdate({ size: Number(e.target.value) })}
                  className={baseInputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Negrito">
                <select
                  value={section.data.bold ? "true" : "false"}
                  onChange={(e) => onUpdate({ bold: e.target.value === "true" })}
                  className={baseInputClass}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </Field>

              <Field label="Cor (hex)">
                <input
                  type="text"
                  value={section.data.color || "#334155"}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className={baseInputClass}
                  placeholder="#334155"
                />
              </Field>
            </div>
          </>
        );

      case "footer":
        return (
          <>
            <Field label="Texto à Esquerda">
              <input
                type="text"
                value={section.data.left || ""}
                onChange={(e) => onUpdate({ left: e.target.value })}
                className={baseInputClass}
              />
            </Field>
            <Field label="Texto ao Centro">
              <input
                type="text"
                value={section.data.center || ""}
                onChange={(e) => onUpdate({ center: e.target.value })}
                className={baseInputClass}
              />
            </Field>
            <Field label="Texto à Direita">
              <input
                type="text"
                value={section.data.right || ""}
                onChange={(e) => onUpdate({ right: e.target.value })}
                className={baseInputClass}
              />
            </Field>
          </>
        );

      case "pagebreak":
        return (
          <div className="text-center text-slate-500">
            <Maximize2 size={42} className="mx-auto mb-3 opacity-30" />
            <p>Quebra de página</p>
            <p className="text-xs mt-1">Sem propriedades configuráveis</p>
          </div>
        );

      default:
        return (
          <div className="text-center text-slate-400 italic text-sm py-4">
            Tipo de seção desconhecido
          </div>
        );
    }
  };

  return <div className="p-4 space-y-4">{renderFields()}</div>;
};
