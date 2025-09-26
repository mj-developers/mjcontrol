// src/app/api/users/getUser/[id]/route.ts
import { NextResponse } from "next/server";

type Params = { id: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
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
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const text = await upstream.text().catch(() => "");
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text };
  }

  if (!upstream.ok) {
    return NextResponse.json(
      (body as Record<string, unknown>) ?? {
        error: upstream.statusText || "Error obteniendo usuario",
      },
      { status: upstream.status }
    );
  }

  return NextResponse.json(body ?? {});
}
