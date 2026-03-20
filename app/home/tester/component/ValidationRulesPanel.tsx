"use client";

import React from "react";

type ValidationRulesPanelProps = {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
};

const defaultPlaceholder = `{
  "statusCode": [200, 201],
  "maxTime": 1000,
  "maxSize": 100000,
  "requiredFields": ["id", "name", "email", "data.user.id"]
}`;

export default function ValidationRulesPanel({
  value,
  onChange,
  title = "Regras de Validação (JSON)",
  placeholder = defaultPlaceholder,
}: ValidationRulesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-2 block">
            {title}
          </label>

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-40 bg-slate-950 border border-slate-700 rounded p-3 text-xs font-mono outline-none focus:border-cyan-500 transition resize-none"
          />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">
            Como usar as regras de validação
          </h4>

          <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
            <p>
              As validações são aplicadas após executar um teste na aba
              <span className="text-slate-200 font-medium"> Teste Único</span>.
            </p>
            <p>
              Cada propriedade do JSON define uma regra para verificar a resposta da API.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-slate-700 p-3 bg-slate-950/60">
              <p className="font-semibold text-slate-200 mb-1">statusCode</p>
              <p className="text-slate-400">
                Aceita um número ou uma lista de códigos válidos.
              </p>
              <p className="font-mono text-slate-300 mt-2">"statusCode": 200</p>
              <p className="font-mono text-slate-300">"statusCode": [200, 201]</p>
            </div>

            <div className="rounded border border-slate-700 p-3 bg-slate-950/60">
              <p className="font-semibold text-slate-200 mb-1">maxTime</p>
              <p className="text-slate-400">
                Tempo máximo permitido para a resposta, em milissegundos.
              </p>
              <p className="font-mono text-slate-300 mt-2">"maxTime": 1000</p>
            </div>

            <div className="rounded border border-slate-700 p-3 bg-slate-950/60">
              <p className="font-semibold text-slate-200 mb-1">maxSize</p>
              <p className="text-slate-400">
                Tamanho máximo da resposta, em bytes.
              </p>
              <p className="font-mono text-slate-300 mt-2">"maxSize": 100000</p>
            </div>

            <div className="rounded border border-slate-700 p-3 bg-slate-950/60">
              <p className="font-semibold text-slate-200 mb-1">requiredFields</p>
              <p className="text-slate-400">
                Lista de campos obrigatórios no JSON da resposta. Suporta campos aninhados com ponto.
              </p>
              <p className="font-mono text-slate-300 mt-2">
                "requiredFields": ["id", "data.user.name"]
              </p>
            </div>
          </div>

          <div className="rounded border border-cyan-800 bg-cyan-950/20 p-3">
            <p className="text-xs text-cyan-200 font-medium mb-1">Fluxo recomendado</p>
            <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
              <li>Defina as regras nesta aba.</li>
              <li>Vá para <span className="font-semibold">Teste Único</span>.</li>
              <li>Execute o endpoint.</li>
              <li>Veja abaixo da resposta quais regras passaram ou falharam.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}