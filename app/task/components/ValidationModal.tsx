"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./modalComponent"; // <-- importa o Modal genérico

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isApproval: boolean;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isApproval,
}) => {
  const [comment, setComment] = useState("");

  // Limpa comentário ao abrir
  useEffect(() => {
    if (isOpen) setComment("");
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(comment.trim() || (isApproval ? "Aprovado" : "Reprovado"));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApproval ? "✅ Validar Tarefa" : "❌ Reprovar Tarefa"}
      size="sm"
    >
      <div
        className={`rounded-t-xl p-2 mb-4 ${
          isApproval ? "bg-green-50" : "bg-red-50"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            isApproval ? "text-green-800" : "text-red-800"
          }`}
        >
          {isApproval
            ? "Tem certeza que deseja validar esta tarefa?"
            : "Tem certeza que deseja reprovar esta tarefa?"}
        </p>
      </div>

      {/* Campo de comentário */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Comentário (opcional)
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={
          isApproval ? "Ex: Tudo certo!" : "Ex: Precisa de ajustes..."
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        rows={3}
      />

      {/* Botões */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            isApproval
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
};
