import { Section } from "../types";
import { generateId } from "../ultils";

/**
 * Template padrão premium do OrionForgeNexus (oFn)
 * Focado em relatórios executivos profissionais
 */
export const generateDefaultTemplate = (): Section[] => [
  {
    id: generateId(),
    type: "header",
    data: {
      title: "RELATÓRIO EXECUTIVO",
      subtitle: "Análise de Desempenho • Q4 2025",
      align: "center",
    },
  },
  {
    id: generateId(),
    type: "spacer",
    data: { height: 0.3 },
  },
  {
    id: generateId(),
    type: "spacer",
    data: { height: 0.5 },
  },
  {
    id: generateId(),
    type: "text",
    data: {
      value: "Resumo de Performance",
      bold: true,
    },
  },
  {
    id: generateId(),
    type: "line",
    data: {},
  },
  {
    id: generateId(),
    type: "table",
    data: {
      columns: ["Departamento", "Meta", "Realizado", "% Atingido"],
      rows: [
        ["Vendas", "800.000 Kz", "850.000 Kz", "106%"],
        ["Marketing", "200.000 Kz", "195.000 Kz", "97%"],
        ["Operações", "250.000 Kz", "205.000 Kz", "82%"],
      ],
    },
  },
  {
    id: generateId(),
    type: "spacer",
    data: { height: 0.6 },
  },
  {
    id: generateId(),
    type: "text",
    data: {
      value: "Análise Geral",
      bold: true,
    },
  },
  {
    id: generateId(),
    type: "spacer",
    data: { height: 0.5 },
  },
  {
    id: generateId(),
    type: "text",
    data: {
      value: "Próximas Ações",
      bold: true,
    },
  },
  {
    id: generateId(),
    type: "list",
    data: {
      items: [
        "Expandir a equipe comercial para suportar crescimento",
        "Implementar um novo sistema de CRM",
        "Reestruturar processos operacionais críticos",
      ],
    },
  },
  {
    id: generateId(),
    type: "spacer",
    data: { height: 1 },
  },
  
  // 🔥 NOVO: Container de Assinaturas (Exemplo de filhos aninhados)
  {
    id: generateId(),
    type: "container",
    data: { 
      direction: "row", // Coloca os itens lado a lado
      gap: 16 
    },
    children: [
      {
        id: generateId(),
        type: "text",
        data: { value: "__________________________\nPreparado por", align: "center", bold: true },
      },
      {
        id: generateId(),
        type: "text",
        data: { value: "__________________________\nAprovado por", align: "center", bold: true },
      }
    ]
  },

  {
    id: generateId(),
    type: "spacer",
    data: { height: 1 },
  },
  {
    id: generateId(),
    type: "line",
    data: {},
  },
  {
    id: generateId(),
    type: "footer",
    data: {
      left: "OrionForgeNexus (oFn)",
      center: "Documento Confidencial",
      right: new Date().toLocaleDateString("pt-PT"),
    },
  },
];