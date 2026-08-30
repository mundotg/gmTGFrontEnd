import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { COLORS, HEADER_HEIGHT, PositionedTable, Relationship, ROW_HEIGHT } from '../constant';
import { DBConnection } from '@/types/db-structure';

// ─── Tipagens ────────────────────────────────────────────────────────────────

interface SchemaViewerProps {
    data: DBConnection;
    tables: PositionedTable[];
    relationships: Relationship[];
    svgWidth: number;
    svgHeight: number;
    svgRef: React.RefObject<SVGSVGElement | null>;
    onDownloadSVG: () => void;
    onDownloadPNG: () => void;
}

type SelectedItem =
    | { type: 'table'; data: any }
    | { type: 'field'; data: any; parentTable: string }
    | null;

type SidebarTab = 'tables' | 'info';

interface ViewTransform {
    x: number;
    y: number;
    scale: number;
}

// ─── Constantes de zoom ───────────────────────────────────────────────────────

const MIN_SCALE = 0.15;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.15;

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function TableIcon({ active }: { active: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="12" height="12" rx="2"
                stroke={active ? '#3b82f6' : '#94a3b8'} strokeWidth="1.2" />
            <line x1="1" y1="5" x2="13" y2="5"
                stroke={active ? '#3b82f6' : '#94a3b8'} strokeWidth="1.2" />
            <line x1="1" y1="9" x2="13" y2="9"
                stroke={active ? '#3b82f6' : '#94a3b8'} strokeWidth="0.8" strokeDasharray="2 1" />
        </svg>
    );
}

function FieldBadge({ label, variant }: { label: string; variant: 'pk' | 'fk' | 'null' | 'notnull' | 'unique' }) {
    const styles: Record<string, string> = {
        pk: 'bg-amber-100 text-amber-700 border border-amber-200',
        fk: 'bg-blue-100 text-blue-700 border border-blue-200',
        null: 'bg-slate-100 text-slate-500 border border-slate-200',
        notnull: 'bg-orange-50 text-orange-600 border border-orange-200',
        unique: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    };
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[variant]}`}>
            {label}
        </span>
    );
}

function InfoRow({ label, value, mono = false, onClick }: {
    label: string; value: React.ReactNode; mono?: boolean; onClick?: () => void;
}) {
    return (
        <div className="flex justify-between items-start py-1.5 border-b border-gray-100 gap-2">
            <span className="text-[11px] text-gray-500 shrink-0">{label}</span>
            <span
                className={`text-[11px] font-medium text-right ${mono ? 'font-mono' : ''} ${onClick ? 'text-blue-600 cursor-pointer hover:underline' : 'text-gray-800'}`}
                onClick={onClick}
            >
                {value}
            </span>
        </div>
    );
}

// ─── Hook: Zoom + Pan ─────────────────────────────────────────────────────────

function useZoomPan(containerRef: React.RefObject<HTMLElement | null>) {
    const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
    const isDragging = useRef(false);
    const lastPointer = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

    // Zoom centrado no ponto do cursor (usado pelo scroll)
    const zoomAt = useCallback((clientX: number, clientY: number, deltaScale: number) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setTransform(prev => {
            const newScale = clampScale(prev.scale * deltaScale);
            const ratio = newScale / prev.scale;
            const px = clientX - rect.left;
            const py = clientY - rect.top;
            return {
                scale: newScale,
                x: px - ratio * (px - prev.x),
                y: py - ratio * (py - prev.y),
            };
        });
    }, [containerRef]);

    const zoomIn = useCallback(() => {
        setTransform(prev => ({ ...prev, scale: clampScale(prev.scale + ZOOM_STEP) }));
    }, []);

    const zoomOut = useCallback(() => {
        setTransform(prev => ({ ...prev, scale: clampScale(prev.scale - ZOOM_STEP) }));
    }, []);

    const resetView = useCallback(() => {
        setTransform({ x: 0, y: 0, scale: 1 });
    }, []);

    const fitView = useCallback((contentW: number, contentH: number) => {
        const container = containerRef.current;
        if (!container || contentW === 0 || contentH === 0) return;
        const { width, height } = container.getBoundingClientRect();
        const scale = clampScale(Math.min(width / contentW, height / contentH) * 0.88);
        setTransform({
            scale,
            x: (width - contentW * scale) / 2,
            y: (height - contentH * scale) / 2,
        });
    }, [containerRef]);

    // Wheel: ctrl/meta = zoom; senão = pan
    const onWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            // pinch-to-zoom no trackpad ou ctrl+scroll no mouse
            const factor = 1 - e.deltaY * 0.003;
            zoomAt(e.clientX, e.clientY, factor);
        } else {
            setTransform(prev => ({
                ...prev,
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY,
            }));
        }
    }, [zoomAt]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        isDragging.current = true;
        hasDragged.current = false;
        lastPointer.current = { x: e.clientX, y: e.clientY };
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }, []);

    const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

    // Registra wheel como passive:false para poder chamar preventDefault
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [containerRef, onWheel]);

    return {
        transform,
        hasDraggedNow: () => hasDragged.current,
        zoomIn, zoomOut, resetView, fitView,
        onMouseDown, onMouseMove, onMouseUp,
    };
}

// ─── Controles de zoom ────────────────────────────────────────────────────────

function ZoomControls({
    scale, onZoomIn, onZoomOut, onReset, onFit,
}: {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onFit: () => void;
}) {
    const btnBase = 'w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-1 select-none z-10">
            <button onClick={onZoomOut} disabled={scale <= MIN_SCALE} title="Diminuir zoom (−)" className={btnBase}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>

            <button
                onClick={onReset}
                title="Resetar zoom (0)"
                className="min-w-[46px] h-7 px-1 text-[11px] font-mono font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
                {Math.round(scale * 100)}%
            </button>

            <button onClick={onZoomIn} disabled={scale >= MAX_SCALE} title="Aumentar zoom (+)" className={btnBase}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            <div className="w-px h-4 bg-gray-200 mx-0.5" />

            <button onClick={onFit} title="Ajustar à tela (F)" className={btnBase}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1 4V1h3M9 1h3v3M12 9v3H9M4 12H1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}

/**
 * Curva de uma relação, respeitando por que aresta sai e por onde entra.
 *
 * A versão anterior usava sempre o ponto médio horizontal como controlo, o que
 * só funciona quando a linha vai da direita para a esquerda. Aqui os pontos de
 * controlo saem para FORA de cada caixa, na direção da respetiva aresta, e a
 * curva nunca entra por trás da tabela.
 */
function caminhoDaRelacao(rel: Relationship): string {
    const { startX, startY, endX, endY } = rel;

    if (rel.selfReference) {
        // Laço à direita da caixa. A largura acompanha a altura para que uma
        // tabela alta não fique com um laço achatado.
        const alcance = Math.max(40, Math.abs(startY - endY) * 0.6);
        return `M ${startX} ${startY} C ${startX + alcance} ${startY}, ${startX + alcance} ${endY}, ${endX} ${endY}`;
    }

    const paraDireita = (lado?: 'left' | 'right') => (lado === 'right' ? 1 : -1);
    const dirInicio = paraDireita(rel.startSide);
    const dirFim = paraDireita(rel.endSide);

    // Quanto mais longe, mais aberta a curva — mas com limite, senão as
    // ligações entre extremos do diagrama viram semicírculos gigantes.
    const distancia = Math.hypot(endX - startX, endY - startY);
    const alcance = Math.min(180, Math.max(50, distancia * 0.35));

    const c1x = startX + dirInicio * alcance;
    const c2x = endX + dirFim * alcance;

    return `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function SchemaViewer({
    data, tables, relationships, svgWidth, svgHeight, svgRef,
    onDownloadSVG, onDownloadPNG,
}: SchemaViewerProps) {

    const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

    // Nome da tabela em foco — seja por ter sido escolhida na lista, seja por
    // ter sido selecionado um campo dentro dela.
    const tabelaSelecionada = useMemo(() => {
        if (!selectedItem) return null;
        return selectedItem.type === 'table'
            ? selectedItem.data.table_name
            : selectedItem.parentTable;
    }, [selectedItem]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTab>('tables');
    const [tableSearch, setTableSearch] = useState('');

    const diagramRef = useRef<HTMLDivElement>(null);

    const {
        transform, hasDraggedNow,
        zoomIn, zoomOut, resetView, fitView,
        onMouseDown, onMouseMove, onMouseUp,
    } = useZoomPan(diagramRef as React.RefObject<HTMLElement | null>);

    const totalFields = useMemo(
        () => tables.reduce((acc, t) => acc + (t.fields?.length || 0), 0),
        [tables]
    );

    const filteredTables = useMemo(
        () => tables.filter(t => t.table_name?.toLowerCase().includes(tableSearch.toLowerCase())),
        [tables, tableSearch]
    );

    // Fit automático na primeira carga
    useEffect(() => {
        if (svgWidth > 0 && svgHeight > 0) {
            const t = setTimeout(() => fitView(svgWidth, svgHeight), 80);
            return () => clearTimeout(t);
        }
    }, [svgWidth, svgHeight, fitView]);

    // Atalhos de teclado
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
            if (e.key === '-') { e.preventDefault(); zoomOut(); }
            if (e.key === '0') { e.preventDefault(); resetView(); }
            if (e.key === 'f' || e.key === 'F') { e.preventDefault(); fitView(svgWidth, svgHeight); }
            if (e.key === 'Escape') setSelectedItem(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [zoomIn, zoomOut, resetView, fitView, svgWidth, svgHeight]);

    function selectTable(table: any) { setSelectedItem({ type: 'table', data: table }); }
    function selectField(field: any, parentTableName: string) {
        setSelectedItem({ type: 'field', data: field, parentTable: parentTableName });
    }
    function closeDetail() { setSelectedItem(null); }

    // Diferencia drag de click — evita abrir painel ao arrastar
    function handleTableClick(table: any) {
        if (!hasDraggedNow()) selectTable(table);
    }
    function handleFieldClick(e: React.MouseEvent, field: any, tableName: string) {
        e.stopPropagation();
        if (!hasDraggedNow()) selectField(field, tableName);
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

            {/* TOP BAR */}
            <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0 shadow-sm">
                <button
                    aria-label={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
                    onClick={() => setSidebarOpen(v => !v)}
                    className={`w-8 h-8 flex flex-col justify-center gap-[5px] items-center rounded-md border transition-all duration-200 cursor-pointer
                        ${sidebarOpen ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-200'}`}
                >
                    <span className={`block h-[1.5px] w-4 rounded-full transition-all duration-200 ${sidebarOpen ? 'bg-blue-600 translate-y-[6.5px] rotate-45' : 'bg-gray-500'}`} />
                    <span className={`block h-[1.5px] w-4 rounded-full transition-all duration-200 ${sidebarOpen ? 'opacity-0' : 'bg-gray-500'}`} />
                    <span className={`block h-[1.5px] w-4 rounded-full transition-all duration-200 ${sidebarOpen ? 'bg-blue-600 -translate-y-[6.5px] -rotate-45' : 'bg-gray-500'}`} />
                </button>

                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-gray-800 truncate">{data?.name || 'Schema Viewer'}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {tables.length} tabelas · {relationships.length} relações · {totalFields} campos
                    </p>
                </div>

                {/* Hints de atalho */}
                <div className="hidden md:flex items-center gap-2 mr-1">
                    {[['ctrl+scroll', 'zoom'], ['scroll', 'pan'], ['F', 'fit']].map(([k, v]) => (
                        <span key={k} className="text-[10px] text-gray-400 flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[10px]">{k}</kbd>
                            {v}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={onDownloadSVG}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                        Exportar SVG
                    </button>
                    <button onClick={onDownloadPNG}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                        Exportar PNG
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* SIDEBAR */}
                <aside
                    className={`flex flex-col shrink-0 bg-white border-r border-gray-200 overflow-hidden transition-all duration-200 ease-in-out
                        ${sidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0'}`}
                    aria-hidden={!sidebarOpen}
                >
                    <div className="flex border-b border-gray-100 shrink-0">
                        {(['tables', 'info'] as SidebarTab[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors
                                    ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                {tab === 'tables' ? 'Tabelas' : 'Info DB'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'tables' && (
                            <div className="p-3">
                                <input
                                    type="search"
                                    placeholder="Buscar tabela..."
                                    value={tableSearch}
                                    onChange={e => setTableSearch(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 mb-2"
                                />
                                {filteredTables.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-6">Nenhuma tabela encontrada.</p>
                                )}
                                {filteredTables.map(table => {
                                    const isActive = selectedItem?.type === 'table' && selectedItem.data.table_name === table.table_name;
                                    return (
                                        <button key={table.table_name} onClick={() => selectTable(table)}
                                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-md mb-1 text-left transition-colors duration-100 cursor-pointer
                                                ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                                            <TableIcon active={isActive} />
                                            <span className="flex-1 text-xs font-medium truncate">{table.table_name}</span>
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                {table.fields?.length || 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="p-3">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-1">Conexão</p>
                                <InfoRow label="Nome" value={data?.name || '—'} />
                                <InfoRow label="Driver" value={data?.type || 'PostgreSQL'} mono />
                                <InfoRow label="Host" value={data?.host || '—'} mono />
                                <InfoRow label="Porta" value={data?.port || '5432'} mono />

                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-5">Estatísticas</p>
                                <InfoRow label="Tabelas" value={tables.length} />
                                <InfoRow label="Campos total" value={totalFields} />
                                <InfoRow label="Relações" value={relationships.length} />
                                <InfoRow label="PKs" value={tables.reduce((a, t) => a + (t.fields?.filter((f: any) => f.is_primary_key).length || 0), 0)} />
                                <InfoRow label="FKs" value={tables.reduce((a, t) => a + (t.fields?.filter((f: any) => f.is_foreign_key).length || 0), 0)} />

                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-5">Atalhos</p>
                                {[
                                    ['scroll', 'Pan (mover)'],
                                    ['ctrl + scroll', 'Zoom'],
                                    ['+ / −', 'Zoom in/out'],
                                    ['0', 'Reset zoom'],
                                    ['F', 'Fit na tela'],
                                    ['Esc', 'Fechar detalhe'],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                        <kbd className="text-[10px] font-mono bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">{k}</kbd>
                                        <span className="text-[11px] text-gray-500">{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* DIAGRAMA + ZOOM/PAN */}
                <main
                    ref={diagramRef}
                    className="flex-1 overflow-hidden bg-gray-50 relative"
                    style={{ cursor: 'grab' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                >
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            backgroundColor: COLORS.background,
                            display: 'block',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                    >
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.arrowColor} />
                            </marker>
                            <marker id="arrowheadActive" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                            </marker>
                            <filter id="tableShadow" x="-8%" y="-8%" width="116%" height="116%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
                            </filter>
                            <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="100%" stopColor="#f1f5f9" />
                            </linearGradient>
                            <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#eff6ff" />
                                <stop offset="100%" stopColor="#dbeafe" />
                            </linearGradient>
                        </defs>

                        {/* Transform único de zoom + pan */}
                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>

                            {/* Relacionamentos */}
                            <g id="relationships-layer">
                                {relationships.map(rel => {
                                    const ligadaAoSelecionado =
                                        !!tabelaSelecionada &&
                                        (rel.fromTable === tabelaSelecionada || rel.toTable === tabelaSelecionada);

                                    // Com uma tabela escolhida, as outras linhas
                                    // esbatem-se: num diagrama com dezenas de
                                    // tabelas é a diferença entre ver as
                                    // ligações e ver um novelo.
                                    const cor = ligadaAoSelecionado ? '#2563eb' : COLORS.relationLine;
                                    const opacidade = !tabelaSelecionada ? 1 : ligadaAoSelecionado ? 1 : 0.12;

                                    return (
                                        <path
                                            key={rel.id}
                                            d={caminhoDaRelacao(rel)}
                                            fill="none"
                                            stroke={cor}
                                            strokeWidth={ligadaAoSelecionado ? 2 : 1.5}
                                            opacity={opacidade}
                                            markerEnd={ligadaAoSelecionado ? 'url(#arrowheadActive)' : 'url(#arrowhead)'}
                                            className="transition-all duration-150 hover:stroke-blue-400"
                                        >
                                            <title>
                                                {`${rel.fromTable}.${rel.fieldName ?? '?'} → ${rel.toTable}`}
                                            </title>
                                        </path>
                                    );
                                })}
                            </g>

                            {/* Tabelas */}
                            <g id="tables-layer">
                                {tables.map(table => {
                                    const isSel = selectedItem?.type === 'table' && selectedItem.data.table_name === table.table_name;
                                    return (
                                        <g
                                            key={table.table_name}
                                            transform={`translate(${table.x}, ${table.y})`}
                                            className="cursor-pointer group"
                                            onClick={() => handleTableClick(table)}
                                            role="button"
                                            aria-label={`Tabela ${table.table_name}`}
                                        >
                                            <rect width={table.width} height={table.height}
                                                fill={COLORS.tableBg}
                                                stroke={isSel ? '#3b82f6' : COLORS.tableBorder}
                                                strokeWidth={isSel ? '2' : '1'}
                                                rx="8" filter="url(#tableShadow)"
                                                className="transition-all duration-150 group-hover:stroke-blue-300"
                                            />
                                            <rect width={table.width} height={HEADER_HEIGHT}
                                                fill={isSel ? 'url(#selectedGradient)' : 'url(#headerGradient)'}
                                                rx="8"
                                            />
                                            <rect y={HEADER_HEIGHT - 8} width={table.width} height={8}
                                                fill={isSel ? '#dbeafe' : '#f1f5f9'}
                                            />
                                            <line x1="0" y1={HEADER_HEIGHT} x2={table.width} y2={HEADER_HEIGHT}
                                                stroke={isSel ? '#93c5fd' : COLORS.tableBorder} strokeWidth="1"
                                            />
                                            <text x="12" y={HEADER_HEIGHT / 2 + 5}
                                                fontFamily="'Segoe UI', system-ui, sans-serif"
                                                fontSize="13" fontWeight="600"
                                                fill={isSel ? '#1d4ed8' : COLORS.headerText}
                                            >
                                                {table.table_name}
                                            </text>

                                            {table.fields?.map((field: any, index: number) => {
                                                const fy = HEADER_HEIGHT + index * ROW_HEIGHT;
                                                const isFS = selectedItem?.type === 'field'
                                                    && selectedItem.data.name === field.name
                                                    && selectedItem.parentTable === table.table_name;
                                                const nameColor = isFS ? '#2563eb'
                                                    : field.is_primary_key ? '#b45309'
                                                        : field.is_foreign_key ? '#2563eb'
                                                            : COLORS.fieldText;
                                                const prefix = field.is_primary_key ? '⬡ ' : field.is_foreign_key ? '◈ ' : '   ';

                                                return (
                                                    <g key={`${table.table_name}-${field.name}`} className="cursor-pointer"
                                                        onClick={e => handleFieldClick(e, field, table.table_name)}>
                                                        {isFS && (
                                                            <rect y={fy + 1} x="2" width={table.width - 4} height={ROW_HEIGHT - 2}
                                                                fill="#eff6ff" rx="4" />
                                                        )}
                                                        <text x="10" y={fy + ROW_HEIGHT * 0.65}
                                                            fontFamily="'Fira Code', 'Courier New', monospace"
                                                            fontSize="11"
                                                            fontWeight={field.is_primary_key || field.is_foreign_key ? '600' : '400'}
                                                            fill={nameColor}
                                                        >
                                                            <tspan xmlSpace="preserve">{prefix}</tspan>
                                                            {field.name}
                                                        </text>
                                                        <text x={table.width - 10} y={fy + ROW_HEIGHT * 0.65}
                                                            fontFamily="'Fira Code', 'Courier New', monospace"
                                                            fontSize="10" textAnchor="end"
                                                            fill={isFS ? '#60a5fa' : COLORS.typeText}
                                                        >
                                                            {field.type?.split('(')[0]}
                                                        </text>
                                                        {index < (table.fields?.length ?? 0) - 1 && (
                                                            <line x1="8" y1={fy + ROW_HEIGHT}
                                                                x2={table.width - 8} y2={fy + ROW_HEIGHT}
                                                                stroke={COLORS.tableBorder} strokeWidth="0.5" opacity="0.5"
                                                            />
                                                        )}
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </g>
                        </g>
                    </svg>

                    <ZoomControls
                        scale={transform.scale}
                        onZoomIn={zoomIn}
                        onZoomOut={zoomOut}
                        onReset={resetView}
                        onFit={() => fitView(svgWidth, svgHeight)}
                    />
                </main>

                {/* PAINEL DE DETALHES */}
                <aside
                    className={`flex flex-col shrink-0 bg-white border-l border-gray-200 overflow-hidden transition-all duration-200 ease-in-out
                        ${selectedItem ? 'w-72 opacity-100' : 'w-0 opacity-0'}`}
                    aria-hidden={!selectedItem}
                >
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
                        <h2 className="text-xs font-semibold text-gray-700">
                            {selectedItem?.type === 'table' ? '📄 Tabela' : '✏️ Coluna'}
                        </h2>
                        <button onClick={closeDetail} aria-label="Fechar"
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors text-sm">
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        {selectedItem?.type === 'table' && (() => {
                            const t = selectedItem.data;
                            const tableRels = relationships.filter(r =>
                                r.fromTable === t.table_name || r.toTable === t.table_name
                            );
                            return (
                                <>
                                    <section>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Identificação</p>
                                        <InfoRow label="Nome" value={t.table_name} mono />
                                        <InfoRow label="Schema" value={t.schema_name || 'public'} mono />
                                        <InfoRow label="Colunas" value={t.fields?.length || 0} />
                                        {t.created_at && (
                                            <InfoRow label="Criado em" value={new Date(t.created_at).toLocaleDateString('pt-BR')} />
                                        )}
                                    </section>

                                    <section>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Colunas</p>
                                        <div className="space-y-2">
                                            {t.fields?.map((f: any) => (
                                                <div key={f.name}
                                                    className="p-2 rounded-md bg-gray-50 border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors"
                                                    onClick={() => selectField(f, t.table_name)}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[11px] font-mono font-medium text-gray-800">{f.name}</span>
                                                        <span className="ml-auto text-[10px] font-mono text-blue-500">{f.type?.split('(')[0]}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {f.is_primary_key && <FieldBadge label="PK" variant="pk" />}
                                                        {f.is_foreign_key && <FieldBadge label="FK" variant="fk" />}
                                                        {f.is_nullable ? <FieldBadge label="NULL" variant="null" /> : <FieldBadge label="NOT NULL" variant="notnull" />}
                                                        {f.is_unique && <FieldBadge label="UNIQUE" variant="unique" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {tableRels.length > 0 && (
                                        <section>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                                Relações ({tableRels.length})
                                            </p>
                                            {tableRels.map((r: any) => {
                                                const isOut = r.fromTable === t.table_name;
                                                return (
                                                    <div key={r.id} className="flex items-center gap-1.5 py-1.5 border-b border-gray-100">
                                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isOut ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                                            {isOut ? '→ saída' : '← entrada'}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-gray-700">
                                                            {isOut ? r.toTable : r.fromTable}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </section>
                                    )}
                                </>
                            );
                        })()}

                        {selectedItem?.type === 'field' && (() => {
                            const f = selectedItem.data;
                            const parentName = selectedItem.parentTable;
                            const parentTableData = tables.find(t => t.table_name === parentName);
                            return (
                                <>
                                    <section>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tabela</p>
                                        <InfoRow label="Origem" value={parentName} mono
                                            onClick={parentTableData ? () => selectTable(parentTableData) : undefined}
                                        />
                                    </section>

                                    <hr className="border-gray-100" />

                                    <section>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Coluna</p>
                                        <InfoRow label="Nome" value={f.name} mono />
                                        <InfoRow label="Tipo" value={f.type} mono />
                                        {f.default_value && <InfoRow label="Default" value={f.default_value} mono />}
                                    </section>

                                    <section>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Propriedades</p>
                                        <div className="grid grid-cols-2 gap-x-3">
                                            <InfoRow label="PK" value={f.is_primary_key ? '✅ Sim' : '✗ Não'} />
                                            <InfoRow label="FK" value={f.is_foreign_key ? '✅ Sim' : '✗ Não'} />
                                            <InfoRow label="NULL" value={f.is_nullable ? '✅ Sim' : '✗ Não'} />
                                            <InfoRow label="UNIQUE" value={f.is_unique ? '✅ Sim' : '✗ Não'} />
                                        </div>
                                    </section>

                                    {f.is_foreign_key && f.referenced_table && (
                                        <div className="p-3 rounded-md bg-blue-50 border border-blue-100">
                                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Referencia</p>
                                            <p className="text-xs font-mono text-blue-800">
                                                {f.referenced_table}{f.referenced_field ? `(${f.referenced_field})` : ''}
                                            </p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </aside>
            </div>

            {/* STATUS BAR */}
            <footer className="flex items-center gap-4 px-4 py-1.5 bg-white border-t border-gray-200 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-[11px] text-gray-500">Conectado</span>
                </div>
                {data?.host && <span className="text-[11px] text-gray-400">Host: {data.host}</span>}
                <span className="text-[11px] text-gray-400">
                    Zoom: {Math.round(transform.scale * 100)}%
                </span>
                {selectedItem && (
                    <span className="text-[11px] text-blue-500 ml-auto">
                        {selectedItem.type === 'table'
                            ? `Tabela: ${selectedItem.data.table_name}`
                            : `Campo: ${selectedItem.data.name} · ${selectedItem.parentTable}`}
                    </span>
                )}
            </footer>
        </div>
    );
}