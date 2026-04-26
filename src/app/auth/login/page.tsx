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
import { MobileAppHeader } from "@/components/ui/mobile-app-header";

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
    <main className="min-h-screen bg-slate-50 py-6">
      <MobileAppHeader title="Entrar" showBackButton />
      <Card className="mx-auto mt-4 max-w-md border border-slate-100 bg-white px-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Entrar</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Acede ao teu dashboard de instrutor.
          </CardDescription>
        </CardHeader>
        <CardContent>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="h-11 text-[17px]"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="h-11 text-[17px]"
            required
          />
          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}
          <Button
            disabled={loading}
            className="h-12 w-full bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-70 active:scale-95 transition-transform"
          >
            {loading ? "A entrar..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Ainda nao tens conta?{" "}
          <Link href="/register" className="font-medium text-sky-700">
            Criar conta
          </Link>
        </p>
        </CardContent>
      </Card>
    </main>
  );
}
