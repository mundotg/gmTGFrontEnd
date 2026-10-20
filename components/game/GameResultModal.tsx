"use client";

import React from "react";
import { Trophy, Frown, Handshake, Flag, RotateCcw, Home, Sparkles } from "lucide-react";

export type ResultType = "winner" | "loser" | "draw" | "surrender";

interface GameResultModalProps {
  isOpen: boolean;
  result: ResultType;
  title: string;
  message: string;
  winnerName?: string;
  totalMoves: number;
  gameTime: string;
  onRematch: () => void;
  onExit: () => void;
}

export default function GameResultModal({
  isOpen,
  result,
  title,
  message,
  winnerName,
  totalMoves,
  gameTime,
  onRematch,
  onExit,
}: GameResultModalProps) {
  if (!isOpen) return null;

  const isWinner = result === "winner";
  const isLoser = result === "loser";
  const isDraw = result === "draw";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xl text-center overflow-hidden">
        {/* Glow de fundo */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[90px] opacity-20 pointer-events-none ${
            isWinner
              ? "bg-amber-400"
              : isLoser
              ? "bg-rose-500"
              : "bg-blue-500"
          }`}
        />

        {/* Ícone Animado */}
        <div className="flex justify-center mb-4">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl ${
              isWinner
                ? "bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-amber-500/30"
                : isLoser
                ? "bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-rose-500/30"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30"
            }`}
          >
            {isWinner && <Trophy className="h-10 w-10 animate-bounce" />}
            {isLoser && <Frown className="h-10 w-10" />}
            {isDraw && <Handshake className="h-10 w-10" />}
            {result === "surrender" && <Flag className="h-10 w-10" />}
          </div>
        </div>

        {/* Título e Mensagem */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Resumo da Partida */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <span className="block text-gray-400 dark:text-gray-500 font-medium">Tempo Total</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
              {gameTime}
            </span>
          </div>
          <div>
            <span className="block text-gray-400 dark:text-gray-500 font-medium">Total de Jogadas</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
              {totalMoves}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRematch}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Jogar Novamente</span>
          </button>

          <button
            onClick={onExit}
            className="py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span>Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
}
