import { SectionType } from "../types";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultSectionData = (type: SectionType): Record<SectionType, any> => {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaults: Record<SectionType, any> = {
    header: {
      title: "Novo Relatório",
      subtitle: "Subtítulo do documento",
      logo: false,
      title_size: 20,
      subtitle_size: 12,
    },
    text: {
      value: "Digite seu texto aqui...",
      align: "left",
      size: 11,
      bold: false,
      color: "#334155",
    },
    table: {
      columns: ["Coluna 1", "Coluna 2", "Coluna 3"],
      rows: [
        ["Valor A1", "Valor B1", "Valor C1"],
        ["Valor A2", "Valor B2", "Valor C2"],
      ],
      col_widths: null,
      header_color: "#1e3a8a",
      row_colors: ["#ffffff", "#f8fafc"],
    },
    image: {
      path: "https://via.placeholder.com/400x200",
      width: 10,
      height: 5,
      align: "center",
    },
    list: {
      items: ["Item 1", "Item 2", "Item 3"],
      bullet: "•",
    },
    line: {
      color: "#cbd5e1",
      width: 1,
    },
    spacer: {
      height: 1,
    },
    footer: {
      left: "OrionForgeNexus",
      center: "Documento Confidencial",
      right: new Date().toLocaleDateString("pt-BR"),
    },
    pagebreak: {},
  };
  return defaults[type] || {};
};