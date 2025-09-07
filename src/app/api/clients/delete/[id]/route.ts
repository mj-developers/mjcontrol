// src/app/api/clients/delete/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

export async function DELETE(
  req: NextRequest,
  context: { params: Record<string, string | string[]> }
) {
  // Normaliza el parámetro id (puede venir como string o string[])
  const raw = context?.params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${BASE}/clients/delete/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { ...authHeaders(req) },
      }
    );

    // Algunos backends devuelven 204 sin cuerpo; otros devuelven JSON
    const body = await readUpstream(upstream);

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(body ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
