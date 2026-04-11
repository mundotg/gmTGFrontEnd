// components/steps/Step1Connections.tsx
import { Server, AlertCircle } from "lucide-react";
import { JoinSelect } from "@/app/task/components/select_Component";
import type { DBConnection } from "@/types/db-structure";
import { useCallback, useEffect, useState } from "react";

interface Step1ConnectionsProps {
    loading: boolean;
    sourceDb: DBConnection | undefined;
    targetDb: DBConnection | undefined;
    onSourceDbChange: (value: DBConnection | undefined) => void;
    onTargetDbChange: (value: DBConnection | undefined) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchDBConnections: (page: number, search: string) => Promise<any>;
}

export const Step1Connections: React.FC<Step1ConnectionsProps> = ({
    loading,
    sourceDb,
    targetDb,
    onSourceDbChange,
    onTargetDbChange,
    fetchDBConnections,
}) => {

    const [connections1, setConnections1] = useState<DBConnection[]>([]);
    const [connections2, setConnections2] = useState<DBConnection[]>([]);
    const [sentinelaDeinicializacao, setSentinelaDeinicializacao] = useState<boolean>(false);

    const getDatabaseIcon = (type: string) => {
        const icons: Record<string, string> = {
            postgresql: "🐘",
            mysql: "🐬",
            sqlserver: "🔷",
            sqlite: "💾",
            oracle: "🔶",
            mariadb: "🌊",
        };
        return icons[type] || "🗄️";
    };

    // -------------------------------
    // Função geradora para evitar repetição
    // -------------------------------
    const createFetchOptions = useCallback(
        (
            setConnections: (c: DBConnection[]) => void
        ) => {
            return async (page: number, search: string) => {
                if (loading) {
                    return { options: [], hasMore: false, total: 0 };
                }

                try {
                    const data = await fetchDBConnections(page, search);

                    if (data?.data?.items) {
                        setConnections(data.data.items);
                    }
                    if(!sentinelaDeinicializacao && loading === false){
                        setSentinelaDeinicializacao(true);
                    }
                    return {
                        options: data.options,
                        hasMore: data.hasMore,
                        total: data.total,
                    };
                } catch (error) {
                    console.error("Erro ao buscar conexões de DB:", error);
                    return { options: [], hasMore: false, total: 0 };
                }
            };
        },
        [loading, sentinelaDeinicializacao]
    );

    const FetchOptions1 = useCallback(
        createFetchOptions( setConnections1),
        [createFetchOptions]
    );

    const FetchOptions2 = useCallback(
        createFetchOptions( setConnections2),
        [createFetchOptions]
    );

    // inicializar os selects com as conexões atuais selecionadas
    useEffect(() => {
        if(connections1.length > 0 && (connections2.length ==0 || connections2 === undefined) ) {
            setConnections2(connections1);
        }
    }, [connections1, connections2,setConnections1]);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione as bases de dados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Origem */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-600" />
                            Base de Dados Origem
                        </label>

                        <JoinSelect
                            value={String(sourceDb?.id || "")}
                            onChange={value =>
                                onSourceDbChange(
                                    connections1.find(conn => String(conn.id) === value)
                                )
                            }
                            fetchOptions={loading ? undefined : FetchOptions1}
                            placeholder="Selecione a origem..."
                            className="w-full"
                            buttonClassName="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                        />

                        {sourceDb && (
                            <SelectedDbInfo db={sourceDb} icon={getDatabaseIcon(sourceDb.type)} color="blue" />
                        )}
                    </div>

                    {/* Destino */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Server className="w-4 h-4 text-green-600" />
                            Base de Dados Destino
                        </label>

                        {sentinelaDeinicializacao && <JoinSelect
                            value={String(targetDb?.id || "")}
                            onChange={value =>
                                onTargetDbChange(
                                    connections2.find(conn => String(conn.id) === value)
                                )
                            }
                            fetchOptions={loading ? undefined : FetchOptions2}
                            placeholder="Selecione o destino..."
                            className="w-full"
                            buttonClassName="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors"
                        />}

                        {targetDb && (
                            <SelectedDbInfo db={targetDb} icon={getDatabaseIcon(targetDb.type)} color="green" />
                        )}
                    </div>
                </div>

                {!targetDb && !sourceDb && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <strong>Atenção:</strong> A base de dados de origem e destino não podem estar vazias.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// -------------------------------
// Componente para exibir info da DB selecionada
// -------------------------------
const SelectedDbInfo = ({ db, icon, color }: { db: DBConnection; icon: string; color: string }) => (
    <div className={`text-xs text-gray-600 bg-${color}-50 p-3 rounded-lg border border-${color}-100`}>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <strong className="text-sm">{db.name}</strong>
        </div>
        <div><strong>Host:</strong> {db.host}:{db.port}</div>
        <div><strong>Database:</strong> {db.database_name}</div>
        <div><strong>Tipo:</strong> <span className="capitalize">{db.type}</span></div>
    </div>
);
