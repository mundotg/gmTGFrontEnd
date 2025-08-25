// components/EditFieldModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { CampoDetalhado, tipo_db_Options } from "@/types";
import { X } from "lucide-react";
import { tiposPorBanco } from "@/constant";
import { useSession } from "@/context/SessionContext";
import { extrairTipoBase } from "../services";

interface EditFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    field: CampoDetalhado | null;
    onSave: (updatedField: CampoDetalhado & { tableName: string }) => void;
}


export default function EditFieldModal({
    isOpen,
    onClose,
    field,
    onSave,
}: EditFieldModalProps) {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
    const [isNullable, setIsNullable] = useState(false);
    const [isUnique, setIsUnique] = useState(false);
    const [defaultValue, setDefaultValue] = useState('');
    const dialogRef = useRef<HTMLDivElement>(null);
    const { user } = useSession()

    

    useEffect(() => {
        if (field) {
            setNome(field.nome || '');
            setTipo(extrairTipoBase(field.tipo) || '');
            setIsNullable(field.is_nullable || false);
            setIsUnique(field.is_unique || false);
            setDefaultValue(field.default || '');
        }
    }, [field]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleOutsideClick = (e: React.MouseEvent) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleSave = () => {
        if (!field) return;
        onSave({
            ...field,
            nome,
            tipo: tipo as tipo_db_Options,
            is_nullable: isNullable,
            is_unique: isUnique,
            default: defaultValue,
            tableName: ""
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={handleOutsideClick}
        >
            <div
                ref={dialogRef}
                className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6 animate-fade-in space-y-4 relative"
            >
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold">Editar Campo</h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do campo</label>
                        <input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Selecione --</option>
                            {user?.InfPlus?.type && tiposPorBanco[user?.InfPlus?.type].map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor Padrão</label>
                        <input
                            value={defaultValue}
                            onChange={(e) => setDefaultValue(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={isNullable}
                                onChange={(e) => setIsNullable(e.target.checked)}
                                className="w-4 h-4"
                            />
                            Permite NULL
                        </label>

                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={isUnique}
                                onChange={(e) => setIsUnique(e.target.checked)}
                                className="w-4 h-4"
                            />
                            É único
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
