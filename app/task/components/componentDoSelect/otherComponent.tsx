
// Subcomponents
export const InfoCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    highlight?: boolean;
    alert?: boolean;
}> = ({ icon, label, value, subValue, highlight, alert }) => (
    <div className={`p-3 rounded-lg border ${highlight ? "bg-purple-50 border-purple-200" :
        alert ? "bg-red-50 border-red-200" :
            "bg-gray-50 border-gray-200"
        }`}>
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-sm font-semibold tracking-tight ${alert ? "text-red-900" : "text-gray-900"}`}>{value}</p>
        {subValue && <p className={`text-xs font-normal mt-0.5 ${alert ? "text-red-700" : "text-gray-600"}`}>{subValue}</p>}
    </div>
);

export const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    color: "green" | "red" | "indigo";
    onClick: () => void;
}> = ({ icon, label, color, onClick }) => {
    const colorClasses = {
        green: "bg-green-600 hover:bg-green-700 text-white",
        red: "bg-red-600 hover:bg-red-700 text-white",
        indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 active:scale-95 hover:shadow ${colorClasses[color]}`}
        >
            {icon}
            {label}
        </button>
    );
};

export const IconButton: React.FC<{
    icon: React.ReactNode;
    color: string;
    bgHover: string;
    title: string;
    onClick: () => void;
}> = ({ icon, color, bgHover, title, onClick }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-2 ${color} rounded-lg transition-all duration-200 hover:${bgHover} active:scale-95`}
    >
        {icon}
    </button>
);

export const Badge: React.FC<{
    text: string;
    colorClass: string;
    icon?: React.ReactNode;
}> = ({ text, colorClass, icon }) => (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${colorClass} whitespace-nowrap`}>
        {icon}
        {text}
    </span>
);

