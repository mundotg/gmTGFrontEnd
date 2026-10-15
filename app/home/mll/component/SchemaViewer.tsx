import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
    Database, Table, Key, ArrowLeft, RefreshCw, Download,
    ExternalLink, Copy, Check, Search, Maximize2, Minimize2,
    ChevronDown, Code2, Info, Eye, Layers, X
} from 'lucide-react';
import { COLORS, HEADER_HEIGHT, PositionedTable, Relationship, ROW_HEIGHT } from '../constant';
import { DBConnection } from '@/types/db-structure';
import { SavedConnection } from '@/types';

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
    availableConnections?: SavedConnection[];
    activeConnectionId?: string | number | null;
    onSelectConnection?: (connId: string | number) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

type SelectedItem =
    | { type: 'table'; data: PositionedTable }
    | { type: 'field'; data: any; parentTable: string }
    | null;

type SidebarTab = 'tables' | 'info';
type TableDetailTab = 'columns' | 'relations' | 'ddl';

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

function DriverBadge({ type }: { type?: string }) {
    const raw = (type || 'postgresql').toLowerCase();
    let label = 'PostgreSQL';
    let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

    if (raw.includes('mysql')) {
        label = 'MySQL';
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (raw.includes('sqlite')) {
        label = 'SQLite';
        colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (raw.includes('mongo')) {
        label = 'MongoDB';
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (raw.includes('sqlserver') || raw.includes('mssql')) {
        label = 'SQL Server';
        colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (raw.includes('oracle')) {
        label = 'Oracle';
        colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return (
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${colorClass}`}>
            {label}
        </span>
    );
}

function FieldBadge({ label, variant }: { label: string; variant: 'pk' | 'fk' | 'null' | 'notnull' | 'unique' }) {
    const styles: Record<string, string> = {
        pk: 'bg-amber-100 text-amber-800 border border-amber-200 font-semibold',
        fk: 'bg-blue-100 text-blue-800 border border-blue-200 font-semibold',
        null: 'bg-slate-100 text-slate-500 border border-slate-200',
        notnull: 'bg-orange-50 text-orange-700 border border-orange-200',
        unique: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    };
    return (
        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${styles[variant]}`}>
            {label}
        </span>
    );
}

function InfoRow({ label, value, mono = false, onClick }: {
    label: string; value: React.ReactNode; mono?: boolean; onClick?: () => void;
}) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-2">
            <span className="text-[11px] text-gray-500 shrink-0">{label}</span>
            <span
                className={`text-[11px] font-medium text-right truncate ${mono ? 'font-mono' : ''} ${onClick ? 'text-blue-600 cursor-pointer hover:underline' : 'text-gray-800'}`}
                onClick={onClick}
            >
                {value}
            </span>
        </div>
    );
}

// ─── Gerador de DDL (SQL) ────────────────────────────────────────────────────

function generateTableDDL(table: PositionedTable): string {
    const lines: string[] = [];
    const pks: string[] = [];
    const fks: string[] = [];

    table.fields?.forEach(field => {
        let line = `  "${field.name}" ${field.type?.toUpperCase() || 'VARCHAR(255)'}`;
        if (!field.is_nullable) line += ' NOT NULL';
        if (field.default_value) line += ` DEFAULT ${field.default_value}`;
        if (field.is_unique && !field.is_primary_key) line += ' UNIQUE';
        lines.push(line);

        if (field.is_primary_key) {
            pks.push(`"${field.name}"`);
        }
        if (field.is_foreign_key && field.referenced_table) {
            const refField = field.referenced_field ? `("${field.referenced_field}")` : '';
            fks.push(`  CONSTRAINT "fk_${table.table_name}_${field.name}" FOREIGN KEY ("${field.name}") REFERENCES "${field.referenced_table}"${refField}`);
        }
    });

    if (pks.length > 0) {
        lines.push(`  PRIMARY KEY (${pks.join(', ')})`);
    }

    if (fks.length > 0) {
        lines.push(...fks);
    }

    const tableName = table.schema_name ? `"${table.schema_name}"."${table.table_name}"` : `"${table.table_name}"`;
    return `CREATE TABLE ${tableName} (\n${lines.join(',\n')}\n);`;
}

function generateFullSchemaDDL(tables: PositionedTable[]): string {
    return tables.map(t => generateTableDDL(t)).join('\n\n');
}

// ─── Hook: Zoom + Pan ─────────────────────────────────────────────────────────

function useZoomPan(containerRef: React.RefObject<HTMLElement | null>) {
    const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
    const isDragging = useRef(false);
    const lastPointer = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

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

    // Focar suavemente em uma tabela específica
    const panTo = useCallback((targetX: number, targetY: number, targetWidth: number, targetHeight: number) => {
        const container = containerRef.current;
        if (!container) return;
        const { width, height } = container.getBoundingClientRect();
        setTransform(prev => {
            const scale = Math.max(0.85, prev.scale);
            return {
                scale,
                x: width / 2 - (targetX + targetWidth / 2) * scale,
                y: height / 2 - (targetY + targetHeight / 2) * scale,
            };
        });
    }, [containerRef]);

    const onWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
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

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [containerRef, onWheel]);

    return {
        transform,
        hasDraggedNow: () => hasDragged.current,
        zoomIn, zoomOut, resetView, fitView, panTo,
        onMouseDown, onMouseMove, onMouseUp,
    };
}

// ─── Controles de Zoom & Tela Cheia ──────────────────────────────────────────

function ZoomControls({
    scale, onZoomIn, onZoomOut, onReset, onFit, isFullscreen, onToggleFullscreen,
}: {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onFit: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}) {
    const btnBase = 'w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-1 select-none z-10">
            <button onClick={onZoomOut} disabled={scale <= MIN_SCALE} title="Diminuir zoom (−)" className={btnBase}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>

            <button
                onClick={onReset}
                title="Resetar zoom para 100% (0)"
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
                <Layers className="w-3.5 h-3.5" />
            </button>

            <button onClick={onToggleFullscreen} title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"} className={btnBase}>
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

// ─── Curva de Bezier para Relacionamentos ────────────────────────────────────

function caminhoDaRelacao(rel: Relationship): string {
    const { startX, startY, endX, endY } = rel;

    if (rel.selfReference) {
        const alcance = Math.max(40, Math.abs(startY - endY) * 0.6);
        return `M ${startX} ${startY} C ${startX + alcance} ${startY}, ${startX + alcance} ${endY}, ${endX} ${endY}`;
    }

    const paraDireita = (lado?: 'left' | 'right') => (lado === 'right' ? 1 : -1);
    const dirInicio = paraDireita(rel.startSide);
    const dirFim = paraDireita(rel.endSide);

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
    availableConnections = [],
    activeConnectionId,
    onSelectConnection,
    onRefresh,
    isRefreshing = false,
}: SchemaViewerProps) {

    const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTab>('tables');
    const [tableSearch, setTableSearch] = useState('');
    const [hoveredTable, setHoveredTable] = useState<string | null>(null);
    const [hoveredRel, setHoveredRel] = useState<string | null>(null);

    // Sub-abas do detalhe da tabela
    const [tableDetailTab, setTableDetailTab] = useState<TableDetailTab>('columns');
    const [copiedDDL, setCopiedDDL] = useState(false);
    const [copiedFullDDL, setCopiedFullDDL] = useState(false);

    // Dropdown de conexões
    const [connDropdownOpen, setConnDropdownOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const diagramRef = useRef<HTMLDivElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    const {
        transform, hasDraggedNow,
        zoomIn, zoomOut, resetView, fitView, panTo,
        onMouseDown, onMouseMove, onMouseUp,
    } = useZoomPan(diagramRef as React.RefObject<HTMLElement | null>);

    const totalFields = useMemo(
        () => tables.reduce((acc, t) => acc + (t.fields?.length || 0), 0),
        [tables]
    );

    // Mapeamento de tabelas para acesso O(1)
    const tableMap = useMemo(() => {
        const map = new Map<string, PositionedTable>();
        tables.forEach(t => map.set(t.table_name, t));
        return map;
    }, [tables]);

    // Filtragem de busca na lista lateral
    const filteredTables = useMemo(() => {
        const query = tableSearch.toLowerCase().trim();
        if (!query) return tables;
        return tables.filter(t =>
            t.table_name?.toLowerCase().includes(query) ||
            t.fields?.some(f => f.name?.toLowerCase().includes(query))
        );
    }, [tables, tableSearch]);

    // Tabela atualmente em foco (seja por seleção de tabela ou seleção de campo)
    const tabelaSelecionada = useMemo(() => {
        if (!selectedItem) return null;
        return selectedItem.type === 'table'
            ? selectedItem.data.table_name
            : selectedItem.parentTable;
    }, [selectedItem]);

    // Fit automático na carga
    useEffect(() => {
        if (svgWidth > 0 && svgHeight > 0) {
            const t = setTimeout(() => fitView(svgWidth, svgHeight), 100);
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

    // Seleção com foco automático
    const focusTable = useCallback((table: PositionedTable) => {
        setSelectedItem({ type: 'table', data: table });
        panTo(table.x, table.y, table.width, table.height);
    }, [panTo]);

    function selectTable(table: PositionedTable) {
        setSelectedItem({ type: 'table', data: table });
    }

    function selectField(field: any, parentTableName: string) {
        setSelectedItem({ type: 'field', data: field, parentTable: parentTableName });
    }

    function closeDetail() { setSelectedItem(null); }

    function handleTableClick(table: PositionedTable) {
        if (!hasDraggedNow()) focusTable(table);
    }

    function handleFieldClick(e: React.MouseEvent, field: any, tableName: string) {
        e.stopPropagation();
        if (!hasDraggedNow()) selectField(field, tableName);
    }

    // Alternar Tela Cheia
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            mainContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
        }
    }, []);

    // Copiar DDL da Tabela
    const handleCopyDDL = useCallback((table: PositionedTable) => {
        const ddl = generateTableDDL(table);
        navigator.clipboard.writeText(ddl).then(() => {
            setCopiedDDL(true);
            setTimeout(() => setCopiedDDL(false), 2000);
        });
    }, []);

    // Copiar DDL de Todo o Schema
    const handleCopyFullSchema = useCallback(() => {
        const ddl = generateFullSchemaDDL(tables);
        navigator.clipboard.writeText(ddl).then(() => {
            setCopiedFullDDL(true);
            setTimeout(() => setCopiedFullDDL(false), 2500);
        });
    }, [tables]);

    return (
        <div ref={mainContainerRef} className="flex flex-col h-screen bg-gray-50 overflow-hidden select-none">

            {/* TOP BAR */}
            <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shrink-0 shadow-sm z-20">
                {/* Botão Voltar */}
                <Link
                    href="/home"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Voltar ao início"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>

                {/* Botão Alternar Sidebar */}
                <button
                    aria-label={sidebarOpen ? 'Fechar painel lateral' : 'Abrir painel lateral'}
                    onClick={() => setSidebarOpen(v => !v)}
                    className={`w-8 h-8 flex flex-col justify-center gap-[5px] items-center rounded-lg border transition-all duration-200 cursor-pointer
                        ${sidebarOpen ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-gray-200 hover:bg-gray-100'}`}
                >
                    <span className={`block h-[1.5px] w-4 rounded-full transition-all duration-200 ${sidebarOpen ? 'bg-blue-600 translate-y-[6.5px] rotate-45' : 'bg-gray-500'}`} />
                    <span className={`block h-[1.5px] w-4 rounded-full transition-all duration-200 ${sidebarOpen ? 'opacity-0' : 'bg-gray-500'}`} />
                    <span className={`block h-[1.5px] w-4 rounded-full transition-all duration-200 ${sidebarOpen ? 'bg-blue-600 -translate-y-[6.5px] -rotate-45' : 'bg-gray-500'}`} />
                </button>

                {/* Switcher de Conexão */}
                <div className="relative">
                    <button
                        onClick={() => setConnDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 bg-white hover:bg-gray-50 transition-colors text-left"
                        title="Trocar base de dados"
                    >
                        <Database className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0 max-w-[160px] md:max-w-[220px]">
                            <span className="block text-xs font-semibold text-gray-800 truncate">
                                {data?.name || 'Base de Dados'}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-mono truncate">
                                {data?.host || 'localhost'}
                            </span>
                        </div>
                        <DriverBadge type={data?.type} />
                        {availableConnections.length > 1 && (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5 shrink-0" />
                        )}
                    </button>

                    {/* Menu de Troca de Conexão */}
                    {connDropdownOpen && availableConnections.length > 0 && (
                        <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-50">
                            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Conexões Disponíveis
                            </div>
                            <div className="max-h-56 overflow-y-auto space-y-1">
                                {availableConnections.map(c => {
                                    const isCurrent = String(c.id) === String(activeConnectionId) || c.name === data?.name;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                if (onSelectConnection) onSelectConnection(c.id);
                                                setConnDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors text-xs
                                                ${isCurrent ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
                                        >
                                            <div className="truncate mr-2">
                                                <div className="truncate">{c.name}</div>
                                                <div className="text-[10px] text-gray-400 font-normal">{c.type}</div>
                                            </div>
                                            {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="border-t border-gray-100 mt-1 pt-1">
                                <Link
                                    href="/home/conexao"
                                    onClick={() => setConnDropdownOpen(false)}
                                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Gerir todas as conexões
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botão de Atualizar Schema */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors
                            ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Recarregar schema da base de dados"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                )}

                {/* Métricas rápidas */}
                <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500 border-l border-gray-200 pl-3">
                    <span className="flex items-center gap-1">
                        <Table className="w-3.5 h-3.5 text-gray-400" />
                        <strong className="text-gray-700">{tables.length}</strong> tabelas
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>
                        <strong className="text-gray-700">{relationships.length}</strong> relações
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>
                        <strong className="text-gray-700">{totalFields}</strong> campos
                    </span>
                </div>

                {/* Atalhos de Teclado */}
                <div className="hidden xl:flex items-center gap-2 ml-auto mr-2">
                    {[['ctrl+scroll', 'zoom'], ['scroll', 'pan'], ['F', 'fit']].map(([k, v]) => (
                        <span key={k} className="text-[10px] text-gray-400 flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[10px]">{k}</kbd>
                            {v}
                        </span>
                    ))}
                </div>

                {/* Ações Rápidas (Editor SQL & Tabelas) */}
                <div className="flex items-center gap-2 ml-auto">
                    <Link
                        href="/home/editorsql"
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        title="Abrir Editor SQL"
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        Editor SQL
                    </Link>

                    <Link
                        href="/home/tabelas"
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        title="Explorar dados das tabelas"
                    >
                        <Table className="w-3.5 h-3.5" />
                        Tabelas
                    </Link>

                    <div className="w-px h-4 bg-gray-200 hidden sm:block mx-1" />

                    <button
                        onClick={onDownloadSVG}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                        title="Exportar como imagem vetorial SVG"
                    >
                        <Download className="w-3 h-3" />
                        SVG
                    </button>
                    <button
                        onClick={onDownloadPNG}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
                        title="Exportar imagem PNG em alta resolução"
                    >
                        <Download className="w-3 h-3" />
                        PNG
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* SIDEBAR ESQUERDA */}
                <aside
                    className={`flex flex-col shrink-0 bg-white border-r border-gray-200 overflow-hidden transition-all duration-200 ease-in-out z-10 shadow-sm
                        ${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
                    aria-hidden={!sidebarOpen}
                >
                    {/* Tabs da Sidebar */}
                    <div className="flex border-b border-gray-200 shrink-0 bg-gray-50/50">
                        {(['tables', 'info'] as SidebarTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5
                                    ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab === 'tables' ? (
                                    <>
                                        <Table className="w-3.5 h-3.5" />
                                        Tabelas ({tables.length})
                                    </>
                                ) : (
                                    <>
                                        <Info className="w-3.5 h-3.5" />
                                        Info do Banco
                                    </>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'tables' && (
                            <div className="p-3">
                                {/* Barra de Pesquisa */}
                                <div className="relative mb-2">
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                    <input
                                        type="search"
                                        placeholder="Buscar tabela ou coluna..."
                                        value={tableSearch}
                                        onChange={e => setTableSearch(e.target.value)}
                                        className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {tableSearch && (
                                        <button
                                            onClick={() => setTableSearch('')}
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {filteredTables.length === 0 && (
                                    <div className="text-center py-8 px-2">
                                        <p className="text-xs text-gray-400">Nenhum resultado para &quot;{tableSearch}&quot;</p>
                                    </div>
                                )}

                                <div className="space-y-0.5">
                                    {filteredTables.map(table => {
                                        const isActive = selectedItem?.type === 'table' && selectedItem.data.table_name === table.table_name;
                                        const pkCount = table.fields?.filter(f => f.is_primary_key).length || 0;

                                        return (
                                            <div
                                                key={table.table_name}
                                                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer
                                                    ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                                                onClick={() => focusTable(table)}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Table className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                                    <span className="text-xs font-medium truncate">{table.table_name}</span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {pkCount > 0 && (
                                                        <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-700 font-mono" title={`${pkCount} PK`}>
                                                            PK
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded-full font-mono">
                                                        {table.fields?.length || 0}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            panTo(table.x, table.y, table.width, table.height);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-blue-600 transition-opacity"
                                                        title="Centralizar no diagrama"
                                                    >
                                                        <Eye className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="p-3 space-y-4">
                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Conexão</p>
                                    <InfoRow label="Nome" value={data?.name || '—'} />
                                    <InfoRow label="Driver" value={data?.type || 'PostgreSQL'} mono />
                                    <InfoRow label="Host" value={data?.host || 'localhost'} mono />
                                    <InfoRow label="Porta" value={data?.port || '5432'} mono />
                                    <InfoRow label="Base de Dados" value={data?.database_name || '—'} mono />
                                </section>

                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Estatísticas do Schema</p>
                                    <InfoRow label="Tabelas" value={tables.length} />
                                    <InfoRow label="Campos Totais" value={totalFields} />
                                    <InfoRow label="Relações (FKs)" value={relationships.length} />
                                    <InfoRow label="Chaves Primárias" value={tables.reduce((a, t) => a + (t.fields?.filter((f: any) => f.is_primary_key).length || 0), 0)} />
                                </section>

                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ações Rápidas</p>
                                    <button
                                        onClick={handleCopyFullSchema}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                    >
                                        {copiedFullDDL ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="text-emerald-700 font-medium">Schema Copiado!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5 text-gray-500" />
                                                Copiar DDL Completo (SQL)
                                            </>
                                        )}
                                    </button>
                                </section>

                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Atalhos de Teclado</p>
                                    {[
                                        ['scroll', 'Mover diagrama (pan)'],
                                        ['ctrl + scroll', 'Zoom in/out'],
                                        ['+ / −', 'Zoom discreto'],
                                        ['0', 'Resetar para 100%'],
                                        ['F', 'Ajustar tudo à tela'],
                                        ['Esc', 'Fechar painel de detalhes'],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                            <kbd className="text-[10px] font-mono bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">{k}</kbd>
                                            <span className="text-[11px] text-gray-500">{v}</span>
                                        </div>
                                    ))}
                                </section>
                            </div>
                        )}
                    </div>
                </aside>

                {/* DIAGRAMA SVG COM ZOOM & PAN */}
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
                            <filter id="searchGlow" x="-15%" y="-15%" width="130%" height="130%">
                                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.45" />
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

                        {/* Grupo com transformação de zoom e deslocamento (pan) */}
                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>

                            {/* Camada de Relacionamentos */}
                            <g id="relationships-layer">
                                {relationships.map(rel => {
                                    const ligadaAoSelecionado =
                                        !!tabelaSelecionada &&
                                        (rel.fromTable === tabelaSelecionada || rel.toTable === tabelaSelecionada);

                                    const ligadaAoHover =
                                        !!hoveredTable &&
                                        (rel.fromTable === hoveredTable || rel.toTable === hoveredTable);

                                    const isHoveredLine = hoveredRel === rel.id;
                                    const isDestacada = ligadaAoSelecionado || ligadaAoHover || isHoveredLine;

                                    const cor = isDestacada ? '#2563eb' : COLORS.relationLine;
                                    const opacidade = !tabelaSelecionada && !hoveredTable ? 1 : isDestacada ? 1 : 0.12;

                                    return (
                                        <path
                                            key={rel.id}
                                            d={caminhoDaRelacao(rel)}
                                            fill="none"
                                            stroke={cor}
                                            strokeWidth={isDestacada ? 2.5 : 1.5}
                                            opacity={opacidade}
                                            markerEnd={isDestacada ? 'url(#arrowheadActive)' : 'url(#arrowhead)'}
                                            className="transition-all duration-150 cursor-pointer"
                                            onMouseEnter={() => setHoveredRel(rel.id)}
                                            onMouseLeave={() => setHoveredRel(null)}
                                        >
                                            <title>
                                                {`${rel.fromTable}.${rel.fieldName ?? '?'} → ${rel.toTable}`}
                                            </title>
                                        </path>
                                    );
                                })}
                            </g>

                            {/* Camada de Tabelas */}
                            <g id="tables-layer">
                                {tables.map(table => {
                                    const isSel = selectedItem?.type === 'table' && selectedItem.data.table_name === table.table_name;
                                    const isTableHovered = hoveredTable === table.table_name;

                                    // Lógica de busca no canvas: destacar mesas coincidentes e atenuar as demais
                                    const query = tableSearch.toLowerCase().trim();
                                    const hasSearch = query.length > 0;
                                    const matchesTable = hasSearch && table.table_name.toLowerCase().includes(query);
                                    const matchesAnyField = hasSearch && table.fields?.some(f => f.name.toLowerCase().includes(query));
                                    const isSearchMatch = hasSearch && (matchesTable || matchesAnyField);

                                    const tableOpacity = hasSearch ? (isSearchMatch ? 1 : 0.25) : 1;

                                    return (
                                        <g
                                            key={table.table_name}
                                            transform={`translate(${table.x}, ${table.y})`}
                                            className="cursor-pointer group"
                                            onClick={() => handleTableClick(table)}
                                            onMouseEnter={() => setHoveredTable(table.table_name)}
                                            onMouseLeave={() => setHoveredTable(null)}
                                            opacity={tableOpacity}
                                            role="button"
                                            aria-label={`Tabela ${table.table_name}`}
                                        >
                                            {/* Retângulo de fundo */}
                                            <rect
                                                width={table.width}
                                                height={table.height}
                                                fill={COLORS.tableBg}
                                                stroke={isSel ? '#2563eb' : isSearchMatch ? '#3b82f6' : isTableHovered ? '#60a5fa' : COLORS.tableBorder}
                                                strokeWidth={isSel ? 2.5 : isSearchMatch ? 2 : 1}
                                                rx="8"
                                                filter={isSearchMatch ? 'url(#searchGlow)' : 'url(#tableShadow)'}
                                                className="transition-all duration-150"
                                            />

                                            {/* Cabeçalho da tabela */}
                                            <rect
                                                width={table.width}
                                                height={HEADER_HEIGHT}
                                                fill={isSel ? 'url(#selectedGradient)' : 'url(#headerGradient)'}
                                                rx="8"
                                            />
                                            <rect
                                                y={HEADER_HEIGHT - 8}
                                                width={table.width}
                                                height={8}
                                                fill={isSel ? '#dbeafe' : '#f1f5f9'}
                                            />
                                            <line
                                                x1="0"
                                                y1={HEADER_HEIGHT}
                                                x2={table.width}
                                                y2={HEADER_HEIGHT}
                                                stroke={isSel ? '#93c5fd' : COLORS.tableBorder}
                                                strokeWidth="1"
                                            />

                                            {/* Nome da tabela */}
                                            <text
                                                x="12"
                                                y={HEADER_HEIGHT / 2 + 5}
                                                fontFamily="'Segoe UI', system-ui, sans-serif"
                                                fontSize="13"
                                                fontWeight="600"
                                                fill={isSel ? '#1d4ed8' : COLORS.headerText}
                                            >
                                                {table.table_name}
                                            </text>

                                            {/* Indicador de schema ou colunas */}
                                            <text
                                                x={table.width - 12}
                                                y={HEADER_HEIGHT / 2 + 4}
                                                fontFamily="'Segoe UI', system-ui, sans-serif"
                                                fontSize="10"
                                                textAnchor="end"
                                                fill="#94a3b8"
                                            >
                                                {table.fields?.length || 0} cols
                                            </text>

                                            {/* Linhas de Campos */}
                                            {table.fields?.map((field: any, index: number) => {
                                                const fy = HEADER_HEIGHT + index * ROW_HEIGHT;
                                                const isFS = selectedItem?.type === 'field'
                                                    && selectedItem.data.name === field.name
                                                    && selectedItem.parentTable === table.table_name;

                                                const isFieldSearchMatch = hasSearch && field.name.toLowerCase().includes(query);

                                                const nameColor = isFS
                                                    ? '#2563eb'
                                                    : field.is_primary_key
                                                        ? '#b45309'
                                                        : field.is_foreign_key
                                                            ? '#2563eb'
                                                            : COLORS.fieldText;

                                                const prefix = field.is_primary_key ? '⬡ ' : field.is_foreign_key ? '◈ ' : '   ';

                                                return (
                                                    <g
                                                        key={`${table.table_name}-${field.name}`}
                                                        className="cursor-pointer"
                                                        onClick={e => handleFieldClick(e, field, table.table_name)}
                                                    >
                                                        {/* Highlight de seleção ou busca */}
                                                        {isFS && (
                                                            <rect
                                                                y={fy + 1}
                                                                x="2"
                                                                width={table.width - 4}
                                                                height={ROW_HEIGHT - 2}
                                                                fill="#eff6ff"
                                                                rx="4"
                                                            />
                                                        )}
                                                        {isFieldSearchMatch && !isFS && (
                                                            <rect
                                                                y={fy + 1}
                                                                x="2"
                                                                width={table.width - 4}
                                                                height={ROW_HEIGHT - 2}
                                                                fill="#fef3c7"
                                                                opacity="0.7"
                                                                rx="4"
                                                            />
                                                        )}

                                                        <text
                                                            x="10"
                                                            y={fy + ROW_HEIGHT * 0.65}
                                                            fontFamily="'Fira Code', 'Courier New', monospace"
                                                            fontSize="11"
                                                            fontWeight={field.is_primary_key || field.is_foreign_key ? '600' : '400'}
                                                            fill={nameColor}
                                                        >
                                                            <tspan xmlSpace="preserve">{prefix}</tspan>
                                                            {field.name}
                                                        </text>

                                                        <text
                                                            x={table.width - 10}
                                                            y={fy + ROW_HEIGHT * 0.65}
                                                            fontFamily="'Fira Code', 'Courier New', monospace"
                                                            fontSize="10"
                                                            textAnchor="end"
                                                            fill={isFS ? '#3b82f6' : COLORS.typeText}
                                                        >
                                                            {field.type?.split('(')[0]}
                                                        </text>

                                                        {index < (table.fields?.length ?? 0) - 1 && (
                                                            <line
                                                                x1="8"
                                                                y1={fy + ROW_HEIGHT}
                                                                x2={table.width - 8}
                                                                y2={fy + ROW_HEIGHT}
                                                                stroke={COLORS.tableBorder}
                                                                strokeWidth="0.5"
                                                                opacity="0.5"
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
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                    />
                </main>

                {/* PAINEL DIREITO DE DETALHES */}
                <aside
                    className={`flex flex-col shrink-0 bg-white border-l border-gray-200 overflow-hidden transition-all duration-200 ease-in-out z-10 shadow-sm
                        ${selectedItem ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
                    aria-hidden={!selectedItem}
                >
                    {/* Header do Detalhe */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-200 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            {selectedItem?.type === 'table' ? (
                                <Table className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                                <Key className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <h2 className="text-xs font-semibold text-gray-800 truncate">
                                {selectedItem?.type === 'table'
                                    ? selectedItem.data.table_name
                                    : `${selectedItem?.data.name} (${selectedItem?.parentTable})`}
                            </h2>
                        </div>
                        <button
                            onClick={closeDetail}
                            aria-label="Fechar painel de detalhes"
                            className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Conteúdo do Detalhe da Tabela */}
                    {selectedItem?.type === 'table' && (() => {
                        const t = selectedItem.data;
                        const tableRels = relationships.filter(r =>
                            r.fromTable === t.table_name || r.toTable === t.table_name
                        );

                        return (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* Sub-abas do detalhe */}
                                <div className="flex border-b border-gray-100 shrink-0 bg-gray-50/50">
                                    <button
                                        onClick={() => setTableDetailTab('columns')}
                                        className={`flex-1 py-1.5 text-xs font-medium border-b-2 transition-colors
                                            ${tableDetailTab === 'columns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Colunas ({t.fields?.length || 0})
                                    </button>
                                    <button
                                        onClick={() => setTableDetailTab('relations')}
                                        className={`flex-1 py-1.5 text-xs font-medium border-b-2 transition-colors
                                            ${tableDetailTab === 'relations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Relações ({tableRels.length})
                                    </button>
                                    <button
                                        onClick={() => setTableDetailTab('ddl')}
                                        className={`flex-1 py-1.5 text-xs font-medium border-b-2 transition-colors
                                            ${tableDetailTab === 'ddl' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        DDL (SQL)
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                                    {/* Aba de Colunas */}
                                    {tableDetailTab === 'columns' && (
                                        <div className="space-y-3">
                                            <section>
                                                <InfoRow label="Nome da Tabela" value={t.table_name} mono />
                                                <InfoRow label="Schema" value={t.schema_name || 'public'} mono />
                                                <InfoRow label="Total de Colunas" value={t.fields?.length || 0} />
                                            </section>

                                            <div className="space-y-1.5">
                                                {t.fields?.map((f: any) => (
                                                    <div
                                                        key={f.name}
                                                        className="p-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-pointer"
                                                        onClick={() => selectField(f, t.table_name)}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-mono font-semibold text-gray-800">{f.name}</span>
                                                            <span className="text-[10px] font-mono text-blue-600 font-medium">{f.type?.split('(')[0]}</span>
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
                                        </div>
                                    )}

                                    {/* Aba de Relações com Navegação Interativa */}
                                    {tableDetailTab === 'relations' && (
                                        <div className="space-y-3">
                                            {tableRels.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-6">
                                                    Esta tabela não possui chaves estrangeiras vinculadas.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {tableRels.map(r => {
                                                        const isOut = r.fromTable === t.table_name;
                                                        const targetName = isOut ? r.toTable : r.fromTable;
                                                        const targetTable = tableMap.get(targetName);

                                                        return (
                                                            <div
                                                                key={r.id}
                                                                onClick={() => targetTable && focusTable(targetTable)}
                                                                className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isOut ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                        {isOut ? '→ Chave Externa (Saída)' : '← Referenciada por (Entrada)'}
                                                                    </span>
                                                                    <Eye className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                                                                </div>
                                                                <div className="text-xs font-mono font-medium text-gray-800">
                                                                    {isOut ? `${t.table_name}.${r.fieldName} → ${r.toTable}` : `${r.fromTable}.${r.fieldName} → ${t.table_name}`}
                                                                </div>
                                                                <span className="text-[10px] text-blue-600 hover:underline mt-1 block">
                                                                    Navegar para {targetName} →
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Aba de DDL / SQL */}
                                    {tableDetailTab === 'ddl' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500">Definição DDL</span>
                                                <button
                                                    onClick={() => handleCopyDDL(t)}
                                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                                >
                                                    {copiedDDL ? (
                                                        <>
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                            <span className="text-emerald-700">Copiado!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            Copiar
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <pre className="p-2.5 rounded-lg bg-gray-900 text-gray-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-gray-800">
                                                {generateTableDDL(t)}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                {/* Rodapé com Ações Rápidas da Tabela */}
                                <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
                                    <Link
                                        href="/home/editorsql"
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
                                    >
                                        <Code2 className="w-3.5 h-3.5" />
                                        Consultar no Editor SQL
                                    </Link>
                                    <Link
                                        href="/home/tabelas"
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                    >
                                        <Table className="w-3.5 h-3.5" />
                                        Explorar Dados da Tabela
                                    </Link>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Conteúdo do Detalhe da Coluna */}
                    {selectedItem?.type === 'field' && (() => {
                        const f = selectedItem.data;
                        const parentName = selectedItem.parentTable;
                        const parentTableData = tableMap.get(parentName);

                        return (
                            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Origem</p>
                                    <InfoRow
                                        label="Tabela"
                                        value={parentName}
                                        mono
                                        onClick={parentTableData ? () => focusTable(parentTableData) : undefined}
                                    />
                                </section>

                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Coluna</p>
                                    <InfoRow label="Nome" value={f.name} mono />
                                    <InfoRow label="Tipo de Dado" value={f.type} mono />
                                    {f.default_value && <InfoRow label="Valor Padrão" value={f.default_value} mono />}
                                </section>

                                <section>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Restrições e Índices</p>
                                    <div className="grid grid-cols-2 gap-x-2">
                                        <InfoRow label="PK" value={f.is_primary_key ? '✅ Sim' : '✗ Não'} />
                                        <InfoRow label="FK" value={f.is_foreign_key ? '✅ Sim' : '✗ Não'} />
                                        <InfoRow label="Nullable" value={f.is_nullable ? '✅ Sim' : '✗ Não'} />
                                        <InfoRow label="Unique" value={f.is_unique ? '✅ Sim' : '✗ Não'} />
                                    </div>
                                </section>

                                {f.is_foreign_key && f.referenced_table && (
                                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                                        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                                            Chave Estrangeira (FK)
                                        </p>
                                        <p className="text-xs font-mono text-blue-900">
                                            Referencia: <strong>{f.referenced_table}</strong>{f.referenced_field ? `(${f.referenced_field})` : ''}
                                        </p>
                                        {tableMap.get(f.referenced_table) && (
                                            <button
                                                onClick={() => focusTable(tableMap.get(f.referenced_table)!)}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                            >
                                                Navegar para {f.referenced_table} →
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </aside>
            </div>

            {/* STATUS BAR */}
            <footer className="flex items-center gap-4 px-4 py-1.5 bg-white border-t border-gray-200 shrink-0 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="text-[11px] font-medium text-gray-700">Conectado a {data?.name}</span>
                </div>
                {data?.host && <span className="text-[11px] text-gray-400">Host: {data.host}</span>}
                <span className="text-[11px] text-gray-400">
                    Zoom: {Math.round(transform.scale * 100)}%
                </span>
                {selectedItem && (
                    <span className="text-[11px] text-blue-600 font-medium ml-auto truncate">
                        {selectedItem.type === 'table'
                            ? `Selecionada: ${selectedItem.data.table_name}`
                            : `Coluna: ${selectedItem.data.name} · ${selectedItem.parentTable}`}
                    </span>
                )}
            </footer>
        </div>
    );
}