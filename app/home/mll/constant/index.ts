
// ============================================================================
// INTERFACES E TIPAGEM (Type Safety)
// ============================================================================

import { DBStructure } from "@/types/db-structure";









/**
 * Interface para representar uma tabela com posicionamento calculado
 * (Extensão de DBStructure com coordenadas SVG)
 */
export interface PositionedTable extends DBStructure {
    x: number;        // Coordenada X do canto superior esquerdo
    y: number;        // Coordenada Y do canto superior esquerdo
    width: number;    // Largura fixa da caixa (BOX_WIDTH)
    height: number;   // Altura calculada baseada no número de campos
}

/**
 * Interface para representar um relacionamento entre tabelas
 * 
 * @property id - Identificador único do relacionamento (table1.field → table2)
 * @property startX, startY - Ponto inicial (origem da FK)
 * @property endX, endY - Ponto final (tabela referenciada)
 */
export interface Relationship {
    fromTable: string;
    toTable: string;
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

// ============================================================================
// CONSTANTES DE LAYOUT (Design System)
// ============================================================================

/**
 * Configuração do Layout em Grid
 * 
 * O diagrama organiza as tabelas em um grid de múltiplas colunas,
 * distribuindo horizontalmente e estendendo verticalmente conforme necessário.
 * 
 * RAZÕES DE DESIGN:
 * - Evita diagramas excessivamente largos (melhor para rolagem vertical)
 * - Aproveita melhor o espaço horizontal em monitores largos
 * - Proporciona um fluxo de leitura natural (esquerda → direita, cima → baixo)
 */
export const COLUMNS = 3;                    // Número de colunas no grid (ajustável)
export const BOX_WIDTH = 260;                // Largura fixa de cada tabela (px)
export const GAP_X = 150;                    // Espaçamento horizontal entre tabelas (px)
export const GAP_Y = 60;                    // Espaçamento vertical entre tabelas (px)
export const ROW_HEIGHT = 25;               // Altura de cada linha de campo (px)
export const HEADER_HEIGHT = 40;            // Altura do cabeçalho da tabela (px)

/**
 * CORES DO SISTEMA (baseado no Tailwind)
 * 
 * Utilizamos um sistema de cores consistente baseado no Slate do Tailwind
 * para garantir acessibilidade e profissionalismo.
 */
export const COLORS = {
    background: '#f9fafb',           // gray-50 - Fundo do diagrama
    tableBg: '#ffffff',              // white - Fundo das tabelas
    tableBorder: '#cbd5e1',          // slate-300 - Borda das tabelas
    headerBg: '#f1f5f9',             // slate-100 - Fundo do cabeçalho
    headerText: '#334155',           // slate-700 - Texto do cabeçalho
    fieldText: '#475569',            // slate-600 - Texto dos campos
    typeText: '#94a3b8',             // slate-400 - Texto do tipo de dado
    relationLine: '#94a3b8',         // slate-400 - Cor das linhas de relação
    arrowColor: '#94a3b8',           // slate-400 - Cor das setas
} as const;

