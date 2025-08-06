import { useCallback, useMemo, useState } from "react";

interface ExportOptions {
    filename?: string;
    delimiter?: string;
    includeHeaders?: boolean;
    customHeaders?: string[] | Record<string, string>;
    dateFormat?: 'iso' | 'locale' | 'custom' | 'timestamp';
    customDateFormat?: string;
    encoding?: 'utf-8' | 'utf-16' | 'iso-8859-1';
    numbersAsText?: boolean;
    excludeColumns?: string[];
    includeOnly?: string[];
    transformValue?: (value: any, key: string, row: any) => any;
    sortBy?: string | string[];
    maxRows?: number;
    onProgress?: (progress: number) => void;
    locale?: string;
    nullValue?: string;
    undefinedValue?: string;
    booleanFormat?: 'true/false' | '1/0' | 'yes/no' | 'sim/não';
    preventDownload?: boolean;
}

type CsvResult = {
    content: string;
    blob: Blob;
    url: string;
    rowCount: number;
    columnCount: number;
    size: string;
};

/**
 * Exporta dados para CSV de forma genérica e ultra robusta
 * @param data Array de objetos para exportar
 * @param options Opções avançadas de configuração
 * @returns CsvResult se preventDownload for true, senão void
 */
export function exportToCsv(data: any[], options: ExportOptions = {}): CsvResult | void {
    const {
        filename = `export_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`,
        delimiter = ',',
        includeHeaders = true,
        customHeaders = [],
        dateFormat = 'iso',
        customDateFormat = 'dd/MM/yyyy HH:mm:ss',
        encoding = 'utf-8',
        numbersAsText = false,
        excludeColumns = [],
        includeOnly = [],
        transformValue,
        sortBy,
        maxRows,
        onProgress,
        locale = 'pt-BR',
        nullValue = '',
        undefinedValue = '',
        booleanFormat = 'true/false',
        preventDownload = false
    } = options;

    // Validações robustas
    if (!data || !Array.isArray(data)) {
        throw new Error('Os dados devem ser um array válido');
    }

    if (data.length === 0) {
        console.warn('Array de dados está vazio');
        return preventDownload ? createEmptyResult() : undefined;
    }

    // Clonar e processar dados
    let processedData = [...data];

    // Aplicar limite de linhas
    if (maxRows && maxRows > 0) {
        processedData = processedData.slice(0, maxRows);
    }

    // Ordenar dados se solicitado
    if (sortBy) {
        const sortKeys = Array.isArray(sortBy) ? sortBy : [sortBy];
        processedData.sort((a, b) => {
            for (const key of sortKeys) {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
            }
            return 0;
        });
    }

    // Determinar colunas finais
    const allKeys = new Set<string>();
    processedData.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });

    let finalColumns = Array.from(allKeys);

    // Filtrar colunas
    if (includeOnly.length > 0) {
        finalColumns = finalColumns.filter(col => includeOnly.includes(col));
    }
    if (excludeColumns.length > 0) {
        finalColumns = finalColumns.filter(col => !excludeColumns.includes(col));
    }

    // Função avançada para formatar datas
    const formatDate = (date: Date): string => {
        switch (dateFormat) {
            case 'locale':
                return date.toLocaleDateString(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            case 'timestamp':
                return date.getTime().toString();
            case 'custom':
                // Implementação mais robusta de formato customizado
                return formatCustomDate(date, customDateFormat);
            default:
                return date.toISOString();
        }
    };

    // Função para formato customizado de data
    const formatCustomDate = (date: Date, format: string): string => {
        const map: Record<string, string> = {
            'dd': date.getDate().toString().padStart(2, '0'),
            'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
            'yyyy': date.getFullYear().toString(),
            'HH': date.getHours().toString().padStart(2, '0'),
            'mm': date.getMinutes().toString().padStart(2, '0'),
            'ss': date.getSeconds().toString().padStart(2, '0')
        };

        return format.replace(/dd|MM|yyyy|HH|mm|ss/g, match => map[match] || match);
    };

    // Função para formatar booleanos
    const formatBoolean = (value: boolean): string => {
        const formats = {
            'true/false': value ? 'true' : 'false',
            '1/0': value ? '1' : '0',
            'yes/no': value ? 'yes' : 'no',
            'sim/não': value ? 'sim' : 'não'
        };
        return formats[booleanFormat];
    };

    // Função ultra robusta para escapar valores
    const escapeValue = (value: any, key: string, row: any): string => {
        // Aplicar transformação customizada primeiro
        if (transformValue) {
            value = transformValue(value, key, row);
        }

        // Tratar valores null/undefined
        if (value === null) return nullValue;
        if (value === undefined) return undefinedValue;

        // Tratar diferentes tipos
        if (value instanceof Date) {
            return formatDate(value);
        }

        if (typeof value === 'boolean') {
            return formatBoolean(value);
        }

        if (typeof value === 'number') {
            if (numbersAsText) {
                // Força número como texto (útil para códigos/IDs)
                return `"${value.toString()}"`;
            }
            // Usar formatação local para números
            return value.toLocaleString(locale);
        }

        // Tratar arrays e objetos
        if (Array.isArray(value)) {
            return `"${value.join('; ')}"`;
        }

        if (typeof value === 'object') {
            return `"${JSON.stringify(value)}"`;
        }

        let stringValue = String(value);

        // Remover caracteres de controle
        stringValue = stringValue.replace(/[\x00-\x1F\x7F]/g, '');

        // Escapar aspas duplas e adicionar aspas se necessário
        if (stringValue.includes(delimiter) ||
            stringValue.includes('"') ||
            stringValue.includes('\n') ||
            stringValue.includes('\r') ||
            stringValue.trim() !== stringValue) {
            stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    };

    // Determinar cabeçalhos finais
    let headers: string[];
    if (Array.isArray(customHeaders)) {
        headers = customHeaders.length > 0 ? customHeaders : finalColumns;
    } else if (typeof customHeaders === 'object') {
        // Mapear nomes de colunas
        headers = finalColumns.map(col => customHeaders[col] || col);
    } else {
        headers = finalColumns;
    }

    // Construir CSV com progresso
    const csvRows: string[] = [];
    const totalRows = processedData.length + (includeHeaders ? 1 : 0);
    let currentRow = 0;

    // Adicionar cabeçalhos
    if (includeHeaders) {
        csvRows.push(headers.map(h => escapeValue(h, '', {})).join(delimiter));
        currentRow++;
        onProgress?.(currentRow / totalRows);
    }

    // Processar dados com feedback de progresso
    processedData.forEach((row, index) => {
        const values = finalColumns.map(header => escapeValue(row[header], header, row));
        csvRows.push(values.join(delimiter));

        currentRow++;
        if (onProgress && index % 100 === 0) {
            onProgress(currentRow / totalRows);
        }
    });

    // Finalizar progresso
    onProgress?.(1);

    const csvContent = csvRows.join('\n');

    // Adicionar BOM baseado na codificação
    const getBom = (): string => {
        switch (encoding) {
            case 'utf-8': return '\uFEFF';
            case 'utf-16': return '\uFFFE';
            default: return '';
        }
    };

    const finalContent = getBom() + csvContent;

    // Criar blob
    const blob = new Blob([finalContent], {
        type: `text/csv;charset=${encoding}`
    });

    const url = URL.createObjectURL(blob);

    // Calcular informações do resultado
    const result: CsvResult = {
        content: finalContent,
        blob,
        url,
        rowCount: processedData.length,
        columnCount: finalColumns.length,
        size: formatFileSize(blob.size)
    };

    // Se não deve fazer download, retornar resultado
    if (preventDownload) {
        return result;
    }

    // Fazer download
    downloadFile(url, filename);

    return undefined;
}

// Função auxiliar para criar resultado vazio
function createEmptyResult(): CsvResult {
    const blob = new Blob([''], { type: 'text/csv' });
    return {
        content: '',
        blob,
        url: URL.createObjectURL(blob),
        rowCount: 0,
        columnCount: 0,
        size: '0 B'
    };
}

// Função auxiliar para download
function downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup após delay para garantir download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Função auxiliar para formatar tamanho do arquivo
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Versão simplificada para uso rápido
 */
export function quickExportToCsv(data: any[], filename?: string): void {
    exportToCsv(data, { filename });
}

/**
 * Exporta com configurações otimizadas para Excel brasileiro
 */
export function exportToCsvForExcel(data: any[], filename?: string): void {
    exportToCsv(data, {
        filename,
        delimiter: ';',
        dateFormat: 'locale',
        locale: 'pt-BR',
        encoding: 'utf-8',
        booleanFormat: 'sim/não'
    });
}

/**
 * Exporta dados grandes com feedback de progresso
 */
export function exportLargeCsv(
    data: any[],
    onProgress: (progress: number) => void,
    options: ExportOptions = {}
): void {
    exportToCsv(data, {
        ...options,
        onProgress,
        maxRows: options.maxRows || 50000 // Limite padrão para arquivos grandes
    });
}

/**
 * Gera CSV sem fazer download (útil para preview ou processamento adicional)
 */
export function generateCsvContent(data: any[], options: ExportOptions = {}): CsvResult {
    const result = exportToCsv(data, { ...options, preventDownload: true });
    return result as CsvResult;
}


interface ColumnInfo {
  name: string;
  type?: string;
}

type ExportType = 'basic' | 'excel' | 'advanced';

interface UseCsvExporterResult {
  previewInfo: { size: string; rows: number; columns: number } | null;
  exportProgress: number;
  isExporting: boolean;
  handleExport: (type: ExportType) => void;
  showExportOptions: boolean;
  setShowExportOptions: (show: boolean) => void;
}

export function useCsvExporter(
  queryResults: any[],
  columns: string[],
  headers: ColumnInfo[]
): UseCsvExporterResult {
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const exportOptions = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[0];

    const dateColumns = headers
      .filter(h =>
        h.type?.toLowerCase().includes('date') ||
        h.type?.toLowerCase().includes('timestamp') ||
        h.name?.toLowerCase().includes('data'))
      .map(h => h.name);

    const idColumns = headers
      .filter(h =>
        h.name?.toLowerCase().includes('id') ||
        h.name?.toLowerCase().includes('codigo'))
      .map(h => h.name);

    const customHeaders: Record<string, string> = {};
    columns.forEach(col => {
      const cleanName = col.includes('.') ? col.split('.').pop() || col : col;
      const friendlyName = cleanName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      customHeaders[col] = friendlyName;
    });

    const progressCallback = (progress: number) => setExportProgress(Math.round(progress * 100));

    return {
      basic: {
        filename: `resultados_${timestamp}.csv`,
        delimiter: ',',
        dateFormat: 'locale' as const,
        locale: 'pt-BR',
        onProgress: progressCallback,
      },
      excel: {
        filename: `resultados_${timestamp}.csv`,
        delimiter: ';',
        dateFormat: 'custom' as const,
        customDateFormat: 'dd/MM/yyyy HH:mm:ss',
        booleanFormat: 'sim/não' as const,
        locale: 'pt-BR',
        customHeaders,
        numbersAsText: idColumns.length > 0,
        onProgress: progressCallback,
      },
      advanced: {
        filename: `relatorio_completo_${timestamp}.csv`,
        delimiter: ';',
        dateFormat: 'custom' as const,
        customDateFormat: 'dd/MM/yyyy HH:mm:ss',
        customHeaders,
        booleanFormat: 'sim/não' as const,
        locale: 'pt-BR',
        transformValue: (value: any, key: string) => {
          if (typeof value === 'string' && value.length > 100) return value.substring(0, 97) + '...';
          if (idColumns.includes(key) && typeof value === 'number') return value.toString();
          return value;
        },
        onProgress: progressCallback,
      },
    };
  }, [columns, headers]);

  const handleExport = useCallback(async (type: ExportType) => {
    if (!queryResults || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const options = exportOptions[type];

      if (queryResults.length > 10000) {
        await exportLargeCsv(queryResults, options.onProgress!, options);
      } else if (type === 'excel') {
        exportToCsvForExcel(queryResults, options.filename);
      } else {
        await new Promise(resolve => {
          setTimeout(() => {
            exportLargeCsv(queryResults, options.onProgress!, options);
            resolve(undefined);
          }, 100);
        });
      }

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setShowExportOptions(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [queryResults, exportOptions, isExporting]);

  const getFilePreview = useCallback(() => {
    if (!queryResults || queryResults.length === 0) return null;

    try {
      const preview = generateCsvContent(queryResults.slice(0, 3), {
        ...exportOptions.excel,
        preventDownload: true,
      });
      return {
        size: preview.size,
        rows: preview.rowCount,
        columns: preview.columnCount,
      };
    } catch (error) {
      return null;
    }
  }, [queryResults, exportOptions]);

  const previewInfo = useMemo(() => getFilePreview(), [getFilePreview]);

  return {
    previewInfo,
    exportProgress,
    isExporting,
    handleExport,
    showExportOptions,
    setShowExportOptions,
  };
}
