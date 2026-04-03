import {
  ImageIcon,
  FileTextIcon,
  SeparatorHorizontalIcon,
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
} from "../types";

interface Props {
  section: Section;
}

export function SectionPreview({ section }: Props) {
  const renderPlaceholder = (text: string) => (
    <span className="text-slate-300 italic">{text}</span>
  );

  switch (section.type) {
    // ============================================================
    // HEADER
    // ============================================================
    case "header": {
      const data: HeaderSectionData = section.data;

      return (
        <div className="text-center py-3 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {data.title || renderPlaceholder("Título principal")}
          </h2>

          {data.subtitle && (
            <p className="text-slate-500 text-sm mt-1">
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
      const data: TextSectionData = section.data;

      return (
        <div
          style={{ textAlign: data.align ?? "left" }}
          className={`text-sm leading-relaxed text-slate-700 ${
            data.bold ? "font-semibold" : ""
          }`}
        >
          {data.value || renderPlaceholder("Texto de conteúdo")}
        </div>
      );
    }

    // ============================================================
    // TABLE
    // ============================================================
    case "table": {
      const data: TableSectionData = section.data;

      return (
        <div className="overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                {(data.columns ?? []).map((col, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-semibold border-b border-slate-200"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(data.rows ?? []).map((row, ri) => (
                <tr
                  key={ri}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2 border-b border-slate-100 text-slate-700"
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
      const data: ImageSectionData = section.data;

      return (
        <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
          <ImageIcon size={36} className="text-slate-300 mb-2" />

          <p className="text-xs text-slate-500 truncate max-w-[200px]">
            {data.path || renderPlaceholder("Caminho da imagem")}
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
      const data: ListSectionData = section.data;

      return (
        <ul className="space-y-1 text-sm text-slate-700">
          {(data.items ?? []).length > 0 ? (
            data.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-[2px]">
                  {data.bullet ?? "•"}
                </span>
                <span className="leading-snug">{item}</span>
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
      const data: LineSectionData = section.data;

      return (
        <div className="py-2">
          <hr
            style={{
              borderColor: data.color ?? "#e2e8f0",
              borderWidth: data.thickness ?? 1,
              borderStyle: data.style ?? "solid",
            }}
          />
        </div>
      );
    }

    // ============================================================
    // SPACER
    // ============================================================
    case "spacer": {
      const data: SpacerSectionData = section.data;

      return (
        <div
          style={{ height: `${data.height ?? 0.5}cm` }}
          className="flex items-center justify-center text-[10px] text-slate-400 border border-dashed border-slate-300 bg-slate-50 rounded-md"
        >
          Espaço: {data.height ?? "—"}cm
        </div>
      );
    }

    // ============================================================
    // FOOTER
    // ============================================================
    case "footer": {
      const data: FooterSectionData = section.data;

      return (
        <footer className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 border-t border-slate-200 pt-3 mt-3">
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
    // PAGE BREAK
    // ============================================================
    case "pagebreak":
      return (
        <div className="flex items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 py-3 rounded-md text-xs text-slate-400">
          <SeparatorHorizontalIcon size={14} />
          Quebra de Página
        </div>
      );

    // ============================================================
    // DEFAULT (Nunca deve acontecer)
    // ============================================================
    default:
      return (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <FileTextIcon size={16} />
          Tipo de seção desconhecido
        </div>
      );
  }
}