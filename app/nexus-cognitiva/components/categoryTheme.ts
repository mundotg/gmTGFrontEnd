/**
 * Sistema centralizado de tokens de cores por categoria — Nexus Cognitiva
 * Conforme especificado na Seção 6 da Identidade Visual.
 *
 * As cores são aplicadas em:
 * - Etiquetas de categoria
 * - Ícones e indicadores visuais
 * - Estados ativos dos filtros
 * - Pequenos elementos de destaque
 * (Sem pintar o cartão inteiro, preservando fundos neutros e alto contraste)
 */

export interface CategoryToken {
  name: string;
  color: string;
  lightBg: string;
  lightBorder: string;
  lightText: string;
  darkBg: string;
  darkBorder: string;
  darkText: string;
  // Conveniência para estilização rápida
  border?: string;
  bgLight?: string;
}

export const CATEGORY_TOKENS: Record<string, CategoryToken> = {
  "Ciência e tecnologia": {
    name: "Ciência e tecnologia",
    color: "#2563EB",
    lightBg: "#EFF6FF",
    lightBorder: "#BFDBFE",
    lightText: "#1D4ED8",
    darkBg: "rgba(37, 99, 235, 0.15)",
    darkBorder: "rgba(37, 99, 235, 0.35)",
    darkText: "#93C5FD",
  },
  "Psicologia e comportamento humano": {
    name: "Psicologia e comportamento humano",
    color: "#7C3AED",
    lightBg: "#F5F3FF",
    lightBorder: "#DDD6FE",
    lightText: "#6D28D9",
    darkBg: "rgba(124, 58, 237, 0.15)",
    darkBorder: "rgba(124, 58, 237, 0.35)",
    darkText: "#C4B5FD",
  },
  "Saúde e biologia": {
    name: "Saúde e biologia",
    color: "#15803D",
    lightBg: "#F0FDF4",
    lightBorder: "#BBF7D0",
    lightText: "#15803D",
    darkBg: "rgba(21, 128, 61, 0.15)",
    darkBorder: "rgba(21, 128, 61, 0.35)",
    darkText: "#86EFAC",
  },
  "Vida pessoal": {
    name: "Vida pessoal",
    color: "#C2410C",
    lightBg: "#FFF7ED",
    lightBorder: "#FED7AA",
    lightText: "#C2410C",
    darkBg: "rgba(194, 65, 12, 0.15)",
    darkBorder: "rgba(194, 65, 12, 0.35)",
    darkText: "#FDBA74",
  },
  "Relacionamentos": {
    name: "Relacionamentos",
    color: "#BE185D",
    lightBg: "#FDF2F8",
    lightBorder: "#FBCFE8",
    lightText: "#BE185D",
    darkBg: "rgba(190, 24, 93, 0.15)",
    darkBorder: "rgba(190, 24, 93, 0.35)",
    darkText: "#F472B6",
  },
  "Vida profissional": {
    name: "Vida profissional",
    color: "#0F766E",
    lightBg: "#F0FDFA",
    lightBorder: "#99F6E4",
    lightText: "#0F766E",
    darkBg: "rgba(15, 118, 110, 0.15)",
    darkBorder: "rgba(15, 118, 110, 0.35)",
    darkText: "#5EEAD4",
  },
  "História e cultura": {
    name: "História e cultura",
    color: "#92400E",
    lightBg: "#FFFBEB",
    lightBorder: "#FDE68A",
    lightText: "#92400E",
    darkBg: "rgba(146, 64, 14, 0.15)",
    darkBorder: "rgba(146, 64, 14, 0.35)",
    darkText: "#FCD34D",
  },
  "Sociedade e comunidades": {
    name: "Sociedade e comunidades",
    color: "#475569",
    lightBg: "#F8FAFC",
    lightBorder: "#CBD5E1",
    lightText: "#334155",
    darkBg: "rgba(71, 85, 105, 0.2)",
    darkBorder: "rgba(71, 85, 105, 0.4)",
    darkText: "#CBD5E1",
  },
  "Educação e aprendizagem": {
    name: "Educação e aprendizagem",
    color: "#0369A1",
    lightBg: "#F0F9FF",
    lightBorder: "#BAE6FD",
    lightText: "#0369A1",
    darkBg: "rgba(3, 105, 161, 0.15)",
    darkBorder: "rgba(3, 105, 161, 0.35)",
    darkText: "#7DD3FC",
  },
  "Filosofia": {
    name: "Filosofia",
    color: "#6D28D9",
    lightBg: "#FAF5FF",
    lightBorder: "#E9D5FF",
    lightText: "#6D28D9",
    darkBg: "rgba(109, 40, 217, 0.15)",
    darkBorder: "rgba(109, 40, 217, 0.35)",
    darkText: "#D8B4FE",
  },
  "Economia e finanças": {
    name: "Economia e finanças",
    color: "#047857",
    lightBg: "#ECFDF5",
    lightBorder: "#A7F3D0",
    lightText: "#047857",
    darkBg: "rgba(4, 120, 87, 0.15)",
    darkBorder: "rgba(4, 120, 87, 0.35)",
    darkText: "#6EE7B7",
  },
  "Ambiente e natureza": {
    name: "Ambiente e natureza",
    color: "#4D7C0F",
    lightBg: "#F7FEE7",
    lightBorder: "#D9F99D",
    lightText: "#4D7C0F",
    darkBg: "rgba(77, 124, 15, 0.15)",
    darkBorder: "rgba(77, 124, 15, 0.35)",
    darkText: "#BEF264",
  },
};

const DEFAULT_CATEGORY_TOKEN: CategoryToken = {
  name: "Geral",
  color: "#087E8B",
  lightBg: "#F0FDFA",
  lightBorder: "#CCFBF1",
  lightText: "#0F766E",
  darkBg: "rgba(8, 126, 139, 0.15)",
  darkBorder: "rgba(8, 126, 139, 0.35)",
  darkText: "#5EEAD4",
};

/**
 * Obtém o token de cor correspondente a uma categoria (com fallback seguro)
 */
export function getCategoryToken(categoryName?: string): CategoryToken & { border: string; bgLight: string } {
  const token = (!categoryName ? DEFAULT_CATEGORY_TOKEN : CATEGORY_TOKENS[categoryName] || DEFAULT_CATEGORY_TOKEN);
  return {
    ...token,
    border: token.lightBorder,
    bgLight: token.lightBg,
  };
}
