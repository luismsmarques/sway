import Link from "next/link";

const benefits = [
  "Simplicidade total: cria slots em segundos.",
  "Hibrido nativo: gere 1:1 e grupos no mesmo painel.",
  "Notificacoes automaticas para reagendamentos e alteracoes.",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-700">
          Solo-Flow
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          A agenda para quem vive no flow.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
          O motor de reservas para instrutores independentes que precisam de
          velocidade: pinta a agenda, abre slots e recebe reservas em poucos
          cliques.
        </p>

        <div className="mt-8 grid gap-3 md:max-w-2xl">
          {benefits.map((benefit) => (
            <article
              key={benefit}
              className="rounded-2xl bg-white px-5 py-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/70"
            >
              {benefit}
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/register"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Comecar Agora Gratuitamente
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ja tenho conta
          </Link>
        </div>
      </section>
    </main>
  );
}
