'use client';

import { useSession } from '@/context/SessionContext';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    Database, RefreshCw, ArrowLeft, Plus, AlertTriangle, Layers, Table, HardDrive
} from 'lucide-react';
import {
    BOX_WIDTH, COLORS, COLUMNS, GAP_X, GAP_Y,
    HEADER_HEIGHT, PositionedTable, Relationship,
    ROW_HEIGHT
} from './constant';
import SchemaViewer from './component/SchemaViewer';
import { isSystemTable } from '../tabelas/componentTabela/util';
import { DBConnection } from '@/types/db-structure';
import { SavedConnection } from '@/types';

// ─── Tela de Carregamento ─────────────────────────────────────────────────────

function LoadingState({ dbName }: { dbName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-6 select-none">
            {/* Animação de pulso com 3 tabelas sobrepostas */}
            <div className="relative w-20 h-20">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping"
                        style={{
                            animationDelay: `${i * 250}ms`,
                            animationDuration: '1.5s',
                            opacity: 1 - i * 0.3,
                            transform: `scale(${1 - i * 0.15})`,
                        }}
                    />
                ))}
                {/* Ícone de banco no centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                    Carregando schema {dbName ? `(${dbName})` : ''}
                </p>
                <p className="text-xs text-gray-500 mb-2">Mapeando tabelas, campos e chaves estrangeiras...</p>
                <div className="flex items-center gap-1 justify-center">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
            </div>

            {/* Barra de progresso indeterminada */}
            <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-[loading-bar_1.8s_ease-in-out_infinite]" />
            </div>

            <style>{`
                @keyframes loading-bar {
                    0%   { transform: translateX(-100%) scaleX(0.5); }
                    50%  { transform: translateX(50%) scaleX(0.7); }
                    100% { transform: translateX(200%) scaleX(0.5); }
                }
            `}</style>
        </div>
    );
}

// ─── Tela de Erro ─────────────────────────────────────────────────────────────

function ErrorState({
    message,
    onRetry,
    availableConnections,
    onSelectConnection
}: {
    message: string;
    onRetry: () => void;
    availableConnections: SavedConnection[];
    onSelectConnection: (id: string | number) => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-5 select-none px-6 max-w-lg mx-auto">
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            </div>

            <div className="text-center w-full">
                <h3 className="text-base font-semibold text-gray-800 mb-1.5">
                    Falha ao carregar o diagrama ER
                </h3>
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 font-mono text-left break-words overflow-x-auto">
                    {message}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tentar novamente
                </button>

                <Link
                    href="/home/conexao"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all"
                >
                    <Database className="w-3.5 h-3.5 text-gray-500" />
                    Gerir Conexões
                </Link>
            </div>

            {availableConnections.length > 1 && (
                <div className="w-full mt-4 border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 text-center">Ou escolha outra conexão salva:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                        {availableConnections.map(c => (
                            <button
                                key={c.id}
                                onClick={() => onSelectConnection(c.id)}
                                className="flex items-center gap-2 p-2 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-xs"
                            >
                                <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <div className="truncate">
                                    <div className="font-medium text-gray-800 truncate">{c.name}</div>
                                    <div className="text-[10px] text-gray-400">{c.type}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tela Sem Tabelas ─────────────────────────────────────────────────────────

function EmptyState({ dbName, onRefresh }: { dbName?: string; onRefresh: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 select-none px-6">
            <div className="relative w-24 h-20">
                {[
                    { left: '0%', top: '0%', w: '45%', h: '60%' },
                    { left: '55%', top: '0%', w: '45%', h: '80%' },
                    { left: '15%', top: '70%', w: '45%', h: '30%' },
                ].map((s, i) => (
                    <div
                        key={i}
                        className="absolute rounded border border-dashed border-gray-300 bg-gray-50"
                        style={{ left: s.left, top: s.top, width: s.w, height: s.h }}
                    />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Table className="w-7 h-7 text-gray-400" />
                </div>
            </div>

            <div className="text-center max-w-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Nenhuma tabela de negócio encontrada</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Conectado a <span className="font-mono font-semibold text-gray-700">{dbName || 'banco de dados'}</span>, mas não há tabelas de aplicação para desenhar o diagrama.
                </p>
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Recarregar Schema
                    </button>
                    <Link
                        href="/home/tabelas"
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Criar Tabela
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Tela Sem Conexão ─────────────────────────────────────────────────────────

function NoConnectionState({
    connections,
    onSelectConnection,
    isLoading
}: {
    connections: SavedConnection[];
    onSelectConnection: (id: string | number) => void;
    isLoading: boolean;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-5 select-none px-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                <Database className="w-8 h-8 text-blue-600" />
            </div>

            <div className="text-center">
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                    Visualizador de Modelo de Dados (ER)
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                    {connections.length > 0
                        ? 'Selecione uma das suas conexões para inspecionar tabelas, colunas e relacionamentos.'
                        : 'Nenhuma conexão ativa encontrada. Adicione uma conexão para começar a visualizar schemas.'}
                </p>
            </div>

            {connections.length > 0 ? (
                <div className="w-full space-y-2 mt-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Conexões Salvas ({connections.length})
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
                        {connections.map(conn => (
                            <button
                                key={conn.id}
                                onClick={() => onSelectConnection(conn.id)}
                                disabled={isLoading}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm transition-all text-left group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <HardDrive className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600">
                                            {conn.name}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 truncate">
                                            {conn.type?.toUpperCase()} · {conn.host || 'localhost'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-blue-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Explorar →
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="pt-2 flex justify-center">
                        <Link
                            href="/home/conexao"
                            className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Configurar nova conexão
                        </Link>
                    </div>
                </div>
            ) : (
                <Link
                    href="/home/conexao"
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm transition-all mt-2"
                >
                    <Plus className="w-4 h-4" />
                    Criar Primeira Conexão
                </Link>
            )}
        </div>
    );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function MLLPanel() {
    const { user, api } = useSession();

    const [loading, setLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DBConnection | null>(null);

    // Conexões salvas disponíveis no sistema
    const [availableConnections, setAvailableConnections] = useState<SavedConnection[]>([]);
    const [activeConnectionId, setActiveConnectionId] = useState<string | number | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);

    // ── Busca lista de conexões disponíveis ───────────────────────────────────
    useEffect(() => {
        let mounted = true;
        const fetchConnectionsList = async () => {
            try {
                const res = await api.get<any>('/conn/connections/', {
                    params: { page: 1, limit: 50 },
                    withCredentials: true,
                });
                if (mounted && res?.data) {
                    const list = res.data.results || res.data.data || (Array.isArray(res.data) ? res.data : []);
                    setAvailableConnections(list);
                }
            } catch (err) {
                console.warn('Não foi possível carregar lista de conexões:', err);
            }
        };
        fetchConnectionsList();
        return () => { mounted = false; };
    }, [api]);

    // ── Inicializa ID de conexão ativa ─────────────────────────────────────────
    useEffect(() => {
        const sessionConnId = user?.info_extra?.id_connection;
        if (sessionConnId) {
            setActiveConnectionId(sessionConnId);
        } else if (availableConnections.length > 0 && !activeConnectionId) {
            // Auto-seleciona a conectada ou primeira disponível
            const connectedOne = availableConnections.find(c => c.status === 'connected');
            setActiveConnectionId(connectedOne ? connectedOne.id : availableConnections[0].id);
        }
    }, [user?.info_extra?.id_connection, availableConnections, activeConnectionId]);

    // ── Busca de dados do schema ──────────────────────────────────────────────
    const fetchData = useCallback(async (connectionId: string | number, refresh = false): Promise<void> => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await api.get<DBConnection>(`/conn/db_full/${connectionId}`, {
                params: refresh ? { refresh: true } : undefined,
                withCredentials: true,
            });
            setData(response.data);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : err && typeof err === 'object' && 'message' in err
                    ? String((err as any).message)
                    : 'Erro desconhecido ao carregar dados do banco';

            setError(errorMessage);
            console.error('Erro ao carregar esquema:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [api]);

    useEffect(() => {
        if (activeConnectionId) {
            fetchData(activeConnectionId);
        } else {
            setLoading(false);
        }
    }, [activeConnectionId, fetchData]);

    const handleRetry = useCallback(() => {
        if (activeConnectionId) fetchData(activeConnectionId, true);
    }, [activeConnectionId, fetchData]);

    const handleSelectConnection = useCallback((id: string | number) => {
        setActiveConnectionId(id);
    }, []);

    // ── Layout do diagrama ────────────────────────────────────────────────────
    const { tables, relationships, svgWidth, svgHeight, hasValidTables } = useMemo(() => {
        if (!data?.structures || data.structures.length === 0) {
            return { tables: [], relationships: [], svgWidth: 0, svgHeight: 0, hasValidTables: false };
        }

        const validStructures = data.structures.filter(
            table => !isSystemTable(table.table_name, table.schema_name, data.type || user?.info_extra?.type).isSystem
        );

        if (validStructures.length === 0) {
            return { tables: [], relationships: [], svgWidth: 0, svgHeight: 0, hasValidTables: false };
        }

        // ── Ordenação por vizinhança (BFS) ────────────────────────────────────
        const porNome = new Map(validStructures.map(t => [t.table_name, t]));

        const vizinhos = new Map<string, Set<string>>();
        validStructures.forEach(t => vizinhos.set(t.table_name, new Set()));
        validStructures.forEach(tabela => {
            tabela.fields?.forEach(campo => {
                const alvo = campo.is_foreign_key ? campo.referenced_table : null;
                if (!alvo || alvo === tabela.table_name || !porNome.has(alvo)) return;
                vizinhos.get(tabela.table_name)!.add(alvo);
                vizinhos.get(alvo)!.add(tabela.table_name);
            });
        });

        const grau = (nome: string) => vizinhos.get(nome)?.size ?? 0;
        const porRelevancia = [...validStructures].sort(
            (a, b) => grau(b.table_name) - grau(a.table_name)
                || a.table_name.localeCompare(b.table_name)
        );

        const visitadas = new Set<string>();
        const ordenadas: typeof validStructures = [];

        porRelevancia.forEach(inicio => {
            if (visitadas.has(inicio.table_name)) return;

            const fila = [inicio.table_name];
            visitadas.add(inicio.table_name);

            while (fila.length) {
                const nome = fila.shift()!;
                const tabela = porNome.get(nome);
                if (tabela) ordenadas.push(tabela);

                [...(vizinhos.get(nome) ?? [])]
                    .sort((a, b) => grau(b) - grau(a) || a.localeCompare(b))
                    .forEach(vizinho => {
                        if (visitadas.has(vizinho)) return;
                        visitadas.add(vizinho);
                        fila.push(vizinho);
                    });
            }
        });

        // ── Posicionamento balanceado ─────────────────────────────────────────
        const positionedTables: PositionedTable[] = [];
        const yOffsets = new Array(COLUMNS).fill(50);
        let maxColumnHeight = 0;

        ordenadas.forEach(table => {
            const column = yOffsets.indexOf(Math.min(...yOffsets));
            const x = 50 + column * (BOX_WIDTH + GAP_X);
            const y = yOffsets[column];
            const height = HEADER_HEIGHT + (table.fields?.length || 0) * ROW_HEIGHT + 10;

            positionedTables.push({ ...table, x, y, width: BOX_WIDTH, height });
            yOffsets[column] += height + GAP_Y;
            if (yOffsets[column] > maxColumnHeight) maxColumnHeight = yOffsets[column];
        });

        const relationshipsList: Relationship[] = [];
        const tableMap = new Map<string, PositionedTable>();
        positionedTables.forEach(t => tableMap.set(t.table_name, t));

        positionedTables.forEach(sourceTable => {
            if (!sourceTable.fields) return;
            sourceTable.fields.forEach((field, fieldIndex) => {
                if (!field.is_foreign_key || !field.referenced_table) return;

                const targetTable = tableMap.get(field.referenced_table);
                if (!targetTable) {
                    return;
                }

                const startY = sourceTable.y + HEADER_HEIGHT + fieldIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                const selfReference = targetTable.table_name === sourceTable.table_name;

                if (selfReference) {
                    relationshipsList.push({
                        id: `${sourceTable.table_name}-${field.name}-self`,
                        fromTable: sourceTable.table_name,
                        toTable: targetTable.table_name,
                        fieldName: field.name,
                        startX: sourceTable.x + BOX_WIDTH,
                        startY,
                        endX: sourceTable.x + BOX_WIDTH,
                        endY: sourceTable.y + HEADER_HEIGHT / 2,
                        startSide: 'right',
                        endSide: 'right',
                        selfReference: true,
                    });
                    return;
                }

                const alvoADireita = targetTable.x > sourceTable.x;
                const startSide = alvoADireita ? 'right' : 'left';
                const endSide = alvoADireita ? 'left' : 'right';

                relationshipsList.push({
                    id: `${sourceTable.table_name}-${field.name}-${targetTable.table_name}`,
                    fromTable: sourceTable.table_name,
                    toTable: targetTable.table_name,
                    fieldName: field.name,
                    startX: startSide === 'right' ? sourceTable.x + BOX_WIDTH : sourceTable.x,
                    startY,
                    endX: endSide === 'right' ? targetTable.x + BOX_WIDTH : targetTable.x,
                    endY: targetTable.y + HEADER_HEIGHT / 2,
                    startSide,
                    endSide,
                });
            });
        });

        return {
            tables: positionedTables,
            relationships: relationshipsList,
            svgWidth: 50 + COLUMNS * (BOX_WIDTH + GAP_X) - GAP_X + 50,
            svgHeight: maxColumnHeight + 50,
            hasValidTables: true,
        };
    }, [data, user?.info_extra?.type]);

    // ── Exportações ───────────────────────────────────────────────────────────
    const downloadSVG = useCallback((): void => {
        if (!svgRef.current) return;
        try {
            const svgData = new XMLSerializer()
                .serializeToString(svgRef.current)
                .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagrama-${data?.name || 'database'}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erro ao exportar SVG:', err);
        }
    }, [data?.name]);

    const downloadPNG = useCallback((): void => {
        if (!svgRef.current) return;
        try {
            const svgData = new XMLSerializer()
                .serializeToString(svgRef.current)
                .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            const canvas = document.createElement('canvas');

            const escala = Math.min(2, Math.max(1, 16_000_000 / (svgWidth * svgHeight)));
            canvas.width = Math.round(svgWidth * escala);
            canvas.height = Math.round(svgHeight * escala);

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Falha no contexto 2D');
            ctx.scale(escala, escala);

            img.onload = () => {
                try {
                    ctx.fillStyle = COLORS.background;
                    ctx.fillRect(0, 0, svgWidth, svgHeight);
                    ctx.drawImage(img, 0, 0);
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `diagrama-${data?.name || 'database'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error('Erro ao converter PNG:', err);
                }
            };
            img.onerror = () => URL.revokeObjectURL(url);
            img.src = url;
        } catch (err) {
            console.error('Erro na exportação PNG:', err);
        }
    }, [data?.name, svgWidth, svgHeight]);

    // ── Estados não prontos (Loading, Erro, Sem Conexão, Sem Tabelas) ─────────
    const noConnection = !activeConnectionId;

    if (loading || error || !hasValidTables || noConnection) {
        return (
            <div className="w-full h-screen bg-gray-50 flex flex-col">
                {/* Header Top Bar */}
                <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
                    <Link
                        href="/home"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title="Voltar para a página inicial"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-semibold text-gray-800">Visualizador de Schema (ER)</h1>
                        <p className="text-xs text-gray-400">
                            {loading
                                ? 'Carregando estrutura de banco...'
                                : noConnection
                                    ? 'Selecione uma conexão'
                                    : error
                                        ? 'Erro na leitura do schema'
                                        : 'Nenhuma tabela encontrada'}
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Link
                            href="/home/conexao"
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <Database className="w-3.5 h-3.5 text-gray-500" />
                            Gerir Conexões
                        </Link>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center p-6">
                    {loading && <LoadingState dbName={data?.name} />}
                    {!loading && noConnection && (
                        <NoConnectionState
                            connections={availableConnections}
                            onSelectConnection={handleSelectConnection}
                            isLoading={loading}
                        />
                    )}
                    {!loading && !noConnection && error && (
                        <ErrorState
                            message={error}
                            onRetry={handleRetry}
                            availableConnections={availableConnections}
                            onSelectConnection={handleSelectConnection}
                        />
                    )}
                    {!loading && !noConnection && !error && !hasValidTables && (
                        <EmptyState dbName={data?.name} onRefresh={handleRetry} />
                    )}
                </div>

                <footer className="flex items-center gap-4 px-4 py-1.5 bg-white border-t border-gray-200 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${error ? 'bg-red-400' : loading ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-[11px] text-gray-400">
                            {loading ? 'Sincronizando com o banco...' : error ? 'Falha na conexão' : 'Aguardando seleção'}
                        </span>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <SchemaViewer
            data={data!}
            tables={tables}
            relationships={relationships}
            svgWidth={svgWidth}
            svgHeight={svgHeight}
            svgRef={svgRef}
            onDownloadSVG={downloadSVG}
            onDownloadPNG={downloadPNG}
            availableConnections={availableConnections}
            activeConnectionId={activeConnectionId}
            onSelectConnection={handleSelectConnection}
            onRefresh={handleRetry}
            isRefreshing={isRefreshing}
        />
    );
}