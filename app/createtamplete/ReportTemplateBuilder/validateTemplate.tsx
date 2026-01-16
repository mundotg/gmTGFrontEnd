import { Section, ValidationError } from "../types";

/**
 * Valida as seções de um template e retorna uma lista de erros.
 * Cada erro contém o ID da seção, seu índice e uma mensagem descritiva.
 */
export const validateTemplate = (sections: Section[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  const addError = (id: string, index: number, message: string) => {
    errors.push({ sectionId: id, sectionIndex: index, message });
  };

  sections.forEach((section, index) => {
    const { id, type, data } = section;

    switch (type) {
      case "header": {
        if (!data.title?.trim()) {
          addError(id, index, "O cabeçalho deve conter um título.");
        }
        if (data.subtitle && !data.subtitle.trim()) {
          addError(id, index, "O subtítulo do cabeçalho não pode estar vazio.");
        }
        break;
      }

      case "text": {
        if (!data.value?.trim()) {
          addError(id, index, "O bloco de texto deve conter conteúdo.");
        }
        break;
      }

      case "table": {
        if (!data.columns?.length) {
          addError(id, index, "A tabela deve possuir pelo menos uma coluna.");
        } else if (data.columns.some((c: string) => !c.trim())) {
          addError(id, index, "Os nomes das colunas não podem estar vazios.");
        }

        if (!data.rows?.length) {
          addError(id, index, "A tabela deve possuir pelo menos uma linha.");
        } else if (
          data.rows.some(
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
        if (!data.path?.trim()) {
          addError(id, index, "A imagem deve possuir um caminho ou URL válido.");
        }
        if (!data.width || !data.height) {
          addError(id, index, "A imagem deve possuir largura e altura definidas.");
        }
        break;
      }

      case "list": {
        if (!data.items?.length) {
          addError(id, index, "A lista deve possuir pelo menos um item.");
        } else if (data.items.some((item: string) => !item.trim())) {
          addError(id, index, "Os itens da lista não podem estar vazios.");
        }
        break;
      }

      case "footer": {
        const hasContent =
          data.left?.trim() || data.center?.trim() || data.right?.trim();
        if (!hasContent) {
          addError(id, index, "O rodapé deve conter pelo menos um campo preenchido.");
        }
        break;
      }

      case "line": {
        if (!data.color?.trim()) {
          addError(id, index, "A linha deve ter uma cor definida.");
        }
        if (!data.width) {
          addError(id, index, "A linha deve ter uma espessura definida.");
        }
        break;
      }

      case "spacer": {
        if (!data.height || data.height <= 0) {
          addError(id, index, "O espaçamento deve ter uma altura positiva.");
        }
        break;
      }

      case "pagebreak": {
        // Nenhuma validação necessária neste caso
        break;
      }

      default: {
        addError(id, index, `Tipo de seção desconhecido: ${type}`);
      }
    }
  });

  return errors;
};
