// src/app/api/clients/delete/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;

  if (!id) {
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

    // Si el upstream devuelve 204 sin cuerpo, propagamos tal cual
    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // En otros casos intentamos leer el cuerpo (JSON o texto)
    const body = await readUpstream(upstream);
    return NextResponse.json(body ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
