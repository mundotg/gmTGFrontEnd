import React from "react";
import Link from "next/link";
import { LEGAL } from "./legalInfo";
import { Info, LegalDoc, Note, P, Table, UL } from "./LegalDocument";

/*
 * Termos de Serviço — descrevem o que a plataforma faz de facto, com destaque
 * para o que pode surpreender (alterações às bases do cliente, restauros que
 * substituem dados, ferramentas de teste de segurança, IA, publicidade).
 */
export const termos: LegalDoc = {
  title: "Termos de Serviço",
  intro: (
    <P>
      Estes termos regulam a utilização do {LEGAL.serviceName}, uma plataforma para ligar, consultar, gerir,
      transferir e fazer cópias de segurança de bases de dados. Ao criar conta, aceita-os. Leia também a{" "}
      <Link href="/auth/privacidade" className="text-blue-700 underline">
        Política de Privacidade
      </Link>
      , que explica que dados tratamos.
    </P>
  ),
  summary: [
    <>
      A plataforma <strong>executa comandos reais nas suas bases</strong> — pode alterar e apagar dados e estruturas.
      Use um utilizador de base de dados com as permissões mínimas e mantenha backups próprios.
    </>,
    <>Um restauro substitui dados. Os backups da plataforma são uma conveniência, não uma garantia.</>,
    <>As ferramentas de teste de segurança só podem ser usadas em sistemas seus ou com autorização escrita.</>,
    <>As respostas da IA podem estar erradas: reveja antes de executar.</>,
    <>O serviço é fornecido “tal como está”, sem garantia de disponibilidade, e inclui publicidade.</>,
  ],
  sections: [
    {
      id: "aceitacao",
      title: "Quem somos e aceitação",
      content: (
        <>
          <P>
            O {LEGAL.serviceName} é prestado por <Info value={LEGAL.entityName} />, NIF <Info value={LEGAL.nif} />, com
            sede em <Info value={LEGAL.address} />.
          </P>
          <P>
            Para criar conta tem de ter pelo menos 18 anos. Se cria a conta em nome de uma organização, declara que tem
            poderes para a vincular a estes termos.
          </P>
        </>
      ),
    },
    {
      id: "servico",
      title: "O serviço",
      content: (
        <>
          <P>Consoante o plano e as permissões da sua conta, a plataforma permite:</P>
          <UL>
            <li>ligar bases PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, SQLite e MongoDB;</li>
            <li>explorar estruturas, consultar dados, editar linhas e alterar tabelas;</li>
            <li>executar SQL num editor, gerar dados de teste e analisar resultados;</li>
            <li>transferir dados entre bases, fazer backups e restauros;</li>
            <li>monitorizar bloqueios e terminar sessões da base;</li>
            <li>guardar ficheiros, extrair texto de documentos (OCR) e importar datasets;</li>
            <li>testar a segurança e o desempenho de APIs e conversar com um assistente de IA.</li>
          </UL>
          <P>Podemos acrescentar, alterar ou retirar funcionalidades. Mudanças relevantes são avisadas na plataforma.</P>
        </>
      ),
    },
    {
      id: "conta",
      title: "A sua conta",
      content: (
        <UL>
          <li>Os dados que indicar no registo têm de ser verdadeiros e estar atualizados.</li>
          <li>
            É responsável por manter a password segura e por tudo o que for feito com a sua conta. Avise-nos logo que
            suspeite de uso indevido.
          </li>
          <li>
            As permissões de cada conta são definidas por função. Uma conta nova pode precisar que um administrador lhe
            atribua permissões antes de usar certas funcionalidades.
          </li>
          <li>
            Ao partilhar uma conexão com outro utilizador, essa pessoa passa a ter acesso às credenciais dessa conexão e
            pode agir sobre a base conforme o nível que lhe der. Partilhe só com quem confia.
          </li>
        </UL>
      ),
    },
    {
      id: "seus-dados",
      title: "As suas bases e os seus dados",
      content: (
        <>
          <UL>
            <li>
              Os dados das bases que liga continuam a ser seus ou da sua organização. Não adquirimos qualquer direito
              sobre eles; tratamo-los apenas para executar o que pede.
            </li>
            <li>
              Declara que tem autorização para ligar cada base de dados à plataforma e para aceder aos dados que ela
              contém.
            </li>
            <li>
              Se as suas bases tiverem dados pessoais de terceiros, a sua organização é a responsável por esse tratamento
              e por ter fundamento legal para ele.
            </li>
          </UL>
        </>
      ),
    },
    {
      id: "operacoes",
      title: "Operações que alteram as suas bases",
      content: (
        <>
          <Note>
            <strong>Importante:</strong> a plataforma executa comandos reais nas suas bases, com o utilizador de base de
            dados que configurar. O que for alterado ou apagado não pode ser desfeito por nós.
          </Note>
          <Table
            head={["Ação", "O que acontece na sua base"]}
            rows={[
              ["Editar, inserir ou eliminar linhas", "Os dados são alterados ou apagados de imediato."],
              ["Editor SQL", "Executa qualquer comando que escrever, incluindo UPDATE, DELETE, DROP e ALTER."],
              ["Alterar tabelas e colunas", "A estrutura da base muda; pode haver perda de dados."],
              ["Gerar dados de teste", "São inseridas linhas fictícias nas tabelas escolhidas."],
              ["Transferência entre bases", "São escritos dados na base de destino."],
              ["Restauro de backup", "Os dados do backup substituem ou juntam-se aos da base de destino."],
              ["Monitor de bloqueios", "Pode terminar sessões ativas, interrompendo operações em curso."],
            ]}
          />
          <P>Para usar estas funcionalidades com segurança, recomendamos:</P>
          <UL>
            <li>criar um utilizador de base de dados dedicado, com as permissões mínimas necessárias;</li>
            <li>experimentar primeiro num ambiente de testes e não em produção;</li>
            <li>manter backups próprios, independentes da plataforma.</li>
          </UL>
        </>
      ),
    },
    {
      id: "backups",
      title: "Backups",
      content: (
        <UL>
          <li>
            Os backups feitos na plataforma ficam guardados nos nossos servidores e podem ser descarregados. São uma
            conveniência: <strong>não garantimos</strong> que existam, estejam completos ou possam ser restaurados em
            todas as situações.
          </li>
          <li>Descarregue e guarde os backups de que precisa. Não dependa só da plataforma para os conservar.</li>
          <li>Antes de restaurar, confirme a base de destino: o restauro substitui dados.</li>
        </UL>
      ),
    },
    {
      id: "seguranca",
      title: "Ferramentas de teste de segurança",
      content: (
        <>
          <P>
            As ferramentas de teste de login, carga e APIs enviam muitos pedidos a partir dos nossos servidores e podem
            afetar o sistema testado.
          </P>
          <UL>
            <li>
              Só pode testar sistemas que sejam seus ou para os quais tenha <strong>autorização escrita</strong> do
              proprietário.
            </li>
            <li>As ferramentas só funcionam contra servidores autorizados na plataforma.</li>
            <li>
              Usá-las contra terceiros sem autorização é proibido e pode ser crime. Nesse caso, suspendemos a conta e
              colaboramos com as autoridades.
            </li>
          </UL>
        </>
      ),
    },
    {
      id: "ia",
      title: "Assistente de inteligência artificial",
      content: (
        <UL>
          <li>
            As respostas são geradas automaticamente e <strong>podem estar erradas ou incompletas</strong>. Reveja
            qualquer SQL ou sugestão antes de o executar.
          </li>
          <li>
            O que escrever na conversa é enviado à Google (Gemini) para gerar a resposta. Não inclua passwords nem dados
            pessoais de terceiros.
          </li>
        </UL>
      ),
    },
    {
      id: "uso-aceitavel",
      title: "Uso aceitável",
      content: (
        <>
          <P>Não pode usar a plataforma para:</P>
          <UL>
            <li>aceder a bases, sistemas ou dados sem autorização;</li>
            <li>tratar dados em violação da lei, incluindo a legislação de proteção de dados;</li>
            <li>guardar ou distribuir conteúdo ilegal, malware ou material que viole direitos de terceiros;</li>
            <li>tentar contornar limites, permissões ou medidas de segurança da plataforma;</li>
            <li>sobrecarregar a plataforma ou usá-la para atacar terceiros;</li>
            <li>revender o acesso sem acordo escrito connosco.</li>
          </UL>
        </>
      ),
    },
    {
      id: "planos",
      title: "Planos e limites",
      content: (
        <>
          <Table
            head={["Plano", "Armazenamento", "Pedidos por dia"]}
            rows={[
              ["Free", "100 MB", "1 000"],
              ["Pro", "10 GB", "999 999"],
              ["Enterprise", "1 TB", "9 999 999"],
            ]}
          />
          <P>
            As contas novas começam no plano Free. Os limites aplicam-se atualmente ao armazenamento de ficheiros.
            Preços e condições de pagamento dos planos pagos, quando existirem, são comunicados antes da adesão.
            Podemos rever os limites, com aviso prévio.
          </P>
        </>
      ),
    },
    {
      id: "publicidade",
      title: "Publicidade",
      content: (
        <P>
          O serviço mostra anúncios do Google AdSense em várias páginas, incluindo dentro da aplicação. Os detalhes estão
          na{" "}
          <Link href="/auth/privacidade#publicidade" className="text-blue-700 underline">
            Política de Privacidade
          </Link>
          .
        </P>
      ),
    },
    {
      id: "propriedade",
      title: "Propriedade intelectual",
      content: (
        <P>
          A plataforma, o código, a marca e o design pertencem a <Info value={LEGAL.entityName} />. Concedemos-lhe o
          direito de usar o serviço, pessoal e intransmissível, enquanto a conta estiver ativa e respeitar estes termos.
          O conteúdo que criar (consultas, ficheiros, relatórios) continua a ser seu.
        </P>
      ),
    },
    {
      id: "disponibilidade",
      title: "Disponibilidade e garantias",
      content: (
        <P>
          O serviço é fornecido “tal como está” e “conforme disponível”. Esforçamo-nos por mantê-lo a funcionar, mas não
          garantimos que esteja sempre disponível, livre de erros ou adequado a um fim específico. Podem existir
          interrupções para manutenção, que tentamos avisar com antecedência.
        </P>
      ),
    },
    {
      id: "responsabilidade",
      title: "Limitação de responsabilidade",
      content: (
        <>
          <P>Na medida máxima permitida por lei, não somos responsáveis por:</P>
          <UL>
            <li>perda ou alteração de dados resultante de operações que executar ou autorizar na plataforma;</li>
            <li>respostas incorretas do assistente de IA;</li>
            <li>danos indiretos, lucros cessantes ou perda de oportunidades de negócio;</li>
            <li>falhas de serviços de terceiros (alojamento, Google, redes de comunicação).</li>
          </UL>
          <P>Nada nestes termos exclui responsabilidade que a lei não permita excluir, como em caso de dolo.</P>
        </>
      ),
    },
    {
      id: "encerramento",
      title: "Suspensão e encerramento",
      content: (
        <UL>
          <li>Pode desativar a conta a qualquer momento, em Conta, ou pedir a eliminação definitiva dos dados.</li>
          <li>
            Podemos suspender ou encerrar contas que violem estes termos ou a lei, ou que ponham em risco a plataforma ou
            terceiros. Sempre que possível, avisamos antes.
          </li>
          <li>
            O que acontece aos dados depois está descrito na{" "}
            <Link href="/auth/privacidade#retencao" className="text-blue-700 underline">
              Política de Privacidade
            </Link>
            .
          </li>
        </UL>
      ),
    },
    {
      id: "alteracoes",
      title: "Alterações aos termos",
      content: (
        <P>
          Podemos alterar estes termos. Avisamos na plataforma antes de alterações relevantes entrarem em vigor.
          Continuar a usar o serviço depois disso significa aceitar a nova versão. Se não concordar, pode encerrar a
          conta.
        </P>
      ),
    },
    {
      id: "lei",
      title: "Lei aplicável e litígios",
      content: (
        <P>
          Estes termos regem-se pela lei da República de Angola. Para qualquer litígio é competente o foro da{" "}
          <Info value={LEGAL.jurisdiction} />, sem prejuízo de normas legais imperativas em contrário.
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
