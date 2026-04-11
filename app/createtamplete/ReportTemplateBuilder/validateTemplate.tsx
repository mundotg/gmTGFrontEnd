import {
  Section,
  ValidationError,
  HeaderSectionData,
  TextSectionData,
  TableSectionData,
  ImageSectionData,
  ListSectionData,
  FooterSectionData,
  LineSectionData,
  SpacerSectionData
} from "../types";

/**
 * Valida as seções de um template (incluindo filhos aninhados infinitamente)
 * e retorna uma lista de erros.
 * Cada erro contém o ID da seção, seu índice (relativo ao seu array pai) e uma mensagem.
 */
export const validateTemplate = (sections: Section[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  const addError = (id: string, index: number, message: string) => {
    errors.push({ sectionId: id, sectionIndex: index, message });
  };

  // 🔥 Função recursiva que varre todos os nós e seus filhos
  const validateNodes = (nodeList: Section[]) => {
    nodeList.forEach((section, index) => {
      const { id, type, children } = section;

      switch (type) {
        case "header": {
          const data = section.data as HeaderSectionData;
          if (!data.title?.trim()) {
            addError(id, index, "O cabeçalho deve conter um título.");
          }
          if (data.subtitle !== undefined && !data.subtitle.trim()) {
            addError(id, index, "O subtítulo do cabeçalho não pode estar vazio.");
          }
          break;
        }

        case "text": {
          const data = section.data as TextSectionData;
          if (!data.value?.trim()) {
            addError(id, index, "O bloco de texto deve conter conteúdo.");
          }
          break;
        }

        case "table": {
          const data = section.data as TableSectionData;
          if (!data.columns?.length) {
            addError(id, index, "A tabela deve possuir pelo menos uma coluna.");
          } else if (data.columns.some((c) => !c.trim())) {
            addError(id, index, "Os nomes das colunas não podem estar vazios.");
          }

          if (!data.rows?.length) {
            addError(id, index, "A tabela deve possuir pelo menos uma linha.");
          } else if (
            data.rows.some(
              // O TS agora sabe que row é string[] e data.columns é string[]
              (row) => !Array.isArray(row) || row.length !== data.columns.length
            )
          ) {
            addError(
              id,
              index,
              "Todas as linhas devem ter o mesmo número de células que as colunas."
            );
          }
          break;
        }

        case "image": {
          const data = section.data as ImageSectionData;
          if (!data.path?.trim()) {
            addError(id, index, "A imagem deve possuir um caminho ou URL válido.");
          }
          if (!data.width || !data.height) {
            addError(id, index, "A imagem deve possuir largura e altura definidas.");
          }
          break;
        }

        case "list": {
          const data = section.data as ListSectionData;
          if (!data.items?.length) {
            addError(id, index, "A lista deve possuir pelo menos um item.");
          } else if (data.items.some((item) => !item.trim())) {
            addError(id, index, "Os itens da lista não podem estar vazios.");
          }
          break;
        }

        case "footer": {
          const data = section.data as FooterSectionData;
          const hasContent =
            data.left?.trim() || data.center?.trim() || data.right?.trim();
          if (!hasContent) {
            addError(id, index, "O rodapé deve conter pelo menos um campo preenchido.");
          }
          break;
        }

        case "line": {
          const data = section.data as LineSectionData;
          if (!data.color?.trim()) {
            addError(id, index, "A linha deve ter uma cor definida.");
          }
          if (!data.thickness && !data.width) {
            addError(id, index, "A linha deve ter uma espessura definida.");
          }
          break;
        }

        case "spacer": {
          const data = section.data as SpacerSectionData;
          if (!data.height || data.height <= 0) {
            addError(id, index, "O espaçamento deve ter uma altura positiva.");
          }
          break;
        }

        case "container":
        case "pagebreak": {
          // Nenhuma validação de dados obrigatória nestes casos
          break;
        }

        default: {
          addError(id, index, `Tipo de seção desconhecido: ${type}`);
        }
      }

      // 🔥 Validação recursiva dos filhos
      if (children && children.length > 0) {
        validateNodes(children);
      }
    });
  };

  validateNodes(sections);

  return errors;
};