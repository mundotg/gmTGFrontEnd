"use client";
import { useMemo, useState, useCallback } from "react";
import { X, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import { CampoDetalhado, MetadataTableResponse } from "@/types";
import DynamicInputByType from "./DynamicInputByType";
import api from "@/context/axioCuston";

interface ModalAutoCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (configs: ConfiguracaoTabela[]) => void;
  setModelDeCriacaoDeRegistro: () => void;
  metadataList: MetadataTableResponse[];
}

interface CampoPadronizado {
  id: string;
  campo: string;
  valor: string;
}

interface ConfiguracaoTabela {
  schema_name?: string;
  tabela: string;
  quantidade: number;
  camposPadronizados?: CampoPadronizado[];
}

export default function ModalAutoCreate({
  isOpen,
  onClose,
  onConfirm,
  setModelDeCriacaoDeRegistro,
  metadataList,
}: ModalAutoCreateProps) {
  const [tabelas, setTabelas] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState(1);
  const [camposPadronizados, setCamposPadronizados] = useState<CampoPadronizado[]>([]);
  const [chooseOp, setChooseOp] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Campos válidos para TODAS as tabelas escolhidas (interseção)
  const camposValidos: CampoDetalhado[] = useMemo(() => {
    if (!metadataList?.length || !tabelas.length) return [];

    // Para múltiplas tabelas, só mostrar campos que existem em TODAS
    const tabelasSelecionadas = metadataList.filter(t => tabelas.includes(t.table_name));

    if (tabelasSelecionadas.length === 1) {
      return tabelasSelecionadas[0].colunas.filter(
        c => !c.is_auto_increment && !c.is_primary_key
      );
    }
    return tabelasSelecionadas.flatMap(tabela => tabela.colunas.filter(
      c => !c.is_auto_increment && !c.is_primary_key
    ))

  }, [metadataList, tabelas]);

  // Campos disponíveis (não selecionados ainda)
  const camposDisponiveis = useMemo(() => {
    const camposJaSelecionados = new Set(
      camposPadronizados.map(cp => cp.campo).filter(Boolean)
    );
    return camposValidos.filter(c => !camposJaSelecionados.has(c.nome));
  }, [camposValidos, camposPadronizados]);

  const validarFormulario = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!tabelas.length) {
      newErrors.tabelas = "Selecione pelo menos uma tabela";
    }

    if (quantidade < 1 || quantidade > 1000) {
      newErrors.quantidade = "Quantidade deve estar entre 1 e 1000";
    }

    // Validar campos padronizados
    camposPadronizados.forEach((cp) => {
      if (cp.campo && !cp.valor.trim()) {
        newErrors[`campo_${cp.id}`] = "Campo selecionado deve ter um valor";
      }
      if (!cp.campo && cp.valor.trim()) {
        newErrors[`campo_${cp.id}`] = "Valor preenchido deve ter um campo selecionado";
      }
    });

    // Verificar duplicatas
    const camposDuplicados = camposPadronizados
      .map(cp => cp.campo)
      .filter(Boolean)
      .filter((campo, index, array) => array.indexOf(campo) !== index);

    if (camposDuplicados.length > 0) {
      camposDuplicados.forEach(campo => {
        const campoId = camposPadronizados.find(cp => cp.campo === campo)?.id;
        if (campoId) {
          newErrors[`campo_${campoId}`] = "Campo duplicado";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [tabelas, quantidade, camposPadronizados]);
  const resetForm = useCallback(() => {
    setTabelas([]);
    setQuantidade(1);
    setCamposPadronizados([]);
    setErrors({});
    setChooseOp(0);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!validarFormulario()) return;

    const configs: ConfiguracaoTabela[] = tabelas.map(tableName => {
      const tabelaSelecionada = metadataList.find(t => t.table_name === tableName);
      const camposValidosTabela = camposPadronizados.filter(
        cp => cp.campo && cp.valor.trim()
      );

      return {
        schema: tabelaSelecionada?.schema_name,
        tabela: tableName,
        quantidade,
        camposPadronizados: camposValidosTabela.length > 0 ? camposValidosTabela : undefined,
      };
    });
    try {
      await api.post("/exe/auto-create", { "configs": configs }, { withCredentials: true })
    } catch (error) {

      console.log(error)

    }
    onConfirm(configs);
    resetForm();
    onClose();
  }, [tabelas, quantidade, camposPadronizados, metadataList, onConfirm, validarFormulario, onClose, resetForm]);

  const adicionarCampo = useCallback(() => {
    if (camposDisponiveis.length === 0) return;

    const novoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCamposPadronizados(prev => [
      ...prev,
      { id: novoId, campo: "", valor: "" }
    ]);
  }, [camposDisponiveis.length]);

  const removerCampo = useCallback((id: string) => {
    setCamposPadronizados(prev => prev.filter(cp => cp.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`campo_${id}`];
      return newErrors;
    });
  }, []);

  const atualizarCampo = useCallback((id: string, propriedade: keyof CampoPadronizado, valor: string) => {
    setCamposPadronizados(prev =>
      prev.map(cp =>
        cp.id === id ? { ...cp, [propriedade]: valor } : cp
      )
    );

    // Limpar erro específico do campo ao atualizá-lo
    if (errors[`campo_${id}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`campo_${id}`];
        return newErrors;
      });
    }
  }, [errors]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleTabelaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setTabelas(values);
    setCamposPadronizados([]); // Reset campos ao mudar tabelas
    setErrors({}); // Limpar erros
  }, []);

  if (!isOpen) return null;

  // Tela de escolha da operação
  if (chooseOp === 0) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Como deseja criar registros?
          </h2>
          <div className="flex flex-col gap-4 w-full">
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full transition-colors"
              onClick={() => {
                setModelDeCriacaoDeRegistro();
                handleClose();
              }}
            >
              Criar registro manualmente
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 w-full transition-colors"
              onClick={() => setChooseOp(1)}
            >
              Usar gerador automático
            </button>
          </div>
          <button
            onClick={handleClose}
            className="mt-6 px-4 py-2 rounded-lg border text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 text-black"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-lg font-bold text-gray-800">
            Gerar registros automáticos
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Seleção das tabelas */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tabela(s) *
              </label>
              <select
                multiple
                value={tabelas}
                onChange={handleTabelaChange}
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.tabelas ? 'border-red-500' : ''
                  }`}
                size={Math.min(metadataList.length, 6)}
              >
                {metadataList.map((t, index) => (
                  <option key={t.table_name + index} value={t.table_name}>
                    {t.table_name}
                  </option>
                ))}
              </select>
              {errors.tabelas && (
                <p className="text-sm text-red-600 mt-1">{errors.tabelas}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Use Ctrl/Cmd + clique para selecionar múltiplas tabelas
              </p>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Quantidade de registros *
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.quantidade ? 'border-red-500' : ''
                  }`}
              />
              {errors.quantidade && (
                <p className="text-sm text-red-600 mt-1">{errors.quantidade}</p>
              )}
            </div>

            {/* Campos padronizados */}
            {tabelas.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium">
                    Campos padronizados (opcional)
                  </label>
                  <button
                    onClick={adicionarCampo}
                    disabled={camposDisponiveis.length === 0}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar campo
                  </button>
                </div>

                {tabelas.length > 1 && camposValidos.length === 0 && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      As tabelas selecionadas não possuem campos em comum.
                      Campos padronizados não estarão disponíveis.
                    </p>
                  </div>
                )}

                {camposPadronizados.length === 0 && (
                  <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                    Nenhum campo padronizado. Os valores serão gerados automaticamente.
                  </div>
                )}

                <div className="space-y-4">
                  {camposPadronizados.map((cp, index) => {
                    const campoSelecionado = camposValidos.find(c => c.nome === cp.campo);
                    const temErro = errors[`campo_${cp.id}`];

                    return (
                      <div key={cp.id + "==" + index} className={`p-4 border rounded-lg ${temErro ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Campo #{index + 1}
                          </span>
                          <button
                            onClick={() => removerCampo(cp.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label={`Remover campo ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {temErro && (
                          <p className="text-sm text-red-600 mb-3 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {temErro}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Seleção do campo */}
                          <div>
                            <label className="block text-sm font-medium mb-1">Campo</label>
                            <select
                              value={cp.campo}
                              onChange={(e) => atualizarCampo(cp.id, 'campo', e.target.value)}
                              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">-- Selecione --</option>
                              {/* Manter o campo atual mesmo se já selecionado */}
                              {cp.campo && !camposDisponiveis.find(c => c.nome === cp.campo) && (
                                <option value={cp.campo}>
                                  {cp.campo}
                                  {campoSelecionado?.is_foreign_key
                                    ? ` (FK → ${campoSelecionado.referenced_table || "?"})`
                                    : ""}
                                </option>
                              )}
                              {camposDisponiveis.map((c, inde) => (
                                <option key={c.nome + "_" + inde} value={c.nome}>
                                  {c.nome}
                                  {c.is_foreign_key
                                    ? ` (FK → ${c.referenced_table || "?"})`
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Valor */}
                          <div>
                            <label className="block text-sm font-medium mb-1">Valor</label>
                            <DynamicInputByType
                              enum_values={campoSelecionado?.enum_valores_encontrados}
                              type={campoSelecionado?.tipo || "text"}
                              value={cp.valor}
                              onChange={(val) => atualizarCampo(cp.id, 'valor', val)}
                              disabled={campoSelecionado?.is_auto_increment}
                              aria-invalid={!!temErro}
                            />
                          </div>
                        </div>

                        {/* Alertas do campo */}
                        {campoSelecionado && (
                          <div className="mt-3 space-y-2">
                            {campoSelecionado.is_foreign_key && (
                              <p className="text-sm text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Este campo é chave estrangeira → depende de valores em{" "}
                                <span className="font-bold">
                                  {campoSelecionado.referenced_table}
                                </span>{" "}
                                ({campoSelecionado.field_references})
                              </p>
                            )}
                            {!campoSelecionado.is_nullable && !campoSelecionado.default && (
                              <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Este campo é obrigatório e não possui valor padrão.
                              </p>
                            )}
                            <p className="text-sm text-blue-600">
                              Tipo: <span className="font-bold">{campoSelecionado.tipo}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {Object.values(camposDisponiveis).every(campos => campos.length === 0) &&
                  camposPadronizados.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Todos os campos disponíveis foram selecionados para suas respectivas tabelas.
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={() => setChooseOp(0)}
            className="px-4 py-2 rounded-lg border text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Voltar
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={tabelas.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Gerar {quantidade} registro{quantidade !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}