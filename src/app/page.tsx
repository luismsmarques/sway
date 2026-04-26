import Link from "next/link";
import { CalendarPlus2, Users, BellRing, Star } from "lucide-react";

const features = [
  {
    title: "Pinta a tua Agenda",
    description:
      "Cria slots em segundos e adapta o teu dia ao clima, energia e disponibilidade real.",
    icon: CalendarPlus2,
  },
  {
    title: "Gestao de Grupos e Privadas",
    description:
      "Combina aulas 1:1 e de grupo no mesmo feed, com capacidade e lotacao sempre visiveis.",
    icon: Users,
  },
  {
    title: "Notificacoes Automaticas",
    description:
      "Mantem os alunos informados em alteracoes de horario sem trabalho manual repetitivo.",
    icon: BellRing,
  },
];

const testimonials = [
  {
    quote:
      "Finalmente deixei de gerir reservas no WhatsApp. Agora tenho tudo organizado em 1 minuto por dia.",
    author: "Joao, Surf Coach",
  },
  {
    quote:
      "O sistema de grupos e privadas no mesmo sitio poupou-me horas por semana.",
    author: "Rita, Yoga Instructor",
  },
  {
    quote:
      "A pagina de reserva e tao simples que os alunos marcam sem me mandar mensagens.",
    author: "Miguel, Personal Trainer",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-700">
          Solo-Flow
        </p>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              A agenda que se adapta ao teu flow.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
              Para instrutores de Surf, Yoga e PTs que querem menos tempo no
              WhatsApp e mais tempo no mar ou no tapete.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Comecar Agora Gratuitamente
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Ja tenho conta
              </Link>
            </div>
          </div>

          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="mx-auto w-full max-w-xs rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reserva rapida
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  Aula Surf 90min
                </h3>
                <p className="mt-1 text-sm text-slate-600">Apenas 3 vagas disponiveis</p>
                <button className="mt-4 h-10 w-full rounded-xl bg-sky-500 text-sm font-semibold text-white">
                  Reservar
                </button>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              Mockup da pagina de reserva no telemovel.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Tudo o que precisas para gerir reservas sem friccao
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
            >
              <feature.icon className="h-5 w-5 text-sky-600" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Instrutores em modo flow
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.author}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
            >
              <div className="flex items-center gap-1 text-sky-600">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <p className="mt-3 text-sm text-slate-700">"{item.quote}"</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.author}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pb-24">
        <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Pronto para trocar caos por flow?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Cria a tua conta gratuita e comeca hoje a gerir reservas de forma
            profissional.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Comecar Agora Gratuitamente
          </Link>
        </div>
      </section>
    </main>
  );
}
