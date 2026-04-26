type TemplateType = "PRIVATE" | "GROUP";

const typeStyles: Record<TemplateType, string> = {
  PRIVATE: "border-sky-200 bg-sky-50 text-sky-700",
  GROUP: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function NewTemplatePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 md:p-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-slate-500">Solo-Flow</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Criar Template
          </h1>
          <p className="text-sm text-slate-600">
            Define um molde de aula para poderes criar slots em segundos.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 md:p-8">
          <form className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-slate-700"
              >
                Nome do template
              </label>
              <input
                id="title"
                name="title"
                placeholder="Ex.: Aula Surf 90min"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Tipo de sessão</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["PRIVATE", "GROUP"] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${typeStyles[type]}`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      defaultChecked={type === "PRIVATE"}
                      className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-300"
                    />
                    {type === "PRIVATE" ? "Privada" : "Grupo"}
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
                <input
                  id="duration_mins"
                  name="duration_mins"
                  type="number"
                  min={15}
                  step={15}
                  defaultValue={60}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="capacity"
                  className="text-sm font-medium text-slate-700"
                >
                  Capacidade
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="price"
                  className="text-sm font-medium text-slate-700"
                >
                  Preço (EUR)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={0}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                Guardar Template
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
