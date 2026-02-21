"use client";

import React, { useMemo, useCallback } from "react";

type GridListProps<T> = {
  items: T[];
  columns?: { base?: number; md?: number }; // ex: { base: 1, md: 2 }
  empty?: React.ReactNode;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
};

export function GridList<T>({
  items,
  columns = { base: 1, md: 2 },
  empty,
  getKey,
  renderItem,
  className,
}: GridListProps<T>) {
  const gridColsClass = useMemo(() => {
    const base = columns.base ?? 1;
    const md = columns.md ?? base;
    // grid-cols-1 md:grid-cols-2
    return `grid grid-cols-${base} md:grid-cols-${md} gap-3 p-4`;
  }, [columns.base, columns.md]);

  const Render = useCallback(() => {
    if (!items.length) {
      return (
        empty ?? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Nenhum item encontrado.
          </div>
        )
      );
    }

    return (
      <div className={gridColsClass}>
        {items.map((item, index) => (
          <React.Fragment key={getKey(item, index)}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    );
  }, [items, empty, gridColsClass, getKey, renderItem]);

  return (
    <div
      className={`max-h-96 overflow-y-auto border border-gray-200 rounded-lg ${className ?? ""}`}
    >
      <Render />
    </div>
  );
}
