import {
  SectionType,
  HeaderSectionData,
  TextSectionData,
  TableSectionData,
  ImageSectionData,
  ListSectionData,
  LineSectionData,
  SpacerSectionData,
  FooterSectionData,
  PageBreakSectionData,
} from "../types";

// 🔥 MAPEAMENTO TIPADO
type SectionDataMap = {
  header: HeaderSectionData;
  text: TextSectionData;
  table: TableSectionData;
  image: ImageSectionData;
  list: ListSectionData;
  line: LineSectionData;
  spacer: SpacerSectionData;
  footer: FooterSectionData;
  pagebreak: PageBreakSectionData;
};

// ✅ FUNÇÃO CORRETA (GENÉRICA)
export function defaultSectionData<T extends SectionType>(
  type: T
): SectionDataMap[T] {
  const defaults: SectionDataMap = {
    header: {
      title: "Novo Relatório",
      subtitle: "Subtítulo do documento",
      logo: false,
      title_size: 20,
      subtitle_size: 12,
      align: "left",
    },

    text: {
      value: "Digite seu texto aqui...",
      align: "left",
      size: 11,
      bold: false,
      italic: false,
      underline: false,
      color: "#334155",
    },

    table: {
      columns: ["Coluna 1", "Coluna 2"],
      rows: [["A", "B"]],
      header: true,
      border: true,
      colWidths: [],
    },

    image: {
      path: "",
      width: 10,
      height: 5,
      fit: "contain",
      opacity: 1,
    },

    list: {
      items: ["Item 1"],
      bullet: "•",
      spacing: 1,
    },

    line: {
      style: "solid",
      color: "#cbd5e1",
      thickness: 1,
    },

    spacer: {
      height: 1,
    },

    footer: {
      left: "",
      center: "",
      right: "",
      size: 10,
    },

    pagebreak: {
      label: "",
    },
  };

  return defaults[type];
}