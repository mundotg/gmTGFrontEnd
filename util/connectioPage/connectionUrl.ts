// util/connectioPage/connectionUrl.ts
//
// Apoio ao modo "ligar por URL" de cada tipo de base de dados.
//
// Quem interpreta a URL é o BACKEND: o formulário só a limpa, confirma que o
// esquema corresponde ao tipo escolhido e envia-a cifrada (ver
// `buildConnectionPayload`). Assim as opções que o fornecedor mete na URL
// (`channel_binding`, `retryWrites`, `options=…`) chegam intactas ao driver,
// em vez de se perderem numa reconstrução a partir de campos.

import { Dbtype } from "@/types";

/** Exemplos mostrados debaixo do campo, por tipo de base de dados. */
export const CONNECTION_URL_EXAMPLES: Record<string, string[]> = {
  postgresql: [
    "postgresql://utilizador:senha@host:5432/base",
    "postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require",
  ],
  mysql: [
    "mysql://utilizador:senha@host:3306/base",
    "mysql://root:senha@127.0.0.1:3306/loja",
  ],
  sqlserver: [
    "sqlserver://utilizador:senha@host:1433/base?trustServerCertificate=yes",
    "mssql+pyodbc://sa:senha@host:1433/erp",
  ],
  oracle: [
    "oracle://utilizador:senha@host:1521/XEPDB1",
    "oracle+cx_oracle://scott:tiger@host:1521/?service_name=orcl",
  ],
  mongodb: [
    "mongodb://utilizador:senha@host:27017/base?authSource=admin",
    "mongodb+srv://utilizador:senha@cluster0.abc.mongodb.net/base?retryWrites=true",
  ],
  sqlite: ["sqlite:///caminho/para/base.db", "sqlite:////var/lib/app.db"],
};

/** Esquemas aceites → tipo de base de dados do `constant/databases`. */
const SCHEME_TO_TYPE: Record<string, Dbtype> = {
  postgres: "postgresql",
  postgresql: "postgresql",
  pg: "postgresql",
  mysql: "mysql",
  mariadb: "mysql",
  mongodb: "mongodb",
  "mongodb+srv": "mongodb",
  mssql: "sqlserver",
  sqlserver: "sqlserver",
  oracle: "oracle",
  sqlite: "sqlite",
  sqlite3: "sqlite",
};

const NOME_POR_TIPO: Record<string, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlserver: "SQL Server",
  oracle: "Oracle",
  mongodb: "MongoDB",
  sqlite: "SQLite",
};

/**
 * Remove o que costuma vir colado com a URL: `DATABASE_URL=`, `export `,
 * aspas e as quebras de linha que os painéis web metem ao copiar.
 */
export const cleanConnectionUrl = (raw: string): string => {
  let texto = (raw || "").trim().replace(/\s+/g, "");
  texto = texto.replace(/^export/i, "");
  texto = texto.replace(/^[A-Za-z_][A-Za-z0-9_]*=/, "");
  texto = texto.replace(/^["'`]|["'`]$/g, "");
  return texto.trim();
};

/** Esquema da URL, já sem o sufixo do driver (`postgresql+psycopg2` → `postgresql`). */
const esquemaDe = (url: string): string => {
  const m = /^([A-Za-z][A-Za-z0-9+.\-]*):/.exec(url);
  if (!m) return "";

  const esquema = m[1].toLowerCase();
  return esquema === "mongodb+srv" ? esquema : esquema.split("+")[0];
};

export type ConnectionUrlCheck =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Valida a URL contra o tipo escolhido no formulário.
 *
 * Não tenta adivinhar nem corrigir: só recusa o que o backend também
 * recusaria, para o erro aparecer antes do pedido e não como "falha ao ligar".
 */
export const checkConnectionUrl = (
  raw: string,
  selectedDb: string
): ConnectionUrlCheck => {
  const url = cleanConnectionUrl(raw);

  if (!url) {
    return { ok: false, error: "Cole a URL de conexão." };
  }

  const esquema = esquemaDe(url);

  if (!esquema || (!url.includes("://") && esquema !== "sqlite" && esquema !== "sqlite3")) {
    return {
      ok: false,
      error:
        "Formato não reconhecido. A URL começa pelo esquema, por exemplo " +
        (CONNECTION_URL_EXAMPLES[selectedDb]?.[0] ?? CONNECTION_URL_EXAMPLES.postgresql[0]),
    };
  }

  const tipoDaUrl = SCHEME_TO_TYPE[esquema];

  if (!tipoDaUrl) {
    return {
      ok: false,
      error: `Esquema "${esquema}" não suportado. Aceites: postgresql, mysql, mariadb, sqlserver/mssql, oracle, mongodb, sqlite.`,
    };
  }

  if (selectedDb && tipoDaUrl !== selectedDb) {
    return {
      ok: false,
      error: `Esta URL é de ${NOME_POR_TIPO[tipoDaUrl] ?? tipoDaUrl}, mas o tipo selecionado é ${
        NOME_POR_TIPO[selectedDb] ?? selectedDb
      }. Troque o tipo ou a URL.`,
    };
  }

  return { ok: true, url };
};
