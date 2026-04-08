"use client";

import { useI18n } from "@/context/I18nContext";
import { useMemo, useState } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function HelpModal({ open, onClose }: Props) {
    const { t } = useI18n();
    const [search, setSearch] = useState("");

    const helpItems = useMemo(
        () => [
            {
                icon: "🟦",
                title: t("tokenMapper.help.dragTokenTitle"),
                desc: t("tokenMapper.help.dragTokenDesc"),
            },
            {
                icon: "📦",
                title: t("tokenMapper.help.dragLineTitle"),
                desc: t("tokenMapper.help.dragLineDesc"),
            },
            {
                icon: "✏️",
                title: t("tokenMapper.help.editTokenTitle"),
                desc: t("tokenMapper.help.editTokenDesc"),
            },
            {
                icon: "🧩",
                title: t("tokenMapper.help.mergeTitle"),
                desc:
                    t("tokenMapper.help.mergeDesc") +
                    ` "${t("tokenMapper.actions.merge")}"`,
            },
            {
                icon: "📋",
                title: t("tokenMapper.help.copyTitle"),
                desc: t("tokenMapper.help.copyDesc"),
            },
            {
                icon: "🧹",
                title: t("tokenMapper.help.clearTitle"),
                desc: t("tokenMapper.help.clearDesc"),
            },
            {
                icon: "🧠",
                title: t("tokenMapper.help.autoInputTitle"),
                desc: t("tokenMapper.help.autoInputDesc"),
            },
            {
                icon: "🔀",
                title: "Reordenar tokens",
                desc: "Arrasta tokens dentro do mesmo campo para mudar a ordem.",
            },
        ],
        [t]
    );

    const filteredItems = useMemo(() => {
        if (!search.trim()) return helpItems;

        return helpItems.filter(
            (item) =>
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.desc.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, helpItems]);

    // 👉 AGORA SIM (depois dos hooks)
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl flex flex-col max-h-[80vh]">

                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">
                        {t("tokenMapper.help.title")}
                    </h3>
                    <button onClick={onClose}>✕</button>
                </div>

                <input
                    type="text"
                    placeholder="🔍 Procurar ajuda..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-3 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="text-sm text-gray-600 space-y-3 overflow-y-auto pr-1">
                    {filteredItems.length === 0 && (
                        <p className="text-gray-400 text-center text-xs">
                            Nada encontrado 😅
                        </p>
                    )}

                    {filteredItems.map((item, i) => (
                        <p key={i}>
                            {item.icon} <b>{item.title}</b> {item.desc}
                        </p>
                    ))}
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        {t("common.understood")}
                    </button>
                </div>
            </div>
        </div>
    );
}