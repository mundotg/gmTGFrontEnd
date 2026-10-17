import { Article } from "./types";

export const INITIAL_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Consolidação Sináptica no Sono REM e a Retenção de Conhecimento Complexo",
    summary: "Como as oscilações teta e os fusos de sono reativam redes neurais hipocampais para transferir memórias de curto prazo para o córtex pré-frontal.",
    body_markdown: `## Introdução e Fundamentação

A consolidação de memória não é um processo passivo de decaimento temporal, mas sim uma reorganização biológica ativa que ocorre preferencialmente durante os estágios de sono profundo e sono de movimentos oculares rápidos (REM).

### Mecanismos Moleculares
Durante o sono de ondas lentas (NREM), padrões de disparo síncronos no hipocampo conhecidos como *sharp-wave ripples* (SWRs) reproduzem sequências neuronais vivenciadas durante a vigília. Este fenômeno, denominado **reativação hipocampal**, sinaliza ao neocórtex as conexões sinápticas que devem sofrer potenciação a longo prazo (LTP).

\`\`\`python
# Simulação simplificada de pesos sinápticos antes e depois do sono
def simulate_synaptic_weight(initial_weight, replay_events, decay_factor=0.98):
    weight = initial_weight
    for _ in range(replay_events):
        weight = (weight * decay_factor) + 0.15
    return min(weight, 1.0)

print(f"Potenciação consolidada: {simulate_synaptic_weight(0.2, 50):.2f}")
\`\`\`

### Evidência Empírica
Estudos longitudinais com fMRI funcional demonstraram que indivíduos privados de sono após sessões de aprendizagem de conceitos abstratos sofrem uma perda de retenção de até 40% em comparação com grupos com períodos preservados de sono.

| Fase do Sono | Tipo de Memória Consolidada | Biomarcadores Principais |
| :--- | :--- | :--- |
| NREM Estágio 3 | Memória Declarativa e Fatos | Ondas Delta (< 4 Hz), Fusos |
| Sono REM | Memória Procedimental e Criativa | Ritmo Teta (4-8 Hz), Acetilcolina |

### Conclusão
O sono é parte indissociável da engenharia de aprendizagem. Reduzir as horas de descanso reduz a integridade da plasticidade sináptica cortical.`,
    author: {
      id: "usr-1",
      name: "Dra. Teresa Van-Dúnem",
      title: "Neurocientista & Investigadora",
      institution: "Centro de Neurociências Cognitivas",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    category: "Ciência e tecnologia",
    subcategory: "Neurociência",
    content_type: "cientifico",
    min_age: "all",
    status: "published",
    published_at: "2026-10-15T14:30:00Z",
    read_time_minutes: 2,
    tags: ["Neurociência", "Aprendizagem", "Sono", "Memória", "Biologia"],
    cover_image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80",
    sources: [
      {
        title: "Hippocampal replay and the consolidation of declarative memory in human neocortex",
        authors: "Diekelmann, S. & Born, J.",
        year: 2024,
        journal: "Nature Reviews Neuroscience",
        doi: "10.1038/nrn.2024.182",
        verified: true,
      },
      {
        title: "Synaptic plasticity and sleep-dependent memory stabilization",
        authors: "Tononi, G. & Cirelli, C.",
        year: 2023,
        journal: "Science Direct Neurobiology",
        doi: "10.1016/j.neuron.2023.05.011",
        verified: true,
      },
    ],
    mentions: [
      { name: "Dr. Matthew Walker", role: "Investigador de Sono e Memória" },
    ],
    metrics: {
      views: 1240,
      bookmarks: 318,
      comments_count: 24,
    },
  },
  {
    id: "art-2",
    title: "A Origem do Fenómeno Déjà-Vu: Descompasso de Latência Neural no Lobo Temporal",
    summary: "Por que o cérebro tem a nítida sensação de repetição visual e como o hipocampo correlaciona estímulos sensoriais paralelos com milissegundos de atraso.",
    body_markdown: `## O Mistério do Déjà-Vu

O déjà-vu (expressão francesa para "já visto") é uma ilusão sensorial temporária em que uma experiência nova é sentida como uma repetição idêntica do passado.

### A Teoria do Descompasso Temporal
A explicação neurológica mais consistente é a **teoria da via dupla**. Quando observamos uma cena, os sinais sensoriais são transmitidos ao cérebro através de múltiplas vias neurais simultâneas:
1. Uma via primária mais rápida e direta ao tálamo e lobo temporal.
2. Uma via secundária com atraso de milissegundos.

Se houver uma micro-dessincronização entre essas vias, o cérebro interpreta o segundo sinal não como continuação do primeiro, mas como uma evocação de memória antiga.

> "O déjà-vu é essencialmente um erro de verificação de fatos do cérebro — um breve soluço no sistema de validação de familiaridade sem dados de suporte."

### Fatos e Curiosidades
- Ocorre com mais frequência entre jovens dos 15 aos 25 anos.
- Pessoas com maior nível de leitura e viagens relatam incidência ligeiramente superior.
- Não possui correlação com patologias neurológicas em indivíduos saudáveis.`,
    author: {
      id: "usr-2",
      name: "Eng. Manuel Sebastião",
      title: "Divulgador Científico",
      institution: "MustInfo Labs",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    category: "Psicologia e comportamento humano",
    subcategory: "Percepção",
    content_type: "curiosidade",
    min_age: "all",
    status: "published",
    published_at: "2026-10-14T09:15:00Z",
    read_time_minutes: 1,
    tags: ["Curiosidade", "Psicologia", "Cérebro", "Percepção", "Cognição"],
    cover_image: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&auto=format&fit=crop&q=80",
    sources: [
      {
        title: "Clinical and experimental aspects of déjà vu phenomenon",
        authors: "Brown, Alan S.",
        year: 2022,
        journal: "Brain and Cognition",
        doi: "10.1016/j.bandc.2022.105820",
        verified: true,
      },
    ],
    metrics: {
      views: 2890,
      bookmarks: 540,
      comments_count: 42,
    },
  },
  {
    id: "art-3",
    title: "Minha Jornada de 18 Meses Construindo Pipelines de Dados em Angola",
    summary: "Relato pessoal e prático sobre infraestrutura de dados em cenários reais com instabilidade de rede, adoção de bancos relacionais e telemetria resiliente.",
    body_markdown: `## O Contexto Prático

Trabalhar com infraestrutura e engenharia de dados em mercados emergentes exige pragmatismo. Quando iniciei este percurso, a maioria dos tutoriais internacionais assumia conexões de fibra de 1 Gbps sem interrupções e nuvem abundante.

### Os Desafios Encontrados
- **Latência e Quedas de Conexão:** Jobs ETL que falhavam no meio da ingestão precisavam de checkpoints atômicos.
- **Custos de Nuvem:** Optar por PostgreSQL autogerenciado e instâncias locais economizou recursos vitais.
- **Cultura de Dados:** Ensinar às equipes a diferença entre consultas otimizadas e 'SELECT *' foi a maior vitória.

### Aviso de Isenção
*Este relato reflete a minha vivência pessoal em empresas de Luanda e projetos autônomos. Não constitui uma receita única para todas as empresas ou ecossistemas.*`,
    author: {
      id: "usr-3",
      name: "Francemy Sebastião",
      title: "Arquiteto de Software & Engenheiro de Dados",
      institution: "MustInfo Ecosystem",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    category: "Vida profissional",
    subcategory: "Engenharia de Dados",
    content_type: "experiencia",
    min_age: "all",
    status: "published",
    published_at: "2026-10-12T11:00:00Z",
    read_time_minutes: 1,
    tags: ["Angola", "Engenharia de Dados", "PostgreSQL", "Experiência", "Carreira"],
    cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    metrics: {
      views: 3410,
      bookmarks: 720,
      comments_count: 65,
    },
  },
  {
    id: "art-4",
    title: "Modelos de Dados Isolados vs. Monolitos em Arquiteturas Multi-tenant",
    summary: "Uma análise comparativa entre particionamento por schema, bases independentes e segregação lógica por tenant ID em ecossistemas de alta segurança.",
    body_markdown: `## Arquitetura Multi-Tenant: Trade-offs Reais

A decisão de como isolar dados de diferentes clientes ou subprodutos afeta drasticamente custo operacional, risco de vazamento de dados e facilidade de manutenção.

### Comparativo das 3 Abordagens

1. **Database-per-tenant (Bases Independentes)**
   - *Vantagens:* Isolamento criptográfico absoluto, backups individuais facilitados.
   - *Desvantagens:* Alto custo de infraestrutura e sobrecarga de migrações em lote.

2. **Schema-per-tenant (Schemas no PostgreSQL)**
   - *Vantagens:* Compartilha a mesma instância de PostgreSQL mas mantém separação relacional nítida.
   - *Desvantagens:* Limite de tabelas e conexões por cluster.

3. **Shared Database com Tenant ID (Segregação Lógica)**
   - *Vantagens:* Custo mínimo e consultas globais facilitadas.
   - *Desvantagens:* Risco crítico de regressão em cláusulas WHERE mal construídas.`,
    author: {
      id: "usr-4",
      name: "Eng. Rui Santos",
      title: "Database Reliability Engineer",
      institution: "Enterprise Data Systems",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    category: "Ciência e tecnologia",
    subcategory: "Bancos de Dados",
    content_type: "analise",
    min_age: "all",
    status: "published",
    published_at: "2026-10-10T16:20:00Z",
    read_time_minutes: 1,
    tags: ["PostgreSQL", "Arquitetura", "Multi-tenant", "Segurança", "SQL"],
    cover_image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
    sources: [
      {
        title: "Multi-Tenant Data Architecture Strategies in PostgreSQL",
        authors: "Hellerstein, J. et al.",
        year: 2023,
        journal: "ACM Transactions on Database Systems",
        doi: "10.1145/3588921",
        verified: true,
      },
    ],
    metrics: {
      views: 1850,
      bookmarks: 410,
      comments_count: 18,
    },
  },
  {
    id: "art-5",
    title: "Por Que a Filosofia Estoica Ajuda a Lidar com Pressão e Burnout em Tecnologia?",
    summary: "A dicotomia do controle de Epicteto e como o distanciamento cognitivo mitiga ansiedade em ambientes corporativos e prazos agressivos.",
    body_markdown: `## A Dicotomia do Controle

O filósofo estoico Epicteto formulou uma das teses mais pragmáticas da filosofia clássica:
> "Das coisas que existem, algumas dependem de nós e outras não dependem de nós."

### Aplicação Prática no Trabalho
No desenvolvimento de software ou gestão de crises:
- **O que depende de nós:** A qualidade do código escrito, a clareza na comunicação, a atitude diante do erro e o gerenciamento do próprio tempo.
- **O que não depende de nós:** A aprovação externa, decisões repentinas de mercado, instabilidades de provedores externos e reações alheias.

Quando focamos a energia estritamente nas variáveis sob o nosso controle, a ruminação mental reduz consideravelmente.`,
    author: {
      id: "usr-5",
      name: "Prof. Alberto Miranda",
      title: "Docente de Filosofia & Comportamento",
      institution: "Instituto de Humanidades",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
    category: "Filosofia",
    subcategory: "Estoicismo",
    content_type: "opiniao",
    min_age: "all",
    status: "published",
    published_at: "2026-10-08T08:45:00Z",
    read_time_minutes: 1,
    tags: ["Filosofia", "Estoicismo", "Saúde Mental", "Comportamento", "Liderança"],
    cover_image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
    metrics: {
      views: 2120,
      bookmarks: 630,
      comments_count: 31,
    },
  },
  {
    id: "art-6",
    title: "A Fascinante Inteligência das Formigas e a Otimização por Colônia (ACO)",
    summary: "Como trilhas de feromônios biológicos inspiraram os algoritmos meta-heurísticos que otimizam roteamento de tráfego e redes logísticas globais.",
    body_markdown: `## Da Natureza para a Computação

Formigas individuais possuem cérebros minúsculos com poucos neurônios. No entanto, uma colônia de formigas demonstra um comportamento coletivo de inteligência extraordinário (*swarming intelligence*).

### O Algoritmo de Otimização por Colônia (ACO)
Proposto originalmente por Marco Dorigo na década de 1990, o algoritmo Ant Colony Optimization modela a deposição e evaporação de feromônios para encontrar os caminhos mais curtos em grafos complexos:

1. Formigas exploram caminhos aleatórios em busca de alimento.
2. Ao encontrar comida, retornam depositando feromônio.
3. Caminhos mais curtos são percorridos mais rapidamente, acumulando feromônio mais depressa.
4. O feromônio em caminhos mais longos evapora antes de ser reforçado.

Hoje, variantes desse algoritmo são usadas por companhias aéreas, telecomunicações e plataformas de entrega urbana.`,
    author: {
      id: "usr-2",
      name: "Eng. Manuel Sebastião",
      title: "Divulgador Científico",
      institution: "MustInfo Labs",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    category: "Ciência e tecnologia",
    subcategory: "Inteligência Artificial",
    content_type: "curiosidade",
    min_age: "all",
    status: "published",
    published_at: "2026-10-05T13:10:00Z",
    read_time_minutes: 1,
    tags: ["Biologia", "Algoritmos", "Inteligência Artificial", "Curiosidade", "Matemática"],
    cover_image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    sources: [
      {
        title: "Ant colony optimization: overview and recent advances",
        authors: "Dorigo, M. & Stützle, T.",
        year: 2021,
        journal: "IEEE Computational Intelligence Magazine",
        doi: "10.1109/MCI.2021.3060232",
        verified: true,
      },
    ],
    metrics: {
      views: 3100,
      bookmarks: 890,
      comments_count: 53,
    },
  },
];
