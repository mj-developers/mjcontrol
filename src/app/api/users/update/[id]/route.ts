// src/app/api/users/update/[id]/route.ts
import { NextResponse } from "next/server";

type Ctx = { params?: { id?: string } };

export async function PUT(req: Request, ctx: unknown) {
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

  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(
    `${base}/users/update/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      json ?? { error: upstream.statusText || "Error actualizando usuario" },
      { status: upstream.status }
    );
  }

  return NextResponse.json(json ?? { ok: true });
}
