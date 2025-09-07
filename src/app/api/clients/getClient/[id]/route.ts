// src/app/api/clients/getClient/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

type Ctx = { params?: { id?: string } };

/** Puente tipado: Request → NextRequest sin usar `any` */
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

export async function GET(req: Request, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${BASE}/clients/getClient/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: headersFrom(req),
        cache: "no-store",
      }
    );

    const body = await readUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        body ?? { error: upstream.statusText || "upstream" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(body ?? null, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
