import { Key } from "lucide-react";

// ToggleCard
export const ToggleCard = ({
    label,
    checked,
    onChange,
    isPrimary = false,
    disabled = false,
    hint,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    isPrimary?: boolean;
    disabled?: boolean;
    hint?: string;
}) => (
    <label
        title={hint}
        className={`
      flex flex-col justify-center items-center text-center p-3 rounded-xl border-2 transition-all select-none
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      ${checked
                ? isPrimary
                    ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                    : "bg-blue-50 border-blue-400 text-blue-900 shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
            }
    `}
    >
        <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
        />
        {isPrimary && checked && <Key size={14} className="text-amber-500 mb-1" />}
        <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">{label}</span>
    </label>
);

