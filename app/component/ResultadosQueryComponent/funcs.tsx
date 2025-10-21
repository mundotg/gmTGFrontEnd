export interface Header {
  name: string;
  type?: string;
}

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const formatCellValue = (value: any, columnInfo?: Header) => {
        if (value === null) {
            return (
                <span className="text-gray-400 italic font-mono text-xs bg-gray-100 px-1 rounded">
                    NULL
                </span>
            );
        }

        if (value === undefined) {
            return <span className="text-gray-400 italic">—</span>;
        }

        if (typeof value === "boolean") {
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                    <span className="w-2 h-2 rounded-full mr-1 bg-current opacity-60"></span>
                    {value ? "Sim" : "Não"}
                </span>
            );
        }

        if (columnInfo?.type?.toLowerCase().includes("date") && value) {
            return (
                <span className="text-blue-700 font-medium" title={String(value)}>
                    {new Date(value).toLocaleString("pt-BR", {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </span>
            );
        }

        if (typeof value === "number") {
            return (
                <span className="font-mono text-right block" title={String(value)}>
                    {value.toLocaleString("pt-BR")}
                </span>
            );
        }

        const stringValue = String(value);
        return (
            <span className="block" title={stringValue}>
                {stringValue.length > 50 ? (
                    <>
                        {stringValue.substring(0, 47)}
                        <span className="text-gray-400">...</span>
                    </>
                ) : (
                    stringValue
                )}
            </span>
        );
    };