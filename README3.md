# 🖥️ Frontend – Plataforma Analítica e Gestão de Dados

O **Frontend da Plataforma Analítica e Gestão de Dados** é uma aplicação web moderna desenvolvida para  **visualizar, analisar e operar dados de múltiplas bases de dados** , integrando-se a um backend em FastAPI.

Este frontend não é apenas uma interface administrativa: ele foi pensado como uma  **camada de análise, visualização e operação de dados** , apoiando  **tomada de decisão, governança e produtividade** .

---

## 🎯 Objetivo do Frontend

Fornecer uma experiência visual e interativa para:

* Explorar estruturas de bases de dados
* Executar e analisar consultas SQL
* Gerenciar tabelas, atributos e transações
* Visualizar métricas e estatísticas
* Executar **backup e restore**
* Realizar **transações entre diferentes bases de dados**
* Facilitar a **digitalização de dados via OCR**

---

## 🧱 Arquitetura do Frontend

* **Framework:** Next.js 14 (App Router)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS
* **Comunicação com API:** Axios (REST)
* **Renderização eficiente:** Virtualização de tabelas (grandes volumes)
* **Internacionalização (i18n):** PT / EN

O frontend segue uma arquitetura  **componentizada e orientada a domínio** , facilitando manutenção e escalabilidade.

---

## 🧭 Navegação Principal

### Sidebar

* Dashboard
* Consultas
* Tabelas
* SQL Avançado
* Conexões
* Histórico
* OCR (Digitalização)
* Configurações

### Header

* Identificação do usuário
* Tema claro/escuro
* Ações rápidas
* Logout

---

## 🧠 Funcionalidades Principais

### 🔍 Consultas e Análise de Dados

* Execução de consultas SQL simples e avançadas
* Visualização de resultados com paginação e filtros
* Destaque de status e performance das queries
* Exportação de resultados

### 📊 Visualização e Estatísticas

* Cards de métricas
* Estatísticas de uso do banco
* Identificação de gargalos e tabelas críticas

### 🗂️ Gestão de Estrutura de Dados

* Criação, edição e **eliminação de tabelas**
* Edição e **remoção de atributos (colunas)**
* Visualização de PK, FK e relacionamentos
* Validações antes da execução de operações destrutivas

### 🔁 Transações de Dados

* Interface para **transações ACID**
* Transferência de dados entre **diferentes tipos de bases de dados**
* Monitoramento de execução e rollback visual

### 💾 Backup e Restore

* Interface dedicada para backup
* Restauração segura de bases de dados
* Histórico de operações de backup

### 🧾 Histórico e Auditoria

* Histórico de queries executadas
* Filtros por usuário, data e tipo
* Apoio à governança e rastreabilidade

### 🧠 OCR – Digitalização de Dados

* Upload de imagens com texto
* Extração automática de texto (OCR)
* Conversão de dados não estruturados em dados estruturados
* Envio direto para o backend para persistência e análise

---

## 🧩 Estrutura do Projeto (Visão Geral)

A aplicação segue o padrão do  **Next.js App Router** , com separação clara entre:

* **Pages (rotas)**
* **Componentes reutilizáveis**
* **Hooks customizados**
* **Serviços de API**
* **Contextos globais (estado e sessão)**

> A organização foi pensada para suportar um frontend grande, com múltiplos domínios de dados.

---

## 🔗 Integração com o Backend

O frontend consome uma API REST que fornece:

* Execução de consultas SQL
* Metadados de banco de dados
* Estatísticas e KPIs
* Operações de gestão (CRUD, backup, restore)
* OCR e ingestão de dados

A comunicação é feita via  **Axios** , com tratamento centralizado de erros e autenticação.

---

## 📈 Valor Analítico Gerado

A interface permite que usuários técnicos e analíticos:

* Identifiquem gargalos de performance
* Tomem decisões baseadas em métricas reais
* Reduzam riscos operacionais
* Acelerem processos de análise e digitalização de dados

---

## ▶️ Como Executar o Projeto

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/gestor-bd-frontend.git

# 2. Entrar no diretório
cd gestor-bd-frontend

# 3. Instalar dependências
npm install

# 4. Executar em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em:

```
http://localhost:3000
```

---

## 🧭 Próximos Passos

* Dashboards analíticos avançados
* Visualização de relacionamentos (data lineage)
* Alertas visuais em tempo real
* Integração com modelos de Machine Learning

---

## 🧑‍💻 Autor

**Francemy Eduardo Sebastião**
Frontend & Data Platform Developer

---

## 📜 Licença

Este projeto está licenciado sob a  **MIT License** .
