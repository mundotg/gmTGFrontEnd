import { useState } from "react";

export function useJoinOrderDragDrop(initial: string[] = []) {
  const [joinOrder, setJoinOrder] = useState<string[]>(initial);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Início do drag
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // Hover enquanto arrasta
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Soltar o item
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newOrder = [...joinOrder];
    const draggedItem = newOrder[draggedIndex];

    // Remove da posição original
    newOrder.splice(draggedIndex, 1);
    // Insere na nova posição
    newOrder.splice(dropIndex, 0, draggedItem);

    setJoinOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Mover manualmente (setas ↑ ↓)
  const moveTable = (index: number, direction: "up" | "down") => {
    const newOrder = [...joinOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [
        newOrder[targetIndex],
        newOrder[index],
      ];
      setJoinOrder(newOrder);
    }
  };

  return {
    joinOrder,
    setJoinOrder,
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    moveTable,
  };
}
