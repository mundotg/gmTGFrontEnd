import { useCallback } from "react";
import { Section, SectionType, BaseStyle, SectionDataType, TextSectionData, HeaderSectionData, TableSectionData, ImageSectionData, SpacerSectionData, ListSectionData } from "../types";
import { generateId } from "../ultils";
import { defaultSectionData } from "../ReportTemplateBuilder/defaultSectionData";

// ============================================================
// 🔥 TYPE HELPER
// ============================================================
type SectionOfType<T extends SectionType> = Extract<Section, { type: T }>;

// ============================================================
// 🔥 HELPERS RECURSIVOS (CORE)
// ============================================================
const updateRecursive = (
  sections: Section[],
  id: string,
  updater: (section: Section) => Section
): Section[] => {
  return sections.map((s) => {
    if (s.id === id) {
      return updater(s);
    }

    if (s.children?.length) {
      return {
        ...s,
        children: updateRecursive(s.children, id, updater),
      };
    }

    return s;
  });
};

const removeRecursive = (sections: Section[], id: string): Section[] => {
  return sections
    .filter((s) => s.id !== id)
    .map((s) =>
      s.children
        ? { ...s, children: removeRecursive(s.children, id) }
        : s
    );
};

// 🔥 Novo Helper: Clona uma seção e recria IDs para todos os filhos (Deep Clone Seguro)
const deepCloneSection = (section: Section): Section => {
  return {
    ...section,
    id: generateId(),
    data: structuredClone(section.data),
    style: structuredClone(section.style ?? {}),
    children: section.children ? section.children.map(deepCloneSection) : undefined,
  };
};

const duplicateRecursive = (sections: Section[], id: string): Section[] => {
  const result: Section[] = [];

  for (const s of sections) {
    if (s.id === id) {
      result.push(s); // Mantém o original
      result.push(deepCloneSection(s)); // Adiciona o clone com novos IDs
    } else {
      result.push({
        ...s,
        children: s.children ? duplicateRecursive(s.children, id) : undefined,
      });
    }
  }

  return result;
};

// ============================================================
// 🔥 VALIDATION SIMPLES (base)
// ============================================================
const validateData = (type: SectionType, data: SectionDataType) => {
  switch (type) {
    case "text":
      return typeof (data as TextSectionData).value === "string";
    case "header":
      return typeof (data as HeaderSectionData).title === "string";;
    case "table":
      return Array.isArray((data as TableSectionData).columns) && Array.isArray((data as TableSectionData).rows);
    case "image":
      return typeof (data as ImageSectionData).path === "string" || !(data as ImageSectionData).path;
    case "list":
      return Array.isArray((data as ListSectionData).items);
    case "spacer":
      return (data as SpacerSectionData).height === undefined || typeof (data as SpacerSectionData).height === "number";
    case "line":
    case "footer":
    case "pagebreak":
    case "container":
      return true;
    default:
      return true;
  }
};

// ============================================================
// 🔥 HOOK
// ============================================================
export function useSectionsManager(
  setSections: React.Dispatch<React.SetStateAction<Section[]>>,
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
) {
  // ============================================================
  // ADD
  // ============================================================
  const addSection = useCallback(
    <T extends SectionType>(type: T, parentId?: string | null) => {
      const newSection = {
        id: generateId(),
        type,
        data: defaultSectionData(type),
        style: {},
        // 🔥 AQUI ESTÁ A MÁGICA: Header, Footer e Container já nascem prontos para receber filhos
        children: ["container", "header", "footer"].includes(type) ? [] : undefined,
      };

      setSections((prev) => {
        if (!parentId) {
          return [...prev, newSection];
        }

        return updateRecursive(prev, parentId, (parent) => {
          if (!parent.children) return parent;

          return {
            ...parent,
            children: [...parent.children, newSection],
          };
        });
      });

      setSelectedId(newSection.id);
    },
    [setSections, setSelectedId]
  );

  // ============================================================
  // UPDATE DATA
  // ============================================================
  const updateSection = useCallback(
    (id: string, data: Partial<Section["data"]>) => {
      setSections((prev) =>
        updateRecursive(prev, id, (s) => {
          const newData = { ...s.data, ...data };

          // 🔥 valida antes de aplicar
          if (!validateData(s.type, newData)) {
            console.warn("❌ Dados inválidos:", s.type, newData);
            return s;
          }

          return {
            ...s,
            data: newData,
          };
        })
      );
    },
    [setSections]
  );

  // ============================================================
  // UPDATE STYLE
  // ============================================================
  const updateSectionStyle = useCallback(
    (id: string, style: Partial<BaseStyle>) => {
      setSections((prev) =>
        updateRecursive(prev, id, (s) => ({
          ...s,
          style: {
            ...(s.style ?? {}),
            ...style,
          },
        }))
      );
    },
    [setSections]
  );

  // ============================================================
  // REMOVE
  // ============================================================
  const removeSection = useCallback(
    (id: string) => {
      setSections((prev) => removeRecursive(prev, id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [setSections, setSelectedId]
  );

  // ============================================================
  // DUPLICATE
  // ============================================================
  const duplicateSection = useCallback(
    (id: string) => {
      setSections((prev) => duplicateRecursive(prev, id));
    },
    [setSections]
  );

  // ============================================================
  // MOVE (Agora suporta root e filhos 🔥)
  // ============================================================
  const moveSection = useCallback(
    (from: number, to: number, parentId?: string | null) => {
      setSections((prev) => {
        // Se a movimentação for na raiz (root)
        if (!parentId) {
          if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;

          const updated = [...prev];
          const [moved] = updated.splice(from, 1);
          updated.splice(to, 0, moved);

          return updated;
        }

        // Se a movimentação for dentro de um container específico
        return updateRecursive(prev, parentId, (parent) => {
          if (!parent.children) return parent;
          if (from < 0 || to < 0 || from >= parent.children.length || to >= parent.children.length) return parent;

          const updatedChildren = [...parent.children];
          const [moved] = updatedChildren.splice(from, 1);
          updatedChildren.splice(to, 0, moved);

          return { ...parent, children: updatedChildren };
        });
      });
    },
    [setSections]
  );

  return {
    addSection,
    updateSection,
    updateSectionStyle,
    removeSection,
    duplicateSection,
    moveSection,
  };
}