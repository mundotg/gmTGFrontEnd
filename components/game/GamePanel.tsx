"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Clock,
  History,
  Users,
  Settings,
  Brain,
  Volume2,
  VolumeX,
  RotateCcw,
  Flag,
  Handshake,
  HelpCircle,
  Sparkles,
  Trophy,
  MessageSquare,
  Send,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { Jogada, PlayerStats, soundManager } from "@/lib/game/tapatanLogic";

export interface ChatMessage {
  id?: string;
  sender_player: number;
  sender_name: string;
  message: string;
  timestamp: string;
}

interface GamePanelProps {
  jogadas: Jogada[];
  player1: PlayerStats;
  player2: PlayerStats;
  activePlayer: number;
  gameTime: string;
  gameMode: string;
  onRestart: () => void;
  onSurrender: () => void;
  onRequestDraw: () => void;
  onOpenRules: () => void;
  theme: "cyberpunk" | "classic" | "minimal";
  onChangeTheme: (theme: "cyberpunk" | "classic" | "minimal") => void;
  roomCode?: string;
  chatMessages?: ChatMessage[];
  onSendMessage?: (msg: string) => void;
  isConnectedOnline?: boolean;
}

export default function GamePanel({
  jogadas,
  player1,
  player2,
  activePlayer,
  gameTime,
  gameMode,
  onRestart,
  onSurrender,
  onRequestDraw,
  onOpenRules,
  theme,
  onChangeTheme,
  roomCode,
  chatMessages = [],
  onSendMessage,
  isConnectedOnline = false,
}: GamePanelProps) {
  const [activeTab, setActiveTab] = useState<"history" | "chat" | "players" | "tactics" | "settings">(
    gameMode === "ONLINE" ? "chat" : "history"
  );
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);
  const [volume, setVolume] = useState(soundManager.volume);
  const [chatInput, setChatInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Rola o chat para o fim quando novas mensagens chegam
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const toggleSound = () => {
    soundManager.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundManager.volume = val;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !onSendMessage) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleCopyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xl overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Cabeçalho do Painel */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
              Tempo de Jogo
            </span>
            <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 tracking-widest">
              {gameTime}
            </div>
          </div>
        </div>

        {/* Turno Atual */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              activePlayer === 1 ? "bg-blue-500" : "bg-rose-500"
            }`}
          />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Vez de: {activePlayer === 1 ? player1.nome : player2.nome}
          </span>
        </div>
      </div>

      {/* Banner de Sala Online (se ativo) */}
      {gameMode === "ONLINE" && roomCode && (
        <div className="px-5 py-2.5 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-purple-300">
            <Globe className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Sala: <strong className="font-mono text-white tracking-wider">{roomCode}</strong></span>
          </div>
          <button
            onClick={handleCopyRoomCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[11px] font-medium border border-purple-500/40 transition-colors"
          >
            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedCode ? "Copiado!" : "Copiar"}</span>
          </button>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30 overflow-x-auto">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === "history"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Jogadas ({jogadas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all relative ${
            activeTab === "chat"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
          {isConnectedOnline && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-2 right-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === "players"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Placar</span>
        </button>

        <button
          onClick={() => setActiveTab("tactics")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === "tactics"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <Brain className="h-4 w-4" />
          <span>Táticas</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === "settings"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Opções</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[280px] max-h-[380px] text-sm flex flex-col justify-between">
        {/* ABA: HISTÓRICO DE JOGADAS */}
        {activeTab === "history" && (
          <div className="space-y-2.5 flex-1">
            {jogadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <History className="h-10 w-10 mb-2 stroke-1 opacity-50" />
                <p>Nenhuma jogada realizada ainda.</p>
                <span className="text-xs text-gray-600 mt-1">
                  Selecione uma peça para ver as casas vizinhas livres.
                </span>
              </div>
            ) : (
              jogadas.map((j, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      j.player === 1
                        ? "bg-[#00d2ff]/20 text-[#00d2ff]"
                        : "bg-[#ff3b5c]/20 text-[#ff3b5c]"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {j.player === 1 ? player1.nome : player2.nome}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {j.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">{j.descricao}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20">
                        <Sparkles className="h-3 w-3" />
                        {j.estrategia}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA: CHAT AO VIVO */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full flex-1">
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[260px]">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-center">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-40 text-purple-400" />
                  <p className="text-xs">Nenhuma mensagem ainda.</p>
                  <span className="text-[11px] text-gray-600 mt-1 max-w-xs">
                    {gameMode === "ONLINE"
                      ? "Converse ao vivo com o seu adversário durante a partida!"
                      : "O chat em tempo real é gravado e transmitido no modo Online."}
                  </span>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isP1 = msg.sender_player === 1;
                  const isP2 = msg.sender_player === 2;
                  return (
                    <div
                      key={index}
                      className={`p-2.5 rounded-xl border text-xs ${
                        isP1
                          ? "bg-[#00d2ff]/5 border-[#00d2ff]/20 text-gray-200"
                          : isP2
                          ? "bg-[#ff3b5c]/5 border-[#ff3b5c]/20 text-gray-200"
                          : "bg-white/[0.02] border-white/5 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold ${
                            isP1
                              ? "text-[#00d2ff]"
                              : isP2
                              ? "text-[#ff3b5c]"
                              : "text-purple-300"
                          }`}
                        >
                          {msg.sender_name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="break-words">{msg.message}</p>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input de Envio de Mensagem */}
            <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  gameMode === "ONLINE"
                    ? "Escreva sua mensagem..."
                    : "Chat ativo em modo Online..."
                }
                disabled={gameMode !== "ONLINE"}
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={gameMode !== "ONLINE" || !chatInput.trim()}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* ABA: PLACAR E JOGADORES */}
        {activeTab === "players" && (
          <div className="space-y-4 flex-1">
            {/* Jogador 1 */}
            <div className="p-4 rounded-2xl bg-[#00d2ff]/5 border border-[#00d2ff]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00d2ff] to-[#0284c7] flex items-center justify-center text-white font-bold shadow-lg shadow-[#00d2ff]/30">
                  P1
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{player1.nome}</h4>
                  <span className="text-xs text-[#00d2ff]">Peças Azuis / Ciano</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-white">
                  {player1.pontuacao}
                </div>
                <span className="text-[11px] text-gray-400">Vitórias</span>
              </div>
            </div>

            {/* Jogador 2 */}
            <div className="p-4 rounded-2xl bg-[#ff3b5c]/5 border border-[#ff3b5c]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff3b5c] to-[#e11d48] flex items-center justify-center text-white font-bold shadow-lg shadow-[#ff3b5c]/30">
                  {gameMode === "HVC" ? "IA" : "P2"}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{player2.nome}</h4>
                  <span className="text-xs text-[#ff3b5c]">Peças Vermelhas / Rosa</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-white">
                  {player2.pontuacao}
                </div>
                <span className="text-[11px] text-gray-400">Vitórias</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-gray-400 flex items-center justify-between">
              <span>Total de Peças por Jogador: 3</span>
              <span>Casas no Tabuleiro: 9</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-medium text-[11px]">Cache de Estatísticas: 1 minuto (TTL 60s)</span>
              </div>
              <span className="text-[10px] text-emerald-400/70 font-mono">Redis + RAM</span>
            </div>
          </div>
        )}

        {/* ABA: TÁTICAS E DICAS */}
        {activeTab === "tactics" && (
          <div className="space-y-3.5 text-xs text-gray-300 flex-1">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              <span className="font-bold flex items-center gap-1.5 text-sm mb-1 text-amber-300">
                <Trophy className="h-4 w-4" /> Regra do Centro Obrigatório
              </span>
              Neste jogo, para vencer, a linha reta de 3 peças <strong>tem obrigatoriamente que passar pelo Centro (Casa 5)</strong>! Linhas laterais sem o centro não conferem vitória.
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h5 className="font-semibold text-white">Dicas Estratégicas:</h5>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>
                  <strong className="text-gray-200">Ocupe o Centro:</strong> A casa 5 conecta-se a todas as outras 8 casas do tabuleiro.
                </li>
                <li>
                  <strong className="text-gray-200">Prevenção de Armadilhas:</strong> Se o adversário tiver duas peças apontando para o centro, bloqueie-o imediatamente.
                </li>
                <li>
                  <strong className="text-gray-200">Garfo / Dupla Ameaça:</strong> Tente criar simultaneamente duas linhas de finalização pelo centro.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ABA: CONFIGURAÇÕES */}
        {activeTab === "settings" && (
          <div className="space-y-4 flex-1">
            {/* Controle de Volume */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="h-4 w-4 text-[#00d2ff]" /> : <VolumeX className="h-4 w-4 text-gray-500" />}
                  Efeitos Sonoros
                </span>
                <button
                  onClick={toggleSound}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    soundEnabled
                      ? "bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/30"
                      : "bg-white/5 text-gray-400 border border-white/10"
                  }`}
                >
                  {soundEnabled ? "Ativado" : "Desativado"}
                </button>
              </div>

              {soundEnabled && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 accent-[#00d2ff] cursor-pointer"
                  />
                  <span className="text-[11px] text-gray-400 font-mono">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Seletor de Tema Visual */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-xs font-medium text-white block">Tema do Tabuleiro</span>
              <div className="grid grid-cols-3 gap-2">
                {(["cyberpunk", "classic", "minimal"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onChangeTheme(t)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                      theme === t
                        ? "bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/40 shadow-lg shadow-[#00d2ff]/10"
                        : "bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {t === "cyberpunk" ? "Neon Cyber" : t === "classic" ? "Clássico" : "Minimal"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ações Inferiores da Partida */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reiniciar</span>
        </button>

        <button
          onClick={onRequestDraw}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-all shadow-sm"
        >
          <Handshake className="h-3.5 w-3.5" />
          <span>Pedir Empate</span>
        </button>

        <button
          onClick={onSurrender}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-400 transition-all shadow-sm"
        >
          <Flag className="h-3.5 w-3.5" />
          <span>Desistir</span>
        </button>

        <button
          onClick={onOpenRules}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-400 transition-all shadow-sm"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Regras</span>
        </button>
      </div>
    </div>
  );
}
