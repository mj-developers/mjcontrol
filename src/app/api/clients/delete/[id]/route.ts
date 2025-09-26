// src/app/api/clients/delete/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

type Ctx = { params?: { id?: string } };

/** Puente tipado: convierte Request → NextRequest sin usar `any` */
function headersFrom(req: Request): HeadersInit {
  try {
    return authHeaders(req as unknown as NextRequest);
  } catch {
    return {};
  }
}

export async function DELETE(req: Request, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${BASE}/clients/delete/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { ...headersFrom(req) },
        cache: "no-store",
      }
    );

    // Algunos backends devuelven 204 sin cuerpo
    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const body = await readUpstream(upstream);
    return NextResponse.json(body ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
