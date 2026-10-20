"use client";

import React from "react";
import { X, Trophy, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameRulesModal({ isOpen, onClose }: GameRulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xl text-left text-gray-900 dark:text-gray-100">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Regras do Jogo: Alinhe 3 (Tapatan)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Estratégia tática milenar em tabuleiro 3x3
            </p>
          </div>
        </div>

        {/* Seções de Instruções */}
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          {/* Regra de Ouro */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 text-sm mb-1">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              Regra de Ouro: O Centro é Obrigatório!
            </h4>
            <p className="text-xs leading-relaxed">
              O jogador vence ao alinhar suas 3 peças em linha reta (horizontal, vertical ou diagonal), <strong>mas uma das peças DEVE OBRIGATORIAMENTE estar na Casa Central (Posição 5)</strong>.
            </p>
            <div className="mt-2 text-[11px] text-amber-800/80 dark:text-amber-300/80 font-mono">
              Combinações vencedoras válidas: [4, 5, 6], [2, 5, 8], [1, 5, 9] e [3, 5, 7].
            </div>
          </div>

          {/* Como Funciona */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Como Funciona a Partida
            </h4>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                1
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Posição Inicial:</strong> Cada jogador começa com 3 peças posicionadas em extremidades opostas do tabuleiro. A linha do meio (casas 4, 5 e 6) inicia desocupada.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                2
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Movimentação por Turnos:</strong> Na sua vez, você escolhe uma de suas peças e a move para qualquer casa vizinha vazia conectada pelas linhas do tabuleiro.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                3
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Conectividade da Casa Central:</strong> A casa central (5) conecta-se a todas as outras 8 casas! Controlar o centro é a chave para vencer e bloquear o adversário.
              </p>
            </div>
          </div>

          {/* Dica da IA */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200">
            <h5 className="font-bold text-blue-700 dark:text-blue-400 mb-1">
              💡 Dica para Vencer a IA:
            </h5>
            Tente criar um &quot;garfo duplo&quot; (ameaça simultânea em duas linhas diferentes pelo centro), forçando a CPU a bloquear apenas um lado enquanto você finaliza no outro!
          </div>
        </div>

        {/* Botão Entendi */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-colors"
          >
            Entendido, vamos jogar!
          </button>
        </div>
      </div>
    </div>
  );
}
