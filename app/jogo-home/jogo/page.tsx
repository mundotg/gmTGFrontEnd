"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Swords,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  User,
  ShieldAlert,
  Zap,
  Globe,
  Loader2,
  Handshake,
  Check,
  X as XIcon,
} from "lucide-react";
import GameBoard from "@/components/game/GameBoard";
import GamePanel, { ChatMessage } from "@/components/game/GamePanel";
import GameResultModal, { ResultType } from "@/components/game/GameResultModal";
import GameRulesModal from "@/components/game/GameRulesModal";
import {
  Col,
  PecaObject,
  Jogada,
  PlayerStats,
  GameMode,
  Difficulty,
  createInitialState,
  checkWinner,
  getValidMovesForPiece,
  computeBestMove,
  determineTacticalIntent,
  casaToCoords,
  soundManager,
  stateFromBoardDict,
  matrixToBoardDict,
} from "@/lib/game/tapatanLogic";
import { gameApi } from "@/lib/game/gameApiClient";

function JogoArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Query Parameters
  const typeParam = (searchParams.get("type") as GameMode) || "HVC";
  const p1Param = searchParams.get("p1")
    ? decodeURIComponent(searchParams.get("p1")!)
    : "Jogador 1";
  const p2Param = searchParams.get("p2")
    ? decodeURIComponent(searchParams.get("p2")!)
    : typeParam === "HVC"
    ? "IA Alpha"
    : "Jogador 2";
  const diffParam = (searchParams.get("diff") as Difficulty) || "medium";
  const roomParam = searchParams.get("room")
    ? decodeURIComponent(searchParams.get("room")!).toUpperCase()
    : null;

  const [gameMode] = useState<GameMode>(typeParam);
  const [difficulty] = useState<Difficulty>(diffParam);
  const [roomCode, setRoomCode] = useState<string | null>(roomParam);

  // Online Multiplayer State
  const [onlinePlayerNum, setOnlinePlayerNum] = useState<number | null>(null);
  const [isConnectedOnline, setIsConnectedOnline] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<"connecting" | "waiting" | "active" | "finished">("connecting");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [incomingDrawProposal, setIncomingDrawProposal] = useState<boolean>(false);
  const [onlineToast, setOnlineToast] = useState<string | null>(null);

  // Backend Game Session ID (for persistence in local & AI modes)
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);

  // Player Stats
  const [player1, setPlayer1] = useState<PlayerStats>({
    id: "p1",
    nome: p1Param,
    color: "#00d2ff",
    pontuacao: 0,
    tempoJogado: "00:00",
  });

  const [player2, setPlayer2] = useState<PlayerStats>({
    id: "p2",
    nome: p2Param,
    color: "#ff3b5c",
    pontuacao: 0,
    tempoJogado: "00:00",
  });

  // Board & Pieces State
  const initial = useMemo(
    () => createInitialState(player1.nome, player2.nome, player1.color, player2.color),
    [player1.nome, player2.nome, player1.color, player2.color]
  );
  const [matrix, setMatrix] = useState<Col[][]>(initial.matrix);
  const [pecasP1, setPecasP1] = useState<PecaObject[]>(initial.pecasP1);
  const [pecasP2, setPecasP2] = useState<PecaObject[]>(initial.pecasP2);

  const [activePlayer, setActivePlayer] = useState<number>(1);
  const [selectedCasa, setSelectedCasa] = useState<number | null>(null);
  const [validDestinations, setValidDestinations] = useState<number[]>([]);
  const [jogadas, setJogadas] = useState<Jogada[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Time & Session
  const [gameSeconds, setGameSeconds] = useState(0);
  const [theme, setTheme] = useState<"cyberpunk" | "classic" | "minimal">("cyberpunk");
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(soundManager.enabled);

  // Result Modal State
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    result: ResultType;
    title: string;
    message: string;
    winnerName?: string;
  }>({
    isOpen: false,
    result: "winner",
    title: "",
    message: "",
  });

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // Timer
  useEffect(() => {
    if (resultModal.isOpen) return;
    if (gameMode === "ONLINE" && onlineStatus !== "active") return;

    const interval = setInterval(() => {
      setGameSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resultModal.isOpen, gameMode, onlineStatus]);

  const formattedGameTime = useMemo(() => {
    const mins = Math.floor(gameSeconds / 60);
    const secs = gameSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [gameSeconds]);

  // Load scores from backend or localStorage
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await gameApi.getPlayerStats(player1.nome);
        if (stats) {
          setPlayer1((p) => ({ ...p, pontuacao: stats.total_wins }));
        }
      } catch {
        try {
          const saved = localStorage.getItem("tapatan_stats");
          if (saved) {
            const parsed = JSON.parse(saved);
            setPlayer1((p) => ({ ...p, pontuacao: parsed.p1Wins || 0 }));
            setPlayer2((p) => ({ ...p, pontuacao: parsed.p2Wins || 0 }));
          }
        } catch {}
      }
    }
    loadStats();
  }, [player1.nome]);

  // Helper Toast for Online Notifications
  const showToast = useCallback((msg: string) => {
    setOnlineToast(msg);
    setTimeout(() => setOnlineToast(null), 4000);
  }, []);

  // ──────────────────────────────────────────────────────────
  // 1. INICIALIZAÇÃO DE SESSÃO NO BACKEND (LOCAL OU VS IA)
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode === "ONLINE") return;

    async function initBackendSession() {
      try {
        const session = await gameApi.createSession({
          mode: gameMode === "HVC" ? "ai" : "local",
          player1_name: player1.nome,
          player2_name: player2.nome,
          difficulty: difficulty,
        });
        setBackendSessionId(session.id);
      } catch (err) {
        console.warn("Backend offline ou inacessível, utilizando modo local fallback:", err);
      }
    }

    initBackendSession();
  }, [gameMode, player1.nome, player2.nome, difficulty]);

  // ──────────────────────────────────────────────────────────
  // 2. WEBSOCKET MULTIJOGADOR ONLINE
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== "ONLINE" || !roomCode) return;

    const wsUrl = gameApi.getWebSocketUrl(roomCode, player1.nome);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnectedOnline(true);
      showToast("Conectado ao servidor online!");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            setOnlinePlayerNum(data.player_number);
            if (data.state) {
              setOnlineStatus(data.state.status);
              setActivePlayer(data.state.current_turn);
              if (data.state.player1_name) {
                setPlayer1((p) => ({ ...p, nome: data.state.player1_name }));
              }
              if (data.state.player2_name) {
                setPlayer2((p) => ({ ...p, nome: data.state.player2_name }));
              }
              if (data.state.board_state) {
                const sync = stateFromBoardDict(
                  data.state.board_state,
                  data.state.player1_name || player1.nome,
                  data.state.player2_name || player2.nome,
                  player1.color,
                  player2.color
                );
                setMatrix(sync.matrix);
                setPecasP1(sync.pecasP1);
                setPecasP2(sync.pecasP2);
              }
            }
            break;

          case "player_joined":
            showToast(`${data.player_name} entrou na sala!`);
            if (data.state) {
              setOnlineStatus(data.state.status);
              if (data.state.player1_name) setPlayer1((p) => ({ ...p, nome: data.state.player1_name }));
              if (data.state.player2_name) setPlayer2((p) => ({ ...p, nome: data.state.player2_name }));
            }
            break;

          case "game_start":
            soundManager.playSelect();
            setOnlineStatus("active");
            showToast("A partida começou! Boa sorte.");
            if (data.state) {
              setActivePlayer(data.state.current_turn);
              if (data.state.player1_name) setPlayer1((p) => ({ ...p, nome: data.state.player1_name }));
              if (data.state.player2_name) setPlayer2((p) => ({ ...p, nome: data.state.player2_name }));
              if (data.state.board_state) {
                const sync = stateFromBoardDict(
                  data.state.board_state,
                  data.state.player1_name,
                  data.state.player2_name,
                  player1.color,
                  player2.color
                );
                setMatrix(sync.matrix);
                setPecasP1(sync.pecasP1);
                setPecasP2(sync.pecasP2);
              }
            }
            break;

          case "move_made": {
            soundManager.playMove();
            const from = data.from_casa;
            const to = data.to_casa;
            const p = data.player;

            if (data.state?.board_state) {
              const sync = stateFromBoardDict(
                data.state.board_state,
                data.state.player1_name || player1.nome,
                data.state.player2_name || player2.nome,
                player1.color,
                player2.color
              );
              setMatrix(sync.matrix);
              setPecasP1(sync.pecasP1);
              setPecasP2(sync.pecasP2);
              setActivePlayer(data.state.current_turn);
            }

            const cOrigem = casaToCoords(from);
            const cDestino = casaToCoords(to);
            const moveName = p === 1 ? player1.nome : player2.nome;
            const newJogada: Jogada = {
              player: p,
              id: `move_${Date.now()}`,
              indexAnt: cOrigem,
              indexNow: cDestino,
              casaOrigem: from,
              casaDestino: to,
              descricao: `${moveName}: Casa ${from} ➔ Casa ${to}`,
              estrategia: to === 5 ? "Ocupação Central (5)" : "Manobra Tática",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            };
            setJogadas((prev) => [newJogada, ...prev]);
            setSelectedCasa(null);
            setValidDestinations([]);
            break;
          }

          case "chat_message":
            setChatMessages((prev) => [
              ...prev,
              {
                sender_player: data.sender_player,
                sender_name: data.sender_name,
                message: data.message,
                timestamp: data.timestamp,
              },
            ]);
            break;

          case "draw_offered":
            if (data.proposing_player !== onlinePlayerNum) {
              setIncomingDrawProposal(true);
              showToast(`${data.proposing_name} propôs um empate.`);
            }
            break;

          case "draw_rejected":
            showToast(data.message || "Proposta de empate rejeitada.");
            break;

          case "game_over": {
            setOnlineStatus("finished");
            const winner = data.winner_player;
            if (winner === onlinePlayerNum) {
              soundManager.playWin();
              setResultModal({
                isOpen: true,
                result: "winner",
                title: "Vitória Online!",
                message: data.reason || "Parabéns, você dominou a partida!",
                winnerName: data.winner_name || player1.nome,
              });
            } else if (winner === 0) {
              soundManager.playDefeat();
              setResultModal({
                isOpen: true,
                result: "draw",
                title: "Empate!",
                message: data.reason || "A partida terminou em igualdade.",
              });
            } else {
              soundManager.playDefeat();
              setResultModal({
                isOpen: true,
                result: "loser",
                title: "Derrota",
                message: data.reason || "Seu adversário conquistou a vitória.",
                winnerName: data.winner_name || player2.nome,
              });
            }
            break;
          }

          case "rematch_started":
            showToast("Revanche iniciada!");
            handleRestartLocalState();
            setResultModal({ isOpen: false, result: "winner", title: "", message: "" });
            break;

          case "player_disconnected":
            showToast(`${data.player_name} desconectou-se (${data.reconnect_timeout}s para retornar).`);
            break;

          case "error":
            showToast(`⚠️ ${data.message}`);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("Erro ao processar mensagem do WebSocket:", err);
      }
    };

    ws.onclose = () => {
      setIsConnectedOnline(false);
      showToast("Conexão com a sala encerrada.");
    };

    // Keep-alive heartbeat (ping a cada 20s)
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [gameMode, roomCode, player1.nome, onlinePlayerNum, showToast]);

  // Restart local board state
  const handleRestartLocalState = useCallback(() => {
    const fresh = createInitialState(player1.nome, player2.nome, player1.color, player2.color);
    setMatrix(fresh.matrix);
    setPecasP1(fresh.pecasP1);
    setPecasP2(fresh.pecasP2);
    setActivePlayer(1);
    setSelectedCasa(null);
    setValidDestinations([]);
    setJogadas([]);
    setGameSeconds(0);
    setIsThinking(false);
  }, [player1.nome, player2.nome, player1.color, player2.color]);

  // Restart Match Button
  const handleRestart = useCallback(() => {
    soundManager.playSelect();
    if (gameMode === "ONLINE" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "rematch" }));
      showToast("Voto de revanche enviado ao adversário.");
      return;
    }

    handleRestartLocalState();
    setResultModal({
      isOpen: false,
      result: "winner",
      title: "",
      message: "",
    });

    // Inicia nova sessão no backend se local
    if (gameMode !== "ONLINE") {
      gameApi
        .createSession({
          mode: gameMode === "HVC" ? "ai" : "local",
          player1_name: player1.nome,
          player2_name: player2.nome,
          difficulty,
        })
        .then((s) => setBackendSessionId(s.id))
        .catch(() => {});
    }
  }, [gameMode, handleRestartLocalState, showToast, player1.nome, player2.nome, difficulty]);

  // ──────────────────────────────────────────────────────────
  // 3. EXECUÇÃO DE JOGADA (LOCAL & MODO IA)
  // ──────────────────────────────────────────────────────────
  const executeLocalMove = useCallback(
    async (casaOrigem: number, casaDestino: number, jogador: number) => {
      const cOrigem = casaToCoords(casaOrigem);
      const cDestino = casaToCoords(casaDestino);

      // Clone matrix
      const boardBefore = matrixToBoardDict(matrix);
      const newMatrix: Col[][] = matrix.map((row) => row.map((c) => ({ ...c })));
      const movingCell = newMatrix[cOrigem.row][cOrigem.col];

      newMatrix[cOrigem.row][cOrigem.col] = {
        free: false,
        player: 0,
        casaN: casaOrigem,
        id: undefined,
        namePlayer: undefined,
      };

      newMatrix[cDestino.row][cDestino.col] = {
        free: true,
        player: jogador,
        casaN: casaDestino,
        id: movingCell.id,
        namePlayer: jogador === 1 ? player1.nome : player2.nome,
      };

      // Atualiza coordenadas das peças
      let updatedPecasP1 = pecasP1;
      let updatedPecasP2 = pecasP2;

      if (jogador === 1) {
        updatedPecasP1 = pecasP1.map((p) =>
          p.casaN === casaOrigem ? { ...p, casaN: casaDestino } : p
        );
        setPecasP1(updatedPecasP1);
      } else {
        updatedPecasP2 = pecasP2.map((p) =>
          p.casaN === casaOrigem ? { ...p, casaN: casaDestino } : p
        );
        setPecasP2(updatedPecasP2);
      }

      setMatrix(newMatrix);
      soundManager.playMove();

      const boardAfter = matrixToBoardDict(newMatrix);

      // Grava no histórico local da UI
      const intent = determineTacticalIntent(casaDestino, jogador, newMatrix);
      const novaJogada: Jogada = {
        player: jogador,
        id: `move_${Date.now()}`,
        indexAnt: cOrigem,
        indexNow: cDestino,
        casaOrigem,
        casaDestino,
        descricao: `${jogador === 1 ? player1.nome : player2.nome}: Casa ${casaOrigem} ➔ Casa ${casaDestino}`,
        estrategia: intent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setJogadas((prev) => [novaJogada, ...prev]);

      // Persiste movimento no backend se houver sessão ativa
      if (backendSessionId) {
        gameApi.recordMove(
          backendSessionId,
          jogadas.length + 1,
          jogador,
          casaOrigem,
          casaDestino,
          boardBefore,
          boardAfter,
          intent
        ).catch(() => {});
      }

      // Verifica Vitória (Regra de Ouro: Trinca com a Casa 5)
      const activePecas = jogador === 1 ? updatedPecasP1 : updatedPecasP2;
      const isWinner = checkWinner(activePecas);

      if (isWinner) {
        if (backendSessionId) {
          gameApi.finishSession(
            backendSessionId,
            jogador,
            `[${casaOrigem}, 5, ${casaDestino}]`,
            gameSeconds,
            jogadas.length + 1,
            boardAfter
          ).catch(() => {});
        }

        if (jogador === 1) {
          soundManager.playWin();
          setPlayer1((p) => ({ ...p, pontuacao: p.pontuacao + 1 }));
          setResultModal({
            isOpen: true,
            result: "winner",
            title: `Vitória de ${player1.nome}!`,
            message: "Excelente alinhamento tático passando pela Casa Central (5)!",
            winnerName: player1.nome,
          });
        } else {
          if (gameMode === "HVC") soundManager.playDefeat();
          else soundManager.playWin();
          setPlayer2((p) => ({ ...p, pontuacao: p.pontuacao + 1 }));
          setResultModal({
            isOpen: true,
            result: gameMode === "HVC" ? "loser" : "winner",
            title: `Vitória de ${player2.nome}!`,
            message: "Domínio tático completo do tabuleiro e do centro!",
            winnerName: player2.nome,
          });
        }
        return;
      }

      // Verifica Afogamento / Bloqueio Total (Empate)
      const opponent = jogador === 1 ? 2 : 1;
      const opponentPecas = opponent === 1 ? updatedPecasP1 : updatedPecasP2;
      const opponentHasMoves = opponentPecas.some(
        (p) => getValidMovesForPiece(p.casaN, newMatrix).length > 0
      );

      if (!opponentHasMoves) {
        if (backendSessionId) {
          gameApi.finishSession(
            backendSessionId,
            0,
            null,
            gameSeconds,
            jogadas.length + 1,
            boardAfter
          ).catch(() => {});
        }

        soundManager.playDefeat();
        setResultModal({
          isOpen: true,
          result: "draw",
          title: "Empate por Bloqueio",
          message: `O jogador ${opponent === 1 ? player1.nome : player2.nome} ficou totalmente sem movimentos válidos!`,
        });
        return;
      }

      // Alterna turno
      setActivePlayer(opponent);
      setSelectedCasa(null);
      setValidDestinations([]);
    },
    [
      matrix,
      pecasP1,
      pecasP2,
      player1.nome,
      player2.nome,
      backendSessionId,
      jogadas.length,
      gameSeconds,
      gameMode,
    ]
  );

  // ──────────────────────────────────────────────────────────
  // 4. MOTOR DA IA (CONECTADO AO BACKEND COM APRENDIZADO BD)
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activePlayer !== 2 || gameMode !== "HVC" || resultModal.isOpen) return;

    let isMounted = true;
    setIsThinking(true);

    const timer = setTimeout(async () => {
      try {
        const boardDict = matrixToBoardDict(matrix);
        // Tenta obter jogada aprendida no backend
        const aiResponse = await gameApi.getAIMove(boardDict, 2, difficulty);

        if (!isMounted) return;

        if (aiResponse && aiResponse.from_casa && aiResponse.to_casa) {
          executeLocalMove(aiResponse.from_casa, aiResponse.to_casa, 2);
        } else {
          // Fallback heurístico local
          const localAiMove = computeBestMove(matrix, 2, difficulty);
          if (localAiMove) {
            executeLocalMove(localAiMove.casaOrigem, localAiMove.casaDestino, 2);
          } else {
            setResultModal({
              isOpen: true,
              result: "draw",
              title: "Empate Técnico",
              message: "A IA ficou sem opções de movimentação legal no tabuleiro.",
            });
          }
        }
      } catch (err) {
        // Fallback local se o backend estiver inacessível
        const localAiMove = computeBestMove(matrix, 2, difficulty);
        if (localAiMove) {
          executeLocalMove(localAiMove.casaOrigem, localAiMove.casaDestino, 2);
        } else {
          setResultModal({
            isOpen: true,
            result: "draw",
            title: "Empate Técnico",
            message: "A IA ficou sem opções de movimentação legal no tabuleiro.",
          });
        }
      } finally {
        if (isMounted) setIsThinking(false);
      }
    }, 550);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activePlayer, matrix, gameMode, difficulty, resultModal.isOpen, executeLocalMove]);

  // ──────────────────────────────────────────────────────────
  // 5. CLIQUE E MOVIMENTAÇÃO DE PEÇAS
  // ──────────────────────────────────────────────────────────
  const handleSelectPiece = (casaN: number) => {
    if (resultModal.isOpen || isThinking) return;

    // Em modo online, só pode selecionar peças do seu próprio número
    if (gameMode === "ONLINE") {
      if (onlinePlayerNum !== activePlayer) return;
      const { row, col } = casaToCoords(casaN);
      const cell = matrix[row]?.[col];
      if (!cell || cell.player !== onlinePlayerNum) return;

      setSelectedCasa(casaN);
      const valids = getValidMovesForPiece(casaN, matrix);
      setValidDestinations(valids);
      soundManager.playSelect();
      return;
    }

    // Modo Local ou vs IA
    if (gameMode === "HVC" && activePlayer === 2) return;

    const { row, col } = casaToCoords(casaN);
    const cell = matrix[row]?.[col];

    if (!cell || cell.player !== activePlayer) return;

    setSelectedCasa(casaN);
    const valids = getValidMovesForPiece(casaN, matrix);
    setValidDestinations(valids);
    soundManager.playSelect();
  };

  const handleMoveToCasa = (casaDestino: number) => {
    if (selectedCasa === null || !validDestinations.includes(casaDestino)) return;

    if (gameMode === "ONLINE") {
      // Envia movimento via WebSocket para o servidor validar e propagar
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "move",
            from_casa: selectedCasa,
            to_casa: casaDestino,
          })
        );
      }
      setSelectedCasa(null);
      setValidDestinations([]);
      return;
    }

    // Execução local
    executeLocalMove(selectedCasa, casaDestino, activePlayer);
  };

  // ──────────────────────────────────────────────────────────
  // 6. CHAT AO VIVO (ONLINE)
  // ──────────────────────────────────────────────────────────
  const handleSendMessage = (msg: string) => {
    if (gameMode === "ONLINE" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          message: msg,
        })
      );
    }
  };

  // ──────────────────────────────────────────────────────────
  // 7. DESISTÊNCIA / RENDIÇÃO
  // ──────────────────────────────────────────────────────────
  const handleSurrender = () => {
    if (resultModal.isOpen) return;

    if (gameMode === "ONLINE" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "surrender" }));
      return;
    }

    const opposite = activePlayer === 1 ? 2 : 1;
    if (backendSessionId) {
      gameApi.finishSession(
        backendSessionId,
        opposite,
        null,
        gameSeconds,
        jogadas.length,
        matrixToBoardDict(matrix)
      ).catch(() => {});
    }

    soundManager.playDefeat();
    setResultModal({
      isOpen: true,
      result: "surrender",
      title: "Rendição Aceite",
      message: `${activePlayer === 1 ? player1.nome : player2.nome} abandonou a partida.`,
      winnerName: opposite === 1 ? player1.nome : player2.nome,
    });
  };

  // ──────────────────────────────────────────────────────────
  // 8. PEDIDO DE EMPATE
  // ──────────────────────────────────────────────────────────
  const handleRequestDraw = () => {
    if (resultModal.isOpen) return;

    if (gameMode === "ONLINE" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "draw", action: "propose" }));
      showToast("Proposta de empate enviada ao adversário.");
      return;
    }

    if (backendSessionId) {
      gameApi.finishSession(
        backendSessionId,
        0,
        null,
        gameSeconds,
        jogadas.length,
        matrixToBoardDict(matrix)
      ).catch(() => {});
    }

    soundManager.playSelect();
    setResultModal({
      isOpen: true,
      result: "draw",
      title: "Empate por Acordo Mútuo",
      message: "Ambos os jogadores concordaram em terminar a partida em igualdade.",
    });
  };

  // Aceitar / Rejeitar Proposta de Empate no modo Online
  const handleAcceptDraw = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "draw", action: "accept" }));
    }
    setIncomingDrawProposal(false);
  };

  const handleRejectDraw = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "draw", action: "reject" }));
    }
    setIncomingDrawProposal(false);
    showToast("Você recusou a proposta de empate.");
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col font-sans">
      {/* Toast de Notificação Online */}
      {onlineToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-purple-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          {onlineToast}
        </div>
      )}

      {/* Alerta de Empate Proposto (Modo Online) */}
      {incomingDrawProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-[#141724] border border-purple-500/30 shadow-2xl text-center space-y-4">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <Handshake className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Proposta de Empate</h4>
              <p className="text-xs text-gray-300 mt-1">
                O seu adversário propôs encerrar a partida em empate. Aceita?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRejectDraw}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                Recusar
              </button>
              <button
                onClick={handleAcceptDraw}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-colors"
              >
                Aceitar Empate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/jogo-home"
              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sair da Partida</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Swords className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold tracking-tight text-gray-900 dark:text-gray-100 hidden sm:inline">
                Arena Tapatan 3x3
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  gameMode === "ONLINE"
                    ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                    : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                }`}
              >
                {gameMode === "HVC"
                  ? `vs IA (${difficulty.toUpperCase()})`
                  : gameMode === "HVH"
                  ? "Duelo Local"
                  : `Online: ${roomCode || "Conectando"}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.enabled = !audioEnabled;
                setAudioEnabled(!audioEnabled);
              }}
              title={audioEnabled ? "Silenciar áudio" : "Ativar efeitos sonoros"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playSelect();
                setRulesModalOpen(true);
              }}
              title="Ver Regras"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
            >
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>

            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {gameMode === "ONLINE" ? "Revanche" : "Reiniciar"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {/* Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          {/* Player 1 Card */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-2.5 sm:px-4 transition-all duration-300 ${
              activePlayer === 1 && !resultModal.isOpen
                ? "border-blue-500/50 bg-blue-50 dark:bg-blue-950/40 shadow-sm scale-[1.02]"
                : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 sm:text-sm">{player1.nome}</span>
                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
                {gameMode === "ONLINE" && onlinePlayerNum === 1 && (
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.2 rounded">
                    Você
                  </span>
                )}
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                Peças Azuis • Início [1, 2, 3]
              </span>
            </div>
          </div>

          {/* Turn info */}
          <div className="flex flex-col items-center">
            {resultModal.isOpen ? (
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Partida Finalizada
              </span>
            ) : gameMode === "ONLINE" && onlineStatus === "waiting" ? (
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs sm:text-sm animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Aguardando o 2º jogador entrar na sala...</span>
              </div>
            ) : isThinking ? (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs sm:text-sm animate-pulse">
                <Bot className="h-4 w-4 animate-spin" />
                <span>IA calculando resposta tática...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Turno Atual:{" "}
                  <strong className={activePlayer === 1 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"}>
                    {activePlayer === 1 ? player1.nome : player2.nome}
                    {gameMode === "ONLINE" && (
                      <span className="ml-1 text-[9px] font-mono opacity-80">
                        {onlinePlayerNum === activePlayer ? "(Sua Vez)" : "(Vez do Adversário)"}
                      </span>
                    )}
                  </strong>
                </span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-0.5">
                  Tempo: {formattedGameTime}
                </span>
              </div>
            )}
          </div>

          {/* Player 2 Card */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-2.5 sm:px-4 transition-all duration-300 ${
              activePlayer === 2 && !resultModal.isOpen
                ? "border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 shadow-sm scale-[1.02]"
                : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-end gap-1.5">
                {gameMode === "ONLINE" && onlinePlayerNum === 2 && (
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.2 rounded">
                    Você
                  </span>
                )}
                <span className="h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 sm:text-sm">{player2.nome}</span>
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium text-right block">
                Peças Rubras • Início [7, 8, 9]
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              {gameMode === "HVC" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
          </div>
        </div>

        {/* Center Alert */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Regra Central:</strong> Para vencer, os 3 alinhamentos devem cruzar obrigatoriamente a{" "}
              <strong>Casa Central (5)</strong>.
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400/80 hidden md:inline">
            Alinhamentos de borda externa não contam
          </span>
        </div>

        {/* Board and Panel Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Game Board */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-2xl">
              <GameBoard
                matrix={matrix}
                selectedCasa={selectedCasa}
                validDestinations={validDestinations}
                activePlayer={activePlayer}
                isMoving={isThinking}
                onSelectPiece={handleSelectPiece}
                onMoveToCasa={handleMoveToCasa}
                colorP1={player1.color}
                colorP2={player2.color}
                theme={theme}
              />
            </div>

            {/* Instruction tooltip */}
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                {gameMode === "ONLINE" && onlinePlayerNum !== activePlayer
                  ? "Aguarde o movimento do seu adversário..."
                  : selectedCasa === null
                  ? "Clique numa das suas peças para visualizar as casas disponíveis para mover."
                  : `Peça selecionada na casa ${selectedCasa}. Clique num dos círculos pulsantes para completar a jogada.`}
              </span>
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-4 w-full">
            <GamePanel
              jogadas={jogadas}
              player1={player1}
              player2={player2}
              activePlayer={activePlayer}
              gameTime={formattedGameTime}
              gameMode={gameMode}
              onRestart={handleRestart}
              onSurrender={handleSurrender}
              onRequestDraw={handleRequestDraw}
              onOpenRules={() => {
                soundManager.playSelect();
                setRulesModalOpen(true);
              }}
              theme={theme}
              onChangeTheme={setTheme}
              roomCode={roomCode || undefined}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              isConnectedOnline={isConnectedOnline}
            />
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <GameResultModal
        isOpen={resultModal.isOpen}
        result={resultModal.result}
        title={resultModal.title}
        message={resultModal.message}
        winnerName={resultModal.winnerName}
        totalMoves={jogadas.length}
        gameTime={formattedGameTime}
        onRematch={handleRestart}
        onExit={() => router.push("/jogo-home")}
      />

      {/* Rules Modal */}
      <GameRulesModal isOpen={rulesModalOpen} onClose={() => setRulesModalOpen(false)} />
    </div>
  );
}

export default function JogoArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07090e] text-cyan-400">
          <div className="flex flex-col items-center gap-3">
            <Swords className="h-8 w-8 animate-spin" />
            <span className="text-sm font-semibold tracking-wider">A carregar Arena Tapatan...</span>
          </div>
        </div>
      }
    >
      <JogoArenaContent />
    </Suspense>
  );
}
