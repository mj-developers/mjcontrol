// src/app/api/users/delete/[id]/route.ts
import { NextResponse } from "next/server";

type Ctx = { params?: { id?: string } };

export async function DELETE(_req: Request, ctx: unknown) {
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
    `${base}/users/delete/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: { "Content-Type": "application/json" } }
  );

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      json ?? { error: upstream.statusText || "Error eliminando usuario" },
      { status: upstream.status }
    );
  }

  return NextResponse.json(json ?? { ok: true });
}
