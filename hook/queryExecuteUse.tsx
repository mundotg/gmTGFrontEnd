/**
 * Cliente JavaScript melhorado para execução de queries via SSE
 * Compatível com o backend otimizado
 */

import api from "@/context/axioCuston";
import { QueryCountResultType, QueryPayload, QueryResultType } from "@/types";

export interface SSEData {
  status?: string;
  error?: string;
  data?: QueryResultType;
  count?: QueryCountResultType;
}

// Configurações
const SSE_CONFIG = {
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 1000, // ms
  TIMEOUT: 300000, // 5 minutos
  HEARTBEAT_INTERVAL: 30000, // 30 segundos
} as const;

// Estados dos SSE
export enum SSEState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  CLOSED = 'closed'
}

export class QuerySSEClient {
  private eventSource: EventSource | null = null;
  private channelId: string | null = null;
  private state: SSEState = SSEState.IDLE;
  private reconnectAttempts: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private heartbeatId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private onStateChange: (state: SSEState) => void,
    private onData: (data: QueryResultType) => void,
    private onCount: (count: QueryCountResultType) => void,
    private onError: (error: string) => void,
    private onProgress?: (status: string) => void
  ) {}

  private setState(newState: SSEState): void {
    if (this.state !== newState) {
      // console.log(`🔄 SSE State: ${this.state} → ${newState}`);
      this.state = newState;
      this.onStateChange(newState);
    }
  }

  private startTimeout(): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      console.warn('⏰ SSE Timeout - fechando conexão');
      this.close('timeout');
      this.onError('Timeout na execução da query');
    }, SSE_CONFIG.TIMEOUT);
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatId = setInterval(() => {
      if (this.eventSource?.readyState === EventSource.OPEN) {
        console.log('💓 SSE Heartbeat - conexão ativa');
      }
    }, SSE_CONFIG.HEARTBEAT_INTERVAL);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatId) {
      clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }

  private async createChannel(query: QueryPayload): Promise<string> {
    try {
      const response = await api.post(
        '/exe/start-query',
        { ...query },
        { 
          withCredentials: true,
          timeout: 10000 // 10 segundos timeout para criar canal
        }
      );

      if (!response.data?.channelId) {
        throw new Error('Channel ID não recebido do servidor');
      }

      
      return response.data.channelId;
    } catch (error: any) {
      console.error('❌ Erro ao criar canal:', error);
      if (error.response?.status === 400) {
        throw new Error('Dados da query inválidos');
      } else if (error.response?.status === 500) {
        throw new Error('Erro interno do servidor');
      }
      throw new Error('Falha ao criar canal de comunicação');
    }
  }

  private setupEventSource(channelId: string): void {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}exe/query-sse/${channelId}`;
    // console.log('🔌 Conectando ao SSE:', url);

    this.eventSource = new EventSource(url, {
      withCredentials: true
    });

    // Handler para conexão aberta
    this.eventSource.onopen = () => {
      console.log('🟢 SSE Conectado');
      this.setState(SSEState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    // Handler para status
    this.eventSource.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log('📊 Status:', data);

        switch (data.status) {
          case 'started':
            this.setState(SSEState.PROCESSING);
            this.onProgress?.('Iniciando execução da query...');
            break;

          case 'completed':
          case 'finalizado':
            this.setState(SSEState.COMPLETED);
            this.onProgress?.('Query executada com sucesso!');
            this.close('completed');
            break;

          default:
            this.onProgress?.(data.status);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao processar status:', error);
      }
    });

    // Handler para dados da query
    this.eventSource.addEventListener('data', (event) => {
      try {
        const queryResult: QueryResultType = JSON.parse(event.data);
        // console.log('📊 Dados recebidos:', queryResult);

        if (queryResult.success) {
          this.onData(queryResult);
          this.onProgress?.(`Query executada em ${queryResult.duration_ms}ms ${queryResult.query ? '(cache)' : ''}`);
        } else {
          this.onError('Erro na execução da query');
        }
      } catch (error) {
        console.error('❌ Erro ao processar dados:', error);
        this.onError('Erro ao processar dados da resposta');
      }
    });

    // Handler para contagem
    this.eventSource.addEventListener('count', (event) => {
      try {
        const countResult: QueryCountResultType = JSON.parse(event.data);
        // console.log('🔢 Count recebido:', countResult);

        if (countResult.success) {
          this.onCount(countResult);
          this.onProgress?.(`Contagem: ${countResult.count} registros ${countResult.query ? '(cache)' : ''}`);
        }
      } catch (error) {
        console.error('❌ Erro ao processar count:', error);
        this.onError('Erro ao processar contagem');
      }
    });

    // Handler para erros
    this.eventSource.addEventListener('error', (event) => {
      try {
        const errorData = JSON.parse((event as MessageEvent).data || '{}');
        // console.error('❌ Erro SSE:', errorData);
        
        const errorMessage = this.parseErrorMessage(errorData.error || 'Erro desconhecido');
        this.onError(errorMessage);
        
        // Remove cache se erro específico - REMOVED localStorage usage
        if (errorMessage.includes('exceptions must derive from BaseException')) {
          console.log('🗑️ Cache seria limpo, mas localStorage não está disponível');
        }
        
        this.close('server_error');
      } catch (error) {
        console.error('❌ Erro ao processar erro:', error);
        this.onError('Erro na comunicação com o servidor');
      }
    });

    // Handler para erros de conexão
    this.eventSource.onerror = (event) => {
      // console.error('❌ Erro na conexão SSE:', event);
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.setState(SSEState.CLOSED);
        
        if (this.reconnectAttempts < SSE_CONFIG.RECONNECT_ATTEMPTS) {
          this.attemptReconnect();
        } else {
          this.onError('Conexão perdida - máximo de tentativas excedido');
        }
      } else {
        this.setState(SSEState.ERROR);
        this.onError('Erro na conexão SSE');
      }
    };
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = SSE_CONFIG.RECONNECT_DELAY * this.reconnectAttempts;
    
    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${SSE_CONFIG.RECONNECT_ATTEMPTS} em ${delay}ms`);
    this.onProgress?.(`Tentando reconectar... (${this.reconnectAttempts}/${SSE_CONFIG.RECONNECT_ATTEMPTS})`);

    setTimeout(() => {
      if (this.channelId && this.state !== SSEState.COMPLETED) {
        this.setupEventSource(this.channelId);
      }
    }, delay);
  }

  private parseErrorMessage(error: string): string {
    // Parse específico de erros do backend
    if (typeof error !== 'string') return 'Erro desconhecido';

    // Remove stack traces e informações técnicas desnecessárias
    const cleanError = error
      .split('\n')[0] // Primeira linha apenas
      .replace(/^Error: /, '') // Remove prefixo "Error:"
      .replace(/^\w+Exception: /, '') // Remove prefixos de exception
      .trim();

    // Mapeamento de erros comuns para mensagens amigáveis
    const errorMappings: Record<string, string> = {
      'Connection refused': 'Não foi possível conectar ao banco de dados',
      'Timeout': 'A operação demorou mais que o esperado',
      'Invalid identifier': 'Nome de tabela ou coluna inválido',
      'Permission denied': 'Permissão negada para esta operação',
      'Table doesn\'t exist': 'Tabela não encontrada',
      'Column doesn\'t exist': 'Coluna não encontrada'
    };

    for (const [key, message] of Object.entries(errorMappings)) {
      if (cleanError.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    return cleanError || 'Erro na execução da query';
  }

  public async executeQuery(query: QueryPayload): Promise<void> {
    if (this.state === SSEState.PROCESSING) {
      throw new Error('Query já está sendo executada');
    }

    try {
      this.setState(SSEState.CONNECTING);
      this.startTimeout();
      // Cria canal no backend
      this.channelId = await this.createChannel(query);

      // Conecta ao SSE
      this.setupEventSource(this.channelId);

    } catch (error: any) {
      console.error('❌ Falha geral na execução:', error);
      this.setState(SSEState.ERROR);
      this.clearTimeout();
      this.onError(error.message || 'Erro ao executar query');
    }
  }

  public close(reason?: string): void {
    console.log('🔌 Fechando SSE:', reason || 'manual');
    
    this.clearTimeout();
    this.clearHeartbeat();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.state !== SSEState.COMPLETED && this.state !== SSEState.ERROR) {
      this.setState(SSEState.CLOSED);
    }

    this.channelId = null;
    this.reconnectAttempts = 0;
  }

  public getState(): SSEState {
    return this.state;
  }

  public isActive(): boolean {
    return [SSEState.CONNECTING, SSEState.CONNECTED, SSEState.PROCESSING].includes(this.state);
  }
}