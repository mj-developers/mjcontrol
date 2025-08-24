export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Datos de ejemplo (luego conectamos a la API).
      </p>

      <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="rounded-xl border p-4 bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
          Usuarios: 42
        </div>
        <div className="rounded-xl border p-4 bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
          Clientes: 18
        </div>
        <div className="rounded-xl border p-4 bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
          Aplicaciones: 9
        </div>
        <div className="rounded-xl border p-4 bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
          Licencias por vencer: 3
        </div>
      </div>
    </div>
  );
}
