// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
export function ConfirmModal({
    filename,
    onConfirm,
    onCancel,
    isDeleting,
}: {
    filename: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scale-in">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl shrink-0">🗑️</div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Apagar ficheiro</h3>
                        <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 font-mono truncate">
                    {filename}
                </p>
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                A apagar...
                            </>
                        ) : "Apagar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
