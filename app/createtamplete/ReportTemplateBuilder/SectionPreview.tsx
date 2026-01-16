import {
  ImageIcon,
  FileTextIcon,
  SeparatorHorizontalIcon,
} from "lucide-react";
import { Section } from "../types";

export function SectionPreview({ section }: { section: Section }) {
  const renderPlaceholder = (text: string) => (
    <span className="text-slate-400 italic">{text}</span>
  );

  switch (section.type) {
    case "header":
      return (
        <div className="text-center py-2 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {section.data.title || renderPlaceholder("Título principal")}
          </h2>
          {section.data.subtitle && (
            <p className="text-slate-500 text-sm mt-1">
              {section.data.subtitle}
            </p>
          )}
        </div>
      );

    case "text":
      return (
        <div
          style={{ textAlign: section.data?.align }}
          className={`prose text-sm text-slate-700 ${
            section.data?.bold ? "font-semibold" : ""
          }`}
        >
          {section.data?.value || renderPlaceholder("Texto de conteúdo")}
        </div>
      );

    case "table":
      return (
        <div className="overflow-auto border border-slate-200 rounded-md">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                {(section.data.columns || []).map((col: string, i: number) => (
                  <th
                    key={i}
                    className="border border-slate-300 px-3 py-2 text-left font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(section.data.rows || []).map((row, ri: number) => (
                <tr
                  key={ri}
                  className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  {row.map((cell, ci: number) => (
                    <td
                      key={ci}
                      className="border border-slate-200 px-3 py-2 text-slate-700"
                    >
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <div className="flex flex-col items-center text-center p-3 border border-dashed border-slate-300 rounded-md">
          <ImageIcon size={40} className="text-slate-300 mb-2" />
          <p className="text-xs text-slate-500">
            {section.data.path || renderPlaceholder("Caminho da imagem")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {section.data.width || "—"}cm × {section.data.height || "—"}cm
          </p>
        </div>
      );

    case "list":
      return (
        <ul className="list-none space-y-1 text-sm text-slate-700">
          {(section.data.items || []).length > 0 ? (
            section.data.items.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-600">{section.data.bullet || "•"}</span>
                <span>{item}</span>
              </li>
            ))
          ) : (
            renderPlaceholder("Lista vazia")
          )}
        </ul>
      );

    case "line":
      return (
        <hr
          style={{
            borderColor: section.data.color,
            borderWidth: section.data.width,
          }}
          className="my-2"
        />
      );

    case "spacer":
      return (
        <div
          style={{ height: `${section.data.height}cm` }}
          className="bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 rounded"
        >
          Espaço: {section.data.height || "—"}cm
        </div>
      );

    case "footer":
      return (
        <footer className="grid grid-cols-3 gap-4 text-xs text-slate-600 border-t border-slate-200 pt-2 mt-2">
          <div className="text-left">
            {section.data.left || renderPlaceholder("Esquerda")}
          </div>
          <div className="text-center">
            {section.data.center || renderPlaceholder("Centro")}
          </div>
          <div className="text-right">
            {section.data.right || renderPlaceholder("Direita")}
          </div>
        </footer>
      );

    case "pagebreak":
      return (
        <div className="border-2 border-dashed border-slate-300 bg-slate-50 py-3 text-center text-xs text-slate-400 rounded-md">
          <SeparatorHorizontalIcon size={14} className="inline mr-1" />
          Quebra de Página
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <FileTextIcon size={16} />
          Tipo de seção desconhecido
        </div>
      );
  }
}
