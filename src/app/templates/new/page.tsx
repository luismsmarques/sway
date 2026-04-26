import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TemplateType = "PRIVATE" | "GROUP";

const typeStyles: Record<TemplateType, string> = {
  PRIVATE: "bg-sky-50 text-sky-700 ring-sky-200",
  GROUP: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function NewTemplatePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:p-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Solo-Flow</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Criar Template
          </h1>
          <p className="text-sm text-muted-foreground">
            Define um molde de aula para poderes criar slots em segundos.
          </p>
        </header>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Dados do Template
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Preenche os campos para criar um molde reutilizavel.
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-slate-700"
              >
                Nome do template
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Ex.: Aula Surf 90min"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Tipo de sessão</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["PRIVATE", "GROUP"] as const).map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      defaultChecked={type === "PRIVATE"}
                      className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-300"
                    />
                    {type === "PRIVATE" ? "Privada" : "Grupo"}
                    <Badge className={`ml-auto ${typeStyles[type]}`} variant="outline">
                      {type === "PRIVATE" ? "1:1" : "Turma"}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label
                  htmlFor="duration_mins"
                  className="text-sm font-medium text-slate-700"
                >
                  Duração (min)
                </label>
                <Input
                  id="duration_mins"
                  name="duration_mins"
                  type="number"
                  min={15}
                  step={15}
                  defaultValue={60}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="capacity"
                  className="text-sm font-medium text-slate-700"
                >
                  Capacidade
                </label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="price"
                  className="text-sm font-medium text-slate-700"
                >
                  Preço (EUR)
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={0}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-sky-600 text-white hover:bg-sky-700"
              >
                Guardar Template
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
