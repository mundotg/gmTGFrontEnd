/**
 * Dados legais usados nos Termos de Serviço e na Política de Privacidade.
 *
 * Um só sítio para preencher: tudo o que começa por "[" é tratado como por
 * definir e faz aparecer o aviso "documento em preparação" no topo das
 * páginas — para os documentos não irem para produção incompletos sem que
 * ninguém repare.
 */
export const LEGAL = {
  serviceName: "MustaInfo",
  /** Entidade que presta o serviço e é responsável pelo tratamento. */
  entityName: "[Nome legal da empresa — a definir]",
  nif: "[NIF — a definir]",
  address: "[Morada completa — a definir]",
  /** Email para pedidos de privacidade, eliminação de conta e contacto geral. */
  contactEmail: "[email de contacto — a definir]",
  /** País/região onde ficam os servidores (aplicação, base de dados, ficheiros). */
  hostingLocation: "[país/região dos servidores — a definir]",
  /** Foro para litígios. */
  jurisdiction: "Comarca de Luanda, República de Angola",
  version: "1.0",
  lastUpdated: "28 de setembro de 2026",
} as const;

export const isPending = (value: string) => value.trim().startsWith("[");

export const legalHasPendingFields = () =>
  Object.values(LEGAL).some((v) => typeof v === "string" && isPending(v));
