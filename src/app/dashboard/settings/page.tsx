"use client";

import { ChangeEvent, FormEvent, useEffect, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createTemplateSettingsAction,
  deleteTemplateSettingsAction,
  getSettingsDataAction,
  updateProfileSettingsAction,
  updateTemplateSettingsAction,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TEMPLATE_BADGE_STYLES } from "@/components/ui/dashboard/status-tokens";
import { uiButton, uiShell } from "@/components/ui/dashboard/ui-tokens";
import { MobileAppHeader } from "@/components/ui/mobile-app-header";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { MobileSkeletonCard } from "@/components/ui/mobile-skeleton";

type SettingsTemplate = {
  id: string;
  title: string;
  type: "PRIVATE" | "GROUP";
  durationMins: number;
  capacity: number;
  price: number;
};

type SettingsData = {
  profile: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
    bio: string;
    instagramUrl: string;
    websiteUrl: string;
  };
  templates: SettingsTemplate[];
};

type EditableTemplate = {
  id: string;
  title: string;
  type: "PRIVATE" | "GROUP";
  durationMins: string;
  capacity: string;
  price: string;
};

const emptyNewTemplate: Omit<EditableTemplate, "id"> = {
  title: "",
  type: "PRIVATE",
  durationMins: "60",
  capacity: "1",
  price: "0",
};

function toEditable(template: SettingsTemplate): EditableTemplate {
  return {
    id: template.id,
    title: template.title,
    type: template.type,
    durationMins: String(template.durationMins),
    capacity: String(template.capacity),
    price: String(template.price),
  };
}

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [templates, setTemplates] = useState<EditableTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState(emptyNewTemplate);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = (await getSettingsDataAction()) as SettingsData;
      setProfileId(data.profile.id);
      setName(data.profile.name);
      setSlug(data.profile.slug);
      setBio(data.profile.bio);
      setInstagramUrl(data.profile.instagramUrl);
      setWebsiteUrl(data.profile.websiteUrl);
      setAvatarUrl(data.profile.avatarUrl);
      setTemplates(data.templates.map(toEditable));
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Falha ao carregar settings.";
      const isAuthError = rawMessage.trim() === "Sessao invalida. Inicia sessao novamente.";
      const message = isAuthError
        ? rawMessage
        : "Falha ao carregar settings. Verifica DATABASE_URL e sessao ativa.";
      setErrorMessage(message);
      if (isAuthError) {
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileId) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setIsAvatarUploading(true);

    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${profileId}/${Date.now()}.${extension}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      setIsAvatarUploading(false);
      setErrorMessage("Faltam variaveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });

    if (uploadError) {
      setIsAvatarUploading(false);
      setErrorMessage(
        "Falha no upload. Confirma se o bucket `avatars` existe no Supabase Storage.",
      );
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setIsAvatarUploading(false);
    setFeedback("Avatar carregado. Guarda para aplicar ao perfil.");
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateProfileSettingsAction({
          name,
          bio,
          instagramUrl,
          websiteUrl,
          avatarUrl,
        });
        setFeedback("Perfil atualizado com sucesso.");
        await load();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Falha ao guardar perfil.");
      }
    });
  };

  const saveTemplate = (template: EditableTemplate) => {
    setErrorMessage(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateTemplateSettingsAction({
          templateId: template.id,
          title: template.title,
          type: template.type,
          durationMins: Number(template.durationMins),
          capacity: Number(template.capacity),
          price: Number(template.price),
        });
        setFeedback("Template atualizado.");
        await load();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Falha ao atualizar template.");
      }
    });
  };

  const deleteTemplate = (templateId: string) => {
    setErrorMessage(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await deleteTemplateSettingsAction({ templateId });
        setFeedback("Template removido.");
        await load();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Falha ao remover template.");
      }
    });
  };

  const createTemplate = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await createTemplateSettingsAction({
          title: newTemplate.title,
          type: newTemplate.type,
          durationMins: Number(newTemplate.durationMins),
          capacity: Number(newTemplate.capacity),
          price: Number(newTemplate.price),
        });
        setFeedback("Template criado com sucesso.");
        setNewTemplate(emptyNewTemplate);
        await load();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Falha ao criar template.");
      }
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pb-24">
        <MobileAppHeader title="Settings" />
        <section className={`${uiShell.page}`}>
          <MobileSkeletonCard />
        </section>
        <MobileBottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-24">
      <MobileAppHeader title="Settings" />
      <section className={`${uiShell.page} space-y-4 py-4`}>
        <Card className={uiShell.card}>
          <CardHeader>
            <p className={uiShell.eyebrow}>Dashboard Settings</p>
            <CardTitle className={uiShell.sectionTitle}>Perfil e branding do instrutor</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Link publico: /book/{slug}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={
                    avatarUrl ??
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop"
                  }
                  alt={name || "Avatar"}
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Avatar</label>
                  <Input type="file" accept="image/*" onChange={onAvatarChange} />
                  <p className="text-xs text-slate-500">Upload para bucket `avatars` no Supabase.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome publico</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Instagram URL</label>
                  <Input
                    value={instagramUrl}
                    onChange={(event) => setInstagramUrl(event.target.value)}
                    placeholder="https://instagram.com/teuperfil"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Website URL</label>
                <Input
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://teusite.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  placeholder="Uma descricao curta para a tua pagina publica."
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || isAvatarUploading} className={uiButton.primary}>
                  {isPending ? "A guardar..." : "Guardar perfil"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className={uiShell.card}>
          <CardHeader>
            <CardTitle className={uiShell.sectionTitle}>Templates</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Edita preco, duracao, capacidade e tipo das tuas aulas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="outline" className={TEMPLATE_BADGE_STYLES[template.type]}>
                    {template.type === "GROUP" ? "Grupo" : "Privada"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveTemplate(template)}
                      disabled={isPending}
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteTemplate(template.id)}
                      disabled={isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <Input
                    value={template.title}
                    onChange={(event) =>
                      setTemplates((prev) =>
                        prev.map((item) =>
                          item.id === template.id ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Nome"
                    className="md:col-span-2"
                  />
                  <select
                    value={template.type}
                    onChange={(event) =>
                      setTemplates((prev) =>
                        prev.map((item) =>
                          item.id === template.id
                            ? { ...item, type: event.target.value as "PRIVATE" | "GROUP" }
                            : item,
                        ),
                      )
                    }
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    <option value="PRIVATE">Privada</option>
                    <option value="GROUP">Grupo</option>
                  </select>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={template.durationMins}
                    onChange={(event) =>
                      setTemplates((prev) =>
                        prev.map((item) =>
                          item.id === template.id
                            ? { ...item, durationMins: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Duracao"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={template.price}
                    onChange={(event) =>
                      setTemplates((prev) =>
                        prev.map((item) =>
                          item.id === template.id ? { ...item, price: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Preco"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={template.capacity}
                    onChange={(event) =>
                      setTemplates((prev) =>
                        prev.map((item) =>
                          item.id === template.id
                            ? { ...item, capacity: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Capacidade"
                  />
                </div>
              </div>
            ))}

            <form onSubmit={createTemplate} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">Novo template</p>
              <div className="grid gap-3 md:grid-cols-5">
                <Input
                  required
                  value={newTemplate.title}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Nome"
                  className="md:col-span-2"
                />
                <select
                  value={newTemplate.type}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      type: event.target.value as "PRIVATE" | "GROUP",
                    }))
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                >
                  <option value="PRIVATE">Privada</option>
                  <option value="GROUP">Grupo</option>
                </select>
                <Input
                  required
                  type="number"
                  min={15}
                  step={15}
                  value={newTemplate.durationMins}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({ ...prev, durationMins: event.target.value }))
                  }
                  placeholder="Duracao"
                />
                <Input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={newTemplate.price}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({ ...prev, price: event.target.value }))
                  }
                  placeholder="Preco"
                />
                <Input
                  required
                  type="number"
                  min={1}
                  value={newTemplate.capacity}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({ ...prev, capacity: event.target.value }))
                  }
                  placeholder="Capacidade"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={isPending} className={uiButton.primary}>
                  Criar template
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {feedback ? <p className="text-sm font-medium text-emerald-700">{feedback}</p> : null}
        {errorMessage ? <p className="text-sm font-medium text-rose-700">{errorMessage}</p> : null}
      </section>
      <MobileBottomNav />
    </main>
  );
}
