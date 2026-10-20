/**
 * Lógica Central do Jogo de Tabuleiro 3x3 "Alinhe 3 / Tapatan"
 * Engenharia reversa e aprimoramento a partir do francy-dunca/jogo-home.
 * 
 * Regra de Ouro:
 * - Tabuleiro 3x3 com 9 casas (1 a 9).
 * - Cada jogador possui 3 peças.
 * - Posição inicial: Jogador 1 (Azul) nas casas [1, 2, 3]; Jogador 2 (Vermelho) nas casas [7, 8, 9].
 * - Casas [4, 5, 6] iniciam livres.
 * - Os jogadores alternam movimentos para casas adjacentes conectadas por linhas.
 * - A casa central 5 conecta-se a todas as 8 casas.
 * - Vitória: Alinhar 3 peças em linha reta OBRIGATORIAMENTE passando pelo centro (casa 5)!
 *   Combinações vencedoras: [1, 5, 9], [3, 5, 7], [2, 5, 8], [4, 5, 6] (todas com soma = 15).
 */

export type GameMode = "HVC" | "HVH" | "ONLINE" | "TRAIN"; // HVC: Humano vs CPU, HVH: 2 Jogadores local, ONLINE: 2 Jogadores Online, TRAIN: Treino
export type Difficulty = "easy" | "medium" | "hard";

export interface Col {
  id?: string;
  free: boolean;      // true se ocupada por uma peça, false se livre
  player: number;     // 0 = livre, 1 = jogador 1, 2 = jogador 2 / CPU
  casaN: number;      // 1 a 9
  canPlay?: boolean;  // highlight para indicar se pode mover para cá
  namePlayer?: string;
}

export interface PecaObject {
  id: string;
  namePlayer: string;
  cor: string;
  casaN: number;
}

export interface Jogada {
  player: number;
  id: string;
  indexAnt: { row: number; col: number };
  indexNow: { row: number; col: number };
  casaOrigem: number;
  casaDestino: number;
  descricao: string;
  estrategia: string;
  timestamp: string;
}

export interface PlayerStats {
  id: string;
  nome: string;
  color: string;
  pontuacao: number;
  tempoJogado: string;
  avatar?: string;
}

// Coordenadas SVG oficiais das 9 casas no viewBox 0 0 600 400
export const CASAS_CIRCLE = [
  [
    { cx: 0, cy: 0, r: 24, casaN: 1 },
    { cx: 300, cy: 0, r: 24, casaN: 2 },
    { cx: 600, cy: 0, r: 24, casaN: 3 },
  ],
  [
    { cx: 0, cy: 200, r: 24, casaN: 4 },
    { cx: 300, cy: 200, r: 28, casaN: 5 }, // Centro especial
    { cx: 600, cy: 200, r: 24, casaN: 6 },
  ],
  [
    { cx: 0, cy: 400, r: 24, casaN: 7 },
    { cx: 300, cy: 400, r: 24, casaN: 8 },
    { cx: 600, cy: 400, r: 24, casaN: 9 },
  ],
];

// Grafo de adjacência de movimentos permitidos
export const MOVIMENTOS_VALIDOS: Record<number, number[]> = {
  1: [2, 4, 5],
  2: [1, 3, 5],
  3: [2, 5, 6],
  4: [1, 5, 7],
  5: [1, 2, 3, 4, 6, 7, 8, 9], // Centro conecta a todas as casas
  6: [3, 5, 9],
  7: [4, 5, 8],
  8: [5, 7, 9],
  9: [5, 6, 8],
};

// Trincas vencedoras que passam pelo centro 5
export const CONDICOES_DE_VITORIA: [number, number, number][] = [
  [4, 5, 6], // Linha central horizontal
  [2, 5, 8], // Coluna central vertical
  [1, 5, 9], // Diagonal principal
  [3, 5, 7], // Diagonal secundária
];

/**
 * Converte número da casa (1 a 9) para índice [row, col] na matriz 3x3.
 */
export function casaToCoords(casaN: number): { row: number; col: number } {
  return {
    row: Math.floor((casaN - 1) / 3),
    col: (casaN - 1) % 3,
  };
}

/**
 * Converte coordenadas [row, col] para número da casa (1 a 9).
 */
export function coordsToCasa(row: number, col: number): number {
  return row * 3 + col + 1;
}

/**
 * Inicializa a matriz e as peças para um novo jogo.
 */
export function createInitialState(
  namePlayer1: string = "Jogador 1",
  namePlayer2: string = "CPU",
  color1: string = "#00d2ff",
  color2: string = "#ff3b5c"
): {
  matrix: Col[][];
  pecasP1: PecaObject[];
  pecasP2: PecaObject[];
} {
  const pecasP1: PecaObject[] = [
    { id: "p1_1", namePlayer: namePlayer1, cor: color1, casaN: 1 },
    { id: "p1_2", namePlayer: namePlayer1, cor: color1, casaN: 2 },
    { id: "p1_3", namePlayer: namePlayer1, cor: color1, casaN: 3 },
  ];

  const pecasP2: PecaObject[] = [
    { id: "p2_1", namePlayer: namePlayer2, cor: color2, casaN: 7 },
    { id: "p2_2", namePlayer: namePlayer2, cor: color2, casaN: 8 },
    { id: "p2_3", namePlayer: namePlayer2, cor: color2, casaN: 9 },
  ];

  const matrix: Col[][] = [
    [
      { id: "p1_1", free: true, player: 1, casaN: 1, namePlayer: namePlayer1 },
      { id: "p1_2", free: true, player: 1, casaN: 2, namePlayer: namePlayer1 },
      { id: "p1_3", free: true, player: 1, casaN: 3, namePlayer: namePlayer1 },
    ],
    [
      { id: undefined, free: false, player: 0, casaN: 4 },
      { id: undefined, free: false, player: 0, casaN: 5 },
      { id: undefined, free: false, player: 0, casaN: 6 },
    ],
    [
      { id: "p2_1", free: true, player: 2, casaN: 7, namePlayer: namePlayer2 },
      { id: "p2_2", free: true, player: 2, casaN: 8, namePlayer: namePlayer2 },
      { id: "p2_3", free: true, player: 2, casaN: 9, namePlayer: namePlayer2 },
    ],
  ];

  return { matrix, pecasP1, pecasP2 };
}

/**
 * Reconstrói o estado visual da matriz e peças a partir do dicionário de casas retornado pelo servidor.
 */
export function stateFromBoardDict(
  boardDict: Record<number, number>,
  namePlayer1: string = "Jogador 1",
  namePlayer2: string = "Jogador 2",
  color1: string = "#00d2ff",
  color2: string = "#ff3b5c"
): {
  matrix: Col[][];
  pecasP1: PecaObject[];
  pecasP2: PecaObject[];
} {
  const matrix: Col[][] = [];
  const pecasP1: PecaObject[] = [];
  const pecasP2: PecaObject[] = [];
  let p1Count = 1;
  let p2Count = 1;

  for (let row = 0; row < 3; row++) {
    const rowCols: Col[] = [];
    for (let col = 0; col < 3; col++) {
      const casaN = coordsToCasa(row, col);
      const player = Number(boardDict[casaN] ?? 0);

      if (player === 1) {
        const id = `p1_${p1Count++}`;
        pecasP1.push({ id, namePlayer: namePlayer1, cor: color1, casaN });
        rowCols.push({ id, free: true, player: 1, casaN, namePlayer: namePlayer1 });
      } else if (player === 2) {
        const id = `p2_${p2Count++}`;
        pecasP2.push({ id, namePlayer: namePlayer2, cor: color2, casaN });
        rowCols.push({ id, free: true, player: 2, casaN, namePlayer: namePlayer2 });
      } else {
        rowCols.push({ id: undefined, free: false, player: 0, casaN });
      }
    }
    matrix.push(rowCols);
  }

  return { matrix, pecasP1, pecasP2 };
}

/**
 * Converte a matriz de 3x3 no dicionário numérico { [casaN]: player } para o backend.
 */
export function matrixToBoardDict(matrix: Col[][]): Record<number, number> {
  const dict: Record<number, number> = {};
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = matrix[row]?.[col];
      const casaN = coordsToCasa(row, col);
      dict[casaN] = cell?.player || 0;
    }
  }
  return dict;
}

/**
 * Verifica se um jogador venceu.
 * Regra: Alinhar 3 peças passando obrigatoriamente pela casa 5 (centro).
 */
export function checkWinner(pecas: PecaObject[]): boolean {
  if (!Array.isArray(pecas) || pecas.length < 3) return false;
  const hasCenter = pecas.some((p) => p.casaN === 5);
  if (!hasCenter) return false;

  const sum = pecas.reduce((acc, p) => acc + (p.casaN || 0), 0);
  // As 4 linhas que passam por 5: 1+5+9=15, 3+5+7=15, 2+5+8=15, 4+5+6=15
  return sum === 15;
}

/**
 * Retorna as casas destino válidas (vizinhas e desocupadas) para uma peça.
 */
export function getValidMovesForPiece(casaOrigem: number, matrix: Col[][]): number[] {
  const vizinhas = MOVIMENTOS_VALIDOS[casaOrigem] || [];
  return vizinhas.filter((casaDestino) => {
    const { row, col } = casaToCoords(casaDestino);
    const cell = matrix[row]?.[col];
    return cell && !cell.free; // livre significa sem peça
  });
}

/**
 * Determina o rótulo tático de um movimento para enriquecer o histórico.
 */
export function determineTacticalIntent(
  casaDestino: number,
  jogador: number,
  matrix: Col[][]
): string {
  if (casaDestino === 5) {
    return "Controle estratégico da casa central";
  }

  // Verifica se cria ameaça de vitória
  for (const [p1, p2, p3] of CONDICOES_DE_VITORIA) {
    const coords = [casaToCoords(p1), casaToCoords(p2), casaToCoords(p3)];
    const playersInLine = coords.map((c) => matrix[c.row][c.col].player);
    const countMine = playersInLine.filter((p) => p === jogador).length;
    if (countMine === 2 && [p1, p2, p3].includes(casaDestino)) {
      return "Criação de ameaça de alinhamento vencedor";
    }
  }

  return "Posicionamento tático de flanco";
}

// -------------------------------------------------------------
// 🧠 MOTOR DE INTELIGÊNCIA ARTIFICIAL (CPU)
// -------------------------------------------------------------

function verificaPossibilidade(
  p1: number,
  p2: number,
  p3: number,
  matrix: Col[][],
  alvoPlayer: number
): number | null {
  const c1 = casaToCoords(p1);
  const c2 = casaToCoords(p2);
  const c3 = casaToCoords(p3);

  const cell1 = matrix[c1.row][c1.col];
  const cell2 = matrix[c2.row][c2.col];
  const cell3 = matrix[c3.row][c3.col];

  // 2 ocupadas pelo jogador alvo e 1 vazia
  if (cell1.player === alvoPlayer && cell2.player === alvoPlayer && !cell3.free) return p3;
  if (cell1.player === alvoPlayer && cell3.player === alvoPlayer && !cell2.free) return p2;
  if (cell2.player === alvoPlayer && cell3.player === alvoPlayer && !cell1.free) return p1;
  return null;
}

/**
 * Calcula o melhor movimento para a CPU considerando a dificuldade.
 */
export function computeBestMove(
  matrix: Col[][],
  cpuPlayer: number = 2,
  difficulty: Difficulty = "medium"
): { pecaId: string; casaOrigem: number; casaDestino: number } | null {
  const opponent = cpuPlayer === 1 ? 2 : 1;

  // Lista de todas as peças da CPU que podem se mover
  const pecasMoveis: { peca: Col; destinos: number[] }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = matrix[r][c];
      if (cell.player === cpuPlayer && cell.id) {
        const destinos = getValidMovesForPiece(cell.casaN, matrix);
        if (destinos.length > 0) {
          pecasMoveis.push({ peca: cell, destinos });
        }
      }
    }
  }

  if (pecasMoveis.length === 0) return null;

  // No modo fácil, introduz 40% de aleatoriedade
  if (difficulty === "easy" && Math.random() < 0.4) {
    const randomPick = pecasMoveis[Math.floor(Math.random() * pecasMoveis.length)];
    const randomDest = randomPick.destinos[Math.floor(Math.random() * randomPick.destinos.length)];
    return {
      pecaId: randomPick.peca.id!,
      casaOrigem: randomPick.peca.casaN,
      casaDestino: randomDest,
    };
  }

  // 1. Prioridade Máxima: Ganhar o jogo imediatamente
  for (const [p1, p2, p3] of CONDICOES_DE_VITORIA) {
    const destinoVitoria = verificaPossibilidade(p1, p2, p3, matrix, cpuPlayer);
    if (destinoVitoria) {
      // Encontra peça da CPU que consiga alcançar este destino
      for (const item of pecasMoveis) {
        if (item.destinos.includes(destinoVitoria)) {
          return {
            pecaId: item.peca.id!,
            casaOrigem: item.peca.casaN,
            casaDestino: destinoVitoria,
          };
        }
      }
    }
  }

  // 2. Prioridade 2: Bloquear vitória iminente do oponente
  for (const [p1, p2, p3] of CONDICOES_DE_VITORIA) {
    const destinoBloqueio = verificaPossibilidade(p1, p2, p3, matrix, opponent);
    if (destinoBloqueio) {
      for (const item of pecasMoveis) {
        if (item.destinos.includes(destinoBloqueio)) {
          return {
            pecaId: item.peca.id!,
            casaOrigem: item.peca.casaN,
            casaDestino: destinoBloqueio,
          };
        }
      }
    }
  }

  // 3. Prioridade 3: Ocupar a casa central (5) se estiver vazia
  const centerCoords = casaToCoords(5);
  if (!matrix[centerCoords.row][centerCoords.col].free) {
    for (const item of pecasMoveis) {
      if (item.destinos.includes(5)) {
        return {
          pecaId: item.peca.id!,
          casaOrigem: item.peca.casaN,
          casaDestino: 5,
        };
      }
    }
  }

  // 4. Prioridade 4: Alinhar com a casa central
  for (const [p1, p2, p3] of CONDICOES_DE_VITORIA) {
    const alinhamento = verificaPossibilidade(p1, p2, p3, matrix, cpuPlayer);
    if (alinhamento) {
      for (const item of pecasMoveis) {
        if (item.destinos.includes(alinhamento)) {
          return {
            pecaId: item.peca.id!,
            casaOrigem: item.peca.casaN,
            casaDestino: alinhamento,
          };
        }
      }
    }
  }

  // 5. Fallback: Melhor movimento disponível
  const itemEscolhido = pecasMoveis[0];
  return {
    pecaId: itemEscolhido.peca.id!,
    casaOrigem: itemEscolhido.peca.casaN,
    casaDestino: itemEscolhido.destinos[0],
  };
}

// -------------------------------------------------------------
// 🔊 SINTETIZADOR DE ÁUDIO NATIVO (Zero Dependências Externas)
// -------------------------------------------------------------

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.6;

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playMove() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {
      // Ignora erro de áudio
    }
  }

  playSelect() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);

      gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {}
  }

  playWin() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const startTime = this.ctx!.currentTime + idx * 0.12;

        gain.gain.setValueAtTime(this.volume * 0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {}
  }

  playDefeat() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        const startTime = this.ctx!.currentTime + idx * 0.15;

        gain.gain.setValueAtTime(this.volume * 0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  }

  setMuted(muted: boolean) {
    this.enabled = !muted;
  }
}

export const soundManager = new SoundSynthesizer();
export const soundSynthesizer = soundManager;
