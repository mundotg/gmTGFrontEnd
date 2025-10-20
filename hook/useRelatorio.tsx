import { useSession } from '@/context/SessionContext';
import { useState, useCallback } from 'react';

export interface ApiResponseError {
    erro: string;
    mensagem?: string;
    detalhes?: string[];
}

export interface RelatorioPayload<T> {
    tipo?: 'metadados' | 'query' | 'analises' | 'projetos' | 'custom' | 'tarefas';
    body?: T;
    filtros?: Record<string, any>;
    parametros?: Record<string, any>;
}

export interface UseRelatorioReturn<T> {
    gerarRelatorio: (payload: RelatorioPayload<T>) => Promise<void>;
    baixarArquivo: (blob: Blob, filename?: string) => void;
    isLoading: boolean;
    error: string | null;
    success: boolean;
    progress: number;
    reset: () => void;
}

/**
 * Hook genérico para geração e download de relatórios PDF.
 * Suporta diferentes tipos de relatórios via payload tipado.
 */
export const useRelatorio = <T = any>(): UseRelatorioReturn<T> => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState(0);
    const { api } = useSession();

    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
        setProgress(0);
    }, []);

    const baixarArquivo = useCallback((blob: Blob, filename = `relatorio_${Date.now()}.pdf`) => {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Erro ao baixar arquivo:', err);
            setError('Falha ao tentar baixar o arquivo gerado.');
        }
    }, []);

    const gerarRelatorio = useCallback(async (payload: RelatorioPayload<T>) => {
        if (!payload) {
            setError('Nenhum dado foi fornecido para gerar o relatório.');
            return;
        }

        reset();
        setIsLoading(true);
        setProgress(10);

        try {
            setProgress(25);

            // Define dinamicamente o endpoint conforme o tipo de relatório
            const endpointMap: Record<string, string> = {
                query: '/relatorio/gerar-relatorio-query',
                metadados: '/relatorio/gerar-relatorio',
                analises: '/relatorio/gerar-relatorio-analise',
                projetos: '/relatorio/gerar-relatorio-projetos',
                custom: '/relatorio/gerar-relatorio-custom',
                tarefas: '/relatorio/gerar-relatorio-tarefas'
            };

            const endpoint = endpointMap[payload.tipo || 'metadados'];

            const response = await api.post(endpoint, payload, { responseType: 'blob' });

            if (response.status < 200 || response.status >= 300) {
                let message = 'Erro desconhecido no servidor.';
                try {
                    if (response.data instanceof Blob) {
                        const errorText = await new Response(response.data).text();
                        const parsed = JSON.parse(errorText) as ApiResponseError;
                        message = parsed.mensagem || parsed.erro || message;
                    }
                } catch {
                    message = `Erro ${response.status}: ${response.statusText || 'Falha ao gerar PDF'}`;
                }
                throw new Error(message);
            }

            setProgress(60);

            const blob = response.data;
            if (!blob || blob.size === 0) {
                throw new Error('O arquivo PDF retornado está vazio ou corrompido.');
            }

            // Extrai o nome do arquivo, se informado pelo backend
            const contentDisposition = response.headers['content-disposition'];
            let filename = `relatorio_${payload.tipo || 'generico'}_${Date.now()}.${payload.parametros?.formato || "pdf"}`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            setProgress(90);
            baixarArquivo(blob, filename);
            setSuccess(true);
            setProgress(100);
        } catch (err) {
            console.error('Erro ao gerar relatório:', err);
            const message = err instanceof Error ? err.message : 'Erro inesperado ao gerar relatório.';
            setError(message);
            setSuccess(false);
        } finally {
            setIsLoading(false);
            setTimeout(() => setProgress(0), 1500);
        }
    }, [api, baixarArquivo, reset]);

    return { gerarRelatorio, baixarArquivo, isLoading, error, success, progress, reset };
};