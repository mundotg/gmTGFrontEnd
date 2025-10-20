// Componente: Estatística Card
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StatCard = ({ icon: Icon, label, value, trend, colorClass = "text-blue-500", isDarkMode }: any) => (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
        isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
    }`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {label}
                    </p>
                    <p className="text-xl font-bold mt-0.5">{value}</p>
                </div>
            </div>
            {trend && (
                <div className="text-right">
                    <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                </div>
            )}
        </div>
    </div>
);