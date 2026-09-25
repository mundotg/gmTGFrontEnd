'use client';

import { useSession } from '@/context/SessionContext';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    BOX_WIDTH, COLORS, COLUMNS, GAP_X, GAP_Y,
    HEADER_HEIGHT, PositionedTable, Relationship,
    ROW_HEIGHT
} from './constant';
import SchemaViewer from './component/SchemaViewer';
import { isSystemTable } from '../tabelas/componentTabela/util';
import { DBConnection } from '@/types/db-structure';

// ─── Tela de Carregamento ─────────────────────────────────────────────────────

function LoadingState() {
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
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="1.5" />
                        <path strokeLinecap="round" strokeWidth="1.5" d="M3 5v4c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
                        <path strokeLinecap="round" strokeWidth="1.5" d="M3 9v4c0 1.657 4.03 3 9 3s9-1.343 9-3V9" />
                        <path strokeLinecap="round" strokeWidth="1.5" d="M3 13v4c0 1.657 4.03 3 9 3s9-1.343 9-3v-4" />
                    </svg>
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">Carregando schema</p>
                <div className="flex items-center gap-1 justify-center">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
            </div>

            {/* Barra de progresso indeterminada */}
            <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-[loading-bar_1.8s_ease-in-out_infinite]" />
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-5 select-none px-6">
            {/* Ícone animado de erro */}
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                {/* Dot de status vermelho no canto */}
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
            </div>

            <div className="text-center max-w-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
                    Falha ao carregar o diagrama
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 font-mono">
                    {message}
                </p>
            </div>

            <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar novamente
            </button>
        </div>
    );
}

// ─── Tela Sem Tabelas ─────────────────────────────────────────────────────────

function EmptyState({ dbName }: { dbName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 select-none px-6">
            {/* Grade decorativa representando um schema vazio */}
            <div className="relative w-24 h-20">
                {/* 3 retângulos de tabela "fantasmas" */}
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
                {/* Ícone central */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                </div>
            </div>

            <div className="text-center max-w-xs">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Nenhuma tabela encontrada</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Conectado a{' '}
                    <span className="font-mono font-medium text-gray-500">{dbName || 'database'}</span>
                    , mas não há tabelas de negócio para exibir. Tabelas de sistema foram filtradas.
                </p>
            </div>
        </div>
    );
}

// ─── Tela Sem Conexão ─────────────────────────────────────────────────────────

function NoConnectionState() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 select-none px-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </div>
            <div className="text-center max-w-xs">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Sem conexão selecionada</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Selecione uma conexão de banco de dados para visualizar o diagrama de schema.
                </p>
            </div>
        </div>
    );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function MLLPanel() {
    const { user, api } = useSession();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DBConnection | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);

    // ── Busca de dados ────────────────────────────────────────────────────────

    const fetchData = useCallback(async (connectionId: string | number, refresh = false): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            // O load inicial usa a cache Redis (rápido); "Tentar novamente"
            // força recarga (refresh=true) para recalcular o schema.
            const response = await api.get<DBConnection>(`/conn/db_full/${connectionId}`, {
                params: refresh ? { refresh: true } : undefined,
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
        }
    }, [api]);

    useEffect(() => {
        const connectionId = user?.info_extra?.id_connection;
        if (connectionId) {
            fetchData(connectionId);
        } else {
            setLoading(false);
        }
    }, [user?.info_extra?.id_connection, fetchData]);

    const handleRetry = useCallback(() => {
        const connectionId = user?.info_extra?.id_connection;
        if (connectionId) fetchData(connectionId, true); // força recarga (ignora cache)
    }, [user?.info_extra?.id_connection, fetchData]);

    // ── Layout do diagrama ────────────────────────────────────────────────────

    const { tables, relationships, svgWidth, svgHeight, hasValidTables } = useMemo(() => {
        if (!data?.structures || data.structures.length === 0) {
            return { tables: [], relationships: [], svgWidth: 0, svgHeight: 0, hasValidTables: false };
        }

        const validStructures = data.structures.filter(
            table => !isSystemTable(table.table_name, table.schema_name, user?.info_extra?.type).isSystem
        );

        if (validStructures.length === 0) {
            return { tables: [], relationships: [], svgWidth: 0, svgHeight: 0, hasValidTables: false };
        }

        // ── Ordenação por vizinhança ──────────────────────────────────────
        //
        // A ordem alfabética (ou a que vem da API) espalha tabelas relacionadas
        // pelo diagrama todo e as linhas atravessam tudo. Percorre-se o grafo de
        // chaves estrangeiras em largura, a partir da tabela com mais ligações,
        // para que cada grupo relacionado fique junto no grid.
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
        // Empate desfeito pelo nome: sem isso a mesma base dava layouts
        // diferentes entre recargas.
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

        // ── Posicionamento ────────────────────────────────────────────────
        const positionedTables: PositionedTable[] = [];
        const yOffsets = new Array(COLUMNS).fill(50);
        let maxColumnHeight = 0;

        ordenadas.forEach(table => {
            // Coluna mais curta em vez de `index % COLUMNS`: com tabelas de
            // alturas muito diferentes, o resto da divisão deixava uma coluna
            // gigante ao lado de duas quase vazias.
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
                    console.warn(`FK referência tabela inexistente ou de sistema: ${field.referenced_table}`);
                    return;
                }

                const startY = sourceTable.y + HEADER_HEIGHT + fieldIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                const selfReference = targetTable.table_name === sourceTable.table_name;

                // Uma FK para a própria tabela (árvores, hierarquias) tinha
                // início e fim na mesma caixa e desenhava um risco por cima
                // dela. Sai e entra pela direita, como laço.
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

                // A linha sai pela aresta virada para o destino e entra pela
                // aresta virada para a origem. Antes eram fixas (esquerda →
                // direita) e, quando o destino estava à direita, a curva
                // atravessava o diagrama de volta.
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
        // `user?.info_extra?.type` entra no filtro de tabelas de sistema: sem ele
        // na lista, trocar de conexão reutilizava o layout da anterior.
    }, [data, user?.info_extra?.type]);

    // ── Exportação ────────────────────────────────────────────────────────────

    const downloadSVG = useCallback((): void => {
        if (!svgRef.current) return;
        try {
            // Sem o xmlns, o ficheiro abre no navegador mas é recusado por
            // editores (Inkscape, Illustrator) e por qualquer conversor.
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

            // O PNG saía à escala 1:1 do SVG e ficava ilegível assim que se
            // ampliava — num diagrama com dezenas de tabelas, os nomes dos
            // campos são o que interessa. Exporta-se a 2×, com teto para não
            // rebentar o limite de área do canvas em bases muito grandes.
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

    // ── Wrapper de estado ─────────────────────────────────────────────────────
    // Todos os estados de "não pronto" usam o mesmo shell com altura total,
    // garantindo que o layout não pule quando o SchemaViewer carrega.

    const noConnection = !user?.info_extra?.id_connection;

    if (loading || error || !hasValidTables || noConnection) {
        return (
            <div className="w-full h-screen bg-gray-50 flex flex-col">
                {/* Mini top bar para manter consistência visual com o SchemaViewer */}
                <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
                    <div className="w-8 h-8 rounded-md border border-gray-200 bg-gray-50 flex flex-col justify-center gap-[5px] items-center opacity-40 pointer-events-none">
                        <span className="block h-[1.5px] w-4 rounded-full bg-gray-400" />
                        <span className="block h-[1.5px] w-4 rounded-full bg-gray-400" />
                        <span className="block h-[1.5px] w-4 rounded-full bg-gray-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-gray-400">Schema Viewer</h1>
                        <p className="text-xs text-gray-300 mt-0.5">
                            {loading ? 'Aguardando dados…' : noConnection ? 'Sem conexão' : error ? 'Erro na conexão' : 'Sem tabelas'}
                        </p>
                    </div>
                    <div className="ml-auto flex gap-2 opacity-30 pointer-events-none">
                        <div className="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-400">Exportar SVG</div>
                        <div className="px-3 py-1.5 text-xs rounded-md bg-blue-100 text-blue-300">Exportar PNG</div>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center">
                    {loading && <LoadingState />}
                    {!loading && noConnection && <NoConnectionState />}
                    {!loading && !noConnection && error && <ErrorState message={error} onRetry={handleRetry} />}
                    {!loading && !noConnection && !error && !hasValidTables && <EmptyState dbName={data?.name} />}
                </div>

                {/* Status bar fantasma */}
                <footer className="flex items-center gap-4 px-4 py-1.5 bg-white border-t border-gray-200 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${error ? 'bg-red-400' : loading ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-[11px] text-gray-400">
                            {loading ? 'Conectando…' : error ? 'Desconectado' : 'Aguardando'}
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
        />
    );
}