import { useCallback } from "react";
import { Section, SectionType } from "../types";
import { generateId } from "../ultils";
import { defaultSectionData } from "../ReportTemplateBuilder/defaultSectionData";

// ============================================================================
// 🧩 Gerenciamento de seções do template
// ============================================================================

export function useSectionsManager(
  setSections: React.Dispatch<React.SetStateAction<Section[]>>,
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
) {
  // ------------------------------------------------------------
  // Adiciona uma nova seção
  // ------------------------------------------------------------
  const addSection = useCallback(
    (type: SectionType) => {
      const newSection = {
        id: generateId(),
        type,
        data: defaultSectionData(type),
      };

      setSections((prev) => [...prev, newSection as Section]);
      setSelectedId(newSection.id);
    },
    [setSections, setSelectedId]
  );

  // ------------------------------------------------------------
  // Atualiza dados de uma seção existente
  // ------------------------------------------------------------
const updateSection = useCallback(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any 
  (id: string, data: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          data: { ...s.data, ...data },
        };
      })
    );
  },
  [setSections]
);

  // ------------------------------------------------------------
  // Remove uma seção
  // ------------------------------------------------------------
  const removeSection = useCallback(
    (id: string) => {
      setSections((prev) => prev.filter((s) => s.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [setSections, setSelectedId]
  );

  // ------------------------------------------------------------
  // Duplica uma seção existente
  // ------------------------------------------------------------
  const duplicateSection = useCallback(
    (id: string) => {
      setSections((prev) => {
        const index = prev.findIndex((s) => s.id === id);
        if (index === -1) return prev;

        const original = prev[index];
        const newSection = {
          id: generateId(),
          type: original.type,
          data: structuredClone(original.data), // evita referências
        };

        const updated = [...prev];
        updated.splice(index + 1, 0, newSection as Section);
        setSelectedId(newSection.id);
        return updated;
      });
    },
    [setSections, setSelectedId]
  );

  // ------------------------------------------------------------
  // Move seção (drag & drop, setas, etc.)
  // ------------------------------------------------------------
  const moveSection = useCallback(
    (from: number, to: number) => {
      setSections((prev) => {
        if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
          console.warn("Índice inválido em moveSection:", { from, to });
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
    removeSection,
    duplicateSection,
    moveSection,
  };
}
