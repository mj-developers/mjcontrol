// src/app/api/clients/update/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

type Ctx = { params?: { id?: string } };

/** Construye cabeceras sin usar `any` y compatible con `authHeaders` */
function headersFrom(req: Request): HeadersInit {
  try {
    return {
      "Content-Type": "application/json",
      ...authHeaders(req as unknown as NextRequest),
    };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

export async function PUT(req: Request, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const payload = await req.json().catch(() => ({}));

    const upstream = await fetch(
      `${BASE}/clients/update/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: headersFrom(req),
        body: JSON.stringify(payload ?? {}),
      }
    );

    const body = await readUpstream(upstream);
    return NextResponse.json(body ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
