import { DBConnection } from "@/types/db-structure";
import React from "react";

export const getDatabaseIcon = (type?: string) => {
  const t = (type || "").toLowerCase().trim();
  const icons: Record<string, string> = {
    postgresql: "🐘",
    postgres: "🐘",
    mysql: "🐬",
    sqlserver: "🔷",
    mssql: "🔷",
    sqlite: "💾",
    oracle: "🔶",
    mariadb: "🌊",
    mongodb: "🍃",
    mongo: "🍃",
    redis: "⚡",
  };
  return icons[t] || "🗄️";
};

export const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "purple" | "orange";
}) => {
  const styles = {
    blue: {
      card: "bg-blue-50/70 border-blue-200 text-blue-900",
      gradient: "from-blue-500 to-indigo-600",
      text: "text-blue-900",
    },
    green: {
      card: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
      gradient: "from-emerald-500 to-teal-600",
      text: "text-emerald-900",
    },
    purple: {
      card: "bg-purple-50/70 border-purple-200 text-purple-900",
      gradient: "from-purple-500 to-violet-600",
      text: "text-purple-900",
    },
    orange: {
      card: "bg-amber-50/70 border-amber-200 text-amber-900",
      gradient: "from-amber-500 to-orange-600",
      text: "text-amber-900",
    },
  }[color];

  return (
    <div className={`${styles.card} border rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`bg-gradient-to-br ${styles.gradient} text-white rounded-xl p-2.5 shadow-xs`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl sm:text-3xl font-bold ${styles.text} mb-1 tracking-tight`}>{value}</div>
      <div className="text-xs sm:text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
};

/* -------------------------- SUBCOMPONENTES -------------------------- */

export const ConnectionCard = React.memo(({
  title,
  connection,
  color,
  icon,
}: {
  title: string;
  connection?: DBConnection;
  color: "blue" | "green";
  icon: React.ReactNode;
}) => {
  const isBlue = color === "blue";

  if (!connection) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-xs text-gray-400 text-sm italic">
        Nenhuma conexão selecionada para {title}.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 border shadow-xs ${
        isBlue
          ? "bg-blue-50/60 border-blue-200"
          : "bg-emerald-50/60 border-emerald-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`text-white rounded-xl p-2.5 shadow-xs bg-gradient-to-br ${
              isBlue ? "from-blue-500 to-indigo-600" : "from-emerald-500 to-teal-600"
            }`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">{title}</h3>
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
              ID #{connection.id}
            </span>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
            isBlue ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {connection.type}
        </span>
      </div>

      <div className="space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getDatabaseIcon(connection.type)}</span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 truncate">{connection.name}</div>
            <div className="text-xs text-gray-500 font-mono truncate">{connection.type}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Host</div>
            <div className="font-mono text-gray-800 truncate">{connection.host || "localhost"}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Porta</div>
            <div className="font-mono text-gray-800">{connection.port || "padrão"}</div>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Banco de Dados</div>
            <div className="font-mono text-gray-800 truncate font-semibold">
              {connection.database_name || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ConnectionCard.displayName = "ConnectionCard";

