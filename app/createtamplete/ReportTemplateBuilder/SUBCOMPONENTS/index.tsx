// ============================================================================
// SUBCOMPONENTS (Melhorados)
// ============================================================================

import React from "react";
import { Section } from "../../types";
import { SectionPreview } from "../SectionPreview";
import { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// TOOL BUTTON
// ---------------------------------------------------------------------------
interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export const ToolButton: React.FC<ToolButtonProps> = React.memo(
  ({ icon: Icon, label, onClick }) => {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        title={label}
        className="flex flex-col items-center justify-center p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <Icon size={18} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
        <span className="text-xs text-slate-600 group-hover:text-blue-600 mt-1">
          {label}
        </span>
      </button>
    );
  }
);
ToolButton.displayName = "ToolButton";

// ---------------------------------------------------------------------------
// ICON BUTTON
// ---------------------------------------------------------------------------
interface IconButtonProps {
  icon: LucideIcon;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  danger?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = React.memo(
  ({ icon: Icon, onClick, title, danger = false }) => {
    return (
      <button
        onClick={onClick}
        aria-label={title}
        title={title}
        className={`p-1.5 rounded-md transition-all focus:outline-none focus:ring-2 ${
          danger
            ? "hover:bg-red-50 text-red-600 focus:ring-red-300"
            : "hover:bg-slate-100 text-slate-600 focus:ring-blue-300"
        }`}
      >
        <Icon size={16} />
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

// ---------------------------------------------------------------------------
// SECTION PREVIEW UTILITY
// ---------------------------------------------------------------------------
export function getSectionPreview(section: Section): string {
  switch (section.type) {
    case "header":
      return section.data.title?.trim() || "Sem título";
    case "text":
      return ((section.data.value || "").trim().slice(0, 50) || "Texto vazio") + "...";
    case "table":
      return `${section.data.columns?.length || 0} colunas, ${section.data.rows?.length || 0} linhas`;
    case "image":
      return section.data.path || "Sem imagem";
    case "list":
      return `${section.data.items?.length || 0} itens`;
    case "footer":
      return section.data.center?.trim() || "Rodapé";
    default:
      return section.type;
  }
}

// ---------------------------------------------------------------------------
// PREVIEW RENDERER
// ---------------------------------------------------------------------------
interface PreviewRendererProps {
  sections: Section[];
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = React.memo(
  ({ sections }) => {
    if (!sections?.length) {
      return (
        <div className="text-slate-400 text-sm italic text-center py-8">
          Nenhuma seção adicionada ainda.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <SectionPreview key={section.id} section={section} />
        ))}
      </div>
    );
  }
);
PreviewRenderer.displayName = "PreviewRenderer";
