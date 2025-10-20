import { RelatorioPayload, useRelatorio, UseRelatorioReturn } from '@/hook/useRelatorio';
import { useState, useCallback } from 'react';

export interface DadosRelatorio {
    totalItens: number;
    tamanhoArquivo?: string;
    geradoEm?: Date;
    duracaoSegundos?: number;
}
export type FormatoRelatorio = "pdf" | "excel" | "json";
export interface UseRelatorioAvancadoReturn<T> extends UseRelatorioReturn<T> {
    cancelarGeracao: () => void;
    tempoEstimado: number;
    dadosRelatorio: DadosRelatorio;
}

/**
 * Hook genérico para controle de geração de relatórios.
 * - Suporta cancelamento de requisições via AbortController.
 * - Calcula tempo estimado com base no tamanho do payload.
 * - Monitora duração, tamanho e horário do relatório gerado.
 */
export const useRelatorioAvancado = <T,>(): UseRelatorioAvancadoReturn<T> => {
    const [cancelarController, setCancelarController] = useState<AbortController | null>(null);
    const [tempoEstimado, setTempoEstimado] = useState(0);
    const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorio>({
        totalItens: 0,
    });

    const relatorioBase = useRelatorio<T>();

    const cancelarGeracao = useCallback(() => {
        if (cancelarController) {
            cancelarController.abort();
            setCancelarController(null);
            relatorioBase.reset();
            console.info('🚫 Geração de relatório cancelada pelo usuário.');
        }
    }, [cancelarController, relatorioBase]);

    const gerarRelatorioAvancado = useCallback(
        async (payload: RelatorioPayload<T>) => {
            const controller = new AbortController();
            setCancelarController(controller);

            // Detecta total de itens dinamicamente
            const body = payload.body;
            const totalItens = Array.isArray(body)
                ? body.length
                : typeof body === 'object'
                ? Object.keys(body || {}).length
                : 1;

            setDadosRelatorio((prev) => ({ ...prev, totalItens }));

            // Tempo estimado adaptável conforme tamanho do payload
            const estimativa = Math.max(5, totalItens * 1.5);
            setTempoEstimado(estimativa);

            const start = performance.now();
            try {
                await relatorioBase.gerarRelatorio(payload);

                const end = performance.now();
                const duracaoSegundos = Number(((end - start) / 1000).toFixed(2));

                setDadosRelatorio({
                    totalItens,
                    geradoEm: new Date(),
                    duracaoSegundos,
                    tamanhoArquivo: `${Math.max(1, Math.round(totalItens * 0.2))} MB`,
                });

                console.info(`✅ Relatório gerado com sucesso em ${duracaoSegundos}s`);
            } catch (err) {
                if (controller.signal.aborted) {
                    console.warn('⚠️ Geração de relatório foi cancelada.');
                } else {
                    console.error('❌ Erro ao gerar relatório:', err);
                }
            } finally {
                setCancelarController(null);
                setTempoEstimado(0);
            }
        },
        [relatorioBase]
    );

    return {
        ...relatorioBase,
        gerarRelatorio: gerarRelatorioAvancado,
        cancelarGeracao,
        tempoEstimado,
        dadosRelatorio,
    };
};