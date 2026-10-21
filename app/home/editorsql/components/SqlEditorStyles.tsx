"use client";

import React from "react";

export default function SqlEditorStyles() {
    return (
        <style>{`
        .sql-root { display:flex; flex-direction:column; gap:12px; width:100%; font-family:var(--font-sans,sans-serif); }

        /* ── editor shell ── */
        .editor-shell { border:0.5px solid #3a3a3a; border-radius:12px; overflow:hidden; background:#1e1e1e; }

        /* ── toolbar ── */
        .toolbar { height:52px; border-bottom:0.5px solid #333; padding:0 14px; display:flex; align-items:center; justify-content:space-between; background:#252526; gap:10px; }
        .toolbar-left { display:flex; align-items:center; gap:10px; color:#ccc; font-size:14px; font-weight:500; }
        .toolbar-right { display:flex; align-items:center; gap:8px; }

        .sel-badge { font-size:11px; background:#1a3a5c; color:#7ec8f4; padding:3px 9px; border-radius:5px; white-space:nowrap; }
        .hint { font-size:11px; color:#555; }
        .hint kbd { background:#2d2d2d; color:#888; padding:1px 4px; border-radius:3px; font-family:monospace; font-size:10px; }

        /* ── icon buttons ── */
        .icon-btn { display:flex; align-items:center; gap:5px; padding:5px 10px; border:0.5px solid #444; border-radius:6px; background:transparent; color:#aaa; cursor:pointer; font-size:12px; transition:background .12s,color .12s; white-space:nowrap; }
        .icon-btn:hover { background:#2a2a2a; color:#e0e0e0; }
        .icon-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .icon-btn.green { border-color:#2d6a4f; color:#6fcf97; }
        .icon-btn.green:hover { background:#1a3d2a; color:#a8f0c2; }
        .icon-btn.red { border-color:#7b2d2d; color:#f08080; animation:pulse 1.2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.65} }

        /* ── realtime query hud ── */
        .realtime-hud { display:flex; align-items:center; justify-content:space-between; padding:6px 14px; background:#1c1c1f; border-bottom:0.5px solid #2f2f35; font-size:11.5px; gap:10px; flex-wrap:wrap; }
        .realtime-hud-left { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .realtime-hud-right { display:flex; align-items:center; gap:8px; font-family:monospace; font-size:11px; }

        .rt-pulse-dot { width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 6px rgba(16,185,129,0.7); animation:rtPulse 1.8s infinite; display:inline-block; }
        @keyframes rtPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }

        .rt-badge { padding:2px 8px; border-radius:5px; font-weight:600; font-size:11px; letter-spacing:0.02em; display:inline-flex; align-items:center; gap:4px; }
        .rt-type { background:#223249; color:#93c5fd; border:0.5px solid #3b82f6; }
        .rt-risk.safe { background:rgba(34,197,94,0.12); color:#4ade80; border:0.5px solid rgba(34,197,94,0.3); }
        .rt-risk.moderate { background:rgba(245,158,11,0.14); color:#fbbf24; border:0.5px solid rgba(245,158,11,0.35); }
        .rt-risk.critical { background:rgba(239,68,68,0.2); color:#f87171; border:0.5px solid rgba(239,68,68,0.5); animation:pulse 1.4s infinite; }
        .rt-complexity { background:#27272a; color:#a1a1aa; border:0.5px solid #3f3f46; }

        .rt-tables { display:flex; align-items:center; gap:5px; margin-left:4px; }
        .rt-tbl-label { color:#71717a; font-size:10.5px; }
        .rt-tbl-tag { background:#2a233b; color:#d8b4fe; padding:2px 7px; border-radius:4px; font-size:10.5px; border:0.5px solid #581c87; }
        .rt-no-tables { color:#52525b; font-size:10.5px; font-style:italic; }

        .rt-executing-pulse { display:flex; align-items:center; gap:6px; color:#60a5fa; font-weight:500; }
        .rt-spinner { width:10px; height:10px; border:2px solid #3b82f6; border-top-color:transparent; border-radius:50%; animation:rtSpin 0.7s linear infinite; display:inline-block; }
        @keyframes rtSpin { to { transform:rotate(360deg); } }

        .rt-telemetry { display:flex; align-items:center; gap:6px; padding:2px 8px; border-radius:5px; background:#18181b; border:0.5px solid #333; }
        .rt-telemetry.success { color:#a7f3d0; border-color:#065f46; }
        .rt-telemetry.cancelled { color:#fde68a; border-color:#854d0e; }
        .rt-telemetry.error { color:#fca5a5; border-color:#991b1b; }
        .rt-status-text { font-weight:600; }
        .rt-status-text.success { color:#34d399; }
        .rt-status-text.cancelled { color:#fbbf24; }
        .rt-status-text.error { color:#f87171; }
        .rt-idle-hint { color:#71717a; font-size:10.5px; }

        .rt-risk-alert { display:flex; align-items:center; gap:8px; padding:6px 14px; font-size:11.5px; border-bottom:0.5px solid #333; }
        .rt-risk-alert.critical { background:rgba(239,68,68,0.12); color:#fca5a5; border-left:3px solid #ef4444; }
        .rt-risk-alert.moderate { background:rgba(245,158,11,0.08); color:#fde68a; border-left:3px solid #f59e0b; }
        .rt-risk-alert.safe { background:rgba(34,197,94,0.08); color:#86efac; border-left:3px solid #22c55e; }
        .rt-alert-icon { font-size:13px; flex-shrink:0; }
        .rt-alert-messages { display:flex; flex-direction:column; gap:2px; }
        .rt-alert-item { font-size:11.5px; line-height:1.4; }

        /* ── editor area ── */
        .editor-area { position:relative; height:240px; overflow:hidden; background:#1e1e1e; }
        .hl-pre { position:absolute; inset:0; padding:13px 16px; font-family:monospace; font-size:13px; line-height:1.65; color:#d4d4d4; pointer-events:none; overflow:hidden; white-space:pre-wrap; word-break:break-word; }
        .sql-ta { position:absolute; inset:0; width:100%; height:100%; background:transparent; color:transparent; caret-color:#aeafad; resize:none; outline:none; padding:13px 16px; font-family:monospace; font-size:13px; line-height:1.65; overflow:auto; border:none; }
        .hl-kw { color:#569cd6; font-weight:600; }
        .hl-str { color:#ce9178; }
        .hl-num { color:#b5cea8; }
        .hl-cmt { color:#6a9955; font-style:italic; }

        /* ── autocomplete dropdown ── */
        .ac-list { position:absolute; bottom:0; left:16px; min-width:220px; max-height:240px; overflow-y:auto; background:#252526; border:0.5px solid #444; border-radius:6px; z-index:10; transform:translateY(100%); box-shadow:0 8px 24px rgba(0,0,0,.4); }
        .ac-item { display:flex; align-items:center; gap:8px; padding:5px 12px; font-family:monospace; font-size:12px; color:#ccc; cursor:pointer; }
        .ac-item:hover { background:#37373d; }
        .ac-tag { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; font-size:10px; font-weight:700; flex-shrink:0; }
        .ac-keyword { background:#264f78; color:#9cdcfe; }
        .ac-table { background:#3d2f5c; color:#c9a8f4; }
        .ac-column { background:#2d4a35; color:#9fe0b0; }
        .ac-label { flex:1; }
        .ac-detail { font-size:10px; color:#777; }

        /* ── painel de lint (erros/sugestões) ── */
        .lint-panel { max-height:120px; overflow-y:auto; border-top:0.5px solid #2d2d2d; background:#1b1b1b; padding:4px 0; }
        .lint-row { display:flex; align-items:center; gap:8px; padding:3px 14px; font-size:11.5px; }
        .lint-ico { flex-shrink:0; }
        .lint-err { color:#f4a3a3; }
        .lint-warn { color:#e9c46a; }
        .lint-sug { color:#8ab4f8; }
        .lint-fix { margin-left:auto; font-size:10px; background:#264f78; color:#cfe6ff; border:0; border-radius:4px; padding:2px 8px; cursor:pointer; }
        .lint-fix:hover { background:#2f5f90; }

        /* ── status bar ── */
        .status-bar { height:28px; border-top:0.5px solid #2d2d2d; background:#252526; padding:0 14px; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#666; }
        .status-mid { display:flex; align-items:center; gap:10px; }
        .badge-mongo { color:#6fcf97; font-weight:600; }
        .badge-ws.on { color:#6fcf97; }
        .badge-ws.off { color:#a05a5a; }

        /* ── secondary tabs ── */
        .sec-tabs { display:flex; gap:2px; border-bottom:0.5px solid var(--color-border-tertiary,#e0e0e0); background:var(--color-background-primary,#fff); }
        .sec-tab { padding:8px 14px; font-size:12px; cursor:pointer; color:var(--color-text-secondary,#666); border-bottom:2px solid transparent; background:none; border-top:none; border-left:none; border-right:none; transition:color .12s; }
        .sec-tab.active { color:var(--color-text-primary,#111); border-bottom-color:#3b82f6; font-weight:500; }

        /* ── results area ── */
        .results-shell { border:0.5px solid var(--color-border-secondary,#ddd); border-radius:12px; overflow:hidden; background:var(--color-background-primary,#fff); }
        .results-table-wrap { max-height:320px; overflow:auto; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead th { position:sticky; top:0; background:var(--color-background-secondary,#f5f5f5); padding:7px 14px; text-align:left; font-size:11px; font-weight:500; color:var(--color-text-secondary,#666); text-transform:uppercase; letter-spacing:.04em; border-bottom:0.5px solid var(--color-border-secondary,#ddd); white-space:nowrap; }
        tbody tr { border-bottom:0.5px solid var(--color-border-tertiary,#eee); }
        tbody tr:hover { background:var(--color-background-secondary,#f9f9f9); }
        td { padding:6px 14px; color:var(--color-text-primary,#111); white-space:nowrap; font-size:13px; }
        .null-v { color:var(--color-text-tertiary,#aaa); font-style:italic; }
        .empty-row td { text-align:center; padding:28px; color:var(--color-text-tertiary,#aaa); font-size:13px; }
        div.empty-row { text-align:center; padding:28px; color:var(--color-text-tertiary,#aaa); font-size:13px; }

        /* ── error box ── */
        .error-box { padding:14px 16px; display:flex; gap:10px; background:var(--color-background-danger,#fff5f5); color:var(--color-text-danger,#c0392b); font-size:13px; border-radius:12px; }

        /* ── analyze panel ── */
        .analyze-panel { padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
        .analyze-row { display:flex; gap:8px; flex-wrap:wrap; }
        .tag { font-size:11px; padding:3px 8px; border-radius:5px; background:var(--color-background-secondary,#f0f0f0); color:var(--color-text-secondary,#555); }
        .tag.risk { background:#fff0f0; color:#c0392b; }
        .tag.ok { background:#f0fff4; color:#27ae60; }
        .suggestion { font-size:12px; color:#2563eb; }
        .kv { display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:0.5px solid var(--color-border-tertiary,#eee); }
        .kv:last-child { border-bottom:none; }
        .kv-label { color:var(--color-text-secondary,#666); }
        .kv-val { font-weight:500; color:var(--color-text-primary,#111); }

        /* ── history / saved ── */
        .list-item { padding:10px 14px; border-bottom:0.5px solid var(--color-border-tertiary,#eee); cursor:pointer; transition:background .1s; }
        .list-item:hover { background:var(--color-background-secondary,#f5f5f5); }
        .list-item-q { font-family:monospace; font-size:12px; color:var(--color-text-primary,#111); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .list-item-meta { font-size:11px; color:var(--color-text-tertiary,#aaa); margin-top:2px; }

        /* ── metrics ── */
        .metrics-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:14px; }
        .metric-card { background:var(--color-background-secondary,#f5f5f5); border-radius:8px; padding:14px; text-align:center; }
        .metric-val { font-size:28px; font-weight:500; color:var(--color-text-primary,#111); }
        .metric-label { font-size:11px; color:var(--color-text-secondary,#777); margin-top:4px; text-transform:uppercase; letter-spacing:.05em; }

        /* ── save modal ── */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:100; }
        .modal { background:var(--color-background-primary,#fff); border-radius:12px; padding:20px; width:340px; display:flex; flex-direction:column; gap:12px; }
        .modal h3 { font-size:15px; font-weight:500; color:var(--color-text-primary,#111); }
        .modal input { width:100%; padding:8px 10px; border:0.5px solid var(--color-border-secondary,#ccc); border-radius:6px; font-size:13px; outline:none; color:var(--color-text-primary,#111); background:var(--color-background-primary,#fff); }
        .modal input:focus { border-color:#3b82f6; }
        .modal-actions { display:flex; justify-content:flex-end; gap:8px; }
        .btn-primary { padding:7px 16px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-size:13px; cursor:pointer; }
        .btn-primary:hover { background:#1d4ed8; }
        .btn-ghost { padding:7px 16px; background:transparent; border:0.5px solid var(--color-border-secondary,#ccc); border-radius:6px; font-size:13px; cursor:pointer; color:var(--color-text-secondary,#666); }

        /* ── explain ── */
        .explain-wrap { padding:14px; overflow:auto; max-height:320px; }
        .explain-wrap pre { font-family:monospace; font-size:12px; color:var(--color-text-primary,#111); white-space:pre-wrap; }
        `}</style>
    );
}
