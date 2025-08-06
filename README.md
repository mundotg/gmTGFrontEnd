
---

## 🖥️ Componentes Importantes

| Componente | Descrição |
|------------|-----------|
| **Sidebar.tsx** | Navegação lateral fixa |
| **Header.tsx** | Cabeçalho com informações do usuário |
| **InteractiveResultTable.tsx** | Tabela interativa com paginação e filtros |
| **query-builder-component.tsx** | Construtor visual de consultas SQL |
| **MetadataModal.tsx** | Exibe metadados de tabelas |
| **TableSelectModal.tsx** | Seleção rápida de tabelas |
| **FiltroCondicaoItem.tsx** | Filtros avançados para consultas |
| **DynamicInputByType.tsx** | Entrada adaptável ao tipo de dado |
| **ScrollableTable.tsx** | Tabela com rolagem otimizada |

---

## 🛠️ Arquitetura Simplificada
## 🛠️ Arquitetura Simplificada

```mermaid
graph TD
    subgraph Frontend [Frontend - Next.js 14]
        UI[Interface do Usuário]
        Components[Componentes Reutilizáveis]
        State[Zustand - Estado Global]
        APIService[Serviços de API - Axios]
    end

    subgraph Backend [Backend / API]
        Auth[Autenticação]
        QueryExec[Executor de Consultas SQL]
        DBConn[Gerenciador de Conexões]
    end

    subgraph Database [Bancos de Dados]
        SQL1[(PostgreSQL)]
        SQL2[(MySQL)]
        SQL3[(SQL Server)]
    end

    UI --> Components
    Components --> State
    State --> APIService
    APIService --> Backend
    Backend --> Database
    DBConn --> SQL1
    DBConn --> SQL2
    DBConn --> SQL3



# 1. Clonar o repositório
git clone https://github.com/seu-usuario/gestor-bd-frontend.git

# 2. Entrar na pasta do projeto
cd gestor-bd-frontend

# 3. Instalar dependências
npm install

# 4. Rodar em ambiente de desenvolvimento
npm run dev

# 5. Compilar para produção
npm run build

# 6. Iniciar aplicação em produção
npm start
