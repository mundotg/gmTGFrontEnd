import { CampoDetalhado } from "@/types";

export type Props = {
    text: string;
    fields?: CampoDetalhado[];
    onComplete?: (mappedValues: Record<string, string>) => void;
    valuesDefault?: Record<string, string>; // Valores pré-definidos
    onClose: () => void;
};

export type DragPayload =
    | { type: "token"; value: string, fromField?: string; index?: number }
    | { type: "line"; value: string[], fromField?: string; index?: number }
    | { type: "lineblock"; value: string, fromField?: string; index?: number };

export const DEFAULTFIELDS: CampoDetalhado[] = [
    // ==========================================
    // 1. DADOS PESSOAIS
    // ==========================================
    { nome: "nome_completo", tipo: "text", is_nullable: false } as CampoDetalhado,
    { nome: "numero_bi", tipo: "text", is_nullable: false } as CampoDetalhado,
    { nome: "data_nascimento", tipo: "date", is_nullable: false } as CampoDetalhado,
    { nome: "genero", tipo: "text", is_nullable: false } as CampoDetalhado,
    { nome: "estado_civil", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "nacionalidade", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "nome_pai", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "nome_mae", tipo: "text", is_nullable: true } as CampoDetalhado,

    // ==========================================
    // 2. CONTACTOS E MORADA
    // ==========================================
    { nome: "email", tipo: "text", is_nullable: false } as CampoDetalhado,
    { nome: "telefone", tipo: "text", is_nullable: false } as CampoDetalhado,
    { nome: "telefone_alternativo", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "provincia_residencia", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "municipio_residencia", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "endereco_completo", tipo: "text", is_nullable: true } as CampoDetalhado,

    // ==========================================
    // 3. DADOS ACADÉMICOS
    // ==========================================
    { nome: "numero_estudante", tipo: "text", is_nullable: true } as CampoDetalhado, // Nullable porque na candidatura ainda não tem
    { nome: "curso", tipo: "text", is_nullable: false } as CampoDetalhado,
    { nome: "grau_academico", tipo: "text", is_nullable: false } as CampoDetalhado, // Ex: Licenciatura, Mestrado, Doutoramento
    { nome: "ano_ingresso", tipo: "number", is_nullable: false } as CampoDetalhado,
    { nome: "turno", tipo: "text", is_nullable: true } as CampoDetalhado, // Ex: Manhã, Tarde, Pós-Laboral
    { nome: "media_acesso", tipo: "float", is_nullable: true } as CampoDetalhado, // O float permite casas decimais (ex: 14.5)

    // ==========================================
    // 4. DADOS FINANCEIROS / ADMINISTRATIVOS
    // ==========================================
    { nome: "bolseiro", tipo: "bit", is_nullable: true } as CampoDetalhado, // Aceita true/false
    { nome: "entidade_patronal", tipo: "text", is_nullable: true } as CampoDetalhado,
    { nome: "valor_propina", tipo: "float", is_nullable: true } as CampoDetalhado,
];