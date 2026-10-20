"use client";

import React, { useState } from "react";
import { X, Bot, Users, Play, Globe, Sparkles, Loader2, KeyRound, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { GameMode, Difficulty } from "@/lib/game/tapatanLogic";
import { gameApi } from "@/lib/game/gameApiClient";

interface InitGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: GameMode;
  initialPlayerName?: string;
}

export default function InitGameModal({
  isOpen,
  onClose,
  defaultMode = "HVC",
  initialPlayerName = "Jogador 1",
}: InitGameModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>(defaultMode);
  const [player1, setPlayer1] = useState(initialPlayerName);
  const [player2, setPlayer2] = useState(defaultMode === "HVC" ? "IA Alpha" : "Jogador 2");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Online options
  const [onlineAction, setOnlineAction] = useState<"create" | "join">("create");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const p1 = player1.trim() || "Jogador 1";

    if (mode === "ONLINE") {
      setIsLoading(true);
      try {
        if (onlineAction === "create") {
          // Cria sala no backend
          const session = await gameApi.createSession({
            mode: "online",
            player1_name: p1,
            player2_name: "Aguardando Jogador 2...",
          });

          if (!session.room_code) {
            throw new Error("O servidor não gerou o código da sala.");
          }

          onClose();
          router.push(
            `/jogo-home/jogo?type=ONLINE&room=${encodeURIComponent(session.room_code)}&p1=${encodeURIComponent(p1)}&role=p1`
          );
        } else {
          // Entrar em sala existente
          const cleanCode = roomCodeInput.trim().toUpperCase();
          if (!cleanCode) {
            setErrorMessage("Por favor, digite o código da sala (ex: TAP-XXXXX).");
            setIsLoading(false);
            return;
          }

          onClose();
          router.push(
            `/jogo-home/jogo?type=ONLINE&room=${encodeURIComponent(cleanCode)}&p1=${encodeURIComponent(p1)}&role=p2`
          );
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao conectar à sala online.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Modos Locais (HVC ou HVH)
    const p2 = mode === "HVC" ? "IA Alpha" : player2.trim() || "Jogador 2";
    const query = new URLSearchParams({
      type: mode,
      p1: encodeURIComponent(p1),
      p2: encodeURIComponent(p2),
      diff: difficulty,
    });

    onClose();
    router.push(`/jogo-home/jogo?${query.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#121422] border border-white/10 shadow-2xl text-left">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Título */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Iniciar Partida
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Escolha a modalidade de jogo e entre no tabuleiro tático
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4">
          {/* Seletor de Modo */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">
              Modo de Jogo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Humano vs IA */}
              <button
                type="button"
                onClick={() => {
                  setMode("HVC");
                  setPlayer2("IA Alpha");
                }}
                className={`py-3 px-2 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  mode === "HVC"
                    ? "bg-[#00d2ff]/15 text-[#00d2ff] border-[#00d2ff]/40 shadow-lg shadow-[#00d2ff]/10"
                    : "bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/15"
                }`}
              >
                <Bot className="h-5 w-5" />
                <span>Vs IA</span>
              </button>

              {/* 2 Jogadores Local */}
              <button
                type="button"
                onClick={() => {
                  setMode("HVH");
                  setPlayer2("Jogador 2");
                }}
                className={`py-3 px-2 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  mode === "HVH"
                    ? "bg-[#ff3b5c]/15 text-[#ff3b5c] border-[#ff3b5c]/40 shadow-lg shadow-[#ff3b5c]/10"
                    : "bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/15"
                }`}
              >
                <Users className="h-5 w-5" />
                <span>2P Local</span>
              </button>

              {/* Online Multiplayer */}
              <button
                type="button"
                onClick={() => {
                  setMode("ONLINE");
                  setPlayer2("Adversário Online");
                }}
                className={`py-3 px-2 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  mode === "ONLINE"
                    ? "bg-purple-500/15 text-purple-400 border-purple-500/40 shadow-lg shadow-purple-500/10"
                    : "bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/15"
                }`}
              >
                <Globe className="h-5 w-5" />
                <span>Online (WS)</span>
              </button>
            </div>
          </div>

          {/* Opções específicas para Modo Online */}
          {mode === "ONLINE" && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
              <span className="text-xs font-semibold text-purple-300 block">
                Multijogador em Tempo Real com Chat
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOnlineAction("create")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    onlineAction === "create"
                      ? "bg-purple-500/20 text-purple-200 border-purple-500/50"
                      : "bg-white/[0.02] text-gray-400 border-white/5"
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Criar Sala</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlineAction("join")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    onlineAction === "join"
                      ? "bg-purple-500/20 text-purple-200 border-purple-500/50"
                      : "bg-white/[0.02] text-gray-400 border-white/5"
                  }`}
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Entrar com Código</span>
                </button>
              </div>

              {onlineAction === "join" && (
                <div>
                  <label className="text-[11px] font-medium text-gray-300 block mb-1">
                    Código da Sala Online
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ex: TAP-ABC12"
                    required={onlineAction === "join"}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white font-mono uppercase text-sm tracking-wider focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* Nome do Jogador 1 (ou Jogador Conectando) */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1.5">
              {mode === "ONLINE"
                ? "Seu Nome de Jogador"
                : "Jogador 1 (Peças Azuis / Ciano)"}
            </label>
            <input
              type="text"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              placeholder="Seu nome ou apelido"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00d2ff] transition-colors"
            />
          </div>

          {/* Nome do Jogador 2 (se HVH local) */}
          {mode === "HVH" && (
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1.5">
                Jogador 2 (Peças Vermelhas / Rosa)
              </label>
              <input
                type="text"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                placeholder="Nome do segundo jogador"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff3b5c] transition-colors"
              />
            </div>
          )}

          {/* Dificuldade da IA (se HVC) */}
          {mode === "HVC" && (
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1.5">
                Nível de Dificuldade da IA
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      difficulty === d
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/15"
                    }`}
                  >
                    {d === "easy" ? "Iniciante" : d === "medium" ? "Estrategista" : "Mestre"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botão Começar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                mode === "ONLINE"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-500/25"
                  : "bg-gradient-to-r from-[#00d2ff] to-[#0099ff] hover:from-[#33dcff] hover:to-[#1aa3ff] text-slate-950 shadow-[#00d2ff]/25"
              } hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>A preparar sala online...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {mode === "ONLINE"
                      ? onlineAction === "create"
                        ? "Criar Sala & Conectar"
                        : "Conectar à Sala"
                      : "Entrar no Tabuleiro"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
