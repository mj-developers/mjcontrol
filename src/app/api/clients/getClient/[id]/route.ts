// src/app/api/clients/getClient/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

type Params = { id: string };

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

export async function GET(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  // 👇 OBLIGATORIO: await params
  const { id } = await params;
  const idStr = typeof id === "string" ? id : "";

  if (!idStr) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${BASE}/clients/getClient/${encodeURIComponent(idStr)}`,
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
