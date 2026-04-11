import { AlertCircle, ChevronRight, LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl border flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}


interface SettingItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export function SettingItem({
  icon: Icon,
  title,
  description,
  badge,
  disabled,
  danger,
  onClick,
}: SettingItemProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full flex items-center justify-between p-4 border rounded-xl text-left transition
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
        ${danger ? "border-red-300 hover:bg-red-50" : ""}
      `}
    >
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
          <Icon size={18} />
        </div>

        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {badge && (
          <span className="text-xs px-2 py-1 border rounded-full">
            {badge}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </button>
  );
}


export function SecurityHint() {
  return (
    <div className="border rounded-xl p-4 flex gap-3 bg-gray-50">
      <AlertCircle size={18} />
      <div>
        <p className="text-sm font-medium">Dica de segurança</p>
        <p className="text-sm text-gray-600">
          Ative a autenticação em dois fatores para proteger sua conta.
        </p>
      </div>
    </div>
  );
}
