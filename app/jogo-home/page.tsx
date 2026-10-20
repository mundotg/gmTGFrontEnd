"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Search,
  Play,
  Users,
  Clock,
  Brain,
  Grid3X3,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  RotateCcw,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export type GameCategory = "all" | "tabuleiro" | "duelo" | "casual";
export type GameStatus = "all" | "available" | "coming_soon";
export type PlayerFilter = "all" | "1" | "2" | "multi";

export interface SystemGame {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "tabuleiro" | "duelo" | "casual";
  categoryLabel: string;
  players: "1" | "2" | "multi";
  playersLabel: string;
  modes: string;
  difficulty: string;
  duration: string;
  status: "available" | "coming_soon";
  badge?: string;
  href?: string;
  accent: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue";
  iconType: "tapatan" | "swords" | "grid" | "layers" | "brain" | "trophy" | "sparkles";
}

const SYSTEM_GAMES: SystemGame[] = [
  {
    id: "tapatan-3x3",
    title: "Tapatan 3x3",
    subtitle: "Alinhe 3 Tático Milenar",
    description: "Duelo tradicional de alinhamento com fase de posicionamento de 3 peças e movimento tático pelas diagonais e centro.",
    category: "tabuleiro",
    categoryLabel: "Tabuleiro & Estratégia",
    players: "multi",
    playersLabel: "1 ou 2 Jogadores",
    modes: "Local • IA • Online",
    difficulty: "Fácil a Difícil",
    duration: "~3 min",
    status: "available",
    badge: "🔥 Mais Jogado",
    href: "/jogo-home/jogo",
    accent: "cyan",
    iconType: "tapatan",
  },
  {
    id: "jogo-da-velha-tatico",
    title: "Jogo da Velha Tático",
    subtitle: "Duelo Rápido 3x3",
    description: "Versão dinâmica e estratégica com controle da casa central, empate resolvido por iniciativa e modos contra IA.",
    category: "duelo",
    categoryLabel: "Duelo & Lógica",
    players: "2",
    playersLabel: "1 ou 2 Jogadores",
    modes: "Local • IA",
    difficulty: "Fácil",
    duration: "~2 min",
    status: "available",
    badge: "⭐ Clássico",
    href: "/jogo-home/jogo",
    accent: "emerald",
    iconType: "grid",
  },
  {
    id: "trilha-milenar",
    title: "Trilha (Nine Men's Morris)",
    subtitle: "Alinhamento e Bloqueio",
    description: "Monte moinhos de 3 pedras para capturar peças do oponente em um tabuleiro com três quadrados concêntricos.",
    category: "tabuleiro",
    categoryLabel: "Tabuleiro & Estratégia",
    players: "2",
    playersLabel: "2 Jogadores",
    modes: "Local • Online",
    difficulty: "Intermediário",
    duration: "~8 min",
    status: "available",
    accent: "amber",
    iconType: "layers",
  },
  {
    id: "conecte-4-neon",
    title: "Conecte 4 Neon",
    subtitle: "Gravidade e Diagonal",
    description: "Alinhe 4 discos na vertical, horizontal ou diagonal antes que o adversário perceba a sua armadilha.",
    category: "duelo",
    categoryLabel: "Duelo & Lógica",
    players: "2",
    playersLabel: "1 ou 2 Jogadores",
    modes: "Local • IA",
    difficulty: "Fácil a Médio",
    duration: "~4 min",
    status: "available",
    badge: "⚡ Dinâmico",
    accent: "purple",
    iconType: "swords",
  },
  {
    id: "damas-taticas",
    title: "Damas Clássicas 8x8",
    subtitle: "Capturas e Promoção",
    description: "Regras clássicas de damas com saltos múltiplos obrigatórios, coroação de damas e análise de lances.",
    category: "tabuleiro",
    categoryLabel: "Tabuleiro & Estratégia",
    players: "2",
    playersLabel: "2 Jogadores",
    modes: "Local • Online",
    difficulty: "Médio",
    duration: "~10 min",
    status: "coming_soon",
    accent: "rose",
    iconType: "tapatan",
  },
  {
    id: "xadrez-relampago",
    title: "Xadrez Relâmpago (Blitz)",
    subtitle: "Duelo de Mestres em 5 Min",
    description: "Partidas ágeis com relógio blitz, rating ELO e detecção automática de lances táticos e xeque-mate.",
    category: "tabuleiro",
    categoryLabel: "Tabuleiro & Estratégia",
    players: "2",
    playersLabel: "2 Jogadores",
    modes: "Online",
    difficulty: "Avançado",
    duration: "~5 min",
    status: "coming_soon",
    accent: "blue",
    iconType: "trophy",
  },
  {
    id: "memoria-neural",
    title: "Memória Neural",
    subtitle: "Padrões e Sequências",
    description: "Encontre os pares de símbolos táticos no menor tempo possível com níveis de complexidade incremental.",
    category: "casual",
    categoryLabel: "Casual & Solo",
    players: "1",
    playersLabel: "Solo (1 Jogador)",
    modes: "Contra o Relógio",
    difficulty: "Adaptável",
    duration: "~3 min",
    status: "available",
    accent: "cyan",
    iconType: "brain",
  },
  {
    id: "sudoku-mestre",
    title: "Sudoku Mestre 9x9",
    subtitle: "Lógica Numérica Pura",
    description: "Preencha a grade 9x9 sem repetir dígitos em linhas, colunas e quadrantes com assistência de dicas heurísticas.",
    category: "casual",
    categoryLabel: "Casual & Solo",
    players: "1",
    playersLabel: "Solo (1 Jogador)",
    modes: "Solo com Cronômetro",
    difficulty: "Médio a Difícil",
    duration: "~7 min",
    status: "available",
    accent: "emerald",
    iconType: "grid",
  },
  {
    id: "batalha-naval",
    title: "Batalha Naval Tática",
    subtitle: "Radar e Coordenadas",
    description: "Posicione seus navios em segredo e deduza os setores inimigos antes que sua frota seja afundada.",
    category: "duelo",
    categoryLabel: "Duelo & Lógica",
    players: "2",
    playersLabel: "2 Jogadores",
    modes: "Online Multiplayer",
    difficulty: "Médio",
    duration: "~6 min",
    status: "coming_soon",
    accent: "blue",
    iconType: "swords",
  },
  {
    id: "reversi-cosmico",
    title: "Reversi / Othello",
    subtitle: "Cerco e Inversão",
    description: "Prenda as peças adversárias entre as suas para invertê-las e conquiste o maior território na etapa final.",
    category: "tabuleiro",
    categoryLabel: "Tabuleiro & Estratégia",
    players: "2",
    playersLabel: "1 ou 2 Jogadores",
    modes: "Local • IA",
    difficulty: "Intermediário",
    duration: "~6 min",
    status: "coming_soon",
    accent: "purple",
    iconType: "layers",
  },
  {
    id: "resta-um",
    title: "Resta Um Geométrico",
    subtitle: "Eliminação Sequencial",
    description: "Salte sobre as peças adjacentes para removê-las até que reste unicamente a peça na casa central.",
    category: "casual",
    categoryLabel: "Casual & Solo",
    players: "1",
    playersLabel: "Solo (1 Jogador)",
    modes: "Puzzle Solo",
    difficulty: "Desafiador",
    duration: "~5 min",
    status: "available",
    accent: "amber",
    iconType: "sparkles",
  },
  {
    id: "quiz-tech",
    title: "Quiz Tech & Lógica",
    subtitle: "Desafio de Conhecimento",
    description: "Responda perguntas rápidas sobre algoritmos, arquitetura de software, dados e segurança cibernética.",
    category: "casual",
    categoryLabel: "Casual & Solo",
    players: "multi",
    playersLabel: "Multiplayer",
    modes: "Online Sala Aberta",
    difficulty: "Adaptável",
    duration: "~4 min",
    status: "coming_soon",
    accent: "rose",
    iconType: "brain",
  },
];

const ITEMS_PER_PAGE = 6;

export default function JogosDoSistemaPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [selectedStatus, setSelectedStatus] = useState<GameStatus>("all");
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtra os jogos com base na busca e nos filtros selecionados
  const filteredGames = useMemo(() => {
    return SYSTEM_GAMES.filter((game) => {
      // 1. Busca textual (título, subtítulo, descrição ou categoria)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesTitle = game.title.toLowerCase().includes(query);
        const matchesSubtitle = game.subtitle.toLowerCase().includes(query);
        const matchesDesc = game.description.toLowerCase().includes(query);
        const matchesCat = game.categoryLabel.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubtitle && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // 2. Filtro de Categoria
      if (selectedCategory !== "all" && game.category !== selectedCategory) {
        return false;
      }

      // 3. Filtro de Status
      if (selectedStatus !== "all" && game.status !== selectedStatus) {
        return false;
      }

      // 4. Filtro de Jogadores
      if (selectedPlayers !== "all") {
        if (selectedPlayers === "1" && game.players !== "1") return false;
        if (selectedPlayers === "2" && game.players !== "2" && game.players !== "multi") return false;
        if (selectedPlayers === "multi" && game.players !== "multi") return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory, selectedStatus, selectedPlayers]);

  // Cálculos de paginação
  const totalPages = Math.max(1, Math.ceil(filteredGames.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGames = filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handlers para redefinir a página ao mudar qualquer filtro
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: GameCategory) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleStatusChange = (st: GameStatus) => {
    setSelectedStatus(st);
    setCurrentPage(1);
  };

  const handlePlayersChange = (pl: PlayerFilter) => {
    setSelectedPlayers(pl);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedPlayers("all");
    setCurrentPage(1);
  };

  // Renderizador de ícones temáticos
  const renderGameIcon = (iconType: SystemGame["iconType"], accent: SystemGame["accent"]) => {
    const colorClasses = {
      cyan: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
      amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
      rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
      purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
      blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    }[accent];

    const iconProps = { className: "h-5 w-5" };

    return (
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${colorClasses}`}>
        {iconType === "tapatan" && <Gamepad2 {...iconProps} />}
        {iconType === "swords" && <Swords {...iconProps} />}
        {iconType === "grid" && <Grid3X3 {...iconProps} />}
        {iconType === "layers" && <Layers {...iconProps} />}
        {iconType === "brain" && <Brain {...iconProps} />}
        {iconType === "trophy" && <Trophy {...iconProps} />}
        {iconType === "sparkles" && <Sparkles {...iconProps} />}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>{t("games_page.centerTitle")}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            {t("games_page.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            {t("games_page.subtitle")}
          </p>
        </div>

        {/* Contador rápido */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{t("games_page.totalGames")}</span>
          <span className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-0.5 font-semibold text-gray-900 dark:text-gray-100 shadow-sm">
            {SYSTEM_GAMES.length}
          </span>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Input do Buscador */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("games_page.searchPlaceholder")}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/60 py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title={t("games_page.clearFilters")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Linha de Filtros (Categorias e Menus) */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-1">
          {/* Categorias (Pills) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-gray-500 dark:text-gray-400">{t("games_page.category")}</span>
            {[
              { id: "all", label: t("games_page.all"), count: SYSTEM_GAMES.length },
              {
                id: "tabuleiro",
                label: t("games_page.catBoard"),
                count: SYSTEM_GAMES.filter((g) => g.category === "tabuleiro").length,
              },
              {
                id: "duelo",
                label: t("games_page.catDuel"),
                count: SYSTEM_GAMES.filter((g) => g.category === "duelo").length,
              },
              {
                id: "casual",
                label: t("games_page.catCasual"),
                count: SYSTEM_GAMES.filter((g) => g.category === "casual").length,
              },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id as GameCategory)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtros Dropdown / Seleção Secundária */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Status */}
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as GameStatus)}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 transition-colors focus:border-blue-500 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">{t("games_page.allStatus")}</option>
              <option value="available">{t("games_page.statusAvailable")}</option>
              <option value="coming_soon">{t("games_page.statusComingSoon")}</option>
            </select>

            {/* Filtro de Jogadores */}
            <select
              value={selectedPlayers}
              onChange={(e) => handlePlayersChange(e.target.value as PlayerFilter)}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 transition-colors focus:border-blue-500 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">{t("games_page.allPlayers")}</option>
              <option value="1">{t("games_page.solo")}</option>
              <option value="2">{t("games_page.twoPlayers")}</option>
              <option value="multi">{t("games_page.multiplayer")}</option>
            </select>

            {/* Botão de Redefinir Filtros */}
            {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all" || selectedPlayers !== "all") && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/50"
                title={t("games_page.clearAll")}
              >
                <RotateCcw className="h-3 w-3" />
                <span>{t("games_page.clearFilters")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informação de Resultados */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          {t("games_page.showingResults")}{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {filteredGames.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredGames.length)}
          </span>{" "}
          {t("games_page.of")}{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredGames.length}</span>{" "}
          {t("games_page.gamesFound")}
        </div>

        {totalPages > 1 && (
          <div className="hidden sm:block">
            {t("games_page.page")}{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{validCurrentPage}</span>{" "}
            {t("games_page.of")}{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Grid de Jogos */}
      {paginatedGames.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paginatedGames.map((game) => {
            const isAvailable = game.status === "available";

            return (
              <div
                key={game.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/30"
              >
                {/* Topo do Card: Ícone e Badges */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    {renderGameIcon(game.iconType, game.accent)}

                    <div className="flex flex-col items-end gap-1.5">
                      {game.badge && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          {game.badge}
                        </span>
                      )}

                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t("games_page.available")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          <Clock className="h-2.5 w-2.5" />
                          {t("games_page.comingSoon")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título e Categoria */}
                  <div className="mt-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {game.categoryLabel}
                    </span>
                    <h3 className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{game.subtitle}</p>
                  </div>

                  {/* Descrição */}
                  <p className="mt-2.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3">
                    {game.description}
                  </p>

                  {/* Metadados / Chips */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      {game.playersLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1">
                      <Brain className="h-3 w-3 text-gray-400" />
                      {game.modes}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {game.duration}
                    </span>
                  </div>
                </div>

                {/* Rodapé do Card: Ação */}
                <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {isAvailable && game.href ? (
                    <Link
                      href={game.href}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{t("games_page.playNow")}</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>{t("games_page.inDevelopment")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio (Nenhum jogo encontrado) */
        <div className="my-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("games_page.noGamesFound")}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            {t("games_page.noGamesSub")}
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t("games_page.clearAll")}</span>
          </button>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-800 pt-6 sm:flex-row">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("games_page.page")}{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{validCurrentPage}</span>{" "}
            {t("games_page.of")}{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botão Anterior */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validCurrentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{t("games_page.prev")}</span>
            </button>

            {/* Botões Numéricos das Páginas */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
              const isSelected = pageNumber === validCurrentPage;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                    isSelected
                      ? "bg-blue-600 text-white border border-blue-600"
                      : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Botão Próximo */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
            >
              <span>{t("games_page.next")}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
