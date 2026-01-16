import { Section } from "../types";
import { generateId } from "../ultils";

/**
 * Gera o template padrão de relatório do OrionForgeNexus (oFn).
 * Compatível com o tipo discriminado Section.
 */
export const generateDefaultTemplate = (): Section[] => [
  {
    id: generateId(),
    type: "header",
    data: {
      title: "Relatório Executivo",
      subtitle: "Análise de Desempenho - Q4 2025",
    },
  },
  {
    id: generateId(),
    type: "text",
    data: {
      value:
        "Este relatório apresenta uma visão consolidada dos principais indicadores de desempenho do período.",
    },
  },
  {
    id: generateId(),
    type: "spacer",
    data: {
      height: 0.5,
    },
  },
  {
    id: generateId(),
    type: "table",
    data: {
      columns: ["Departamento", "Meta", "Realizado", "% Atingido"],
      rows: [
        ["Vendas", "R$ 800.000", "R$ 850.000", "106%"],
        ["Marketing", "R$ 200.000", "R$ 195.000", "97%"],
        ["Operações", "R$ 250.000", "R$ 205.000", "82%"],
      ],
    },
  },
  {
    id: generateId(),
    type: "spacer",
    data: {
      height: 0.5,
    },
  },
  {
    id: generateId(),
    type: "text",
    data: {
      value: "Próximas Ações:",
    },
  },
  {
    id: generateId(),
    type: "list",
    data: {
      items: [
        "Expandir equipe comercial",
        "Implementar novo CRM",
        "Otimizar processos operacionais",
      ],
    },
  },
  {
    id: generateId(),
    type: "footer",
    data: {
      left: "OrionForgeNexus (oFn)",
      center: "Confidencial",
      right: new Date().toLocaleDateString("pt-BR"),
    },
  },
];
