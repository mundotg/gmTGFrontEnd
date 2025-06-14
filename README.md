

## 🧱 **1. Estrutura Geral do Projeto (Arquitetura de Pastas)**

```
/src
│
├── app/                     → Rotas (Next.js 13+)
│   ├── dashboard/           → Página principal (home do usuário logado)
│   ├── consultas/           → Módulo de consultas simplificadas
│   ├── tabelas/             → Listagem e detalhes de tabelas
│   ├── sql/                 → Editor de SQL avançado
│   ├── historico/           → Histórico de consultas
│   ├── conexoes/            → Gerenciador de conexões
│   ├── login/               → Página de autenticação
│   ├── settings/            → Configurações gerais
│   └── layout.tsx          → Layout base para navegação
│
├── components/              → Componentes reutilizáveis (inputs, tabelas, modais, etc)
│   ├── TableViewer.tsx
│   ├── SQLConsole.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Modal.tsx
│
├── lib/                     → Funções utilitárias
│   ├── api.ts               → Cliente Axios ou Fetch
│   ├── databaseHelpers.ts   → Helpers para manipulação de dados
│
├── services/                → Comunicação com o backend (API)
│   ├── queryService.ts
│   ├── tableService.ts
│   └── authService.ts
│
├── hooks/                   → Custom hooks
│   └── useAuth.ts
│
├── store/                   → Zustand ou Redux para estado global
│
├── styles/                  → Estilização global (Tailwind ou CSS modules)
│
├── types/                   → Tipagens globais TypeScript
│
└── middleware.ts            → Proteção de rotas com autenticação
```

---

## 🖼️ **2. Navegação Principal (Layout)**

* **Sidebar Fixa** com:

  * Dashboard
  * Consultas
  * Tabelas
  * SQL
  * Conexões
  * Histórico
  * Configurações

* **Header** com:

  * Nome do usuário
  * Tema claro/escuro
  * Botão de logout

---

## 🧠 **3. Páginas-Chave e Componentes**

### 🔎 Consultas Simplificadas

* Componente: `SimpleQueryForm`
* Entrada: nome da tabela
* Resultado: tabela paginada com filtros

### 📂 Tabelas e Validações

* Componente: `TableDetailViewer`
* Info de cada tabela, tipos de dados, PK/FK, validação automática

### 🧹 Análise de Duplicados

* Componente: `DuplicateAnalyzer`
* Visualiza dados repetidos, marca erros, gera insights

### 🧰 SQL Avançado

* Componente: `SQLConsole` (editor com highlight + terminal)
* Execução em tempo real com resposta formatada

### 📌 Conexões

* Componente: `ConnectionManager`
* Salvar/editar conexões (formulário com validação)

### 🕘 Histórico

* Componente: `QueryHistory`
* Filtros por data, tipo, usuário

---

## 🧪 **4. Tecnologias e Pacotes Sugeridos**

* **UI**: Tailwind CSS + shadcn/ui ou NextUI
* **Editor SQL**: [Monaco Editor](https://github.com/microsoft/monaco-editor)
* **Estado global**: Zustand (leve e simples)
* **Formulários**: React Hook Form + Zod
* **Autenticação**: NextAuth.js ou JWT manual
* **Conexão real-time (futuro)**: Socket.IO para colaboração simultânea
* **Gráficos (futuro dashboard)**: Recharts ou Chart.js

---

## 🔮 **5. Preparação para Funcionalidades Futuras**

### 📊 Visualização de Dados (Dashboard)

* Página: `/dashboard`
* Gráficos com:

  * Crescimento de registros
  * Duplicações
  * Distribuição por tipo

### 🧭 Editor Visual de Relacionamentos

* Página: `/tabelas/relacionamentos`
* Diagrama interativo com [React Flow](https://reactflow.dev/)

### 🔐 Logs e Auditoria

* Página: `/logs`
* Timeline das ações com filtros

### 🤝 Colaboração em Tempo Real

* WebSocket integrado
* Compartilhamento de consultas salvas com outros usuários

---

## 📌 Exemplo de Rota: `Consultas`

```tsx
// src/app/consultas/page.tsx
import { SimpleQueryForm } from "@/components/SimpleQueryForm";
import { QueryResults } from "@/components/QueryResults";

export default function ConsultasPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Consultas Simplificadas</h1>
      <SimpleQueryForm />
      <QueryResults />
    </div>
  );
}
```
