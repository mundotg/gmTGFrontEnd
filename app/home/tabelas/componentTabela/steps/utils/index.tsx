import { DBConnection } from "@/types/db-structure";
import React from "react";

export const StatCard = ({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: "blue"| "green" | "purple" | "orange";
}) => {
    const colorClasses = {
        blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-900",
        green: "from-green-500 to-emerald-600 bg-green-50 text-green-900",
        purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-900",
        orange: "from-orange-500 to-orange-600 bg-orange-50 text-orange-900",
    }[color];

    const gradientClass = colorClasses.split(" ")[0] + " " + colorClasses.split(" ")[1];
    const bgClass = colorClasses.split(" ")[2];
    const textClass = colorClasses.split(" ")[3];

    return (
        <div className={`${bgClass} border border-${color}-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-br ${gradientClass} text-white rounded-xl p-2.5`}>
                    {icon}
                </div>
            </div>
            <div className={`text-3xl font-bold ${textClass} mb-1`}>{value}</div>
            <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
    );
};



export const getDatabaseIcon = (type: string) => ({
  postgresql: "🐘",
  mysql: "🐬",
  sqlserver: "🔷",
  sqlite: "💾",
  oracle: "🔶",
  mariadb: "🌊",
}[type] || "🗄️");


/* -------------------------- SUBCOMPONENTES -------------------------- */

export const ConnectionCard = React.memo(({
    title,
    connection,
    color,
    icon,
}: {
    title: string;
    connection: DBConnection;
    color: string;
    icon: React.ReactNode;
}) => {
    const colorClasses = color === "blue"
        ? "bg-blue-50 border-blue-200 from-blue-500 to-blue-600"
        : "bg-green-50 border-green-200 from-green-500 to-emerald-600";

    return (
        <div className={`${colorClasses.split(" ")[0]} border ${colorClasses.split(" ")[1]} rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`bg-gradient-to-br ${colorClasses.split(" ")[2]} ${colorClasses.split(" ")[3]} text-white rounded-xl p-2.5`}>
                    {icon}
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
            </div>

            <div className="space-y-3 bg-white/60 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{getDatabaseIcon(connection.type)}</span>
                    <div>
                        <div className="font-bold text-gray-900">{connection.name}</div>
                        <div className="text-xs text-gray-600 font-mono">{connection.type}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Host</div>
                        <div className="font-mono text-gray-900 text-xs truncate">{connection.host}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Porta</div>
                        <div className="font-mono text-gray-900 text-xs">{connection.port}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-xs text-gray-500 font-medium mb-1">Banco de Dados</div>
                        <div className="font-mono text-gray-900 text-xs truncate">{connection.database_name}</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ConnectionCard.displayName = "ConnectionCard";
