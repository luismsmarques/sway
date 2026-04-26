"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
        <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acede ao teu dashboard de instrutor.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
          <button
            disabled={loading}
            className="h-11 w-full rounded-xl bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-70"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Ainda nao tens conta?{" "}
          <Link href="/auth/register" className="font-medium text-sky-700">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
