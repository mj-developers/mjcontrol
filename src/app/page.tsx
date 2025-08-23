export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
      <p className="text-sm text-zinc-400">
        Datos de ejemplo (luego conectamos a la API).
      </p>

      <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          Usuarios: 42
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          Clientes: 18
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          Aplicaciones: 9
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          Licencias por vencer: 3
        </div>
      </div>

      <div className="mt-6">
        <a href="/logout" className="text-sm underline cursor-pointer">
          Cerrar sesión
        </a>
      </div>
    </div>
  );
}
