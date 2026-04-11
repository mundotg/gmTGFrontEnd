import React from "react";

export function TabButton({ active, children, onClick }: {active: boolean, children: React.ReactNode, onClick: () => void}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${
        active 
          ? "bg-white shadow-sm text-gray-900" 
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
      }`}
    >
      {children}
    </button>
  );
}

export function MetricCard({ label, value, subLabel, icon }: {label: string, value: string | number | null | undefined, subLabel?: string, icon: React.ReactNode}) {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm group hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </div>
        <div className="p-2 bg-gray-50 text-gray-600 rounded-lg group-hover:scale-110 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
          {icon}
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900">
        {value ?? "---"}
      </div>
      
      {subLabel && (
        <div className="text-xs text-gray-400 mt-1 font-medium">
          {subLabel}
        </div>
      )}
    </div>
  );
}

export function QueryRowItem({ target, trail, duration, status }: {target: string, trail: string, duration: string, status: string}) {
  const isSuccess = status === 'Success' || status === 'sucesso';
  
  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 group">
      <td className="px-4 py-3">
        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {target}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 font-medium">
          {trail}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
          isSuccess 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {status}
        </div>
        <div className="text-xs font-mono text-gray-400 mt-1">
          {duration}
        </div>
      </td>
    </tr>
  );
}

export function AuditTrailItem({ user, action, time }: {user: string, action: string, time: string}) {
  return (
    <div className="flex gap-4 relative">
      {/* Linha vertical conectora (opcional, fica legal se tiver vários itens) */}
      <div className="absolute left-[5px] top-4 bottom-[-16px] w-[2px] bg-gray-100 last:hidden" />
      
      {/* Ponto indicador limpo (sem neon) */}
      <div className="relative z-10 w-3 h-3 rounded-full bg-white border-2 border-blue-500 mt-1 ring-4 ring-white" />
      
      <div className="pb-4">
        <p className="text-sm font-medium text-gray-900">
          {action}
        </p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          <span className="font-semibold text-gray-700">{user}</span> • {time}
        </p>
      </div>
    </div>
  );
}