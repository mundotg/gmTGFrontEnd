"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
    Database,
    Server,
    Calendar,
    ChevronDown,
    ChevronRight,
    Loader2,
    AlertCircle,
    Search,
    RefreshCw,
    Grid
} from 'lucide-react';
import TableColumnsDisplay from '@/app/component/table-columns-display';
import { MetadataTableResponse, CampoDetalhado } from '@/types';

// Tipos
interface DBConnection {
    id: number;
    name: string;
    host: string;
    port: number;
    database_name: string;
    db_type: string;
    created_at: string;
}

interface DBStructure {
    id: number;
    db_connection_id: number;
    table_name: string;
    schema_name: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    full_table_name: string;
}

interface TableWithColumns extends DBStructure {
    columns?: MetadataTableResponse[];
}

const DatabaseTablesPage = () => {
    const [connection, setConnection] = useState<DBConnection | null>(null);
    const [tables, setTables] = useState<TableWithColumns[]>([]);
    const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
    const [loadingColumns, setLoadingColumns] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [loadingFields, setLoadingFields] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        fetchDatabaseInfo();
    }, []);

    const fetchDatabaseInfo = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Substitua pela chamada real à sua API
            const response = await fetch('/api/database/structures');
            
            if (!response.ok) {
                throw new Error('Falha ao carregar estruturas do banco');
            }

            const data = await response.json();
            
            setConnection(data.connection);
            setTables(data.structures || []);
            setIsLoading(false);
        } catch (err) {
            // Fallback para dados mock em caso de erro
            console.warn('Usando dados mock:', err);
            
            setConnection({
                id: 1,
                name: "Produção Principal",
                host: "db.example.com",
                port: 5432,
                database_name: "sistema_vendas",
                db_type: "PostgreSQL",
                created_at: "2024-01-15T10:30:00Z"
            });

            setTables([
                {
                    id: 1,
                    db_connection_id: 1,
                    table_name: "usuarios",
                    schema_name: "public",
                    description: "Tabela de usuários do sistema",
                    created_at: "2024-01-15T10:30:00Z",
                    updated_at: "2024-10-17T08:20:00Z",
                    is_deleted: false,
                    full_table_name: "public.usuarios"
                },
                {
                    id: 2,
                    db_connection_id: 1,
                    table_name: "pedidos",
                    schema_name: "public",
                    description: "Tabela de pedidos",
                    created_at: "2024-01-15T10:30:00Z",
                    updated_at: "2024-10-16T14:45:00Z",
                    is_deleted: false,
                    full_table_name: "public.pedidos"
                },
                {
                    id: 3,
                    db_connection_id: 1,
                    table_name: "produtos",
                    schema_name: "public",
                    description: "Catálogo de produtos",
                    created_at: "2024-01-15T10:30:00Z",
                    updated_at: "2024-10-17T09:15:00Z",
                    is_deleted: false,
                    full_table_name: "public.produtos"
                }
            ]);

            setIsLoading(false);
        }
    };

    const fetchTableColumns = async (tableId: number, tableName: string, schemaName: string | null) => {
        setLoadingColumns(prev => new Set(prev).add(tableId));

        try {
            // Substitua pela chamada real à sua API
            const params = new URLSearchParams({
                table_name: tableName,
                ...(schemaName && { schema_name: schemaName })
            });

            const response = await fetch(`/api/database/structures/${tableId}/fields?${params}`);
            
            if (!response.ok) {
                throw new Error('Falha ao carregar colunas');
            }

            const data: MetadataTableResponse[] = await response.json();

            setTables(prev => prev.map(t =>
                t.id === tableId ? { ...t, columns: data } : t
            ));
        } catch (err) {
            console.error('Erro ao carregar colunas:', err);
            
            // Mock data com estrutura correta
            const mockColumns: MetadataTableResponse[] = [{
                message: "Metadados extraídos com sucesso",
                executado_em: new Date().toISOString(),
                connection_id: 1,
                schema_name: schemaName || 'public',
                table_name: tableName,
                total_colunas: 5,
                colunas: [
                    {
                        nome: 'id',
                        tipo: 'integer' as any,
                        is_nullable: false,
                        is_primary_key: true,
                        is_unique: true,
                        is_auto_increment: true,
                        default: null,
                        comentario: 'Chave primária',
                        length: null
                    },
                    {
                        nome: 'nome',
                        tipo: 'varchar' as any,
                        is_nullable: false,
                        is_primary_key: false,
                        is_unique: false,
                        default: null,
                        comentario: 'Nome do usuário',
                        length: 255
                    },
                    {
                        nome: 'email',
                        tipo: 'varchar' as any,
                        is_nullable: false,
                        is_primary_key: false,
                        is_unique: true,
                        default: null,
                        comentario: 'Email único',
                        length: 255
                    },
                    {
                        nome: 'created_at',
                        tipo: 'timestamp' as any,
                        is_nullable: false,
                        is_primary_key: false,
                        is_unique: false,
                        default: 'now()',
                        comentario: 'Data de criação',
                        length: null
                    },
                    {
                        nome: 'updated_at',
                        tipo: 'timestamp' as any,
                        is_nullable: true,
                        is_primary_key: false,
                        is_unique: false,
                        default: null,
                        comentario: 'Data de atualização',
                        length: null
                    }
                ]
            }];

            setTables(prev => prev.map(t =>
                t.id === tableId ? { ...t, columns: mockColumns } : t
            ));
        } finally {
            setLoadingColumns(prev => {
                const newSet = new Set(prev);
                newSet.delete(tableId);
                return newSet;
            });
        }
    };

    const toggleTable = useCallback((tableId: number, tableName: string, schemaName: string | null) => {
        const isExpanded = expandedTables.has(tableId);

        setExpandedTables(prev => {
            const newSet = new Set(prev);
            if (isExpanded) {
                newSet.delete(tableId);
            } else {
                newSet.add(tableId);
                // Carregar colunas se ainda não foram carregadas
                const table = tables.find(t => t.id === tableId);
                if (!table?.columns) {
                    fetchTableColumns(tableId, tableName, schemaName);
                }
            }
            return newSet;
        });
    }, [expandedTables, tables]);

    const filteredTables = tables.filter(table =>
        table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.schema_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const themeClasses = isDarkMode
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900';

    const cardClasses = isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200';

    if (isLoading) {
        return (
            <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-lg">Carregando informações do banco de dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${themeClasses} flex items-center justify-center p-4`}>
                <div className="max-w-md w-full">
                    <div className={`${cardClasses} border rounded-lg p-6 text-center`}>
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Erro ao Carregar Dados</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={fetchDatabaseInfo}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
            {/* Header com informações da base de dados */}
            <div className={`${cardClasses} border-b shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{connection?.name}</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Gerenciamento de Tabelas
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={fetchDatabaseInfo}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Atualizar"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Servidor</p>
                                <p className="font-medium">{connection?.host}:{connection?.port}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Banco de Dados</p>
                                <p className="font-medium">{connection?.database_name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Grid className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                                <p className="font-medium">{connection?.db_type}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Criado em</p>
                                <p className="font-medium text-sm">
                                    {connection?.created_at && formatDate(connection.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Corpo - Lista de Tabelas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Barra de busca */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar tabelas por nome, schema ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all`}
                        />
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {filteredTables.length} {filteredTables.length === 1 ? 'tabela encontrada' : 'tabelas encontradas'}
                    </p>
                </div>

                {/* Lista de Tabelas */}
                <div className="space-y-3">
                    {filteredTables.map((table) => {
                        const isExpanded = expandedTables.has(table.id);
                        const isLoadingCols = loadingColumns.has(table.id);

                        return (
                            <div
                                key={table.id}
                                className={`${cardClasses} border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md`}
                            >
                                {/* Header da Tabela */}
                                <button
                                    onClick={() => toggleTable(table.id, table.table_name, table.schema_name)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                        )}

                                        <Grid className="w-5 h-5 text-blue-500" />

                                        <div className="text-left">
                                            <h3 className="font-semibold text-lg">
                                                {table.full_table_name}
                                            </h3>
                                            {table.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {table.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                        <p>Atualizado em {formatDate(table.updated_at)}</p>
                                    </div>
                                </button>

                                {/* Colunas - Renderizado sob demanda */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 dark:border-gray-700">
                                        {isLoadingCols ? (
                                            <div className="px-6 py-8 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Carregando colunas...
                                                </p>
                                            </div>
                                        ) : table.columns ? (
                                            <div className="p-6">
                                                <TableColumnsDisplay
                                                    tableNames={table.table_name}
                                                    columns={table.columns}
                                                    isLoading={loadingFields}
                                                    setIsLoading={setLoadingFields}
                                                    error={null}
                                                    theme={isDarkMode ? 'dark' : 'light'}
                                                    tabelaExistenteNaDB={[table.table_name]}
                                                    showExport
                                                    itemsPerPage={12}
                                                    select={[]}
                                                    setSelect={(i: string[]) => { }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="px-6 py-8 text-center text-gray-500">
                                                Nenhuma coluna encontrada
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredTables.length === 0 && (
                    <div className="text-center py-12">
                        <Grid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Nenhuma tabela encontrada
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Tente ajustar sua busca ou verifique se existem tabelas no banco de dados
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseTablesPage;