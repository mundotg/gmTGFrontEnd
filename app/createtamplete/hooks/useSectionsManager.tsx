import { useCallback } from "react";
import { Section, SectionType, BaseStyle } from "../types";
import { generateId } from "../ultils";
import { defaultSectionData } from "../ReportTemplateBuilder/defaultSectionData";

// 🔥 Helper tipado por tipo
type SectionOfType<T extends SectionType> = Extract<Section, { type: T }>;

export function useSectionsManager(
  setSections: React.Dispatch<React.SetStateAction<Section[]>>,
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
) {
  // ============================================================
  // ADD
  // ============================================================
  const addSection = useCallback(
    <T extends SectionType>(type: T) => {
      const newSection: SectionOfType<T> = {
        id: generateId(),
        type,
        data: defaultSectionData(type),
        style: {}, // 🔥 importante já iniciar
      };

      setSections((prev) => [...prev, newSection]);
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
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                data: {
                  ...s.data,
                  ...data,
                },
              }
            : s
        )
      );
    },
    [setSections]
  );

  // ============================================================
  // 🔥 UPDATE STYLE (AQUI ESTÁ O QUE FALTAVA)
  // ============================================================
  const updateSectionStyle = useCallback(
    (id: string, style: Partial<BaseStyle>) => {
      setSections((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                style: {
                  ...(s.style ?? {}), // 🔥 mantém o existente
                  ...style,           // 🔥 aplica update
                },
              }
            : s
        )
      );
    },
    [setSections]
  );

  // ============================================================
  // REMOVE
  // ============================================================
  const removeSection = useCallback(
    (id: string) => {
      setSections((prev) => prev.filter((s) => s.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [setSections, setSelectedId]
  );

  // ============================================================
  // DUPLICATE
  // ============================================================
  const duplicateSection = useCallback(
    (id: string) => {
      setSections((prev) => {
        const index = prev.findIndex((s) => s.id === id);
        if (index === -1) return prev;

        const original = prev[index];

        const newSection: Section = {
          ...original,
          id: generateId(),
          data: structuredClone(original.data),
          style: structuredClone(original.style ?? {}), // 🔥 inclui style
        };

        const updated = [...prev];
        updated.splice(index + 1, 0, newSection);

        setSelectedId(newSection.id);
        return updated;
      });
    },
    [setSections, setSelectedId]
  );

  // ============================================================
  // MOVE
  // ============================================================
  const moveSection = useCallback(
    (from: number, to: number) => {
      setSections((prev) => {
        if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
          return prev;
        }

        const updated = [...prev];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);

        return updated;
      });
    },
    [setSections]
  );

  return {
    addSection,
    updateSection,
    updateSectionStyle, // 🔥 EXPORTA ISSO
    removeSection,
    duplicateSection,
    moveSection,
  };
}