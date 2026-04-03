"use client";

import React from "react";
import { Maximize2 } from "lucide-react";
import {
  Section,
  BaseStyle,
} from "../types";

// ---------------------------------------------------------------------------
// FIELD COMPONENT
// ---------------------------------------------------------------------------
interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700">
      {label}
    </label>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// BASE INPUT
// ---------------------------------------------------------------------------
const baseInputClass =
  "input w-full rounded-md border border-slate-300 focus:border-blue-400 focus:ring focus:ring-blue-200 transition text-sm px-2 py-1.5";

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------
interface PropertyEditorProps {
  section: Section;
  onUpdate: (data: Partial<Section["data"]>) => void;
  onUpdateStyle?: (style: Partial<BaseStyle>) => void;
}

// ---------------------------------------------------------------------------
// PROPERTY EDITOR
// ---------------------------------------------------------------------------
export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  section,
  onUpdate,
  onUpdateStyle,
}) => {
  // 🔥 update seguro (não deixa NaN)
  const toNumber = (value: string) =>
    value === "" ? undefined : Number(value);

  const updateStyle = (style: Partial<BaseStyle>) => {
    onUpdateStyle?.(style);
  };

  // 🔥 helper tipado automaticamente pelo switch
  const renderFields = () => {
    switch (section.type) {
      // ============================================================
      // HEADER
      // ============================================================
      case "header": {
        const data = section.data;

        return (
          <>
            <Field label="Título">
              <input
                value={data.title ?? ""}
                onChange={(e) =>
                  onUpdate({ title: e.target.value })
                }
                className={baseInputClass}
              />
            </Field>

            <Field label="Subtítulo">
              <input
                value={data.subtitle ?? ""}
                onChange={(e) =>
                  onUpdate({ subtitle: e.target.value })
                }
                className={baseInputClass}
              />
            </Field>

            <Field label="Alinhamento">
              <select
                value={data.align ?? "left"}
                onChange={(e) =>
                  onUpdate({
                    align: e.target.value as typeof data.align,
                  })
                }
                className={baseInputClass}
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
                <option value="justify">Justificado</option>
              </select>
            </Field>

            <Field label="Logo">
              <select
                value={data.logo ? "true" : "false"}
                onChange={(e) =>
                  onUpdate({ logo: e.target.value === "true" })
                }
                className={baseInputClass}
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamanho Título">
                <input
                  type="number"
                  value={data.title_size ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      title_size: toNumber(e.target.value),
                    })
                  }
                  className={baseInputClass}
                />
              </Field>

              <Field label="Tamanho Subtítulo">
                <input
                  type="number"
                  value={data.subtitle_size ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      subtitle_size: toNumber(e.target.value),
                    })
                  }
                  className={baseInputClass}
                />
              </Field>
            </div>
          </>
        );
      }

      // ============================================================
      // TEXT
      // ============================================================
      case "text": {
        const data = section.data;

        return (
          <>
            <Field label="Conteúdo">
              <textarea
                value={data.value ?? ""}
                onChange={(e) =>
                  onUpdate({ value: e.target.value })
                }
                className={`${baseInputClass} min-h-32`}
              />
            </Field>

            <Field label="Alinhamento">
              <select
                value={data.align ?? "left"}
                onChange={(e) =>
                  onUpdate({
                    align: e.target.value as typeof data.align,
                  })
                }
                className={baseInputClass}
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label="Negrito">
                <input
                  type="checkbox"
                  checked={data.bold ?? false}
                  onChange={(e) =>
                    onUpdate({ bold: e.target.checked })
                  }
                />
              </Field>

              <Field label="Itálico">
                <input
                  type="checkbox"
                  checked={data.italic ?? false}
                  onChange={(e) =>
                    onUpdate({ italic: e.target.checked })
                  }
                />
              </Field>

              <Field label="Underline">
                <input
                  type="checkbox"
                  checked={data.underline ?? false}
                  onChange={(e) =>
                    onUpdate({ underline: e.target.checked })
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamanho">
                <input
                  type="number"
                  value={data.size ?? ""}
                  onChange={(e) =>
                    onUpdate({ size: toNumber(e.target.value) })
                  }
                  className={baseInputClass}
                />
              </Field>

              <Field label="Cor">
                <input
                  type="color"
                  value={data.color ?? "#000000"}
                  onChange={(e) =>
                    onUpdate({ color: e.target.value })
                  }
                  className={baseInputClass}
                />
              </Field>
            </div>
          </>
        );
      }

      // ============================================================
      // FOOTER
      // ============================================================
      case "footer": {
        const data = section.data;

        return (
          <>
            <Field label="Esquerda">
              <input
                value={data.left ?? ""}
                onChange={(e) =>
                  onUpdate({ left: e.target.value })
                }
                className={baseInputClass}
              />
            </Field>

            <Field label="Centro">
              <input
                value={data.center ?? ""}
                onChange={(e) =>
                  onUpdate({ center: e.target.value })
                }
                className={baseInputClass}
              />
            </Field>

            <Field label="Direita">
              <input
                value={data.right ?? ""}
                onChange={(e) =>
                  onUpdate({ right: e.target.value })
                }
                className={baseInputClass}
              />
            </Field>

            <Field label="Tamanho">
              <input
                type="number"
                value={data.size ?? ""}
                onChange={(e) =>
                  onUpdate({ size: toNumber(e.target.value) })
                }
                className={baseInputClass}
              />
            </Field>
          </>
        );
      }

      // ============================================================
      case "pagebreak":
        return (
          <div className="text-center text-slate-500">
            <Maximize2 size={42} className="mx-auto mb-3 opacity-30" />
            <p>Quebra de página</p>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================
  // STYLE
  // ============================================================
  const renderStyle = () => {
    const style: BaseStyle = section.style ?? {};

    return (
      <>
        <Field label="Largura (cm)">
          <input
            type="number"
            value={style.width ?? ""}
            onChange={(e) =>
              updateStyle({
                width: toNumber(e.target.value),
              })
            }
            className={baseInputClass}
          />
        </Field>

        <Field label="Altura (cm)">
          <input
            type="number"
            value={style.height ?? ""}
            onChange={(e) =>
              updateStyle({
                height: toNumber(e.target.value),
              })
            }
            className={baseInputClass}
          />
        </Field>

        <Field label="Alinhamento">
          <select
            value={style.align ?? "left"}
            onChange={(e) =>
              updateStyle({
                align: e.target.value as BaseStyle["align"],
              })
            }
            className={baseInputClass}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Field>

        <Field label="Cor de fundo">
          <input
            type="color"
            value={style.backgroundColor ?? "#ffffff"}
            onChange={(e) =>
              updateStyle({ backgroundColor: e.target.value })
            }
            className={baseInputClass}
          />
        </Field>
      </>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {renderFields()}

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase">
          Estilo
        </h3>
        {renderStyle()}
      </div>
    </div>
  );
};