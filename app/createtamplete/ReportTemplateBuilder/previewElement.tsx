import {
  Section,
  SectionType,
  HeaderSectionData,
  TextSectionData,
  ImageSectionData,
  TableSectionData,
  ListSectionData,
  LineSectionData,
  SpacerSectionData,
  FooterSectionData,
  PageBreakSectionData,
  ContainerSectionData
} from "../types";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const truncate = (text?: string, max = 40): string => {
  if (!text?.trim()) return "";
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max) + "..." : clean;
};

const count = (n?: number) => n ?? 0;

const px = (n?: number | string, unit = "") => (n ? `${n}${unit}` : "");

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
      const data = section.data as HeaderSectionData;
      const title = truncate(data.title) || "Sem título";
      return `🧾 ${title}${style}`;
    }

    case "text": {
      const data = section.data as TextSectionData;
      const text = truncate(data.value) || "Texto vazio";
      return `📝 ${text}${style}`;
    }

    case "table": {
      const data = section.data as TableSectionData;
      const cols = count(data.columns?.length);
      const rows = count(data.rows?.length);
      const base = cols || rows ? `📊 ${cols}x${rows}` : "📊 Tabela vazia";
      return `${base}${style}`;
    }

    case "image": {
      const data = section.data as ImageSectionData;
      const size = data.width || data.height
        ? ` (${px(data.width, "cm")} x ${px(data.height, "cm")})`
        : "";
      return data.path ? `🖼️ Imagem${size}${style}` : `🖼️ Sem imagem${style}`;
    }

    case "list": {
      const data = section.data as ListSectionData;
      const items = count(data.items?.length);
      return items
        ? `📋 ${items} item${items > 1 ? "s" : ""}${style}`
        : `📋 Lista vazia${style}`;
    }

    case "line": {
      const data = section.data as LineSectionData;
      const thickness = data.thickness ? `${data.thickness}px` : "auto";
      const lineStyle = data.style ?? "solid";
      return `➖ Linha ${lineStyle} (${thickness})${style}`;
    }

    case "spacer": {
      const data = section.data as SpacerSectionData;
      return `⬜ Espaço ${data.height}cm${style}`;
    }

    case "footer": {
      const data = section.data as FooterSectionData;
      const center = truncate(data.center);
      return center ? `📎 ${center}${style}` : `📎 Rodapé${style}`;
    }

    case "pagebreak": {
      const data = section.data as PageBreakSectionData;
      const label = truncate(data.label);
      return label ? `📄 ${label} (quebra)` : "📄 Quebra de página";
    }

    case "container": {
      const data = section.data as ContainerSectionData;
      const childrenCount = count(section.children?.length);
      const direction = data.direction === "row" ? "Horizontal" : "Vertical";
      return `📦 Bloco ${direction} (${childrenCount} itens)${style}`;
    }

    default:
      return (section as any).type || "Seção Desconhecida";
  }
}