"use client";

import usePersistedState from "@/hook/localStoreUse";
import { useCallback, useState } from "react";

type DragPayload =
    | { type: "token"; value: string; fromField?: string; index?: number }
    | { type: "line"; value: string[] }
    | { type: "lineblock"; value: string };

type UseTokenMapperProps = {
    valuesDefault?: Record<string, string>;
};

export function useTokenMapper({ valuesDefault }: UseTokenMapperProps = {}) {
    const [mappedTokens, setMappedTokens] = usePersistedState<Record<string, string[]>>(
        "_mapped_tokens_modal",
        {}
    );

    const [manualValues, setManualValues] = usePersistedState<Record<string, string>>(
        "_form_values_modal",
        valuesDefault || {}
    );
    const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
    const [dragOverField, setDragOverField] = useState<string | null>(null);

    /* ---------------- VALUE RESOLVER ---------------- */
    const buildMappedValue = useCallback(
        (field: string) => {
            return (mappedTokens[field] || []).join(" ");
        },
        [mappedTokens]
    );

    const getFieldValue = useCallback(
        (field: string) => {
            if (manualValues[field] !== undefined) return manualValues[field];

            const mapped = buildMappedValue(field);
            if (mapped) return mapped;

            return valuesDefault?.[field] ?? "";
        },
        [manualValues, buildMappedValue, valuesDefault]
    );

    /* ---------------- HELPERS ---------------- */
    const clearManualOverride = useCallback((field: string) => {
        setManualValues((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    /* ---------------- ACTIONS ---------------- */
    const addTokens = useCallback((field: string, tokens: string[]) => {
        setMappedTokens((prev) => ({
            ...prev,
            [field]: [...(prev[field] || []), ...tokens],
        }));
        clearManualOverride(field);
    }, [clearManualOverride]);

    const removeToken = useCallback((field: string, index: number) => {
        setMappedTokens((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
        clearManualOverride(field);
    }, [clearManualOverride]);

    const updateToken = useCallback((field: string, index: number, value: string) => {
        setMappedTokens((prev) => ({
            ...prev,
            [field]: prev[field].map((t, i) => (i === index ? value : t)),
        }));
        clearManualOverride(field);
    }, [clearManualOverride]);

    const clearFieldTokens = useCallback((field: string) => {
        setMappedTokens((prev) => ({
            ...prev,
            [field]: [],
        }));
        clearManualOverride(field);
    }, [clearManualOverride]);

    const mergeSelectedTokens = useCallback(
        (field: string) => {
            const fieldTokens = mappedTokens[field] || [];

            const validSelected = selectedTokens.filter((t) =>
                fieldTokens.includes(t)
            );

            if (validSelected.length < 2) return;

            const merged = validSelected.join(" ");

            setMappedTokens((prev) => ({
                ...prev,
                [field]: [
                    ...fieldTokens.filter((t) => !validSelected.includes(t)),
                    merged,
                ],
            }));

            setSelectedTokens((prev) =>
                prev.filter((t) => !validSelected.includes(t))
            );

            clearManualOverride(field);
        },
        [mappedTokens, selectedTokens, clearManualOverride]
    );

    /* ---------------- DRAG ---------------- */
    const handleDragStart = useCallback(
        (e: React.DragEvent, payload: DragPayload) => {
            e.dataTransfer.setData("data", JSON.stringify(payload));
            e.dataTransfer.effectAllowed = "move";
        },
        []
    );

    const handleDropField = useCallback(
        (e: React.DragEvent, field: string) => {
            e.preventDefault();

            const raw = e.dataTransfer.getData("data");
            if (!raw) return;

            const payload: DragPayload = JSON.parse(raw);

            // 👉 REORDER
            if (payload.type === "token" && payload.fromField === field) {
                const fromIndex = payload.index;
                const toIndex = Number((e.target as HTMLElement).dataset.index);

                if (fromIndex === undefined || isNaN(toIndex)) return;

                setMappedTokens((prev) => {
                    const list = [...(prev[field] || [])];
                    const [moved] = list.splice(fromIndex, 1);
                    list.splice(toIndex, 0, moved);

                    return {
                        ...prev,
                        [field]: list,
                    };
                });

                return;
            }

            // 👉 NORMAL DROP
            if (payload.type === "token") addTokens(field, [payload.value]);
            if (payload.type === "line") addTokens(field, payload.value);
            if (payload.type === "lineblock") addTokens(field, [payload.value]);

            setDragOverField(null);
        },
        [addTokens]
    );

    /* ---------------- RETURN ---------------- */
    return {
        // state
        mappedTokens,
        manualValues,
        selectedTokens,
        dragOverField,

        // setters
        setManualValues,
        setSelectedTokens,
        setDragOverField,

        // utils
        getFieldValue,
        buildMappedValue,

        // actions
        addTokens,
        removeToken,
        updateToken,
        clearFieldTokens,
        mergeSelectedTokens,

        // drag
        handleDragStart,
        handleDropField,
    };
}