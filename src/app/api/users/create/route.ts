// src/app/api/users/create/route.ts
import { NextResponse } from "next/server";

type CreateUserBody = {
  login: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: number;
  role_id?: number | string;
  roleId?: number | string;
  role?: { id?: number | string } | null;
};

function toNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: Request) {
  const base = process.env.API_BASE_URL ?? process.env.BACKEND_URL;
  if (!base) {
    return NextResponse.json(
      { error: "API_BASE_URL no está definida" },
      { status: 500 }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const b = (raw ?? {}) as Partial<CreateUserBody>;

  // recoger role id de cualquiera de las 3 formas
  const rid =
    toNumber(b.role_id) ||
    toNumber(b.roleId) ||
    (b.role ? toNumber(b.role.id) : NaN);

  if (!Number.isFinite(rid)) {
    return NextResponse.json({ error: "role_id inválido" }, { status: 400 });
  }

  // cuerpo que entiende el upstream (enviamos las 3 variantes por compatibilidad)
  const upstreamBody = {
    login: b.login ?? "",
    password: b.password ?? "",
    email: b.email ?? "",
    firstName: b.firstName ?? "",
    lastName: b.lastName ?? "",
    status: typeof b.status === "number" ? b.status : 1,
    role_id: rid,
    roleId: rid,
    role: { id: rid },
  };

  const upstream = await fetch(`${base}/users/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upstreamBody),
    cache: "no-store",
  });

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      json ?? { error: upstream.statusText || "Error creando usuario" },
      { status: upstream.status }
    );
  }

  return NextResponse.json(json ?? { ok: true });
}
