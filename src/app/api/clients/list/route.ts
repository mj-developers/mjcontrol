import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream } from "../_lib";

/**
 * Reenvía q, offset, limit y cualquier otro query param al upstream.
 * Devuelve el cuerpo tal cual (para conservar `total`, `meta`, etc.).
 */
export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.search || "";
    const upstream = await fetch(`${BASE}/clients/list${qs}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(req),
      },
      cache: "no-store",
    });

    const body = await readUpstream(upstream);
    return NextResponse.json(body ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
