'use client';

/**
 * ========================================================================
 * MÓDULO: MLLPanel - Visualizador de Schema de Banco de Dados
 * ========================================================================
 * 
 * PROPÓSITO:
 *   Este componente renderiza um diagrama entidade-relacionamento (DER)
 *   interativo em SVG, mostrando tabelas, colunas e relacionamentos
 *   de chave estrangeira de uma base de dados PostgreSQL.
 * 
 * ARQUITETURA:
 *   - Algoritmo de layout "grid columnar" (distribuição em colunas)
 *   - Renderização 100% nativa SVG (sem bibliotecas externas)
 *   - Suporte a exportação SVG e PNG
 * 
 * APRENDIZADOS PRINCIPAIS:
 *   1. Como calcular posicionamento dinâmico de elementos
 *   2. Algoritmos de Bezier para curvas suaves
 *   3. Conversão SVG → Canvas → PNG (exportação)
 *   4. Paradigma useMemo para otimização de layout
 *   5. Tratamento de dados aninhados (tabelas → campos → FKs)
 * 
 * AUTOR: Equipe de Desenvolvimento
 * DATA: 2026-05-03
 * VERSÃO: 2.0.0
 * ========================================================================
 */

// ============================================================================
// IMPORTAÇÕES E DEPENDÊNCIAS
// ============================================================================

import { useSession } from '@/context/SessionContext';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ============================================================================
// INTERFACES E TIPAGEM (Type Safety)
// ============================================================================

/**
 * Interface para um campo/coluna da tabela
 * 
 * @property name - Nome da coluna (ex: "user_id", "created_at")
 * @property type - Tipo de dados PostgreSQL (ex: "INTEGER", "VARCHAR(255)")
 * @property enum_values - Valores possíveis se for ENUM (ex: "active,inactive,pending")
 * @property is_primary_key - Indica se faz parte da chave primária
 * @property is_foreign_key - Indica se é chave estrangeira
 * @property referenced_table - Tabela referenciada (quando FK)
 */
interface DBField {
    name: string;
    type: string;
    enum_values: string;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
    referenced_table?: string;
}

/**
 * Interface para uma tabela/estrutura do banco de dados
 * 
 * @property table_name - Nome da tabela no banco
 * @property schema_name - Schema PostgreSQL (public, information_schema)
 * @property fields - Array de colunas da tabela
 */
interface DBStructure {
    table_name: string;
    schema_name: string;
    fields: DBField[];
}

/**
 * Interface para uma conexão com banco de dados
 * 
 * @property id - Identificador único da conexão
 * @property name - Nome amigável da conexão (ex: "Prod DB", "Staging")
 * @property structures - Todas as tabelas do banco
 */
interface DBConnection {
    id: number;
    name: string;
    structures: DBStructure[];
}

/**
 * Interface para representar uma tabela com posicionamento calculado
 * (Extensão de DBStructure com coordenadas SVG)
 */
interface PositionedTable extends DBStructure {
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
interface Relationship {
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
const COLUMNS = 3;                    // Número de colunas no grid (ajustável)
const BOX_WIDTH = 260;                // Largura fixa de cada tabela (px)
const GAP_X = 150;                    // Espaçamento horizontal entre tabelas (px)
const GAP_Y = 60;                    // Espaçamento vertical entre tabelas (px)
const ROW_HEIGHT = 25;               // Altura de cada linha de campo (px)
const HEADER_HEIGHT = 40;            // Altura do cabeçalho da tabela (px)

/**
 * CORES DO SISTEMA (baseado no Tailwind)
 * 
 * Utilizamos um sistema de cores consistente baseado no Slate do Tailwind
 * para garantir acessibilidade e profissionalismo.
 */
const COLORS = {
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function MLLPanel() {
    // ========================================================================
    // HOOKS E ESTADOS
    // ========================================================================

    /**
     * Contexto de sessão do usuário (fornecido pelo provedor da aplicação)
     * - user: Dados do usuário autenticado
     * - api: Instância do cliente axios com interceptors para autenticação
     */
    const { user, api } = useSession();

    /**
     * Estados do componente
     * 
     * DECISÃO: Utilizamos três estados separados (loading, error, data) em vez
     * de um único estado com união de tipos ({ status, data, error }) para
     * simplificar a renderização condicional no JSX.
     */
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DBConnection | null>(null);

    /**
     * Referência para o elemento SVG
     * 
     * Necessário para:
     * 1. Serializar o SVG para exportação (SVG → string → Blob)
     * 2. Converter SVG para Canvas (para export PNG)
     */
    const svgRef = useRef<SVGSVGElement>(null);

    // ========================================================================
    // FUNÇÕES DE CARREGAMENTO DE DADOS
    // ========================================================================

    /**
     * Efeito para carregar dados quando a conexão do usuário mudar
     * 
     * DEPENDÊNCIAS:
     * - user?.info_extra?.id_connection: ID da conexão ativa do usuário
     * 
     * RAZÃO: Carregamos apenas quando existe uma conexão selecionada
     */
    useEffect(() => {
        // Verificação de segurança: só carrega se o usuário tiver uma conexão
        if (user?.info_extra?.id_connection) {
            fetchData();
        } else {
            // Se não houver conexão, não carregamos (o usuário precisa selecionar)
            setLoading(false);
            setError('Nenhuma conexão de banco de dados selecionada');
        }
    }, [user?.info_extra?.id_connection]); // Só recarrega quando a conexão mudar

    /**
     * Busca os dados do banco de dados via API
     * 
     * FLUXO:
     * 1. Ativa estado de loading
     * 2. Faz requisição GET para endpoint
     * 3. Atualiza estado com dados ou erro
     * 4. Desativa loading (finally garante execução em ambos os casos)
     * 
     * TRATAMENTO DE ERROS:
     * - Captura exceções da rede/API
     * - Extrai mensagem de erro de forma segura
     * - Atualiza estado de erro para feedback ao usuário
     */
    const fetchData = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null); // Limpa erro anterior (boa prática)

            // NOTA: Em produção, substituir pela chamada real
            const response = await api.get<DBConnection>(
                `/conn/db_full/${user?.info_extra?.id_connection}`
            );

            setData(response.data);
        } catch (err) {
            // Tratamento robusto de erro - extrai mensagem independente do tipo
            const errorMessage = err instanceof Error
                ? err.message
                : err && typeof err === 'object' && 'message' in err
                    ? String(err.message)
                    : 'Erro desconhecido ao carregar dados do banco';

            setError(errorMessage);
            console.error('Erro ao carregar esquema:', err); // Log para debugging
        } finally {
            setLoading(false); // Sempre desativa loading, mesmo em erro
        }
    };

    // ========================================================================
    // ALGORITMO DE LAYOUT (Núcleo do Componente)
    // ========================================================================

    /**
     * Algoritmo de Posicionamento Geométrico
     * 
     * Este é o coração do componente. Calcula onde cada tabela e relação
     * deve ser posicionada no SVG.
     * 
     * POR QUE useMemo?
     * - O layout só precisa ser recalculado quando os dados mudam
     * - Evita cálculos custosos em cada renderização
     * - Mantém performance mesmo com centenas de tabelas
     * 
     * COMPLEXIDADE: O(n) onde n = número de tabelas
     * 
     * ALGORITMO:
     * 1. Filtro → Remove tabelas de sistema (information_schema, _pg_*)
     * 2. Posicionamento → Distribui em colunas, calcula Y acumulativo
     * 3. Relacionamentos → Mapeia FKs, calcula pontos de conexão
     * 4. Dimensões → Calcula tamanho total do SVG
     */
    const { tables, relationships, svgWidth, svgHeight } = useMemo(() => {
        // ================================================================
        // PASSO 1: Validação e Filtragem
        // ================================================================

        // Verifica se há dados para processar
        if (!data?.structures || data.structures.length === 0) {
            return {
                tables: [],
                relationships: [],
                svgWidth: 0,
                svgHeight: 0
            };
        }

        /**
         * Filtro de tabelas de sistema do PostgreSQL
         * 
         * RAZÃO: O information_schema e tabelas _pg_ são internas do PostgreSQL
         * e não devem aparecer no diagrama de negócio.
         * 
         * EXEMPLOS DE TABELAS FILTRADAS:
         * - information_schema.tables
         * - information_schema.columns
         * - _pg_foreign_tables
         * - _pg_foreign_data_wrappers
         */
        const validStructures = data.structures.filter(
            table => table.schema_name !== 'information_schema'
                && !table.table_name.startsWith('_pg_')
        );

        // ================================================================
        // PASSO 2: Cálculo de Posições das Tabelas
        // ================================================================

        /**
         * Array para armazenar tabelas com suas coordenadas calculadas
         */
        const positionedTables: PositionedTable[] = [];

        /**
         * Controlador de altura por coluna
         * 
         * IMPORTANTE: Este array mantém o Y atual para cada coluna do grid.
         * Quando uma tabela é posicionada na coluna k, incrementamos seu Y
         * (mais GAP_Y) para a próxima tabela na mesma coluna.
         * 
         * EXEMPLO VISUAL:
         * Coluna 0: Tabela1 (Y=50) → após: yOffsets[0] = 50 + altura1 + 60
         * Coluna 0: Tabela4 (Y=120) → após: yOffsets[0] = 120 + altura4 + 60
         */
        const yOffsets = new Array(COLUMNS).fill(50); // Margem superior inicial

        /**
         * Variável para rastrear a altura máxima do diagrama
         * (última coluna que termina mais abaixo)
         */
        let maxColumnHeight = 0;

        /**
         * Loop principal de posicionamento
         * 
         * ALGORITMO DE DISTRIBUIÇÃO:
         * index % COLUMNS alterna entre colunas (0,1,2,0,1,2,...)
         * Isso garante distribuição uniforme sem colunas "cheias" e outras "vazias"
         */
        validStructures.forEach((table, index) => {
            // Determina a coluna (0-based) usando módulo
            const column = index % COLUMNS;

            // Calcula X: Margem esquerda (50) + (coluna * (largura + gap))
            const x = 50 + column * (BOX_WIDTH + GAP_X);

            // Obtém Y atual desta coluna (será incrementado depois)
            const y = yOffsets[column];

            /**
             * Calcula a altura total da tabela baseada no número de campos
             * 
             * FÓRMULA: Cabeçalho + (num_campos * altura_linha) + padding_inferior(10)
             * 
             * RAZÃO: Altura dinâmica evita espaço desperdiçado e permite
             * que tabelas com muitos campos ocupem mais espaço vertical.
             */
            const height = HEADER_HEIGHT
                + (table.fields?.length || 0) * ROW_HEIGHT
                + 10; // Padding inferior

            // Armazena tabela com coordenadas calculadas
            positionedTables.push({
                ...table,
                x,
                y,
                width: BOX_WIDTH,
                height
            });

            // Atualiza o offset Y para a próxima tabela na mesma coluna
            yOffsets[column] += height + GAP_Y;

            // Atualiza a altura máxima do diagrama (para definir tamanho do SVG)
            if (yOffsets[column] > maxColumnHeight) {
                maxColumnHeight = yOffsets[column];
            }
        });

        // ================================================================
        // PASSO 3: Cálculo de Relacionamentos (Foreign Keys)
        // ================================================================

        /**
         * Array para armazenar todas as relações entre tabelas
         */
        const relationshipsList: Relationship[] = [];

        /**
         * Mapeamento de nome da tabela → tabela posicionada
         * 
         * OTIMIZAÇÃO: O(m) para acesso O(1) em vez de O(n) com .find()
         * Crucial para performance com muitas tabelas e FKs.
         */
        const tableMap = new Map<string, PositionedTable>();
        positionedTables.forEach(table => {
            tableMap.set(table.table_name, table);
        });

        /**
         * Algoritmo de Mapeamento de Foreign Keys
         * 
         * 1. Para cada tabela fonte (Fonte)
         * 2. Para cada campo nesta tabela
         * 3. Se campo é FK e referência uma tabela existente
         * 4. Calcula coordenadas para linha curva (Bezier)
         * 
         * PONTO DE ORIGEM (FK):
         * - X: Lado esquerdo da tabela origem (sourceTable.x)
         * - Y: Altura do cabeçalho + (índice da coluna FK * altura_linha) + (meia_linha)
         * 
         * PONTO DE DESTINO:
         * - X: Lado direito da tabela destino (targetTable.x + largura)
         * - Y: Meio do cabeçalho da tabela destino (targetTable.y + HEADER_HEIGHT/2)
         * 
         * POR QUE PONTO DE DESTINO NO LADO DIREITO?
         * - Visualmente, indica que a tabela destino está "recebendo" a referência
         * - Evita linhas cruzando muitas tabelas
         * - Cria fluxo visual: FK no lado esquerdo → entra no lado direito da referência
         */
        positionedTables.forEach(sourceTable => {
            if (!sourceTable.fields) return;

            sourceTable.fields.forEach((field, fieldIndex) => {
                // Verifica se é chave estrangeira E tem tabela referenciada
                if (field.is_foreign_key && field.referenced_table) {
                    // Busca a tabela destino no mapa (O(1) lookup)
                    const targetTable = tableMap.get(field.referenced_table);

                    if (targetTable) {
                        /**
                         * Calcula Y do ponto de origem
                         * 
                         * HEADER_HEIGHT: pula o cabeçalho
                         * fieldIndex * ROW_HEIGHT: posição exata da linha da FK
                         * ROW_HEIGHT / 2: centraliza verticalmente na linha
                         */
                        const startY = sourceTable.y
                            + HEADER_HEIGHT
                            + (fieldIndex * ROW_HEIGHT)
                            + (ROW_HEIGHT / 2);

                        /**
                         * Calcula Y do ponto de destino
                         * 
                         * targetTable.y + HEADER_HEIGHT/2: centraliza no cabeçalho
                         * Visualmente elegante (linhas partem das colunas para o header)
                         */
                        const endY = targetTable.y + (HEADER_HEIGHT / 2);

                        // Adiciona relação ao array
                        relationshipsList.push({
                            id: `${sourceTable.table_name}-${field.name}-${targetTable.table_name}`,
                            startX: sourceTable.x,                    // Lado esquerdo da tabela
                            startY: startY,                            // Linha da FK
                            endX: targetTable.x + BOX_WIDTH,           // Lado direito da tabela
                            endY: endY,                                // Meio do cabeçalho
                        });
                    } else {
                        // Log para debugging (relação quebrada - tabela destino não encontrada)
                        console.warn(`FK referência tabela inexistente: ${field.referenced_table} referenciado por ${sourceTable.table_name}.${field.name}`);
                    }
                }
            });
        });

        // ================================================================
        // PASSO 4: Cálculo das Dimensões Totais do SVG
        // ================================================================

        /**
         * LARGURA TOTAL:
         * Margem esquerda (50) + (num_colunas * (largura + gap)) - gap + margem direita (50)
         * 
         * Exemplo com 3 colunas:
         * 50 + [col0(260+150) + col1(260+150) + col2(260+150)] - 150 + 50
         * 50 + (410*3) - 150 + 50 = 50 + 1230 - 150 + 50 = 1180px
         */
        const totalWidth = 50 + COLUMNS * (BOX_WIDTH + GAP_X) - GAP_X + 50;

        /**
         * ALTURA TOTAL:
         * Altura máxima da coluna (onde termina a última tabela) + margem inferior (50)
         */
        const totalHeight = maxColumnHeight + 50;

        // Retorna todos os dados calculados
        return {
            tables: positionedTables,
            relationships: relationshipsList,
            svgWidth: totalWidth,
            svgHeight: totalHeight
        };

    }, [data]); // Dependência: recalculado quando data muda

    // ========================================================================
    // FUNÇÕES DE EXPORTAÇÃO (Download)
    // ========================================================================

    /**
     * Exporta o diagrama como arquivo SVG
     * 
     * PROCESSO:
     * 1. Serializa o elemento SVG para string XML
     * 2. Cria Blob com tipo MIME correto
     * 3. Gera URL temporária
     * 4. Cria link invisível e dispara download
     * 5. Limpa URL (libera memória)
     * 
     * BOA PRÁTICA: URL.revokeObjectURL previne memory leaks
     */
    const downloadSVG = useCallback((): void => {
        // Validação defensiva
        if (!svgRef.current) {
            console.error('Referência SVG não disponível');
            return;
        }

        try {
            // Serializa SVG para string XML
            const svgData = new XMLSerializer().serializeToString(svgRef.current);

            // Cria Blob - utf-8 charset garante caracteres especiais
            const blob = new Blob([svgData], {
                type: 'image/svg+xml;charset=utf-8'
            });

            // Cria URL para o Blob
            const url = URL.createObjectURL(blob);

            // Cria link de download
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagrama-${data?.name || 'database'}.svg`;

            // Erro no download? Adiciona ao DOM temporariamente e remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpa URL para liberar memória
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erro ao exportar SVG:', err);
            alert('Não foi possível exportar o SVG. Verifique o console para detalhes.');
        }
    }, [data?.name]);

    /**
     * Exporta o diagrama como arquivo PNG
     * 
     * CONVERSÃO SVG → PNG:
     * 1. SVG → String → Blob → URL (passo 1)
     * 2. Carrega SVG em elemento <img>
     * 3. Desenha SVG em <canvas> (with white background)
     * 4. <canvas>.toDataURL() gera PNG base64
     * 5. Dispara download
     * 
     * DESAFIO TÉCNICO: SVG pode ter fundo transparente
     * SOLUÇÃO: Preencher canvas com fundo branco antes de desenhar
     */
    const downloadPNG = useCallback((): void => {
        if (!svgRef.current) {
            console.error('Referência SVG não disponível');
            return;
        }

        try {
            // Serializa SVG para string
            const svgData = new XMLSerializer().serializeToString(svgRef.current);

            // Cria Blob e URL do SVG
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Cria elemento imagem para carregar o SVG
            const img = new Image();

            // Configurações do canvas
            const canvas = document.createElement('canvas');
            canvas.width = svgWidth;
            canvas.height = svgHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Não foi possível obter contexto 2D do canvas');
            }

            /**
             * Evento onload: disparado quando a imagem SVG é carregada
             * 
             * IMPORTANTE: O download só ocorre DENTRO do onload
             * Garantia: SVG está completamente renderizado antes de desenhar
             */
            img.onload = () => {
                try {
                    // Preenche fundo com cor sólida (evita transparência)
                    ctx.fillStyle = COLORS.background;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Desenha SVG no canvas
                    ctx.drawImage(img, 0, 0);

                    // Converte canvas para PNG e dispara download
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `diagrama-${data?.name || 'database'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Limpa URL após uso
                    URL.revokeObjectURL(url);
                } catch (canvasErr) {
                    console.error('Erro ao converter canvas para PNG:', canvasErr);
                    alert('Erro ao gerar PNG');
                }
            };

            /**
             * Tratamento de erro no carregamento da imagem
             * Exemplo: conteúdo SVG inválido ou corrompido
             */
            img.onerror = () => {
                URL.revokeObjectURL(url);
                throw new Error('Falha ao carregar imagem SVG para conversão PNG');
            };

            // Inicia carregamento da imagem
            img.src = url;

        } catch (err) {
            console.error('Erro na exportação PNG:', err);
            alert('Não foi possível exportar PNG. Verifique o console.');
        }
    }, [data?.name, svgWidth, svgHeight]);

    /**
     * Recalcula dimensões para acionar reflow (se necessário)
     * 
     * UTILIDADE: Força recálculo de layout após mudanças dinâmicas
     * Exemplo: após adicionar/remover tabelas com animações
     */
    const handleRecalcularLayout = useCallback((): void => {
        // Este efeito força o componente a reexecutar useMemo
        // Simplesmente acionamos um re-render
        setData(prev => prev ? { ...prev } : prev);
    }, []);

    // ========================================================================
    // RENDERIZAÇÃO CONDICIONAL (UI)
    // ========================================================================

    /**
     * Estado de Carregamento
     * 
     * UI: Indicador visual de progresso
     * Acessibilidade: role="status" para leitores de tela
     */
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500" role="status">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                    <p>Carregando esquema do banco de dados...</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Processando {data?.structures?.length || '...'} tabelas
                    </p>
                </div>
            </div>
        );
    }

    /**
     * Estado de Erro
     * 
     * UI: Mensagem clara + botão de tentar novamente
     * DICA: Fornecer ação de recuperação é boa prática de UX
     */
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="text-center text-red-600 max-w-md">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Diagrama</h3>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                                 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Estado Vazio (Sem dados)
     * 
     * Caso: Conexão válida mas sem tabelas (banco vazio)
     */
    if (!data || !data.structures || data.structures.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <p className="text-lg">Nenhuma tabela encontrada</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Conectado a {data?.name || 'database'}, mas não há tabelas para exibir
                    </p>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER PRINCIPAL (UI com Diagrama)
    // ========================================================================

    return (
        <div className="flex flex-col gap-6 p-6 w-full min-h-screen bg-gray-50">
            {/* ================================================================ */}
            {/* HEADER: Título e Botões de Ação */}
            {/* ================================================================ */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                {/* Informações da Conexão */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Visualizador de Schema DB
                    </h1>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                        <span>Conexão: <strong>{data.name}</strong></span>
                        <span>Tabelas: <strong>{data.structures.length}</strong></span>
                        {getRelacionamentosCount(relationships) > 0 && (
                            <span>Relações: <strong>{getRelacionamentosCount(relationships)}</strong></span>
                        )}
                    </div>
                </div>

                {/* Ações da Barra de Ferramentas */}
                <div className="flex gap-3">
                    <button
                        onClick={downloadSVG}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 
                                 hover:bg-blue-100 rounded-md transition-colors
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Exportar como SVG"
                    >
                        📄 Exportar SVG
                    </button>
                    <button
                        onClick={downloadPNG}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                                 hover:bg-blue-700 rounded-md transition-colors
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Exportar como PNG"
                    >
                        🖼️ Exportar PNG
                    </button>
                </div>
            </div>

            {/* ================================================================ */}
            {/* DIAGRAMA: Área de Visualização SVG */}
            {/* ================================================================ */}
            <div className="flex-1 overflow-auto bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
                <svg
                    ref={svgRef}
                    width={svgWidth}
                    height={svgHeight}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        backgroundColor: COLORS.background,
                        minWidth: '100%',
                        minHeight: '100%',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    {/* -------------------------------------------------------- */}
                    {/* DEFINIÇÕES (Setas, Gradientes, Filtros) */}
                    {/* -------------------------------------------------------- */}
                    <defs>
                        {/* Seta para ponta de relacionamento */}
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.arrowColor} />
                        </marker>

                        {/* Sombra suave para tabelas (efeito 3D) */}
                        <filter id="tableShadow" x="-5%" y="-5%" width="110%" height="110%">
                            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1" />
                        </filter>

                        {/* Gradiente para cabeçalho de tabela */}
                        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="100%" stopColor="#f1f5f9" />
                        </linearGradient>
                    </defs>

                    {/* -------------------------------------------------------- */}
                    {/* CAMADA 1: RELACIONAMENTOS (Linhas e Curvas) */}
                    {/* -------------------------------------------------------- */}
                    <g id="relationships-layer" aria-label="Relacionamentos entre tabelas">
                        {relationships.map(rel => {
                            /**
                             * Cálculo do Ponto de Controle da Curva Bezier Quadrática
                             * 
                             * FÓRMULA: C(x, startY) onde x = ponto médio entre startX e endX
                             * Isso cria uma curva suave que se inclina para fora
                             * 
                             * ALTERNATIVA: Linha reta (startX,startY) → (endX,endY)
                             * DECISÃO: Bezier fica mais profissional e evita sobreposições
                             */
                            const controlX = (rel.startX + rel.endX) / 2;

                            // Constroi path: Move to → Curve to
                            const pathData = `M ${rel.startX} ${rel.startY} 
                                            C ${controlX} ${rel.startY}, 
                                              ${controlX} ${rel.endY}, 
                                              ${rel.endX} ${rel.endY}`;

                            return (
                                <path
                                    key={rel.id}
                                    d={pathData}
                                    fill="none"
                                    stroke={COLORS.relationLine}
                                    strokeWidth="2"
                                    strokeDasharray="none"
                                    markerEnd="url(#arrowhead)"
                                    className="transition-stroke duration-200 hover:stroke-blue-400"
                                    aria-label={`Relacionamento: FK para ${rel.id.split('-')[2]}`}
                                />
                            );
                        })}
                    </g>

                    {/* -------------------------------------------------------- */}
                    {/* CAMADA 2: TABELAS (Retângulos + Texto) */}
                    {/* -------------------------------------------------------- */}
                    <g id="tables-layer" aria-label="Tabelas do banco de dados">
                        {tables.map(table => (
                            <g
                                key={table.table_name}
                                transform={`translate(${table.x}, ${table.y})`}
                                className="transition-transform duration-200 hover:scale-105"
                                style={{ transformOrigin: `${table.width / 2}px ${table.height / 2}px` }}
                            >
                                {/* Corpo da Tabela (Fundo) */}
                                <rect
                                    width={table.width}
                                    height={table.height}
                                    fill={COLORS.tableBg}
                                    stroke={COLORS.tableBorder}
                                    strokeWidth="1"
                                    rx="6"
                                    filter="url(#tableShadow)"
                                />

                                {/* Cabeçalho da Tabela */}
                                <rect
                                    width={table.width}
                                    height={HEADER_HEIGHT}
                                    fill="url(#headerGradient)" // Gradiente profissional
                                    stroke={COLORS.tableBorder}
                                    strokeWidth="1"
                                    rx="6"
                                />

                                {/* 
                                    Remove o arredondamento inferior do cabeçalho
                                    para fazer transição suave para o corpo
                                */}
                                <rect
                                    y={HEADER_HEIGHT - 6}
                                    width={table.width}
                                    height="6"
                                    fill="url(#headerGradient)"
                                />

                                {/* Linha divisória entre cabeçalho e corpo */}
                                <line
                                    x1="0"
                                    y1={HEADER_HEIGHT}
                                    x2={table.width}
                                    y2={HEADER_HEIGHT}
                                    stroke={COLORS.tableBorder}
                                    strokeWidth="1.5"
                                />

                                {/* Título da Tabela (Nome) */}
                                <text
                                    x="12"
                                    y={HEADER_HEIGHT / 2 + 5}
                                    fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
                                    fontSize="14"
                                    fontWeight="bold"
                                    fill={COLORS.headerText}
                                    aria-label={`Tabela: ${table.table_name}`}
                                >
                                    {table.table_name}
                                </text>

                                {/* Lista de Campos/Colunas */}
                                {table.fields?.map((field, index) => {
                                    const fieldY = HEADER_HEIGHT + (index * ROW_HEIGHT) + 18;
                                    const isKey = field.is_primary_key || field.is_foreign_key;

                                    // Prefixo visual para chaves
                                    const keyPrefix = field.is_primary_key ? '🔑 '
                                        : field.is_foreign_key ? '🔗 '
                                            : '   ';

                                    return (
                                        <g key={`${table.table_name}-${field.name}`}>
                                            {/* Nome do Campo */}
                                            <text
                                                x="12"
                                                y={fieldY}
                                                fontFamily="'Fira Code', 'Courier New', monospace"
                                                fontSize="12"
                                                fontWeight={isKey ? "bold" : "normal"}
                                                fill={COLORS.fieldText}
                                                aria-label={`Campo: ${field.name}, tipo: ${field.type}`}
                                            >
                                                {keyPrefix}{field.name}
                                            </text>

                                            {/* Tipo de Dado */}
                                            <text
                                                x={table.width - 12}
                                                y={fieldY}
                                                fontFamily="'Fira Code', 'Courier New', monospace"
                                                fontSize="11"
                                                fill={COLORS.typeText}
                                                textAnchor="end"
                                            >
                                                {field.type.split('(')[0]} {/* Remove precisão */}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        ))}
                    </g>
                </svg>
            </div>
        </div>
    );
}

// ============================================================================
// NOTAS DE ESTUDO E APRENDIZADO
// ============================================================================

/**
 * CONCEITOS CHAVE DEMONSTRADOS:
 * 
 * 1. **Algoritmos de Layout**
 *    - Grid dinâmico baseado em número de colunas fixo
 *    - Acumulação de altura por coluna (algoritmo de empacotamento)
 *    - Complexidade O(n) para posicionamento
 * 
 * 2. **Renderização SVG Avançada**
 *    - Curvas de Bezier quadráticas para linhas de relação
 *    - Defs, markers e filtros de sombra
 *    - Transformações e animações CSS
 * 
 * 3. **Otimização de Performance**
 *    - useMemo para cálculos pesados de layout
 *    - Map vs Array para lookup de tabelas (O(1) vs O(n))
 *    - Memoização de callbacks com useCallback
 * 
 * 4. **Tratamento Robusto de Erros**
 *    - Try-catch aninhados para diferentes falhas
 *    - Mensagens amigáveis para usuário final
 *    - Logging detalhado para debugging
 * 
 * 5. **Acessibilidade (a11y)**
 *    - role="status" para loading states
 *    - aria-label para elementos interativos
 *    - Altura de toque adequada (botões)
 * 
 * 6. **Design Systems**
 *    - Constantes centralizadas
 *    - Cores baseadas no tema do Tailwind
 *    - Padrão de nomenclatura consistente
 * 
 * DESAFIOS RESOLVIDOS:
 * 
 * Q: Como evitar que múltiplas FKs cruzem muitas tabelas?
 * A: Iniciando do lado esquerdo (startX) e terminando no lado direito (endX + width)
 *    cria um fluxo natural sem sobreposições excessivas.
 * 
 * Q: Performance com 500+ tabelas?
 * A: Mapeamento Map reduce de O(n*m) para O(n) para construção de relacionamentos
 * 
 * Q: Exportação PNG mantendo qualidade?
 * A: Convertendo SVG → Canvas → PNG mantém qualidade vetorial
 */

// Utilitário para contar relacionamentos (para exibição no header)
const getRelacionamentosCount = (rels: Relationship[]): number => rels.length;