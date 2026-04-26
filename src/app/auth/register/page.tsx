"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          slug,
        },
      },
    });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data.session) {
      setSuccessMessage(
        "Conta criada. Verifica o teu email para confirmar o registo e depois faz login.",
      );
      router.replace("/login");
      router.refresh();
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
        <h1 className="text-2xl font-semibold text-slate-900">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Regista-te para criares e gerires os teus slots.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Nome completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Slug publico (ex: joao-surf)"
            value={slug}
            onChange={(event) =>
              setSlug(
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "")
                  .replace(/--+/g, "-"),
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
            required
          />
          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
          ) : null}
          <button
            disabled={loading}
            className="h-11 w-full rounded-xl bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-70"
          >
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Ja tens conta?{" "}
          <Link href="/login" className="font-medium text-sky-700">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
