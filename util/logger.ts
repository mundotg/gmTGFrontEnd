// Níveis de log disponíveis
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NONE = 6
}

// Configuração do logger
export interface LoggerConfig {
  level: LogLevel;
  showTimestamp: boolean;
  showLevel: boolean;
  showContext: boolean;
  colors: boolean;
  maxContextLength: number;
  enablePerformance: boolean;
  environment: 'development' | 'production' | 'test';
  appName: string;
  appVersion: string;
}

// Contexto do log
export interface LogContext {
  component?: string;
  method?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  [key: string]: any;
}

// Entrada de log
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  data?: any;
  error?: unknown;
  duration?: number;
  stackTrace?: string;
}

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Ícones e labels para cada nível
const levelConfig: Record<Exclude<LogLevel, LogLevel.NONE>, { icon: string; label: string; color: string }> = {
  [LogLevel.TRACE]: { icon: '🔎', label: 'TRACE', color: colors.gray },
  [LogLevel.DEBUG]: { icon: '🐛', label: 'DEBUG', color: colors.cyan },
  [LogLevel.INFO]: { icon: 'ℹ️', label: 'INFO', color: colors.blue },
  [LogLevel.WARN]: { icon: '⚠️', label: 'WARN', color: colors.yellow },
  [LogLevel.ERROR]: { icon: '❌', label: 'ERROR', color: colors.red },
  [LogLevel.FATAL]: { icon: '💀', label: 'FATAL', color: colors.red + colors.bright }
};

class Logger {
  private config: LoggerConfig;
  private context: LogContext;
  private performanceMarks: Map<string, number> = new Map();

  constructor(config: Partial<LoggerConfig> = {}, initialContext: LogContext = {}) {
    this.config = {
      level: LogLevel.INFO,
      showTimestamp: true,
      showLevel: true,
      showContext: true,
      colors: true,
      maxContextLength: 20,
      enablePerformance: true,
      environment: 'development',
      appName: 'MyApp',
      appVersion: '1.0.0',
      ...config
    };

    this.context = {
      appName: this.config.appName,
      appVersion: this.config.appVersion,
      environment: this.config.environment,
      ...initialContext
    };
  }

  // ============ CONFIGURAÇÃO ============

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    // Atualiza contexto com novas configurações
    this.context.appName = this.config.appName;
    this.context.appVersion = this.config.appVersion;
    this.context.environment = this.config.environment;
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  // ============ UTILITÁRIOS PRIVADOS ============

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private formatContext(context: LogContext): string {
    if (!this.config.showContext) return '';

    const relevantContext = { ...context };
    delete relevantContext.appName;
    delete relevantContext.appVersion;
    delete relevantContext.environment;

    const contextParts = Object.entries(relevantContext)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        const formattedValue = typeof value === 'string' 
          ? this.truncateText(value, this.config.maxContextLength)
          : value;
        return `${key}=${formattedValue}`;
      });

    return contextParts.length > 0 ? `[${contextParts.join(' ')}]` : '';
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.showTimestamp) {
      const timestamp = new Date().toLocaleTimeString();
      if (this.config.colors) {
        parts.push(`${colors.dim}${timestamp}${colors.reset}`);
      } else {
        parts.push(`[${timestamp}]`);
      }
    }

    // Nível do log
    if (this.config.showLevel) {
      const { icon, label, color } = levelConfig[level as Exclude<LogLevel, LogLevel.NONE>];
      if (this.config.colors) {
        parts.push(`${color}${icon} ${label}${colors.reset}`);
      } else {
        parts.push(`[${icon} ${label}]`);
      }
    }

    // Contexto da aplicação
    if (this.config.showContext) {
      const appContext = `[${this.config.appName}@${this.config.appVersion}]`;
      if (this.config.colors) {
        parts.push(`${colors.magenta}${appContext}${colors.reset}`);
      } else {
        parts.push(appContext);
      }
    }

    // Contexto específico
    const specificContext = this.formatContext(context);
    if (specificContext && this.config.colors) {
      parts.push(`${colors.cyan}${specificContext}${colors.reset}`);
    } else if (specificContext) {
      parts.push(specificContext);
    }

    // Mensagem
    parts.push(message);

    return parts.join(' ');
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, error?: unknown, duration?: number): LogEntry {
    return {
      timestamp: this.getTimestamp(),
      level,
      message,
      context: { ...this.context },
      data,
      error,
      duration,
      stackTrace: level >= LogLevel.ERROR ? this.getStackTrace() : undefined
    };
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    
    // Remove as linhas do próprio logger
    return stack.split('\n')
      .slice(3) // Remove Error, getStackTrace e log method
      .filter(line => !line.includes('node_modules') && !line.includes('Logger.'))
      .join('\n');
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  // ============ MÉTODOS DE LOG PRINCIPAIS ============

  private log(level: LogLevel, message: string, data?: any, error?: unknown , duration?: number): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, data, error, duration);
    const formattedMessage = this.formatMessage(level, message, this.context);

    // Log para console
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '', error || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '', error || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, data || '', error || '');
        if (error && typeof error === 'object' && 'stack' in error) {
          console.error('Stack Trace:', (error as Error).stack);
        }
        break;
    }

    // Em produção, você pode enviar para um serviço de logging
    this.sendToLogService(logEntry);
  }

  // ============ MÉTODOS PÚBLICOS DE LOG ============

  trace(message: string, data?: any, context?: Partial<LogContext>): void {
    this.withContext(context, () => this.log(LogLevel.TRACE, message, data));
  }

  debug(message: string, data?: any, context?: Partial<LogContext>): void {
    this.withContext(context, () => this.log(LogLevel.DEBUG, message, data));
  }

  info(message: string, data?: any, context?: Partial<LogContext>, columns?: string[]): void {
    this.withContext(context, () => this.log(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any, error?: Error, context?: Partial<LogContext>): void {
    this.withContext(context, () => this.log(LogLevel.WARN, message, data, error));
  }

  error(message: string, error?: unknown | Error, data?: any, context?: Partial<LogContext>): void {
    this.withContext(context, () => this.log(LogLevel.ERROR, message, data, error));
  }

  fatal(message: string, error?: Error, data?: any, context?: Partial<LogContext>): void {
    this.withContext(context, () => this.log(LogLevel.FATAL, message, data, error));
  }

  success(message: string, data?: any, context?: Partial<LogContext>): void {
    this.withContext(context, () => {
      const formattedMessage = `✅ ${message}`;
      this.log(LogLevel.INFO, formattedMessage, data);
    });
  }

  // ============ LOGGING COM CONTEXTO TEMPORÁRIO ============

  withContext<T>(context: Partial<LogContext> | undefined, callback: () => T): T {
    if (!context) {
      return callback();
    }

    const originalContext = { ...this.context };
    try {
      this.context = { ...this.context, ...context };
      return callback();
    } finally {
      this.context = originalContext;
    }
  }

  createChildLogger(context: Partial<LogContext>): Logger {
    return new Logger(this.config, { ...this.context, ...context });
  }

  // ============ PERFORMANCE MONITORING ============

  startTimer(operation: string): void {
    if (this.config.enablePerformance) {
      this.performanceMarks.set(operation, performance.now());
      this.debug(`⏱️  Started: ${operation}`, undefined, { operation });
    }
  }

  endTimer(operation: string): number {
    if (!this.config.enablePerformance) return 0;

    const startTime = this.performanceMarks.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.performanceMarks.delete(operation);
      
      const durationFormatted = this.formatDuration(duration);
      this.debug(`⏱️  Completed: ${operation}`, { duration: durationFormatted }, { 
        operation, 
        durationMs: Math.round(duration) 
      });

      return duration;
    }
    
    this.warn(`Timer not found for operation: ${operation}`);
    return 0;
  }

  async measure<T>(operation: string, fn: () => Promise<T>, context?: Partial<LogContext>): Promise<T> {
    return this.withContext(context, async () => {
      this.startTimer(operation);
      try {
        const result = await fn();
        this.endTimer(operation);
        return result;
      } catch (error) {
        this.endTimer(operation);
        throw error;
      }
    });
  }

  measureSync<T>(operation: string, fn: () => T, context?: Partial<LogContext>): T {
    let result: T;
    this.withContext(context, () => {
      this.startTimer(operation);
      try {
        result = fn();
        this.endTimer(operation);
      } catch (error) {
        this.endTimer(operation);
        throw error;
      }
    });
    return result!;
  }

  // ============ UTILITÁRIOS AVANÇADOS ============

  table(data: any[], title?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      if (title) {
        console.group(`📊 ${title}`);
      }
      console.table(data);
      if (title) {
        console.groupEnd();
      }
    }
  }

  group(label: string, callback: () => void, collapsed: boolean = false): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      if (collapsed) {
        console.groupCollapsed(`📁 ${label}`);
      } else {
        console.group(`📁 ${label}`);
      }
      callback();
      console.groupEnd();
    }
  }

  // ============ INTEGRAÇÃO COM SERVIÇOS EXTERNOS ============

  private sendToLogService(entry: LogEntry): void {
    // Em produção, implemente o envio para seu serviço de logging preferido
    // Ex: LogRocket, Sentry, DataDog, ElasticSearch, etc.
    
    if (this.config.environment === 'production') {
      // Exemplo de implementação para um serviço HTTP
      this.sendToHttpService(entry);
    }
  }

  private async sendToHttpService(entry: LogEntry): Promise<void> {
    try {
      // Implemente a lógica de envio para seu backend
      if (entry.level >= LogLevel.ERROR) {
        // Envie erros imediatamente
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
      }
    } catch (error) {
      // Não quebre a aplicação se o logging falhar
      console.error('Failed to send log to service:', error);
    }
  }

  // ============ METADADAS E ESTATÍSTICAS ============

  getStats(): { level: string; environment: string; contextKeys: string[] } {
    return {
      level: levelConfig[this.config.level as Exclude<LogLevel, LogLevel.NONE>].label,
      environment: this.config.environment,
      contextKeys: Object.keys(this.context)
    };
  }
}

// ============ INSTÂNCIAS PRÉ-CONFIGURADAS ============

// Logger global padrão
const defaultLogger = new Logger();

// Fábrica de loggers com contexto específico
export const createLogger = (context: Partial<LogContext>, config: Partial<LoggerConfig> = {}) => {
  return new Logger(config, context);
};

// Loggers pré-configurados para diferentes domínios
export const logger = {
  // Logger padrão
  ...defaultLogger,

  // Loggers de domínio específico
  app: createLogger({ component: 'App' }),
  api: createLogger({ component: 'API' }),
  database: createLogger({ component: 'Database' }),
  auth: createLogger({ component: 'Auth' }),
  ui: createLogger({ component: 'UI' }),
  delete: createLogger({ component: 'DeleteOperations' }),
  query: createLogger({ component: 'QueryExecution' }),
  validation: createLogger({ component: 'Validation' }),

  // Utilitários
  create: createLogger,
  setConfig: defaultLogger.setConfig.bind(defaultLogger),
  setGlobalContext: defaultLogger.setContext.bind(defaultLogger)
};

export default logger;