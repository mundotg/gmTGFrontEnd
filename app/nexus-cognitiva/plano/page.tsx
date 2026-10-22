"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Brain,
  Compass,
  BookOpen,
  Users,
  ShieldCheck,
  Rocket,
  Heart,
  MessageCircle,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Target,
  GraduationCap,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

type Section = {
  id: number;
  category: string;
  title: string;
  intro: string;
  icon: React.ElementType;
  points: { title: string; description: string }[];
};

export default function NexusPlanoPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const sections: Section[] = useMemo(
    () => [
      {
        id: 1,
        category: "A ideia",
        title: "Conhecimento que desperta curiosidade",
        intro:
          "O Nexus Cognitiva é um espaço para descobrir ideias, aprender algo novo e explorar o mundo com outros olhos. Queremos aproximar o conhecimento das pessoas, com conteúdos interessantes, claros e úteis para o dia a dia.",
        icon: Brain,
        points: [
          {
            title: "Aprender sem complicações",
            description:
              "Conteúdos explicados de forma acessível, para que qualquer pessoa possa acompanhar e aprender ao seu ritmo.",
          },
          {
            title: "Descobrir diferentes perspetivas",
            description:
              "Da ciência à tecnologia, da cultura ao comportamento humano, há sempre algo novo para explorar.",
          },
          {
            title: "Curiosidade com responsabilidade",
            description:
              "Distinguir factos, opiniões e experiências ajuda cada pessoa a compreender melhor aquilo que lê.",
          },
        ],
      },
      {
        id: 2,
        category: "O que vais encontrar",
        title: "Um universo de ideias à tua espera",
        intro:
          "O Nexus Cognitiva pretende reunir diferentes formas de conhecimento num só lugar, para que cada visita seja uma oportunidade de aprender, refletir ou encontrar inspiração.",
        icon: Compass,
        points: [
          {
            title: "Ciência e tecnologia",
            description:
              "Descobre explicações, avanços e ideias que ajudam a compreender o mundo e o futuro.",
          },
          {
            title: "Curiosidades e descobertas",
            description:
              "Encontra respostas surpreendentes para perguntas que talvez nunca tenhas pensado fazer.",
          },
          {
            title: "Experiências e percursos pessoais",
            description:
              "Aprende com histórias, desafios e lições partilhadas por outras pessoas.",
          },
          {
            title: "Ideias e reflexão",
            description:
              "Explora opiniões e diferentes pontos de vista com abertura, respeito e espírito crítico.",
          },
        ],
      },
      {
        id: 3,
        category: "Descoberta",
        title: "Encontra conteúdos que combinam contigo",
        intro:
          "Cada pessoa tem interesses e perguntas diferentes. A experiência do Nexus Cognitiva será pensada para tornar a descoberta simples e agradável.",
        icon: Search,
        points: [
          {
            title: "Pesquisa simples",
            description:
              "Procura temas, palavras ou assuntos que despertam a tua curiosidade.",
          },
          {
            title: "Categorias para explorar",
            description:
              "Navega por áreas de interesse e descobre conteúdos relacionados com aquilo de que gostas.",
          },
          {
            title: "Guarda o que te inspira",
            description:
              "A ideia é poderes guardar publicações interessantes para regressar a elas quando quiseres.",
          },
        ],
      },
      {
        id: 4,
        category: "Comunidade",
        title: "O conhecimento cresce quando é partilhado",
        intro:
          "Queremos criar um espaço onde as pessoas possam aprender umas com as outras, trocar ideias e contribuir para conversas construtivas.",
        icon: Users,
        points: [
          {
            title: "Partilha as tuas ideias",
            description:
              "Contribui com conhecimentos, descobertas e experiências que possam ser úteis a outras pessoas.",
          },
          {
            title: "Conversa com respeito",
            description:
              "Os comentários e as discussões devem acolher diferentes opiniões sem ataques pessoais.",
          },
          {
            title: "Aprende em conjunto",
            description:
              "Perguntas, respostas e perspetivas diferentes podem transformar uma leitura numa aprendizagem maior.",
          },
        ],
      },
      {
        id: 5,
        category: "Confiança",
        title: "Informação clara, com respeito por quem lê",
        intro:
          "A confiança é essencial num espaço dedicado ao conhecimento. Queremos que seja fácil perceber que tipo de conteúdo estás a consultar e avaliar a informação com espírito crítico.",
        icon: ShieldCheck,
        points: [
          {
            title: "Contexto transparente",
            description:
              "Conteúdos científicos, curiosidades, opiniões e experiências pessoais devem ser apresentados de forma distinta.",
          },
          {
            title: "Fontes que ajudam a aprofundar",
            description:
              "Sempre que existam referências, estas devem ajudar-te a explorar o tema e a procurar informação adicional.",
          },
          {
            title: "Um ambiente mais seguro",
            description:
              "A comunidade deve promover o respeito, a responsabilidade e a possibilidade de sinalizar conteúdos inadequados.",
          },
        ],
      },
      {
        id: 6,
        category: "O caminho",
        title: "Estamos a construir esta experiência contigo",
        intro:
          "O Nexus Cognitiva quer crescer com base nas necessidades reais da comunidade. O objetivo é lançar uma experiência útil, ouvir quem a utiliza e melhorá-la continuamente.",
        icon: Rocket,
        points: [
          {
            title: "Começar pelo essencial",
            description:
              "Dar prioridade à leitura, à descoberta de conteúdos e a uma experiência simples em diferentes dispositivos.",
          },
          {
            title: "Ouvir a comunidade",
            description:
              "As sugestões e opiniões dos utilizadores ajudam-nos a perceber o que funciona e o que merece ser melhorado.",
          },
          {
            title: "Evoluir com propósito",
            description:
              "Novas funcionalidades serão consideradas de acordo com a sua utilidade e o valor que acrescentam à comunidade.",
          },
        ],
      },
    ],
    []
  );

  const filteredSections = sections.filter((section) => {
    const query = searchQuery.trim().toLocaleLowerCase("pt");
    if (!query) return true;
    const searchable = [
      section.category,
      section.title,
      section.intro,
      ...section.points.flatMap((point) => [point.title, point.description]),
    ]
      .join(" ")
      .toLocaleLowerCase("pt");
    return searchable.includes(query);
  });

  const toggleSection = (id: number) => {
    setExpandedSections((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8 sm:py-12 font-interface">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/nexus-cognitiva"
          className="inline-flex items-center gap-2 rounded-xl border border-[#DCE3EA] bg-white px-3 py-2 text-sm font-semibold text-[#14283F] shadow-xs transition hover:border-[#087E8B] dark:border-[#1E2D5A] dark:bg-[#111D3D] dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 text-[#087E8B]" />
          <span>{t("nexus.backToFeed") || "Voltar ao Nexus"}</span>
        </Link>
        <span className="hidden items-center gap-2 text-sm text-slate-500 sm:inline-flex dark:text-slate-400">
          <Heart className="h-4 w-4 text-[#087E8B]" />
          Feito para pessoas curiosas
        </span>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[#DCE3EA] bg-white p-7 shadow-xs sm:p-12 dark:border-[#1E2D5A] dark:bg-[#111D3D]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#087E8B]/10 blur-3xl" />
        <div className="relative max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#087E8B]/20 bg-[#087E8B]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#087E8B] dark:text-teal-300">
            <Sparkles className="h-4 w-4" />
            Um espaço para descobrir e aprender
          </div>
          <h1 className="font-editorial text-4xl font-bold leading-tight tracking-tight text-[#14283F] sm:text-6xl dark:text-white">
            NEXUS <span className="text-[#087E8B] dark:text-teal-400">COGNITIVA</span>
          </h1>
          <p className="max-w-2xl text-xl font-semibold leading-relaxed text-[#087E8B] dark:text-teal-300">
            A tua curiosidade pode levar-te mais longe.
          </p>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            Um espaço dedicado a ideias, descobertas e experiências que ampliam a forma como vemos o mundo. Explora temas, aprende algo novo e partilha aquilo que sabes com uma comunidade curiosa.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="/nexus-cognitiva"
              className="inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#066873]"
            >
              <Compass className="h-4 w-4" />
              Explorar conteúdos
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE3EA] px-5 py-3 text-sm font-bold text-[#14283F] transition hover:border-[#087E8B] dark:border-[#334466] dark:text-slate-200"
            >
              Conhecer o projeto
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: "Aprende",
            text: "Explicações, descobertas e novas perspetivas para alimentar a tua curiosidade.",
          },
          {
            icon: Lightbulb,
            title: "Descobre",
            text: "Explora assuntos diferentes e encontra ideias que talvez ainda não conheças.",
          },
          {
            icon: MessageCircle,
            title: "Partilha",
            text: "Contribui com as tuas experiências e aprende com a comunidade.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[#DCE3EA] bg-white p-5 dark:border-[#1E2D5A] dark:bg-[#111D3D]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-300">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-[#14283F] dark:text-white">{item.title}</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
          </article>
        ))}
      </section>

      <section id="como-funciona" className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#087E8B]">O que nos move</p>
          <h2 className="font-editorial text-2xl font-bold text-[#14283F] sm:text-3xl dark:text-white">
            Mais do que ler. É descobrir novas formas de pensar.
          </h2>
          <p className="text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
            Conhece a visão do Nexus Cognitiva, os temas que queremos aproximar de ti e a comunidade que estamos a construir.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="O que gostarias de descobrir?"
            aria-label="Pesquisar neste plano"
            className="w-full rounded-xl border border-[#DCE3EA] bg-white py-3 pl-11 pr-4 text-sm text-[#14283F] outline-none transition focus:border-[#087E8B] dark:border-[#1E2D5A] dark:bg-[#0B132B] dark:text-white"
          />
        </div>

        <div className="space-y-3">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = Boolean(expandedSections[section.id]) || Boolean(searchQuery.trim());
            return (
              <article
                key={section.id}
                className="overflow-hidden rounded-2xl border border-[#DCE3EA] bg-white shadow-xs dark:border-[#1E2D5A] dark:bg-[#111D3D]"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-[#162447]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wider text-[#087E8B] dark:text-teal-300">
                        {section.category}
                      </span>
                      <span className="mt-1 block font-editorial text-base font-bold text-[#14283F] sm:text-lg dark:text-white">
                        {section.title}
                      </span>
                    </span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-5 border-t border-[#DCE3EA] bg-slate-50/70 p-5 dark:border-[#1E2D5A] dark:bg-[#0B132B]/40">
                    <p className="max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {section.intro}
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {section.points.map((point) => (
                        <div
                          key={point.title}
                          className="rounded-xl border border-[#DCE3EA] bg-white p-4 dark:border-[#1E2D5A] dark:bg-[#111D3D]"
                        >
                          <h3 className="mb-1.5 flex items-start gap-2 text-sm font-bold text-[#14283F] dark:text-white">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#087E8B]" />
                            {point.title}
                          </h3>
                          <p className="pl-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {point.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {filteredSections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#DCE3EA] p-8 text-center dark:border-[#1E2D5A]">
              <Search className="mx-auto mb-3 h-7 w-7 text-slate-400" />
              <p className="font-semibold text-[#14283F] dark:text-white">Não encontrámos esse tema.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Experimenta outra palavra para continuares a explorar.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-[#10243A] p-7 text-white sm:p-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
              <GraduationCap className="h-5 w-5" />
              O próximo passo começa com uma pergunta
            </div>
            <h2 className="font-editorial text-2xl font-bold sm:text-3xl">
              A tua próxima descoberta pode começar hoje.
            </h2>
            <p className="text-sm leading-6 text-slate-300 sm:text-base">
              Visita o Nexus Cognitiva, explora os conteúdos disponíveis e acompanha a evolução deste espaço de aprendizagem e partilha.
            </p>
          </div>
          <Link
            href="/nexus-cognitiva"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#10243A] transition hover:bg-teal-50 md:self-center"
          >
            Começar a explorar
            <Target className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="pb-2 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        Nexus Cognitiva · Um projeto de conhecimento e descoberta do ecossistema MustInfo.
      </footer>
    </main>
  );
}
