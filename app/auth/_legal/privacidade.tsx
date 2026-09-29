import React from "react";
import Link from "next/link";
import { LEGAL } from "./legalInfo";
import { H3, Info, LegalDoc, Note, P, Table, UL } from "./LegalDocument";

/*
 * Política de Privacidade — escrita a partir do que o código faz de facto
 * (dados recolhidos, onde ficam, quem os recebe e durante quanto tempo).
 * Ao mudar o comportamento da aplicação nestes pontos, atualizar aqui e subir
 * LEGAL.version / LEGAL.lastUpdated.
 */
export const privacidade: LegalDoc = {
  title: "Política de Privacidade",
  intro: (
    <P>
      Esta política explica, sem letras pequenas, que dados o {LEGAL.serviceName} recolhe, o que faz com eles, com quem
      os partilha e durante quanto tempo os guarda. Inclui o que acontece aos dados das bases de dados que liga à
      plataforma — porque é aí que está normalmente a informação mais sensível.
    </P>
  ),
  summary: [
    <>Guardamos os dados da sua conta (nome, email, empresa, cargo) e a password só em forma irreversível (hash).</>,
    <>
      As credenciais das bases que liga são guardadas cifradas. Mas <strong>as consultas correm a partir dos nossos
      servidores</strong>: os resultados passam por eles e o histórico guarda o texto das consultas e uma
      pré-visualização dos resultados.
    </>,
    <>
      <strong>Backups, histórico, registos técnicos e datasets importados não são apagados automaticamente</strong> —
      ficam até os eliminar ou pedir a eliminação.
    </>,
    <>
      O assistente de IA envia ao Google (Gemini) as mensagens que escreve na conversa. Não envia automaticamente
      tabelas nem resultados.
    </>,
    <>
      Há publicidade do Google (AdSense) em várias páginas, com cookies do Google. Não vendemos os seus dados.
    </>,
  ],
  sections: [
    {
      id: "quem-somos",
      title: "Quem somos e a quem se aplica",
      content: (
        <>
          <P>
            O serviço {LEGAL.serviceName} é prestado por <Info value={LEGAL.entityName} />, NIF <Info value={LEGAL.nif} />,
            com sede em <Info value={LEGAL.address} /> (“nós”). Para qualquer questão sobre privacidade:{" "}
            <Info value={LEGAL.contactEmail} />.
          </P>
          <P>
            Tratamos dados pessoais de acordo com a Lei n.º 22/11, de 17 de Junho (Lei da Protecção de Dados Pessoais da
            República de Angola) e demais legislação aplicável.
          </P>
        </>
      ),
    },
    {
      id: "papeis",
      title: "Os dois papéis que temos",
      content: (
        <UL>
          <li>
            <strong>Dados da sua conta e da utilização da plataforma</strong> — somos o responsável pelo tratamento:
            decidimos para que servem e como são tratados.
          </li>
          <li>
            <strong>Dados que estão nas bases que liga</strong> (clientes, vendas, colaboradores…) — são seus ou da sua
            organização. Tratamo-los apenas por sua conta, quando usa as funcionalidades, como subcontratante. É a sua
            organização que tem de ter fundamento legal para tratar esses dados.
          </li>
        </UL>
      ),
    },
    {
      id: "dados-conta",
      title: "Dados da conta",
      content: (
        <>
          <UL>
            <li>
              <strong>No registo:</strong> nome, apelido, email, número de telefone, nome e dimensão da empresa, cargo
              e a aceitação destes documentos.
            </li>
            <li>
              <strong>Password:</strong> guardada apenas como hash bcrypt — não a conseguimos ler nem recuperar.
            </li>
            <li>
              <strong>Se os adicionar depois:</strong> fotografia de perfil, NIF e morada da empresa.{" "}
              <em>A fotografia de perfil fica acessível a quem tiver o endereço (URL) da imagem.</em>
            </li>
            <li>
              <strong>Gerados pela plataforma:</strong> plano (Free, Pro, Enterprise), função e permissões, estado da
              conta, data de criação e preferências (tema, idioma, fuso horário, notificações).
            </li>
          </UL>
          <P>O email não pode ser alterado na aplicação; para o mudar, contacte-nos.</P>
        </>
      ),
    },
    {
      id: "sessao",
      title: "Sessão, cookies e segurança do acesso",
      content: (
        <>
          <Table
            head={["Cookie", "Para quê", "Duração"]}
            rows={[
              [<code key="a">access_token</code>, "Manter a sessão iniciada (não acessível a scripts da página).", "15 minutos, renovado automaticamente"],
              [<code key="r">refresh_token</code>, "Renovar a sessão sem pedir a password (não acessível a scripts).", "7 dias"],
              [<code key="b">bk_access_token</code>, "Indicar à interface que há sessão iniciada; contém o seu email codificado.", "7 dias"],
              ["Cookies do Google", "Publicidade — ver secção “Publicidade”.", "Definida pelo Google"],
            ]}
          />
          <P>
            Para proteger a conta contra o roubo de sessão, associamos cada sessão a uma <strong>parte</strong> do seu
            endereço IP (os três primeiros blocos em IPv4) e a uma impressão irreversível (hash) da identificação do
            browser. Não guardamos o endereço IP completo nas sessões. Em Conta → Sessões vê as últimas sessões e pode
            terminá-las; alterar a password termina todas.
          </P>
          <P>
            Para travar tentativas de adivinhar passwords, contamos durante 5 minutos as tentativas de login por endereço
            IP e por email.
          </P>
        </>
      ),
    },
    {
      id: "conexoes",
      title: "Conexões às suas bases de dados",
      content: (
        <>
          <P>
            Para cada conexão guardamos: nome, tipo, servidor (host), porta, utilizador, password, nome da base, URL de
            ligação e modo SSL.
          </P>
          <UL>
            <li>
              <strong>Cifrados</strong> (AES-256-GCM): servidor, utilizador, password e URL de ligação.
            </li>
            <li>
              <strong>Não cifrados:</strong> porta, nome da base, tipo e modo SSL.
            </li>
            <li>
              Para poder editar uma conexão, as credenciais são enviadas para o seu browser. Isso acontece também para
              quem tiver acesso a essa conexão — <strong>partilhar uma conexão, mesmo só com acesso de leitura, dá acesso
              às credenciais dela.</strong>
            </li>
            <li>
              Os administradores da plataforma têm acesso técnico a todas as conexões, para suporte e segurança.
            </li>
          </UL>
          <Note>
            Recomendação: ligue o {LEGAL.serviceName} com um utilizador de base de dados próprio, com apenas as
            permissões de que precisa (por exemplo, só leitura se não vai alterar dados).
          </Note>
        </>
      ),
    },
    {
      id: "dados-bases",
      title: "O que acontece aos dados das suas bases",
      content: (
        <>
          <P>
            As funcionalidades ligam-se às suas bases <strong>a partir dos nossos servidores</strong>. Os dados lidos ou
            escritos passam por eles. O que fica guardado depende da funcionalidade:
          </P>
          <Table
            head={["Funcionalidade", "O que acedemos", "O que fica guardado"]}
            rows={[
              [
                "Estrutura da base",
                "Nomes de tabelas e colunas, chaves, valores possíveis de campos enumerados, contagens de linhas.",
                "Esta estrutura, na nossa base de dados, para acelerar a navegação.",
              ],
              [
                "Consultas (construtor de consultas, editor SQL)",
                "As linhas que a consulta devolve.",
                <>
                  No histórico: o texto completo da consulta, filtros e valores usados, duração, erros e uma{" "}
                  <strong>pré-visualização dos resultados, que pode chegar a dezenas de milhares de linhas</strong>.
                  Resultados ficam ainda em cache temporária (segundos a minutos).
                </>,
              ],
              [
                "Inserir, editar e eliminar linhas",
                "As linhas afetadas.",
                "No histórico: o comando SQL com os valores inseridos ou alterados, e a chave de cada linha eliminada.",
              ],
              [
                "Editor SQL",
                "—",
                "Os últimos 100 comandos, até 200 consultas guardadas por si e o rascunho atual (24 horas).",
              ],
              [
                "Backups",
                "Uma cópia completa da base.",
                <>
                  O ficheiro de backup (comprimido) nos nossos servidores. <strong>Não é cifrado individualmente e não é
                  apagado automaticamente.</strong> Os ficheiros que envia para restauro também ficam guardados.
                </>,
              ],
              ["Transferência entre bases", "Os dados transferidos, em lotes.", "Nada — os dados atravessam os servidores sem cópia."],
              [
                "Monitor de bloqueios (deadlocks)",
                "As sessões ativas da base, incluindo o texto das consultas em execução e os utilizadores.",
                "Os últimos 100 eventos, só em memória. Só termina sessões quando o pede.",
              ],
              ["Dados de teste", "—", "Nada: os dados fictícios são inseridos na sua base quando o pede."],
              ["Análise de dados", "Os resultados da consulta analisada.", "Os resultados da análise, em cache durante 5 minutos."],
              [
                "Importação de datasets",
                "O ficheiro enviado (até 50 MB) ou o conteúdo do URL indicado.",
                "Os dados convertidos numa base SQLite nos nossos servidores, sem prazo de eliminação.",
              ],
              [
                "OCR (texto de imagens e PDF)",
                "O documento enviado — processado nos nossos servidores, sem envio a terceiros. Inclui leitura de campos do Bilhete de Identidade quando usa essa opção.",
                "O texto extraído, em cache nos nossos servidores, sem prazo de eliminação.",
              ],
              [
                "Relatórios (PDF, Excel)",
                "Os dados incluídos no relatório.",
                "O ficheiro gerado, temporariamente (cerca de 1 dia).",
              ],
            ]}
          />
          <H3>Ferramentas de teste de segurança e de APIs</H3>
          <P>
            Os testes de login e de carga guardam cada tentativa: os pedidos e respostas (cabeçalhos e conteúdo,
            truncados) e <strong>as credenciais testadas, em texto simples</strong>. As configurações e pedidos
            guardados no testador de APIs ficam associados à sua conta. Estas ferramentas só funcionam contra servidores
            autorizados na plataforma.
          </P>
        </>
      ),
    },
    {
      id: "ficheiros",
      title: "Ficheiros no armazenamento",
      content: (
        <UL>
          <li>
            Os ficheiros que carrega ficam num armazenamento de objetos compatível com S3 (s3.mustainfo.cloud). Se esse
            armazenamento estiver indisponível no momento do envio, é guardada uma cópia nos nossos servidores.
          </li>
          <li>Os links de download são temporários (1 hora).</li>
          <li>
            A password de uma pasta controla o acesso dentro da aplicação — <strong>não cifra os ficheiros</strong>.
          </li>
          <li>
            Eliminar um ficheiro apaga-o do armazenamento. Eliminar uma pasta marca o conteúdo como eliminado; os
            ficheiros podem permanecer no armazenamento até serem limpos.
          </li>
        </UL>
      ),
    },
    {
      id: "ia",
      title: "Assistente de inteligência artificial",
      content: (
        <>
          <P>
            As conversas com o assistente ficam guardadas na plataforma (mensagens, avaliações que deixar e contagem de
            utilização). Para gerar cada resposta, enviamos à <strong>Google (API Gemini)</strong> as últimas 10 mensagens
            dessa conversa.
          </P>
          <UL>
            <li>
              <strong>Não enviamos automaticamente</strong> a estrutura das suas bases, tabelas, resultados de consultas
              nem documentos — só o que escrever na conversa.
            </li>
            <li>
              Não escreva na conversa passwords, credenciais ou dados pessoais de terceiros. O tratamento pela Google
              segue os termos da Google para a API Gemini.
            </li>
          </UL>
        </>
      ),
    },
    {
      id: "registos",
      title: "Registos técnicos (logs)",
      content: (
        <>
          <P>Para operar, diagnosticar erros e investigar incidentes, registamos:</P>
          <UL>
            <li>cada pedido feito à plataforma (endereço da função, resultado e duração);</li>
            <li>o seu email em eventos de login, registo e alterações de conta;</li>
            <li>
              o texto das consultas construídas pela plataforma, com os valores usados, e as mensagens de erro das
              bases de dados — <strong>que podem conter valores dos seus dados</strong>;
            </li>
            <li>parte do endereço IP em eventos de segurança;</li>
            <li>nas conexões: servidor, nome da base e tipo, em eventos de gravação, ativação e partilha.</li>
          </UL>
          <P>
            Estes registos ficam em ficheiro e na nossa base de dados, só acessíveis a administradores da plataforma, e{" "}
            <strong>atualmente não são apagados automaticamente</strong>.
          </P>
        </>
      ),
    },
    {
      id: "browser",
      title: "Dados guardados no seu browser",
      content: (
        <>
          <P>
            Para a aplicação ser rápida e não perder trabalho, guarda dados no armazenamento local do browser (IndexedDB
            e localStorage) deste computador:
          </P>
          <UL>
            <li>preferências (tema, idioma, barra lateral) e o seu email, se escolher “lembrar-me”;</li>
            <li>o seu perfil (nome, email, telefone, função e permissões) e a base de dados ativa;</li>
            <li>resultados de consultas recentes, rascunhos do editor SQL, da conversa com a IA e de formulários;</li>
            <li>
              o rascunho do formulário de conexão que estiver a preencher, <strong>incluindo a password da base</strong>;
            </li>
            <li>o histórico e as variáveis do testador de APIs.</li>
          </UL>
          <P>
            A password da sua conta {LEGAL.serviceName} não é guardada no browser. Estes dados ficam até limpar os dados
            do site no browser — <strong>evite usar a plataforma em computadores partilhados</strong>.
          </P>
        </>
      ),
    },
    {
      id: "publicidade",
      title: "Publicidade",
      content: (
        <>
          <P>
            Mostramos anúncios do <strong>Google AdSense</strong> na página inicial, no login, no registo, na barra
            lateral da aplicação e na página do assistente de IA. O Google usa cookies e recebe informação técnica da
            visita (endereço IP, browser, página visitada) para mostrar e medir anúncios, que podem ser personalizados.
          </P>
          <P>
            O Google não recebe os dados das suas bases nem o conteúdo das suas consultas. Pode gerir a personalização em{" "}
            <a className="text-blue-700 underline" href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              adssettings.google.com
            </a>{" "}
            e saber mais em{" "}
            <a className="text-blue-700 underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              policies.google.com/technologies/ads
            </a>
            .
          </P>
        </>
      ),
    },
    {
      id: "finalidades",
      title: "Para que usamos os dados",
      content: (
        <UL>
          <li>
            <strong>Prestar o serviço que pediu</strong> (execução do contrato): conta, conexões, consultas, backups,
            ficheiros, IA.
          </li>
          <li>
            <strong>Segurança</strong> (interesse legítimo): proteger contas, prevenir abusos, investigar incidentes.
          </li>
          <li>
            <strong>Manter e melhorar a plataforma</strong> (interesse legítimo): diagnóstico de erros e métricas de
            utilização.
          </li>
          <li>
            <strong>Publicidade</strong>: financiar o plano gratuito com os anúncios descritos acima.
          </li>
          <li>
            <strong>Cumprir obrigações legais</strong> e responder a pedidos de autoridades competentes.
          </li>
        </UL>
      ),
    },
    {
      id: "acesso",
      title: "Quem tem acesso",
      content: (
        <>
          <UL>
            <li>
              <strong>Você</strong> e os utilizadores com quem partilhar conexões, no nível que escolher (leitura,
              escrita ou gestão).
            </li>
            <li>
              <strong>Administradores da plataforma</strong>, para suporte, segurança e operação.
            </li>
            <li>
              <strong>Prestadores de serviços:</strong> Google (assistente de IA e publicidade) e a infraestrutura de
              alojamento onde correm os nossos servidores.
            </li>
            <li>
              <strong>Autoridades</strong>, quando a lei o exigir.
            </li>
          </UL>
          <P>
            <strong>Não vendemos nem alugamos dados pessoais.</strong>
          </P>
        </>
      ),
    },
    {
      id: "localizacao",
      title: "Onde ficam os dados",
      content: (
        <P>
          Os servidores da aplicação, da base de dados e do armazenamento ficam em <Info value={LEGAL.hostingLocation} />.
          A Google trata dados em servidores próprios, incluindo fora de Angola. Ao usar o assistente de IA e ao ver
          anúncios, há transferência de dados para esses servidores.
        </P>
      ),
    },
    {
      id: "retencao",
      title: "Durante quanto tempo guardamos",
      content: (
        <>
          <Table
            head={["Dados", "Prazo"]}
            rows={[
              ["Conta", "Enquanto a conta existir (ver “Eliminar a conta” abaixo)."],
              ["Sessões", "7 dias; ficam registadas como terminadas."],
              ["Histórico de consultas", "Sem eliminação automática — até o apagar ou pedir a eliminação."],
              ["Backups e ficheiros de restauro", "Sem eliminação automática — até pedir a eliminação."],
              ["Datasets importados e cache de OCR", "Sem eliminação automática — até pedir a eliminação."],
              ["Registos técnicos", "Sem eliminação automática."],
              ["Ficheiros no armazenamento", "Até os eliminar."],
              ["Conversas com a IA", "Até eliminar a conversa."],
              ["Caches temporárias", "De segundos a cerca de 2 dias, conforme o tipo."],
              ["Relatórios gerados", "Cerca de 1 dia."],
            ]}
          />
          <H3>Eliminar a conta</H3>
          <P>
            Em Conta, a opção de eliminar a conta <strong>desativa-a</strong> e termina todas as sessões, mas os dados
            são mantidos (permite reativar). Para <strong>apagar definitivamente</strong> a conta e os dados associados
            (conexões, histórico, backups, ficheiros), envie o pedido para <Info value={LEGAL.contactEmail} />.
          </P>
        </>
      ),
    },
    {
      id: "seguranca",
      title: "Como protegemos os dados",
      content: (
        <>
          <UL>
            <li>Passwords de conta com hash bcrypt; credenciais das conexões cifradas com AES-256-GCM.</li>
            <li>Ligações cifradas (HTTPS) e cookies de sessão inacessíveis a scripts da página.</li>
            <li>Limite de tentativas de login; permissões por função e por conexão.</li>
          </UL>
          <P>
            Também dizemos o que ainda não fazemos: <strong>os ficheiros de backup, os ficheiros carregados e a cache de
            OCR não são cifrados individualmente pela aplicação</strong>, e não há autenticação em dois passos. Nenhum
            sistema é totalmente seguro; se houver uma violação que afete os seus dados, informamo-lo e às autoridades,
            nos termos da lei.
          </P>
        </>
      ),
    },
    {
      id: "direitos",
      title: "Os seus direitos",
      content: (
        <>
          <UL>
            <li>
              <strong>Acesso e portabilidade:</strong> em Conta pode exportar o perfil, as preferências, a lista de
              conexões (sem credenciais), projetos, tarefas e as últimas 500 consultas. Para uma cópia completa, peça-nos.
            </li>
            <li>
              <strong>Retificação:</strong> altere o perfil e os dados da empresa na aplicação; o email, por pedido.
            </li>
            <li>
              <strong>Eliminação e oposição:</strong> por pedido para <Info value={LEGAL.contactEmail} />.
            </li>
            <li>
              <strong>Reclamação:</strong> junto da Agência de Protecção de Dados (APD) de Angola.
            </li>
          </UL>
          <P>
            Respondemos a pedidos no prazo legal. Os pedidos sobre dados de terceiros que estão nas suas bases devem ser
            tratados pela sua organização, que é a responsável por esses dados — ajudamos no que for preciso.
          </P>
        </>
      ),
    },
    {
      id: "menores",
      title: "Menores",
      content: <P>O {LEGAL.serviceName} destina-se a uso profissional por maiores de 18 anos.</P>,
    },
    {
      id: "alteracoes",
      title: "Alterações a esta política",
      content: (
        <P>
          Se mudarmos a forma como tratamos dados, atualizamos esta página e a data no topo. Alterações relevantes são
          comunicadas na plataforma antes de entrarem em vigor. Veja também os{" "}
          <Link href="/auth/termos" className="text-blue-700 underline">
            Termos de Serviço
          </Link>
          .
        </P>
      ),
    },
    {
      id: "contacto",
      title: "Contacto",
      content: (
        <P>
          <Info value={LEGAL.entityName} /> · <Info value={LEGAL.address} /> · <Info value={LEGAL.contactEmail} />
        </P>
      ),
    },
  ],
};
