import React from "react";

export function TabButton({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
        active 
          ? "bg-white shadow-lg" 
          : " hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

export function MetricCard({ label, value, subLabel, icon }: any) {
  return (
    <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:border-white/20 transition-all">
      <div className="p-2 bg-white/5 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-2xl font-black ">{value ?? "---"}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-[10px] mt-2 italic">{subLabel}</div>
    </div>
  );
}

export function QueryRowItem({ target, trail, duration, status }: any) {
  return (
    <tr className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
      <td className="px-6 py-4">
        <div className="font-bold ">{target}</div>
        <div className="text-[10px] ">{trail}</div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`text-[10px] font-bold ${status === 'Success' ? 'text-emerald-500' : 'text-amber-500'}`}>{status}</span>
        <div className="text-[10px] ">{duration}</div>
      </td>
    </tr>
  );
}

export function AuditTrailItem({ user, action, time }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
      <div>
        <p className="text-xs font-bold ">{action}</p>
        <p className="text-[10px] ">{user} • {time}</p>
      </div>
    </div>
  );
}