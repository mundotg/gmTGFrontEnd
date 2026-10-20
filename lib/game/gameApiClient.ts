/**
 * Cliente de API e WebSocket para integração do Tapatan 3x3 com o Backend FastAPI.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || BASE_URL.replace(/^http/, "ws");

export interface SessionPayload {
  mode: "local" | "online" | "ai";
  player1_name: string;
  player2_name: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface GameSessionDto {
  id: string;
  room_code?: string;
  mode: string;
  status: string;
  player1_name: string;
  player2_name: string;
  current_turn: number;
  winner_player?: number | null;
  winning_line?: string | null;
  difficulty?: string | null;
  board_state?: Record<number, number>;
  total_moves: number;
  duration_seconds: number;
  created_at: string;
  finished_at?: string | null;
}

export interface PlayerStatsDto {
  player_name: string;
  total_games: number;
  wins_local: number;
  wins_online: number;
  wins_vs_ai: number;
  total_wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  total_moves: number;
  center_captures: number;
  win_streak: number;
  best_win_streak: number;
}

export interface GlobalStatsDto {
  total_games: number;
  total_local_games: number;
  total_online_games: number;
  total_ai_games: number;
  total_moves: number;
  total_players: number;
  active_online_rooms: number;
  top_players: PlayerStatsDto[];
  cache_ttl_seconds: number;
}

export interface AIMoveDto {
  from_casa: number;
  to_casa: number;
  tactical_intent: string;
  source: "database_learned" | "knowledge_file" | "heuristic";
}

export const gameApi = {
  /**
   * Inicia uma nova sessão de jogo no backend
   */
  async createSession(payload: SessionPayload): Promise<GameSessionDto> {
    const res = await fetch(`${BASE_URL}/api/v1/game/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Falha ao criar sessão: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Registra uma jogada executada no backend
   */
  async recordMove(
    gameId: string,
    step: number,
    player: number,
    fromCasa: number,
    toCasa: number,
    boardBefore?: any,
    boardAfter?: any,
    intent?: string
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/game/${gameId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        step,
        player,
        from_casa: fromCasa,
        to_casa: toCasa,
        board_before: boardBefore,
        board_after: boardAfter,
        tactical_intent: intent,
      }),
    });
    if (!res.ok) {
      console.warn("Falha ao registrar movimento no backend:", await res.text());
    }
    return res.json().catch(() => null);
  },

  /**
   * Conclui a partida e grava as estatísticas globais
   */
  async finishSession(
    gameId: string,
    winnerPlayer: number | null,
    winningLine: string | null,
    durationSeconds: number,
    totalMoves: number,
    boardState?: any
  ): Promise<GameSessionDto> {
    const res = await fetch(`${BASE_URL}/api/v1/game/${gameId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        winner_player: winnerPlayer,
        winning_line: winningLine,
        duration_seconds: durationSeconds,
        total_moves: totalMoves,
        board_state: boardState,
      }),
    });
    if (!res.ok) {
      throw new Error(`Falha ao concluir partida: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Busca status de uma sala online
   */
  async getRoomStatus(roomCode: string): Promise<GameSessionDto> {
    const res = await fetch(`${BASE_URL}/api/v1/game/rooms/${encodeURIComponent(roomCode)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Sala '${roomCode}' não encontrada ou expirada.`);
    }
    return res.json();
  },

  /**
   * Busca estatísticas consolidadas do jogador (cacheadas por 1 minuto no backend)
   */
  async getPlayerStats(playerName: string, refresh: boolean = false): Promise<PlayerStatsDto> {
    const url = `${BASE_URL}/api/v1/game/stats/${encodeURIComponent(playerName)}${refresh ? "?refresh=true" : ""}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(`Falha ao buscar estatísticas: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Busca métricas globais da plataforma (cacheadas por 1 minuto no backend)
   */
  async getGlobalStats(refresh: boolean = false): Promise<GlobalStatsDto> {
    const url = `${BASE_URL}/api/v1/game/stats${refresh ? "?refresh=true" : ""}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(`Falha ao buscar estatísticas globais: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Lista partidas recentes
   */
  async getRecentGames(limit: number = 10): Promise<GameSessionDto[]> {
    const res = await fetch(`${BASE_URL}/api/v1/game/history?limit=${limit}`, { credentials: "include" });
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Solicita a jogada calculada da IA ao backend (com aprendizado por BD + fallback)
   */
  async getAIMove(
    boardState: any,
    player: number = 2,
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<AIMoveDto> {
    const res = await fetch(`${BASE_URL}/api/v1/game/ai-move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        board_state: boardState,
        player,
        difficulty,
      }),
    });
    if (!res.ok) {
      throw new Error(`Falha ao gerar jogada da IA: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Constrói a URL do WebSocket para a sala online
   */
  getWebSocketUrl(roomCode: string, playerName: string, userId?: string | number): string {
    const params = new URLSearchParams({ player_name: playerName });
    if (userId) params.append("user_id", userId.toString());
    return `${WS_BASE_URL}/ws/game/${room_code_clean(roomCode)}?${params.toString()}`;
  },
};

function room_code_clean(code: string): string {
  return encodeURIComponent(code.trim().toUpperCase());
}
