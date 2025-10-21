import { Filter, LayoutGrid, List, Search, XCircle } from "lucide-react";
import { useState } from "react";

// Componente: Filtros Avançados
export const FilterPanel = ({ 
    searchTerm, 
    setSearchTerm, 
    filterSchema, 
    setFilterSchema, 
    sortBy, 
    setSortBy, 
    viewMode, 
    setViewMode,
    schemas,
    isDarkMode 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-4">
            {/* Barra de Busca Principal */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome de tabela, schema ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        isDarkMode
                            ? 'bg-gray-800 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500'
                            : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Controles de Visualização */}
            <div className="flex items-center justify-between gap-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        isDarkMode
                            ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-400'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtros</span>
                    {(filterSchema !== 'all' || sortBy !== 'name') && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            Ativos
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                    }`}>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded transition-all ${
                                viewMode === 'list'
                                    ? 'bg-blue-500 text-white'
                                    : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-blue-500 text-white'
                                    : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Painel de Filtros Expandido */}
            {showFilters && (
                <div className={`p-4 rounded-xl border space-y-4 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Filtro por Schema */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Schema</label>
                            <select
                                value={filterSchema}
                                onChange={(e) => setFilterSchema(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    isDarkMode
                                        ? 'bg-gray-900 border-gray-700 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                <option value="all">Todos os Schemas</option>
                                {schemas.map((schema: string) => (
                                    <option key={schema} value={schema}>{schema}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ordenação */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Ordenar por</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    isDarkMode
                                        ? 'bg-gray-900 border-gray-700 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                <option value="name">Nome (A-Z)</option>
                                <option value="rows">Número de Registros</option>
                                <option value="schema">Schema</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
