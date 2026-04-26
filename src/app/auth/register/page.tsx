"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <Card className="mx-auto max-w-md bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Criar conta</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Regista-te para criares e gerires os teus slots.
          </CardDescription>
        </CardHeader>
        <CardContent>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            type="text"
            placeholder="Nome completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            className="h-10"
            required
          />
          <Input
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
            className="h-10"
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="h-10"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className="h-10"
            required
          />
          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
          ) : null}
          <Button
            disabled={loading}
            className="h-10 w-full bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-70"
          >
            {loading ? "A criar conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Ja tens conta?{" "}
          <Link href="/login" className="font-medium text-sky-700">
            Entrar
          </Link>
        </p>
        </CardContent>
      </Card>
    </main>
  );
}
