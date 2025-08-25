// src/app/api/users/delete/[id]/route.ts
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const base = process.env.API_BASE_URL ?? process.env.BACKEND_URL;
  if (!base) {
    return NextResponse.json(
      { error: "API_BASE_URL no está definida" },
      { status: 500 }
    );
  }

  const upstream = await fetch(
    `${base}/users/delete/${encodeURIComponent(ctx.params.id)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  const body = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      body ?? { error: upstream.statusText || "Error eliminando usuario" },
      { status: upstream.status }
    );
  }

  return NextResponse.json(body ?? { ok: true });
}
