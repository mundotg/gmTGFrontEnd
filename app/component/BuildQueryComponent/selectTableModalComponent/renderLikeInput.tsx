import { CondicaoFiltro, JoinCondition, OperatorType, tipo_db_Options } from '@/types';
import React, { useState } from 'react';
import DynamicInputByType from '../../DynamicInputByType';

export interface LikeInputGroupProps {
    value: string;
    condition: CondicaoFiltro | JoinCondition;
    onChange: (newValue: string) => void;
    typeInput: tipo_db_Options;
    placeholder: string;
    t: (key: string) => string;
}

const LikeInputGroup = ({
    value = "",
    condition,
    onChange,
    typeInput,
    placeholder,
    t,
}: LikeInputGroupProps) => {
    // Estado local para mensagem de erro caso tente clicar sem valor
    const [error, setError] = useState<string | null>(null);

    const prefix = condition.pattern?.prefix === "%" ? "%" : "";
    const suffix = condition.pattern?.suffix === "%" ? "%" : "";
    const cleanValue = value || "";

    const togglePrefixSuffix = (type: "prefix" | "suffix") => {
        // Regra: Não permite trocar se não houver valor digitado
        if (!cleanValue.trim()) {
            setError(t("errors.value_required_for_wildcard") || "Digite um valor antes de aplicar o filtro (%)");

            // Limpa o erro após 3 segundos
            setTimeout(() => setError(null), 3000);
            return;
        }

        setError(null);

        const newPattern = {
            prefix: type === "prefix" ? (prefix ? "" : "%") : prefix,
            suffix: type === "suffix" ? (suffix ? "" : "%") : suffix,
        };

        const newValue = `${newPattern.prefix}${cleanValue}${newPattern.suffix}`;
        onChange(newValue);
    };

    const handleChange = (val: string) => {
        if (val) setError(null);
        // Mantém a estrutura de pattern ao digitar
        const newValue = `${prefix}${val}${suffix}`;
        onChange(newValue);
    };

    return (
        <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
                {t("condition.value") || "Valor"}
            </label>

            <div className={`flex items-center border rounded overflow-hidden transition-all ${error ? "border-amber-400 ring-1 ring-amber-100" : "focus-within:ring-1 focus-within:ring-blue-400"
                }`}>

                {/* Botão Prefixo */}
                <button
                    type="button"
                    disabled={!cleanValue}
                    onClick={() => togglePrefixSuffix("prefix")}
                    className={`px-3 py-2 text-xs font-mono transition-colors border-r ${prefix ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border-gray-100"
                        } ${!cleanValue && "cursor-not-allowed opacity-60"}`}
                >
                    {prefix || "_"}
                </button>

                {/* Input Central */}
                <div className="flex-1 min-w-0">
                    <DynamicInputByType
                        type={typeInput}
                        value={cleanValue}
                        onChange={handleChange}
                        placeholder={placeholder}
                    />
                </div>

                {/* Botão Sufixo */}
                <button
                    type="button"
                    disabled={!cleanValue}
                    onClick={() => togglePrefixSuffix("suffix")}
                    className={`px-3 py-2 text-xs font-mono transition-colors border-l ${suffix ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border-gray-100"
                        } ${!cleanValue && "cursor-not-allowed opacity-60"}`}
                >
                    {suffix || "_"}
                </button>
            </div>

            {/* Mensagem de Feedback Contextual */}
            <div className="mt-1.5 ml-1">
                {error ? (
                    <p className="text-[10px] text-amber-600 font-semibold animate-pulse">
                        ⚠️ {error}
                    </p>
                ) : (
                    <p className="text-[10px] text-gray-400 leading-tight">
                        {_UX_HELP_TEXT}
                    </p>
                )}
            </div>
        </div>
    );
};

const _UX_HELP_TEXT = "Clique nos lados para ativar o caractere curinga (%)";

export default LikeInputGroup;