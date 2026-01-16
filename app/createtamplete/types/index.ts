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
  | "pagebreak";

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
}

export interface ImageSectionData {
  path: string;
  width: number;
  height: number;
}

export interface ListSectionData {
  items: string[];
  bullet?: string;
}

export interface LineSectionData {
  style?: "solid" | "dashed" | "dotted";
  color?: string;
  width?: string
}

export interface SpacerSectionData {
  height: number;
}

export interface FooterSectionData {
  left?: string;
  center?: string;
  right?: string;
}

export interface PageBreakSectionData {
  label?: string; // Texto opcional exibido antes da quebra de página
}

// -----------------------------
// Tipos discriminados
// -----------------------------

export type Section =
  | { id: string; type: "header"; data: HeaderSectionData }
  | { id: string; type: "text"; data: TextSectionData }
  | { id: string; type: "table"; data: TableSectionData }
  | { id: string; type: "image"; data: ImageSectionData }
  | { id: string; type: "list"; data: ListSectionData }
  | { id: string; type: "line"; data: LineSectionData }
  | { id: string; type: "spacer"; data: SpacerSectionData }
  | { id: string; type: "footer"; data: FooterSectionData }
  | { id: string; type: "pagebreak"; data: PageBreakSectionData };

// ============================================================================
// ERROS DE VALIDAÇÃO
// ============================================================================

export interface ValidationError {
  sectionId: string;
  sectionIndex: number;
  message: string;
}
