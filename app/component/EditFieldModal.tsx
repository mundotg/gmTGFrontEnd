import React, { useEffect, useRef, useState } from "react";
import { X, Plus, ChevronDown, ChevronUp, Save } from "lucide-react";
// import DynamicInputByType from "./DynamicInputByType";
import { CampoDetalhado, tipo_db_Options } from "@/types";
import { tiposPorBanco } from "@/constant";
import { useSession } from "@/context/SessionContext";
import { extrairTipoBase } from "../services";

interface EditFieldModalProps {
    isOpen: boolean;
    tabelaExistenteNaDB: string[];
    onClose: () => void;
    field: CampoDetalhado | null;
    onSave: (updatedField: CampoDetalhado & { tableName: string }) => void;
}

const EditFieldModal: React.FC<EditFieldModalProps> = ({
    isOpen,
    onClose,
    field,
    tabelaExistenteNaDB,
    onSave,
}) => {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
    const [length, setLength] = useState<number | undefined>();
    const [isNullable, setIsNullable] = useState(false);
    const [isUnique, setIsUnique] = useState(false);
    const [isPrimaryKey, setIsPrimaryKey] = useState(false);
    const [isAutoIncrement, setIsAutoIncrement] = useState(false);
    const [defaultValue, setDefaultValue] = useState('');
    const [comentario, setComentario] = useState('');
    const [enumValues, setEnumValues] = useState<string[]>([]);
    const [newEnumValue, setNewEnumValue] = useState('');
    const [referencedTable, setReferencedTable] = useState('');
    const [fieldReferences, setFieldReferences] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const dialogRef = useRef<HTMLDivElement>(null);
    const { user } = useSession();

    // Valores padrão comuns para diferentes tipos
    const defaultValueOptions: Record<string, string[]> = {
        varchar: ['', 'NULL', 'CURRENT_USER', 'UNKNOWN'],
        text: ['', 'NULL', 'PENDING', 'DRAFT'],
        int: ['0', '1', '-1', 'NULL'],
        bigint: ['0', '1', '-1', 'NULL'],
        decimal: ['0.00', '1.00', 'NULL'],
        float: ['0.0', '1.0', 'NULL'],
        boolean: ['true', 'false', 'NULL'],
        date: ['NULL', 'CURRENT_DATE'],
        datetime: ['NULL', 'CURRENT_TIMESTAMP', 'NOW()'],
        timestamp: ['NULL', 'CURRENT_TIMESTAMP', 'NOW()'],
    };

    useEffect(() => {
        console.log("Campo para edição:", extrairTipoBase(field?.tipo || ""), " - ", user?.InfPlus?.type);
        if (field) {
            setNome(field.nome || '');
            setTipo(extrairTipoBase(field.tipo) || '');
            setLength(field.length || 0);
            setIsNullable(field.is_nullable || false);
            setIsUnique(field.is_unique || false);
            setIsPrimaryKey(field.is_primary_key || false);
            setIsAutoIncrement(field.is_auto_increment || false);
            setDefaultValue(field.default || '');
            setComentario(field.comentario || '');
            setEnumValues(field.enum_valores_adicionados || []);
            setReferencedTable(field.referenced_table || '');
            setFieldReferences(field.field_references || '');
        }
    }, [field,user]);

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

        const updatedField: CampoDetalhado & { tableName: string } = {
            ...field,
            nome,
            tipo: tipo as tipo_db_Options,
            length,
            is_nullable: isNullable,
            is_unique: isUnique,
            is_primary_key: isPrimaryKey,
            is_auto_increment: isAutoIncrement,
            default: defaultValue,
            comentario,
            enum_valores_adicionados: enumValues,
            referenced_table: referencedTable,
            field_references: fieldReferences,
            tableName: ""
        };

        onSave(updatedField);
        onClose();
    };

    const addEnumValue = () => {
        if (newEnumValue.trim() && !enumValues.includes(newEnumValue.trim())) {
            setEnumValues([...enumValues, newEnumValue.trim()]);
            setNewEnumValue('');
        }
    };

    const removeEnumValue = (index: number) => {
        setEnumValues(enumValues.filter((_, i) => i !== index));
    };

    const handleEnumKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEnumValue();
        }
    };

    if (!isOpen || !field) return null;

    const currentDefaults = defaultValueOptions[extrairTipoBase(tipo)] || ['', 'NULL'];

    const isEnumType = tipo.toLowerCase().includes('enum') || (field.enum_valores_adicionados && field.enum_valores_adicionados?.length > 0);
    const isForeignKey = field.is_foreign_key;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleOutsideClick}
        >
            <div
                ref={dialogRef}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Editar Campo: <span className="text-blue-600">{field.nome}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Grid responsivo para campos principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nome */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome do campo *
                                </label>
                                <input
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: usuario_id, nome_completo..."
                                />
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo *
                                </label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="" disabled>-- Selecione o tipo --</option>
                                    {user?.InfPlus?.type && tiposPorBanco[user?.InfPlus?.type].map((opt) => (
                                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                    ))}
                                    {(user?.InfPlus?.type && !tiposPorBanco[user?.InfPlus?.type].includes(tipo)) && <option key={"opt+" + tipo}
                                        value={tipo}>{tipo.toUpperCase()}</option>
                                    }

                                </select>
                            </div>

                            {/* Tamanho */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tamanho
                                </label>
                                <input
                                    type="number"
                                    value={length || ""}
                                    onChange={(e) => setLength(e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: 255, 50..."
                                />
                            </div>
                        </div>

                        {/* Valor padrão */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valor Padrão
                            </label>
                            <select
                                value={defaultValue}
                                onChange={(e) => setDefaultValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {currentDefaults.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt === '' ? '-- Sem valor padrão --' : opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Comentário */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comentário
                            </label>
                            <textarea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Descrição do campo..."
                            />
                        </div>

                        {/* Flags em grid responsivo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Propriedades
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={isNullable}
                                        onChange={(e) => setIsNullable(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    Permite NULL
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={isUnique}
                                        onChange={(e) => setIsUnique(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    É único
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={isPrimaryKey}
                                        onChange={(e) => setIsPrimaryKey(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    Primary Key
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={isAutoIncrement}
                                        onChange={(e) => setIsAutoIncrement(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    Auto Increment
                                </label>
                            </div>
                        </div>

                        {/* ENUM valores - seção colapsável */}
                        {/* ENUM - criação ou uso */}
                        {isEnumType && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-700 mb-3">Configuração ENUM</h4>

                                {/* Nome do tipo ENUM */}
                                <div className="mb-3">
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Nome do ENUM (Postgres)
                                    </label>
                                    <input
                                        type="text"
                                        // value={field.enum_valores_adicionados || ""}
                                        // onChange={(e) =>
                                        //     onSave({ ...field, enum_name: e.target.value })
                                        // }
                                        placeholder="ex: status_usuario"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Será usado como <code>CREATE TYPE enum_name AS ENUM (...)</code>
                                    </p>
                                </div>

                                {/* Valores ENUM (já tem sua lógica de add/remove) */}
                                <div className="space-y-2">
                                    <label className="block text-sm text-gray-600 mb-1">Valores</label>
                                    <div className="flex flex-wrap gap-2">
                                        {enumValues.map((val, i) => (
                                            <span
                                                key={i}
                                                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                            >
                                                {val}
                                                <button
                                                    type="button"
                                                    onClick={() => removeEnumValue(i)}
                                                    className="text-blue-600 hover:text-red-600 ml-1"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newEnumValue}
                                            onChange={(e) => setNewEnumValue(e.target.value)}
                                            onKeyDown={handleEnumKeyDown}
                                            placeholder="Novo valor ENUM..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={addEnumValue}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Foreign Key - seção colapsável */}
                        {isForeignKey && (
                            <div className="border border-gray-200 rounded-lg">
                                <div className="p-4">
                                    <h4 className="font-medium text-gray-700 mb-3">Foreign Key</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Tabela referenciada</label>
                                            <select
                                                value={referencedTable}
                                                onChange={(e) => setReferencedTable(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Selecione uma tabela</option>
                                                {tabelaExistenteNaDB.map((tabela) => (
                                                    <option key={tabela} value={tabela}>
                                                        {tabela}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Coluna referenciada</label>
                                            <input
                                                type="text"
                                                value={fieldReferences}
                                                onChange={(e) => setFieldReferences(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Ex: id, codigo..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                    <div className="text-sm text-gray-500">
                        * Campos obrigatórios
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!nome.trim() || !tipo}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save size={16} />
                            Salvar alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditFieldModal;