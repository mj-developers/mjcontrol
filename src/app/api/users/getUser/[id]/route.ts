// src/app/api/users/getUser/[id]/route.ts
import { NextResponse } from "next/server";

type Ctx = { params?: { id?: string } };

export async function GET(_req: Request, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const base = process.env.API_BASE_URL ?? process.env.BACKEND_URL;
  if (!base) {
    return NextResponse.json(
      { error: "API_BASE_URL no está definida" },
      { status: 500 }
    );
  }

  const upstream = await fetch(
    `${base}/users/getUser/${encodeURIComponent(id)}`,
    { headers: { "Content-Type": "application/json" } }
  );

  const body = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      body ?? { error: upstream.statusText || "Error obteniendo usuario" },
      { status: upstream.status }
    );
  }

  return NextResponse.json(body ?? {});
}
