// ============================================================================
// TYPES — Estrutura discriminada para cada tipo de seção
// ============================================================================

export type SectionType =
  | "header"
  | "text"
  | "table"
  | "image"
  | "list"
  | "line"
  | "spacer"
  | "footer"
  | "pagebreak"
  | "container"; // 🔥 NOVO


// 🎯 Estilo universal para TODAS as seções
export interface BaseStyle {
  width?: number;      // cm
  height?: number;     // cm

  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;

  padding?: number;

  align?: "left" | "center" | "right";

  backgroundColor?: string;

  border?: boolean;
  borderColor?: string;
  borderWidth?: number;

  radius?: number;

  x?: number; // futuro drag absoluto
  y?: number;
}
// -----------------------------
// Estruturas específicas de dados
// -----------------------------

export interface HeaderSectionData {
  title: string;
  subtitle?: string;
  logo?: boolean;
  title_size?: number;
  subtitle_size?: number;
  align?: "left" | "center" | "right" | "justify";
}

export interface TextSectionData {
  value: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
  color?: string;
}

export interface TableSectionData {
  columns: string[];
  rows: string[][];
  header?: boolean;
  border?: boolean;
  colWidths?: number[];
}

export interface ImageSectionData {
  path: string;
  width?: number | string;
  height?: number;
  fit?: "contain" | "cover" | "fill";
  opacity?: number;
}

export interface ListSectionData {
  items: string[];
  bullet?: string;
  spacing?: number; // 🔥 espaço entre itens
}

export interface LineSectionData {
  style?: "solid" | "dashed" | "dotted";
  color?: string;
  width?: number | string;
  thickness?: number; // 🔥 melhor nome que width
}

export interface SpacerSectionData {
  height: number;
}

export interface FooterSectionData {
  left?: string;
  center?: string;
  right?: string;
  size?: number;
}

export interface PageBreakSectionData {
  label?: string; // Texto opcional exibido antes da quebra de página
}

export interface ContainerSectionData {
  direction: "column" | "row";
  gap: number; // espaço entre os filhos
}

// -----------------------------
// Tipos discriminados
// -----------------------------


export type SectionDataType = HeaderSectionData | TextSectionData | TableSectionData | ImageSectionData | ListSectionData | LineSectionData | SpacerSectionData | FooterSectionData | PageBreakSectionData | ContainerSectionData
export type Section = {
  id: string;
  type: SectionType;
  data: SectionDataType;
  style?: BaseStyle;

  // 🔥 NOVO
  children?: Section[];
};
// ============================================================================
// ERROS DE VALIDAÇÃO
// ============================================================================

export interface ValidationError {
  sectionId: string;
  sectionIndex: number;
  message: string;
}
