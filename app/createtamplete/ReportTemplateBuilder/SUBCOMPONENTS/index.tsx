// ============================================================================
// SUBCOMPONENTS (Versão PRO+)
// ============================================================================

import React, { CSSProperties, useMemo } from "react";
import { Section, BaseStyle, ContainerSectionData } from "../../types"; // 🔥 Importamos ContainerSectionData
import { SectionPreview } from "../SectionPreview";
import { LucideIcon } from "lucide-react";

// ============================================================================
// STYLE HELPER (🔥 mais seguro e consistente)
// ============================================================================
export function buildStyle(style?: BaseStyle): CSSProperties {
  if (!style) return {};

  const {
    width, height, marginTop, marginBottom, marginLeft, marginRight,
    padding, align, backgroundColor, border, borderColor, borderWidth,
    radius, x, y,
  } = style;

  const hasAbsolutePosition = x !== undefined || y !== undefined;
  const px = (val?: string | number) => (typeof val === "number" ? `${val}px` : val);

  return {
    width: width !== undefined ? `${width}cm` : undefined,
    height: height !== undefined ? `${height}cm` : undefined,
    marginTop: px(marginTop),
    marginBottom: px(marginBottom),
    marginLeft: px(marginLeft),
    marginRight: px(marginRight),
    padding: px(padding),
    textAlign: align ?? undefined,
    backgroundColor: backgroundColor ?? undefined,
    border: border ? `${borderWidth ?? 1}px solid ${borderColor ?? "#cbd5e1"}` : undefined,
    borderRadius: px(radius),
    position: hasAbsolutePosition ? "absolute" : undefined,
    left: px(x),
    top: px(y),
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
        ${disabled
            ? "opacity-40 cursor-not-allowed"
            : "border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
          }`}
      >
        {Icon && <Icon size={18} className="text-slate-600 group-hover:text-blue-600" />}
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
        ${disabled
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
// PREVIEW RENDERER (🔥 Recursividade Robusta para Níveis Infinitos)
// ============================================================================
interface PreviewRendererProps {
  sections: Section[];
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = React.memo(
  ({ sections }) => {

    const renderSection = (section: Section): React.ReactNode => {
      const style = buildStyle(section.style);
      const isContainer = ["container", "header", "footer"].includes(section.type);
      const hasChildren = section.children && section.children.length > 0;

      if (isContainer) {
        // 🔥 Extraímos os dados fazendo o cast seguro para não quebrar o build
        // Se for header/footer, os valores ficarão como undefined e usarão os fallbacks
        const containerData = section.type === "container"
          ? (section.data as ContainerSectionData)
          : null;

        const direction = containerData?.direction === "row" ? "row" : "column";
        const gap = containerData?.gap !== undefined ? `${containerData.gap}px` : "8px";

        const containerStyle: CSSProperties = {
          ...style,
          display: "flex",
          flexDirection: direction,
          gap: gap,
          width: "100%",
          flexWrap: direction === "row" ? "wrap" : "nowrap",
        };

        return (
          <div key={section.id} style={containerStyle} className="transition-all relative">
            <SectionPreview section={section} />
            {hasChildren && section.children!.map((child) => renderSection(child))}
          </div>
        );
      }

      return (
        <div key={section.id} style={style} className="transition-all relative">
          <SectionPreview section={section} />
        </div>
      );
    };

    const renderedSections = useMemo(() => {
      if (!sections || sections.length === 0) return null;
      return sections.map(renderSection);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sections]);

    if (!sections || sections.length === 0) {
      return (
        <div className="text-center text-slate-400 italic py-10">
          Nenhuma seção adicionada.
        </div>
      );
    }

    return (
      <div className="relative flex flex-col gap-6 w-full">
        {renderedSections}
      </div>
    );
  }
);

PreviewRenderer.displayName = "PreviewRenderer";