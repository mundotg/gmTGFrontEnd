import React from "react";
import { AlertTriangle } from "lucide-react";
import { LEGAL, isPending, legalHasPendingFields } from "./legalInfo";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface LegalDoc {
  title: string;
  intro: React.ReactNode;
  /** Resumo em linguagem simples, mostrado antes do texto completo. */
  summary?: React.ReactNode[];
  sections: LegalSection[];
}

/** Mostra um valor de LEGAL, destacado enquanto estiver por definir. */
export const Info = ({ value }: { value: string }) =>
  isPending(value) ? (
    <mark className="rounded bg-amber-100 px-1 text-amber-900">{value}</mark>
  ) : (
    <>{value}</>
  );

/* Blocos de texto reutilizados nos dois documentos */
export const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 leading-relaxed">{children}</p>
);
export const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="mb-3 list-disc space-y-1.5 pl-5 leading-relaxed marker:text-gray-400">{children}</ul>
);
export const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 mt-5 text-sm font-bold text-gray-900">{children}</h3>
);
export const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900">{children}</div>
);

/** Tabela que em ecrãs pequenos passa a cartões empilhados. */
export const Table = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
  <div className="mb-4">
    <table className="hidden w-full border-collapse text-left sm:table">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-600">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="align-top">
            {r.map((c, j) => (
              <td key={j} className={`border-b border-gray-100 px-3 py-2 ${j === 0 ? "font-semibold text-gray-900" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <div className="space-y-2 sm:hidden">
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3">
          <p className="mb-1.5 font-semibold text-gray-900">{r[0]}</p>
          {r.slice(1).map((c, j) => (
            <div key={j} className="mb-1 last:mb-0">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{head[j + 1]}: </span>
              {c}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

interface Props {
  doc: LegalDoc;
  /** Dentro de um modal: sem cabeçalho grande e com o índice recolhido. */
  embedded?: boolean;
}

export const LegalDocument: React.FC<Props> = ({ doc, embedded = false }) => {
  const pending = legalHasPendingFields();

  return (
    <article className="text-sm text-gray-700">
      {pending && (
        <div role="note" className="mb-5 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Documento em preparação.</strong> Faltam dados legais da entidade (destacados a amarelo) —
            preencher em <code className="font-mono text-xs">app/auth/_legal/legalInfo.ts</code> antes de publicar.
          </span>
        </div>
      )}

      {!embedded && <h1 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">{doc.title}</h1>}
      <p className="mb-5 text-xs text-gray-500">
        Versão {LEGAL.version} · Última atualização: {LEGAL.lastUpdated}
      </p>

      <div className="mb-5">{doc.intro}</div>

      {doc.summary && doc.summary.length > 0 && (
        <section className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <h2 className="mb-2 text-sm font-bold text-blue-900">Em resumo</h2>
          <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-blue-950 marker:text-blue-400">
            {doc.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="mb-6 rounded-xl border border-gray-200 p-4" open={!embedded}>
        <summary className="cursor-pointer text-sm font-bold text-gray-900">Índice</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          {doc.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-blue-700 hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </details>

      {doc.sections.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-gray-100 pt-5 [&:not(:last-child)]:mb-5">
          <h2 className="mb-3 text-base font-bold text-gray-900">
            {i + 1}. {s.title}
          </h2>
          {s.content}
        </section>
      ))}
    </article>
  );
};
