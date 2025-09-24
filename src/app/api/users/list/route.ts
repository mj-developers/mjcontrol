import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? process.env.BACKEND_URL ?? "";

export async function GET(req: NextRequest) {
  if (!BASE) {
    return NextResponse.json(
      { error: "BACKEND_URL no configurado" },
      { status: 500 }
    );
  }

  // Pasamos tal cual los query params a tu backend: name, status, rol, page, rowsPerPage
  const inUrl = new URL(req.url);
  const qs = inUrl.searchParams.toString();
  const upstreamUrl = `${BASE}/users/list${qs ? `?${qs}` : ""}`;

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const text = await upstream.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  // Intentamos sacar el total de varias formas (cubrimos varios backends posibles)
  const headerTotal =
    upstream.headers.get("x-total-count") ??
    upstream.headers.get("X-Total-Count");
  let total: number | null = headerTotal ? Number(headerTotal) : null;

  // Si tu backend devuelve { data, total } lo usamos; si devuelve un array, lo dejamos en data.
  let data: unknown[] = [];
  if (Array.isArray(body)) {
    data = body;
  } else if (body && typeof body === "object") {
    const r = body as Record<string, unknown>;
    if (Array.isArray(r.data)) data = r.data as unknown[];
    else if (Array.isArray(r.users)) data = r.users as unknown[];
    if (typeof r.total === "number") total = r.total as number;
    if (typeof r.count === "number" && total == null) total = r.count as number;
  }

  // Si no tenemos total, devolvemos null; el front hace fallback mostrando data.length solo como *último recurso*.
  const out = { data, total };

  return NextResponse.json(out, { status: upstream.status });
}
