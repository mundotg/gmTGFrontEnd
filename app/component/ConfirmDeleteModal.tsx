import { AlertTriangle, Trash2, X } from "lucide-react";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  type: "single" | "all" | "select";
  total?: number;
  lista?: {
    row?: Record<string, string>;
    index?: number;
    table?: string[];
  }[];
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  type,
  total,
  lista = [],
  isDeleting,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  // Função para obter a mensagem baseada no tipo
  const getMessage = () => {
    switch (type) {
      case "all":
        return `Tem certeza que deseja eliminar todos os ${total ?? 0} registros? Esta ação não pode ser desfeita.`;
      case "select":
        return `Tem certeza que deseja eliminar os ${total ?? 0} registros selecionados? Esta ação não pode ser desfeita.`;
      case "single":
      default:
        return "Tem certeza que deseja eliminar este registro? Esta ação não pode ser desfeita.";
    }
  };

  // Função para obter o título baseado no tipo
  const getTitle = () => {
    switch (type) {
      case "all":
        return "Eliminar Todos os Registros";
      case "select":
        return "Eliminar Registros Selecionados";
      case "single":
      default:
        return "Eliminar Registro";
    }
  };

  // Função para mostrar preview dos registros (apenas para tipo "select")
  const renderRecordsPreview = () => {
    if (type !== "select" || lista.length === 0) return null;

    const previewItems = lista.slice(0, 3); // Mostra apenas os primeiros 3
    const hasMore = lista.length > 3;

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Registros a eliminar ({lista.length}):
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {previewItems.map((item, idx) => (
            <div 
              key={idx} 
              className="text-xs text-gray-600 p-2 bg-white rounded border border-gray-100 truncate"
              title={JSON.stringify(item.row, null, 2)}
            >
              <span className="font-medium">#{idx + 1}:</span>{" "}
              {item.row ? Object.values(item.row).slice(0, 2).join(" | ") : "Registro"}
            </div>
          ))}
          {hasMore && (
            <p className="text-xs text-gray-500 text-center pt-1">
              ... e mais {lista.length - 3} registros
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {getMessage()}
            </p>
          </div>
        </div>

        {/* Preview dos registros (apenas para seleção múltipla) */}
        {renderRecordsPreview()}

        {/* Barra de progresso durante a eliminação */}
        {isDeleting && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(total || 0) > 0 ? Math.min(100, (lista.length / total!) * 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">
              Processando... {lista.length} de {total}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {type === "select" ? `Eliminando...` : "Eliminando..."}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {type === "select" ? `Eliminar ${total}` : "Eliminar"}
              </>
            )}
          </button>
        </div>

        {/* Aviso adicional para ações destrutivas */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            ⚠️ Esta ação é irreversível. Certifique-se antes de confirmar.
          </p>
        </div>
      </div>
    </div>
  );
}