// colors/palette.ts
/**
 * Paleta de cores completa para o Database Manager
 * Organizada por categorias e casos de uso específicos
 */

export const colorPalette = {
  // === CORES PRIMÁRIAS ===
  // Cores principais da marca e identidade visual
  primary: {
    // Azul principal - usado para elementos primários, botões principais, links
    blue: {
      50: '#eff6ff',    // Fundo muito claro para hover states
      100: '#dbeafe',   // Fundo claro para cards selecionados
      200: '#bfdbfe',   // Bordas suaves
      300: '#93c5fd',   // Elementos secundários
      400: '#60a5fa',   // Hover states
      500: '#3b82f6',   // Cor primária padrão
      600: '#2563eb',   // Botões e elementos ativos
      700: '#1d4ed8',   // Estados focados e selecionados
      800: '#1e40af',   // Texto em fundos claros
      900: '#1e3a8a',   // Texto escuro, headers
    },
    // Roxo para gradientes e elementos especiais
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',   // Usado em gradientes com azul
      600: '#9333ea',   // Elementos de destaque
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    }
  },

  // === CORES SECUNDÁRIAS ===
  // Cores para diferentes tipos de status e feedback
  secondary: {
    // Verde - sucesso, conexões ativas, funcionalidades disponíveis
    green: {
      50: '#f0fdf4',    // Fundo para cards de sucesso
      100: '#dcfce7',   // Fundo para funcionalidades ativas
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',   // Indicadores de sucesso
      600: '#16a34a',   // Botões de confirmação
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Laranja - avisos, funcionalidades em desenvolvimento
    orange: {
      50: '#fff7ed',    // Fundo para cards de desenvolvimento
      100: '#ffedd5',   // Fundo para funcionalidades futuras
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',   // Indicadores de aviso
      600: '#ea580c',   // Estados de desenvolvimento
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    // Vermelho - erros, desconexões, alertas críticos
    red: {
      50: '#fef2f2',    // Fundo para mensagens de erro
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',   // Indicadores de erro
      600: '#dc2626',   // Botões de ação crítica
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Amarelo - atenção, processamento, aguardando
    yellow: {
      50: '#fefce8',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',   // Indicadores de atenção
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    }
  },

  // === CORES NEUTRAS ===
  // Escala de cinzas para textos, fundos e elementos estruturais
  neutral: {
    // Cinza principal - textos, bordas, fundos
    gray: {
      50: '#f9fafb',    // Fundo da aplicação
      100: '#f3f4f6',   // Fundo de cards secundários
      200: '#e5e7eb',   // Bordas suaves
      300: '#d1d5db',   // Bordas padrão
      400: '#9ca3af',   // Texto secundário
      500: '#6b7280',   // Texto terciário
      600: '#4b5563',   // Texto secundário escuro
      700: '#374151',   // Texto principal
      800: '#1f2937',   // Texto escuro
      900: '#111827',   // Texto muito escuro, headers
    },
    // Branco e preto para contraste máximo
    white: '#ffffff',   // Fundo de cards principais
    black: '#000000',   // Texto de alto contraste (raramente usado)
  },

  // === CORES ESPECÍFICAS POR BANCO DE DADOS ===
  // Cada banco tem sua cor característica para fácil identificação
  databases: {
    sqlserver: {
      primary: '#CC2927',   // Vermelho Microsoft SQL Server
      bg: '#fef2f2',        // Fundo claro
      text: '#7f1d1d',      // Texto escuro
    },
    oracle: {
      primary: '#F80000',   // Vermelho Oracle
      bg: '#fef2f2',
      text: '#7f1d1d',
    },
    mysql: {
      primary: '#00758F',   // Azul MySQL
      bg: '#f0f9ff',
      text: '#0c4a6e',
    },
    postgresql: {
      primary: '#336791',   // Azul PostgreSQL
      bg: '#f1f5f9',
      text: '#1e293b',
    },
    mongodb: {
      primary: '#4DB33D',   // Verde MongoDB
      bg: '#f0fdf4',
      text: '#14532d',
    },
    sqlite: {
      primary: '#003B57',   // Azul escuro SQLite
      bg: '#f8fafc',
      text: '#0f172a',
    }
  },

  // === CORES PARA GRÁFICOS E VISUALIZAÇÕES ===
  // Paleta específica para charts, dashboards e análises
  charts: {
    // Cores primárias para gráficos (máximo contraste)
    primary: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'],
    
    // Cores secundárias para múltiplas séries
    secondary: ['#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa', '#22d3ee'],
    
    // Gradientes para áreas e fundos
    gradients: {
      blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      green: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
      orange: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      bluePurple: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', // Usado no header
    }
  },

  // === ESTADOS INTERATIVOS ===
  // Cores para diferentes estados de interação
  states: {
    // Estados de hover
    hover: {
      blue: '#2563eb',      // Hover em elementos azuis
      gray: '#f3f4f6',      // Hover em elementos neutros
      green: '#16a34a',     // Hover em elementos de sucesso
      red: '#dc2626',       // Hover em elementos de erro
    },
    // Estados de foco (acessibilidade)
    focus: {
      ring: '#3b82f6',      // Cor do ring de foco
      offset: '#ffffff',    // Cor do offset do ring
    },
    // Estados desabilitados
    disabled: {
      bg: '#f3f4f6',        // Fundo de elementos desabilitados
      text: '#9ca3af',      // Texto de elementos desabilitados
      border: '#e5e7eb',    // Borda de elementos desabilitados
    }
  },

  // === SHADOWS E EFEITOS ===
  // Definições de sombras para diferentes elementos
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',           // Cards pequenos
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',       // Cards padrão
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',         // Modais, dropdowns
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',       // Elementos elevados
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',       // Elementos muito elevados
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',  // Elementos internos
    colored: {
      blue: '0 4px 14px 0 rgb(59 130 246 / 0.15)',   // Sombra azul para botões primários
      green: '0 4px 14px 0 rgb(34 197 94 / 0.15)',   // Sombra verde para sucesso
      red: '0 4px 14px 0 rgb(239 68 68 / 0.15)',     // Sombra vermelha para erros
    }
  },

  // === CONFIGURAÇÕES DE TEMA ===
  // Modo escuro e claro
  theme: {
    light: {
      background: '#f9fafb',    // Fundo principal
      surface: '#ffffff',       // Fundo de cards
      text: {
        primary: '#111827',     // Texto principal
        secondary: '#6b7280',   // Texto secundário
        tertiary: '#9ca3af',    // Texto terciário
      },
      border: '#e5e7eb',        // Bordas padrão
    },
    dark: {
      background: '#111827',    // Fundo principal escuro
      surface: '#1f2937',       // Fundo de cards escuro
      text: {
        primary: '#f9fafb',     // Texto principal claro
        secondary: '#d1d5db',   // Texto secundário claro
        tertiary: '#9ca3af',    // Texto terciário
      },
      border: '#374151',        // Bordas escuras
    }
  }
};

// === UTILITÁRIOS ===
// Funções auxiliares para trabalhar com as cores

/**
 * Obtém a cor de um banco de dados específico
 */
export const getDatabaseColor = (dbType: string) => {
  const db = dbType.toLowerCase().replace(/\s+/g, '');
  return colorPalette.databases[db as keyof typeof colorPalette.databases] || {
    primary: colorPalette.neutral.gray[600],
    bg: colorPalette.neutral.gray[50],
    text: colorPalette.neutral.gray[700],
  };
};

/**
 * Obtém cores para status baseado no tipo
 */
export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info') => {
  const statusMap = {
    success: colorPalette.secondary.green,
    warning: colorPalette.secondary.orange,
    error: colorPalette.secondary.red,
    info: colorPalette.primary.blue,
  };
  return statusMap[status];
};

/**
 * Gera uma cor aleatória da paleta de gráficos
 */
export const getChartColor = (index: number) => {
  const colors = colorPalette.charts.primary;
  return colors[index % colors.length];
};

// Exportação das cores mais usadas para fácil acesso
export const colors = {
  // Cores mais utilizadas
  primary: colorPalette.primary.blue[600],
  success: colorPalette.secondary.green[500],
  warning: colorPalette.secondary.orange[500],
  error: colorPalette.secondary.red[500],
  
  // Texto
  textPrimary: colorPalette.neutral.gray[900],
  textSecondary: colorPalette.neutral.gray[600],
  textTertiary: colorPalette.neutral.gray[400],
  
  // Fundos
  background: colorPalette.neutral.gray[50],
  surface: colorPalette.neutral.white,
  
  // Bordas
  border: colorPalette.neutral.gray[200],
  borderDark: colorPalette.neutral.gray[300],
};