import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.BACKEND_URL ?? "";

export async function proxyJson(
  req: NextRequest,
  path: string,
  init?: RequestInit
) {
  if (!BASE) {
    return NextResponse.json(
      { error: "BACKEND_URL no configurado" },
      { status: 500 }
    );
  }

  const url = `${BASE}${path}`;
  const fwdHeaders = new Headers(init?.headers);

  if (!fwdHeaders.has("Content-Type")) {
    fwdHeaders.set("Content-Type", "application/json");
  }

  // Reenvía cookies de sesión si tu backend las usa
  const cookie = req.headers.get("cookie");
  if (cookie) fwdHeaders.set("cookie", cookie);

  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: fwdHeaders,
    body: init?.body,
    cache: "no-store",
  });

  // Devuelve siempre JSON (aunque venga texto)
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  return NextResponse.json(body, { status: res.status });
}
