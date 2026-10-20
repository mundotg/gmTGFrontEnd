"use client";

import React, { useMemo } from "react";
import {
  CASAS_CIRCLE,
  Col,
  casaToCoords,
  coordsToCasa,
} from "@/lib/game/tapatanLogic";

interface GameBoardProps {
  matrix: Col[][];
  selectedCasa: number | null;
  validDestinations: number[];
  activePlayer: number; // 1 ou 2
  isMoving: boolean;
  onSelectPiece: (casaN: number) => void;
  onMoveToCasa: (casaDestino: number) => void;
  colorP1?: string;
  colorP2?: string;
  theme?: "cyberpunk" | "classic" | "minimal";
}

export default function GameBoard({
  matrix,
  selectedCasa,
  validDestinations,
  activePlayer,
  isMoving,
  onSelectPiece,
  onMoveToCasa,
  colorP1 = "#00d2ff",
  colorP2 = "#ff3b5c",
  theme = "cyberpunk",
}: GameBoardProps) {
  // Cores dinâmicas por tema
  const themeColors = useMemo(() => {
    switch (theme) {
      case "classic":
        return {
          bg: "#2b1e16",
          boardFill: "#3e2c22",
          lines: "#d4af37",
          border: "#5c4033",
          shadow: "rgba(0,0,0,0.6)",
        };
      case "minimal":
        return {
          bg: "#0d0f14",
          boardFill: "#161a23",
          lines: "#475569",
          border: "#334155",
          shadow: "rgba(0,0,0,0.8)",
        };
      case "cyberpunk":
      default:
        return {
          bg: "#090a10",
          boardFill: "url(#boardGradient)",
          lines: "#00d2ff",
          border: "#1e293b",
          shadow: "rgba(0, 210, 255, 0.25)",
        };
    }
  }, [theme]);

  // Handler de clique em uma casa do tabuleiro
  const handleCasaClick = (casaN: number, cell: Col) => {
    if (isMoving) return;

    // Se clicou na casa selecionada atualmente, desmarca
    if (selectedCasa === casaN) {
      onSelectPiece(0);
      return;
    }

    // Se clicou em um destino válido para a peça selecionada, executa movimento
    if (selectedCasa && validDestinations.includes(casaN)) {
      onMoveToCasa(casaN);
      return;
    }

    // Se clicou em uma peça do jogador da vez, seleciona-a
    if (cell.free && cell.player === activePlayer) {
      onSelectPiece(casaN);
    }
  };

  return (
    <div className="relative w-full max-w-[650px] mx-auto aspect-[600/400] p-4 sm:p-6 rounded-3xl bg-[#0e0f17]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none">
      {/* Luz ambiente de fundo */}
      <div
        className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20"
        style={{ backgroundColor: colorP1 }}
      />
      <div
        className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20"
        style={{ backgroundColor: colorP2 }}
      />

      <svg
        viewBox="-50 -50 700 500"
        className="w-full h-full overflow-visible drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradiente de Fundo do Tabuleiro */}
          <radialGradient id="boardGradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#141829" />
            <stop offset="100%" stopColor="#0a0c14" />
          </radialGradient>

          {/* Gradiente Peça Jogador 1 (Azul / Ciano) */}
          <radialGradient id="gradP1" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="45%" stopColor={colorP1} />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>

          {/* Gradiente Peça Jogador 2 / CPU (Vermelho / Rosa) */}
          <radialGradient id="gradP2" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="45%" stopColor={colorP2} />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>

          {/* Filtro Neon Glow Linhas */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Filtro Sombra Suave */}
          <filter id="pieceShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.6" />
          </filter>

          {/* Filtro Pulso para Casa Central */}
          <filter id="centerGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Retângulo do Tabuleiro */}
        <rect
          x="-35"
          y="-35"
          width="670"
          height="470"
          rx="28"
          fill={themeColors.boardFill}
          stroke={themeColors.border}
          strokeWidth="3"
        />

        {/* -------------------------------------------------------- */}
        {/* LINHAS ESTRUTURAIS DO JOGO 3X3                           */}
        {/* -------------------------------------------------------- */}
        <g stroke={themeColors.lines} strokeWidth="3" opacity="0.6" filter="url(#neonGlow)">
          {/* Borda Externa */}
          <line x1="0" y1="0" x2="600" y2="0" />
          <line x1="600" y1="0" x2="600" y2="400" />
          <line x1="600" y1="400" x2="0" y2="400" />
          <line x1="0" y1="400" x2="0" y2="0" />

          {/* Cruz Central (passando pelo centro 5: 300, 200) */}
          <line x1="0" y1="200" x2="600" y2="200" strokeWidth="4" />
          <line x1="300" y1="0" x2="300" y2="400" strokeWidth="4" />

          {/* Diagonais (passando pelo centro 5: 300, 200) */}
          <line x1="0" y1="0" x2="600" y2="400" strokeWidth="3.5" />
          <line x1="600" y1="0" x2="0" y2="400" strokeWidth="3.5" />
        </g>

        {/* -------------------------------------------------------- */}
        {/* CASAS / VÉRTICES (1 a 9)                                */}
        {/* -------------------------------------------------------- */}
        {CASAS_CIRCLE.map((rowArr, rowIndex) =>
          rowArr.map((pos) => {
            const { casaN, cx, cy } = pos;
            const coords = casaToCoords(casaN);
            const cell = matrix[coords.row]?.[coords.col] || {
              free: false,
              player: 0,
              casaN,
            };

            const isSelected = selectedCasa === casaN;
            const isValidDest = validDestinations.includes(casaN);
            const isCenter = casaN === 5;
            const hasPiece = cell.free && cell.player > 0;
            const canSelectThisPiece =
              hasPiece && cell.player === activePlayer && !isMoving;

            return (
              <g
                key={`casa-${casaN}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleCasaClick(casaN, cell)}
              >
                {/* Círculo Base da Casa */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isCenter ? 32 : 24}
                  fill="#10131f"
                  stroke={isCenter ? "#fbbf24" : themeColors.border}
                  strokeWidth={isCenter ? 3 : 2}
                  className="transition-colors duration-200"
                />

                {/* Ícone Especial na Casa Central 5 (Chave da Vitória) */}
                {isCenter && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={36}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-spin origin-[300px_200px]"
                    style={{ animationDuration: "16s" }}
                  />
                )}

                {/* Destaque de Destino Válido (Pulsante Verde / Emerald) */}
                {isValidDest && (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={30}
                      fill="rgba(16, 185, 129, 0.25)"
                      stroke="#10b981"
                      strokeWidth="3"
                      className="animate-ping"
                      style={{ animationDuration: "1.8s" }}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={14}
                      fill="#10b981"
                      opacity="0.8"
                    />
                  </g>
                )}

                {/* PEÇA RENDERIZADA */}
                {hasPiece && (
                  <g
                    filter="url(#pieceShadow)"
                    className={`transition-transform duration-300 ${
                      canSelectThisPiece ? "hover:scale-105" : ""
                    }`}
                  >
                    {/* Anel Neon se a peça estiver selecionada */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={34}
                        fill="none"
                        stroke={cell.player === 1 ? colorP1 : colorP2}
                        strokeWidth="3.5"
                        strokeDasharray="6 3"
                        className="animate-spin"
                        style={{
                          animationDuration: "4s",
                          transformOrigin: `${cx}px ${cy}px`,
                        }}
                      />
                    )}

                    {/* Corpo Principal da Peça */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={24}
                      fill={cell.player === 1 ? "url(#gradP1)" : "url(#gradP2)"}
                      stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.3)"}
                      strokeWidth={isSelected ? "3" : "1.5"}
                    />

                    {/* Brilho Especular Superior 3D */}
                    <ellipse
                      cx={cx - 6}
                      cy={cy - 7}
                      rx={9}
                      ry={5}
                      fill="rgba(255, 255, 255, 0.45)"
                      transform={`rotate(-25, ${cx - 6}, ${cy - 7})`}
                    />

                    {/* Indicador Numérico / Ícone */}
                    <text
                      x={cx}
                      y={cy + 5}
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none select-none font-sans drop-shadow"
                    >
                      {cell.player === 1 ? "P1" : cell.player === 2 ? "P2" : ""}
                    </text>
                  </g>
                )}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
