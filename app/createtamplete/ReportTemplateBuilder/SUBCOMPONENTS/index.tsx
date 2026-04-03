// ============================================================================
// SUBCOMPONENTS (Versão PRO+)
// ============================================================================

import React, { CSSProperties, useMemo } from "react";
import { Section, BaseStyle } from "../../types";
import { SectionPreview } from "../SectionPreview";
import { LucideIcon } from "lucide-react";

// ============================================================================
// STYLE HELPER (🔥 mais seguro e consistente)
// ============================================================================
export function buildStyle(style?: BaseStyle): CSSProperties {
  if (!style) return {};

  const {
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    padding,
    align,
    backgroundColor,
    border,
    borderColor,
    borderWidth,
    radius,
    x,
    y,
  } = style;

  const hasAbsolutePosition = x !== undefined || y !== undefined;

  return {
    // 📐 Dimensões (convertidas corretamente)
    width: width !== undefined ? `${width}cm` : undefined,
    height: height !== undefined ? `${height}cm` : undefined,

    // 📏 Espaçamentos
    marginTop: marginTop ?? undefined,
    marginBottom: marginBottom ?? undefined,
    marginLeft: marginLeft ?? undefined,
    marginRight: marginRight ?? undefined,
    padding: padding ?? undefined,

    // 📍 Alinhamento
    textAlign: align ?? undefined,

    // 🎨 Visual
    backgroundColor: backgroundColor ?? undefined,

    border: border
      ? `${borderWidth ?? 1}px solid ${borderColor ?? "#cbd5e1"}`
      : undefined,

    borderRadius: radius ?? undefined,

    // 📍 Posicionamento absoluto (futuro drag)
    position: hasAbsolutePosition ? "absolute" : undefined,
    left: x ?? undefined,
    top: y ?? undefined,
  };
}

// ============================================================================
// TOOL BUTTON
// ============================================================================
interface ToolButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const ToolButton: React.FC<ToolButtonProps> = React.memo(
  ({ icon: Icon, label, onClick, disabled }) => {
    return (
      <button
        onClick={onClick}
        title={label}
        disabled={disabled}
        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all group active:scale-95
        ${
          disabled
            ? "opacity-40 cursor-not-allowed"
            : "border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
        }`}
      >
        {Icon && (
          <Icon
            size={18}
            className="text-slate-600 group-hover:text-blue-600"
          />
        )}
        <span className="text-xs mt-1 text-slate-600 group-hover:text-blue-600">
          {label}
        </span>
      </button>
    );
  }
);
ToolButton.displayName = "ToolButton";

// ============================================================================
// ICON BUTTON
// ============================================================================
interface IconButtonProps {
  icon: LucideIcon;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  danger?: boolean;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = React.memo(
  ({ icon: Icon, onClick, title, danger = false, disabled = false }) => {
    return (
      <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-1.5 rounded-md transition-all active:scale-90
        ${
          disabled
            ? "opacity-40 cursor-not-allowed"
            : danger
            ? "text-red-600 hover:bg-red-50"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon size={16} />
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

// ============================================================================
// PREVIEW RENDERER (🔥 otimizado + preparado para escala)
// ============================================================================
interface PreviewRendererProps {
  sections: Section[];
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = React.memo(
  ({ sections }) => {
    const renderedSections = useMemo(() => {
      if (!sections?.length) return null;

      return sections.map((section) => {
        const style = buildStyle(section.style);

        return (
          <div
            key={section.id}
            style={style}
            className="transition-all"
          >
            <SectionPreview section={section} />
          </div>
        );
      });
    }, [sections]);

    if (!sections?.length) {
      return (
        <div className="text-center text-slate-400 italic py-10">
          Nenhuma seção adicionada.
        </div>
      );
    }

    return <div className="relative space-y-6">{renderedSections}</div>;
  }
);

PreviewRenderer.displayName = "PreviewRenderer";