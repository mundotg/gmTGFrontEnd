import {
  ImageIcon,
  FileTextIcon,
  SeparatorHorizontalIcon,
  LayoutTemplateIcon,
} from "lucide-react";
import {
  Section,
  HeaderSectionData,
  TextSectionData,
  TableSectionData,
  ImageSectionData,
  ListSectionData,
  LineSectionData,
  SpacerSectionData,
  FooterSectionData,
  ContainerSectionData,
  PageBreakSectionData,
} from "../types";

interface Props {
  section: Section;
}

// Movido para fora para não ser recriado a cada renderização
const renderPlaceholder = (text: string) => (
  <span className="text-slate-300 italic">{text}</span>
);

export function SectionPreview({ section }: Props) {
  switch (section.type) {
    // ============================================================
    // HEADER
    // ============================================================
    case "header": {
      // 🔥 Correção: Usando 'as' para forçar o Type Narrowing
      const data = section.data as HeaderSectionData;

      return (
        <div style={{ textAlign: data.align ?? "center" }} className="py-3 border-b border-slate-200">
          <h2
            className="font-bold text-slate-800 tracking-tight"
            style={{ fontSize: data.title_size ? `${data.title_size}px` : "1.5rem" }}
          >
            {data.title || renderPlaceholder("Título principal")}
          </h2>

          {data.subtitle && (
            <p
              className="text-slate-500 mt-1"
              style={{ fontSize: data.subtitle_size ? `${data.subtitle_size}px` : "0.875rem" }}
            >
              {data.subtitle}
            </p>
          )}
        </div>
      );
    }

    // ============================================================
    // TEXT
    // ============================================================
    case "text": {
      const data = section.data as TextSectionData;

      return (
        <div
          style={{
            textAlign: data.align ?? "left",
            fontSize: data.size ? `${data.size}px` : "0.875rem",
            color: data.color ?? "inherit",
            fontWeight: data.bold ? "bold" : "normal",
            fontStyle: data.italic ? "italic" : "normal",
            textDecoration: data.underline ? "underline" : "none",
            whiteSpace: "pre-wrap", // Respeita quebras de linha (\n)
          }}
          className="leading-relaxed"
        >
          {data.value || renderPlaceholder("Texto de conteúdo")}
        </div>
      );
    }

    // ============================================================
    // TABLE
    // ============================================================
    case "table": {
      const data = section.data as TableSectionData;
      const showHeader = data.header ?? true;
      const showBorder = data.border ?? true;

      return (
        <div className={`overflow-auto rounded-lg ${showBorder ? "border border-slate-200" : ""}`}>
          <table className={`w-full text-sm border-collapse ${!showBorder ? "border-none" : ""}`}>
            {showHeader && (
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  {(data.columns ?? []).map((col, i) => (
                    <th
                      key={i}
                      className={`px-3 py-2 text-left font-semibold ${showBorder ? "border-b border-slate-200" : ""}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(data.rows ?? []).map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-3 py-2 text-slate-700 ${showBorder ? "border-b border-slate-100" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // ============================================================
    // IMAGE
    // ============================================================
    case "image": {
      const data = section.data as ImageSectionData;

      if (data.path && data.path.trim() !== "") {
        return (
          <div className="flex justify-center" style={{ opacity: data.opacity ?? 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.path}
              alt="Preview"
              style={{
                width: data.width ? `${data.width}cm` : "auto",
                height: data.height ? `${data.height}cm` : "auto",
                objectFit: data.fit ?? "contain",
                maxWidth: "100%",
                borderRadius: "4px",
              }}
            />
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
          <ImageIcon size={36} className="text-slate-300 mb-2" />
          <p className="text-xs text-slate-500 truncate max-w-[200px]">
            {renderPlaceholder("Caminho da imagem")}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {data.width ?? "—"}cm × {data.height ?? "—"}cm
          </p>
        </div>
      );
    }

    // ============================================================
    // LIST
    // ============================================================
    case "list": {
      const data = section.data as ListSectionData;

      return (
        <ul
          className="text-sm text-slate-700"
          style={{ gap: data.spacing ? `${data.spacing}px` : "4px", display: "flex", flexDirection: "column" }}
        >
          {(data.items ?? []).length > 0 ? (
            data.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-[2px] shrink-0">
                  {data.bullet ?? "•"}
                </span>
                <span className="leading-snug break-words">{item}</span>
              </li>
            ))
          ) : (
            renderPlaceholder("Lista vazia")
          )}
        </ul>
      );
    }

    // ============================================================
    // LINE
    // ============================================================
    case "line": {
      const data = section.data as LineSectionData;

      return (
        <div className="py-2 w-full">
          <hr
            style={{
              borderColor: data.color ?? "#e2e8f0",
              borderWidth: data.thickness ?? 1,
              borderStyle: data.style ?? "solid",
              width: "100%",
            }}
          />
        </div>
      );
    }

    // ============================================================
    // SPACER
    // ============================================================
    case "spacer": {
      const data = section.data as SpacerSectionData;

      return (
        <div
          style={{ height: `${data.height ?? 0.5}cm` }}
          className="flex items-center justify-center w-full text-[10px] text-slate-400 border border-dashed border-slate-300 bg-slate-50/50 rounded-md"
        >
          Espaço: {data.height ?? "—"}cm
        </div>
      );
    }

    // ============================================================
    // FOOTER
    // ============================================================
    case "footer": {
      const data = section.data as FooterSectionData;

      return (
        <footer
          className="grid grid-cols-3 gap-2 text-slate-500 border-t border-slate-200 pt-3 w-full"
          style={{ fontSize: data.size ? `${data.size}px` : "11px" }}
        >
          <div className="text-left truncate">
            {data.left || renderPlaceholder("Esquerda")}
          </div>
          <div className="text-center truncate">
            {data.center || renderPlaceholder("Centro")}
          </div>
          <div className="text-right truncate">
            {data.right || renderPlaceholder("Direita")}
          </div>
        </footer>
      );
    }

    // ============================================================
    // CONTAINER
    // ============================================================
    case "container": {
      const data = section.data as ContainerSectionData;

      if (!section.children || section.children.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-4 border border-dashed border-indigo-200 bg-indigo-50/30 rounded-lg text-indigo-400">
            <LayoutTemplateIcon size={24} className="mb-2 opacity-50" />
            <p className="text-[10px] uppercase font-semibold tracking-wider">
              Container Vazio
            </p>
            <p className="text-[9px] mt-1 opacity-70">
              {data.direction === "row" ? "Linha (Horizontal)" : "Coluna (Vertical)"} | Gap: {data.gap ?? 8}px
            </p>
          </div>
        );
      }

      return null;
    }

    // ============================================================
    // PAGE BREAK
    // ============================================================
    case "pagebreak": {
      // 🔥 Adicionado o cast aqui também para manter o padrão seguro
      const data = section.data as PageBreakSectionData;

      return (
        <div className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 bg-slate-100 py-4 w-full rounded-md text-xs text-slate-400">
          <SeparatorHorizontalIcon size={16} />
          <span className="font-medium tracking-wide uppercase text-[10px]">Quebra de Página</span>
          {data?.label && (
            <span className="text-[9px] italic bg-white px-2 py-0.5 rounded border border-slate-200 mt-1">
              {data.label}
            </span>
          )}
        </div>
      );
    }

    // ============================================================
    // DEFAULT
    // ============================================================
    default:
      return (
        <div className="flex items-center justify-center gap-2 text-red-400 text-sm p-4 border border-red-200 bg-red-50 rounded-md w-full">
          <FileTextIcon size={16} />
          Tipo de seção desconhecido ou corrompido: <b>{(section as any).type}</b>
        </div>
      );
  }
}