// ============================================================================
// SECTION PREVIEW TEXT (TIPADO + INTELIGENTE)
// ============================================================================

import { Section } from "../types";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const truncate = (text?: string, max = 40): string => {
  if (!text?.trim()) return "";
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max) + "..." : clean;
};

const count = (n?: number) => n ?? 0;

const px = (n?: number, unit = "") => (n ? `${n}${unit}` : "");

const styleHint = (section: Section): string => {
  const s = section.style;
  if (!s) return "";

  const parts: string[] = [];

  if (s.width) parts.push(`${s.width}cm`);
  if (s.height) parts.push(`${s.height}cm`);
  if (s.align) parts.push(s.align);

  return parts.length ? ` • ${parts.join(" / ")}` : "";
};

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
export function getSectionPreview(section: Section): string {
  const style = styleHint(section);

  switch (section.type) {
    case "header": {
      const title = truncate(section.data.title) || "Sem título";
      return `🧾 ${title}${style}`;
    }

    case "text": {
      const text = truncate(section.data.value) || "Texto vazio";
      return `📝 ${text}${style}`;
    }

    case "table": {
      const cols = count(section.data.columns?.length);
      const rows = count(section.data.rows?.length);

      const base =
        cols || rows
          ? `📊 ${cols}x${rows}`
          : "📊 Tabela vazia";

      return `${base}${style}`;
    }

    case "image": {
      const path = section.data.path;
      const size =
        section.data.width || section.data.height
          ? ` (${px(section.data.width, "cm")} x ${px(
              section.data.height,
              "cm"
            )})`
          : "";

      return path
        ? `🖼️ Imagem${size}${style}`
        : `🖼️ Sem imagem${style}`;
    }

    case "list": {
      const items = count(section.data.items?.length);
      return items
        ? `📋 ${items} item${items > 1 ? "s" : ""}${style}`
        : `📋 Lista vazia${style}`;
    }

    case "line": {
      const thickness = section.data.thickness
        ? `${section.data.thickness}px`
        : "auto";

      const type = section.data.style ?? "solid";

      return `➖ Linha ${type} (${thickness})${style}`;
    }

    case "spacer": {
      return `⬜ Espaço ${section.data.height}cm${style}`;
    }

    case "footer": {
      const center = truncate(section.data.center);
      return center
        ? `📎 ${center}${style}`
        : `📎 Rodapé${style}`;
    }

    case "pagebreak": {
      const label = truncate(section.data.label);
      return label
        ? `📄 ${label} (quebra)`
        : "📄 Quebra de página";
    }

    default:
      return section.type;
  }
}